/**
 * Formatter Registry - Central hub for all tool result formatters
 * 
 * This module exports all formatters used by the ConversationBridge
 * to format tool results for conversation display.
 */

import { courtListenerFormatter } from './courtlistener.js';
import { secFormatter } from './sec.js';
import { epaFormatter } from './epa.js';
import { ptabFormatter } from './ptab.js';
import { stateStatuteFormatter } from './state-statute.js';
import { federalRegisterFormatter } from './federal-register.js';
import { usptoFormatter } from './uspto.js';
import { govInfoFormatter } from './govinfo.js';

// Import new formatters
import {
  formatStateStatuteSearch,
  formatPTABIPRSearch,
  formatPTABPGRSearch,
  formatPTABCBMSearch,
  formatEPAFacilitiesWeb,
  formatComprehensiveAnalysis
} from './exa.js';

import {
  formatFTCHSRTerminations,
  formatFTCEnforcementActions,
  formatFDADrugAdverseEvents,
  formatFDADeviceEvents,
  formatFDARecalls,
  formatCPSCRecalls,
  formatNHTSAVinDecode,
  formatNHTSARecalls,
  formatNHTSAComplaints
} from './regulatory.js';

import {
  formatLegalFilingDraft,
  formatCourtRulesSearch,
  formatFormattingRequirements,
  formatElectronicFilingRules,
  formatLocalRulesSearch,
  formatCourtSpecificProcedures,
  formatDocumentComplianceValidation
} from './legal-services.js';

/**
 * Get all formatters as a map
 */
export function getFormatters() {
  return {
    // CourtListener tools
    'search_cases': courtListenerFormatter.searchCases,
    'get_case_details': courtListenerFormatter.caseDetails,
    'lookup_citation': courtListenerFormatter.lookupCitation,
    'search_judges': courtListenerFormatter.searchJudges,
    'get_judge_details': courtListenerFormatter.judgeDetails,
    'search_audio': courtListenerFormatter.searchAudio,
    'get_audio_details': courtListenerFormatter.audioDetails,
    'search_financial_disclosures': courtListenerFormatter.financialDisclosures,
    
    // SEC tools
    'sec_search': secFormatter.search,
    'sec_filings': secFormatter.filings,
    'sec_company_search': secFormatter.companySearch,
    
    // EPA tools
    'epa_search': epaFormatter.search,
    'epa_compliance_search': epaFormatter.complianceSearch,
    
    // PTAB tools
    'ptab_search': ptabFormatter.search,
    'ptab_proceedings': ptabFormatter.proceedings,
    
    // State statute tools
    'state_statute_search': stateStatuteFormatter.search,
    'state_code_search': stateStatuteFormatter.codeSearch,
    
    // Federal Register tools
    'federal_register_search': federalRegisterFormatter.search,
    'federal_rules_search': federalRegisterFormatter.rulesSearch,
    
    // USPTO tools
    'uspto_patent_search': usptoFormatter.patentSearch,
    'uspto_trademark_search': usptoFormatter.trademarkSearch,
    
    // GovInfo tools
    'govinfo_search': govInfoFormatter.search,
    'usc_search': govInfoFormatter.uscSearch,
    
    // Exa/Web Search tools
    'search_state_statute': formatStateStatuteSearch,
    'search_ptab_ipr_proceedings': formatPTABIPRSearch,
    'search_ptab_pgr_proceedings': formatPTABPGRSearch,
    'search_ptab_cbm_proceedings': formatPTABCBMSearch,
    'search_all_ptab_aia_proceedings': formatPTABIPRSearch, // Use IPR formatter for AIA
    'search_epa_facilities_web': formatEPAFacilitiesWeb,
    'get_epa_facility_compliance_web': formatEPAFacilitiesWeb,
    'search_epa_violations_web': formatEPAFacilitiesWeb,
    
    // Comprehensive analysis
    'comprehensive_legal_entity_analysis': formatComprehensiveAnalysis,
    
    // FTC tools
    'search_ftc_hsr_terminations': formatFTCHSRTerminations,
    'search_ftc_enforcement_actions': formatFTCEnforcementActions,
    
    // FDA tools
    'search_fda_drug_adverse_events': formatFDADrugAdverseEvents,
    'search_fda_device_events': formatFDADeviceEvents,
    'search_fda_drug_labels': formatFDADrugAdverseEvents, // Reuse drug formatter
    'search_fda_recalls': formatFDARecalls,
    
    // CPSC tools
    'search_cpsc_recalls': formatCPSCRecalls,
    
    // NHTSA tools
    'nhtsa_decode_vin': formatNHTSAVinDecode,
    'nhtsa_models_for_make': formatNHTSAVinDecode, // Reuse VIN formatter
    'nhtsa_recalls_by_vin': formatNHTSARecalls,
    'nhtsa_recalls_by_make_model_year': formatNHTSARecalls,
    'nhtsa_search_complaints': formatNHTSAComplaints,
    'nhtsa_safety_ratings': formatNHTSAVinDecode, // Reuse VIN formatter
    
    // Legal services tools
    'draft_legal_filing': formatLegalFilingDraft,
    'search_court_rules': formatCourtRulesSearch,
    'get_formatting_requirements': formatFormattingRequirements,
    'get_electronic_filing_rules': formatElectronicFilingRules,
    'search_local_rules': formatLocalRulesSearch,
    'get_court_specific_procedures': formatCourtSpecificProcedures,
    'check_rule_updates': formatCourtRulesSearch, // Reuse court rules formatter
    'get_document_templates': formatCourtRulesSearch, // Reuse court rules formatter
    'validate_document_compliance': formatDocumentComplianceValidation,
    'get_citation_requirements': formatFormattingRequirements, // Reuse formatting formatter
    'get_discovery_rules': formatLocalRulesSearch, // Reuse local rules formatter
    'get_appellate_requirements': formatCourtRulesSearch, // Reuse court rules formatter
    'get_emergency_procedures': formatCourtSpecificProcedures, // Reuse procedures formatter
    
    // Default formatter for unknown tools
    'default': (args, result) => {
      const count = Array.isArray(result) ? result.length : 1;
      return `✅ **Legal Research Tool Complete**\n\nTool: ${args.tool || 'Legal Search'}\nResults: ${count} items found\n\nResearch data available for review.`;
    }
  };
}

/**
 * Format a tool result using the appropriate formatter
 */
export function formatToolResult(toolName, args, result) {
  const formatters = getFormatters();
  const formatter = formatters[toolName] || formatters.default;
  return formatter(args, result);
}

/**
 * Get available formatter names
 */
export function getAvailableFormatters() {
  return Object.keys(getFormatters()).filter(name => name !== 'default');
}

/**
 * Check if a formatter exists for a tool
 */
export function hasFormatter(toolName) {
  const formatters = getFormatters();
  return toolName in formatters && toolName !== 'default';
}