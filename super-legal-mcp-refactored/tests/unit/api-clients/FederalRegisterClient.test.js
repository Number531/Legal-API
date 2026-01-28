/**
 * Unit tests for Federal Register API Client
 * Tests Federal Register client methods with mocked dependencies
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FederalRegisterClient } from '../../../src/api-clients/FederalRegisterClient.js';

// Mock the API helpers
jest.mock('../../../src/utils/apiHelpers.js', () => ({
  makeApiRequest: jest.fn(),
  buildFederalRegisterParams: jest.fn()
}));

import { makeApiRequest, buildFederalRegisterParams } from '../../../src/utils/apiHelpers.js';

describe('FederalRegisterClient', () => {
  let client;
  let mockRateLimiter;

  beforeEach(() => {
    mockRateLimiter = {
      enforce: jest.fn().mockResolvedValue()
    };
    client = new FederalRegisterClient(mockRateLimiter);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with rate limiter', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
    });
  });

  describe('searchFederalRegister', () => {
    test('should search Federal Register successfully with basic query', async () => {
      const mockSearchParams = new URLSearchParams('conditions[term]=test&per_page=20');
      const mockResponse = {
        count: 1,
        results: [{
          title: 'Test Document',
          publication_date: '2023-01-01',
          type: 'RULE',
          agencies: [{ name: 'Test Agency', id: 1 }],
          abstract: 'Abstract text',
          significant: false,
          html_url: 'http://example.com/doc'
        }]
      };

      buildFederalRegisterParams.mockReturnValue(mockSearchParams);
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { query: 'test', limit: 20 };
      const result = await client.searchFederalRegister(args);

      expect(buildFederalRegisterParams).toHaveBeenCalledWith(args);
      expect(makeApiRequest).toHaveBeenCalledWith(
        `/documents.json?${mockSearchParams.toString()}`,
        {},
        expect.objectContaining({ apiType: 'federal_register', rateLimiter: mockRateLimiter })
      );
      expect(JSON.parse(result.content[0].text).count).toBe(1);
      expect(JSON.parse(result.content[0].text).results[0].title).toBe('Test Document');
    });

    test('should handle all search parameters', async () => {
      const args = {
        query: 'climate change',
        agency: 'EPA',
        document_type: 'NOTICE',
        significant_only: true,
        date_range: '2022-01-01..2022-12-31',
        cfr_title: 40,
        limit: 50
      };
      const mockSearchParams = new URLSearchParams('conditions[term]=climate+change&conditions[agencies][]=EPA&conditions[type][]=NOTICE&conditions[significant]=1&conditions[publication_date][gte]=2022-01-01&conditions[publication_date][lte]=2022-12-31&conditions[cfr][title]=40&per_page=50');
      const mockResponse = { count: 0, results: [] };

      buildFederalRegisterParams.mockReturnValue(mockSearchParams);
      makeApiRequest.mockResolvedValue(mockResponse);

      await client.searchFederalRegister(args);

      expect(buildFederalRegisterParams).toHaveBeenCalledWith(args);
      expect(makeApiRequest).toHaveBeenCalledWith(
        `/documents.json?${mockSearchParams.toString()}`,
        {},
        expect.objectContaining({ apiType: 'federal_register', rateLimiter: mockRateLimiter })
      );
    });

    test('should handle API errors', async () => {
      buildFederalRegisterParams.mockReturnValue(new URLSearchParams());
      makeApiRequest.mockRejectedValue(new Error('API is down'));

      await expect(client.searchFederalRegister({ query: 'error' }))
        .rejects.toThrow('Federal Register search failed: API is down');
    });

    test('should handle empty arguments', async () => {
      const mockSearchParams = new URLSearchParams('per_page=20');
      const mockResponse = { count: 0, results: [] };

      buildFederalRegisterParams.mockReturnValue(mockSearchParams);
      makeApiRequest.mockResolvedValue(mockResponse);

      const result = await client.searchFederalRegister();

      expect(buildFederalRegisterParams).toHaveBeenCalledWith({});
      expect(JSON.parse(result.content[0].text).count).toBe(0);
    });
  });
});