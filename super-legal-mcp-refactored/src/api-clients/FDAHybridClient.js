/**
 * FDAHybridClient.js
 *
 * Hybrid client for FDA (OpenFDA) API with smart routing based on live testing
 *
 * Routing Strategy (from FDA_CLIENT_LIVE_TEST_RESULTS.md - October 8, 2025):
 * - Native First (40-50% of queries): OpenFDA syntax, device/brand names, recalls
 * - WebSearch First (50-60% of queries): NDC codes, date ranges, natural language
 *
 * Performance (Measured):
 * - Native: 709ms avg, 75% success (6/8 tests)
 * - WebSearch: 1,836ms avg, 100% success (8/8 tests)
 * - Hybrid: 5-8x faster for 40-50% of queries
 *
 * Token Management (Phase 3 pattern):
 * - Client-side result limiting in FDAClient (prevents API over-returns)
 * - limitResults() method in FDAHybridClient (prevents token overflow)
 * - isEmptyResult() for smart fallback detection
 *
 * Critical Findings:
 * - ⚠️ Native FAILS for NDC codes (404 error) → Route to WebSearch
 * - ⚠️ Native FAILS for date ranges (500 error) → Route to WebSearch
 * - ✅ Native EXCELS for OpenFDA syntax (100% success, 1,131ms)
 * - ✅ Native EXCELS for device queries (100% success, 345ms, 7.7x faster)
 * - ✅ Native EXCELS for brand queries (100% success, 360ms, 3.5x faster)
 * - ✅ Native EXCELS for recalls (100% success, 276ms, 8.3x faster)
 *
 * Phase: 4.4
 * Pattern: Smart routing with fallback (proven in Phase 4.1)
 * Test Results: See FDA_CLIENT_LIVE_TEST_RESULTS.md
 *
 * @module FDAHybridClient
 */

import { BaseHybridClient } from './BaseHybridClient.js';
import { FDAClient } from './FDAClient.js';
import { FDAWebSearchClient } from './FDAWebSearchClient.js';

export class FDAHybridClient extends BaseHybridClient {
  /**
   * Create a new FDA Hybrid Client
   * @param {Object} rateLimiter - Rate limiter instance
   * @param {string} exaApiKey - Exa API key for websearch
   */
  constructor(rateLimiter, exaApiKey) {
    // Pass client classes to BaseHybridClient (it will instantiate them)
    super(rateLimiter, exaApiKey, FDAClient, FDAWebSearchClient);

    // Configuration
    this.clientName = 'FDA (OpenFDA) Hybrid';
    this.enableSmartFallback = true;

    // CRITICAL: Disable native metadata enhancement to prevent 200k+ token overflow
    // WebSearch results are ~5-10k tokens, native metadata adds 200k+ tokens
    // See FDA_WEBSEARCH_FIRST_IMPLEMENTATION_REPORT.md for details
    this.enhanceWebsearchWithNative = false;

    // Circuit breaker (Phase 2 pattern)
    this.circuitBreaker = {
      failures: 0,
      threshold: 5,          // Open after 5 consecutive failures
      resetTimeout: 300000,  // 5 minutes
      isOpen: false,
      openedAt: null
    };

    // Cache configuration (1 hour TTL for pharmaceutical data)
    this.cacheEnabled = true;
    this.cacheTTL = 3600000; // 1 hour

    this.log('[Init] FDA Hybrid Client initialized with smart routing based on test results');
  }

  /**
   * Detect OpenFDA query syntax
   * Examples:
   * - patient.drug.medicinalproduct:"ASPIRIN"
   * - serious:1+AND+patient.drug.medicinalproduct:"LIPITOR"
   * - device.generic_name:"pacemaker"
   *
   * @param {string} search - Search string to analyze
   * @returns {boolean} True if OpenFDA syntax detected
   */
  isOpenFDAQuery(search) {
    if (!search || typeof search !== 'string') return false;

    const openFDAPatterns = [
      /\w+\.\w+\.\w+:/,              // Nested field: patient.drug.medicinalproduct:
      /\+AND\+|\+OR\+/,              // Boolean operators
      /serious:|receivedate:/,        // Common FDA fields
      /openfda\./,                    // OpenFDA namespace
      /device\.generic_name/i,        // Device fields
      /device\.manufacturer/i,        // Device manufacturer
    ];

    return openFDAPatterns.some(pattern => pattern.test(search));
  }

