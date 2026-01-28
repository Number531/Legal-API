/**
 * BaseHybridClient.js
 *
 * Generic base class for hybrid API clients that intelligently route between
 * native APIs and Exa websearch, with automatic fallback, caching, and metrics.
 *
 * Features:
 * - 4 routing strategies: native_first, websearch_first, parallel, smart
 * - Query analysis to determine optimal routing
 * - Automatic fallback on errors
 * - Smart caching with configurable TTL
 * - Comprehensive metrics tracking
 * - Metadata injection for observability
 *
 * @module BaseHybridClient
 */

import { BaseWebSearchClient } from './BaseWebSearchClient.js';

export class BaseHybridClient extends BaseWebSearchClient {
  /**
   * Create a new BaseHybridClient
   * @param {Object} rateLimiter - Rate limiter instance for API throttling
   * @param {string} exaApiKey - Exa API key for websearch functionality
   * @param {Class} nativeClientClass - Optional native API client class to instantiate
   * @param {Class} websearchClientClass - Optional websearch client class to instantiate
   */
  constructor(rateLimiter, exaApiKey, nativeClientClass = null, websearchClientClass = null) {
    super(rateLimiter, exaApiKey);

    // Instantiate native client if class provided
    this.nativeClient = nativeClientClass ? new nativeClientClass(rateLimiter) : null;

    // Instantiate websearch client if class provided
    this.websearchClient = websearchClientClass ? new websearchClientClass(rateLimiter, exaApiKey) : null;

    // Feature flags from environment
    this.preferNative = process.env.HYBRID_PREFER_NATIVE !== 'false'; // Default true
    this.enableCache = process.env.HYBRID_ENABLE_CACHE !== 'false'; // Default true
    this.enableFallback = process.env.HYBRID_ENABLE_FALLBACK !== 'false'; // Default true
    this.verboseLogging = process.env.HYBRID_VERBOSE_LOGGING === 'true'; // Default false
    this.enhanceWebsearchWithNative = true; // Default true (can be overridden by subclasses)

    // Cache configuration
    this.cache = new Map();
    this.cacheTTL = 3600000; // 1 hour in milliseconds

    // Metrics tracking
    this.metrics = {
      nativeAPIHits: 0,
      nativeAPIErrors: 0,
      websearchHits: 0,
      websearchErrors: 0,
      cacheHits: 0,
      totalRequests: 0,
      lastReset: new Date().toISOString()
    };

    // Shared Circuit Breaker for native API protection
    // Child classes can override threshold/resetTimeout if needed
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      threshold: 5,              // Open circuit after 5 consecutive failures
      resetTimeout: 300000,      // 5 minutes (300s) before trying again
      state: 'closed'            // 'closed' | 'open' | 'half-open'
    };

