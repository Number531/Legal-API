/**
 * Integration tests for Concurrent Tool Calls
 * Tests how the server handles simultaneous tool calls, rate limiting, and caching.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EnhancedLegalMcpServer } from '../../src/server/EnhancedLegalMcpServer.js';
import { rateLimiterConfigs } from '../../src/config/apiConfig.js';

// Mock the MCP SDK Server and StdioServerTransport
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn(),
  })),
}));
jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn(),
}));

// Mock all API clients to control their responses and track calls
jest.mock('../../src/api-clients/CourtListenerClient.js', () => ({
  CourtListenerClient: jest.fn(() => ({
    searchCases: jest.fn(),
  })),
}));
jest.mock('../../src/api-clients/SecEdgarClient.js', () => ({
  SecEdgarClient: jest.fn(() => ({
    searchSECFilings: jest.fn(),
  })),
}));
jest.mock('../../src/api-clients/FederalRegisterClient.js', () => ({
  FederalRegisterClient: jest.fn(() => ({
    searchFederalRegister: jest.fn(),
  })),
}));
jest.mock('../../src/api-clients/UsptoClient.js', () => ({
  UsptoClient: jest.fn(() => ({
    searchPatents: jest.fn(),
  })),
}));

// Mock the cache utilities to control caching behavior
jest.mock('../../src/utils/cache.js', () => ({
  startCacheCleanup: jest.fn(),
  getCacheKey: jest.fn((endpoint, params) => `${endpoint}:${JSON.stringify(params)}`),
  getFromCache: jest.fn(), // Default to no cache hit
  setCache: jest.fn(),
}));

// Import actual modules after mocks
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CourtListenerClient } from '../../src/api-clients/CourtListenerClient.js';
import { SecEdgarClient } from '../../src/api-clients/SecEdgarClient.js';
import { FederalRegisterClient } from '../../src/api-clients/FederalRegisterClient.js';
import { UsptoClient } from '../../src/api-clients/UsptoClient.js';
import { getFromCache, setCache } from '../../src/utils/cache.js';

describe('Concurrent Tool Calls', () => {
  let serverInstance;
  let callToolHandler;
  let mockCourtListenerSearchCases;
  let mockSecEdgarSearchFilings;
  let mockFederalRegisterSearch;
  let mockUsptoSearchPatents;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COURTLISTENER_API_TOKEN = 'test-token'; // Required for server init

    // Reset rate limiter internal state for each test
    for (const limiter of Object.values(rateLimiterConfigs)) {
      limiter.requests = [];
      limiter.enforce.mockClear(); // Clear mock calls
    }

    serverInstance = new EnhancedLegalMcpServer();
    callToolHandler = Server.mock.results[0].value.setRequestHandler.mock.calls[1][1];

    // Capture mock client methods
    mockCourtListenerSearchCases = CourtListenerClient.mock.results[0].value.searchCases;
    mockSecEdgarSearchFilings = SecEdgarClient.mock.results[0].value.searchSECFilings;
    mockFederalRegisterSearch = FederalRegisterClient.mock.results[0].value.searchFederalRegister;
    mockUsptoSearchPatents = UsptoClient.mock.results[0].value.searchPatents;

    // Default mock responses
    mockCourtListenerSearchCases.mockResolvedValue({ content: [{ type: 'text', text: 'CL Result' }] });
    mockSecEdgarSearchFilings.mockResolvedValue({ content: [{ type: 'text', text: 'SEC Result' }] });
    mockFederalRegisterSearch.mockResolvedValue({ content: [{ type: 'text', text: 'FR Result' }] });
    mockUsptoSearchPatents.mockResolvedValue({ content: [{ type: 'text', text: 'USPTO Result' }] });
  });

  afterEach(() => {
    delete process.env.COURTLISTENER_API_TOKEN;
  });

  test('handles 10 simultaneous tool calls without immediate failure', async () => {
    const numCalls = 10;
    const promises = [];

    for (let i = 0; i < numCalls; i++) {
      promises.push(callToolHandler({
        params: {
          name: 'search_cases',
          arguments: { query: `query ${i}` },
        },
      }));
    }

    const results = await Promise.allSettled(promises);

    expect(results.every(r => r.status === 'fulfilled')).toBe(true);
    expect(mockCourtListenerSearchCases).toHaveBeenCalledTimes(numCalls);
    expect(rateLimiterConfigs.courtlistener.enforce).toHaveBeenCalledTimes(numCalls);
  });

  test('rate limiting works across concurrent requests (SEC: 9/sec)', async () => {
    const secLimiter = rateLimiterConfigs.sec_edgar;
    const originalEnforce = secLimiter.enforce; // Keep original enforce logic
    secLimiter.enforce = jest.fn(async () => {
      // Simulate actual rate limiting delay
      const now = Date.now();
      secLimiter.requests = secLimiter.requests.filter(time => now - time < 1000);
      if (secLimiter.requests.length >= 9) {
        const waitTime = 1000 - (now - secLimiter.requests[0]) + 10;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      secLimiter.requests.push(Date.now());
    });

    const numCalls = 15; // More than the 9/sec limit
    const promises = [];

    for (let i = 0; i < numCalls; i++) {
      promises.push(callToolHandler({
        params: {
          name: 'search_sec_filings',
          arguments: { company_identifier: `company${i}` },
        },
      }));
    }

    const startTime = Date.now();
    await Promise.allSettled(promises);
    const endTime = Date.now();

    // Expect more than 1 second to pass due to rate limiting
    expect(endTime - startTime).toBeGreaterThanOrEqual(Math.floor((numCalls - 1) / 9) * 1000);
    expect(mockSecEdgarSearchFilings).toHaveBeenCalledTimes(numCalls);
    expect(secLimiter.enforce).toHaveBeenCalledTimes(numCalls);

    // Restore original enforce
    secLimiter.enforce = originalEnforce;
  });

  test('cache prevents duplicate concurrent API calls', async () => {
    const commonArgs = { query: 'cached_query' };
    const mockToolResult = { content: [{ type: 'text', text: 'Cached Data' }] };

    // Mock getFromCache to return null initially, then mock setCache
    getFromCache.mockReturnValueOnce(null); // First call is a miss
    setCache.mockImplementationOnce((key, data) => {
      // Simulate caching the result
      getFromCache.mockReturnValue(data); // Subsequent calls hit cache
    });

    // Mock the actual client method to resolve after a delay, simulating API call
    mockCourtListenerSearchCases.mockImplementationOnce(() => {
      return new Promise(resolve => setTimeout(() => resolve(mockToolResult), 50));
    });

    const promises = [
      callToolHandler({ params: { name: 'search_cases', arguments: commonArgs } }),
      callToolHandler({ params: { name: 'search_cases', arguments: commonArgs } }),
      callToolHandler({ params: { name: 'search_cases', arguments: commonArgs } }),
    ];

    const results = await Promise.all(promises);

    expect(results.every(r => r.content[0].text === 'Cached Data')).toBe(true);
    expect(mockCourtListenerSearchCases).toHaveBeenCalledTimes(1); // Only one actual API call
    expect(getFromCache).toHaveBeenCalledTimes(3); // Each call attempts to get from cache
    expect(setCache).toHaveBeenCalledTimes(1); // Only one set to cache
  });

  test('different tools can run in parallel', async () => {
    const promises = [
      callToolHandler({ params: { name: 'search_cases', arguments: { query: 'cl' } } }),
      callToolHandler({ params: { name: 'search_sec_filings', arguments: { company_identifier: 'sec' } } }),
      callToolHandler({ params: { name: 'search_federal_register', arguments: { query: 'fr' } } }),
      callToolHandler({ params: { name: 'search_patents', arguments: { query_type: 'patents', search_text: 'uspto' } } }),
    ];

    const results = await Promise.allSettled(promises);

    expect(results.every(r => r.status === 'fulfilled')).toBe(true);
    expect(mockCourtListenerSearchCases).toHaveBeenCalledTimes(1);
    expect(mockSecEdgarSearchFilings).toHaveBeenCalledTimes(1);
    expect(mockFederalRegisterSearch).toHaveBeenCalledTimes(1);
    expect(mockUsptoSearchPatents).toHaveBeenCalledTimes(1);
  });
});