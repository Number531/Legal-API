/**
 * Unit tests for USPTO Patents API Client
 * Tests USPTO client methods with mocked dependencies
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UsptoClient } from '../../../src/api-clients/UsptoClient.js';

// Mock the API helpers
jest.mock('../../../src/utils/apiHelpers.js', () => ({
  makePostRequest: jest.fn()
}));

import { makePostRequest } from '../../../src/utils/apiHelpers.js';

describe('UsptoClient', () => {
  let client;
  let mockRateLimiter;

  beforeEach(() => {
    mockRateLimiter = {
      enforce: jest.fn().mockResolvedValue()
    };
    client = new UsptoClient(mockRateLimiter);
    
    // Reset all mocks
    jest.clearAllMocks();
    process.env.USPTO_API_KEY = 'test-uspto-key'; // Ensure API key is set for tests
  });

  afterEach(() => {
    delete process.env.USPTO_API_KEY; // Clean up env var
  });

  describe('constructor', () => {
    test('should initialize with rate limiter', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
    });
  });

  describe('searchPatents', () => {
    test('should throw error if USPTO_API_KEY is not set', async () => {
      delete process.env.USPTO_API_KEY;
      await expect(client.searchPatents({ query_type: 'patents', search_text: 'test' }))
        .rejects.toThrow('USPTO API key not configured. Set USPTO_API_KEY environment variable.');
    });

    test('should search patents by text', async () => {
      const mockResponse = { total_hits: 1, patents: [{ patent_id: '123', patent_title: 'Test Patent' }] };
      makePostRequest.mockResolvedValue(mockResponse);

      const args = { query_type: 'patents', search_text: 'test', limit: 25 };
      const result = await client.searchPatents(args);

      expect(makePostRequest).toHaveBeenCalledWith(
        'uspto_patents',
        '/patent/',
        expect.objectContaining({
          q: { _text_any: { patent_title: 'test' } },
          o: { per_page: 25 }
        }),
        mockRateLimiter
      );
      expect(JSON.parse(result.content[0].text).total_hits).toBe(1);
      expect(JSON.parse(result.content[0].text).results[0].patent_title).toBe('Test Patent');
    });

    test('should search patents by assignee and inventor', async () => {
      const mockResponse = { total_hits: 0, patents: [] };
      makePostRequest.mockResolvedValue(mockResponse);

      const args = {
        query_type: 'patents',
        assignee_organization: 'Google',
        inventor_name: 'Smith',
        limit: 10
      };
      await client.searchPatents(args);

      expect(makePostRequest).toHaveBeenCalledWith(
        'uspto_patents',
        '/patent/',
        expect.objectContaining({
          q: { _and: [{ "assignees.assignee_organization": "Google" }, { "inventors.inventor_name_last": "Smith" }] },
          o: { per_page: 10 }
        }),
        mockRateLimiter
      );
    });

    test('should search inventors by name', async () => {
      const mockResponse = { total_hits: 1, inventors: [{ inventor_id: 'inv1', inventor_name_last: 'Doe' }] };
      makePostRequest.mockResolvedValue(mockResponse);

      const args = { query_type: 'inventors', inventor_name: 'Doe', limit: 25 };
      const result = await client.searchPatents(args);

      expect(makePostRequest).toHaveBeenCalledWith(
        'uspto_patents',
        '/inventor/',
        expect.objectContaining({
          q: { inventor_name_last: 'Doe' },
          o: { per_page: 25 }
        }),
        mockRateLimiter
      );
      expect(JSON.parse(result.content[0].text).results[0].inventor_name_last).toBe('Doe');
    });

    test('should search assignees by organization', async () => {
      const mockResponse = { total_hits: 1, assignees: [{ assignee_id: 'ass1', assignee_organization: 'IBM' }] };
      makePostRequest.mockResolvedValue(mockResponse);

      const args = { query_type: 'assignees', assignee_organization: 'IBM', limit: 25 };
      const result = await client.searchPatents(args);

      expect(makePostRequest).toHaveBeenCalledWith(
        'uspto_patents',
        '/assignee/',
        expect.objectContaining({
          q: { assignee_organization: 'IBM' },
          o: { per_page: 25 }
        }),
        mockRateLimiter
      );
      expect(JSON.parse(result.content[0].text).results[0].assignee_organization).toBe('IBM');
    });

    test('should handle API errors', async () => {
      makePostRequest.mockRejectedValue(new Error('USPTO API error'));
      await expect(client.searchPatents({ query_type: 'patents', search_text: 'error' }))
        .rejects.toThrow('USPTO search failed: USPTO API error');
    });
  });

  describe('searchPatentLocations', () => {
    test('should search patent locations by city and state', async () => {
      const mockResponse = { total_hits: 1, locations: [{ location_city: 'New York', location_state: 'NY' }] };
      makePostRequest.mockResolvedValue(mockResponse);

      const args = { location_city: 'New York', location_state: 'NY', limit: 25 };
      const result = await client.searchPatentLocations(args);

      expect(makePostRequest).toHaveBeenCalledWith(
        'uspto_patents',
        '/location/',
        expect.objectContaining({
          q: { _and: [{ location_city: 'New York' }, { location_state: 'NY' }] },
          o: { per_page: 25 }
        }),
        mockRateLimiter
      );
      expect(JSON.parse(result.content[0].text).results[0].location_city).toBe('New York');
    });

    test('should default to US locations if no specific query', async () => {
      const mockResponse = { total_hits: 0, locations: [] };
      makePostRequest.mockResolvedValue(mockResponse);

      const args = { limit: 10 };
      await client.searchPatentLocations(args);

      expect(makePostRequest).toHaveBeenCalledWith(
        'uspto_patents',
        '/location/',
        expect.objectContaining({
          q: { location_country: 'US' },
          o: { per_page: 10 }
        }),
        mockRateLimiter
      );
    });
  });

  describe('searchCPCClassifications', () => {
    test('should search CPC classifications by section', async () => {
      const mockResponse = { total_hits: 1, cpc_subclasses: [{ cpc_subclass_id: 'A01B', cpc_subclass_title: 'Agriculture' }] };
      makePostRequest.mockResolvedValue(mockResponse);

      const args = { cpc_section: 'A', limit: 25 };
      const result = await client.searchCPCClassifications(args);

      expect(makePostRequest).toHaveBeenCalledWith(
        'uspto_patents',
        '/cpc_subclass/',
        expect.objectContaining({
          q: { _begins: { cpc_subclass_id: 'A' } },
          o: { per_page: 25 }
        }),
        mockRateLimiter
      );
      expect(JSON.parse(result.content[0].text).results[0].cpc_subclass_id).toBe('A01B');
    });

    test('should throw error if no search criteria provided', async () => {
      await expect(client.searchCPCClassifications({})).rejects.toThrow('Please provide cpc_section, cpc_subsection_id, or search_text');
    });
  });

  describe('searchCPCGroups', () => {
    test('should search CPC groups by subclass ID', async () => {
      const mockResponse = { total_hits: 1, cpc_groups: [{ cpc_group_id: 'A01B1/00', cpc_group_title: 'Plows' }] };
      makePostRequest.mockResolvedValue(mockResponse);

      const args = { cpc_subclass_id: 'A01B', limit: 25 };
      const result = await client.searchCPCGroups(args);

      expect(makePostRequest).toHaveBeenCalledWith(
        'uspto_patents',
        '/cpc_group/',
        expect.objectContaining({
          q: { cpc_subclass_id: 'A01B' },
          o: { per_page: 25 }
        }),
        mockRateLimiter
      );
      expect(JSON.parse(result.content[0].text).results[0].cpc_group_id).toBe('A01B1/00');
    });
  });

  describe('searchUSPCClassifications', () => {
    test('should search USPC mainclass by ID', async () => {
      const mockResponse = { total_hits: 1, uspc_mainclasses: [{ uspc_mainclass_id: '1', uspc_mainclass_title: 'Class 1' }] };
      makePostRequest.mockResolvedValue(mockResponse);

      const args = { classification_type: 'mainclass', uspc_mainclass_id: '1', limit: 25 };
      const result = await client.searchUSPCClassifications(args);

      expect(makePostRequest).toHaveBeenCalledWith(
        'uspto_patents',
        '/uspc_mainclass/',
        expect.objectContaining({
          q: { uspc_mainclass_id: '1' },
          o: { per_page: 25 }
        }),
        mockRateLimiter
      );
      expect(JSON.parse(result.content[0].text).results[0].uspc_mainclass_id).toBe('1');
    });

    test('should search USPC subclass by text', async () => {
      const mockResponse = { total_hits: 1, uspc_subclasses: [{ uspc_subclass_id: '1/01', uspc_subclass_title: 'Subclass 1/01' }] };
      makePostRequest.mockResolvedValue(mockResponse);

      const args = { classification_type: 'subclass', search_text: 'Subclass', limit: 25 };
      const result = await client.searchUSPCClassifications(args);

      expect(makePostRequest).toHaveBeenCalledWith(
        'uspto_patents',
        '/uspc_subclass/',
        expect.objectContaining({
          q: { _text_any: { uspc_subclass_title: 'Subclass' } },
          o: { per_page: 25 }
        }),
        mockRateLimiter
      );
      expect(JSON.parse(result.content[0].text).results[0].uspc_subclass_id).toBe('1/01');
    });

    test('should throw error for missing mainclass search criteria', async () => {
      await expect(client.searchUSPCClassifications({ classification_type: 'mainclass' }))
        .rejects.toThrow('Please provide uspc_mainclass_id or search_text');
    });

    test('should throw error for missing subclass search criteria', async () => {
      await expect(client.searchUSPCClassifications({ classification_type: 'subclass' }))
        .rejects.toThrow('Please provide search_text for subclass search');
    });
  });

  describe('searchWIPOClassifications', () => {
    test('should search WIPO classifications by field ID', async () => {
      const mockResponse = { total_hits: 1, wipo: [{ wipo_id: 'A', field_title: 'Agriculture' }] };
      makePostRequest.mockResolvedValue(mockResponse);

      const args = { wipo_field_id: 'A', limit: 25 };
      const result = await client.searchWIPOClassifications(args);

      expect(makePostRequest).toHaveBeenCalledWith(
        'uspto_patents',
        '/wipo/',
        expect.objectContaining({
          q: { wipo_id: 'A' },
          o: { per_page: 25 }
        }),
        mockRateLimiter
      );
      expect(JSON.parse(result.content[0].text).results[0].wipo_id).toBe('A');
    });

    test('should search WIPO classifications by text', async () => {
      const mockResponse = { total_hits: 1, wipo: [{ wipo_id: 'B', field_title: 'Biotechnology' }] };
      makePostRequest.mockResolvedValue(mockResponse);

      const args = { search_text: 'Biotechnology', limit: 25 };
      const result = await client.searchWIPOClassifications(args);

      expect(makePostRequest).toHaveBeenCalledWith(
        'uspto_patents',
        '/wipo/',
        expect.objectContaining({
          q: { _text_any: { field_title: 'Biotechnology' } },
          o: { per_page: 25 }
        }),
        mockRateLimiter
      );
      expect(JSON.parse(result.content[0].text).results[0].field_title).toBe('Biotechnology');
    });
  });
});