  /**
   * Detect date range queries (native fails with 500 error)
   * Example: receivedate:[20230101+TO+20231231]
   *
   * @param {string} search - Search string to analyze
   * @returns {boolean} True if date range syntax detected
   */
  isDateRangeQuery(search) {
    if (!search || typeof search !== 'string') return false;
    return /\[\d+\+TO\+\d+\]/.test(search);
  }

  /**
   * Detect NDC code patterns (native fails with 404)
   * Format: 12345-678-90 or 0069-2587-01
   *
   * @param {string} search - Search string to analyze
   * @param {string} ndc - Explicit NDC parameter
   * @returns {boolean} True if NDC code detected
   */
  isNDCQuery(search, ndc) {
    if (ndc) return true;
    if (!search || typeof search !== 'string') return false;
    return /\d{4,5}-\d{3,4}-\d{1,2}/.test(search);
  }

  /**
   * Detect natural language queries (websearch better)
   *
   * @param {string} query - Query string to analyze
   * @returns {boolean} True if natural language detected
   */
  isNaturalLanguage(query) {
    if (!query || typeof query !== 'string') return false;

    const naturalPatterns = [
      query.includes('?'),                                      // Question mark
      /\b(what|how|when|where|why|who|which)\b/i.test(query), // Question words
      /\b(latest|recent|current|new)\b/i.test(query),         // Temporal keywords
      query.split(' ').length > 5                               // Long query (>5 words)
    ];

    return naturalPatterns.some(pattern => pattern);
  }

  /**
   * Determine routing strategy based on query characteristics
   *
   * CRITICAL: Based on live test results (October 8, 2025)
   * - NDC queries MUST route to WebSearch (native returns 404)
   * - Date range queries MUST route to WebSearch (native returns 500)
   * - OpenFDA syntax queries route to Native (100% success, fast)
   * - Device/brand queries route to Native (100% success, 5-8x faster)
   *
   * @param {Object} args - Query arguments
   * @returns {string} Routing strategy ('native_first' or 'websearch_first')
   */
  determineStrategy(args) {
    const { search, ndc, drug_name, device_name, recall_id } = args;

    // ⚠️ CRITICAL: Date range = WebSearch first (Native returns 500 errors)
    // Testing showed: Native 0% success for date range queries
    if (search && this.isDateRangeQuery(search)) {
      this.log('[Route] Date range detected → websearch_first (native fails 500)');
      return 'websearch_first';
    }

    // ⚠️ CRITICAL: NDC code = WebSearch first (Native returns 404 errors)
    // Testing showed: Native 0% success for NDC lookups
    if (this.isNDCQuery(search, ndc)) {
      this.log('[Route] NDC code detected → websearch_first (native fails 404)');
      return 'websearch_first';
    }

    // ✅ OpenFDA field syntax = Native first (100% success, 1,131ms)
    // Testing showed: Native excels at structured field queries
    if (search && this.isOpenFDAQuery(search)) {
      this.log('[Route] OpenFDA syntax detected → native_first (proven fast)');
      return 'native_first';
    }

    // ✅ Device name = Native first (100% success, 345ms, 7.7x faster)
    // Testing showed: Fastest response, very reliable
    if (device_name || (search && /device\.generic_name/i.test(search))) {
      this.log('[Route] Device name detected → native_first (proven fast)');
      return 'native_first';
    }

    // ✅ Brand name = Native first (100% success, 360ms, 3.5x faster)
    // Testing showed: Fast and reliable for brand lookups
    if (drug_name || (search && /openfda\.brand_name/i.test(search))) {
      this.log('[Route] Brand name detected → native_first (proven fast)');
      return 'native_first';
    }

    // ✅ Recall text search = Native first (100% success, 276ms, 8.3x faster)
    // Testing showed: Fastest queries in the entire test suite
    if (recall_id || (search && /recall|contamination|voluntary/i.test(search))) {
      this.log('[Route] Recall search detected → native_first (fastest)');
      return 'native_first';
    }

    // Natural language query = WebSearch first
    // Native API doesn't handle natural language well
    if (search && this.isNaturalLanguage(search)) {
      this.log('[Route] Natural language detected → websearch_first');
      return 'websearch_first';
    }

    // Recent news/alerts = WebSearch first
    // Native API doesn't have temporal filtering
    if (search && /recent|latest|new|alert|announcement/i.test(search)) {
      this.log('[Route] Temporal query detected → websearch_first');
      return 'websearch_first';
    }

    // Specialized searches = WebSearch only
    // Warning letters, 510k, PMA, Orange/Purple Books not in native API
    if (search && /(warning letter|510k|pma|orange book|purple book|safety communication|drug shortage)/i.test(search)) {
      this.log('[Route] Specialized search detected → websearch_first');
      return 'websearch_first';
    }

    // Default: WebSearch first (for token management - prevents 211k token overflow)
    // Native API returns massive JSON dumps, WebSearch provides structured Gemini extraction
    this.log('[Route] Default → websearch_first (token-aware: ~5-10k tokens vs 211k native)');
    return 'websearch_first';
  }

