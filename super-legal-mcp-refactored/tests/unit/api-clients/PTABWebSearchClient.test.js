/**
 * Unit tests for PTAB Web Search Client
 * Tests PTAB web search methods with mocked Exa API calls and internal parsing logic.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PTABWebSearchClient } from '../../../src/api-clients/PTABWebSearchClient.js';

// Mock global fetch
global.fetch = jest.fn();

describe('PTABWebSearchClient', () => {
  let client;
  let mockRateLimiter;
  let consoleWarnSpy;
  let mockDateNow;

  beforeEach(() => {
    mockRateLimiter = {
      enforce: jest.fn().mockResolvedValue()
    };
    
    // Mock Date.now for consistent year in query building
    mockDateNow = jest.spyOn(Date, 'now');
    mockDateNow.mockReturnValue(new Date('2024-01-01T00:00:00.000Z').getTime());

    // Suppress console.warn for missing API key warning in constructor
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    client = new PTABWebSearchClient(mockRateLimiter);
    
    // Reset all mocks after client initialization to clear constructor calls
    jest.clearAllMocks();
    
    // Ensure EXA_API_KEY is set for tests
    process.env.EXA_API_KEY = 'test-exa-key';
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    mockDateNow.mockRestore();
    delete process.env.EXA_API_KEY;
  });

  describe('constructor', () => {
    test('should initialize with rate limiter', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
    });

    test('should warn if EXA_API_KEY is not configured', () => {
      delete process.env.EXA_API_KEY;
      new PTABWebSearchClient(mockRateLimiter);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('EXA_API_KEY not configured'));
    });

    test('should store EXA_API_KEY', () => {
      expect(client.exaApiKey).toBe('test-exa-key');
    });
  });

  describe('searchIPRProceedings', () => {
    test('should throw error if EXA_API_KEY is not set', async () => {
      delete process.env.EXA_API_KEY;
      await expect(client.searchIPRProceedings({ query: 'test' }))
        .rejects.toThrow('EXA_API_KEY not configured');
    });

    test('should build IPR query and execute Exa search', async () => {
      const mockExaResults = [{
        title: 'IPR2024-00123 Decision',
        url: 'http://uspto.gov/ipr123',
        text: 'This is the full text for IPR2024-00123. Patent No. 1234567. Petitioner: Apple Inc. Patent Owner: Samsung. Status: Instituted.'
      }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: mockExaResults })
      });

      const args = { proceeding_number: 'IPR2024-00123', limit: 1 };
      const result = await client.searchIPRProceedings(args);

      expect(mockRateLimiter.enforce).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.exa.ai/search',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"IPR2024-00123"'),
          headers: expect.objectContaining({ 'x-api-key': 'test-exa-key' })
        })
      );
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.search_type).toBe('IPR_proceedings_web_search');
      expect(responseData.total_results).toBe(1);
      expect(responseData.results[0].proceeding_number).toBe('IPR2024-00123');
      expect(responseData.results[0].patent_number).toBe('1234567');
      expect(responseData.results[0].petitioner).toBe('Apple Inc.');
      expect(responseData.results[0].patent_owner).toBe('Samsung');
      expect(responseData.results[0].status).toBe('Instituted');
    });

    test('should handle empty results', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      const args = { proceeding_number: 'IPR2024-99999', limit: 1 };
      const result = await client.searchIPRProceedings(args);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.total_results).toBe(0);
      expect(responseData.results).toEqual([]);
    });

    test('should handle Exa API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      });

      await expect(client.searchIPRProceedings({ proceeding_number: 'IPR2024-00123' }))
        .rejects.toThrow('IPR web search failed: Exa API error: 500 - Internal Server Error');
    });
  });

  describe('searchPGRProceedings', () => {
    test('should build PGR query and execute Exa search', async () => {
      const mockExaResults = [{
        title: 'PGR2024-00001 Decision',
        url: 'http://uspto.gov/pgr1',
        text: 'This is the full text for PGR2024-00001. Patent No. 7654321. Petitioner: Google. Patent Owner: Apple. Status: Terminated.'
      }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: mockExaResults })
      });

      const args = { proceeding_number: 'PGR2024-00001', limit: 1 };
      const result = await client.searchPGRProceedings(args);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.exa.ai/search',
        expect.objectContaining({
          body: expect.stringContaining('"PGR2024-00001"'),
        })
      );
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.search_type).toBe('PGR_proceedings_web_search');
      expect(responseData.results[0].proceeding_number).toBe('PGR2024-00001');
      expect(responseData.results[0].patent_number).toBe('7654321');
    });
  });

  describe('searchCBMProceedings', () => {
    test('should build CBM query and execute Exa search', async () => {
      const mockExaResults = [{
        title: 'CBM2024-00001 Decision',
        url: 'http://uspto.gov/cbm1',
        text: 'This is the full text for CBM2024-00001. Patent No. 8765432. Petitioner: IBM. Patent Owner: Oracle. Status: Denied.'
      }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: mockExaResults })
      });

      const args = { proceeding_number: 'CBM2024-00001', limit: 1 };
      const result = await client.searchCBMProceedings(args);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.exa.ai/search',
        expect.objectContaining({
          body: expect.stringContaining('"CBM2024-00001"'),
        })
      );
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.search_type).toBe('CBM_proceedings_web_search');
      expect(responseData.results[0].proceeding_number).toBe('CBM2024-00001');
      expect(responseData.results[0].patent_number).toBe('8765432');
    });
  });

  describe('searchAllAIAProceedings', () => {
    test('should build a general AIA query and execute Exa search', async () => {
      const mockExaResults = [{
        title: 'IPR2024-00123 Decision',
        url: 'http://uspto.gov/ipr123',
        text: 'This is the full text for IPR2024-00123. Patent No. 1234567. Petitioner: Apple Inc. Patent Owner: Samsung. Status: Instituted.'
      }, {
        title: 'PGR2024-00001 Decision',
        url: 'http://uspto.gov/pgr1',
        text: 'This is the full text for PGR2024-00001. Patent No. 7654321. Petitioner: Google. Patent Owner: Apple. Status: Terminated.'
      }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: mockExaResults })
      });

      const args = { year: 2024, limit: 2 };
      const result = await client.searchAllAIAProceedings(args);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.exa.ai/search',
        expect.objectContaining({
          body: expect.stringContaining('("IPR2024" OR "PGR2024" OR "CBM2024")'),
        })
      );
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.search_type).toBe('all_AIA_proceedings_web_search');
      expect(responseData.total_results).toBe(2);
      expect(responseData.results[0].proceeding_type).toBe('IPR');
      expect(responseData.results[1].proceeding_type).toBe('PGR');
    });

    test('should include patent_number, petitioner, patent_owner, status in all AIA query', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      const args = {
        patent_number: '1234567',
        petitioner: 'Test Petitioner',
        patent_owner: 'Test Owner',
        status: 'Final Written Decision',
        limit: 1
      };
      await client.searchAllAIAProceedings(args);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.exa.ai/search',
        expect.objectContaining({
          body: expect.stringContaining('"Patent 1234567"'),
          body: expect.stringContaining('"Test Petitioner" AND (petitioner OR challenger)'),
          body: expect.stringContaining('"Test Owner" AND "patent owner"'),
          body: expect.stringContaining('"Final Written Decision"')
        })
      );
    });
  });

  describe('buildProceedingQuery (private helper)', () => {
    test('should build query for IPR with proceeding number', () => {
      const query = client.buildProceedingQuery('IPR', { proceeding_number: 'IPR2023-00123' });
      expect(query).toContain('site:uspto.gov "IPR2023-00123" PTAB "Inter Partes Review"');
    });

    test('should build query for PGR with year and parties', () => {
      const query = client.buildProceedingQuery('PGR', { year: 2022, petitioner: 'Company A', patent_owner: 'Company B' });
      expect(query).toContain('site:uspto.gov "PGR2022" OR "PGR2021" "Company A" AND (petitioner OR challenger) "Company B" AND "patent owner" PTAB "Post-Grant Review"');
    });

    test('should build query for CBM with patent number and status', () => {
      const query = client.buildProceedingQuery('CBM', { patent_number: '1234567', status: 'Instituted' });
      expect(query).toContain('site:uspto.gov "CBM2024" OR "CBM2023" "Patent 1234567" PTAB "Covered Business Method"');
      expect(query).toContain('"Instituted"');
    });
  });

  describe('executeExaSearch (private helper)', () => {
    test('should throw error if EXA_API_KEY is not set', async () => {
      delete process.env.EXA_API_KEY;
      await expect(client.executeExaSearch('test query', 1)).rejects.toThrow('EXA_API_KEY not configured');
    });

    test('should call Exa API with correct parameters and headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      await client.executeExaSearch('test query', 5);

      expect(mockRateLimiter.enforce).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.exa.ai/search',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-exa-key'
          },
          body: JSON.stringify({
            query: 'test query',
            num_results: 5,
            use_autoprompt: true,
            type: 'neural',
            include_domains: ['uspto.gov', 'ptacts.uspto.gov'],
            include_text: ['text'],
            highlights: {
              highlights_per_url: 3,
              num_sentences: 2,
              query: "proceeding number patent owner petitioner decision status"
            }
          })
        })
      );
    });

    test('should handle Exa API non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      });

      await expect(client.executeExaSearch('test query', 1))
        .rejects.toThrow('Exa API error: 400 - Bad Request');
    });
  });

  describe('extractProceedingInfo (private helper)', () => {
    test('should extract IPR info correctly', () => {
      const result = {
        title: 'Decision on IPR2023-00123',
        url: 'http://example.com/ipr',
        text: 'Full text. Patent No. 12,345,678. Petitioner: Company A. Patent Owner: Company B. Status: Final Written Decision. Filed: January 1, 2023. Decided: December 31, 2023.'
      };
      const info = client.extractProceedingInfo(result, 'IPR');
      expect(info.proceeding_type).toBe('IPR');
      expect(info.proceeding_number).toBe('IPR2023-00123');
      expect(info.patent_number).toBe('12345678');
      expect(info.petitioner).toBe('Company A');
      expect(info.patent_owner).toBe('Company B');
      expect(info.filing_date).toBe('January 1, 2023');
      expect(info.decision_date).toBe('December 31, 2023');
      expect(info.status).toBe('Final Written Decision');
      expect(info.url).toBe('http://example.com/ipr');
    });

    test('should extract PGR info correctly', () => {
      const result = {
        title: 'PGR2022-00005 Institution Decision',
        url: 'http://example.com/pgr',
        text: 'Patent No. 9,876,543. Petitioner: XYZ Corp. Patent Owner: ABC Inc. Status: Instituted.'
      };
      const info = client.extractProceedingInfo(result, 'PGR');
      expect(info.proceeding_type).toBe('PGR');
      expect(info.proceeding_number).toBe('PGR2022-00005');
      expect(info.patent_number).toBe('9876543');
      expect(info.petitioner).toBe('XYZ Corp.');
      expect(info.patent_owner).toBe('ABC Inc.');
      expect(info.status).toBe('Instituted');
    });

    test('should handle missing fields gracefully', () => {
      const result = {
        title: 'CBM2021-00010',
        url: 'http://example.com/cbm',
        text: 'Minimal text.'
      };
      const info = client.extractProceedingInfo(result, 'CBM');
      expect(info.proceeding_number).toBe('CBM2021-00010');
      expect(info.patent_number).toBeNull();
      expect(info.petitioner).toBeNull();
      expect(info.patent_owner).toBeNull();
      expect(info.filing_date).toBeNull();
      expect(info.decision_date).toBeNull();
      expect(info.status).toBeNull();
    });
  });

  describe('detectProceedingType (private helper)', () => {
    test('should detect IPR type', () => {
      expect(client.detectProceedingType('IPR2023-00123')).toBe('IPR');
      expect(client.detectProceedingType('Some text with IPR2024-00500 in it')).toBe('IPR');
    });

    test('should detect PGR type', () => {
      expect(client.detectProceedingType('PGR2023-00001')).toBe('PGR');
    });

    test('should detect CBM type', () => {
      expect(client.detectProceedingType('CBM2023-00001')).toBe('CBM');
    });

    test('should detect DER type', () => {
      expect(client.detectProceedingType('DER2023-00001')).toBe('DER');
    });

    test('should return Unknown for unrecognized types', () => {
      expect(client.detectProceedingType('Some random text')).toBe('Unknown');
      expect(client.detectProceedingType('ABC2023-00001')).toBe('Unknown');
    });
  });
});