    this.log('BaseHybridClient initialized', {
      nativeClient: !!this.nativeClient,
      preferNative: this.preferNative,
      enableCache: this.enableCache,
      enableFallback: this.enableFallback
    });
  }

  // ===========================================================================
  // CIRCUIT BREAKER METHODS (Shared across all hybrid clients)
  // ===========================================================================

  /**
   * Check if circuit breaker is open (native API should be skipped)
   * @returns {boolean} true if circuit is open and should skip native API
   */
  isCircuitOpen() {
    if (this.circuitBreaker.state === 'closed') {
      return false;
    }

    // Check if we should transition to half-open
    const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailureTime;
    if (timeSinceFailure >= this.circuitBreaker.resetTimeout) {
      this.circuitBreaker.state = 'half-open';
      this.log('Circuit breaker entering half-open state');
      return false; // Allow one test request
    }

    return true; // Circuit is open, skip native API
  }

  /**
   * Record a successful native API call (resets circuit breaker)
   */
  recordSuccess() {
    if (this.circuitBreaker.failures > 0) {
      this.log('Circuit breaker: recording success, resetting failure count');
    }
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'closed';
  }

  /**
   * Record a failed native API call (may open circuit breaker)
   */
  recordFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'open';
      console.error(`[${this.constructor.name}] Circuit breaker OPENED after ${this.circuitBreaker.failures} failures`);
    } else {
      this.log(`Circuit breaker: ${this.circuitBreaker.failures}/${this.circuitBreaker.threshold} failures`);
    }
  }

  /**
   * Reset circuit breaker (for testing or manual recovery)
   */
  resetCircuitBreaker() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.lastFailureTime = null;
    this.circuitBreaker.state = 'closed';
    this.log('Circuit breaker manually reset');
  }

  /**
   * Get circuit breaker status
   * @returns {Object} Circuit breaker state information
   */
  getCircuitBreakerStatus() {
    return {
      state: this.circuitBreaker.state,
      failures: this.circuitBreaker.failures,
      threshold: this.circuitBreaker.threshold,
      lastFailureTime: this.circuitBreaker.lastFailureTime,
      reliability: this.circuitBreaker.state === 'closed' ? 'healthy' : 'degraded'
    };
  }

  /**
   * Main entry point for hybrid execution
   * @param {string} methodName - Name of the method to call on native client
   * @param {Object} args - Arguments to pass to the method
   * @param {Object} options - Hybrid execution options
   * @param {string} options.strategy - 'native_first', 'websearch_first', 'parallel', 'smart' (default: 'native_first')
   * @param {string} options.cacheKey - Optional cache key for this request
   * @param {number} options.cacheTTL - Optional cache TTL override (ms)
   * @returns {Promise<Object>} Response with _hybrid_metadata
   */
  async executeHybrid(methodName, args, options = {}) {
    this.metrics.totalRequests++;

    const {
      strategy = 'native_first',
      cacheKey = null,
      cacheTTL = this.cacheTTL,
      nativeMethodName = null,
      websearchMethodName = null,
      websearchArgs = null
    } = options;

    this.log(`executeHybrid called`, { methodName, strategy, args });

    // Check cache first
    if (this.enableCache && cacheKey) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        this.log('Cache hit', { cacheKey });
        return this.addMetadata(cached, 'cache', 1.0, null);
      }
    }

    // Determine method names from options or use defaults
    // Use nativeMethodName from options if explicitly provided (can be null to skip native)
    // Otherwise default to methodName using nullish coalescing
    const finalNativeMethodName = nativeMethodName ?? methodName;
    const finalWebsearchMethodName = websearchMethodName || (methodName.replace(/Native$/, '') + 'Web');

    // Store websearchArgs for fallback use
    this.currentWebsearchArgs = websearchArgs || null;

    // Execute based on strategy
    let result;
    try {
      switch (strategy) {
        case 'native_first':
          result = await this.nativeFirstStrategy(finalNativeMethodName, finalWebsearchMethodName, args);
          break;
        case 'websearch_first':
          result = await this.websearchFirstStrategy(finalNativeMethodName, finalWebsearchMethodName, args);
          break;
        case 'parallel':
          result = await this.parallelStrategy(finalNativeMethodName, finalWebsearchMethodName, args);
          break;
        case 'smart':
          result = await this.smartStrategy(finalNativeMethodName, finalWebsearchMethodName, args);
          break;
        default:
          throw new Error(`Unknown strategy: ${strategy}`);
      }

      // Cache successful result
      if (this.enableCache && cacheKey && result) {
        this.setInCache(cacheKey, result, cacheTTL);
      }

      return result;
    } catch (error) {
      this.log('executeHybrid error', { error: error.message });
      throw error;
    }
  }

  /**
   * Native-first strategy: Try native API first, fallback to websearch on error
   * @param {string} nativeMethod - Native method name
   * @param {string} websearchMethod - Websearch method name
   * @param {Object} args - Method arguments
   * @returns {Promise<Object>} Response with metadata
   */
  async nativeFirstStrategy(nativeMethod, websearchMethod, args) {
    // Try native API first
    if (this.nativeClient && typeof this.nativeClient[nativeMethod] === 'function') {
      try {
        this.log('Trying native API first', { method: nativeMethod });
        const result = await this.nativeClient[nativeMethod](args);
        this.metrics.nativeAPIHits++;

        // Check for empty results and trigger fallback if enabled
        if (this.enableFallback && this.isEmptyResult && this.isEmptyResult(result)) {
          this.log('Native returned empty results, triggering fallback');
          // Continue to fallback logic below instead of returning
        } else {
          this.log('Native API success');
          return this.addMetadata(result, 'native_api', 1.0, null);
        }
      } catch (error) {
        this.metrics.nativeAPIErrors++;
        
        // Import error handling for graceful logging
        const { APIError } = await import('../utils/errorHandling.js');
        
        // Check if this is an expected API limitation
        const isExpectedLimitation = error instanceof APIError && error.isAPILimitation();
        
        if (isExpectedLimitation) {
          this.log('Native API limitation detected (expected)', { 
            category: error.category,
            willFallback: true 
          });
        } else {
          this.log('Native API failed', { error: error.message });
        }

        // Fallback to websearch if enabled
        if (!this.enableFallback) {
          throw error;
        }
      }
    }

    // Fallback to websearch
    if (!this.websearchClient || typeof this.websearchClient[websearchMethod] !== 'function') {
      throw new Error(`Websearch client or method ${websearchMethod} not available`);
    }

    try {
      this.log('Using web search fallback', { method: websearchMethod, reason: 'api_limitation' });
      // Use websearchArgs if provided in options, otherwise use original args
      const argsToUse = this.currentWebsearchArgs || args;
      const result = await this.websearchClient[websearchMethod](argsToUse);
      this.metrics.websearchHits++;
      this.log('Websearch completed successfully');
      return this.addMetadata(result, 'web_search_fallback', 0.8, 'Native API limitation');
    } catch (error) {
      this.metrics.websearchErrors++;
      this.log('Websearch fallback failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Websearch-first strategy: Use websearch primarily, enhance with native metadata if available
   * @param {string} nativeMethod - Native method name
   * @param {string} websearchMethod - Websearch method name
   * @param {Object} args - Method arguments
   * @returns {Promise<Object>} Response with metadata
   */
  async websearchFirstStrategy(nativeMethod, websearchMethod, args) {
    // Try websearch first
    if (!this.websearchClient || typeof this.websearchClient[websearchMethod] !== 'function') {
      // If no websearch client, fall back to native
      if (this.nativeClient && typeof this.nativeClient[nativeMethod] === 'function') {
        return this.nativeFirstStrategy(nativeMethod, websearchMethod, args);
      }
      throw new Error(`Neither websearch nor native client available for ${websearchMethod}`);
    }

    try {
      this.log('Trying websearch first', { method: websearchMethod });
      // Use websearchArgs if provided in options, otherwise use original args
      const argsToUse = this.currentWebsearchArgs || args;
      const result = await this.websearchClient[websearchMethod](argsToUse);
      this.metrics.websearchHits++;
      this.log('Websearch success');

      // Optionally enhance with native metadata (only if enabled)
      if (this.enhanceWebsearchWithNative && this.nativeClient && typeof this.nativeClient[nativeMethod] === 'function') {
        try {
          const nativeResult = await this.nativeClient[nativeMethod](args);
          this.metrics.nativeAPIHits++;
          const merged = this.mergeResults(result, nativeResult);
          this.log('Enhanced websearch with native metadata');
          return this.addMetadata(merged, 'web_search_primary', 0.9, null);
        } catch (error) {
          this.metrics.nativeAPIErrors++;
          // Native enhancement failed, return websearch result
          this.log('Native enhancement failed, returning websearch only');
          return this.addMetadata(result, 'web_search_primary', 0.85, 'Native enhancement failed');
        }
      }

      this.log('Returning websearch-only result (no native enhancement)');
      return this.addMetadata(result, 'web_search_primary', 0.85, null);
    } catch (error) {
      this.metrics.websearchErrors++;
      this.log('Websearch failed', { error: error.message });

      // Fallback to native if enabled
      if (!this.enableFallback || !this.nativeClient) {
        throw error;
      }

      try {
        this.log('Falling back to native API', { method: nativeMethod });
        const result = await this.nativeClient[nativeMethod](args);
        this.metrics.nativeAPIHits++;
        this.log('Native API fallback success');
        return this.addMetadata(result, 'native_api', 0.9, 'Websearch unavailable');
      } catch (nativeError) {
        this.metrics.nativeAPIErrors++;
        this.log('Native API fallback failed', { error: nativeError.message });
        throw nativeError;
      }
    }
  }

  /**
   * Parallel strategy: Execute both simultaneously, return fastest result
   * @param {string} nativeMethod - Native method name
   * @param {string} websearchMethod - Websearch method name
   * @param {Object} args - Method arguments
   * @returns {Promise<Object>} Response with metadata
   */
  async parallelStrategy(nativeMethod, websearchMethod, args) {
    this.log('Executing parallel strategy');

    const promises = [];

    // Add native API promise if available
    if (this.nativeClient && typeof this.nativeClient[nativeMethod] === 'function') {
      promises.push(
        this.nativeClient[nativeMethod](args)
          .then(result => {
            this.metrics.nativeAPIHits++;
            return { source: 'native_api', result, confidence: 1.0 };
          })
          .catch(error => {
            this.metrics.nativeAPIErrors++;
            return { source: 'native_api', error };
          })
      );
    }

    // Add websearch promise if available
    if (this.websearchClient && typeof this.websearchClient[websearchMethod] === 'function') {
      promises.push(
        this.websearchClient[websearchMethod](args)
          .then(result => {
            this.metrics.websearchHits++;
            return { source: 'web_search', result, confidence: 0.85 };
          })
          .catch(error => {
            this.metrics.websearchErrors++;
            return { source: 'web_search', error };
          })
      );
    }

    // Wait for first successful result
    const results = await Promise.all(promises);

    // Find first successful result
    const success = results.find(r => r.result && !r.error);
    if (success) {
      this.log('Parallel strategy - first success', { source: success.source });
      return this.addMetadata(success.result, success.source, success.confidence, null);
    }

    // All failed
    this.log('Parallel strategy - all requests failed');
    throw new Error('All parallel requests failed');
  }

  /**
   * Smart strategy: Analyze query to determine best routing
   * @param {string} nativeMethod - Native method name
   * @param {string} websearchMethod - Websearch method name
   * @param {Object} args - Method arguments
   * @returns {Promise<Object>} Response with metadata
   */
  async smartStrategy(nativeMethod, websearchMethod, args) {
    const analysis = this.analyzeQuery(args);

    this.log('Smart routing analysis', {
      preferNative: analysis.preferNative,
      confidence: analysis.confidence,
      reason: analysis.reason
    });

    if (analysis.preferNative) {
      return this.nativeFirstStrategy(nativeMethod, websearchMethod, args);
    } else {
      return this.websearchFirstStrategy(nativeMethod, websearchMethod, args);
    }
  }

  /**
   * Analyze query to determine whether to prefer native API or websearch
   * @param {Object} args - Query arguments
   * @returns {Object} Analysis result with preferNative, confidence, and reason
   */
  analyzeQuery(args) {
    // Check for specific ID fields that indicate native preference
    const nativeIdFields = [
      'case_id', 'judge_id', 'opinion_id', 'audio_id', 'docket_id',
      'cik', 'ticker', 'accession_number',
      'citation', 'neutral_citation',
      'patent_number', 'application_number',
      'facility_id', 'permit_id'
    ];

    // Check if any ID field is present
    for (const field of nativeIdFields) {
      if (args[field]) {
        return {
          preferNative: true,
          confidence: 0.95,
          reason: `Specific ID field present: ${field}`
        };
      }
    }

    // Check for structured lookups (court + docket_number)
    if (args.court && args.docket_number) {
      return {
        preferNative: true,
        confidence: 0.9,
        reason: 'Structured lookup: court + docket_number'
      };
    }

    // Check for date range filters (native APIs handle these well)
    if (args.date_filed_after || args.date_filed_before ||
        args.date_argued_after || args.date_argued_before) {
      return {
        preferNative: true,
        confidence: 0.85,
        reason: 'Date range filter present'
      };
    }

    // Check for websearch indicators
    if (args.include_snippet || args.highlight_keywords) {
      return {
        preferNative: false,
        confidence: 0.9,
        reason: 'Content-focused features requested'
      };
    }

    // Analyze query text if present
    if (args.query) {
      const queryLength = args.query.length;
      const hasComplexKeywords = /\b(about|regarding|related to|concerning|discuss|analyze)\b/i.test(args.query);

      // Short, specific queries → native
      if (queryLength < 30 && !hasComplexKeywords) {
        return {
          preferNative: true,
          confidence: 0.7,
          reason: 'Short, specific query'
        };
      }

      // Long, complex queries → websearch
      if (queryLength > 50 || hasComplexKeywords) {
        return {
          preferNative: false,
          confidence: 0.75,
          reason: 'Long or complex natural language query'
        };
      }
    }

    // Default: prefer native per configuration
    return {
      preferNative: this.preferNative,
      confidence: 0.5,
      reason: 'Default preference'
    };
  }

  /**
   * Add hybrid metadata to response
   * @param {Object} result - Response object
   * @param {string} source - Data source ('native_api', 'web_search_fallback', etc.)
   * @param {number} confidence - Confidence score 0.0-1.0
   * @param {string|null} fallbackReason - Reason for fallback if applicable
   * @returns {Object} Result with _hybrid_metadata added
   */
  addMetadata(result, source, confidence, fallbackReason) {
    // Parse result if it's in MCP format
    if (result && result.content && Array.isArray(result.content)) {
      try {
        const parsed = JSON.parse(result.content[0].text);
        parsed._hybrid_metadata = {
          source,
          confidence,
          fallback_used: source.includes('fallback'),
          fallback_reason: fallbackReason,
          timestamp: new Date().toISOString()
        };
        result.content[0].text = JSON.stringify(parsed, null, 2);
        return result;
      } catch (error) {
        // If not JSON, add metadata as separate content block
        result.content.push({
          type: 'text',
          text: JSON.stringify({
            _hybrid_metadata: {
              source,
              confidence,
              fallback_used: source.includes('fallback'),
              fallback_reason: fallbackReason,
              timestamp: new Date().toISOString()
            }
          }, null, 2)
        });
        return result;
      }
    }

    // Direct object - add metadata
    if (result && typeof result === 'object') {
      result._hybrid_metadata = {
        source,
        confidence,
        fallback_used: source.includes('fallback'),
        fallback_reason: fallbackReason,
        timestamp: new Date().toISOString()
      };
    }

    return result;
  }

  /**
   * Merge websearch and native results
   * @param {Object} websearchResult - Websearch result
   * @param {Object} nativeResult - Native API result
   * @returns {Object} Merged result
   */
  mergeResults(websearchResult, nativeResult) {
    // Parse both results
    let webData, nativeData;

    try {
      if (websearchResult.content && websearchResult.content[0]) {
        webData = JSON.parse(websearchResult.content[0].text);
      } else {
        webData = websearchResult;
      }
    } catch (error) {
      webData = websearchResult;
    }

    try {
      if (nativeResult.content && nativeResult.content[0]) {
        nativeData = JSON.parse(nativeResult.content[0].text);
      } else {
        nativeData = nativeResult;
      }
    } catch (error) {
      nativeData = nativeResult;
    }

    // Merge: websearch content + native metadata
    const merged = {
      ...webData,
      _native_metadata: nativeData,
      _enhanced_with_native: true
    };

    // Return in MCP format
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(merged, null, 2)
        }
      ]
    };
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Object|null} Cached value or null
   */
  getFromCache(key) {
    if (!this.enableCache) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check TTL
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {Object} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  setInCache(key, value, ttl = this.cacheTTL) {
    if (!this.enableCache) return;

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    this.log('Cache set', { key, ttl });
  }

  /**
   * Get metrics
   * @returns {Object} Current metrics with calculated rates
   */
  getMetrics() {
    const nativeTotal = this.metrics.nativeAPIHits + this.metrics.nativeAPIErrors;
    const websearchTotal = this.metrics.websearchHits + this.metrics.websearchErrors;

    return {
      ...this.metrics,
      nativeSuccessRate: nativeTotal > 0 ? (this.metrics.nativeAPIHits / nativeTotal) : 0,
      websearchSuccessRate: websearchTotal > 0 ? (this.metrics.websearchHits / websearchTotal) : 0,
      cacheHitRate: this.metrics.totalRequests > 0 ? (this.metrics.cacheHits / this.metrics.totalRequests) : 0,
      nativeUsagePercentage: this.metrics.totalRequests > 0 ? (this.metrics.nativeAPIHits / this.metrics.totalRequests) : 0,
      websearchUsagePercentage: this.metrics.totalRequests > 0 ? (this.metrics.websearchHits / this.metrics.totalRequests) : 0
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      nativeAPIHits: 0,
      nativeAPIErrors: 0,
      websearchHits: 0,
      websearchErrors: 0,
      cacheHits: 0,
      totalRequests: 0,
      lastReset: new Date().toISOString()
    };
    this.log('Metrics reset');
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.log('Cache cleared');
  }

  /**
   * Internal logging
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  log(message, data = {}) {
    if (this.verboseLogging) {
      console.error(`[BaseHybridClient] ${message}`, data);
    }
  }
}
