/**
 * Unit tests for CourtListener Web Search Client (Exa-only)
 * Validates query building, Exa invocation, and mapping/parsing logic.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CourtListenerWebSearchClient } from '../../../src/api-clients/CourtListenerWebSearchClient.js';

// Mock global fetch
global.fetch = jest.fn();

describe('CourtListenerWebSearchClient (Exa-only)', () => {
  let client;
  let mockRateLimiter;
  let consoleWarnSpy;

  beforeEach(() => {
    mockRateLimiter = { enforce: jest.fn().mockResolvedValue() };
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Ensure EXA_API_KEY is set for tests
    process.env.EXA_API_KEY = 'test-exa-key';

    client = new CourtListenerWebSearchClient(mockRateLimiter);
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    delete process.env.EXA_API_KEY;
  });

  describe('constructor', () => {
    test('should initialize with rate limiter and read EXA key', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
      expect(client.exaApiKey).toBe('test-exa-key');
    });

    test('should warn if EXA_API_KEY not configured', () => {
      delete process.env.EXA_API_KEY;
      new CourtListenerWebSearchClient(mockRateLimiter);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('EXA_API_KEY not configured'));
    });
  });

  describe('searchOpinionsWeb', () => {
    test('should throw if query missing', async () => {
      await expect(client.searchOpinionsWeb({})).rejects.toThrow('Query is required');
    });

    test('should call Exa with domain restriction and map results', async () => {
      const mockResults = [{
        title: 'Smith v. Jones - CourtListener',
        url: 'https://www.courtlistener.com/opinion/12345/smith-v-jones/',
        text: 'Decided: January 1, 2020. United States Court of Appeals for the Ninth Circuit. See 410 U.S. 113 and 123 F.3d 456.',
        publishedDate: '2020-01-02',
        score: 0.98
      }];

      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: mockResults }) });

      const result = await client.searchOpinionsWeb({ query: 'fourth amendment privacy', limit: 1 });

      expect(mockRateLimiter.enforce).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.exa.ai/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'x-api-key': 'test-exa-key' }),
          body: expect.any(String)
        })
      );

      const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(payload.query).toContain('site:courtlistener.com/opinion');
      expect(payload.numResults).toBe(1);
      expect(payload.includeDomains).toEqual(['courtlistener.com', 'www.courtlistener.com']);

      const data = JSON.parse(result.content[0].text);
      expect(data.search_type).toBe('courtlistener_opinions_web');
      expect(data.total_results).toBe(1);
      expect(data.results[0].opinion_id).toBe(12345);
      expect(data.results[0].case_name).toBe('Smith v. Jones');
      expect(data.results[0].citations).toEqual(expect.arrayContaining(['410 U.S. 113', '123 F.3d 456']));
      expect(data.results[0].court).toMatch(/Court of Appeals/i);
      expect(data.results[0].decided_date).toBe('January 1, 2020');
      expect(data.results[0].absolute_url).toBe('https://www.courtlistener.com/opinion/12345/smith-v-jones/');
      expect(data.results[0].published_date).toBe('2020-01-02');
      expect(data.results[0].score).toBeCloseTo(0.98);
    });

    test('should filter by date_after/date_before using publishedDate', async () => {
      const mockResults = [
        { title: 'Case A - CourtListener', url: 'https://www.courtlistener.com/opinion/1/a/', text: 'Decided: Jan 1, 2019.', publishedDate: '2019-01-01' },
        { title: 'Case B - CourtListener', url: 'https://www.courtlistener.com/opinion/2/b/', text: 'Decided: Jan 1, 2020.', publishedDate: '2020-01-01' },
        { title: 'Case C - CourtListener', url: 'https://www.courtlistener.com/opinion/3/c/', text: 'Decided: Jan 1, 2021.', publishedDate: '2021-01-01' }
      ];
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: mockResults }) });

      const result = await client.searchOpinionsWeb({ query: 'test', date_after: '2019-06-01', date_before: '2020-12-31', limit: 10 });
      const data = JSON.parse(result.content[0].text);
      expect(data.results.map(r => r.opinion_id)).toEqual([2]);
    });

    test('should omit snippet when include_text=false', async () => {
      const mockResults = [{
        title: 'Doe v. Roe - CourtListener',
        url: 'https://www.courtlistener.com/opinion/42/doe-v-roe/',
        text: 'Some body text.',
        publishedDate: '2022-05-05'
      }];
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: mockResults }) });

      const result = await client.searchOpinionsWeb({ query: 'privacy', include_text: false, limit: 1 });
      const data = JSON.parse(result.content[0].text);
      expect(data.results[0].snippet).toBeNull();
    });
  });

  describe('lookupCitationWeb', () => {
    test('should require citation', async () => {
      await expect(client.lookupCitationWeb({})).rejects.toThrow('citation is required');
    });

    test('should search by citation and map opinion fields', async () => {
      const mockResults = [{
        title: 'Roe v. Wade - CourtListener',
        url: 'https://www.courtlistener.com/opinion/108/roe-v-wade/',
        text: 'See 410 U.S. 113 (1973). Supreme Court of the United States. Decided: Jan 22, 1973.',
        publishedDate: '1973-01-22'
      }];
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: mockResults }) });

      const result = await client.lookupCitationWeb({ citation: '410 U.S. 113', limit: 3 });
      const data = JSON.parse(result.content[0].text);
      expect(data.search_type).toBe('courtlistener_citation_web');
      expect(data.results[0].opinion_id).toBe(108);
      expect(data.results[0].citations).toEqual(expect.arrayContaining(['410 U.S. 113']));
      expect(data.results[0].court).toMatch(/Supreme Court/i);
    });
  });

  describe('executeExaSearch (helper)', () => {
    test('should throw if EXA_API_KEY not set', async () => {
      delete process.env.EXA_API_KEY;
      const noKeyClient = new CourtListenerWebSearchClient(mockRateLimiter);
      await expect(noKeyClient.executeExaSearch('q', 1, true)).rejects.toThrow('Exa API key not configured');
    });

    test('should surface Exa non-ok as error', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 400, text: () => Promise.resolve('Bad Request') });
      await expect(client.executeExaSearch('q', 1, true)).rejects.toThrow('Exa API error: 400 - Bad Request');
    });
  });
});


