/**
 * Unit tests for Tool Implementations mapping
 * Tests that tool names correctly map to their respective client methods
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { createToolImplementations } from '../../../src/tools/toolImplementations.js';

describe('createToolImplementations', () => {
  let mockClients;
  let toolImplementations;

  beforeEach(() => {
    // Create mock clients with mock methods
    mockClients = {
      courtListener: {
        searchCases: jest.fn(),
        getCaseDetails: jest.fn(),
        lookupCitation: jest.fn(),
        searchJudges: jest.fn(),
        getJudgeDetails: jest.fn(),
        getCourtInfo: jest.fn(),
        listCourts: jest.fn(),
        searchOpinions: jest.fn(),
        searchAudio: jest.fn(),
        getAudioDetails: jest.fn(),
        getOpinionWithCitations: jest.fn(),
        searchDockets: jest.fn(),
      },
      financialDisclosure: {
        searchFinancialDisclosures: jest.fn(),
        getFinancialDisclosureDetails: jest.fn(),
        searchJudgeInvestments: jest.fn(),
        getJudgeGifts: jest.fn(),
        getJudgePositions: jest.fn(),
        searchJudgeSpouseIncome: jest.fn(),
        searchJudgeReimbursements: jest.fn(),
        searchJudgeDebts: jest.fn(),
        getDisclosurePositions: jest.fn(),
      },
      secEdgar: {
        searchSECFilings: jest.fn(),
        getSECCompanyFacts: jest.fn(),
        getSECXBRLFrames: jest.fn(),
        searchSECCompanyTickers: jest.fn(),
      },
      federalRegister: {
        searchFederalRegister: jest.fn(),
      },
      uspto: {
        searchPatents: jest.fn(),
        searchPatentLocations: jest.fn(),
        searchCPCClassifications: jest.fn(),
        searchCPCGroups: jest.fn(),
        searchUSPCClassifications: jest.fn(),
        searchWIPOClassifications: jest.fn(),
      },
      govInfo: {
        searchUSCode: jest.fn(),
        getUSCSection: jest.fn(),
        getUSCTitleStructure: jest.fn(),
        listUSCTitles: jest.fn(),
      },
      exa: {
        searchStateStatute: jest.fn(),
      },
      comprehensiveAnalysis: {
        comprehensiveLegalEntityAnalysis: jest.fn(),
      },
    };

    toolImplementations = createToolImplementations(mockClients);
  });

  test('should return an object with all tool implementations', () => {
    expect(typeof toolImplementations).toBe('object');
    expect(Object.keys(toolImplementations).length).toBe(39); // Total number of tools
  });

  // Test CourtListener tools
  test('search_cases should call courtListener.searchCases', async () => {
    const args = { query: 'test' };
    await toolImplementations.search_cases(args);
    expect(mockClients.courtListener.searchCases).toHaveBeenCalledWith(args);
  });

  test('get_case_details should call courtListener.getCaseDetails', async () => {
    const args = { case_id: 123 };
    await toolImplementations.get_case_details(args);
    expect(mockClients.courtListener.getCaseDetails).toHaveBeenCalledWith(args);
  });

  test('lookup_citation should call courtListener.lookupCitation', async () => {
    const args = { citation: '123 U.S. 456' };
    await toolImplementations.lookup_citation(args);
    expect(mockClients.courtListener.lookupCitation).toHaveBeenCalledWith(args);
  });

  test('search_judges should call courtListener.searchJudges', async () => {
    const args = { name: 'John Doe' };
    await toolImplementations.search_judges(args);
    expect(mockClients.courtListener.searchJudges).toHaveBeenCalledWith(args);
  });

  test('get_judge_details should call courtListener.getJudgeDetails', async () => {
    const args = { judge_id: 1 };
    await toolImplementations.get_judge_details(args);
    expect(mockClients.courtListener.getJudgeDetails).toHaveBeenCalledWith(args);
  });

  test('get_court_info should call courtListener.getCourtInfo', async () => {
    const args = { court_id: 'scotus' };
    await toolImplementations.get_court_info(args);
    expect(mockClients.courtListener.getCourtInfo).toHaveBeenCalledWith(args);
  });

  test('list_courts should call courtListener.listCourts', async () => {
    const args = { limit: 5 };
    await toolImplementations.list_courts(args);
    expect(mockClients.courtListener.listCourts).toHaveBeenCalledWith(args);
  });

  test('search_opinions should call courtListener.searchOpinions', async () => {
    const args = { query: 'opinion' };
    await toolImplementations.search_opinions(args);
    expect(mockClients.courtListener.searchOpinions).toHaveBeenCalledWith(args);
  });

  test('search_audio should call courtListener.searchAudio', async () => {
    const args = { query: 'audio' };
    await toolImplementations.search_audio(args);
    expect(mockClients.courtListener.searchAudio).toHaveBeenCalledWith(args);
  });

  test('get_audio_details should call courtListener.getAudioDetails', async () => {
    const args = { audio_id: 1 };
    await toolImplementations.get_audio_details(args);
    expect(mockClients.courtListener.getAudioDetails).toHaveBeenCalledWith(args);
  });

  test('get_opinion_with_citations should call courtListener.getOpinionWithCitations', async () => {
    const args = { opinion_id: 1 };
    await toolImplementations.get_opinion_with_citations(args);
    expect(mockClients.courtListener.getOpinionWithCitations).toHaveBeenCalledWith(args);
  });

  test('search_dockets should call courtListener.searchDockets', async () => {
    const args = { docket_number: '123' };
    await toolImplementations.search_dockets(args);
    expect(mockClients.courtListener.searchDockets).toHaveBeenCalledWith(args);
  });

  // Test Financial Disclosure tools
  test('search_financial_disclosures should call financialDisclosure.searchFinancialDisclosures', async () => {
    const args = { judge_name: 'Judge X' };
    await toolImplementations.search_financial_disclosures(args);
    expect(mockClients.financialDisclosure.searchFinancialDisclosures).toHaveBeenCalledWith(args);
  });

  test('get_financial_disclosure_details should call financialDisclosure.getFinancialDisclosureDetails', async () => {
    const args = { disclosure_id: 1 };
    await toolImplementations.get_financial_disclosure_details(args);
    expect(mockClients.financialDisclosure.getFinancialDisclosureDetails).toHaveBeenCalledWith(args);
  });

  test('search_judge_investments should call financialDisclosure.searchJudgeInvestments', async () => {
    const args = { company_name: 'Apple' };
    await toolImplementations.search_judge_investments(args);
    expect(mockClients.financialDisclosure.searchJudgeInvestments).toHaveBeenCalledWith(args);
  });

  test('get_judge_gifts should call financialDisclosure.getJudgeGifts', async () => {
    const args = { judge_name: 'Judge X' };
    await toolImplementations.get_judge_gifts(args);
    expect(mockClients.financialDisclosure.getJudgeGifts).toHaveBeenCalledWith(args);
  });

  test('get_judge_positions should call financialDisclosure.getJudgePositions', async () => {
    const args = { judge_name: 'Judge X' };
    await toolImplementations.get_judge_positions(args);
    expect(mockClients.financialDisclosure.getJudgePositions).toHaveBeenCalledWith(args);
  });

  test('search_judge_spouse_income should call financialDisclosure.searchJudgeSpouseIncome', async () => {
    const args = { judge_name: 'Judge X' };
    await toolImplementations.search_judge_spouse_income(args);
    expect(mockClients.financialDisclosure.searchJudgeSpouseIncome).toHaveBeenCalledWith(args);
  });

  test('search_judge_reimbursements should call financialDisclosure.searchJudgeReimbursements', async () => {
    const args = { judge_name: 'Judge X' };
    await toolImplementations.search_judge_reimbursements(args);
    expect(mockClients.financialDisclosure.searchJudgeReimbursements).toHaveBeenCalledWith(args);
  });

  test('search_judge_debts should call financialDisclosure.searchJudgeDebts', async () => {
    const args = { judge_name: 'Judge X' };
    await toolImplementations.search_judge_debts(args);
    expect(mockClients.financialDisclosure.searchJudgeDebts).toHaveBeenCalledWith(args);
  });

  test('get_disclosure_positions should call financialDisclosure.getDisclosurePositions', async () => {
    const args = { disclosure_id: 1 };
    await toolImplementations.get_disclosure_positions(args);
    expect(mockClients.financialDisclosure.getDisclosurePositions).toHaveBeenCalledWith(args);
  });

  // Test SEC EDGAR tools
  test('search_sec_filings should call secEdgar.searchSECFilings', async () => {
    const args = { company_identifier: 'AAPL' };
    await toolImplementations.search_sec_filings(args);
    expect(mockClients.secEdgar.searchSECFilings).toHaveBeenCalledWith(args);
  });

  test('get_sec_company_facts should call secEdgar.getSECCompanyFacts', async () => {
    const args = { company_identifier: 'AAPL' };
    await toolImplementations.get_sec_company_facts(args);
    expect(mockClients.secEdgar.getSECCompanyFacts).toHaveBeenCalledWith(args);
  });

  test('get_sec_xbrl_frames should call secEdgar.getSECXBRLFrames', async () => {
    const args = { concept: 'Assets', period: 'CY2023' };
    await toolImplementations.get_sec_xbrl_frames(args);
    expect(mockClients.secEdgar.getSECXBRLFrames).toHaveBeenCalledWith(args);
  });

  test('search_sec_company_tickers should call secEdgar.searchSECCompanyTickers', async () => {
    const args = { search_term: 'Apple' };
    await toolImplementations.search_sec_company_tickers(args);
    expect(mockClients.secEdgar.searchSECCompanyTickers).toHaveBeenCalledWith(args);
  });

  // Test Federal Register tools
  test('search_federal_register should call federalRegister.searchFederalRegister', async () => {
    const args = { query: 'rule' };
    await toolImplementations.search_federal_register(args);
    expect(mockClients.federalRegister.searchFederalRegister).toHaveBeenCalledWith(args);
  });

  // Test USPTO tools
  test('search_patents should call uspto.searchPatents', async () => {
    const args = { query_type: 'patents', search_text: 'AI' };
    await toolImplementations.search_patents(args);
    expect(mockClients.uspto.searchPatents).toHaveBeenCalledWith(args);
  });

  test('search_patent_locations should call uspto.searchPatentLocations', async () => {
    const args = { location_city: 'Boston' };
    await toolImplementations.search_patent_locations(args);
    expect(mockClients.uspto.searchPatentLocations).toHaveBeenCalledWith(args);
  });

  test('search_cpc_classifications should call uspto.searchCPCClassifications', async () => {
    const args = { cpc_section: 'A' };
    await toolImplementations.search_cpc_classifications(args);
    expect(mockClients.uspto.searchCPCClassifications).toHaveBeenCalledWith(args);
  });

  test('search_cpc_groups should call uspto.searchCPCGroups', async () => {
    const args = { cpc_group_id: 'A01B1/00' };
    await toolImplementations.search_cpc_groups(args);
    expect(mockClients.uspto.searchCPCGroups).toHaveBeenCalledWith(args);
  });

  test('search_uspc_classifications should call uspto.searchUSPCClassifications', async () => {
    const args = { classification_type: 'mainclass', uspc_mainclass_id: '1' };
    await toolImplementations.search_uspc_classifications(args);
    expect(mockClients.uspto.searchUSPCClassifications).toHaveBeenCalledWith(args);
  });

  test('search_wipo_classifications should call uspto.searchWIPOClassifications', async () => {
    const args = { wipo_field_id: 'A' };
    await toolImplementations.search_wipo_classifications(args);
    expect(mockClients.uspto.searchWIPOClassifications).toHaveBeenCalledWith(args);
  });

  // Test GovInfo USC tools
  test('search_us_code should call govInfo.searchUSCode', async () => {
    const args = { search_text: 'constitution' };
    await toolImplementations.search_us_code(args);
    expect(mockClients.govInfo.searchUSCode).toHaveBeenCalledWith(args);
  });

  test('get_usc_section should call govInfo.getUSCSection', async () => {
    const args = { title: 1, section: '1' };
    await toolImplementations.get_usc_section(args);
    expect(mockClients.govInfo.getUSCSection).toHaveBeenCalledWith(args);
  });

  test('get_usc_title_structure should call govInfo.getUSCTitleStructure', async () => {
    const args = { title: 1 };
    await toolImplementations.get_usc_title_structure(args);
    expect(mockClients.govInfo.getUSCTitleStructure).toHaveBeenCalledWith(args);
  });

  test('list_usc_titles should call govInfo.listUSCTitles', async () => {
    const args = { year: 2023 };
    await toolImplementations.list_usc_titles(args);
    expect(mockClients.govInfo.listUSCTitles).toHaveBeenCalledWith(args);
  });

  // Test Exa tools
  test('search_state_statute should call exa.searchStateStatute', async () => {
    const args = { state: 'CA', query: 'property' };
    await toolImplementations.search_state_statute(args);
    expect(mockClients.exa.searchStateStatute).toHaveBeenCalledWith(args);
  });

  // Test Comprehensive Analysis tools
  test('comprehensive_legal_entity_analysis should call comprehensiveAnalysis.comprehensiveLegalEntityAnalysis', async () => {
    const args = { entity_name: 'Google', entity_type: 'company' };
    await toolImplementations.comprehensive_legal_entity_analysis(args);
    expect(mockClients.comprehensiveAnalysis.comprehensiveLegalEntityAnalysis).toHaveBeenCalledWith(args);
  });
});