  /**
   * Search drug adverse events (FAERS data)
   * Endpoint: /drug/event.json
   *
   * @param {Object} args - Query arguments
   * @returns {Promise<Object>} Search results
   */
  async searchDrugAdverseEvents(args) {
    if (!args || typeof args !== 'object') args = {};

    // Validate required parameter with helpful error message
    if (!args.search || String(args.search).trim().length === 0) {
      throw new Error(
        'search parameter is required for FDA drug adverse events. ' +
        'Example: search_fda_drug_adverse_events({ search: "Ozempic semaglutide FAERS pancreatitis" }). ' +
        'Tip: Include brand name, generic name, and specific adverse event for best results.'
      );
    }

    const strategy = this.determineStrategy(args);
    const cacheKey = this.buildCacheKey('drug_ae', args);

    // Token management logging
    if (strategy === 'websearch_first') {
      this.log('[Token Management] Using WebSearch + Gemini extraction (~5-10k tokens) for drug adverse events');
    } else {
      this.log('[Token Warning] Using native FDA API - results may be large (potential 211k+ tokens)');
    }

    const result = await this.executeHybrid('searchDrugAdverseEvents', args, {
      strategy,
      nativeMethodName: 'searchDrugAdverseEvents',
      websearchMethodName: 'searchDrugAdverseEventsWeb',
      cacheKey,
      metadata: {
        queryType: 'drug_adverse_events',
        endpoint: '/drug/event.json'
      }
    });

    // Apply token management via result limiting
    return this.limitResults(result, args.limit || 2);
  }

  /**
   * Search device events (MAUDE data)
   * Endpoint: /device/event.json
   *
   * @param {Object} args - Query arguments
   * @returns {Promise<Object>} Search results
   */
  async searchDeviceEvents(args) {
    if (!args || typeof args !== 'object') args = {};

    // Validate required parameter with helpful error message
    if (!args.search || String(args.search).trim().length === 0) {
      throw new Error(
        'search parameter is required for FDA device events. ' +
        'Example: search_fda_device_events({ search: "Medtronic pacemaker MAUDE battery malfunction" }). ' +
        'Tip: Include manufacturer, device type, and specific malfunction for best results.'
      );
    }

    const strategy = this.determineStrategy(args);
    const cacheKey = this.buildCacheKey('device_ae', args);

    // Token management logging
    if (strategy === 'websearch_first') {
      this.log('[Token Management] Using WebSearch + Gemini extraction (~5-10k tokens) for device events');
    } else {
      this.log('[Token Warning] Using native FDA API - results may be large (potential 211k+ tokens)');
    }

    const result = await this.executeHybrid('searchDeviceEvents', args, {
      strategy,
      nativeMethodName: 'searchDeviceEvents',
      websearchMethodName: 'searchDeviceEventsWeb',
      cacheKey,
      metadata: {
        queryType: 'device_adverse_events',
        endpoint: '/device/event.json'
      }
    });

    // Apply token management via result limiting
    return this.limitResults(result, args.limit || 2);
  }

  /**
   * Search drug labels (SPL data)
   * Endpoint: /drug/label.json
   *
   * @param {Object} args - Query arguments
   * @returns {Promise<Object>} Search results
   */
  async searchDrugLabels(args) {
    if (!args || typeof args !== 'object') args = {};

    // Validate required parameter with helpful error message
    if (!args.search || String(args.search).trim().length === 0) {
      throw new Error(
        'search parameter is required for FDA drug labels. ' +
        'Example: search_fda_drug_labels({ search: "Prozac fluoxetine prescribing information black box warning" }). ' +
        'Tip: Include brand name, generic name, and specific section (warnings, dosage) for best results.'
      );
    }

    const strategy = this.determineStrategy(args);
    const cacheKey = this.buildCacheKey('drug_label', args);

    // Token management logging
    if (strategy === 'websearch_first') {
      this.log('[Token Management] Using WebSearch + Gemini extraction (~5-10k tokens) for drug labels');
    } else {
      this.log('[Token Warning] Using native FDA API - results may be large (potential 211k+ tokens)');
    }

    const result = await this.executeHybrid('searchDrugLabels', args, {
      strategy,
      nativeMethodName: 'searchDrugLabels',
      websearchMethodName: 'searchDrugLabelsWeb',
      cacheKey,
      metadata: {
        queryType: 'drug_labeling',
        endpoint: '/drug/label.json'
      }
    });

    // Apply token management via result limiting
    return this.limitResults(result, args.limit || 2);
  }

