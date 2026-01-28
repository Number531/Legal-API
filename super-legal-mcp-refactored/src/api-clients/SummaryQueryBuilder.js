/**
 * SummaryQueryBuilder.js
 *
 * Builds context-aware summary queries for Exa API's Gemini-2.5-Flash powered summaries.
 *
 * Key Features:
 * - Extracts user search terms from queries
 * - Generates natural language extraction prompts (aligned with Exa documentation)
 * - Integrates JSON schema field descriptions
 * - Provides graceful fallback to static queries
 *
 * Pattern: Uses Exa's documented "Provide [topic] information" style
 * instead of keyword-based queries for better Gemini extraction quality.
 *
 * Backward Compatibility: Always falls back to baseTerms if enhancement fails.
 */

export class SummaryQueryBuilder {
  /**
   * Create a new SummaryQueryBuilder
   * @param {Object} schema - Optional JSON Schema for extraction
   */
  constructor(schema = null) {
    this.schema = schema;
  }

  /**
   * Build context-aware summary query for Gemini extraction
   *
   * @param {Object} options
   * @param {string} options.userSearchTerm - User's search query
   * @param {string} options.dataType - Data type identifier (e.g., 'fda_adverse_event')
   * @param {Object} options.schema - JSON Schema v7 for structured extraction
   * @param {string} options.baseTerms - Fallback query if enhancement fails
   * @returns {string} Summary query for Exa API
   */
  build({ userSearchTerm, dataType, schema, baseTerms }) {
    // CRITICAL: Always fall back to baseTerms if anything goes wrong
    try {
      // Extract user's specific search term
      const userTerm = this._extractUserTerm(userSearchTerm);

      // If no user term found, use fallback
      if (!userTerm) {
        return baseTerms || '';
      }

      // Build enhanced natural language query
      return this._buildEnhancedQuery({ userTerm, dataType, schema, baseTerms });

    } catch (error) {
      // Log warning but don't crash - fallback ensures continuity
      console.warn('[SummaryQueryBuilder] Enhancement failed, using fallback:', error.message);
      return baseTerms || '';
    }
  }

  /**
   * Extract user's search term from query string
   * Handles quoted terms, site operators, boolean operators
   *
   * @param {string} searchTerm - Raw search query
   * @returns {string|null} Extracted term or null if not found
   * @private
   */
  _extractUserTerm(searchTerm) {
    // Validate input
    if (!searchTerm || typeof searchTerm !== 'string') {
      return null;
    }

    // Remove whitespace
    const trimmed = searchTerm.trim();
    if (trimmed.length === 0) {
      return null;
    }

    // Remove site: operators and parentheses
    let cleaned = trimmed
      .replace(/\(site:[^)]+\)/g, '')  // Remove (site:fda.gov)
      .replace(/site:\S+/g, '')         // Remove site:fda.gov
      .replace(/[()]/g, '')             // Remove remaining parens
      .trim();

    // Priority 1: Extract quoted terms (most specific)
    const quotedMatch = cleaned.match(/"([^"]+)"/);
    if (quotedMatch) {
      return quotedMatch[1];
    }

    // Priority 2: Extract first significant word (>3 chars, not operators)
    const words = cleaned.split(/\s+/)
      .filter(w => w.length > 3)  // Filter short words
      .filter(w => !['site:', 'AND', 'OR', 'NOT'].includes(w))  // Filter operators
      .filter(w => !/^[()]+$/.test(w));  // Filter punctuation-only

    if (words.length === 0) {
      return null;
    }

    // Return first significant word
    return words[0];
  }

  /**
   * Build enhanced natural language query
   * Uses Exa's documented "Provide [topic] information for [entity]" pattern
   *
   * @param {Object} params
   * @param {string} params.userTerm - Extracted user search term
   * @param {string} params.dataType - Data type identifier
   * @param {Object} params.schema - JSON Schema
   * @param {string} params.baseTerms - Fallback terms
   * @returns {string} Natural language extraction query
   * @private
   */
  _buildEnhancedQuery({ userTerm, dataType, schema, baseTerms }) {
    // Get human-readable description of data type
    const topicDescription = this._getDataTypeDescription(dataType);

    // Extract field descriptions from schema
    const schemaFields = this._getSchemaFields(schema);

    // Build natural language query following Exa's pattern
    let query = `Provide ${topicDescription} information for "${userTerm}"`;

    // Add schema field guidance if available
    if (schemaFields) {
      query += ` including ${schemaFields}`;
    }

    return query;
  }

  /**
   * Get human-readable description for data type
   * Maps technical data type IDs to natural language descriptions
   *
   * @param {string} dataType - Data type identifier
   * @returns {string} Human-readable description
   * @private
   */
  _getDataTypeDescription(dataType) {
    const descriptions = {
      // FDA - Primary data types
      'fda_adverse_event': 'adverse event',
      'fda_device_event': 'medical device event',
      'fda_recall': 'product recall',
      'fda_drug_label': 'drug labeling',

      // FDA - Additional data types
      'fda_warning_letter': 'FDA warning letter',
      'fda_safety_communication': 'drug safety communication',
      'fda_device_safety_communication': 'device safety communication',
      'fda_drug_shortage': 'drug shortage',
      'fda_510k': '510(k) premarket notification',
      'fda_pma': 'PMA premarket approval',
      'fda_orange_book': 'Orange Book therapeutic equivalence',
      'fda_purple_book': 'Purple Book biosimilar',

      // SEC
      'sec_filing': 'SEC filing',
      'sec_financial': 'financial',
      'sec_company': 'company',
      'sec_10k': '10-K annual report',
      'sec_10q': '10-Q quarterly report',
      'sec_8k': '8-K current report',
      'sec_proxy': 'proxy statement',

      // USPTO
      'patent': 'patent',
      'patent_classification': 'patent classification',
      'trademark': 'trademark registration',
      'patent_assignment': 'patent assignment',

      // EPA
      'epa_facility': 'EPA facility',
      'epa_compliance': 'environmental compliance',
      'epa_enforcement': 'enforcement action',
      'epa_permit': 'environmental permit',
      'epa_violation': 'environmental violation',

      // Legal / CourtListener
      'court_case': 'legal case',
      'case_law': 'court opinion',
      'statute': 'statute',
      'docket': 'court docket',
      'judge': 'judge',
      'opinion': 'court opinion',

      // Federal Register
      'federal_register_document': 'Federal Register document',
      'federal_register_rule': 'final rule',
      'federal_register_proposed_rule': 'proposed rule',
      'federal_register_notice': 'Federal Register notice',
      'federal_register_presidential_document': 'presidential document',
      'federal_register_public_inspection': 'public inspection document',

      // NHTSA
      'nhtsa_recall': 'vehicle recall',

      // Default
      'default': 'relevant'
    };

    return descriptions[dataType] || descriptions.default;
  }

  /**
   * Extract field descriptions from JSON Schema
   * Focuses on required fields with descriptions
   *
   * @param {Object} schema - JSON Schema v7
   * @returns {string|null} Comma-separated field descriptions or null
   * @private
   */
  _getSchemaFields(schema) {
    if (!schema || !schema.required || !schema.properties) {
      return null;
    }

    // Extract descriptions for required fields
    const descriptions = schema.required
      .map(field => {
        const prop = schema.properties[field];
        return prop?.description || field;  // Fallback to field name if no description
      })
      .filter(Boolean);  // Remove null/undefined

    if (descriptions.length === 0) {
      return null;
    }

    // Join into natural language list
    return descriptions.join(', ');
  }
}

export default SummaryQueryBuilder;
