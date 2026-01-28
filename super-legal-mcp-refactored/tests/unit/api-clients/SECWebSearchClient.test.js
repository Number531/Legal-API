/**
 * Unit tests for SEC Web Search Client (Exa-only)
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SECWebSearchClient } from '../../../src/api-clients/SECWebSearchClient.js';

// Mock global fetch
global.fetch = jest.fn();

describe('SECWebSearchClient (Exa-only)', () => {
  let client;
  let mockRateLimiter;
  let consoleWarnSpy;

  beforeEach(() => {
    mockRateLimiter = { enforce: jest.fn().mockResolvedValue() };
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    process.env.EXA_API_KEY = 'test-exa-key';
    client = new SECWebSearchClient(mockRateLimiter);
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    delete process.env.EXA_API_KEY;
  });

  describe('constructor', () => {
    test('initializes with rate limiter and EXA key', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
      expect(client.exaApiKey).toBe('test-exa-key');
    });

    test('warns if EXA_API_KEY not configured', () => {
      delete process.env.EXA_API_KEY;
      new SECWebSearchClient(mockRateLimiter);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('EXA_API_KEY not configured'));
    });
  });

  describe('searchSECFilingsWeb', () => {
    test('calls Exa with sec.gov domain restriction and maps filings', async () => {
      const text = [
        'Company Name: BASF SE',
        'CIK 0000012345',
        'ACCESSION NUMBER: 0000012345-24-000012',
        'Filed: 2024-08-15',
        'Report Date: 2024-06-30',
        'Form 10-Q'
      ].join('\n');

      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [{
        title: 'BASF SE - Form 10-Q',
        url: 'https://www.sec.gov/Archives/edgar/data/0000012345/000001234524000012/basf-20240630.htm',
        text,
        score: 0.95
      }] }) });

      const result = await client.searchSECFilingsWeb({ company_identifier: 'BASF', filing_type: '10-Q', limit: 1 });

      expect(mockRateLimiter.enforce).toHaveBeenCalledTimes(1);
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.includeDomains).toEqual(['www.sec.gov', 'sec.gov']);
      expect(body.query).toContain('site:sec.gov/Archives');
      expect(body.numResults).toBe(1);

      const data = JSON.parse(result.content[0].text);
      expect(data.filings.length).toBe(1);
      const f = data.filings[0];
      expect(f.form).toBe('10-Q');
      expect(f.filingDate).toBe('2024-08-15');
      expect(f.reportDate).toBe('2024-06-30');
      expect(f.edgar_url).toMatch(/sec\.gov\/Archives/);
    });
  });

  describe('getSECCompanyFactsWeb', () => {
    test('parses key metrics from recent filings text', async () => {
      // First call: search filings -> returns 1 filing
      const filingText = [
        'Company Name: ACME Corp',
        'Form 10-K',
        'Filed: 2024-03-01',
        'Total revenue $12,345,678',
        'Net income (loss) (1,234,567)',
        'Total assets $100,000,000',
        'Total liabilities $40,000,000',
        'Cash and cash equivalents $5,000,000'
      ].join('\n');

      global.fetch
        // searchSECFilingsWeb
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [{
          title: 'ACME Corp - Form 10-K',
          url: 'https://www.sec.gov/Archives/edgar/data/0000099999/000009999924000012/acme-20231231.htm',
          text: filingText,
          score: 0.92
        }] }) })
        // enrichFilingsWithText (url search)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [{ text: filingText }] }) });

      const res = await client.getSECCompanyFactsWeb({ company_identifier: 'ACME' });
      const data = JSON.parse(res.content[0].text);
      expect(data.key_metrics.Revenues?.[0]?.value).toBeGreaterThan(12000000 - 1);
      expect(data.key_metrics.NetIncomeLoss?.[0]?.value).toBeLessThan(0);
      expect(data.key_metrics.Assets?.[0]?.value).toBeGreaterThan(99000000);
      expect(data.key_metrics.Liabilities?.[0]?.value).toBeGreaterThan(39000000);
      expect(data.key_metrics.CashAndCashEquivalents?.[0]?.value).toBeGreaterThan(4900000);
    });
  });

  describe('getSECXBRLFramesWeb', () => {
    test('returns best-effort concept aggregation from web text', async () => {
      const text = [
        'Revenues $2,000,000',
        'Filed: 2024-02-01'
      ].join('\n');

      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [{
        title: 'ACME 10-Q',
        url: 'https://www.sec.gov/Archives/edgar/data/0000099999/000009999924000045/acme-20240331.htm',
        text
      }] }) });

      const out = await client.getSECXBRLFramesWeb({ taxonomy: 'us-gaap', concept: 'Revenues', unit: 'USD', period: 'CY2024', limit: 10 });
      const payload = JSON.parse(out.content[0].text);
      expect(payload.tag).toBe('Revenues');
      expect(payload.unit).toBe('USD');
      expect(payload.data.length).toBeGreaterThanOrEqual(1);
      expect(payload.data[0].value).toBeGreaterThan(1000000);
    });
  });

  describe('searchSECCompanyTickersWeb', () => {
    test('filters companies by search_term and optional exchange', async () => {
      const companies = {
        '0': { ticker: 'BASFY', title: 'BASF SE', cik_str: 12345, exchange: 'OTC' },
        '1': { ticker: 'ACM', title: 'ACME Corp', cik_str: 99999, exchange: 'NYSE' }
      };
      // Ensure mock is reset for this fetch (previous mocks consumed by other tests)
      global.fetch.mockReset();
      global.fetch.mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK', json: () => Promise.resolve(companies) });
      // Second invocation for the second search
      global.fetch.mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK', json: () => Promise.resolve(companies) });

      const r1 = await client.searchSECCompanyTickersWeb({ search_term: 'BASF' });
      const p1 = JSON.parse(r1.content[0].text);
      expect(p1.results.find(x => x.ticker === 'BASFY')).toBeTruthy();

      const r2 = await client.searchSECCompanyTickersWeb({ search_term: 'ACM', exchange: 'NYSE' });
      const p2 = JSON.parse(r2.content[0].text);
      expect(p2.results.length).toBe(1);
      expect(p2.results[0].ticker).toBe('ACM');
    });
  });

  describe('executeExaSearch errors', () => {
    test('throws when EXA_API_KEY missing', async () => {
      delete process.env.EXA_API_KEY;
      const c = new SECWebSearchClient(mockRateLimiter);
      await expect(c.executeExaSearch('q', 1, true)).rejects.toThrow('Exa API key not configured');
    });

    test('throws on non-ok Exa response', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 400, text: () => Promise.resolve('Bad Request') });
      await expect(client.executeExaSearch('q', 1, true)).rejects.toThrow('Exa API error: 400 - Bad Request');
    });
  });
});


