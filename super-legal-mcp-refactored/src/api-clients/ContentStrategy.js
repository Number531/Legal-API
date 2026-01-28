/**
 * ContentStrategy.js
 * Determines optimal content retrieval strategy for Exa API calls
 *
 * Replaces the deprecated highlights parameter with appropriate
 * summary (with/without schema) or text strategies based on query context.
 */

/**
 * Content strategy types
 */
export const StrategyType = {
  SUMMARY_WITH_SCHEMA: 'summary_with_schema',
  SUMMARY_QUERY: 'summary_query',
  TEXT: 'text',
  TEXT_WITH_SUMMARY: 'text_with_summary'
};

/**
 * ContentStrategy class
 * Determines the best content retrieval strategy for Exa API calls
 */
export class ContentStrategy {
  /**
   * Constructor
   * @param {Object} schemaRegistry - Optional registry of domain-specific schemas
   */
  constructor(schemaRegistry = null) {
    this.schemaRegistry = schemaRegistry || {};
  }

  /**
   * Register a schema for a specific data type
   * @param {string} dataType - Data type identifier
   * @param {Object} schema - JSON Schema v7 object
   */
  registerSchema(dataType, schema) {
    this.schemaRegistry[dataType] = schema;
  }

  /**
   * Get registered schema for a data type
   * @param {string} dataType - Data type identifier
   * @returns {Object|null} Schema or null if not found
   */
  getSchema(dataType) {
    return this.schemaRegistry[dataType] || null;
  }

  /**
   * Determine optimal content strategy based on query options
   *
   * Decision logic (priority order):
   * 1. If includeFullText=true or limit ≤ 3 → TEXT (highest priority)
   * 2. If comprehensive=true → TEXT_WITH_SUMMARY
   * 3. If dataType specified and schema exists → SUMMARY_WITH_SCHEMA
   * 4. If highlightQuery provided → SUMMARY_QUERY (replaces highlights)
   * 5. Default → SUMMARY_QUERY
   *
   * @param {Object} options - Query options
   * @param {string} options.dataType - Type of data being extracted
   * @param {string} options.query - Search query
   * @param {string} options.domain - Legal domain (sec, uspto, epa, etc.)
   * @param {number} options.limit - Result limit
   * @param {boolean} options.includeFullText - Force full text retrieval
   * @param {string} options.highlightQuery - Query for content extraction (legacy)
   * @param {boolean} options.comprehensive - Request both text and summary
   * @returns {Object} Content configuration for Exa API
   */
  determine(options) {
    const {
      dataType,
      query,
      domain,
      limit = 10,
      includeFullText = false,
      highlightQuery = null,
      comprehensive = false
    } = options;

    // Strategy 1: Full text for low-limit queries or explicit request (HIGHEST PRIORITY)
    // Note: limit=2 should still use schema extraction (FDA optimization)
    if (includeFullText || limit < 2) {
      return this._createTextConfig();
    }

    // Strategy 2: Comprehensive mode - text + summary
    if (comprehensive) {
      return this._createTextWithSummary(highlightQuery || query);
    }

    // Strategy 3: Schema-based extraction for structured data
    if (dataType && this.schemaRegistry[dataType]) {
      return this._createSummaryWithSchema(dataType, query);
    }

    // Strategy 4: Summary query (replaces highlights)
    if (highlightQuery) {
      return this._createSummaryQuery(highlightQuery);
    }

    // Strategy 5: Default summary query based on search query
    return this._createSummaryQuery(query);
  }

  /**
   * Create summary configuration with JSON schema
   * @param {string} dataType - Data type identifier
   * @param {string} query - Search query for context
   * @returns {Object} Exa API contents config
   * @private
   */
  _createSummaryWithSchema(dataType, query) {
    const schema = this.schemaRegistry[dataType];

    return {
      type: StrategyType.SUMMARY_WITH_SCHEMA,
      config: {
        summary: {
          query: this._generateSchemaQuery(dataType, query),
          schema: schema
        }
      },
      dataType,
      expectedFields: schema.required || []
    };
  }

