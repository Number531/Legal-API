/**
 * Mock tests for CPSCWebSearchClient
 * Tests internal logic without making external API calls
 */

import { CPSCWebSearchClient } from '../src/api-clients/CPSCWebSearchClient.js';

describe('CPSCWebSearchClient Mock Tests', () => {
  let client;
  
  beforeEach(() => {
    // Create client with mock rate limiter but no real API key
    const mockRateLimiter = {
      requests: [],
      windowMs: 60000,
      maxRequests: 10
    };
    client = new CPSCWebSearchClient(mockRateLimiter, 'mock-api-key');
  });

  describe('Constructor', () => {
    it('should initialize with proper configuration', () => {
      expect(client.domains).toEqual(['cpsc.gov']);
      expect(client.hazardMappings).toHaveProperty('fire');
      expect(client.productCategories).toHaveProperty('toys');
      expect(client.safetyTerms).toContain('recall');
    });

    it('should warn when API key is missing', () => {
      const clientNoKey = new CPSCWebSearchClient(null, null);
      expect(clientNoKey.exaApiKey).toBeNull();
    });
  });

  describe('Query Building', () => {
    it('should build basic CPSC query', () => {
      const query = client.buildCPSCQuery({
        searchTerm: 'toy car'
      });
      
      expect(query).toContain('site:cpsc.gov/recalls');
      expect(query).toContain('"toy car"');
      expect(query).toContain('recall OR hazard');
    });

    it('should handle multiple search parameters', () => {
      const query = client.buildCPSCQuery({
        searchTerm: 'children bicycle',
        recalling_firm: 'ABC Company',
        hazardTerm: 'fall',
        product_category: 'toys'
      });
      
      expect(query).toContain('site:cpsc.gov/recalls');
      expect(query).toContain('"children bicycle"');
      expect(query).toContain('"ABC Company"');
      expect(query).toContain('FALL OR DROP OR TIP');
      expect(query).toContain('toy OR doll OR game');
    });

    it('should map hazard types correctly', () => {
      const query = client.buildCPSCQuery({
        hazardTerm: 'choking'
      });
      
      expect(query).toContain('CHOKING OR CHOKE OR SUFFOCATION');
    });

    it('should map product categories correctly', () => {
      const query = client.buildCPSCQuery({
        product_category: 'furniture'
      });
      
      expect(query).toContain('furniture OR chair OR table OR dresser');
    });

    it('should handle recall ID search', () => {
      const query = client.buildCPSCQuery({
        recall_id: '23-123'
      });
      
      expect(query).toContain('"23-123"');
    });

    it('should add date context when dates provided', () => {
      const query = client.buildCPSCQuery({
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      });
      
      expect(query).toContain('recall date');
    });
  });

  describe('Domain Checking', () => {
    it('should correctly identify CPSC domains', () => {
      expect(client.isCPSCDomain('https://www.cpsc.gov/recalls/2023/toy-recall')).toBe(true);
      expect(client.isCPSCDomain('https://cpsc.gov/some-page')).toBe(true);
      expect(client.isCPSCDomain('https://other-site.com')).toBe(false);
      expect(client.isCPSCDomain(null)).toBe(false);
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract recall number', () => {
      const result = {
        text: 'This recall involves product ABC with recall #: 23-123 affecting multiple units.'
      };
      
      const metadata = client.extractCPSCMetadata(result);
      expect(metadata).toHaveProperty('recall_number', '23-123');
    });

    it('should extract manufacturer information', () => {
      const result = {
        text: 'XYZ Corporation recalls dangerous product due to fire hazard.'
      };
      
      const metadata = client.extractCPSCMetadata(result);
      expect(metadata).toHaveProperty('manufacturer', 'XYZ Corporation');
    });

    it('should extract units affected', () => {
      const result = {
        text: 'The recall affects approximately 10,000 units sold nationwide.'
      };
      
      const metadata = client.extractCPSCMetadata(result);
      expect(metadata).toHaveProperty('units_affected', '10000');
    });

    it('should extract hazard type', () => {
      const result = {
        text: 'Product poses significant fire hazard to consumers in home use.'
      };
      
      const metadata = client.extractCPSCMetadata(result);
      expect(metadata).toHaveProperty('hazard_type', 'fire');
    });

    it('should extract injury count', () => {
      const result = {
        text: 'CPSC has received 15 injury reports related to this product defect.'
      };
      
      const metadata = client.extractCPSCMetadata(result);
      expect(metadata).toHaveProperty('injuries_reported', 15);
    });

    it('should handle missing metadata gracefully', () => {
      const result = {
        text: 'Some general text without specific recall information.'
      };
      
      const metadata = client.extractCPSCMetadata(result);
      expect(metadata).toBeNull();
    });
  });

  describe('Smart Snippet Extraction', () => {
    it('should prioritize HAZARD section', () => {
      const text = 'Some intro text. HAZARD: The product can catch fire causing burns and property damage. Additional details follow.';
      const snippet = client.extractSmartSnippet(text, 100);
      
      expect(snippet).toContain('HAZARD: The product can catch fire');
    });

    it('should prioritize REMEDY section', () => {
      const text = 'Product description here. REMEDY: Consumers should immediately stop using the product and contact the manufacturer. More info available.';
      const snippet = client.extractSmartSnippet(text, 100);
      
      expect(snippet).toContain('REMEDY: Consumers should immediately');
    });

    it('should handle short text without truncation', () => {
      const text = 'Short recall notice.';
      const snippet = client.extractSmartSnippet(text, 100);
      
      expect(snippet).toEqual(text);
      expect(snippet).not.toContain('...');
    });

    it('should truncate long text with ellipsis', () => {
      const longText = 'This is a very long text that exceeds the maximum length limit and should be truncated properly with ellipsis at the end to indicate more content is available.';
      const snippet = client.extractSmartSnippet(longText, 50);
      
      expect(snippet.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(snippet).toContain('...');
    });

    it('should clean and normalize whitespace', () => {
      const messyText = 'Text   with    irregular     spacing\n\nand    line breaks.';
      const snippet = client.extractSmartSnippet(messyText);
      
      expect(snippet).toEqual('Text with irregular spacing and line breaks.');
    });

    it('should handle empty or invalid input', () => {
      expect(client.extractSmartSnippet('')).toEqual('');
      expect(client.extractSmartSnippet(null)).toEqual('');
      expect(client.extractSmartSnippet(undefined)).toEqual('');
    });
  });

  describe('Result Mapping', () => {
    it('should map complete result correctly', () => {
      const mockResult = {
        title: 'ABC Corp Recalls Dangerous Toy Due to Fire Hazard',
        url: 'https://www.cpsc.gov/recalls/2023/abc-corp-recalls-toy',
        publishedDate: '2023-06-15',
        text: 'HAZARD: Product can ignite causing burns. REMEDY: Stop use immediately and contact company for full refund.',
        snippet: 'Fire hazard recall notice'
      };

      const mapped = client.mapCPSCResult(mockResult, false, true);
      
      expect(mapped).toHaveProperty('title', mockResult.title);
      expect(mapped).toHaveProperty('url', mockResult.url);
      expect(mapped).toHaveProperty('published_date', mockResult.publishedDate);
      expect(mapped).toHaveProperty('snippet');
      expect(mapped.snippet).toContain('HAZARD: Product can ignite');
    });

    it('should include full text when requested', () => {
      const mockResult = {
        title: 'Test Recall',
        url: 'https://cpsc.gov/test',
        text: 'Full text content of the recall notice.'
      };

      const mapped = client.mapCPSCResult(mockResult, true, false);
      
      expect(mapped).toHaveProperty('full_text', 'Full text content of the recall notice.');
    });

    it('should handle malformed results gracefully', () => {
      const badResult = null;
      const mapped = client.mapCPSCResult(badResult, false, false);
      
      expect(mapped).toBeNull();
    });

    it('should extract and include metadata', () => {
      const mockResult = {
        title: 'Recall #23-456',
        url: 'https://cpsc.gov/recall',
        text: 'XYZ Company recalls 5,000 products due to fire hazard. Consumers should return product for refund.'
      };

      const mapped = client.mapCPSCResult(mockResult, false, false);
      
      expect(mapped).toHaveProperty('recall_number', '23-456');
      expect(mapped).toHaveProperty('manufacturer', 'XYZ Company');
      expect(mapped).toHaveProperty('units_affected', '5000');
      expect(mapped).toHaveProperty('hazard_type', 'fire');
    });
  });

  describe('Parameter Validation', () => {
    it('should handle flexible parameter names', async () => {
      // Test that both old and new parameter names work
      const client = new CPSCWebSearchClient(null, 'test-key');
      
      // Mock the executeExaSearch method to avoid actual API calls
      client.executeExaSearch = async () => [{ 
        title: 'Test Result',
        url: 'https://cpsc.gov/test',
        id: 'test-id'
      }];

      // Test with old parameter names
      const result = await client.searchRecallsWeb({
        product_name: 'toy',
        date_start: '2023-01-01',
        date_end: '2023-12-31'
      });
      
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.filters_applied.product_name).toEqual('toy');
      expect(parsed.filters_applied.date_range).toContain('2023-01-01');
    });

    it('should handle alternative parameter names', async () => {
      const client = new CPSCWebSearchClient(null, 'test-key');
      
      client.executeExaSearch = async () => [{ 
        title: 'Test Result',
        url: 'https://cpsc.gov/test',
        id: 'test-id'
      }];

      // Test with new parameter names
      const result = await client.searchRecallsWeb({
        search_term: 'bicycle',
        hazard_type: 'fall',
        date_after: '2023-06-01',
        date_before: '2023-12-01'
      });
      
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.filters_applied.product_name).toEqual('bicycle');
      expect(parsed.filters_applied.hazard).toEqual('fall');
      expect(parsed.filters_applied.date_range).toContain('2023-06-01');
    });
  });
});