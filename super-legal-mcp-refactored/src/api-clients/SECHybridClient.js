/**
 * SEC Hybrid Client - Seamless integration of native SEC APIs and Exa web search
 *
 * REFACTORED to use BaseHybridClient for consistent routing strategies
 *
 * Strategy:
 * - Primary: SEC native APIs for structured XBRL data
 * - Fallback: Exa web search for document discovery and content
 * - Smart routing based on query type and data availability
 */

import { BaseHybridClient } from './BaseHybridClient.js';
import { SecEdgarClient } from './SecEdgarClient.js';
import { SECWebSearchClient } from './SECWebSearchClient.js';

export class SECHybridClient extends BaseHybridClient {
  /**
   * Create SEC Hybrid Client
   * @param {Object} rateLimiter - Rate limiter instance
   * @param {string} exaApiKey - Exa API key for websearch
   */
  constructor(rateLimiter, exaApiKey) {
    // Pass SecEdgarClient as native client and SECWebSearchClient as websearch client
    super(rateLimiter, exaApiKey, SecEdgarClient, SECWebSearchClient);

    this.log('SECHybridClient initialized');
  }

  // ==========================================
  // SECTION 1: CIK/TICKER RESOLUTION (HYBRID)
  // ==========================================

  /**
   * Search company tickers - Native first with websearch fallback
   * @param {Object} args - { search_term, exchange }
   * @returns {Promise<Object>} Search results
   */
  async searchSECCompanyTickers(args) {
    return this.executeHybrid('searchSECCompanyTickers', args, {
      strategy: 'native_first',
      cacheKey: `sec_ticker_${args.search_term}_${args.exchange || 'all'}`
    });
  }

  // ==========================================
  // SECTION 2: COMPANY FACTS (NATIVE PRIMARY)
  // ==========================================

  /**
   * Get company facts - Native API primary with websearch fallback
   * @param {Object} args - { company_identifier, concept }
   * @returns {Promise<Object>} Company facts
   */
  async getSECCompanyFacts(args) {
    return this.executeHybrid('getSECCompanyFacts', args, {
      strategy: 'native_first',
      cacheKey: args.concept ? `sec_facts_${args.company_identifier}_${args.concept}` : null
    });
  }

  // ==========================================
  // SECTION 3: XBRL FRAMES (NATIVE PRIMARY)
  // ==========================================

  /**
   * Get XBRL frames - Native API primary with websearch fallback
   * @param {Object} args - { taxonomy, concept, unit, period, limit }
   * @returns {Promise<Object>} XBRL frame data
   */
  async getSECXBRLFrames(args) {
    return this.executeHybrid('getSECXBRLFrames', args, {
      strategy: 'native_first',
      cacheKey: `sec_xbrl_${args.taxonomy || 'us-gaap'}_${args.concept}_${args.period}`
    });
  }

  // ==========================================
  // SECTION 4: FILINGS SEARCH (SMART ROUTING)
  // ==========================================

  /**
   * Search SEC filings - Smart routing based on query type
   * Uses native for structured lookups (CIK + date ranges)
   * Uses websearch for content-based queries
   * @param {Object} args - { company_identifier, filing_type, date_after, date_before, include_facts, limit }
   * @returns {Promise<Object>} Filing search results
   */
  async searchSECFilings(args) {
    return this.executeHybrid('searchSECFilings', args, {
      strategy: 'smart',
      cacheKey: args.company_identifier && args.filing_type ?
        `sec_filings_${args.company_identifier}_${args.filing_type}_${args.date_after || 'any'}` : null
    });
  }

  // ==========================================
  // SECTION 5: BACKWARD COMPATIBILITY WRAPPERS
  // ==========================================

  /**
   * Wrapper methods to maintain exact API compatibility with existing toolImplementations
   */

  /**
   * @deprecated Use searchSECCompanyTickers() instead
   */
  async searchSECCompanyTickersWeb(args) {
    return this.searchSECCompanyTickers(args);
  }

  /**
   * @deprecated Use getSECCompanyFacts() instead
   */
  async getSECCompanyFactsWeb(args) {
    return this.getSECCompanyFacts(args);
  }

  /**
   * @deprecated Use getSECXBRLFrames() instead
   */
  async getSECXBRLFramesWeb(args) {
    return this.getSECXBRLFrames(args);
  }

  /**
   * @deprecated Use searchSECFilings() instead
   */
  async searchSECFilingsWeb(args) {
    return this.searchSECFilings(args);
  }

  // ==========================================
  // SECTION 6: UTILITY METHODS
  // ==========================================

  /**
   * Get comprehensive metrics including SEC-specific stats
   * @returns {Object} Metrics with success rates and usage patterns
   */
  getMetrics() {
    const baseMetrics = super.getMetrics();

    return {
      ...baseMetrics,
      secSpecific: {
        nativeAPIHits: this.metrics.nativeAPIHits,
        nativeAPIErrors: this.metrics.nativeAPIErrors,
        websearchHits: this.metrics.websearchHits,
        websearchErrors: this.metrics.websearchErrors,
        cacheHits: this.metrics.cacheHits,
        totalRequests: this.metrics.totalRequests
      }
    };
  }

  /**
   * Clear SEC-specific cache entries
   */
  clearSECCache() {
    // Clear entries starting with 'sec_'
    for (const [key] of this.cache) {
      if (key.startsWith('sec_')) {
        this.cache.delete(key);
      }
    }
    this.log('SEC cache cleared');
  }
}
