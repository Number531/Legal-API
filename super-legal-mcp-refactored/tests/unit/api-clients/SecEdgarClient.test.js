/**
 * Unit tests for SEC EDGAR API Client
 * Tests SEC EDGAR client methods with mocked dependencies
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SecEdgarClient } from '../../../src/api-clients/SecEdgarClient.js';

// Mock the API helpers
jest.mock('../../../src/utils/apiHelpers.js', () => ({
  resolveToCIK: jest.fn(),
  filterSECFilings: jest.fn(),
  extractKeyFinancialFacts: jest.fn(),
  makeSECApiRequest: jest.fn()
}));

// Mock the SEC API helper
jest.mock('../../../src/utils/secApiHelper.js', () => ({
  makeSECApiRequest: jest.fn()
}));

import { resolveToCIK, filterSECFilings, extractKeyFinancialFacts } from '../../../src/utils/apiHelpers.js';
import { makeSECApiRequest } from '../../../src/utils/secApiHelper.js';

describe('SecEdgarClient', () => {
  let client;
  let mockRateLimiter;

  beforeEach(() => {
    mockRateLimiter = {
      enforce: jest.fn().mockResolvedValue()
    };
    client = new SecEdgarClient(mockRateLimiter);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with rate limiter', () => {
      expect(client.rateLimiter).toBe(mockRateLimiter);
    });
  });

  describe('searchSECFilings', () => {
    test('should search SEC filings successfully', async () => {
      const mockCIK = '0001234567';
      const mockSubmissions = {
        name: 'Test Company',
        cik: mockCIK,
        sic: '1234',
        sicDescription: 'Test Industry',
        tickers: ['TEST'],
        filings: {
          recent: {
            accessionNumber: ['0001234567-23-000001'],
            filingDate: ['2023-12-31'],
            reportDate: ['2023-12-31'],
            form: ['10-K'],
            primaryDocument: ['test-10k.htm'],
            primaryDocDescription: ['10-K Annual Report']
          }
        }
      };

      const mockFilteredFilings = [{
        accessionNumber: '0001234567-23-000001',
        filingDate: '2023-12-31',
        reportDate: '2023-12-31',
        form: '10-K',
        primaryDocument: 'test-10k.htm',
        primaryDocDescription: '10-K Annual Report'
      }];

      resolveToCIK.mockResolvedValue(mockCIK);
      makeSECApiRequest.mockResolvedValue(mockSubmissions);
      filterSECFilings.mockReturnValue(mockFilteredFilings);

      const result = await client.searchSECFilings({
        company_identifier: 'TEST',
        filing_type: '10-K',
        limit: 10
      });

      expect(resolveToCIK).toHaveBeenCalledWith('TEST', mockRateLimiter);
      expect(makeSECApiRequest).toHaveBeenCalledWith(
        `/submissions/CIK${mockCIK.padStart(10, '0')}.json`,
        mockRateLimiter
      );
      expect(filterSECFilings).toHaveBeenCalled();

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.company.name).toBe('Test Company');
      expect(responseData.filings).toHaveLength(1);
      expect(responseData.filings[0].form).toBe('10-K');
    });

    test('should handle missing arguments', async () => {
      const mockCIK = '0001234567';
      const mockSubmissions = {
        name: 'Test Company',
        cik: mockCIK,
        filings: { recent: {} }
      };

      resolveToCIK.mockResolvedValue(mockCIK);
      makeSECApiRequest.mockResolvedValue(mockSubmissions);
      filterSECFilings.mockReturnValue([]);

      const result = await client.searchSECFilings();

      expect(result.content).toHaveLength(1);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.filings).toEqual([]);
    });

    test('should include financial facts when requested', async () => {
      const mockCIK = '0001234567';
      const mockSubmissions = {
        name: 'Test Company',
        cik: mockCIK,
        filings: { recent: {} }
      };
      const mockFacts = { facts: { 'us-gaap': {} } };
      const mockExtractedFacts = { revenue: { value: 1000000 } };

      resolveToCIK.mockResolvedValue(mockCIK);
      makeSECApiRequest
        .mockResolvedValueOnce(mockSubmissions)
        .mockResolvedValueOnce(mockFacts);
      filterSECFilings.mockReturnValue([]);
      extractKeyFinancialFacts.mockReturnValue(mockExtractedFacts);

      const result = await client.searchSECFilings({
        company_identifier: 'TEST',
        include_facts: true
      });

      expect(makeSECApiRequest).toHaveBeenCalledTimes(2);
      expect(extractKeyFinancialFacts).toHaveBeenCalledWith(mockFacts);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.financial_facts).toEqual(mockExtractedFacts);
    });

    test('should handle financial facts error gracefully', async () => {
      const mockCIK = '0001234567';
      const mockSubmissions = {
        name: 'Test Company',
        cik: mockCIK,
        filings: { recent: {} }
      };

      resolveToCIK.mockResolvedValue(mockCIK);
      makeSECApiRequest
        .mockResolvedValueOnce(mockSubmissions)
        .mockRejectedValueOnce(new Error('Facts not available'));
      filterSECFilings.mockReturnValue([]);

      const result = await client.searchSECFilings({
        company_identifier: 'TEST',
        include_facts: true
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.financial_facts).toBeNull();
    });

    test('should handle API errors', async () => {
      resolveToCIK.mockRejectedValue(new Error('Company not found'));

      await expect(client.searchSECFilings({
        company_identifier: 'UNKNOWN'
      })).rejects.toThrow('SEC filing search failed: Company not found');
    });
  });

  describe('getSECCompanyFacts', () => {
    test('should get company facts successfully', async () => {
      const mockCIK = '0001234567';
      const mockFacts = {
        entityName: 'Test Company',
        cik: mockCIK,
        facts: {
          'us-gaap': {
            'Revenues': { units: { USD: [{ val: 1000000 }] } },
            'Assets': { units: { USD: [{ val: 5000000 }] } }
          },
          'ifrs-full': {},
          'dei': {}
        }
      };
      const mockExtractedFacts = { revenue: { value: 1000000 } };

      resolveToCIK.mockResolvedValue(mockCIK);
      makeSECApiRequest.mockResolvedValue(mockFacts);
      extractKeyFinancialFacts.mockReturnValue(mockExtractedFacts);

      const result = await client.getSECCompanyFacts({
        company_identifier: 'TEST'
      });

      expect(resolveToCIK).toHaveBeenCalledWith('TEST', mockRateLimiter);
      expect(makeSECApiRequest).toHaveBeenCalledWith(
        `/api/xbrl/companyfacts/CIK${mockCIK.padStart(10, '0')}.json`,
        mockRateLimiter
      );

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.company.name).toBe('Test Company');
      expect(responseData.taxonomies).toEqual(['us-gaap', 'ifrs-full', 'dei']);
      expect(responseData.key_metrics).toEqual(mockExtractedFacts);
    });

    test('should get specific concept data', async () => {
      const mockCIK = '0001234567';
      const mockFacts = {
        entityName: 'Test Company',
        cik: mockCIK,
        facts: {
          'us-gaap': {
            'Revenues': { 
              units: { 
                USD: [
                  { val: 1000000, end: '2023-12-31', form: '10-K' }
                ] 
              } 
            }
          },
          'ifrs-full': {},
          'dei': {}
        }
      };

      resolveToCIK.mockResolvedValue(mockCIK);
      makeSECApiRequest.mockResolvedValue(mockFacts);

      const result = await client.getSECCompanyFacts({
        company_identifier: 'TEST',
        concept: 'Revenues'
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.concept).toBe('Revenues');
      expect(responseData.data['us-gaap']).toEqual(mockFacts.facts['us-gaap']['Revenues']);
      expect(responseData.available_concepts).toBeDefined();
    });

    test('should handle missing arguments', async () => {
      const mockCIK = '0001234567';
      const mockFacts = {
        entityName: 'Test Company',
        cik: mockCIK,
        facts: {}
      };

      resolveToCIK.mockResolvedValue(mockCIK);
      makeSECApiRequest.mockResolvedValue(mockFacts);
      extractKeyFinancialFacts.mockReturnValue({});

      const result = await client.getSECCompanyFacts();

      expect(result.content).toHaveLength(1);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.company.name).toBe('Test Company');
    });

    test('should handle API errors', async () => {
      resolveToCIK.mockRejectedValue(new Error('Company not found'));

      await expect(client.getSECCompanyFacts({
        company_identifier: 'UNKNOWN'
      })).rejects.toThrow('SEC company facts failed: Company not found');
    });
  });

  describe('getSECXBRLFrames', () => {
    test('should get XBRL frames successfully', async () => {
      const mockFrames = {
        taxonomy: 'us-gaap',
        tag: 'Revenues',
        label: 'Revenues',
        description: 'Total revenues',
        uom: 'USD',
        data: [
          {
            entityName: 'Company A',
            cik: '0001234567',
            val: 2000000,
            accn: '0001234567-23-000001',
            filed: '2023-03-15',
            form: '10-K'
          },
          {
            entityName: 'Company B',
            cik: '0007654321',
            val: 1000000,
            accn: '0007654321-23-000001',
            filed: '2023-03-10',
            form: '10-K'
          }
        ]
      };

      makeSECApiRequest.mockResolvedValue(mockFrames);

      const result = await client.getSECXBRLFrames({
        taxonomy: 'us-gaap',
        concept: 'Revenues',
        unit: 'USD',
        period: 'CY2023',
        limit: 100
      });

      expect(makeSECApiRequest).toHaveBeenCalledWith(
        '/api/xbrl/frames/us-gaap/Revenues/USD/CY2023.json',
        mockRateLimiter
      );

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.taxonomy).toBe('us-gaap');
      expect(responseData.tag).toBe('Revenues');
      expect(responseData.data).toHaveLength(2);
      expect(responseData.data[0].value).toBe(2000000); // Sorted by value descending
      expect(responseData.data[1].value).toBe(1000000);
    });

    test('should use default parameters', async () => {
      const mockFrames = {
        taxonomy: 'us-gaap',
        tag: 'test',
        data: []
      };

      makeSECApiRequest.mockResolvedValue(mockFrames);

      const result = await client.getSECXBRLFrames({
        concept: 'test',
        period: 'CY2023'
      });

      expect(makeSECApiRequest).toHaveBeenCalledWith(
        '/api/xbrl/frames/us-gaap/test/USD/CY2023.json',
        mockRateLimiter
      );

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.count).toBe(0);
    });

    test('should handle API errors', async () => {
      makeSECApiRequest.mockRejectedValue(new Error('Frames not found'));

      await expect(client.getSECXBRLFrames({
        concept: 'InvalidConcept',
        period: 'CY2023'
      })).rejects.toThrow('SEC XBRL frames failed: Frames not found');
    });
  });

  describe('searchSECCompanyTickers', () => {
    test('should search company tickers successfully', async () => {
      const mockTickers = {
        0: { ticker: 'AAPL', title: 'Apple Inc.', cik_str: 320193, exchange: 'NASDAQ' },
        1: { ticker: 'MSFT', title: 'Microsoft Corporation', cik_str: 789019, exchange: 'NASDAQ' },
        2: { ticker: 'GOOGL', title: 'Alphabet Inc.', cik_str: 1652044, exchange: 'NASDAQ' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTickers)
      });

      const result = await client.searchSECCompanyTickers({
        search_term: 'Apple'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.sec.gov/files/company_tickers.json',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      );

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.search_term).toBe('Apple');
      expect(responseData.count).toBe(1);
      expect(responseData.results[0].name).toBe('Apple Inc.');
      expect(responseData.results[0].ticker).toBe('AAPL');
    });

    test('should filter by exchange', async () => {
      const mockTickers = {
        0: { ticker: 'AAPL', title: 'Apple Inc.', cik_str: 320193, exchange: 'NASDAQ' },
        1: { ticker: 'IBM', title: 'International Business Machines', cik_str: 51143, exchange: 'NYSE' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTickers)
      });

      const result = await client.searchSECCompanyTickers({
        search_term: 'A',
        exchange: 'NASDAQ'
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.results).toHaveLength(1);
      expect(responseData.results[0].exchange).toBe('NASDAQ');
    });

    test('should sort results by relevance', async () => {
      const mockTickers = {
        0: { ticker: 'AAPL', title: 'Apple Inc.', cik_str: 320193, exchange: 'NASDAQ' },
        1: { ticker: 'AA', title: 'Alcoa Corporation', cik_str: 1675149, exchange: 'NYSE' },
        2: { ticker: 'AAL', title: 'American Airlines Group Inc.', cik_str: 6201, exchange: 'NASDAQ' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTickers)
      });

      const result = await client.searchSECCompanyTickers({
        search_term: 'AA'
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.results[0].ticker).toBe('AA'); // Exact match first
      expect(responseData.results[1].ticker).toBe('AAL'); // Starts with search term
      expect(responseData.results[2].ticker).toBe('AAPL'); // Contains search term
    });

    test('should handle fetch errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(client.searchSECCompanyTickers({
        search_term: 'TEST'
      })).rejects.toThrow('SEC ticker search failed: Failed to fetch company tickers: 500 Internal Server Error');
    });

    test('should handle missing arguments', async () => {
      const mockTickers = {
        0: { ticker: 'AAPL', title: 'Apple Inc.', cik_str: 320193, exchange: 'NASDAQ' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTickers)
      });

      const result = await client.searchSECCompanyTickers();

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.results).toHaveLength(1); // All companies match empty search
    });
  });
});