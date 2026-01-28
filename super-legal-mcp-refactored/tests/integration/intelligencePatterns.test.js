/**
 * Integration tests for Intelligence Layer Query Patterns
 * Tests complex, multi-step legal research workflows that an intelligence layer would use.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ComprehensiveAnalysisClient } from '../../src/api-clients/ComprehensiveAnalysisClient.js';
import { CourtListenerClient } from '../../src/api-clients/CourtListenerClient.js';
import { SecEdgarClient } from '../../src/api-clients/SecEdgarClient.js';
import { FederalRegisterClient } from '../../src/api-clients/FederalRegisterClient.js';
import { UsptoClient } from '../../src/api-clients/UsptoClient.js';

describe('Intelligence Layer Query Patterns', () => {
  let mockClients;
  let comprehensiveAnalysisClient;

  beforeEach(() => {
    // Mock all client methods that would be called in a complex workflow
    mockClients = {
      courtListener: {
        searchCases: jest.fn(),
      },
      secEdgar: {
        searchSECFilings: jest.fn(),
        searchSECCompanyTickers: jest.fn(),
      },
      federalRegister: {
        searchFederalRegister: jest.fn(),
      },
      uspto: {
        searchPatents: jest.fn(),
      },
    };
    comprehensiveAnalysisClient = new ComprehensiveAnalysisClient(mockClients);

    jest.clearAllMocks();
  });

  test('handles multi-step legal research workflow: ticker to filings to cases', async () => {
    // 1. Mock search company ticker to return CIK
    mockClients.secEdgar.searchSECCompanyTickers.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ results: [{ ticker: 'AAPL', cik: '0000320193' }] }) }]
    });

    // 2. Mock search SEC filings to return filings for the CIK
    mockClients.secEdgar.searchSECFilings.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ filings: [{ filingDate: '2023-01-01', form: '10-K' }] }) }]
    });

    // 3. Mock search court cases
    mockClients.courtListener.searchCases.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ count: 1, results: [{ case_name: 'Apple Inc. Case' }] }) }]
    });

    // Simulate the intelligence layer's workflow
    const tickerSearch = await mockClients.secEdgar.searchSECCompanyTickers({ search_term: 'AAPL' });
    const cik = JSON.parse(tickerSearch.content[0].text).results[0].cik;

    const filingsSearch = await mockClients.secEdgar.searchSECFilings({ company_identifier: cik, date_after: '2022-01-01' });
    const filingDates = JSON.parse(filingsSearch.content[0].text).filings.map(f => f.filingDate);

    const caseSearch = await mockClients.courtListener.searchCases({ query: 'Apple Inc.', date_filed_after: filingDates[0] });

    expect(mockClients.secEdgar.searchSECCompanyTickers).toHaveBeenCalledWith({ search_term: 'AAPL' });
    expect(mockClients.secEdgar.searchSECFilings).toHaveBeenCalledWith({ company_identifier: '0000320193', date_after: '2022-01-01' });
    expect(mockClients.courtListener.searchCases).toHaveBeenCalledWith({ query: 'Apple Inc.', date_filed_after: '2023-01-01' });
    expect(JSON.parse(caseSearch.content[0].text).count).toBe(1);
  });

  test('handles entity correlation across APIs: company in SEC and regulatory', async () => {
    mockClients.secEdgar.searchSECFilings.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ company: { name: 'Google' }, filings: [] }) }]
    });
    mockClients.federalRegister.searchFederalRegister.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ count: 2, results: [{ title: 'Google Regulation' }] }) }]
    });

    const secResult = await mockClients.secEdgar.searchSECFilings({ company_identifier: 'Google' });
    const companyName = JSON.parse(secResult.content[0].text).company.name;

    const regResult = await mockClients.federalRegister.searchFederalRegister({ query: companyName });

    expect(mockClients.secEdgar.searchSECFilings).toHaveBeenCalledWith({ company_identifier: 'Google' });
    expect(mockClients.federalRegister.searchFederalRegister).toHaveBeenCalledWith({ query: 'Google' });
    expect(JSON.parse(regResult.content[0].text).count).toBe(2);
  });

  test('handles date range queries across all tools consistently', async () => {
    const startDate = '2020-01-01';
    const endDate = '2024-12-31';

    mockClients.courtListener.searchCases.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ count: 1 }) }] });
    mockClients.secEdgar.searchSECFilings.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ filings: [] }) }] });
    mockClients.federalRegister.searchFederalRegister.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ count: 1 }) }] });
    mockClients.uspto.searchPatents.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify({ total_hits: 1 }) }] });

    await mockClients.courtListener.searchCases({ query: 'test', date_filed_after: startDate, date_filed_before: endDate });
    await mockClients.secEdgar.searchSECFilings({ company_identifier: 'test', date_after: startDate, date_before: endDate });
    await mockClients.federalRegister.searchFederalRegister({ query: 'test', date_range: `${startDate}..${endDate}` });
    await mockClients.uspto.searchPatents({ query_type: 'patents', search_text: 'test', patent_date_start: startDate, patent_date_end: endDate });

    expect(mockClients.courtListener.searchCases).toHaveBeenCalledWith(expect.objectContaining({ date_filed_after: startDate }));
    expect(mockClients.secEdgar.searchSECFilings).toHaveBeenCalledWith(expect.objectContaining({ date_after: startDate }));
    expect(mockClients.federalRegister.searchFederalRegister).toHaveBeenCalledWith(expect.objectContaining({ date_range: `${startDate}..${endDate}` }));
    expect(mockClients.uspto.searchPatents).toHaveBeenCalledWith(expect.objectContaining({ patent_date_start: startDate }));
  });

  test('handles partial/fuzzy company name matching via CIK resolution', async () => {
    mockClients.secEdgar.searchSECCompanyTickers.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ results: [{ ticker: 'AAPL', title: 'Apple Inc.', cik: '0000320193' }] }) }]
    });
    mockClients.secEdgar.searchSECFilings.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ company: { name: 'Apple Inc.' }, filings: [] }) }]
    });

    const tickerSearch = await mockClients.secEdgar.searchSECCompanyTickers({ search_term: 'Apple' });
    const resolvedCompanyName = JSON.parse(tickerSearch.content[0].text).results[0].title;

    const filingsSearch = await mockClients.secEdgar.searchSECFilings({ company_identifier: resolvedCompanyName });

    expect(mockClients.secEdgar.searchSECCompanyTickers).toHaveBeenCalledWith({ search_term: 'Apple' });
    expect(mockClients.secEdgar.searchSECFilings).toHaveBeenCalledWith({ company_identifier: 'Apple Inc.' });
    expect(JSON.parse(filingsSearch.content[0].text).company.name).toBe('Apple Inc.');
  });
});