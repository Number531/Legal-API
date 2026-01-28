/**
 * Unit tests for SEC API Helper
 * Tests the makeSECApiRequest function for correct URL routing and headers
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { makeSECApiRequest } from '../../../src/utils/secApiHelper.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('SEC API Helper', () => {
  let mockRateLimiter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimiter = {
      enforce: jest.fn().mockResolvedValue()
    };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ test: 'data' })
    });
  });

  test('routes /company_tickers.json to www.sec.gov/files', async () => {
    await makeSECApiRequest('/company_tickers.json', mockRateLimiter);
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.sec.gov/files/company_tickers.json',
      expect.any(Object)
    );
  });
  
  test('routes /submissions/CIK*.json to data.sec.gov WITHOUT /api', async () => {
    await makeSECApiRequest('/submissions/CIK0000320193.json', mockRateLimiter);
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://data.sec.gov/submissions/CIK0000320193.json',
      expect.any(Object)
    );
  });
  
  test('routes /api/xbrl/companyfacts to data.sec.gov WITH /api', async () => {
    await makeSECApiRequest('/api/xbrl/companyfacts/CIK0000320193.json', mockRateLimiter);
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json',
      expect.any(Object)
    );
  });
  
  test('routes /xbrl/* paths by adding /api prefix', async () => {
    await makeSECApiRequest('/xbrl/companyfacts/CIK0000320193.json', mockRateLimiter);
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json',
      expect.any(Object)
    );
  });

  test('includes proper User-Agent header for all requests', async () => {
    await makeSECApiRequest('/test', mockRateLimiter);
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('Enhanced-Legal-MCP'),
          'Accept': 'application/json'
        })
      })
    );
  });

  test('handles API errors properly', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await expect(makeSECApiRequest('/invalid', mockRateLimiter))
      .rejects
      .toThrow('SEC API request failed: 404 Not Found for URL: https://data.sec.gov/api/invalid');
  });

  test('applies rate limiting', async () => {
    await makeSECApiRequest('/test', mockRateLimiter);
    expect(mockRateLimiter.enforce).toHaveBeenCalledTimes(1);
  });
});