/**
 * Unit tests for StateCourtRulesWebSearchClient
 * Tests all 12 tools independently to ensure module functionality
 * Tests are designed to run without impacting existing infrastructure
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { StateCourtRulesWebSearchClient } from '../../../src/api-clients/StateCourtRulesWebSearchClient.js';

// Mock global fetch
global.fetch = jest.fn();

describe('StateCourtRulesWebSearchClient - Standalone Module Tests', () => {
  let client;
  let mockRateLimiter;
  let consoleWarnSpy;

  beforeEach(() => {
    mockRateLimiter = { enforce: jest.fn().mockResolvedValue() };
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Ensure EXA_API_KEY is set for tests
    process.env.EXA_API_KEY = 'test-exa-key';

    client = new StateCourtRulesWebSearchClient(mockRateLimiter);
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    delete process.env.EXA_API_KEY;
  });

  // ===== MODULE INITIALIZATION TESTS =====

  describe('Module Initialization', () => {
    test('initializes successfully with rate limiter', () => {
      expect(client).toBeDefined();
      expect(client.rateLimiter).toBe(mockRateLimiter);
      expect(client.exaApiKey).toBe('test-exa-key');
    });

    test('initializes successfully without rate limiter', () => {
      const standaloneClient = new StateCourtRulesWebSearchClient();
      expect(standaloneClient).toBeDefined();
      expect(standaloneClient.rateLimiter).toBeNull();
    });

    test('has complete 50-state domain configuration', () => {
      expect(client.stateCourtDomains).toBeDefined();
      expect(Object.keys(client.stateCourtDomains)).toHaveLength(50);
      
      // Test specific state configurations
      expect(client.stateCourtDomains['CA']).toEqual({
        name: 'California',
        domains: ['courts.ca.gov', 'smartrules.com', 'ceb.com'],
        courtTypes: ['supreme', 'appeals', 'superior'],
        specialFeatures: ['electronic_filing', 'local_rules', 'formatting_strict']
      });

      expect(client.stateCourtDomains['NY']).toEqual({
        name: 'New York',
        domains: ['nycourts.gov', 'courts.state.ny.us', 'nysba.org'],
        courtTypes: ['appeals', 'supreme', 'county', 'family'],
        specialFeatures: ['commercial_division', 'nyscef_filing', 'cplr_compliance']
      });

      expect(client.stateCourtDomains['TX']).toEqual({
        name: 'Texas',
        domains: ['txcourts.gov', 'texasbar.com'],
        courtTypes: ['supreme', 'criminal_appeals', 'appeals', 'district'],
        specialFeatures: ['efiletexas_mandatory', 'double_spacing', 'no_pdf_security']
      });
    });

    test('has complete rule categories configuration', () => {
      expect(client.ruleCategories).toBeDefined();
      expect(client.ruleCategories.formatting).toContain('font');
      expect(client.ruleCategories.electronic).toContain('e-filing');
      expect(client.ruleCategories.procedural).toContain('motion practice');
      expect(client.ruleCategories.local).toContain('local rules');
      expect(client.ruleCategories.discovery).toContain('discovery rules');
      expect(client.ruleCategories.appellate).toContain('appellate rules');
      expect(client.ruleCategories.emergency).toContain('emergency procedures');
    });

    test('warns when EXA_API_KEY is not configured', () => {
      delete process.env.EXA_API_KEY;
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      new StateCourtRulesWebSearchClient();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'EXA_API_KEY not configured. State court rules search will not be available.'
      );
      
      consoleSpy.mockRestore();
    });
  });

  // ===== PHASE 2.1: CORE COURT RULES & FORMATTING TESTS =====

  describe('Phase 2.1: Core Court Rules & Formatting', () => {
    
    beforeEach(() => {
      // Mock executeExaSearch for controlled testing
      client.executeExaSearch = jest.fn().mockResolvedValue([
        {
          title: 'California Court Rules - Formatting Requirements',
          url: 'https://courts.ca.gov/rules/formatting',
          text: 'California courts require Century Schoolbook 13pt font with 1.5 line spacing and specific margin requirements for all filings.',
          publishedDate: '2024-01-01'
        },
        {
          title: 'Superior Court Local Rules',
          url: 'https://courts.ca.gov/local-rules',
          text: 'Local rules supplement statewide court rules and provide additional formatting and procedural requirements.'
        }
      ]);
    });

    describe('searchCourtRules', () => {
      test('searches court rules successfully with valid parameters', async () => {
        const result = await client.searchCourtRules({
          state: 'CA',
          rule_type: 'formatting',
          court_level: 'superior',
          limit: 5
        });

        expect(result.content).toBeDefined();
        expect(result.content[0].type).toBe('text');
        
        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('court_rules');
        expect(parsedResult.state).toBe('CA');
        expect(parsedResult.state_name).toBe('California');
        expect(parsedResult.rule_type).toBe('formatting');
        expect(parsedResult.court_level).toBe('superior');
        expect(parsedResult.results).toBeDefined();
      });

      test('validates state parameter', async () => {
        await expect(client.searchCourtRules({
          rule_type: 'formatting'
        })).rejects.toThrow('Invalid or missing state code');

        await expect(client.searchCourtRules({
          state: 'XX',
          rule_type: 'formatting'
        })).rejects.toThrow('Invalid or missing state code');
      });

      test('validates rule_type parameter', async () => {
        await expect(client.searchCourtRules({
          state: 'CA'
        })).rejects.toThrow('Invalid rule_type');

        await expect(client.searchCourtRules({
          state: 'CA',
          rule_type: 'invalid_type'
        })).rejects.toThrow('Invalid rule_type');
      });

      test('handles fallback search on primary search failure', async () => {
        client.executeExaSearch
          .mockRejectedValueOnce(new Error('Domain search failed'))
          .mockResolvedValueOnce([
            {
              title: 'California State Court Rules',
              url: 'https://example.com/ca-rules',
              text: 'Broader search result for California court rules formatting'
            }
          ]);

        const result = await client.searchCourtRules({
          state: 'CA',
          rule_type: 'formatting'
        });

        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('court_rules_fallback');
        expect(parsedResult.note).toContain('broader search');
      });
    });

    describe('getFormattingRequirements', () => {
      test('retrieves formatting requirements successfully', async () => {
        const result = await client.getFormattingRequirements({
          state: 'CA',
          court_level: 'superior',
          document_type: 'complaint'
        });

        expect(result.content).toBeDefined();
        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('formatting_requirements');
        expect(parsedResult.state).toBe('CA');
        expect(parsedResult.court_level).toBe('superior');
        expect(parsedResult.document_type).toBe('complaint');
      });

      test('validates state parameter', async () => {
        await expect(client.getFormattingRequirements({})).rejects.toThrow('Invalid or missing state code');
      });
    });

    describe('getElectronicFilingRules', () => {
      test('retrieves e-filing rules successfully', async () => {
        const result = await client.getElectronicFilingRules({
          state: 'TX',
          court_level: 'district'
        });

        expect(result.content).toBeDefined();
        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('electronic_filing_rules');
        expect(parsedResult.state).toBe('TX');
        expect(parsedResult.court_level).toBe('district');
      });
    });
  });

  // ===== PHASE 2.2: LOCAL RULES & VARIATIONS TESTS =====

  describe('Phase 2.2: Local Rules & Variations', () => {
    
    beforeEach(() => {
      client.executeExaSearch = jest.fn().mockResolvedValue([
        {
          title: 'Los Angeles County Superior Court Local Rules',
          url: 'https://courts.ca.gov/la-county-rules',
          text: 'Los Angeles County local rules provide specific procedures for motion practice and case management.'
        }
      ]);
    });

    describe('searchLocalRules', () => {
      test('searches local rules with county specification', async () => {
        const result = await client.searchLocalRules({
          state: 'CA',
          county: 'Los Angeles',
          rule_topic: 'motion practice'
        });

        expect(result.content).toBeDefined();
        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('local_rules');
        expect(parsedResult.county).toBe('Los Angeles');
        expect(parsedResult.rule_topic).toBe('motion practice');
      });
    });

    describe('getCourtSpecificProcedures', () => {
      test('retrieves court-specific procedures', async () => {
        const result = await client.getCourtSpecificProcedures({
          state: 'NY',
          court_name: 'Commercial Division',
          procedure_type: 'case management'
        });

        expect(result.content).toBeDefined();
        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('court_specific_procedures');
        expect(parsedResult.court_name).toBe('Commercial Division');
      });
    });

    describe('checkRuleUpdates', () => {
      test('checks for recent rule updates', async () => {
        const result = await client.checkRuleUpdates({
          state: 'FL',
          effective_after: '2025-01-01'
        });

        expect(result.content).toBeDefined();
        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('rule_updates');
        expect(parsedResult.effective_after).toBe('2025-01-01');
      });
    });
  });

  // ===== PHASE 2.3: TEMPLATES & DOCUMENT STANDARDS TESTS =====

  describe('Phase 2.3: Templates & Document Standards', () => {
    
    beforeEach(() => {
      client.executeExaSearch = jest.fn().mockResolvedValue([
        {
          title: 'California Complaint Template',
          url: 'https://courts.ca.gov/templates/complaint',
          text: 'Official template for civil complaints in California superior courts with required formatting.'
        }
      ]);
    });

    describe('getDocumentTemplates', () => {
      test('retrieves document templates successfully', async () => {
        const result = await client.getDocumentTemplates({
          state: 'CA',
          document_type: 'complaint',
          court_level: 'superior'
        });

        expect(result.content).toBeDefined();
        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('document_templates');
        expect(parsedResult.document_type).toBe('complaint');
      });

      test('requires document_type parameter', async () => {
        await expect(client.getDocumentTemplates({
          state: 'CA'
        })).rejects.toThrow('document_type is required');
      });
    });

    describe('validateDocumentCompliance', () => {
      test('validates document compliance', async () => {
        const result = await client.validateDocumentCompliance({
          state: 'CA',
          document_type: 'motion',
          compliance_area: 'formatting'
        });

        expect(result.content).toBeDefined();
        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('document_compliance');
        expect(parsedResult.compliance_area).toBe('formatting');
      });

      test('requires document_type parameter', async () => {
        await expect(client.validateDocumentCompliance({
          state: 'CA'
        })).rejects.toThrow('document_type is required');
      });
    });

    describe('getCitationRequirements', () => {
      test('retrieves citation requirements', async () => {
        const result = await client.getCitationRequirements({
          state: 'NY',
          citation_type: 'case'
        });

        expect(result.content).toBeDefined();
        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('citation_requirements');
        expect(parsedResult.citation_type).toBe('case');
      });
    });
  });

  // ===== PHASE 2.4: SPECIALIZED PRACTICE AREAS TESTS =====

  describe('Phase 2.4: Specialized Practice Areas', () => {
    
    beforeEach(() => {
      client.executeExaSearch = jest.fn().mockResolvedValue([
        {
          title: 'Texas Discovery Rules',
          url: 'https://txcourts.gov/discovery',
          text: 'Texas Rules of Civil Procedure governing discovery practice and limitations.'
        }
      ]);
    });

    describe('getDiscoveryRules', () => {
      test('retrieves discovery rules', async () => {
        const result = await client.getDiscoveryRules({
          state: 'TX',
          discovery_type: 'interrogatories'
        });

        expect(result.content).toBeDefined();
        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('discovery_rules');
        expect(parsedResult.discovery_type).toBe('interrogatories');
      });
    });

    describe('getAppellateRequirements', () => {
      test('retrieves appellate requirements', async () => {
        const result = await client.getAppellateRequirements({
          state: 'CA',
          brief_type: 'opening'
        });

        expect(result.content).toBeDefined();
        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('appellate_requirements');
        expect(parsedResult.brief_type).toBe('opening');
      });
    });

    describe('getEmergencyProcedures', () => {
      test('retrieves emergency procedures', async () => {
        const result = await client.getEmergencyProcedures({
          state: 'FL',
          emergency_type: 'TRO'
        });

        expect(result.content).toBeDefined();
        const parsedResult = JSON.parse(result.content[0].text);
        expect(parsedResult.search_type).toBe('emergency_procedures');
        expect(parsedResult.emergency_type).toBe('TRO');
      });
    });
  });

  // ===== HELPER METHODS TESTS =====

  describe('Helper Methods', () => {
    
    test('executeExaSearch makes correct API call', async () => {
      // Mock fetch for this test
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          results: [
            { title: 'Test Result', url: 'https://example.com', text: 'Test content' }
          ]
        })
      });

      const results = await client.executeExaSearch('test query', 5, true);

      expect(fetch).toHaveBeenCalledWith('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': 'test-exa-key'
        },
        body: JSON.stringify({
          query: 'test query',
          numResults: 5,
          contents: { text: true },
          liveCrawl: true,
          use_autoprompt: true
        })
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Test Result');
    });

    test('executeExaSearch handles API errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      });

      await expect(client.executeExaSearch('test query', 5, true))
        .rejects.toThrow('Exa API error: 400 - Bad Request');
    });

    test('executeExaSearch throws error when API key missing', async () => {
      const clientWithoutKey = new StateCourtRulesWebSearchClient();
      delete clientWithoutKey.exaApiKey;

      await expect(clientWithoutKey.executeExaSearch('test', 5, true))
        .rejects.toThrow('Exa API key not configured');
    });

    test('enforces rate limiting when rate limiter provided', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      await client.executeExaSearch('test query', 5, true);

      expect(mockRateLimiter.enforce).toHaveBeenCalled();
    });

    describe('Result validation methods', () => {
      const mockStateInfo = { name: 'California', domains: ['courts.ca.gov'] };
      
      test('isCourtRuleResult validates court rule content', () => {
        const validResult = {
          url: 'https://courts.ca.gov/rules',
          title: 'Court Rules',
          text: 'These court rules govern formatting requirements'
        };
        
        expect(client.isCourtRuleResult(validResult, mockStateInfo, 'formatting')).toBe(true);
        
        const invalidResult = {
          url: 'https://other-site.com',
          title: 'Random Content',
          text: 'Not related to court rules'
        };
        
        expect(client.isCourtRuleResult(invalidResult, mockStateInfo, 'formatting')).toBe(false);
      });

      test('isFormattingResult validates formatting content', () => {
        const formattingResult = {
          title: 'Font Requirements',
          text: 'Documents must use 12pt font with proper margins'
        };
        
        expect(client.isFormattingResult(formattingResult, mockStateInfo)).toBe(true);
      });

      test('isEFilingResult validates e-filing content', () => {
        const eFilingResult = {
          title: 'Electronic Filing Requirements',
          text: 'E-filing system requires PDF format with size limits'
        };
        
        expect(client.isEFilingResult(eFilingResult, mockStateInfo)).toBe(true);
      });
    });

    describe('Content extraction methods', () => {
      test('extractDomain extracts domain from URL', () => {
        expect(client.extractDomain('https://courts.ca.gov/rules')).toBe('courts.ca.gov');
        expect(client.extractDomain('invalid-url')).toBe('unknown');
      });

      test('calculateRelevanceScore calculates score based on keyword matches', () => {
        const result = {
          title: 'font requirements',
          text: 'formatting rules for court documents with proper margins and spacing'
        };
        
        const score = client.calculateRelevanceScore(result, 'formatting');
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(10);
      });

      test('extractFormattingCategory categorizes formatting content', () => {
        expect(client.extractFormattingCategory({ title: 'font rules' })).toBe('font_requirements');
        expect(client.extractFormattingCategory({ title: 'margin requirements' })).toBe('margin_spacing');
        expect(client.extractFormattingCategory({ title: 'page layout' })).toBe('page_layout');
        expect(client.extractFormattingCategory({ title: 'general formatting' })).toBe('general_formatting');
      });

      test('extractEffectiveDate finds dates in text', () => {
        expect(client.extractEffectiveDate({ text: 'Effective January 1, 2025' })).toBe('January');
        expect(client.extractEffectiveDate({ text: 'Rule effective 2024-12-31' })).toBe('2024-12-31');
        expect(client.extractEffectiveDate({ text: 'No date here' })).toBeNull();
      });
    });
  });

  // ===== INTEGRATION COMPATIBILITY TESTS =====

  describe('Integration Compatibility', () => {
    test('follows same pattern as existing Exa modules', () => {
      // Test that the module follows the established pattern
      expect(typeof client.executeExaSearch).toBe('function');
      expect(client.rateLimiter).toBeDefined();
      expect(client.exaApiKey).toBeDefined();
    });

    test('returns consistent result format', async () => {
      client.executeExaSearch = jest.fn().mockResolvedValue([
        { title: 'Test', url: 'https://example.com', text: 'Test content' }
      ]);

      const result = await client.searchCourtRules({
        state: 'CA',
        rule_type: 'formatting'
      });

      // Verify result follows the expected format
      expect(result).toHaveProperty('content');
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
      
      // Verify the text is valid JSON
      expect(() => JSON.parse(result.content[0].text)).not.toThrow();
    });

    test('handles all state codes correctly', () => {
      const stateCodes = Object.keys(client.stateCourtDomains);
      expect(stateCodes).toHaveLength(50);
      
      // Test a few random state codes
      expect(client.stateCourtDomains['CA']).toBeDefined();
      expect(client.stateCourtDomains['NY']).toBeDefined();
      expect(client.stateCourtDomains['TX']).toBeDefined();
      expect(client.stateCourtDomains['FL']).toBeDefined();
      expect(client.stateCourtDomains['WY']).toBeDefined(); // Last state alphabetically
    });
  });
});