/**
 * Integration tests for Data Consistency Across Tools
 * Ensures consistent data formats and error handling across different API clients.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { EnhancedLegalMcpServer } from '../../src/server/EnhancedLegalMcpServer.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Mock the MCP SDK Server
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn(),
  })),
}));
jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn(),
}));

// Mock all API clients to control their responses
jest.mock('../../src/api-clients/CourtListenerClient.js', () => ({
  CourtListenerClient: jest.fn(() => ({
    searchCases: jest.fn(),
  })),
}));
jest.mock('../../src/api-clients/SecEdgarClient.js', () => ({
  SecEdgarClient: jest.fn(() => ({
    searchSECFilings: jest.fn(),
    getSECCompanyFacts: jest.fn(),
    searchSECCompanyTickers: jest.fn(),
  })),
}));
jest.mock('../../src/api-clients/FederalRegisterClient.js', () => ({
  FederalRegisterClient: jest.fn(() => ({
    searchFederalRegister: jest.fn(),
  })),
}));
jest.mock('../../src/api-clients/UsptoClient.js', () => ({
  UsptoClient: jest.fn(() => ({
    searchPatents: jest.fn(),
  })),
}));
jest.mock('../../src/api-clients/GovInfoClient.js', () => ({
  GovInfoClient: jest.fn(() => ({
    searchUSCode: jest.fn(),
  })),
}));
jest.mock('../../src/api-clients/ExaClient.js', () => ({
  ExaClient: jest.fn(() => ({
    searchStateStatute: jest.fn(),
  })),
}));
jest.mock('../../src/api-clients/ComprehensiveAnalysisClient.js', () => ({
  ComprehensiveAnalysisClient: jest.fn(() => ({
    comprehensiveLegalEntityAnalysis: jest.fn(),
  })),
}));

// Mock utilities
jest.mock('../../src/utils/cache.js', () => ({
  startCacheCleanup: jest.fn(),
}));
jest.mock('../../src/config/apiConfig.js', () => ({
  rateLimiterConfigs: {
    sec_edgar: { requests: [], enforce: jest.fn() },
    federal_register: { requests: [], enforce: jest.fn() },
    uspto_patents: { requests: [], enforce: jest.fn() },
    govinfo: { requests: [], enforce: jest.fn() },
    exa: { requests: [], enforce: jest.fn() },
  },
}));

// Import actual modules after mocks
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SecEdgarClient } from '../../src/api-clients/SecEdgarClient.js';
import { CourtListenerClient } from '../../src/api-clients/CourtListenerClient.js';
import { FederalRegisterClient } from '../../src/api-clients/FederalRegisterClient.js';
import { UsptoClient } from '../../src/api-clients/UsptoClient.js';
import { GovInfoClient } from '../../src/api-clients/GovInfoClient.js';
import { ExaClient } from '../../src/api-clients/ExaClient.js';

describe('Data Consistency Across Tools', () => {
  let serverInstance;
  let callToolHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COURTLISTENER_API_TOKEN = 'test-token';
    serverInstance = new EnhancedLegalMcpServer();
    callToolHandler = Server.mock.results[0].value.setRequestHandler.mock.calls[1][1];
  });

  afterEach(() => {
    delete process.env.COURTLISTENER_API_TOKEN;
  });

  test('CIK format consistency across all SEC tools', async () => {
    const rawCik = 320193;
    const paddedCik = '0000320193';

    // Mock searchSECCompanyTickers to return raw CIK
    SecEdgarClient.mock.results[0].value.searchSECCompanyTickers.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ results: [{ ticker: 'AAPL', cik: String(rawCik) }] }) }]
    });
    // Mock searchSECFilings to expect padded CIK
    SecEdgarClient.mock.results[0].value.searchSECFilings.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ company: { cik: paddedCik }, filings: [] }) }]
    });
    // Mock getSECCompanyFacts to expect padded CIK
    SecEdgarClient.mock.results[0].value.getSECCompanyFacts.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ cik: paddedCik, facts: {} }) }]
    });

    // Simulate a workflow: search ticker -> use CIK in other tools
    const tickerResult = await callToolHandler({ params: { name: 'search_sec_company_tickers', arguments: { search_term: 'AAPL' } } });
    const retrievedCik = JSON.parse(tickerResult.content[0].text).results[0].cik;

    await callToolHandler({ params: { name: 'search_sec_filings', arguments: { company_identifier: retrievedCik } } });
    await callToolHandler({ params: { name: 'get_sec_company_facts', arguments: { company_identifier: retrievedCik } } });

    expect(SecEdgarClient.mock.results[0].value.searchSECFilings).toHaveBeenCalledWith(
      expect.objectContaining({ company_identifier: paddedCik })
    );
    expect(SecEdgarClient.mock.results[0].value.getSECCompanyFacts).toHaveBeenCalledWith(
      expect.objectContaining({ company_identifier: paddedCik })
    );
  });

  test('date format consistency across all tools (YYYY-MM-DD)', async () => {
    const testDate = '2023-04-01';

    // Mock client methods to receive and return dates in YYYY-MM-DD
    CourtListenerClient.mock.results[0].value.searchCases.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ results: [{ date_filed: testDate }] }) }]
    });
    SecEdgarClient.mock.results[0].value.searchSECFilings.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ filings: [{ filingDate: testDate }] }) }]
    });
    FederalRegisterClient.mock.results[0].value.searchFederalRegister.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ results: [{ publication_date: testDate }] }) }]
    });
    UsptoClient.mock.results[0].value.searchPatents.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ patents: [{ patent_date: testDate }] }) }]
    });
    GovInfoClient.mock.results[0].value.searchUSCode.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ results: [{ date_issued: testDate }] }) }]
    });
    ExaClient.mock.results[0].value.searchStateStatute.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ results: [{ published_date: testDate }] }) }]
    });

    await callToolHandler({ params: { name: 'search_cases', arguments: { query: 'test', date_filed_after: testDate } } });
    await callToolHandler({ params: { name: 'search_sec_filings', arguments: { company_identifier: 'test', date_after: testDate } } });
    await callToolHandler({ params: { name: 'search_federal_register', arguments: { query: 'test', date_range: `${testDate}..${testDate}` } } });
    await callToolHandler({ params: { name: 'search_patents', arguments: { query_type: 'patents', patent_date_start: testDate } } });
    await callToolHandler({ params: { name: 'search_us_code', arguments: { search_text: 'test', year: 2023 } } }); // GovInfo uses year, not date range directly for search
    await callToolHandler({ params: { name: 'search_state_statute', arguments: { state: 'CA', query: 'test' } } });

    expect(CourtListenerClient.mock.results[0].value.searchCases).toHaveBeenCalledWith(expect.objectContaining({ date_filed_after: testDate }));
    expect(SecEdgarClient.mock.results[0].value.searchSECFilings).toHaveBeenCalledWith(expect.objectContaining({ date_after: testDate }));
    expect(FederalRegisterClient.mock.results[0].value.searchFederalRegister).toHaveBeenCalledWith(expect.objectContaining({ date_range: `${testDate}..${testDate}` }));
    expect(UsptoClient.mock.results[0].value.searchPatents).toHaveBeenCalledWith(expect.objectContaining({ patent_date_start: testDate }));
    // For GovInfo and Exa, the date handling is internal to their clients, but we ensure the calls are made.
  });

  test('empty result handling consistency across all tools', async () => {
    const emptyResult = { content: [{ type: "text", text: JSON.stringify({ count: 0, results: [] }) }] };
    const emptySecResult = { content: [{ type: "text", text: JSON.stringify({ filings: [], financial_facts: null }) }] };
    const emptyUsptoResult = { content: [{ type: "text", text: JSON.stringify({ total_hits: 0, results: [] }) }] };

    CourtListenerClient.mock.results[0].value.searchCases.mockResolvedValue(emptyResult);
    SecEdgarClient.mock.results[0].value.searchSECFilings.mockResolvedValue(emptySecResult);
    FederalRegisterClient.mock.results[0].value.searchFederalRegister.mockResolvedValue(emptyResult);
    UsptoClient.mock.results[0].value.searchPatents.mockResolvedValue(emptyUsptoResult);
    GovInfoClient.mock.results[0].value.searchUSCode.mockResolvedValue(emptyResult);
    ExaClient.mock.results[0].value.searchStateStatute.mockResolvedValue(emptyResult);

    const clResult = await callToolHandler({ params: { name: 'search_cases', arguments: { query: 'empty' } } });
    const secResult = await callToolHandler({ params: { name: 'search_sec_filings', arguments: { company_identifier: 'empty' } } });
    const frResult = await callToolHandler({ params: { name: 'search_federal_register', arguments: { query: 'empty' } } });
    const usptoResult = await callToolHandler({ params: { name: 'search_patents', arguments: { query_type: 'patents', search_text: 'empty' } } });
    const govInfoResult = await callToolHandler({ params: { name: 'search_us_code', arguments: { search_text: 'empty' } } });
    const exaResult = await callToolHandler({ params: { name: 'search_state_statute', arguments: { state: 'CA', query: 'empty' } } });

    expect(JSON.parse(clResult.content[0].text).count).toBe(0);
    expect(JSON.parse(secResult.content[0].text).filings).toHaveLength(0);
    expect(JSON.parse(frResult.content[0].text).count).toBe(0);
    expect(JSON.parse(usptoResult.content[0].text).total_hits).toBe(0);
    expect(JSON.parse(govInfoResult.content[0].text).count).toBe(0);
    expect(JSON.parse(exaResult.content[0].text).total_results).toBe(0);
  });

  test('error message consistency (McpError wrapping)', async () => {
    const genericError = new Error('Generic API error');
    const mcpError = new McpError(ErrorCode.InvalidRequest, 'Specific validation error');

    // Mock clients to throw different types of errors
    CourtListenerClient.mock.results[0].value.searchCases.mockRejectedValue(genericError);
    SecEdgarClient.mock.results[0].value.searchSECFilings.mockRejectedValue(mcpError);

    // Test generic error wrapping
    await expect(callToolHandler({ params: { name: 'search_cases', arguments: { query: 'error' } } }))
      .rejects.toThrow(McpError);
    await expect(callToolHandler({ params: { name: 'search_cases', arguments: { query: 'error' } } }))
      .rejects.toHaveProperty('code', ErrorCode.InternalError);
    await expect(callToolHandler({ params: { name: 'search_cases', arguments: { query: 'error' } } }))
      .rejects.toHaveProperty('message', expect.stringContaining('Error executing search_cases: Generic API error'));

    // Test McpError re-throwing
    await expect(callToolHandler({ params: { name: 'search_sec_filings', arguments: { company_identifier: 'error' } } }))
      .rejects.toThrow(McpError);
    await expect(callToolHandler({ params: { name: 'search_sec_filings', arguments: { company_identifier: 'error' } } }))
      .rejects.toHaveProperty('code', ErrorCode.InvalidRequest);
    await expect(callToolHandler({ params: { name: 'search_sec_filings', arguments: { company_identifier: 'error' } } }))
      .rejects.toHaveProperty('message', 'Specific validation error');
  });
});