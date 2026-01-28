/**
 * Live tests for CPSCWebSearchClient
 * Tests real Exa API integration for CPSC recall searches
 */

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { CPSCWebSearchClient } from '../src/api-clients/CPSCWebSearchClient.js';

describe('CPSCWebSearchClient Live Tests', function() {
  let client;
  let apiKey;

  before(function() {
    apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      this.skip();
    }
  });

  beforeEach(function() {
    if (!apiKey) {
      this.skip();
    }

    const mockRateLimiter = {
      requests: [],
      windowMs: 60000,
      maxRequests: 10
    };
    client = new CPSCWebSearchClient(mockRateLimiter, apiKey);
  });

  describe('Basic Recall Search', function() {
    it('should successfully search for toy recalls', async function() {
      this.timeout(10000);
      
      const result = await client.searchRecallsWeb({
        search_term: 'toy car',
        limit: 5
      });

      expect(result).to.have.property('content');
      expect(result.content).to.be.an('array');
      expect(result.content[0]).to.have.property('text');

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).to.have.property('search_type', 'cpsc_recalls_web');
      expect(parsed).to.have.property('results');
      expect(parsed.results).to.be.an('array');

      // Verify results are from CPSC domain
      if (parsed.results.length > 0) {
        parsed.results.forEach(recall => {
          expect(recall.url).to.include('cpsc.gov');
          expect(recall).to.have.property('title');
        });
      }
    });

    it('should search for furniture recalls', async function() {
      this.timeout(10000);
      
      const result = await client.searchRecallsWeb({
        product_category: 'furniture',
        limit: 3
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.filters_applied.product_category).to.equal('furniture');
      expect(parsed.query).to.include('furniture OR chair OR table');

      if (parsed.results.length > 0) {
        parsed.results.forEach(recall => {
          expect(recall.url).to.include('cpsc.gov');
        });
      }
    });

    it('should search for fire hazard recalls', async function() {
      this.timeout(10000);
      
      const result = await client.searchRecallsWeb({
        hazard_type: 'fire',
        limit: 4
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.filters_applied.hazard).to.equal('fire');
      expect(parsed.query).to.include('FIRE OR BURN OR IGNITION');

      if (parsed.results.length > 0) {
        parsed.results.forEach(recall => {
          expect(recall.url).to.include('cpsc.gov');
        });
      }
    });
  });

  describe('Search with Enhanced Content', function() {
    it('should return snippets when requested', async function() {
      this.timeout(12000);
      
      const result = await client.searchRecallsWeb({
        search_term: 'children bicycle',
        include_snippet: true,
        limit: 3
      });

      const parsed = JSON.parse(result.content[0].text);
      
      if (parsed.results.length > 0) {
        const firstResult = parsed.results[0];
        expect(firstResult).to.have.property('snippet');
        expect(firstResult.snippet).to.be.a('string');
        expect(firstResult.snippet.length).to.be.at.most(503); // 500 + '...'
      }
    });

    it('should return full text when requested', async function() {
      this.timeout(15000);
      
      const result = await client.searchRecallsWeb({
        product_category: 'toys',
        include_text: true,
        limit: 2
      });

      const parsed = JSON.parse(result.content[0].text);
      
      if (parsed.results.length > 0) {
        const firstResult = parsed.results[0];
        expect(firstResult).to.have.property('full_text');
        expect(firstResult.full_text).to.be.a('string');
        expect(firstResult.full_text.length).to.be.greaterThan(100);
      }
    });

    it('should extract metadata from real recall results', async function() {
      this.timeout(12000);
      
      const result = await client.searchRecallsWeb({
        search_term: 'recall number',
        include_snippet: true,
        limit: 5
      });

      const parsed = JSON.parse(result.content[0].text);
      
      if (parsed.results.length > 0) {
        // Look for results with extracted metadata
        const resultsWithMetadata = parsed.results.filter(r => 
          r.recall_number || r.manufacturer || r.units_affected || r.hazard_type
        );
        
        if (resultsWithMetadata.length > 0) {
          const recall = resultsWithMetadata[0];
          console.log('Sample metadata extraction:', {
            recall_number: recall.recall_number,
            manufacturer: recall.manufacturer,
            hazard_type: recall.hazard_type,
            units_affected: recall.units_affected
          });
          
          // At least one type of metadata should be present
          expect(
            recall.recall_number || recall.manufacturer || 
            recall.units_affected || recall.hazard_type
          ).to.exist;
        }
      }
    });
  });

  describe('Advanced Search Features', function() {
    it('should handle manufacturer-specific searches', async function() {
      this.timeout(10000);
      
      const result = await client.searchRecallsWeb({
        recalling_firm: 'Fisher-Price',
        limit: 3
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.filters_applied.recalling_firm).to.equal('Fisher-Price');
      expect(parsed.query).to.include('"Fisher-Price"');

      if (parsed.results.length > 0) {
        parsed.results.forEach(recall => {
          expect(recall.url).to.include('cpsc.gov');
        });
      }
    });

    it('should handle date-based searches', async function() {
      this.timeout(10000);
      
      const result = await client.searchRecallsWeb({
        search_term: 'toy',
        date_after: '2023-01-01',
        date_before: '2023-12-31',
        limit: 3
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.filters_applied.date_range).to.include('2023-01-01');
      expect(parsed.filters_applied.date_range).to.include('2023-12-31');
      expect(parsed.query).to.include('recall date');
    });

    it('should handle complex multi-parameter searches', async function() {
      this.timeout(12000);
      
      const result = await client.searchRecallsWeb({
        search_term: 'children',
        product_category: 'toys',
        hazard_type: 'choking',
        limit: 4
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.query).to.include('"children"');
      expect(parsed.query).to.include('toy OR doll OR game');
      expect(parsed.query).to.include('CHOKING OR CHOKE OR SUFFOCATION');

      if (parsed.results.length > 0) {
        parsed.results.forEach(recall => {
          expect(recall.url).to.include('cpsc.gov');
          expect(recall).to.have.property('title');
        });
      }
    });
  });

  describe('Parameter Compatibility', function() {
    it('should handle legacy parameter names', async function() {
      this.timeout(10000);
      
      const result = await client.searchRecallsWeb({
        product_name: 'bicycle', // Legacy parameter name
        date_start: '2022-01-01', // Legacy parameter name
        date_end: '2023-12-31',   // Legacy parameter name
        limit: 3
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.filters_applied.product_name).to.equal('bicycle');
      expect(parsed.filters_applied.date_range).to.include('2022-01-01');
      expect(parsed.filters_applied.date_range).to.include('2023-12-31');
    });

    it('should handle new parameter names', async function() {
      this.timeout(10000);
      
      const result = await client.searchRecallsWeb({
        search_term: 'stroller',    // New parameter name
        hazard_type: 'fall',        // Alternative parameter name
        date_after: '2023-01-01',   // New parameter name
        date_before: '2023-06-01',  // New parameter name
        limit: 3
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.filters_applied.product_name).to.equal('stroller');
      expect(parsed.filters_applied.hazard).to.equal('fall');
      expect(parsed.filters_applied.date_range).to.include('2023-01-01');
    });
  });

  describe('Error Handling and Edge Cases', function() {
    it('should handle empty search gracefully', async function() {
      this.timeout(10000);
      
      const result = await client.searchRecallsWeb({
        limit: 5
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).to.have.property('results');
      expect(parsed.results).to.be.an('array');
      // Should still return some results even with minimal search
    });

    it('should respect limit parameter', async function() {
      this.timeout(10000);
      
      const result = await client.searchRecallsWeb({
        search_term: 'recall',
        limit: 2
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.results.length).to.be.at.most(2);
    });

    it('should handle searches with no results', async function() {
      this.timeout(10000);
      
      const result = await client.searchRecallsWeb({
        search_term: 'extremely_unlikely_product_name_xyz123',
        limit: 5
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.results).to.be.an('array');
      // Should return empty array or minimal results
    });
  });

  describe('Response Format Validation', function() {
    it('should return properly formatted response structure', async function() {
      this.timeout(10000);
      
      const result = await client.searchRecallsWeb({
        search_term: 'toy',
        limit: 3
      });

      // Validate MCP response format
      expect(result).to.have.property('content');
      expect(result.content).to.be.an('array');
      expect(result.content[0]).to.have.property('type', 'text');
      expect(result.content[0]).to.have.property('text');

      // Validate JSON structure
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).to.have.property('search_type', 'cpsc_recalls_web');
      expect(parsed).to.have.property('query');
      expect(parsed).to.have.property('total_results');
      expect(parsed).to.have.property('filters_applied');
      expect(parsed).to.have.property('results');

      // Validate result items structure
      if (parsed.results.length > 0) {
        const recall = parsed.results[0];
        expect(recall).to.have.property('title');
        expect(recall).to.have.property('url');
        expect(recall.url).to.be.a('string');
        expect(recall.url).to.include('cpsc.gov');
      }
    });

    it('should include proper metadata in response', async function() {
      this.timeout(10000);
      
      const result = await client.searchRecallsWeb({
        search_term: 'children toy',
        hazard_type: 'fire',
        product_category: 'toys',
        limit: 3
      });

      const parsed = JSON.parse(result.content[0].text);
      
      // Check filters_applied structure
      expect(parsed.filters_applied).to.have.property('product_name', 'children toy');
      expect(parsed.filters_applied).to.have.property('hazard', 'fire');
      expect(parsed.filters_applied).to.have.property('product_category', 'toys');
      
      // Check query includes expected terms
      expect(parsed.query).to.be.a('string');
      expect(parsed.query).to.include('site:cpsc.gov/recalls');
      expect(parsed.query).to.include('"children toy"');
    });
  });
});