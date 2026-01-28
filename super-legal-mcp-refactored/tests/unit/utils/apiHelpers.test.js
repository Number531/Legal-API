/**
 * Unit tests for API Helper utilities
 * Tests API request functions with mocked fetch and rate limiting
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  makeApiRequest,
  fetchAllPages,
  makePostRequest,
  fetchGovInfoContent,
  buildFederalRegisterParams,
  resolveToCIK,
  filterSECFilings,
  extractKeyFinancialFacts,
  getLatestFactValue
} from '../../../src/utils/apiHelpers.js';

// Mock the cache functions
jest.mock('../../../src/utils/cache.js', () => ({
  getCacheKey: jest.fn((endpoint, params) => `${endpoint}:${JSON.stringify(params)}`),
  getFromCache: jest.fn(() => null),
  setCache: jest.fn()
}));

describe('API Helper Utilities', () => {
  let mockFetch;
  let mockRateLimiter;

  beforeEach(() => {
    mockFetch = global.fetch;
    mockRateLimiter = {
      enforce: jest.fn().mockResolvedValue()
    };
    
    // Reset environment variables
    process.env.COURTLISTENER_API_TOKEN = 'test-token';
    process.env.GOVINFO_API_KEY = 'test-govinfo-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('makeApiRequest', () => {
    test('should make successful API request', async () => {
      const mockResponse = { data: 'test response' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await makeApiRequest('/test', { param: 'value' }, {
        apiType: 'courtlistener',
        rateLimiter: mockRateLimiter
      });

      expect(result).toEqual(mockResponse);
      expect(mockRateLimiter.enforce).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Authorization': 'Token test-token'
          })
        })
      );
    });

    test('should handle rate limiting with retry', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: { get: () => '2' } // Retry-After header
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' })
        });

      const result = await makeApiRequest('/test', {}, {
        apiType: 'courtlistener',
        rateLimiter: mockRateLimiter
      });

      expect(result).toEqual({ data: 'success' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(makeApiRequest('/test', {}, {
        apiType: 'courtlistener',
        maxRetries: 1
      })).rejects.toThrow('API request failed: 404 Not Found');
    });

    test('should handle network errors with retry', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' })
        });

      const result = await makeApiRequest('/test', {}, {
        apiType: 'courtlistener',
        maxRetries: 2
      });

      expect(result).toEqual({ data: 'success' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should use different API configurations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'sec response' })
      });

      await makeApiRequest('/test', {}, {
        apiType: 'sec_edgar',
        rateLimiter: mockRateLimiter
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('data.sec.gov'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('Enhanced-Legal-MCP')
          })
        })
      );
    });

    test('should handle unknown API type', async () => {
      await expect(makeApiRequest('/test', {}, {
        apiType: 'unknown_api'
      })).rejects.toThrow('Unknown API type: unknown_api');
    });

    test('should add query parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      });

      await makeApiRequest('/test', {
        param1: 'value1',
        param2: 123,
        param3: null,
        param4: undefined
      }, { apiType: 'courtlistener' });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('param1=value1');
      expect(calledUrl).toContain('param2=123');
      expect(calledUrl).not.toContain('param3');
      expect(calledUrl).not.toContain('param4');
    });
  });

  describe('fetchAllPages', () => {
    test('should fetch multiple pages', async () => {
      const page1 = {
        results: [{ id: 1 }, { id: 2 }],
        next: 'https://api.example.com/test?page=2'
      };
      const page2 = {
        results: [{ id: 3 }, { id: 4 }],
        next: null
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(page1)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(page2)
        });

      const results = await fetchAllPages('/test', {}, 5, 'courtlistener', mockRateLimiter);

      expect(results).toHaveLength(4);
      expect(results).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should respect maxPages limit', async () => {
      const pageResponse = {
        results: [{ id: 1 }],
        next: 'https://api.example.com/test?page=2'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(pageResponse)
      });

      const results = await fetchAllPages('/test', {}, 2, 'courtlistener', mockRateLimiter);

      expect(results).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should handle single page response', async () => {
      const response = {
        results: [{ id: 1 }, { id: 2 }],
        next: null
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response)
      });

      const results = await fetchAllPages('/test', {}, 5, 'courtlistener', mockRateLimiter);

      expect(results).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('makePostRequest', () => {
    test('should make successful POST request', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const body = { query: 'test' };
      const result = await makePostRequest('uspto_patents', '/search', body, mockRateLimiter);

      expect(result).toEqual(mockResponse);
      expect(mockRateLimiter.enforce).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/search'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('should handle POST request errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('{"error": "Bad request"}')
      });

      await expect(makePostRequest('uspto_patents', '/search', {}, mockRateLimiter))
        .rejects.toThrow('USPTO_PATENTS API error 400: Bad request');
    });

    test('should handle unknown API type in POST', async () => {
      await expect(makePostRequest('unknown_api', '/test', {}))
        .rejects.toThrow('Unknown API type: unknown_api');
    });
  });

  describe('fetchGovInfoContent', () => {
    test('should fetch content successfully', async () => {
      const mockContent = '<html><body>Test content</body></html>';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent)
      });

      const result = await fetchGovInfoContent('test-package', 'htm', mockRateLimiter);

      expect(result).toEqual({
        format: 'htm',
        content: mockContent,
        package_id: 'test-package'
      });
      expect(mockRateLimiter.enforce).toHaveBeenCalled();
    });

    test('should fallback to txt format when htm fails', async () => {
      const mockContent = 'Test content in text format';
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockContent)
        });

      const result = await fetchGovInfoContent('test-package', 'htm', mockRateLimiter);

      expect(result).toEqual({
        format: 'txt',
        content: mockContent,
        package_id: 'test-package'
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should throw error when API key is missing', async () => {
      delete process.env.GOVINFO_API_KEY;

      await expect(fetchGovInfoContent('test-package'))
        .rejects.toThrow('GovInfo API key not configured');
    });
  });

  describe('buildFederalRegisterParams', () => {
    test('should build basic query parameters', () => {
      const params = {
        query: 'test query',
        limit: 10
      };

      const result = buildFederalRegisterParams(params);

      expect(result.get('conditions[term]')).toBe('test query');
      expect(result.get('per_page')).toBe('10');
      expect(result.getAll('fields[]')).toContain('title');
      expect(result.getAll('fields[]')).toContain('publication_date');
    });

    test('should handle all parameter types', () => {
      const params = {
        query: 'test',
        agency: 'EPA',
        document_type: 'RULE',
        significant_only: true,
        date_range: '2023-01-01..2023-12-31',
        cfr_title: 40,
        limit: 50
      };

      const result = buildFederalRegisterParams(params);

      expect(result.get('conditions[term]')).toBe('test');
      expect(result.get('conditions[agencies][]')).toBe('EPA');
      expect(result.get('conditions[type][]')).toBe('RULE');
      expect(result.get('conditions[significant]')).toBe('1');
      expect(result.get('conditions[publication_date][gte]')).toBe('2023-01-01');
      expect(result.get('conditions[publication_date][lte]')).toBe('2023-12-31');
      expect(result.get('conditions[cfr][title]')).toBe('40');
      expect(result.get('per_page')).toBe('50');
    });

    test('should handle partial date ranges', () => {
      const params1 = { date_range: '2023-01-01..' };
      const result1 = buildFederalRegisterParams(params1);
      expect(result1.get('conditions[publication_date][gte]')).toBe('2023-01-01');
      expect(result1.get('conditions[publication_date][lte]')).toBeNull();

      const params2 = { date_range: '..2023-12-31' };
      const result2 = buildFederalRegisterParams(params2);
      expect(result2.get('conditions[publication_date][gte]')).toBe('');
      expect(result2.get('conditions[publication_date][lte]')).toBe('2023-12-31');
    });
  });

  describe('resolveToCIK', () => {
    test('should return CIK if already valid', async () => {
      const cik = '0001234567';
      const result = await resolveToCIK(cik);
      expect(result).toBe(cik);
    });

    test('should resolve ticker to CIK', async () => {
      const mockTickers = {
        0: { ticker: 'AAPL', title: 'Apple Inc.', cik_str: 320193 },
        1: { ticker: 'MSFT', title: 'Microsoft Corporation', cik_str: 789019 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTickers)
      });

      const result = await resolveToCIK('AAPL');
      expect(result).toBe('320193');
    });

    test('should resolve company name to CIK', async () => {
      const mockTickers = {
        0: { ticker: 'AAPL', title: 'Apple Inc.', cik_str: 320193 },
        1: { ticker: 'MSFT', title: 'Microsoft Corporation', cik_str: 789019 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTickers)
      });

      const result = await resolveToCIK('Apple');
      expect(result).toBe('320193');
    });

    test('should throw error for unknown company', async () => {
      const mockTickers = {
        0: { ticker: 'AAPL', title: 'Apple Inc.', cik_str: 320193 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTickers)
      });

      await expect(resolveToCIK('UNKNOWN'))
        .rejects.toThrow('Could not find company matching: UNKNOWN');
    });

    test('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(resolveToCIK('AAPL'))
        .rejects.toThrow('Failed to fetch company tickers: 500');
    });
  });

  describe('filterSECFilings', () => {
    const mockFilings = [
      { form: '10-K', filingDate: '2023-03-15' },
      { form: '10-Q', filingDate: '2023-06-15' },
      { form: '8-K', filingDate: '2023-09-15' },
      { form: '10-K', filingDate: '2023-12-15' }
    ];

    test('should filter by filing type', () => {
      const result = filterSECFilings(mockFilings, '10-K');
      expect(result).toHaveLength(2);
      expect(result.every(f => f.form === '10-K')).toBe(true);
    });

    test('should filter by date range', () => {
      const result = filterSECFilings(mockFilings, 'all', '2023-06-01', '2023-09-30');
      expect(result).toHaveLength(2);
      expect(result.every(f => f.filingDate >= '2023-06-01' && f.filingDate <= '2023-09-30')).toBe(true);
    });

    test('should filter by date after only', () => {
      const result = filterSECFilings(mockFilings, 'all', '2023-09-01');
      expect(result).toHaveLength(2);
      expect(result.every(f => f.filingDate >= '2023-09-01')).toBe(true);
    });

    test('should filter by date before only', () => {
      const result = filterSECFilings(mockFilings, 'all', null, '2023-06-30');
      expect(result).toHaveLength(2);
      expect(result.every(f => f.filingDate <= '2023-06-30')).toBe(true);
    });

    test('should return all filings when type is "all"', () => {
      const result = filterSECFilings(mockFilings, 'all');
      expect(result).toHaveLength(4);
    });

    test('should handle non-array input', () => {
      const result = filterSECFilings(null, '10-K');
      expect(result).toEqual([]);
    });

    test('should combine filters', () => {
      const result = filterSECFilings(mockFilings, '10-K', '2023-06-01');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ form: '10-K', filingDate: '2023-12-15' });
    });
  });

  describe('extractKeyFinancialFacts', () => {
    test('should extract key financial metrics', () => {
      const mockFacts = {
        facts: {
          'us-gaap': {
            Revenues: {
              units: {
                USD: [
                  { val: 1000000, end: '2023-12-31', form: '10-K' },
                  { val: 900000, end: '2022-12-31', form: '10-K' }
                ]
              }
            },
            NetIncomeLoss: {
              units: {
                USD: [
                  { val: 100000, end: '2023-12-31', form: '10-K' }
                ]
              }
            }
          }
        }
      };

      const result = extractKeyFinancialFacts(mockFacts);

      expect(result.revenue).toEqual({
        value: 1000000,
        period: '2023-12-31',
        form: '10-K'
      });
      expect(result.netIncome).toEqual({
        value: 100000,
        period: '2023-12-31',
        form: '10-K'
      });
    });

    test('should handle missing facts gracefully', () => {
      const mockFacts = { facts: {} };
      const result = extractKeyFinancialFacts(mockFacts);
      expect(result).toEqual({});
    });

    test('should handle malformed facts', () => {
      const mockFacts = { facts: { 'us-gaap': null } };
      const result = extractKeyFinancialFacts(mockFacts);
      expect(result).toEqual({});
    });
  });

  describe('getLatestFactValue', () => {
    test('should return latest fact value', () => {
      const mockFact = {
        units: {
          USD: [
            { val: 900000, end: '2022-12-31', form: '10-K' },
            { val: 1000000, end: '2023-12-31', form: '10-K' }
          ]
        }
      };

      const result = getLatestFactValue(mockFact);

      expect(result).toEqual({
        value: 1000000,
        period: '2023-12-31',
        form: '10-K'
      });
    });

    test('should handle empty units', () => {
      const mockFact = { units: {} };
      const result = getLatestFactValue(mockFact);
      expect(result).toBeNull();
    });

    test('should handle malformed fact', () => {
      const mockFact = null;
      const result = getLatestFactValue(mockFact);
      expect(result).toBeNull();
    });

    test('should handle empty values array', () => {
      const mockFact = {
        units: {
          USD: []
        }
      };

      const result = getLatestFactValue(mockFact);
      expect(result).toBeNull();
    });
  });
});