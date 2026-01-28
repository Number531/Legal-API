/**
 * GovInfoHybridClient.js
 *
 * Hybrid client for GovInfo/US Code API with smart routing:
 * - Native API first for structured queries (2x faster)
 * - WebSearch fallback for natural language and empty results
 * - API key validation with graceful degradation
 * - Circuit breaker protection
 * - Response limiting to prevent token overflow
 *
 * Phase: 4.1
 * Pattern: Native First → WebSearch Fallback (proven in Phase 3 USPTO)
 */

import { BaseHybridClient } from './BaseHybridClient.js';
import { GovInfoClient } from './GovInfoClient.js';
import { GovInfoWebSearchClient } from './GovInfoWebSearchClient.js';

export class GovInfoHybridClient extends BaseHybridClient {
  constructor(rateLimiter, exaApiKey) {
    // API key validation - graceful degradation if missing
    const hasGovInfoKey = !!process.env.GOVINFO_API_KEY;

    // Only instantiate native client if API key exists
    const nativeClientClass = hasGovInfoKey ? GovInfoClient : null;

    super(rateLimiter, exaApiKey, nativeClientClass, GovInfoWebSearchClient);

    // Configuration
    this.clientName = 'GovInfo Hybrid';
    this.enableSmartFallback = true;
    this.hasNativeAPI = hasGovInfoKey;

    // Log API key status
    if (!hasGovInfoKey) {
      console.warn('[GovInfo Hybrid] GOVINFO_API_KEY not set - using websearch only');
    }

    // Circuit breaker (Phase 2 pattern)
    this.circuitBreaker = {
      failures: 0,
      threshold: 5,
      resetTimeout: 300000, // 5 minutes
      isOpen: false,
      openedAt: null
    };

    // Cache configuration (2 hours TTL for GovInfo)
    this.cacheEnabled = true;
    this.cacheTTL = 7200000; // 2 hours

    this.log('[Init] GovInfo Hybrid Client initialized', {
      hasNativeAPI: this.hasNativeAPI,
      smartFallback: this.enableSmartFallback
    });
  }

  /**
   * Detect query type for smart routing
   * Returns: 'package_lookup', 'section_lookup', 'title_lookup', 'natural_language', or 'general'
   */
  detectQueryType(args) {
    const {
      search_text,
      title_number,
      section,
      package_id
    } = args;

    // Type 1: Package ID lookup (most specific)
    if (package_id) {
      this.log('[Query Type] package_lookup');
      return 'package_lookup';
    }

    // Type 2: USC section lookup (title + section)
    if (title_number && section) {
      this.log('[Query Type] section_lookup');
      return 'section_lookup';
    }

    // Type 3: Title-only lookup
    if (title_number && !section) {
      this.log('[Query Type] title_lookup');
      return 'title_lookup';
    }

    // Type 4: Natural language search
    if (search_text && typeof search_text === 'string') {
      this.log('[Query Type] natural_language');
      return 'natural_language';
    }

    // Type 5: General/empty
    this.log('[Query Type] general');
    return 'general';
  }

  /**
   * Main search method with smart routing
   */
  async searchUSCode(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      search_text,
      search_term,  // Tool definitions use "search_term"
      title,         // Tool definitions use "title", not "title_number"
      title_number,  // Keep for backwards compatibility
      section,
      package_id,
      year,
      limit = 20
    } = args;
    
    // Normalize parameter names (tool uses "title" and "search_term")
    const titleNum = title || title_number;
    const searchText = search_term || search_text;

    // If no native API key, use websearch only
    if (!this.hasNativeAPI) {
      this.log('[No API Key] Using websearch only');
      const websearchArgs = {
        search_term: searchText || '',
        title: titleNum,
        section: section,
        limit: limit,
        include_text: false,
        include_snippet: true
      };

      return this.executeHybrid('searchUSCodeWeb', websearchArgs, {
        strategy: 'websearch_first',
        websearchMethodName: 'searchUSCodeWeb',
        nativeMethodName: null
      });
    }

    // Detect query type
    const queryType = this.detectQueryType(args);

    // Strategy 1: Package ID lookup → Native first
    if (package_id) {
      this.log('[Routing] package_id → native_first');

      const websearchArgs = {
        search_term: package_id,
        limit,
        include_text: false,
        include_snippet: true
      };

      return this.executeHybrid('searchUSCode', args, {
        strategy: 'native_first',
        nativeMethodName: 'searchUSCode',
        websearchMethodName: 'searchUSCodeWeb',
        websearchArgs,
        cacheKey: `pkg_${package_id}`
      });
    }

