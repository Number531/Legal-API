/**
 * USPTO Hybrid Client
 * Intelligently routes between native PatentSearch API and Exa websearch
 * 
 * Strategy:
 * - Native-first for structured queries (patent numbers, assignees, classifications)
 * - WebSearch for natural language and content discovery
 * - 24-hour caching (patents don't change once granted)
 * 
 * Phase: 3
 * Pattern: Follows Phase 1/2 BaseHybridClient architecture
 */

import { BaseHybridClient } from './BaseHybridClient.js';
import { UsptoClient } from './UsptoClient.js';
import { UsptoWebSearchClient } from './UsptoWebSearchClient.js';

/**
 * Custom error class for parameter validation failures
 * These should NOT trigger circuit breaker failures since they're client-side errors
 */
class ParameterValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParameterValidationError';
    this.isValidationError = true;
  }
}

export class USPTOHybridClient extends BaseHybridClient {
  constructor(rateLimiter, exaApiKey) {
    super(rateLimiter, exaApiKey, UsptoClient, UsptoWebSearchClient);
    
    // Native-first strategy (USPTO API is reliable with valid key)
    this.defaultStrategy = 'native_first';
    
    // Long cache TTL (patents don't change once granted)
    this.cacheTimeout = 86400000; // 24 hours
    
    // Patent number detection patterns (from Phase 3 research)
    this.patentPatterns = {
      utility: /^\d{7,8}[A-Z]?\d?$/,                    // 5123456, 10123456B2
      utilityWithPrefix: /^US\d{7,8}[A-Z]?\d?$/i,       // US10123456B2
      publication: /^US?\d{11}[A-Z]\d$/i,               // US20230012345A1
      design: /^D\d{6,7}[A-Z]?\d?$/i,                   // D123456S1
      plant: /^PP\d{5,6}[A-Z]?\d?$/i,                   // PP12345P1
      reissue: /^RE\d{5,6}[A-Z]?\d?$/i                  // RE12345E
    };
    
    // Circuit breaker (following EPA Phase 2 pattern)
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      threshold: 5,
      resetTimeout: 300000,  // 5 minutes
      state: 'closed'
    };
    
    // Smart fallback configuration
    this.enableSmartFallback = true;  // Auto-retry with websearch on 0 results
    
