/**
 * Unit tests for GovInfo USC API Client
 * Tests GovInfo client methods with mocked dependencies
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GovInfoClient } from '../../../src/api-clients/GovInfoClient.js';

// Mock the API helpers
jest.mock('../../../src/utils/apiHelpers.js', () => ({
  makeApiRequest: jest.fn(),
  fetchGovInfoContent: jest.fn()
}));

// Mock the validation helpers
jest.mock('../../../src/utils/validation.js', () => ({
  validateYear: jest.fn()
}));

import { makeApiRequest, fetchGovInfoContent } from '../../../src/utils/apiHelpers.js';
import { validateYear } from '../../../src/utils/validation.js';

describe('GovInfoClient', () => {
  let client;
  let mockRateLimiter;

  beforeEach(() => {
    mockRateLimiter = {
      enforce: jest.fn().mockResolvedValue()
    };
    client = new GovInfoClient(mockRateLimiter);
    
    // Reset all mocks
    jest.clearAllMocks();
    process.env.GOVINFO_API_KEY = 'test-govinfo-key'; // Ensure API key is set for tests
  });

  afterEach(() => {
    delete process.env.GOVINFO_API_KEY; // Clean up env var
  });

  describe('constructor', () => {
    test('should initialize with rate limiter', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
    });
  });

  describe('searchUSCode', () => {
    test('should throw error if GOVINFO_API_KEY is not set', async () => {
      delete process.env.GOVINFO_API_KEY;
      await expect(client.searchUSCode({ search_text: 'test' }))
        .rejects.toThrow('GovInfo API key not configured. Set GOVINFO_API_KEY environment variable.');
    });

    test('should search US Code by text using search endpoint', async () => {
      const mockResponse = {
        results: [{
          packageId: 'USCODE-2023-title1-section1',
          title: 'Title 1, Section 1',
          collectionCode: 'USCODE',
          dateIssued: '2023-01-01',
          packageLink: 'http://link.com/pkg',
          download: { txtLink: 'http://link.com/txt' }
        }]
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const args = { search_text: 'test', limit: 20 };
      const result = await client.searchUSCode(args);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.govinfo.gov/search'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test AND collection:(USCODE)')
        })
      );
      expect(JSON.parse(result.content[0].text).count).toBe(1);
      expect(JSON.parse(result.content[0].text).results[0].title).toBe('Title 1, Section 1');
    });

    test('should search US Code by title and section using collections endpoint', async () => {
      const mockResponse = {
        packages: [{
          packageId: 'USCODE-2023-title1-section1',
          title: 'Title 1, Section 1',
          collectionCode: 'USCODE',
          dateIssued: '2023-01-01',
          packageLink: 'http://link.com/pkg',
          download: { txtLink: 'http://link.com/txt' }
        }]
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { title_number: 1, section: 1, year: 2023, limit: 20 };
      const result = await client.searchUSCode(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        expect.stringContaining('/collections/USCODE/2023-01-01T00:00:00Z/2023-12-31T23:59:59Z'),
        {},
        expect.objectContaining({ apiType: 'govinfo', rateLimiter: mockRateLimiter })
      );
      expect(JSON.parse(result.content[0].text).count).toBe(1);
      expect(JSON.parse(result.content[0].text).results[0].title).toBe('Title 1, Section 1');
    });

    test('should handle API errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error')); // For search endpoint
      makeApiRequest.mockRejectedValue(new Error('API error')); // For collections endpoint

      await expect(client.searchUSCode({ search_text: 'error' }))
        .rejects.toThrow('USC search failed: Network error');
      
      await expect(client.searchUSCode({ title_number: 1 }))
        .rejects.toThrow('USC search failed: API error');
    });

    test('should indicate full text is temporarily disabled', async () => {
      const mockResponse = {
        packages: [{
          packageId: 'USCODE-2023-title1-section1',
          title: 'Title 1, Section 1',
          collectionCode: 'USCODE',
          dateIssued: '2023-01-01',
          packageLink: 'http://link.com/pkg',
          download: { txtLink: 'http://link.com/txt' }
        }]
      };
      makeApiRequest.mockResolvedValue(mockResponse);

      const args = { title_number: 1, section: 1, include_full_text: true };
      const result = await client.searchUSCode(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.results[0].full_text_status).toContain('TEMPORARILY DISABLED');
    });
  });

  describe('getUSCSection', () => {
    test('should get USC section details successfully', async () => {
      const mockSummaryResponse = { packageId: 'USCODE-2023-title1' };
      const mockGranulesResponse1 = {
        granules: [{ granuleId: 'USCODE-2023-title1-section1', title: 'Section 1' }],
        nextPage: null
      };

      makeApiRequest
        .mockResolvedValueOnce(mockSummaryResponse)
        .mockResolvedValueOnce(mockGranulesResponse1);
      
      const args = { title: 1, section: 1, year: 2023 };
      const result = await client.getUSCSection(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        expect.stringContaining('/packages/USCODE-2023-title1/summary'),
        {},
        expect.any(Object)
      );
      expect(makeApiRequest).toHaveBeenCalledWith(
        expect.stringContaining('/packages/USCODE-2023-title1/granules'),
        {},
        expect.any(Object)
      );
      expect(JSON.parse(result.content[0].text).section_title).toBe('Section 1');
    });

    test('should throw error for missing title or section', async () => {
      await expect(client.getUSCSection({ section: 1 })).rejects.toThrow('Title and section are required');
      await expect(client.getUSCSection({ title: 1 })).rejects.toThrow('Title and section are required');
    });

    test('should throw error for invalid title number', async () => {
      await expect(client.getUSCSection({ title: 0, section: 1 })).rejects.toThrow('Invalid title number. Must be between 1 and 54');
      await expect(client.getUSCSection({ title: 55, section: 1 })).rejects.toThrow('Invalid title number. Must be between 1 and 54');
    });

    test('should throw error if section not found', async () => {
      const mockSummaryResponse = { packageId: 'USCODE-2023-title1' };
      const mockGranulesResponse = { granules: [], nextPage: null };

      makeApiRequest
        .mockResolvedValueOnce(mockSummaryResponse)
        .mockResolvedValueOnce(mockGranulesResponse);

      await expect(client.getUSCSection({ title: 1, section: 999 }))
        .rejects.toThrow('Section 999 not found in Title 1');
    });

    test('should handle pagination for granules', async () => {
      const mockSummaryResponse = { packageId: 'USCODE-2023-title1' };
      const mockGranulesResponse1 = {
        granules: Array.from({ length: 100 }, (_, i) => ({ granuleId: `USCODE-2023-title1-section${i+1}`, title: `Section ${i+1}` })),
        nextPage: { offsetMark: 'next-page-token' }
      };
      const mockGranulesResponse2 = {
        granules: [{ granuleId: 'USCODE-2023-title1-section101', title: 'Section 101' }],
        nextPage: null
      };

      makeApiRequest
        .mockResolvedValueOnce(mockSummaryResponse)
        .mockResolvedValueOnce(mockGranulesResponse1)
        .mockResolvedValueOnce(mockGranulesResponse2);

      const args = { title: 1, section: 101, year: 2023 };
      const result = await client.getUSCSection(args);

      expect(makeApiRequest).toHaveBeenCalledTimes(3); // Summary + 2 granule calls
      expect(JSON.parse(result.content[0].text).section_title).toBe('Section 101');
    });
  });

  describe('getUSCTitleStructure', () => {
    test('should get USC title structure successfully', async () => {
      const mockSummaryResponse = { packageId: 'USCODE-2023-title1', title: 'Title 1 - General Provisions', dateIssued: '2023-01-01' };
      const mockGranulesResponse = {
        granules: [
          { granuleId: 'USCODE-2023-title1-chapter1-section1', title: 'Chapter 1, Section 1' },
          { granuleId: 'USCODE-2023-title1-chapter1-section2', title: 'Chapter 1, Section 2' },
          { granuleId: 'USCODE-2023-title1-section3', title: 'Section 3' } // No chapter
        ],
        nextPage: null
      };

      makeApiRequest
        .mockResolvedValueOnce(mockSummaryResponse)
        .mockResolvedValueOnce(mockGranulesResponse);

      const args = { title: 1, year: 2023 };
      const result = await client.getUSCTitleStructure(args);

      expect(makeApiRequest).toHaveBeenCalledWith(
        expect.stringContaining('/packages/USCODE-2023-title1/summary'),
        {},
        expect.any(Object)
      );
      expect(makeApiRequest).toHaveBeenCalledWith(
        expect.stringContaining('/packages/USCODE-2023-title1/granules'),
        {},
        expect.any(Object)
      );

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.title_number).toBe(1);
      expect(responseData.title_name).toBe('Title 1 - General Provisions');
      expect(responseData.total_sections).toBe(3);
      expect(responseData.chapters['1']).toHaveLength(2);
      expect(responseData.sections).toHaveLength(1);
    });

    test('should throw error for missing title', async () => {
      await expect(client.getUSCTitleStructure({})).rejects.toThrow('Title number is required');
    });

    test('should throw error for invalid title number', async () => {
      await expect(client.getUSCTitleStructure({ title: 0 })).rejects.toThrow('Invalid title number. Must be between 1 and 54');
    });
  });

  describe('listUSCTitles', () => {
    test('should list USC titles successfully', async () => {
      // Mock makeApiRequest to simulate availability check for each title
      makeApiRequest.mockImplementation((url) => {
        if (url.includes('title1')) return Promise.resolve({ packageId: 'USCODE-2023-title1' });
        if (url.includes('title2')) return Promise.reject({ status: 404 }); // Simulate not available
        return Promise.resolve({});
      });

      const args = { year: 2023 };
      const result = await client.listUSCTitles(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.total_titles).toBe(54);
      expect(responseData.available_count).toBeGreaterThan(0);
      expect(responseData.titles).toHaveLength(54);
      expect(responseData.titles[0].number).toBe(1);
      expect(responseData.titles[0].available).toBe(true);
      expect(responseData.titles[1].number).toBe(2);
      expect(responseData.titles[1].available).toBe(false);
    });

    test('should include enacted status if requested', async () => {
      makeApiRequest.mockResolvedValue({ packageId: 'USCODE-2023-title1' }); // All titles available for simplicity

      const args = { year: 2023, include_enacted: true };
      const result = await client.listUSCTitles(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.titles[0].enacted_positive_law).toBeDefined();
      expect(responseData.titles[0].enacted_positive_law).toBe(true); // Title 1 is enacted
      expect(responseData.titles[1].enacted_positive_law).toBe(false); // Title 2 is not enacted
    });

    test('should throw error if GOVINFO_API_KEY is not set', async () => {
      delete process.env.GOVINFO_API_KEY;
      await expect(client.listUSCTitles({})).rejects.toThrow('GovInfo API key not configured');
    });
  });
});