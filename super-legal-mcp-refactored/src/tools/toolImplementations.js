/**
 * Tool Implementations Mapping
 * Maps tool names to their respective client methods
 *
 * Enhanced with optional ClaudeOrchestrator integration for Gemini-powered
 * intelligent extraction (Phase 3 Migration)
 */
import { thinkTool } from './thinkTool.js';

/**
 * Check if a query should be routed through the ClaudeOrchestrator
 * Complex multi-domain queries benefit from Gemini filtering
 *
 * @param {string} toolName - Name of the tool being called
 * @param {Object} args - Tool arguments
 * @returns {boolean} Whether to use orchestrator routing
 */
function shouldUseOrchestrator(toolName, args) {
  // Feature flag check
  if (process.env.ENABLE_GEMINI_FILTERING !== 'true') {
    return false;
  }

  // Skip orchestrator for detail/lookup tools that need specific IDs
  const detailTools = [
    'get_case_details', 'get_judge_details', 'get_financial_disclosure_details',
    'get_usc_section', 'nhtsa_decode_vin', 'get_audio_details', 'get_court_info',
    'get_sec_company_facts', 'get_epa_facility_compliance_report'
  ];

  if (detailTools.includes(toolName)) {
    return false;
  }

  // ALWAYS use Gemini for full text requests to avoid sending large docs to Claude
  // This routes full text through Gemini's 1M context for filtering
  if (args.include_text === true || args.include_full_text === true) {
    console.log(`📄 [Orchestrator] Full text requested for ${toolName} - routing through Gemini filter`);
    return true;
  }

  // Use orchestrator for search tools with complex queries
  const query = args.query || args.search_text || args.search_term || '';

  // Complex query indicators
  const isComplexQuery = query.length > 50 ||
    /\b(and|or|between|related|regarding|concerning|about)\b/i.test(query) ||
    /\d{4}/.test(query);  // Contains year

  return isComplexQuery;
}

/**
 * Map tool names to their domain modules for orchestrator routing
 */
const TOOL_DOMAIN_MAPPING = {
  // SEC/Securities
  'search_sec_filings': 'securities',
  'get_sec_company_facts': 'securities',
  'search_sec_company_tickers': 'securities',

  // FDA/Pharmaceutical
  'search_fda_drug_adverse_events': 'pharmaceutical_safety',
  'search_fda_device_events': 'pharmaceutical_safety',
  'search_fda_drug_labels': 'pharmaceutical_safety',
  'search_fda_recalls': 'pharmaceutical_safety',

  // EPA/Environmental
  'search_epa_facilities': 'environmental',
  'search_epa_violations': 'environmental',

  // CourtListener/Case Law
  'search_cases': 'case_law',
  'search_opinions': 'case_law',
  'lookup_citation': 'case_law',

  // GovInfo/Legislation
  'search_us_code': 'legislation',
  'search_federal_register': 'federal_register',

  // CPSC/NHTSA/Product Safety
  'search_cpsc_recalls': 'product_safety',
  'nhtsa_recalls_by_make_model_year': 'product_safety',

  // FTC/Antitrust
  'search_ftc_enforcement_cases': 'antitrust',
  'search_ftc_competition_matters': 'antitrust',

  // USPTO/Patent
  'search_patents': 'patent',
  'search_ptab_proceedings': 'patent_appeals',

  // State
  'search_court_rules': 'state_courts',
  'search_state_statute': 'state_statutes'
};

