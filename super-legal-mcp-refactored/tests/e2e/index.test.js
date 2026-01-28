/**
 * End-to-end tests for the main index.js entry point
 * Simulates server startup and basic environment validation
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock dotenv/config to prevent it from loading .env in test environment
jest.mock('dotenv/config', () => ({}));

// Mock the EnhancedLegalMcpServer
jest.mock('../../src/server/EnhancedLegalMcpServer.js', () => ({
  EnhancedLegalMcpServer: jest.fn(() => ({
    run: jest.fn().mockResolvedValue(undefined),
    shutdown: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Import the main index.js after mocks are set up
const { EnhancedLegalMcpServer } = await import('../../src/server/EnhancedLegalMcpServer.js');

describe('index.js (E2E)', () => {
  let consoleErrorSpy;
  let processExitSpy;
  let originalEnv;

  beforeEach(() => {
    // Capture original environment variables
    originalEnv = { ...process.env };

    // Mock console.error to capture output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock process.exit to prevent tests from actually exiting
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original console and process.exit
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();

    // Restore original environment variables
    process.env = { ...originalEnv };
  });

  test('should start server successfully with all API keys configured', async () => {
    // Set all required and optional API keys
    process.env.COURTLISTENER_API_TOKEN = 'test_cl_token';
    process.env.USPTO_API_KEY = 'test_uspto_key';
    process.env.GOVINFO_API_KEY = 'test_govinfo_key';
    process.env.EXA_API_KEY = 'test_exa_key';

    // Dynamically import index.js to ensure mocks are applied
    await import('../../index.js');

    // Allow promises to resolve
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('✅ All API keys configured - full functionality available'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('🚀 Starting Enhanced Legal MCP Server v2.0.0...'));
    expect(EnhancedLegalMcpServer).toHaveBeenCalledTimes(1);
    expect(EnhancedLegalMcpServer.mock.results[0].value.run).toHaveBeenCalledTimes(1);
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  test('should log warnings for missing optional API keys but still start server', async () => {
    // Only set the critical API key
    process.env.COURTLISTENER_API_TOKEN = 'test_cl_token';
    delete process.env.USPTO_API_KEY;
    delete process.env.GOVINFO_API_KEY;
    delete process.env.EXA_API_KEY;

    await import('../../index.js');
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  Environment Warnings:'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('USPTO_API_KEY not set'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('GOVINFO_API_KEY not set'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('EXA_API_KEY not set'));
    expect(EnhancedLegalMcpServer).toHaveBeenCalledTimes(1);
    expect(EnhancedLegalMcpServer.mock.results[0].value.run).toHaveBeenCalledTimes(1);
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  test('should handle server startup failure', async () => {
    // Mock the server run method to throw an error
    EnhancedLegalMcpServer.mockImplementationOnce(() => ({
      run: jest.fn().mockRejectedValue(new Error('Server failed to bind')),
      shutdown: jest.fn(),
    }));

    process.env.COURTLISTENER_API_TOKEN = 'test_cl_token'; // Ensure env is valid for validation to pass

    await import('../../index.js');
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Failed to start Enhanced Legal MCP Server:'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Server failed to bind'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('should handle uncaught exceptions', async () => {
    // Temporarily remove the main() call from index.js to manually trigger exception
    // This is a bit tricky with ESM, so we'll simulate the event directly
    const mockError = new Error('Test Uncaught Exception');
    
    // Trigger the uncaughtException handler
    process.emit('uncaughtException', mockError);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Uncaught Exception:', mockError);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('should handle unhandled rejections', async () => {
    const mockReason = 'Test Unhandled Rejection Reason';
    const mockPromise = Promise.reject(mockReason); // Create a rejected promise

    // Trigger the unhandledRejection handler
    process.emit('unhandledRejection', mockReason, mockPromise);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled Rejection at:', mockPromise, 'reason:', mockReason);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('should call server shutdown on SIGINT', async () => {
    const mockShutdown = EnhancedLegalMcpServer.mock.results[0].value.shutdown;
    
    // Manually set serverInstance for signal handlers
    // This is a hack due to the way index.js exports and runs itself
    // In a real scenario, you'd refactor index.js to export the main function
    // and call it in tests, rather than relying on global process events.
    const server = new EnhancedLegalMcpServer();
    global.serverInstance = server; // Expose to the global scope for signal handlers

    process.emit('SIGINT');
    await new Promise(resolve => setTimeout(resolve, 10)); // Allow async handlers to run

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Received SIGINT, shutting down gracefully...'));
    expect(mockShutdown).toHaveBeenCalledTimes(1);
    expect(processExitSpy).toHaveBeenCalledWith(0);

    delete global.serverInstance; // Clean up global
  });

  test('should call server shutdown on SIGTERM', async () => {
    const mockShutdown = EnhancedLegalMcpServer.mock.results[0].value.shutdown;
    
    const server = new EnhancedLegalMcpServer();
    global.serverInstance = server;

    process.emit('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Received SIGTERM, shutting down gracefully...'));
    expect(mockShutdown).toHaveBeenCalledTimes(1);
    expect(processExitSpy).toHaveBeenCalledWith(0);

    delete global.serverInstance;
  });

  describe('Graceful Degradation', () => {
    let consoleErrorSpy;
    let originalEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // Ensure server is re-initialized for each test in this describe block
      jest.clearAllMocks();
      process.env.COURTLISTENER_API_TOKEN = 'test_cl_token'; // Base token for server to start
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      process.env = { ...originalEnv };
    });

    test('continues working when one optional API is down (simulated)', async () => {
      // Simulate USPTO API being down by making its client method reject
      const { UsptoClient } = await import('../../src/api-clients/UsptoClient.js');
      UsptoClient.mockImplementationOnce(() => ({
        searchPatents: jest.fn().mockRejectedValue(new Error('USPTO API is down')),
      }));

      // Re-import index.js to get the new mocked server instance
      const { EnhancedLegalMcpServer: MockedServer } = await import('../../src/server/EnhancedLegalMcpServer.js');
      const server = new MockedServer();
      server.run = jest.fn().mockResolvedValue(undefined); // Mock run to prevent actual connection
      server.setupToolHandlers(); // Manually set up handlers after mocking clients

      // Get the callToolHandler from the mocked server
      const callToolHandler = server.server.setRequestHandler.mock.calls[1][1];

      // Attempt to call a working tool (CourtListener)
      const clResult = await callToolHandler({ params: { name: 'search_cases', arguments: { query: 'test' } } });
      expect(clResult.content[0].text).toBe('CL Result'); // Assuming default mock response

      // Attempt to call the failing tool (USPTO)
      const usptoRequest = { params: { name: 'search_patents', arguments: { query_type: 'patents', search_text: 'test' } } };
      await expect(callToolHandler(usptoRequest)).rejects.toThrow(expect.stringContaining('USPTO API is down'));

      // Ensure other clients were still initialized and functional
      expect(UsptoClient).toHaveBeenCalledTimes(1); // Only called once for the failing mock
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error executing search_patents: USPTO API is down'));
    });

    test('provides helpful context when optional API key missing', async () => {
      delete process.env.USPTO_API_KEY; // Simulate missing key
      delete process.env.GOVINFO_API_KEY;
      delete process.env.EXA_API_KEY;

      // Re-import index.js to trigger environment validation
      await import('../../index.js');
      await new Promise(resolve => setTimeout(resolve, 10)); // Allow async logs

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  Environment Warnings:'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('USPTO_API_KEY not set - USPTO patent search will be unavailable'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('GOVINFO_API_KEY not set - US Code search will be unavailable'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('EXA_API_KEY not set - State statute search will be unavailable'));
    });

    test('caches work when APIs are down (conceptual test)', async () => {
      // This test relies on the cache mock in setup.js and concurrency.test.js
      // Here, we'll just ensure that if a tool is called twice, and the second time the underlying API is mocked to fail,
      // the cached result is still returned.

      const { CourtListenerClient } = await import('../../src/api-clients/CourtListenerClient.js');
      const { getFromCache, setCache } = await import('../../src/utils/cache.js');

      // Mock the client method to return a value for the first call
      CourtListenerClient.mockImplementationOnce(() => ({
        searchCases: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'Cached Result' }] }),
      }));

      // Re-initialize server to get the new mock client
      const { EnhancedLegalMcpServer: MockedServer } = await import('../../src/server/EnhancedLegalMcpServer.js');
      const server = new MockedServer();
      server.run = jest.fn().mockResolvedValue(undefined);
      server.setupToolHandlers();
      const callToolHandler = server.server.setRequestHandler.mock.calls[1][1];

      // First call: should hit API and cache
      const request1 = { params: { name: 'search_cases', arguments: { query: 'cache_test' } } };
      const result1 = await callToolHandler(request1);
      expect(result1.content[0].text).toBe('Cached Result');
      expect(CourtListenerClient.mock.results[0].value.searchCases).toHaveBeenCalledTimes(1);
      expect(setCache).toHaveBeenCalledTimes(1);

      // Now, make the underlying API call fail for subsequent calls
      CourtListenerClient.mock.results[0].value.searchCases.mockRejectedValue(new Error('API is down for cache test'));
      
      // Mock getFromCache to return the cached value for the second call
      getFromCache.mockReturnValueOnce({ content: [{ type: 'text', text: 'Cached Result' }] });

      // Second call: should hit cache and not call API
      const result2 = await callToolHandler(request1);
      expect(result2.content[0].text).toBe('Cached Result');
      expect(CourtListenerClient.mock.results[0].value.searchCases).toHaveBeenCalledTimes(1); // Still 1, as it was cached
      expect(getFromCache).toHaveBeenCalledTimes(2); // Called twice
    });
  });
});