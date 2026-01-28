/**
 * Unit tests for Exa API Client
 * Tests Exa client methods with mocked dependencies, including file system for config
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ExaClient } from '../../../src/api-clients/ExaClient.js';

// Mock the file system and path modules for config loading
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));
jest.mock('path', () => ({
  dirname: jest.fn(() => '/mock/path/to/src/api-clients'),
  join: jest.fn((...args) => args.join('/')),
}));
jest.mock('url', () => ({
  fileURLToPath: jest.fn(() => '/mock/path/to/src/api-clients/ExaClient.js'),
}));

// Mock the global fetch
global.fetch = jest.fn();

describe('ExaClient', () => {
  let client;
  let mockRateLimiter;
  let mockStateConfig;

  beforeEach(() => {
    mockRateLimiter = {
      enforce: jest.fn().mockResolvedValue()
    };

    mockStateConfig = {
      states: {
        'CA': {
          name: 'California',
          statute_base_urls: ['https://leginfo.legislature.ca.gov/faces/codes.xhtml'],
          primary_domain: 'https://leginfo.legislature.ca.gov',
          alternate_domains: []
        },
        'NY': {
          name: 'New York',
          statute_base_urls: [], // No specific statute URLs
          primary_domain: 'https://www.nysenate.gov',
          alternate_domains: ['https://www.nycourts.gov']
        },
        'TX': {
          name: 'Texas',
          statute_base_urls: ['https://statutes.capitol.texas.gov/'],
          primary_domain: 'https://statutes.capitol.texas.gov',
          alternate_domains: []
        }
      }
    };

    // Mock readFileSync to return our mock config
    require('fs').readFileSync.mockReturnValue(JSON.stringify(mockStateConfig));

    client = new ExaClient(mockRateLimiter);
    
    // Reset all mocks
    jest.clearAllMocks();
    process.env.EXA_API_KEY = 'test-exa-key'; // Ensure API key is set for tests
  });

  afterEach(() => {
    delete process.env.EXA_API_KEY; // Clean up env var
  });

  describe('constructor', () => {
    test('should initialize with rate limiter', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
    });

    test('should load state configuration successfully', () => {
      expect(require('fs').readFileSync).toHaveBeenCalledWith(
        '/mock/path/to/src/api-clients/../../config/all-states-statute-urls.json', // Adjusted path due to join mock
        'utf8'
      );
      expect(client.stateConfig).toEqual(mockStateConfig);
    });

    test('should handle missing state configuration file gracefully', () => {
      require('fs').readFileSync.mockImplementationOnce(() => {
        throw new Error('File not found');
      });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress console.warn
      
      const newClient = new ExaClient(mockRateLimiter);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('State configuration file not found'));
      expect(newClient.stateConfig).toEqual({ states: {} });
      consoleWarnSpy.mockRestore();
    });
  });

  describe('searchStateStatute', () => {
    test('should throw error if state is invalid or missing', async () => {
      await expect(client.searchStateStatute({ state: 'XX', query: 'test' }))
        .rejects.toThrow('Invalid or missing state code: XX');
      await expect(client.searchStateStatute({ query: 'test' }))
        .rejects.toThrow('Invalid or missing state code: undefined');
    });

    test('should throw error if query is missing or empty', async () => {
      await expect(client.searchStateStatute({ state: 'CA' }))
        .rejects.toThrow('Query is required for state statute search.');
      await expect(client.searchStateStatute({ state: 'CA', query: '' }))
        .rejects.toThrow('Query is required for state statute search.');
    });

    test('should throw error if EXA_API_KEY is not set', async () => {
      delete process.env.EXA_API_KEY;
      await expect(client.searchStateStatute({ state: 'CA', query: 'test' }))
        .rejects.toThrow('Exa API key not configured. Set EXA_API_KEY environment variable.');
    });

    test('should search state statutes successfully with specific URLs', async () => {
      const mockResponse = {
        results: [{ title: 'CA Statute', url: 'http://ca.gov/statute', text: 'Full text of statute.' }],
        costDollars: { total: 0.01 }
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const args = { state: 'CA', query: 'property law', num_results: 1 };
      const result = await client.searchStateStatute(args);

      expect(mockRateLimiter.enforce).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.exa.ai/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'x-api-key': 'test-exa-key' }),
          body: JSON.stringify({
            query: 'property law California statute law',
            includeDomains: ['https://leginfo.legislature.ca.gov/faces/codes.xhtml'],
            numResults: 1,
            contents: { text: true }
          })
        })
      );
      expect(JSON.parse(result.content[0].text).total_results).toBe(1);
      expect(JSON.parse(result.content[0].text).results[0].title).toBe('CA Statute');
      expect(JSON.parse(result.content[0].text).results[0].text).toBe('Full text of statute.');
    });

    test('should use primary and alternate domains if no specific statute URLs', async () => {
      const mockResponse = { results: [{ title: 'NY Law', url: 'http://ny.gov/law' }] };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const args = { state: 'NY', query: 'housing code', num_results: 1, include_text: false };
      await client.searchStateStatute(args);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.exa.ai/search',
        expect.objectContaining({
          body: JSON.stringify({
            query: 'housing code New York statute law',
            includeDomains: ['https://www.nysenate.gov', 'https://www.nycourts.gov'],
            numResults: 1,
          })
        })
      );
    });

    test('should handle Exa API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded')
      });

      await expect(client.searchStateStatute({ state: 'CA', query: 'test' }))
        .rejects.toThrow('Rate limit exceeded. Please wait a moment and try again.');
    });

    test('should extract sections and subsections if text is included', async () => {
      const mockResponse = {
        results: [{ title: 'Statute', url: 'http://url.com', text: 'Section 1.1. (a) This is a subsection. Section 2. (b) Another one.' }],
        costDollars: { total: 0.01 }
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const args = { state: 'TX', query: 'test', include_text: true };
      const result = await client.searchStateStatute(args);
      const responseData = JSON.parse(result.content[0].text);

      expect(responseData.results[0].sections).toEqual(['1.1', '2']);
      expect(responseData.results[0].subsections).toEqual(['(a)', '(b)']);
    });
  });
});