  /**
   * Search recalls/enforcement reports
   * Endpoints: /drug|device|food/enforcement.json
   *
   * @param {Object} args - Query arguments
   * @returns {Promise<Object>} Search results
   */
  async searchRecalls(args) {
    if (!args || typeof args !== 'object') args = {};

    // Validate required parameter with helpful error message
    if (!args.search || String(args.search).trim().length === 0) {
      throw new Error(
        'search parameter is required for FDA recalls. ' +
        'Example: search_fda_recalls({ search: "Listeria ice cream enforcement report Class I recall" }). ' +
        'Tip: Include product name, contaminant/defect, and recall class for best results.'
      );
    }

    const strategy = this.determineStrategy(args);
    const cacheKey = this.buildCacheKey('recall', args);

    // Token management logging
    if (strategy === 'websearch_first') {
      this.log('[Token Management] Using WebSearch + Gemini extraction (~5-10k tokens) for recalls');
    } else {
      this.log('[Token Warning] Using native FDA API - results may be large (potential 211k+ tokens)');
    }

    const result = await this.executeHybrid('searchRecalls', args, {
      strategy,
      nativeMethodName: 'searchRecalls',
      websearchMethodName: 'searchRecallsWeb',
      cacheKey,
      metadata: {
        queryType: 'enforcement_recalls',
        endpoint: '/enforcement.json'
      }
    });

    // Apply token management via result limiting
    return this.limitResults(result, args.limit || 2);
  }

  /**
   * Build cache key for FDA queries
   * Uses most specific identifier available
   *
   * @param {string} type - Query type (drug_ae, device_ae, drug_label, recall)
   * @param {Object} args - Query arguments
   * @returns {string} Cache key
   */
  buildCacheKey(type, args) {
    const { search, ndc, drug_name, device_name, product_area } = args;

    // Use most specific identifier
    if (ndc) return `fda_${type}_ndc_${ndc}`;
    if (drug_name) return `fda_${type}_drug_${drug_name}`;
    if (device_name) return `fda_${type}_device_${device_name}`;

    // For general searches, include product area if specified
    const searchKey = search ? search.substring(0, 50) : 'default';
    const areaKey = product_area || 'all';

    return `fda_${type}_${areaKey}_${searchKey}`;
  }

  /**
   * Limit results to prevent token overflow (Phase 3 pattern)
   * Applied to all FDA responses to prevent context accumulation
   * 
   * @param {Object} result - Result object from native or websearch client
   * @param {number} limit - Maximum number of results to return
   * @returns {Object} Limited result object
   */
  limitResults(result, limit) {
    if (!result || !result.content || !result.content[0]) return result;

    try {
      const data = JSON.parse(result.content[0].text);

      // Limit main results array if present
      if (data.results && Array.isArray(data.results) && data.results.length > limit) {
        const limitedResults = data.results.slice(0, limit);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              ...data,
              results: limitedResults,
              api_returned: data.results.length,
              requested_limit: limit,
              _truncated: true,
              _note: 'Results truncated to prevent token overflow'
            }, null, 2)
          }]
        };
      }

      return result;
    } catch (error) {
      this.log('[Error] Failed to limit results:', error.message);
      return result;
    }
  }

  /**
   * Check if native API result is empty
   * Used by smart fallback mechanism
   * 
   * @param {Object} result - Result object to check
   * @returns {boolean} True if result is empty
   */
  isEmptyResult(result) {
    if (!result || !result.content || !result.content[0]) return true;

    try {
      const data = JSON.parse(result.content[0].text);
      return !data.results || data.results.length === 0;
    } catch (error) {
      return true;
    }
  }

  /**
   * Log messages if verbose logging enabled
   *
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.verboseLogging || process.env.HYBRID_VERBOSE_LOGGING === 'true') {
      console.log(`[FDAHybridClient] ${message}`);
    }
  }
}