export function createToolImplementations(clients, conversationBridge = null, orchestrator = null) {
  const {
    courtListener,
    courtListenerWeb,
    financialDisclosure,
    federalRegisterWeb,
    uspto,
    usptoWeb,
    govInfo,
    exa,
    comprehensiveAnalysis,
    ptab,
    ptabWebSearch,
    ftcWeb,
    epa,
    epaWeb,
    fdaHybrid,
    fdaWeb,
    cpsc,
    nhtsaWeb,
    filingDraft,
    stateCourtRules,
    stateStatute,
    secWeb
  } = clients;

  // Parameter capping configuration
  const PARAMETER_CAPS = {
    // Default caps for all tools
    default: {
      limit: 5,
      include_snippet: false,
      include_text: false,
      include_full_text: false
    },

    // Tools that should not be capped (specific lookups that need exact data)
    noCap: [
      'get_case_details',
      'get_judge_details',
      'get_financial_disclosure_details',
      'get_usc_section',
      'nhtsa_decode_vin',
      'get_audio_details',
      'get_court_info'
    ]
  };

  // Universal parameter capping function
  function applyParameterCaps(toolName, args) {
    // Skip capping for detail/lookup tools that need specific IDs
    if (PARAMETER_CAPS.noCap.includes(toolName)) {
      return args;
    }

    // Create a copy to avoid mutating original args
    const cappedArgs = { ...args };

    // Apply smart limits based on content type
    if (cappedArgs.include_full_text === true) {
      // Full text requests get stricter limits (2 results)
      cappedArgs.limit = Math.min(cappedArgs.limit || 2, 2);
    } else {
      // Regular searches get standard limit (5 results)
      cappedArgs.limit = Math.min(cappedArgs.limit || 5, 5);
    }

    // Respect user-specified text flags (allow Gemini filtering to process full text)
    cappedArgs.include_snippet = Boolean(args.include_snippet);
    cappedArgs.include_text = Boolean(args.include_text);
    cappedArgs.include_full_text = Boolean(args.include_full_text);


    return cappedArgs;
  }

  // Helper function to wrap tool calls with conversation logging, parameter capping,
  // and optional orchestrator routing for Gemini-powered extraction
  const wrapWithConversation = (toolName, toolFunction) => {
    return async (args) => {
      // Apply parameter caps BEFORE calling the tool function
      const cappedArgs = applyParameterCaps(toolName, args);

      let result;

      // Check if we should route through orchestrator for intelligent extraction
      if (orchestrator && shouldUseOrchestrator(toolName, cappedArgs)) {
        try {
          const domain = TOOL_DOMAIN_MAPPING[toolName];
          const query = cappedArgs.query || cappedArgs.search_text || cappedArgs.search_term || '';

          console.log(`🤖 [Orchestrator] Routing ${toolName} through Gemini filtering (domain: ${domain})`);

          // Use orchestrator for filtered extraction
          const orchestratorResult = await orchestrator.research(query, {
            sessionId: cappedArgs.session_id,
            preferredModules: domain ? [domain] : undefined
          });

          // Format orchestrator result to match expected tool output
          result = {
            content: [{
              type: 'text',
              text: JSON.stringify({
                source: 'orchestrator',
                domain: domain,
                answer: orchestratorResult.answer,
                findings: orchestratorResult.findings || [],
                sessionId: orchestratorResult.sessionId,
                _gemini_filtered: true,
                _token_savings: 'estimated 70-80%'
              }, null, 2)
            }]
          };
        } catch (error) {
          console.warn(`⚠️ Orchestrator routing failed, falling back to direct call: ${error.message}`);
          // Fall back to direct tool call
          result = await toolFunction(cappedArgs);
        }
      } else {
        // Execute tool directly with capped parameters
        result = await toolFunction(cappedArgs);
      }

      // Log to conversation bridge if available and conversation_id is provided
      if (conversationBridge && cappedArgs.conversation_id) {
        try {
          await conversationBridge.logToolCall(toolName, cappedArgs, result, cappedArgs.conversation_id);
        } catch (error) {
          // Don't fail the tool call if conversation logging fails
          console.warn(`Failed to log ${toolName} to conversation:`, error.message);
        }
      }

      return result;
    };
  };

  return {
    // CourtListener tools (using web search as primary to avoid API issues)
    "search_cases": wrapWithConversation("search_cases", (args) => {
      // Map search_cases to web search with equivalent parameters
      return courtListenerWeb.searchOpinionsWeb({
        query: args.query || args.case_name || '',
        case_name: args.case_name,
        citation: args.citation,
        date_after: args.date_filed_after,
        date_before: args.date_filed_before,
        limit: Math.min(args.limit || 5, 5),  // Cap at 5 regardless of Claude's request
        include_snippet: false,
        include_full_text: args.include_full_text || false
      });
    }),
    "get_case_details": wrapWithConversation("get_case_details", (args) => courtListenerWeb.getCaseDetailsWeb(args)),
    "lookup_citation": wrapWithConversation("lookup_citation", (args) => {
      // Map lookup_citation to web search with equivalent parameters
      return courtListenerWeb.lookupCitationWeb({
        citation: args.citation,
        limit: Math.min(args.limit || 5, 5),  // Cap at 5 regardless of Claude's request
        include_snippet: false,
        include_full_text: args.include_full_text || false
      });
    }),
    "search_judges": wrapWithConversation("search_judges", (args) => courtListenerWeb.searchJudgesWeb(args)),
    "get_judge_details": wrapWithConversation("get_judge_details", (args) => courtListenerWeb.getJudgeDetailsWeb(args)),
    "get_court_info": wrapWithConversation("get_court_info", (args) => courtListenerWeb.getCourtInfoWeb(args)),
    "list_courts": wrapWithConversation("list_courts", (args) => courtListenerWeb.listCourtsWeb(args)),
    "search_opinions": wrapWithConversation("search_opinions", (args) => courtListenerWeb.searchOpinionsWeb(args)),
    "search_audio": wrapWithConversation("search_audio", (args) => courtListenerWeb.searchAudioWeb(args)),
    "get_audio_details": wrapWithConversation("get_audio_details", (args) => courtListenerWeb.getAudioDetailsWeb(args)),
    "get_opinion_with_citations": wrapWithConversation("get_opinion_with_citations", (args) => courtListenerWeb.getOpinionWithCitationsWeb(args)),
    "search_dockets": wrapWithConversation("search_dockets", (args) => courtListenerWeb.searchDocketsWeb(args)),


    // Financial Disclosure tools
    "search_financial_disclosures": wrapWithConversation("search_financial_disclosures", (args) => financialDisclosure.searchFinancialDisclosures(args)),
    "get_financial_disclosure_details": wrapWithConversation("get_financial_disclosure_details", (args) => financialDisclosure.getFinancialDisclosureDetails(args)),
    "search_judge_investments": wrapWithConversation("search_judge_investments", (args) => financialDisclosure.searchJudgeInvestments(args)),
    "get_judge_gifts": wrapWithConversation("get_judge_gifts", (args) => financialDisclosure.getJudgeGifts(args)),
    "get_judge_positions": wrapWithConversation("get_judge_positions", (args) => financialDisclosure.getJudgePositions(args)),
    "search_judge_spouse_income": wrapWithConversation("search_judge_spouse_income", (args) => financialDisclosure.searchJudgeSpouseIncome(args)),
    "search_judge_reimbursements": wrapWithConversation("search_judge_reimbursements", (args) => financialDisclosure.searchJudgeReimbursements(args)),
    "search_judge_debts": wrapWithConversation("search_judge_debts", (args) => financialDisclosure.searchJudgeDebts(args)),
    "get_disclosure_positions": wrapWithConversation("get_disclosure_positions", (args) => financialDisclosure.getDisclosurePositions(args)),

    // SEC tools - now fully web-based via Exa
    "search_sec_filings": wrapWithConversation("search_sec_filings", (args) => secWeb.searchSECFilingsWeb(args)),
    "get_sec_company_facts": wrapWithConversation("get_sec_company_facts", (args) => secWeb.getSECCompanyFactsWeb(args)),
    "get_sec_xbrl_frames": wrapWithConversation("get_sec_xbrl_frames", (args) => secWeb.getSECXBRLFramesWeb(args)),
    "search_sec_company_tickers": wrapWithConversation("search_sec_company_tickers", (args) => secWeb.searchSECCompanyTickersWeb(args)),

    // Federal Register tools (Phase 4.1 Hybrid)
    "search_federal_register": wrapWithConversation("search_federal_register", (args) => {
      // Use hybrid client with native-first strategy + smart fallback
      // Support both 'query' and 'search_term' parameter names for backward compatibility
      const searchTerm = args.search_term || args.query || '';

      // Transform date parameters: date_after/date_before → date_range
      let date_range = null;
      if (args.date_after || args.date_before) {
        const start = args.date_after || '';
        const end = args.date_before || '';
        date_range = `${start}..${end}`;
      }

      return federalRegisterWeb.searchFederalRegister({
        query: searchTerm,
        agency: args.agency,
        document_type: args.document_type?.toLowerCase(),
        date_range,
        limit: Math.min(args.limit || 5, 5)  // Cap at 5
      });
    }),
    "search_federal_register_notices": wrapWithConversation("search_federal_register_notices", (args) => {
      // Support both 'query' and 'search_term' parameter names for backward compatibility
      const searchTerm = args.search_term || args.query || '';

      // Transform date parameters
      let date_range = null;
      if (args.date_after || args.date_before) {
        const start = args.date_after || '';
        const end = args.date_before || '';
        date_range = `${start}..${end}`;
      }

      return federalRegisterWeb.searchFederalRegister({
        query: searchTerm,
        agency: args.agency,
        document_type: 'notice',
        date_range,
        limit: Math.min(args.limit || 5, 5)  // Cap at 5
      });
    }),
    "search_federal_register_proposed_rules": wrapWithConversation("search_federal_register_proposed_rules", (args) => {
      // Support both 'query' and 'search_term' parameter names for backward compatibility
      const searchTerm = args.search_term || args.query || '';

      // Transform date parameters
      let date_range = null;
      if (args.date_after || args.date_before) {
        const start = args.date_after || '';
        const end = args.date_before || '';
        date_range = `${start}..${end}`;
      }

      return federalRegisterWeb.searchFederalRegister({
        query: searchTerm,
        agency: args.agency,
        document_type: 'proposed_rule',
        date_range,
        limit: Math.min(args.limit || 5, 5)  // Cap at 5
      });
    }),
    "search_federal_register_final_rules": wrapWithConversation("search_federal_register_final_rules", (args) => {
      // Support both 'query' and 'search_term' parameter names for backward compatibility
      const searchTerm = args.search_term || args.query || '';

      // Transform date parameters
      let date_range = null;
      if (args.date_after || args.date_before) {
        const start = args.date_after || '';
        const end = args.date_before || '';
        date_range = `${start}..${end}`;
      }

      return federalRegisterWeb.searchFederalRegister({
        query: searchTerm,
        agency: args.agency,
        document_type: 'rule',
        date_range,
        limit: Math.min(args.limit || 5, 5)  // Cap at 5
      });
    }),
    "search_federal_register_presidential_documents": wrapWithConversation("search_federal_register_presidential_documents", (args) => {
      // Support both 'query' and 'search_term' parameter names for backward compatibility
      const searchTerm = args.search_term || args.query || '';

      // Transform date parameters
      let date_range = null;
      if (args.date_after || args.date_before) {
        const start = args.date_after || '';
        const end = args.date_before || '';
        date_range = `${start}..${end}`;
      }

      return federalRegisterWeb.searchFederalRegister({
        query: searchTerm,
        agency: args.agency,
        document_type: 'presidential_document',
        date_range,
        limit: Math.min(args.limit || 5, 5)  // Cap at 5
      });
    }),
    "search_federal_register_public_inspection": wrapWithConversation("search_federal_register_public_inspection", (args) => {
      // Support both 'query' and 'search_term' parameter names for backward compatibility
      const searchTerm = args.search_term || args.query || '';

      // Transform date parameters
      let date_range = null;
      if (args.date_after || args.date_before) {
        const start = args.date_after || '';
        const end = args.date_before || '';
        date_range = `${start}..${end}`;
      }

      return federalRegisterWeb.searchFederalRegister({
        query: searchTerm,
        agency: args.agency,
        document_type: 'public_inspection',
        date_range,
        limit: Math.min(args.limit || 5, 5)  // Cap at 5
      });
    }),

    // USPTO tools (using web search as primary to enhance discovery and coverage)
    "search_patents": wrapWithConversation("search_patents", (args) => {
      // Map to web search with equivalent parameters
      return usptoWeb.searchPatentsWeb({
        query_type: args.query_type || 'patents',
        search_text: args.search_text,
        assignee_organization: args.assignee_organization,
        inventor_name: args.inventor_name,
        patent_date_start: args.patent_date_start,
        patent_date_end: args.patent_date_end,
        technology_area: args.technology_area,
        limit: Math.min(args.limit || 5, 5),  // Cap at 5 regardless of Claude's request
        include_snippet: false,
        include_text: false
      });
    }),
    "search_patent_locations": wrapWithConversation("search_patent_locations", (args) => {
      // Map to web search with equivalent parameters
      return usptoWeb.searchPatentLocationsWeb({
        location_city: args.location_city,
        location_state: args.location_state,
        location_country: args.location_country,
        min_patents: args.min_patents,
        limit: Math.min(args.limit || 5, 5),  // Cap at 5 regardless of Claude's request
        include_snippet: false,
        include_text: false
      });
    }),
    "search_cpc_classifications": wrapWithConversation("search_cpc_classifications", (args) => {
      // Map to web search with equivalent parameters
      return usptoWeb.searchCPCClassificationsWeb({
        cpc_section: args.cpc_section,
        cpc_subsection_id: args.cpc_subsection_id,
        search_text: args.search_text,
        limit: Math.min(args.limit || 5, 5),  // Cap at 5 regardless of Claude's request
        include_snippet: false,
        include_text: false
      });
    }),
    "search_cpc_groups": wrapWithConversation("search_cpc_groups", (args) => {
      // Map to web search with equivalent parameters
      return usptoWeb.searchCPCGroupsWeb({
        cpc_group_id: args.cpc_group_id,
        cpc_subclass_id: args.cpc_subclass_id,
        search_text: args.search_text,
        limit: Math.min(args.limit || 5, 5),  // Cap at 5 regardless of Claude's request
        include_snippet: false,
        include_text: false
      });
    }),
    "search_uspc_classifications": wrapWithConversation("search_uspc_classifications", (args) => {
      // Map to web search with equivalent parameters
      return usptoWeb.searchUSPCClassificationsWeb({
        classification_type: args.classification_type,
        uspc_mainclass_id: args.uspc_mainclass_id,
        search_text: args.search_text,
        limit: Math.min(args.limit || 5, 5),  // Cap at 5 regardless of Claude's request
        include_snippet: false,
        include_text: false
      });
    }),
    "search_wipo_classifications": wrapWithConversation("search_wipo_classifications", (args) => {
      // Map to web search with equivalent parameters
      return usptoWeb.searchWIPOClassificationsWeb({
        wipo_field_id: args.wipo_field_id,
        search_text: args.search_text,
        limit: Math.min(args.limit || 5, 5),  // Cap at 5 regardless of Claude's request
        include_snippet: false,
        include_text: false
      });
    }),

    // GovInfo USC tools (Phase 4.1 Hybrid)
    "search_us_code": wrapWithConversation("search_us_code", (args) => govInfo.searchUSCode(args)),
    "get_usc_section": wrapWithConversation("get_usc_section", (args) => govInfo.getUSCSection(args)),
    "get_usc_title_structure": wrapWithConversation("get_usc_title_structure", (args) => govInfo.getUSCTitleStructure(args)),
    "list_usc_titles": wrapWithConversation("list_usc_titles", (args) => govInfo.listUSCTitles(args)),

    // State Statute tools
    "search_state_statute": wrapWithConversation("search_state_statute", (args) => stateStatute.searchStateStatute(args)),

    // PTAB tools
    "search_ptab_proceedings": wrapWithConversation("search_ptab_proceedings", (args) => ptabWebSearch.searchPTABProceedings(args)),
    "get_ptab_decisions": wrapWithConversation("get_ptab_decisions", (args) => ptab.getDecisions(args)),
    
    // PTAB Web Search tools (for IPR/PGR/CBM missing from API)
    "search_ptab_ipr_proceedings": wrapWithConversation("search_ptab_ipr_proceedings", (args) => ptabWebSearch.searchIPRProceedings(args)),
    "search_ptab_pgr_proceedings": wrapWithConversation("search_ptab_pgr_proceedings", (args) => ptabWebSearch.searchPGRProceedings(args)),
    "search_ptab_cbm_proceedings": wrapWithConversation("search_ptab_cbm_proceedings", (args) => ptabWebSearch.searchCBMProceedings(args)),
    "search_all_ptab_aia_proceedings": wrapWithConversation("search_all_ptab_aia_proceedings", (args) => ptabWebSearch.searchAllAIAProceedings(args)),

    // FTC tools (consolidated from 12 to 6 endpoints)
    "search_ftc_enforcement_cases": wrapWithConversation("search_ftc_enforcement_cases", (args) => ftcWeb.searchEnforcementCasesWeb(args)),
    "search_ftc_competition_matters": wrapWithConversation("search_ftc_competition_matters", (args) => ftcWeb.searchCompetitionMattersWeb(args)),
    "search_ftc_guidance_policy": wrapWithConversation("search_ftc_guidance_policy", (args) => ftcWeb.searchGuidancePolicyWeb(args)),
    "search_ftc_rulemaking": wrapWithConversation("search_ftc_rulemaking", (args) => ftcWeb.searchRulemakingWeb(args)),
    "search_ftc_consumer_alerts": wrapWithConversation("search_ftc_consumer_alerts", (args) => ftcWeb.searchConsumerAlertsWeb(args)),
    "search_ftc_news": wrapWithConversation("search_ftc_news", (args) => ftcWeb.searchNewsWeb(args)),

    // EPA tools (using hybrid client with native_first strategy)
    "search_epa_facilities": wrapWithConversation("search_epa_facilities", (args) => {
      // Use hybrid client with native ECHO API first, websearch fallback
      return epa.searchFacilities(args);
    }),
    "get_epa_facility_compliance_report": wrapWithConversation("get_epa_facility_compliance_report", (args) => {
      // Use hybrid client with native DFR endpoint first, websearch fallback
      return epa.getFacilityCompliance(args);
    }),
    "search_epa_violations": wrapWithConversation("search_epa_violations", (args) => {
      // Use hybrid client with native violations API first, websearch fallback
      return epa.searchViolations(args);
    }),

    // EPA tools now use WebSearch by default (duplicate "_web" tools removed)

    // FDA tools (Hybrid: OpenFDA API + Exa fallback - Phase 4.4)
    "search_fda_drug_adverse_events": wrapWithConversation("search_fda_drug_adverse_events", (args) => fdaHybrid.searchDrugAdverseEvents(args)),
    "search_fda_device_events": wrapWithConversation("search_fda_device_events", (args) => fdaHybrid.searchDeviceEvents(args)),
    "search_fda_drug_labels": wrapWithConversation("search_fda_drug_labels", (args) => fdaHybrid.searchDrugLabels(args)),
    "search_fda_recalls": wrapWithConversation("search_fda_recalls", (args) => fdaHybrid.searchRecalls(args)),

    // FDA specialized tools (new)
    "search_fda_warning_letters": wrapWithConversation("search_fda_warning_letters", (args) => fdaWeb.searchWarningLettersWeb(args)),
    "search_fda_drug_safety_communications": wrapWithConversation("search_fda_drug_safety_communications", (args) => fdaWeb.searchDrugSafetyCommunicationsWeb(args)),
    "search_fda_device_safety_communications": wrapWithConversation("search_fda_device_safety_communications", (args) => fdaWeb.searchDeviceSafetyCommunicationsWeb(args)),
    "search_fda_drug_shortages": wrapWithConversation("search_fda_drug_shortages", (args) => fdaWeb.searchDrugShortagesWeb(args)),
    "search_fda_510k": wrapWithConversation("search_fda_510k", (args) => fdaWeb.search510kWeb(args)),
    "search_fda_pma_approvals": wrapWithConversation("search_fda_pma_approvals", (args) => fdaWeb.searchPMAApprovalsWeb(args)),
    "search_fda_orange_book": wrapWithConversation("search_fda_orange_book", (args) => fdaWeb.searchOrangeBookWeb(args)),
    "search_fda_purple_book": wrapWithConversation("search_fda_purple_book", (args) => fdaWeb.searchPurpleBookWeb(args)),

    // CPSC tools (consolidated from 10 to 7 endpoints)
    "search_cpsc_recalls": wrapWithConversation("search_cpsc_recalls", (args) => cpsc.searchRecallsWeb(args)),
    "search_cpsc_enforcement": wrapWithConversation("search_cpsc_enforcement", (args) => cpsc.searchEnforcementWeb(args)),
    "search_cpsc_business_guidance": wrapWithConversation("search_cpsc_business_guidance", (args) => cpsc.searchBusinessGuidanceWeb(args)),
    "search_cpsc_safety_standards": wrapWithConversation("search_cpsc_safety_standards", (args) => cpsc.searchSafetyStandardsWeb(args)),
    "search_cpsc_injury_data": wrapWithConversation("search_cpsc_injury_data", (args) => cpsc.searchInjuryDataWeb(args)),
    "search_cpsc_news": wrapWithConversation("search_cpsc_news", (args) => cpsc.searchNewsWeb(args)),
    "search_cpsc_reports_studies": wrapWithConversation("search_cpsc_reports_studies", (args) => cpsc.searchReportsStudiesWeb(args)),

    // NHTSA tools
    "nhtsa_decode_vin": wrapWithConversation("nhtsa_decode_vin", (args) => nhtsaWeb.decodeVinWeb(args)),
    "nhtsa_models_for_make": wrapWithConversation("nhtsa_models_for_make", (args) => nhtsaWeb.getModelsForMakeWeb(args)),
    "nhtsa_recalls_by_vin": wrapWithConversation("nhtsa_recalls_by_vin", (args) => nhtsaWeb.getRecallsByVinWeb(args)),
    "nhtsa_recalls_by_make_model_year": wrapWithConversation("nhtsa_recalls_by_make_model_year", (args) => nhtsaWeb.getRecallsByMakeModelYearWeb(args)),
    "nhtsa_search_complaints": wrapWithConversation("nhtsa_search_complaints", (args) => nhtsaWeb.searchComplaintsWeb(args)),
    "nhtsa_safety_ratings": wrapWithConversation("nhtsa_safety_ratings", (args) => nhtsaWeb.getSafetyRatingsWeb(args)),

    // Comprehensive analysis tools
    "comprehensive_legal_entity_analysis": wrapWithConversation("comprehensive_legal_entity_analysis", (args) => comprehensiveAnalysis.comprehensiveLegalEntityAnalysis(args)),

    // Filing draft tools
    "draft_legal_filing": wrapWithConversation("draft_legal_filing", (args) => filingDraft.draftLegalFiling(args)),

    // State Court Rules tools
    "search_court_rules": wrapWithConversation("search_court_rules", (args) => stateCourtRules.searchCourtRules(args)),
    "get_formatting_requirements": wrapWithConversation("get_formatting_requirements", (args) => stateCourtRules.getFormattingRequirements(args)),
    "get_electronic_filing_rules": wrapWithConversation("get_electronic_filing_rules", (args) => stateCourtRules.getElectronicFilingRules(args)),
    "search_local_rules": wrapWithConversation("search_local_rules", (args) => stateCourtRules.searchLocalRules(args)),
    "get_court_specific_procedures": wrapWithConversation("get_court_specific_procedures", (args) => stateCourtRules.getCourtSpecificProcedures(args)),
    "check_rule_updates": wrapWithConversation("check_rule_updates", (args) => stateCourtRules.checkRuleUpdates(args)),
    "get_document_templates": wrapWithConversation("get_document_templates", (args) => stateCourtRules.getDocumentTemplates(args)),
    "validate_document_compliance": wrapWithConversation("validate_document_compliance", (args) => stateCourtRules.validateDocumentCompliance(args)),
    "get_citation_requirements": wrapWithConversation("get_citation_requirements", (args) => stateCourtRules.getCitationRequirements(args)),
    "get_discovery_rules": wrapWithConversation("get_discovery_rules", (args) => stateCourtRules.getDiscoveryRules(args)),
    "get_appellate_requirements": wrapWithConversation("get_appellate_requirements", (args) => stateCourtRules.getAppellateRequirements(args)),
    "get_emergency_procedures": wrapWithConversation("get_emergency_procedures", (args) => stateCourtRules.getEmergencyProcedures(args)),

    // Think tool for structured reasoning (Appendix E)
    think: async (args) => thinkTool.handler(args)
  };
}