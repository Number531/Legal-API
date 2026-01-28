/**
 * FederalRegisterHybridClient.js
 *
 * Hybrid client for Federal Register API with smart routing:
 * - Native API first for structured queries (6.8x faster)
 * - WebSearch fallback for natural language and empty results
 * - Circuit breaker protection
 * - Response limiting to prevent token overflow
 *
 * Phase: 4.1
 * Pattern: Native First → WebSearch Fallback (proven in Phase 3 USPTO)
 */

import { BaseHybridClient } from './BaseHybridClient.js';
import { FederalRegisterClient } from './FederalRegisterClient.js';
import { FederalRegisterWebSearchClient } from './FederalRegisterWebSearchClient.js';

export class FederalRegisterHybridClient extends BaseHybridClient {
  constructor(rateLimiter, exaApiKey) {
    // Pass client classes to BaseHybridClient (it will instantiate them)
    super(rateLimiter, exaApiKey, FederalRegisterClient, FederalRegisterWebSearchClient);

    // Configuration
    this.clientName = 'FederalRegister Hybrid';
    this.enableSmartFallback = true;

    // Circuit breaker (Phase 2 pattern)
    this.circuitBreaker = {
      failures: 0,
      threshold: 5,          // Open after 5 consecutive failures
      resetTimeout: 300000,  // 5 minutes
      isOpen: false,
      openedAt: null
    };

    // Cache configuration (1 hour TTL for Federal Register)
    this.cacheEnabled = true;
    this.cacheTTL = 3600000; // 1 hour

    this.log('[Init] FederalRegister Hybrid Client initialized with native-first strategy + smart fallback');
  }

  /**
   * Detect query type for smart routing
   * Returns: 'document_lookup', 'structured', 'natural_language', or 'general'
   */
  detectQueryType(args) {
    const {
      query,
      document_number,
      agency,
      document_type,
      date_range,
      cfr_title,
      significant_only
    } = args;

    // Type 1: Document number lookup (most specific)
    if (document_number) {
      this.log('[Query Type] document_lookup (document_number provided)');
      return 'document_lookup';
    }

    // Type 2: Structured query (agency, type, date, CFR filters)
    if (agency || document_type || date_range || cfr_title || significant_only) {
      this.log('[Query Type] structured (filter parameters provided)');
      return 'structured';
    }

    // Type 3: Natural language query (free text)
    if (query && typeof query === 'string' && query.length > 0) {
      this.log('[Query Type] natural_language (query text provided)');
      return 'natural_language';
    }

    // Type 4: General/empty
    this.log('[Query Type] general (no specific parameters)');
    return 'general';
  }

  /**
   * Main search method with smart routing
   */
  async searchFederalRegister(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      query,
      document_number,
      agency,
      document_type,
      date_range,
      cfr_title,
      significant_only,
      limit = 20
    } = args;

    // Detect query type
    const queryType = this.detectQueryType(args);

    // Detect if query is natural language (improved detection)
    const isNaturalLanguage = query && (
      query.includes('?') ||           // Question mark
      /\b(what|how|when|where|why|who|which)\b/i.test(query) || // Question words
      /\b(latest|recent|current|new)\b/i.test(query) ||         // Temporal keywords
      query.split(' ').length > 5                                 // Long query (>5 words)
    );

    // Strategy 1: Document number lookup → Native first (fastest, most accurate)
    if (document_number) {
      this.log('[Routing] document_number → native_first');

      // Prepare separate args for native and websearch
      const websearchArgs = {
        search_term: document_number,
        limit,
        include_text: false,
        include_snippet: true
      };

      return this.executeHybrid('searchFederalRegister', args, {
        strategy: 'native_first',
        nativeMethodName: 'searchFederalRegister',
        websearchMethodName: 'searchFederalRegisterWeb',
        websearchArgs,  // Use separate args for websearch fallback
        cacheKey: `fr_doc_${document_number}_${agency || 'any'}`
      });
    }

    // Strategy 2: Natural language → WebSearch first (better comprehension)
    if (isNaturalLanguage && !document_number) {
      this.log('[Routing] natural language → websearch_first');

      // Translate args for websearch format
      const websearchArgs = {
        search_term: query,
        limit,
        include_text: false,
        include_snippet: true
      };

      return this.executeHybrid('searchFederalRegister', args, {
        strategy: 'websearch_first',
        websearchMethodName: 'searchFederalRegisterWeb',
        websearchArgs,
        nativeMethodName: null  // Don't fallback to native (websearch is primary for NL)
      });
    }

    // Strategy 3: Structured query (agency, type, date) → Native first
    if (agency || document_type || date_range || cfr_title || significant_only) {
      this.log('[Routing] structured query → native_first');

      // Prepare websearch fallback args
      const websearchArgs = {
        search_term: query || `${agency || ''} ${document_type || ''}`.trim(),
        limit,
        include_text: false,
        include_snippet: true
      };

      return this.executeHybrid('searchFederalRegister', args, {
        strategy: 'native_first',
        nativeMethodName: 'searchFederalRegister',
        websearchMethodName: 'searchFederalRegisterWeb',
        websearchArgs,  // Use separate args for websearch fallback
        cacheKey: agency 
          ? `fr_${agency}_${document_type || 'all'}_${date_range || 'all'}` 
          : null
      });
    }

    // Default: Native first
    this.log('[Routing] default → native_first');

    // Prepare websearch fallback args
    const websearchArgs = {
      search_term: query || '',
      limit,
      include_text: false,
      include_snippet: true
    };

    return this.executeHybrid('searchFederalRegister', args, {
      strategy: 'native_first',
      nativeMethodName: 'searchFederalRegister',
      websearchMethodName: 'searchFederalRegisterWeb',
      websearchArgs  // Use separate args for websearch fallback
    });
  }

  /**
   * Check if result is empty (for smart fallback)
   */
  isEmptyResult(result) {
    if (!result || !result.content || !result.content[0]) return true;

    try {
      const data = JSON.parse(result.content[0].text);
      return !data.results || data.results.length === 0 || data.count === 0;
    } catch (error) {
      return false; // If can't parse, assume not empty
    }
  }

  /**
   * Limit results to prevent token overflow (Phase 3 pattern)
   */
  limitResults(result, limit) {
    if (!result || !result.content || !result.content[0]) return result;

    try {
      const data = JSON.parse(result.content[0].text);

      if (data.results && data.results.length > limit) {
        const limitedResults = data.results.slice(0, limit);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              ...data,
              results: limitedResults,
              api_returned: data.results.length,
              requested_limit: limit,
              _truncated: true
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
   * Logging helper
   */
  log(message, data = null) {
    console.log(`[FederalRegister Hybrid] ${message}`, data || '');
  }
}