    // Strategy 2: USC section lookup (title + section) → Native first
    if (titleNum && section) {
      this.log('[Routing] USC section → native_first');

      // Map parameter names: title for both native and web
      const nativeArgs = {
        title: titleNum,
        section,
        year,
        format: args.format
      };

      const websearchArgs = {
        title: titleNum,
        section: section,
        limit: limit,
        include_text: true
      };

      return this.executeHybrid('getUSCSection', nativeArgs, {
        strategy: 'native_first',
        nativeMethodName: 'getUSCSection',
        websearchMethodName: 'getUSCSectionWeb',
        websearchArgs,
        cacheKey: `usc_${titleNum}_${section}`
      });
    }

    // Strategy 3: Title-only query → Native first
    if (titleNum && !searchText) {
      this.log('[Routing] title query → native_first');

      const websearchArgs = {
        search_term: `USC Title ${titleNum}`,
        title: titleNum,
        limit: limit,
        include_text: false,
        include_snippet: true
      };

      return this.executeHybrid('searchUSCode', args, {
        strategy: 'native_first',
        nativeMethodName: 'searchUSCode',
        websearchMethodName: 'searchUSCodeWeb',
        websearchArgs,
        cacheKey: `title_${titleNum}`
      });
    }

    // Strategy 4: Natural language search → WebSearch first
    if (searchText && !titleNum) {
      this.log('[Routing] natural language → websearch_first');

      const websearchArgs = {
        search_term: searchText,
        limit,
        include_text: false,
        include_snippet: true
      };

      return this.executeHybrid('searchUSCodeWeb', websearchArgs, {
        strategy: 'websearch_first',
        websearchMethodName: 'searchUSCodeWeb',
        websearchArgs,
        nativeMethodName: null  // Don't fallback to native for NL
      });
    }

    // Default: Native first
    this.log('[Routing] default → native_first');

    const websearchArgs = {
      search_term: searchText || '',
      title: titleNum,
      limit: limit,
      include_text: false,
      include_snippet: true
    };

    return this.executeHybrid('searchUSCode', args, {
      strategy: 'native_first',
      nativeMethodName: 'searchUSCode',
      websearchMethodName: 'searchUSCodeWeb',
      websearchArgs
    });
  }

  /**
   * Get USC section with hybrid fallback
   */
  async getUSCSection(args) {
    // Normalize parameter name (tool uses "title", not "title_number")
    const titleNum = args.title || args.title_number;
    const section = args.section;
    
    if (!this.hasNativeAPI) {
      const websearchArgs = {
        title: titleNum,
        section: section,
        limit: args.limit || 20
      };
      return this.websearchClient.getUSCSectionWeb(websearchArgs);
    }

    // Prepare args for native API
    const nativeArgs = {
      title: titleNum,
      section: section,
      year: args.year,
      format: args.format
    };

    const websearchArgs = {
      title: titleNum,
      section: section,
      limit: args.limit || 20,
      include_text: true
    };

    return this.executeHybrid('getUSCSection', nativeArgs, {
      strategy: 'native_first',
      nativeMethodName: 'getUSCSection',
      websearchMethodName: 'getUSCSectionWeb',
      websearchArgs,
      cacheKey: `section_${titleNum}_${section}`
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
      return false;
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
   * Get USC title structure
   * Strategy: Native first if API key available, websearch fallback
   */
  async getUSCTitleStructure(args) {
    if (!this.hasNativeAPI) {
      const websearchArgs = {
        title: args.title,
        chapter: args.chapter,
        include_sections: args.include_sections !== false
      };
      return this.websearchClient.getUSCTitleStructureWeb(websearchArgs);
    }

    const websearchArgs = {
      title: args.title,
      chapter: args.chapter,
      include_sections: args.include_sections !== false
    };

    return this.executeHybrid('getUSCTitleStructure', args, {
      strategy: 'native_first',
      nativeMethodName: 'getUSCTitleStructure',
      websearchMethodName: 'getUSCTitleStructureWeb',
      websearchArgs,
      cacheKey: `structure_${args.title}_${args.chapter || 'all'}`
    });
  }

  /**
   * List all USC titles
   * Strategy: Native first if API key available, websearch fallback
   */
  async listUSCTitles(args = {}) {
    if (!this.hasNativeAPI) {
      const websearchArgs = {
        include_descriptions: args.include_descriptions !== false,
        include_enacted: args.include_enacted
      };
      return this.websearchClient.listUSCTitlesWeb(websearchArgs);
    }

    const websearchArgs = {
      include_descriptions: args.include_descriptions !== false,
      include_enacted: args.include_enacted
    };

    return this.executeHybrid('listUSCTitles', args, {
      strategy: 'native_first',
      nativeMethodName: 'listUSCTitles',
      websearchMethodName: 'listUSCTitlesWeb',
      websearchArgs,
      cacheKey: 'usc_titles_list'
    });
  }

  /**
   * Logging helper
   */
  log(message, data = null) {
    if (data) {
      console.log(`[GovInfo Hybrid] ${message}`, data);
    } else {
      console.log(`[GovInfo Hybrid] ${message}`);
    }
  }
}