  /**
   * Create summary configuration with query only (no schema)
   * @param {string} query - Query for summary generation
   * @returns {Object} Exa API contents config
   * @private
   */
  _createSummaryQuery(query) {
    return {
      type: StrategyType.SUMMARY_QUERY,
      config: {
        summary: {
          query: query
        }
      }
    };
  }

  /**
   * Create text-only configuration
   * @returns {Object} Exa API contents config
   * @private
   */
  _createTextConfig() {
    return {
      type: StrategyType.TEXT,
      config: {
        text: true
      }
    };
  }

  /**
   * Create configuration for both text and summary
   * @param {string} summaryQuery - Query for summary generation
   * @returns {Object} Exa API contents config
   * @private
   */
  _createTextWithSummary(summaryQuery) {
    return {
      type: StrategyType.TEXT_WITH_SUMMARY,
      config: {
        text: true,
        summary: {
          query: summaryQuery
        }
      }
    };
  }

  /**
   * Generate optimized query for schema-based extraction
   * @param {string} dataType - Data type identifier
   * @param {string} originalQuery - Original search query
   * @returns {string} Optimized summary query
   * @private
   */
  _generateSchemaQuery(dataType, originalQuery) {
    const queries = {
      // SEC
      'sec_filing': 'Extract SEC filing metadata including accession number, filing date, form type, and company information',
      'sec_financial': 'Extract financial metrics including revenue, net income, total assets, and reporting period',

      // USPTO
      'patent': 'Extract patent metadata including patent number, title, inventors, assignee, filing date, and CPC classifications',
      'patent_classification': 'Extract CPC classification codes and descriptions',

      // EPA
      'epa_facility': 'Extract facility information including registry ID, name, location, and violation history',
      'epa_compliance': 'Extract compliance status, violations, and enforcement actions',

      // FDA
      'fda_adverse_event': 'Extract drug adverse event details including product name, reactions, and outcomes',
      'fda_device_event': 'Extract medical device event information',
      'fda_recall': 'Extract recall information including product, manufacturer, and reason',

      // NHTSA
      'nhtsa_recall': 'Extract vehicle recall details including make, model, component, and defect description',

      // Court/Legal
      'court_case': 'Extract case information including case number, parties, date, and citation',
      'statute': 'Extract statute citation, title, effective date, and key provisions',

      // GovInfo/USC
      'usc_search_result': 'Essential details about USC sections',
      'usc_section': 'Extract complete USC section information including title number, section number, official USC citation, full section text, and any subsections',
      'usc_title_structure': 'Extract USC title structure including title number, title name, year, chapters with chapter numbers and names, and total sections',

      // Default
      'default': `Extract key information related to: ${originalQuery}`
    };

    return queries[dataType] || queries['default'];
  }

  /**
   * Analyze strategy effectiveness
   * Provides metrics on strategy selection distribution
   *
   * @param {Array} selections - Array of strategy selections
   * @returns {Object} Strategy usage statistics
   */
  static analyzeStrategyUsage(selections) {
    const counts = {
      [StrategyType.SUMMARY_WITH_SCHEMA]: 0,
      [StrategyType.SUMMARY_QUERY]: 0,
      [StrategyType.TEXT]: 0,
      [StrategyType.TEXT_WITH_SUMMARY]: 0
    };

    for (const selection of selections) {
      if (selection.type in counts) {
        counts[selection.type]++;
      }
    }

    const total = selections.length;
    return {
      total,
      counts,
      percentages: {
        [StrategyType.SUMMARY_WITH_SCHEMA]: total > 0 ? (counts[StrategyType.SUMMARY_WITH_SCHEMA] / total * 100).toFixed(1) : 0,
        [StrategyType.SUMMARY_QUERY]: total > 0 ? (counts[StrategyType.SUMMARY_QUERY] / total * 100).toFixed(1) : 0,
        [StrategyType.TEXT]: total > 0 ? (counts[StrategyType.TEXT] / total * 100).toFixed(1) : 0,
        [StrategyType.TEXT_WITH_SUMMARY]: total > 0 ? (counts[StrategyType.TEXT_WITH_SUMMARY] / total * 100).toFixed(1) : 0
      }
    };
  }
}

/**
 * Default export
 */
export default ContentStrategy;
