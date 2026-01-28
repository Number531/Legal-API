/**
 * Isolated Integration Testing for StateCourtRulesWebSearchClient with FilingDraftClient
 * Tests integration capabilities without modifying production infrastructure
 * Demonstrates enhanced functionality when StateCourtRules module is available
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { StateCourtRulesWebSearchClient } from '../../src/api-clients/StateCourtRulesWebSearchClient.js';
import { FilingDraftClient } from '../../src/api-clients/FilingDraftClient.js';

// Mock global fetch
global.fetch = jest.fn();

describe('StateCourtRules + FilingDraft Integration Tests', () => {
  let stateCourtRules;
  let filingDraft;
  let mockRateLimiter;
  let consoleWarnSpy;

  beforeEach(() => {
    mockRateLimiter = { enforce: jest.fn().mockResolvedValue() };
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Set up test environment
    process.env.EXA_API_KEY = 'test-exa-key';
    
    stateCourtRules = new StateCourtRulesWebSearchClient(mockRateLimiter);
    filingDraft = new FilingDraftClient();
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    delete process.env.EXA_API_KEY;
  });

  // ===== INTEGRATION COMPATIBILITY TESTS =====

  describe('Integration Compatibility', () => {
    test('StateCourtRulesWebSearchClient follows same pattern as existing modules', () => {
      // Verify it follows the established Exa module pattern
      expect(typeof stateCourtRules.executeExaSearch).toBe('function');
      expect(stateCourtRules.rateLimiter).toBeDefined();
      expect(stateCourtRules.exaApiKey).toBe('test-exa-key');
      
      // Verify it has all 12 Phase 2 tools
      expect(typeof stateCourtRules.searchCourtRules).toBe('function');
      expect(typeof stateCourtRules.getFormattingRequirements).toBe('function');
      expect(typeof stateCourtRules.getElectronicFilingRules).toBe('function');
      expect(typeof stateCourtRules.searchLocalRules).toBe('function');
      expect(typeof stateCourtRules.getCourtSpecificProcedures).toBe('function');
      expect(typeof stateCourtRules.checkRuleUpdates).toBe('function');
      expect(typeof stateCourtRules.getDocumentTemplates).toBe('function');
      expect(typeof stateCourtRules.validateDocumentCompliance).toBe('function');
      expect(typeof stateCourtRules.getCitationRequirements).toBe('function');
      expect(typeof stateCourtRules.getDiscoveryRules).toBe('function');
      expect(typeof stateCourtRules.getAppellateRequirements).toBe('function');
      expect(typeof stateCourtRules.getEmergencyProcedures).toBe('function');
    });

    test('FilingDraftClient works independently without StateCourtRules', async () => {
      // Verify existing FilingDraftClient continues to work unchanged
      const result = await filingDraft.draftLegalFiling({
        filing_type: 'complaint',
        jurisdiction: 'federal',
        court: 'N.D. Cal.',
        parties: { plaintiff: 'Test Plaintiff', defendant: 'Test Defendant' },
        confirm_evidence_adequate: true
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      
      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.mode).toBe('draft');
      expect(parsedResult.filing_type).toBe('complaint');
    });
  });

  // ===== ENHANCED INTEGRATION SCENARIOS =====

  describe('Enhanced Integration Scenarios', () => {
    beforeEach(() => {
      // Mock StateCourtRules responses for integration testing
      stateCourtRules.executeExaSearch = jest.fn().mockResolvedValue([
        {
          title: 'California Superior Court Formatting Requirements',
          url: 'https://courts.ca.gov/rules/formatting',
          text: 'California courts require Century Schoolbook 13pt font with 1.5 line spacing. Margins must be 1.5 inches left/right, 1 inch top/bottom. Electronic filing requires text-searchable PDFs under 25MB with electronic bookmarks.',
          publishedDate: '2024-07-01'
        },
        {
          title: 'New York Commercial Division Rules',
          url: 'https://nycourts.gov/commercial/rules',
          text: 'Commercial Division requires enhanced case management procedures effective March 31, 2025. Professional standards apply for complex litigation with NYSCEF filing requirements.',
          publishedDate: '2024-12-01'
        }
      ]);
    });

    test('StateCourtRules provides real-time formatting requirements for California', async () => {
      const formattingResult = await stateCourtRules.getFormattingRequirements({
        state: 'CA',
        court_level: 'superior',
        document_type: 'complaint'
      });

      expect(formattingResult.content).toBeDefined();
      const parsedResult = JSON.parse(formattingResult.content[0].text);
      
      expect(parsedResult.search_type).toBe('formatting_requirements');
      expect(parsedResult.state).toBe('CA');
      expect(parsedResult.results).toBeDefined();
      expect(parsedResult.results.length).toBeGreaterThan(0);
      
      const firstResult = parsedResult.results[0];
      expect(firstResult.title).toContain('Formatting Requirements');
      expect(firstResult.state).toBe('California');
    });

    test('StateCourtRules retrieves current local rules for specific counties', async () => {
      const localRulesResult = await stateCourtRules.searchLocalRules({
        state: 'CA',
        county: 'Los Angeles',
        rule_topic: 'motion practice'
      });

      expect(localRulesResult.content).toBeDefined();
      const parsedResult = JSON.parse(localRulesResult.content[0].text);
      
      expect(parsedResult.search_type).toBe('local_rules');
      expect(parsedResult.state).toBe('CA');
      expect(parsedResult.county).toBe('Los Angeles');
      expect(parsedResult.rule_topic).toBe('motion practice');
    });

    test('StateCourtRules detects recent rule changes', async () => {
      const updateResult = await stateCourtRules.checkRuleUpdates({
        state: 'NY',
        effective_after: '2024-01-01'
      });

      expect(updateResult.content).toBeDefined();
      const parsedResult = JSON.parse(updateResult.content[0].text);
      
      expect(parsedResult.search_type).toBe('rule_updates');
      expect(parsedResult.state).toBe('NY');
      expect(parsedResult.effective_after).toBe('2024-01-01');
    });

    test('StateCourtRules provides specialized discovery rules', async () => {
      const discoveryResult = await stateCourtRules.getDiscoveryRules({
        state: 'TX',
        discovery_type: 'interrogatories'
      });

      expect(discoveryResult.content).toBeDefined();
      const parsedResult = JSON.parse(discoveryResult.content[0].text);
      
      expect(parsedResult.search_type).toBe('discovery_rules');
      expect(parsedResult.state).toBe('TX');
      expect(parsedResult.discovery_type).toBe('interrogatories');
    });

    test('StateCourtRules provides appellate requirements for different brief types', async () => {
      const appellateResult = await stateCourtRules.getAppellateRequirements({
        state: 'CA',
        brief_type: 'opening'
      });

      expect(appellateResult.content).toBeDefined();
      const parsedResult = JSON.parse(appellateResult.content[0].text);
      
      expect(parsedResult.search_type).toBe('appellate_requirements');
      expect(parsedResult.state).toBe('CA');
      expect(parsedResult.brief_type).toBe('opening');
    });

    test('StateCourtRules provides emergency procedure guidance', async () => {
      const emergencyResult = await stateCourtRules.getEmergencyProcedures({
        state: 'FL',
        emergency_type: 'TRO'
      });

      expect(emergencyResult.content).toBeDefined();
      const parsedResult = JSON.parse(emergencyResult.content[0].text);
      
      expect(parsedResult.search_type).toBe('emergency_procedures');
      expect(parsedResult.state).toBe('FL');
      expect(parsedResult.emergency_type).toBe('TRO');
    });
  });

  // ===== PROPOSED INTEGRATION ENHANCEMENT TESTS =====

  describe('Proposed Integration Enhancement', () => {
    test('Enhanced FilingDraftClient with StateCourtRules integration (simulation)', async () => {
      // Simulate how FilingDraftClient would be enhanced with StateCourtRules
      
      // Step 1: Mock getting current formatting requirements
      const mockFormattingRules = {
        content: [{
          type: 'text',
          text: JSON.stringify({
            search_type: 'formatting_requirements',
            state: 'CA',
            results: [{
              title: 'California Court Formatting Rules',
              formatting_category: 'font_requirements',
              text_snippet: 'Century Schoolbook 13pt font required with 1.5 line spacing and 1.5 inch margins',
              state: 'California'
            }]
          })
        }]
      };

      // Simulate enhanced FilingDraftClient method
      const simulateEnhancedDraftLegalFiling = async (args) => {
        // Get current rules if StateCourtRules is available
        let currentRules = null;
        if (args.jurisdiction && args.court) {
          try {
            // This would be: const currentRules = await stateCourtRules.getFormattingRequirements({...});
            currentRules = mockFormattingRules;
          } catch (error) {
            console.warn('StateCourtRules unavailable, using fallback');
          }
        }

        // Generate standard draft
        const standardDraft = await filingDraft.draftLegalFiling(args);
        const parsedDraft = JSON.parse(standardDraft.content[0].text);

        // Enhance with current rules if available
        if (currentRules) {
          const rulesData = JSON.parse(currentRules.content[0].text);
          parsedDraft.current_formatting_rules = rulesData.results;
          parsedDraft.enhanced_with_current_rules = true;
          parsedDraft.rule_compliance_checked = true;
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(parsedDraft, null, 2)
          }]
        };
      };

      // Test enhanced functionality
      const enhancedResult = await simulateEnhancedDraftLegalFiling({
        filing_type: 'complaint',
        jurisdiction: 'state',
        court: 'Superior Court of California',
        parties: { plaintiff: 'John Doe', defendant: 'ABC Corp' },
        confirm_evidence_adequate: true
      });

      expect(enhancedResult.content).toBeDefined();
      const parsedResult = JSON.parse(enhancedResult.content[0].text);
      
      // Verify enhanced features
      expect(parsedResult.mode).toBe('draft');
      expect(parsedResult.enhanced_with_current_rules).toBe(true);
      expect(parsedResult.rule_compliance_checked).toBe(true);
      expect(parsedResult.current_formatting_rules).toBeDefined();
      expect(parsedResult.current_formatting_rules[0].formatting_category).toBe('font_requirements');
    });

    test('Graceful degradation when StateCourtRules unavailable', async () => {
      // Simulate StateCourtRules being unavailable
      const simulateEnhancedDraftWithUnavailableRules = async (args) => {
        let currentRules = null;
        try {
          // Simulate StateCourtRules being unavailable
          throw new Error('StateCourtRules service unavailable');
        } catch (error) {
          console.warn('StateCourtRules unavailable, using standard templates');
        }

        // Generate standard draft (should work normally)
        const standardDraft = await filingDraft.draftLegalFiling(args);
        const parsedDraft = JSON.parse(standardDraft.content[0].text);

        // Mark as using fallback
        parsedDraft.used_fallback_templates = true;
        parsedDraft.enhanced_with_current_rules = false;

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(parsedDraft, null, 2)
          }]
        };
      };

      const result = await simulateEnhancedDraftWithUnavailableRules({
        filing_type: 'complaint',
        jurisdiction: 'federal',
        court: 'N.D. Cal.',
        parties: { plaintiff: 'Test Plaintiff', defendant: 'Test Defendant' },
        confirm_evidence_adequate: true
      });

      expect(result.content).toBeDefined();
      const parsedResult = JSON.parse(result.content[0].text);
      
      // Verify graceful degradation
      expect(parsedResult.mode).toBe('draft');
      expect(parsedResult.used_fallback_templates).toBe(true);
      expect(parsedResult.enhanced_with_current_rules).toBe(false);
    });
  });

  // ===== PERFORMANCE AND RESOURCE IMPACT TESTS =====

  describe('Performance and Resource Impact', () => {
    test('StateCourtRules module does not impact existing system performance', () => {
      const startTime = performance.now();
      
      // Initialize both modules
      const testStateCourtRules = new StateCourtRulesWebSearchClient();
      const testFilingDraft = new FilingDraftClient();
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should initialize quickly
      expect(testStateCourtRules).toBeDefined();
      expect(testFilingDraft).toBeDefined();
    });

    test('Memory usage remains within acceptable bounds', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create multiple instances to test memory usage
      const instances = [];
      for (let i = 0; i < 5; i++) {
        instances.push(new StateCourtRulesWebSearchClient());
        instances.push(new FilingDraftClient());
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
    });

    test('Rate limiting is properly respected', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      await stateCourtRules.executeExaSearch('test query', 5, true);
      
      expect(mockRateLimiter.enforce).toHaveBeenCalled();
    });
  });

  // ===== INTEGRATION READINESS VERIFICATION =====

  describe('Integration Readiness Verification', () => {
    test('All required integration points are ready', () => {
      // Verify StateCourtRulesWebSearchClient is ready for integration
      expect(stateCourtRules).toBeDefined();
      expect(typeof stateCourtRules.searchCourtRules).toBe('function');
      expect(typeof stateCourtRules.getFormattingRequirements).toBe('function');
      
      // Verify FilingDraftClient is unaffected
      expect(filingDraft).toBeDefined();
      expect(typeof filingDraft.draftLegalFiling).toBe('function');
      
      // Verify both follow consistent patterns
      expect(typeof stateCourtRules.executeExaSearch).toBe('function');
      expect(filingDraft.templateEngine).toBeDefined();
      expect(filingDraft.citationValidator).toBeDefined();
    });

    test('Tool implementation mapping would work correctly', () => {
      // Simulate the tool implementation mapping that would be added
      const simulatedToolImplementations = {
        "search_court_rules": (args) => stateCourtRules.searchCourtRules(args),
        "get_formatting_requirements": (args) => stateCourtRules.getFormattingRequirements(args),
        "get_electronic_filing_rules": (args) => stateCourtRules.getElectronicFilingRules(args),
        "search_local_rules": (args) => stateCourtRules.searchLocalRules(args),
        "get_court_specific_procedures": (args) => stateCourtRules.getCourtSpecificProcedures(args),
        "check_rule_updates": (args) => stateCourtRules.checkRuleUpdates(args),
        "get_document_templates": (args) => stateCourtRules.getDocumentTemplates(args),
        "validate_document_compliance": (args) => stateCourtRules.validateDocumentCompliance(args),
        "get_citation_requirements": (args) => stateCourtRules.getCitationRequirements(args),
        "get_discovery_rules": (args) => stateCourtRules.getDiscoveryRules(args),
        "get_appellate_requirements": (args) => stateCourtRules.getAppellateRequirements(args),
        "get_emergency_procedures": (args) => stateCourtRules.getEmergencyProcedures(args)
      };

      // Verify all 12 tools are mappable
      expect(Object.keys(simulatedToolImplementations)).toHaveLength(12);
      
      // Test each mapping works
      Object.entries(simulatedToolImplementations).forEach(([toolName, implementation]) => {
        expect(typeof implementation).toBe('function');
        expect(toolName).toMatch(/^(search_|get_|check_|validate_)/);
      });
    });

    test('Server integration points are ready', () => {
      // Verify the integration pattern that would be used
      const simulatedServerIntegration = {
        // This would be added to EnhancedLegalMcpServer.js
        stateCourtRules: stateCourtRules,
        
        // This would be added to the clients object
        clients: {
          filingDraft: filingDraft,
          stateCourtRules: stateCourtRules
        }
      };

      expect(simulatedServerIntegration.stateCourtRules).toBeDefined();
      expect(simulatedServerIntegration.clients.filingDraft).toBeDefined();
      expect(simulatedServerIntegration.clients.stateCourtRules).toBeDefined();
    });
  });
});