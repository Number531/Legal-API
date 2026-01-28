/**
 * CourtListener Hybrid Client
 *
 * Intelligently routes between CourtListener native API and Exa websearch based on query type
 *
 * Routing Strategy:
 * - ID-based lookups (case_id, judge_id, opinion_id) → native_first
 * - Citation lookups → native_first with caching
 * - Court metadata (court info, list courts) → native_first with caching
 * - Content searches (natural language queries) → smart routing
 * - Audio searches → native_first (specialized endpoint)
 */

import { BaseHybridClient } from './BaseHybridClient.js';
import { CourtListenerClient } from './courtlistenerClient.js';
import { CourtListenerWebSearchClient } from './CourtListenerWebSearchClient.js';

export class CourtListenerHybridClient extends BaseHybridClient {
  /**
   * Create CourtListener Hybrid Client
   * @param {Object} rateLimiter - Rate limiter instance
   * @param {string} exaApiKey - Exa API key for websearch
   */
  constructor(rateLimiter, exaApiKey) {
    // Pass CourtListenerClient as native client and CourtListenerWebSearchClient as websearch client
    super(rateLimiter, exaApiKey, CourtListenerClient, CourtListenerWebSearchClient);

    this.log('CourtListenerHybridClient initialized');
  }

  // ==========================================
  // SECTION 1: CASE SEARCH METHODS
  // ==========================================

  /**
   * Search cases - Smart routing based on query complexity
   * - Short, specific queries → native API
   * - Long natural language queries → websearch
   * - Queries with IDs or citations → native API
   */
  async searchCases(args) {
    return this.executeHybrid('searchCases', args, {
      strategy: 'smart'
    });
  }

  /**
   * Get case details by ID - Always use native API (ID lookup)
   */
  async getCaseDetails(args) {
    return this.executeHybrid('getCaseDetails', args, {
      strategy: 'native_first',
      cacheKey: args.case_id ? `cl_case_${args.case_id}` : null
    });
  }

  /**
   * Lookup citation - Native first with aggressive caching
   * Citations are frequently reused and benefit from caching
   */
  async lookupCitation(args) {
    return this.executeHybrid('lookupCitation', args, {
      strategy: 'native_first',
      cacheKey: args.citation ? `cl_citation_${args.citation.replace(/[^a-zA-Z0-9]/g, '_')}` : null
    });
  }

  // ==========================================
  // SECTION 2: JUDGE METHODS
  // ==========================================

  /**
   * Search judges - Smart routing
   * - Name-based searches → native API
   * - Complex filters → native API
   */
  async searchJudges(args) {
    return this.executeHybrid('searchJudges', args, {
      strategy: 'native_first'
    });
  }

  /**
   * Get judge details by ID - Always use native API (ID lookup)
   */
  async getJudgeDetails(args) {
    return this.executeHybrid('getJudgeDetails', args, {
      strategy: 'native_first',
      cacheKey: args.judge_id ? `cl_judge_${args.judge_id}` : null
    });
  }

  // ==========================================
  // SECTION 3: COURT METADATA METHODS
  // ==========================================

  /**
   * Get court info - Native first with caching
   * Court information is static and benefits from long caching
   */
  async getCourtInfo(args) {
    return this.executeHybrid('getCourtInfo', args, {
      strategy: 'native_first',
      cacheKey: args.court_id ? `cl_court_${args.court_id}` : null,
      cacheTTL: 86400000 // 24 hours
    });
  }

  /**
   * List all courts - Native first with caching
   * Court list rarely changes, benefits from long caching
   */
  async listCourts(args) {
    return this.executeHybrid('listCourts', args || {}, {
      strategy: 'native_first',
      cacheKey: 'cl_courts_list',
      cacheTTL: 86400000 // 24 hours
    });
  }

  // ==========================================
  // SECTION 4: OPINION METHODS
  // ==========================================

  /**
   * Search opinions - Smart routing
   * - Specific filters (status, type, sha1) → native API
   * - Content-based queries → smart routing
   */
  async searchOpinions(args) {
    return this.executeHybrid('searchOpinions', args, {
      strategy: 'smart'
    });
  }

  /**
   * Get opinion with citations - Native first
   * Includes citation network analysis
   */
  async getOpinionWithCitations(args) {
    return this.executeHybrid('getOpinionWithCitations', args, {
      strategy: 'native_first',
      cacheKey: args.opinion_id ? `cl_opinion_cit_${args.opinion_id}` : null
    });
  }

  // ==========================================
  // SECTION 5: AUDIO METHODS
  // ==========================================

