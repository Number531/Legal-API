/**
 * EPA Hybrid Client
 *
 * Intelligently routes between EPA ECHO native API and Exa websearch
 *
 * Routing Strategy:
 * - **Websearch-first** due to EPA ECHO API unreliability (frequent 500 errors)
 * - Native API used for specific registry ID lookups when stable
 * - Circuit breaker pattern prevents cascading failures
 * - Retry logic with exponential backoff for transient errors
 * - Longer cache TTL (2 hours) due to EPA data stability
 */

import { BaseHybridClient } from './BaseHybridClient.js';
import { EPAComplianceClient } from './EPAComplianceClient.js';
import { EPAWebSearchClient } from './EPAWebSearchClient.js';

export class EPAHybridClient extends BaseHybridClient {
  /**
   * Create EPA Hybrid Client
   * @param {Object} rateLimiter - Rate limiter instance
   * @param {string} exaApiKey - Exa API key for websearch
   */
  constructor(rateLimiter, exaApiKey) {
    // Pass EPAComplianceClient as native client and EPAWebSearchClient as websearch client
    super(rateLimiter, exaApiKey, EPAComplianceClient, EPAWebSearchClient);

    // Override default strategy for EPA (native-first because native API uses QueryID pagination correctly)
    // NOTE: EPA ECHO API requires two-step process: get_facilities returns QueryID, then get_qid returns actual facilities
    // The native client (EPAComplianceClient) handles this correctly, while websearch cannot
    this.defaultStrategy = 'native_first';

    // Circuit breaker for native API
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      threshold: 5,              // Open circuit after 5 failures (increased from 3)
      resetTimeout: 300000,      // 5 minutes
      state: 'closed'            // closed | open | half-open
    };

    // Retry configuration for native API (merge with parent to keep retryableStatusCodes)
    this.retryConfig = {
      ...this.retryConfig,       // Keep parent's retryableStatusCodes
      maxRetries: 2,
      initialDelay: 1000,        // 1 second
      maxDelay: 5000,            // 5 seconds
      backoffMultiplier: 2
    };

    // EPA-specific caching (longer TTL due to data stability)
    this.defaultCacheTTL = 7200000; // 2 hours

