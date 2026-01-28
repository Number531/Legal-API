/**
 * Unit tests for Comprehensive Analysis Client
 * Tests cross-API analysis methods with mocked client dependencies
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ComprehensiveAnalysisClient } from '../../../src/api-clients/ComprehensiveAnalysisClient.js';

describe('ComprehensiveAnalysisClient', () => {
  let client;
  let mockClients;
  let mockDateNow;

  beforeEach(() => {
    mockClients = {
      courtListener: {
        searchCases: jest.fn(),
      },
      secEdgar: {
        searchSECFilings: jest.fn(),
      },
      federalRegister: {
        searchFederalRegister: jest.fn(),
      },
      uspto: {
        searchPatents: jest.fn(),
      },
    };
    client = new ComprehensiveAnalysisClient(mockClients);
    
    // Mock Date.now for consistent date ranges
    mockDateNow = jest.spyOn(Date, 'now');
    mockDateNow.mockReturnValue(new Date('2025-08-12T00:00:00.000Z').getTime());

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockDateNow.mockRestore();
  });

  describe('constructor', () => {
    test('should initialize with all required clients', () => {
      expect(client.courtListenerClient).toBe(mockClients.courtListener);
      expect(client.secEdgarClient).toBe(mockClients.secEdgar);
      expect(client.federalRegisterClient).toBe(mockClients.federalRegister);
      expect(client.usptoClient).toBe(mockClients.uspto);
    });
  });

  describe('comprehensiveLegalEntityAnalysis', () => {
    test('should perform all analyses when scope is "all"', async () => {
      // Mock successful responses for all clients
      mockClients.courtListener.searchCases.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ count: 5, results: [{ case_name: 'Case 1' }] }) }] });
      mockClients.secEdgar.searchSECFilings.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ filings: [{ form: '10-K' }], financial_facts: { revenue: 100 } }) }] });
      mockClients.federalRegister.searchFederalRegister.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ count: 3, results: [{ title: 'Reg 1' }] }) }] });
      mockClients.uspto.searchPatents.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ total_hits: 10, patents: [{ patent_title: 'Patent 1' }] }) }] });

      const args = { entity_name: 'TestCo', entity_type: 'company', analysis_scope: ['all'] };
      const result = await client.comprehensiveLegalEntityAnalysis(args);

      expect(mockClients.courtListener.searchCases).toHaveBeenCalled();
      expect(mockClients.secEdgar.searchSECFilings).toHaveBeenCalled();
      expect(mockClients.federalRegister.searchFederalRegister).toHaveBeenCalled();
      expect(mockClients.uspto.searchPatents).toHaveBeenCalled();

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.litigation).toBeDefined();
      expect(responseData.securities).toBeDefined();
      expect(responseData.regulatory).toBeDefined();
      expect(responseData.patents).toBeDefined();
      expect(responseData.insights).toBeDefined();
      expect(responseData.relationships).toBeDefined();
    });

    test('should perform specific analyses based on scope', async () => {
      mockClients.courtListener.searchCases.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ count: 1 }) }] });
      mockClients.secEdgar.searchSECFilings.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ filings: [] }) }] });

      const args = { entity_name: 'TestCo', entity_type: 'company', analysis_scope: ['litigation', 'securities'] };
      const result = await client.comprehensiveLegalEntityAnalysis(args);

      expect(mockClients.courtListener.searchCases).toHaveBeenCalled();
      expect(mockClients.secEdgar.searchSECFilings).toHaveBeenCalled();
      expect(mockClients.federalRegister.searchFederalRegister).not.toHaveBeenCalled();
      expect(mockClients.uspto.searchPatents).not.toHaveBeenCalled();

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.litigation).toBeDefined();
      expect(responseData.securities).toBeDefined();
      expect(responseData.regulatory).toBeUndefined();
      expect(responseData.patents).toBeUndefined();
    });

    test('should handle errors from individual client searches gracefully', async () => {
      mockClients.courtListener.searchCases.mockRejectedValue(new Error('Litigation error'));
      mockClients.secEdgar.searchSECFilings.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ filings: [] }) }] });
      mockClients.federalRegister.searchFederalRegister.mockRejectedValue(new Error('Regulatory error'));
      mockClients.uspto.searchPatents.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ total_hits: 0 }) }] });

      const args = { entity_name: 'TestCo', entity_type: 'company', analysis_scope: ['all'] };
      const result = await client.comprehensiveLegalEntityAnalysis(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.litigation.error).toBe('Litigation error');
      expect(responseData.securities).toBeDefined();
      expect(responseData.regulatory.error).toBe('Regulatory error');
      expect(responseData.patents).toBeDefined();
    });

    test('should not include relationships if include_relationships is false', async () => {
      mockClients.courtListener.searchCases.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ count: 0 }) }] });
      mockClients.secEdgar.searchSECFilings.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ filings: [] }) }] });
      mockClients.federalRegister.searchFederalRegister.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ count: 0 }) }] });
      mockClients.uspto.searchPatents.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ total_hits: 0 }) }] });

      const args = { entity_name: 'TestCo', entity_type: 'company', include_relationships: false };
      const result = await client.comprehensiveLegalEntityAnalysis(args);

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.relationships).toBeUndefined();
    });
  });

  describe('generateCrossSourceInsights', () => {
    test('should generate insights based on provided data', () => {
      const mockResults = {
        litigation: { count: 15, results: [] },
        securities: { filings: [{ form: '10-K' }], financial_facts: { revenue: { value: 1000000 } } },
        regulatory: { count: 7, results: [] },
        patents: { total_hits: 60, patents: [] }
      };

      const insights = client.generateCrossSourceInsights(mockResults);

      expect(insights.activity_summary.total_cases).toBe(15);
      expect(insights.activity_summary.sec_filings).toBe(1);
      expect(insights.activity_summary.latest_financials).toEqual({ revenue: { value: 1000000 } });
      expect(insights.activity_summary.regulatory_mentions).toBe(7);
      expect(insights.activity_summary.patents).toBe(60);

      expect(insights.risk_indicators).toHaveLength(1);
      expect(insights.risk_indicators[0].type).toBe('high_litigation_volume');
      expect(insights.notable_patterns).toHaveLength(2);
      expect(insights.notable_patterns[0].pattern).toBe('frequent_regulatory_attention');
      expect(insights.notable_patterns[1].pattern).toBe('significant_ip_portfolio');
    });

    test('should handle missing or error data gracefully', () => {
      const mockResults = {
        litigation: { error: 'Failed' },
        securities: null,
        regulatory: { count: 0 },
        patents: { total_hits: 0 }
      };

      const insights = client.generateCrossSourceInsights(mockResults);

      expect(insights.activity_summary.total_cases).toBeUndefined();
      expect(insights.activity_summary.sec_filings).toBeUndefined();
      expect(insights.risk_indicators).toHaveLength(0);
      expect(insights.notable_patterns).toHaveLength(0);
    });
  });

  describe('analyzeEntityRelationships', () => {
    test('should extract co-parties from litigation data', async () => {
      const mockData = {
        litigation: {
          results: [
            { case_name: 'Entity A v. Entity B' },
            { case_name: 'Entity A v. Entity C' },
            { case_name: 'Entity D v. Entity A' },
            { case_name: 'Another Case' }
          ]
        }
      };

      const relationships = await client.analyzeEntityRelationships('Entity A', mockData);

      expect(relationships.co_parties).toEqual(expect.arrayContaining(['Entity B', 'Entity C', 'Entity D']));
      expect(relationships.co_parties).toHaveLength(3);
    });

    test('should handle missing litigation data', async () => {
      const mockData = {};
      const relationships = await client.analyzeEntityRelationships('Entity A', mockData);
      expect(relationships.co_parties).toEqual([]);
    });

    test('should handle empty litigation results', async () => {
      const mockData = { litigation: { results: [] } };
      const relationships = await client.analyzeEntityRelationships('Entity A', mockData);
      expect(relationships.co_parties).toEqual([]);
    });
  });
});