  /**
   * Search audio - Native first
   * Audio searches use specialized CourtListener endpoint
   */
  async searchAudio(args) {
    return this.executeHybrid('searchAudio', args, {
      strategy: 'native_first'
    });
  }

  /**
   * Get audio details - Native first with caching
   */
  async getAudioDetails(args) {
    return this.executeHybrid('getAudioDetails', args, {
      strategy: 'native_first',
      cacheKey: args.audio_id ? `cl_audio_${args.audio_id}` : null
    });
  }

  // ==========================================
  // SECTION 6: DOCKET METHODS
  // ==========================================

  /**
   * Search dockets - Smart routing
   * - Specific case_name or docket_number → native API
   * - Complex queries → smart routing
   */
  async searchDockets(args) {
    return this.executeHybrid('searchDockets', args, {
      strategy: 'smart'
    });
  }

  // ==========================================
  // SECTION 7: BACKWARD COMPATIBILITY WRAPPERS
  // ==========================================

  /**
   * Wrapper methods to maintain exact API compatibility with existing toolImplementations
   */

  /**
   * @deprecated Use searchCases() instead
   */
  async searchCasesWeb(args) {
    return this.searchCases(args);
  }

  /**
   * @deprecated Use getCaseDetails() instead
   */
  async getCaseDetailsWeb(args) {
    return this.getCaseDetails(args);
  }

  /**
   * @deprecated Use lookupCitation() instead
   */
  async lookupCitationWeb(args) {
    return this.lookupCitation(args);
  }

  /**
   * @deprecated Use searchJudges() instead
   */
  async searchJudgesWeb(args) {
    return this.searchJudges(args);
  }

  /**
   * @deprecated Use getJudgeDetails() instead
   */
  async getJudgeDetailsWeb(args) {
    return this.getJudgeDetails(args);
  }

  /**
   * @deprecated Use getCourtInfo() instead
   */
  async getCourtInfoWeb(args) {
    return this.getCourtInfo(args);
  }

  /**
   * @deprecated Use listCourts() instead
   */
  async listCourtsWeb(args) {
    return this.listCourts(args);
  }

  /**
   * @deprecated Use searchOpinions() instead
   */
  async searchOpinionsWeb(args) {
    return this.searchOpinions(args);
  }

  /**
   * @deprecated Use getOpinionWithCitations() instead
   */
  async getOpinionWithCitationsWeb(args) {
    return this.getOpinionWithCitations(args);
  }

  /**
   * @deprecated Use searchAudio() instead
   */
  async searchAudioWeb(args) {
    return this.searchAudio(args);
  }

  /**
   * @deprecated Use getAudioDetails() instead
   */
  async getAudioDetailsWeb(args) {
    return this.getAudioDetails(args);
  }

  /**
   * @deprecated Use searchDockets() instead
   */
  async searchDocketsWeb(args) {
    return this.searchDockets(args);
  }

  // ==========================================
  // SECTION 8: UTILITY METHODS
  // ==========================================

  /**
   * Get comprehensive metrics including CourtListener-specific stats
   * @returns {Object} Metrics with success rates and usage patterns
   */
  getMetrics() {
    const baseMetrics = super.getMetrics();

    return {
      ...baseMetrics,
      courtListenerSpecific: {
        nativeAPIHits: this.metrics.nativeAPIHits,
        nativeAPIErrors: this.metrics.nativeAPIErrors,
        websearchHits: this.metrics.websearchHits,
        websearchErrors: this.metrics.websearchErrors,
        cacheHits: this.metrics.cacheHits,
        totalRequests: this.metrics.totalRequests,
        citationCacheHitRate: this.calculateCitationCacheHitRate()
      }
    };
  }

  /**
   * Calculate citation-specific cache hit rate
   * @returns {number} Cache hit rate for citation lookups
   */
  calculateCitationCacheHitRate() {
    let citationCacheHits = 0;
    let citationTotalRequests = 0;

    // Count citation cache entries
    for (const [key] of this.cache) {
      if (key.startsWith('cl_citation_')) {
        citationTotalRequests++;
        const cached = this.cache.get(key);
        if (cached) citationCacheHits++;
      }
    }

    return citationTotalRequests > 0 ? citationCacheHits / citationTotalRequests : 0;
  }

  /**
   * Clear CourtListener-specific cache entries
   */
  clearCourtListenerCache() {
    // Clear entries starting with 'cl_'
    for (const [key] of this.cache) {
      if (key.startsWith('cl_')) {
        this.cache.delete(key);
      }
    }
    this.log('CourtListener cache cleared');
  }
}