    this.log('EPAHybridClient initialized with websearch-first strategy');
  }

  // ==========================================
  // SECTION 1: FACILITY SEARCH METHODS
  // ==========================================

  /**
   * Search EPA facilities - Websearch first (due to ECHO API unreliability)
   * Uses native API only for specific registry_id lookups
   * @param {Object} args - { facility_name, company_name, city, state, zip_code, compliance_status, violations_last_3_years, registry_id, limit }
   * @returns {Promise<Object>} Facility search results
   */
  async searchFacilities(args) {
    const { registry_id } = args;

    // If registry_id provided, try native first (specific lookup is more reliable)
    if (registry_id) {
      return this.executeHybrid('searchFacilities', args, {
        strategy: 'native_first',
        cacheKey: `epa_facility_${registry_id}`,
        cacheTTL: this.defaultCacheTTL
      });
    }

    // For name/location searches, use native ECHO API (handles QueryID pagination correctly)
    return this.executeHybrid('searchFacilities', args, {
      strategy: 'native_first',
      cacheKey: args.facility_name ? `epa_search_${args.facility_name}_${args.state || 'all'}` : null,
      cacheTTL: this.defaultCacheTTL
    });
  }

  /**
   * Get facility compliance history - Native DFR endpoint first
   * @param {Object} args - { facility_id, include_violations, include_enforcement }
   * @returns {Promise<Object>} Facility compliance report
   */
  async getFacilityCompliance(args) {
    const { facility_id } = args;

    // Use native DFR endpoint first (most accurate for facility compliance reports)
    return this.executeHybrid('getFacilityComplianceReport', args, {
      strategy: 'native_first',
      cacheKey: facility_id ? `epa_compliance_${facility_id}` : null,
      cacheTTL: this.defaultCacheTTL
    });
  }

  /**
   * Search violations - Native DFR endpoint first
   * @param {Object} args - { facility_id, program, date_after, date_before, limit }
   * @returns {Promise<Object>} Violations search results
   */
  async searchViolations(args) {
    const { facility_id } = args;

    // Use native DFR endpoint first (provides violations via get_dfr)
    return this.executeHybrid('searchViolations', args, {
      strategy: 'native_first',
      cacheKey: facility_id ? `epa_violations_${facility_id}` : null,
      cacheTTL: this.defaultCacheTTL
    });
  }

  // ==========================================
  // SECTION 2: CIRCUIT BREAKER & RETRY LOGIC
  // ==========================================

  /**
   * Enhanced native execution with circuit breaker and retry logic
   * Wraps native API calls with resilience patterns
   * @param {string} methodName - Native client method name
   * @param {Object} args - Method arguments
   * @returns {Promise<Object>} Native API result
   * @throws {Error} If all retries fail or circuit is open
   */
  async executeNativeWithRetry(methodName, args) {
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      const error = new Error('Circuit breaker open - native EPA API unavailable');
      console.error(`[EPAHybrid] ⚠ Circuit breaker OPEN (${this.circuitBreaker.failures} failures), skipping: ${methodName}`);
      this.log(`Circuit breaker open, skipping native API call to ${methodName}`);
      throw error;
    }

    let lastError = null;
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.error(`[EPAHybrid] Attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1} for ${methodName}`);
        this.log(`Attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1} for ${methodName}`);

        const result = await this.nativeClient[methodName](args);

        // Success - reset circuit breaker
        this.recordSuccess();
        console.error(`[EPAHybrid] ✓ Native API succeeded: ${methodName}`);
        this.log(`Native API call succeeded: ${methodName}`);
        return result;

      } catch (error) {
        lastError = error;
        console.error(`[EPAHybrid] Attempt ${attempt + 1} failed: ${error.message}`);

        // Don't record validation errors in circuit breaker (they're client-side, not API failures)
        if (!error.isValidationError) {
          this.recordFailure();
        }

        // Don't retry on client errors (4xx) or validation errors
        if ((error.statusCode && error.statusCode >= 400 && error.statusCode < 500) || 
            error.isValidationError) {
          this.log(`Client/validation error, not retrying: ${error.message}`);
          throw error;
        }

        // Retry on server errors (5xx) or timeouts
        if (attempt < this.retryConfig.maxRetries) {
          this.log(`Server error, retrying in ${delay}ms: ${error.message}`);
          await this.sleep(delay);
          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelay);
        } else {
          this.log(`All retries exhausted for ${methodName}`);
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if circuit breaker is open
   * @returns {boolean} True if circuit is open
   */
  isCircuitOpen() {
    if (this.circuitBreaker.state === 'closed') {
      return false;
    }

    // Check if we should try half-open
    const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailureTime;
    if (timeSinceFailure >= this.circuitBreaker.resetTimeout) {
      this.circuitBreaker.state = 'half-open';
      this.log('Circuit breaker entering half-open state');
      return false;
    }

    return true;
  }

  /**
   * Record successful native API call
   */
  recordSuccess() {
    if (this.circuitBreaker.failures > 0) {
      this.log('Circuit breaker: recording success, resetting failure count');
    }
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'closed';
  }

  /**
   * Record failed native API call
   */
  recordFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'open';
      console.error(`[EPAHybrid] Circuit breaker opened after ${this.circuitBreaker.failures} failures`);
    } else {
      this.log(`Circuit breaker: ${this.circuitBreaker.failures}/${this.circuitBreaker.threshold} failures`);
    }
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================
  // SECTION 3: STRATEGY OVERRIDES
  // ==========================================

  /**
   * Override websearch-first strategy to use circuit breaker
   * Try websearch first, optionally enhance with native data if circuit closed
   * @param {string} nativeMethod - Native client method name
   * @param {string} websearchMethod - Websearch client method name
   * @param {Object} args - Method arguments
   * @returns {Promise<Object>} Hybrid result
   */
  async websearchFirstStrategy(nativeMethod, websearchMethod, args) {
    try {
      // Execute websearch (primary strategy for EPA)
      const result = await this.websearchClient[websearchMethod](args);
      this.metrics.websearchHits++;

      // Try to enhance with native metadata (only if circuit closed)
      if (this.nativeClient && nativeMethod && !this.isCircuitOpen()) {
        try {
          this.log(`Attempting to enhance websearch result with native data from ${nativeMethod}`);
          const nativeData = await this.executeNativeWithRetry(nativeMethod, args);
          return this.mergeResults(result, nativeData);
        } catch (error) {
          this.log(`Native enhancement failed: ${error.message}`);
          // Non-critical, return websearch result
        }
      }

      return this.addMetadata(result, 'web_search_primary', 0.9, null);

    } catch (error) {
      this.metrics.websearchErrors++;
      this.log(`Websearch failed: ${error.message}`);

      // Don't fallback to unreliable native API - throw error
      throw error;
    }
  }

  /**
   * Override native-first strategy to use circuit breaker and retry
   * @param {string} nativeMethod - Native client method name
   * @param {string} websearchMethod - Websearch client method name
   * @param {Object} args - Method arguments
   * @returns {Promise<Object>} Hybrid result
   */
  async nativeFirstStrategy(nativeMethod, websearchMethod, args) {
    // Debug: Log entry and client state
    console.error(`[EPAHybrid] nativeFirstStrategy called:`, {
      nativeMethod,
      websearchMethod,
      hasNativeClient: !!this.nativeClient,
      nativeClientType: this.nativeClient?.constructor?.name,
      methodExists: this.nativeClient ? typeof this.nativeClient[nativeMethod] === 'function' : false
    });

    // Try native API first with circuit breaker and retry
    if (this.nativeClient && typeof this.nativeClient[nativeMethod] === 'function') {
      try {
        const result = await this.executeNativeWithRetry(nativeMethod, args);
        this.metrics.nativeAPIHits++;
        return this.addMetadata(result, 'native_api', 1.0, null);
      } catch (error) {
        // Re-throw validation errors immediately - don't fallback for client-side errors
        if (error.isValidationError) {
          throw error;
        }

        this.metrics.nativeAPIErrors++;
        if (!this.enableFallback) throw error;

        // Always log native API failures for debugging
        console.error(`[EPAHybrid] ✗ Native API failed: ${error.message}`);
        this.log(`Native API failed, falling back to websearch: ${error.message}`);
      }
    }

    // Fallback to websearch
    const result = await this.websearchClient[websearchMethod](args);
    this.metrics.websearchHits++;
    return this.addMetadata(result, 'web_search_fallback', 0.8, 'Native EPA API unavailable or failed');
  }

  /**
   * Merge websearch and native EPA data
   * @param {Object} websearchResult - Result from websearch
   * @param {Object} nativeResult - Result from native API
   * @returns {Object} Merged result
   */
  mergeResults(websearchResult, nativeResult) {
    try {
      const wsData = JSON.parse(websearchResult.content[0].text);
      const nativeData = JSON.parse(nativeResult.content[0].text);

      // Enhance with native compliance scores if available
      if (nativeData.compliance_summary) {
        wsData._native_compliance = {
          status: nativeData.compliance_summary.Status || null,
          quarters_in_noncompliance: nativeData.compliance_summary.QtrsInNC || null,
          formal_actions: nativeData.compliance_summary.FormalActions || null,
          total_penalties: nativeData.compliance_summary.TotalPenalties || null
        };
      }

      // Enhance facilities with native compliance data
      if (wsData.facilities && Array.isArray(wsData.facilities) && nativeData.facilities) {
        wsData.facilities = wsData.facilities.map((facility, index) => {
          const nativeFacility = nativeData.facilities[index];
          if (nativeFacility && nativeFacility.compliance) {
            facility._native_compliance = nativeFacility.compliance;
          }
          return facility;
        });
      }

      websearchResult.content[0].text = JSON.stringify(wsData, null, 2);
      return this.addMetadata(websearchResult, 'hybrid_enhanced', 0.95, 'Enhanced with native compliance data');

    } catch (error) {
      this.log(`Failed to merge results: ${error.message}`);
      return websearchResult;
    }
  }

  // ==========================================
  // SECTION 4: BACKWARD COMPATIBILITY WRAPPERS
  // ==========================================

  /**
   * Wrapper methods to maintain exact API compatibility with existing toolImplementations
   */

  /**
   * @deprecated Use searchFacilities() instead
   */
  async searchFacilitiesWeb(args) {
    return this.searchFacilities(args);
  }

  /**
   * @deprecated Use getFacilityCompliance() instead
   */
  async getFacilityComplianceWeb(args) {
    return this.getFacilityCompliance(args);
  }

  /**
   * @deprecated Use getFacilityCompliance() instead
   */
  async getFacilityComplianceReportWeb(args) {
    return this.getFacilityCompliance(args);
  }

  /**
   * @deprecated Use searchViolations() instead
   */
  async searchViolationsWeb(args) {
    return this.searchViolations(args);
  }

  // ==========================================
  // SECTION 5: UTILITY METHODS
  // ==========================================

  /**
   * Get comprehensive metrics including EPA-specific stats
   * @returns {Object} Metrics with success rates and usage patterns
   */
  getMetrics() {
    const baseMetrics = super.getMetrics();

    return {
      ...baseMetrics,
      epaSpecific: {
        nativeAPIHits: this.metrics.nativeAPIHits,
        nativeAPIErrors: this.metrics.nativeAPIErrors,
        websearchHits: this.metrics.websearchHits,
        websearchErrors: this.metrics.websearchErrors,
        cacheHits: this.metrics.cacheHits,
        totalRequests: this.metrics.totalRequests,
        circuitBreakerState: this.circuitBreaker.state,
        circuitBreakerFailures: this.circuitBreaker.failures,
        nativeAPIReliability: this.circuitBreaker.state === 'closed' ? 'healthy' : 'degraded'
      }
    };
  }

  /**
   * Clear EPA-specific cache entries
   */
  clearEPACache() {
    // Clear entries starting with 'epa_'
    for (const [key] of this.cache) {
      if (key.startsWith('epa_')) {
        this.cache.delete(key);
      }
    }
    this.log('EPA cache cleared');
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
}