    this.log('[USPTO Hybrid] Initialized with native-first strategy + smart fallback');
  }
  
  /**
   * Check if native API result is empty
   */
  isEmptyResult(result) {
    if (!result || !result.content || !result.content[0]) return true;
    
    try {
      const data = JSON.parse(result.content[0].text);
      return data.count === 0 || data.total_hits === 0 || 
             !data.results || data.results.length === 0;
    } catch (error) {
      return false; // If can't parse, assume not empty
    }
  }
  
  /**
   * Determine if we should fall back to websearch for empty results
   * Returns true for query types known to have API limitations:
   * - CPC classification queries (technology_area)
   * - Combined text + entity queries (search_text + assignee/inventor)
   * - Semantic/natural language queries
   */
  shouldFallbackOnEmpty(args) {
    if (!this.enableSmartFallback) return false;
    
    const indicators = this.detectQueryType(args);
    
    // Fall back for CPC classification queries (known API limitation)
    if (indicators.hasCPC) {
      this.log('Smart fallback: CPC query detected');
      return true;
    }
    
    // Fall back for combined text + entity queries (known API limitation)
    if (indicators.hasCombinedTextEntity) {
      this.log('Smart fallback: Combined text+entity query detected');
      return true;
    }
    
    // Fall back for semantic/natural language queries
    if (indicators.isNaturalLanguage) {
      this.log('Smart fallback: Natural language query detected');
      return true;
    }
    
    return false;
  }
  
  /**
   * Detect query type to determine if smart fallback is appropriate
   */
  detectQueryType(args) {
    const {
      technology_area,
      search_text,
      assignee_organization,
      inventor_name,
      query
    } = args;
    
    const searchTerm = search_text || query || '';
    const wordCount = searchTerm.split(/\s+/).length;
    
    return {
      hasCPC: !!technology_area,
      hasCombinedTextEntity: (!!search_text || !!query) && (!!assignee_organization || !!inventor_name),
      isNaturalLanguage: wordCount > 3,
      hasText: !!searchTerm
    };
  }
  
  /**
   * Search patents - Smart routing based on query type
   */
  async searchPatents(args) {
    const {
      query,
      patent_number,
      query_type = 'patents',
      assignee_organization,
      inventor_name,
      search_text,
      limit = 10
    } = args;
    
    // Patent number lookup → Native (structured data)
    if (patent_number || this.detectPatentNumber(query)) {
      const patNum = patent_number || this.extractPatentNumber(query);
      
      return this.executeHybrid('searchPatents', {
        query_type: 'patents',
        search_text: patNum,
        limit
      }, {
        strategy: 'native_first',
        nativeMethodName: 'searchPatents',
        websearchMethodName: 'searchPatentsWeb',
        cacheKey: `patent_${patNum}`
      });
    }
    
    // Company/Assignee search → Native (structured data)
    if (assignee_organization && !query) {
      return this.executeHybrid('searchPatents', {
        query_type: 'patents',
        assignee_organization,
        limit,
        ...args  // Pass through ALL parameters (technology_area, dates, etc.)
      }, {
        strategy: 'native_first',
        nativeMethodName: 'searchPatents',
        websearchMethodName: 'searchPatentsWeb',
        cacheKey: `assignee_${assignee_organization}`
      });
    }
    
    // Inventor search → Native (structured data)
    if (inventor_name && !query) {
      return this.executeHybrid('searchPatents', {
        query_type: 'patents',
        inventor_name,
        limit,
        ...args  // Pass through ALL parameters (technology_area, dates, etc.)
      }, {
        strategy: 'native_first',
        nativeMethodName: 'searchPatents',
        websearchMethodName: 'searchPatentsWeb'
      });
    }
    
    // Natural language query → WebSearch ONLY (better for discovery, avoid token overflow)
    if ((query && query.split(' ').length > 3) || (search_text && search_text.split(' ').length > 3)) {
      return this.executeHybrid('searchPatents', args, {
        strategy: 'websearch_first',
        websearchMethodName: 'searchPatentsWeb',
        nativeMethodName: null  // Don't enhance with native (causes token overflow)
      });
    }
    
    // Default: Native first
    return this.executeHybrid('searchPatents', {
      query_type,
      search_text: search_text || query,
      assignee_organization,
      inventor_name,
      limit,
      ...args
    }, {
      strategy: 'native_first',
      nativeMethodName: 'searchPatents',
      websearchMethodName: 'searchPatentsWeb'
    });
  }
  
  /**
   * Search inventors - Native first (structured data)
   */
  async searchInventors(args) {
    return this.executeHybrid('searchPatents', {
      query_type: 'inventors',
      ...args
    }, {
      strategy: 'native_first',
      nativeMethodName: 'searchPatents',
      websearchMethodName: 'searchInventorsWeb'
    });
  }
  
  /**
   * Search assignees/companies - Native first (structured data)
   */
  async searchAssignees(args) {
    const cacheKey = args.assignee_organization 
      ? `assignee_${args.assignee_organization}` 
      : null;
    
    return this.executeHybrid('searchPatents', {
      query_type: 'assignees',
      ...args
    }, {
      strategy: 'native_first',
      nativeMethodName: 'searchPatents',
      websearchMethodName: 'searchAssigneesWeb',
      cacheKey
    });
  }
  
  /**
   * Search patent locations - Native first (geographic data)
   */
  async searchPatentLocations(args) {
    return this.executeHybrid('searchPatentLocations', args, {
      strategy: 'native_first',
      nativeMethodName: 'searchPatentLocations',
      websearchMethodName: 'searchPatentLocationsWeb'
    });
  }
  
  /**
   * Search CPC classifications - Native only (structured taxonomy)
   */
  async searchCPCClassifications(args) {
    return this.executeHybrid('searchCPCClassifications', args, {
      strategy: 'native_first',
      nativeMethodName: 'searchCPCClassifications',
      websearchMethodName: null  // No websearch fallback for classifications
    });
  }
  
  /**
   * Search CPC groups - Native only (structured taxonomy)
   */
  async searchCPCGroups(args) {
    return this.executeHybrid('searchCPCGroups', args, {
      strategy: 'native_first',
      nativeMethodName: 'searchCPCGroups',
      websearchMethodName: null
    });
  }
  
  /**
   * Search USPC classifications - Native only (structured taxonomy)
   */
  async searchUSPCClassifications(args) {
    return this.executeHybrid('searchUSPCClassifications', args, {
      strategy: 'native_first',
      nativeMethodName: 'searchUSPCClassifications',
      websearchMethodName: null
    });
  }
  
  /**
   * Search WIPO classifications - Native only (structured taxonomy)
   */
  async searchWIPOClassifications(args) {
    return this.executeHybrid('searchWIPOClassifications', args, {
      strategy: 'native_first',
      nativeMethodName: 'searchWIPOClassifications',
      websearchMethodName: null
    });
  }
  
  /**
   * Detect if query contains a patent number
   */
  detectPatentNumber(query) {
    if (!query || typeof query !== 'string') return false;
    
    const cleaned = query.trim().toUpperCase();
    return Object.values(this.patentPatterns).some(pattern => pattern.test(cleaned));
  }
  
  /**
   * Extract patent number from query string
   */
  extractPatentNumber(query) {
    const cleaned = query.trim().toUpperCase();

    // Extract patent number pattern from anywhere in the string
    // Matches: optional US prefix + 7-8 digits + optional kind code
    const match = cleaned.match(/\b(US)?(\d{7,8})([A-Z]\d?)?\b/);
    if (match) {
      return match[2]; // Return just the number part (without US prefix or kind code)
    }

    // Fallback: clean and return (for edge cases)
    return cleaned.replace(/[,\s\-]/g, '').replace(/^US/, '');
  }
  
  /**
   * Normalize patent number for consistent formatting
   */
  normalizePatentNumber(patentNumber) {
    let normalized = patentNumber.toUpperCase()
      .replace(/[,\s\-]/g, '')
      .replace(/^US/, '');
    
    // Detect type and format
    if (/^D\d/.test(normalized)) {
      return { type: 'design', number: normalized };
    } else if (/^PP\d/.test(normalized)) {
      return { type: 'plant', number: normalized };
    } else if (/^RE\d/.test(normalized)) {
      return { type: 'reissue', number: normalized };
    } else if (/^\d{11}[A-Z]\d$/.test(normalized)) {
      return { type: 'publication', number: normalized };
    } else if (/^\d{7,8}/.test(normalized)) {
      const match = normalized.match(/^(\d{7,8})/);
      return {
        type: 'utility',
        number: match[1],
        fullNumber: normalized
      };
    }
    
    return { type: 'unknown', number: normalized };
  }
  
  /**
   * Circuit breaker implementation (from EPA Phase 2)
   */
  isCircuitOpen() {
    if (this.circuitBreaker.state === 'closed') {
      return false;
    }
    
    const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailureTime;
    if (timeSinceFailure >= this.circuitBreaker.resetTimeout) {
      this.circuitBreaker.state = 'half-open';
      this.log('[USPTO Circuit Breaker] Entering half-open state');
      return false;
    }
    
    return true;
  }
  
  recordSuccess() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'closed';
  }
  
  recordFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'open';
      this.log(`[USPTO Circuit Breaker] OPENED after ${this.circuitBreaker.failures} failures`);
    }
  }
  
  /**
   * Override executeNativeWithRetry to add circuit breaker
   */
  async executeNativeWithRetry(methodName, args) {
    if (this.isCircuitOpen()) {
      throw new Error('USPTO circuit breaker open - native API unavailable');
    }
    
    try {
      const result = await this.nativeClient[methodName](args);
      this.recordSuccess();
      return result;
    } catch (error) {
      // Don't record validation errors in circuit breaker (client-side errors)
      if (!error.isValidationError) {
        this.recordFailure();
      }
      throw error;
    }
  }

  /**
   * Override native-first strategy with smart fallback + circuit breaker
   * - Uses circuit breaker to protect against repeated API failures
   * - Automatically falls back to websearch when native API returns 0 results
   * - Handles validation errors without penalizing circuit breaker
   */
  async nativeFirstStrategy(nativeMethod, websearchMethod, args) {
    // Try native API first with circuit breaker protection
    if (this.nativeClient && typeof this.nativeClient[nativeMethod] === 'function') {
      try {
        // executeNativeWithRetry checks circuit breaker and records success/failure
        const result = await this.executeNativeWithRetry(nativeMethod, args);
        this.metrics.nativeAPIHits++;

        // SMART FALLBACK: Check if result is empty (0 patents found)
        const isEmpty = this.isEmptyResult(result);

        if (isEmpty && this.shouldFallbackOnEmpty(args)) {
          this.log('[USPTO Smart Fallback] Native API returned 0 results, triggering websearch', {
            reason: 'empty_results',
            query_indicators: this.detectQueryType(args),
            args_keys: Object.keys(args).filter(k => args[k])
          });

          // Fall through to websearch (don't return here)
        } else {
          this.log('[USPTO] Native API success', {
            isEmpty,
            resultCount: Array.isArray(result) ? result.length : 'N/A'
          });
          return this.addMetadata(result, 'native_api', 1.0, null);
        }
      } catch (error) {
        // Re-throw validation errors immediately - don't fallback for client-side errors
        if (error.isValidationError) {
          this.log('[USPTO] Validation error - not falling back', { error: error.message });
          throw error;
        }

        this.metrics.nativeAPIErrors++;
        if (!this.enableFallback) throw error;

        // Use console.log (not this.log) so users always see fallback happening
        console.log(`[USPTO] Native API failed, falling back to websearch: ${error.message}`);
        // Fall through to websearch
      }
    }

    // WEBSEARCH FALLBACK (triggered by empty results OR native API failure)
    if (!this.websearchClient || typeof this.websearchClient[websearchMethod] !== 'function') {
      throw new Error(`Websearch client or method ${websearchMethod} not available`);
    }

    try {
      // Use console.log (not this.log) so users always see fallback happening
      console.log(`[USPTO] Executing websearch fallback (method: ${websearchMethod})`);
      const result = await this.websearchClient[websearchMethod](args);
      this.metrics.websearchHits++;
      this.log('[USPTO] Websearch fallback success', {
        resultCount: Array.isArray(result) ? result.length : 'N/A'
      });
      return this.addMetadata(result, 'web_search_fallback', 0.8, 'Native API returned 0 results or failed');
    } catch (error) {
      this.metrics.websearchErrors++;
      this.log('[USPTO] Websearch fallback failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Backward compatibility wrappers
   */
  async searchPatentsWeb(args) { return this.searchPatents(args); }
  async searchInventorsWeb(args) { return this.searchInventors(args); }
  async searchAssigneesWeb(args) { return this.searchAssignees(args); }
  async searchPatentLocationsWeb(args) { return this.searchPatentLocations(args); }
  async searchCPCClassificationsWeb(args) { return this.searchCPCClassifications(args); }
  async searchCPCGroupsWeb(args) { return this.searchCPCGroups(args); }
  async searchUSPCClassificationsWeb(args) { return this.searchUSPCClassifications(args); }
  async searchWIPOClassificationsWeb(args) { return this.searchWIPOClassifications(args); }

  /**
   * Logging helper
   */
  log(message) {
    if (process.env.USPTO_VERBOSE_LOGGING === 'true' || process.env.HYBRID_VERBOSE_LOGGING === 'true') {
      console.log(message);
    }
  }
  
  /**
   * Get USPTO-specific metrics
   */
  getMetrics() {
    const baseMetrics = super.getMetrics();
    return {
      ...baseMetrics,
      circuitBreakerState: this.circuitBreaker.state,
      circuitBreakerFailures: this.circuitBreaker.failures,
      nativeAPIReliability: this.circuitBreaker.state === 'closed' ? 'healthy' : 'degraded'
    };
  }
}

