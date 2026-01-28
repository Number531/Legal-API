/**
 * BaseWebSearchClient - Standardized Exa Configuration & Content Strategy
 * Provides unified configuration and quality assessment for all WebSearchClients
 * Updated to use summary/text instead of deprecated highlights parameter
 */

import { SearchQualityMixin } from './SearchQualityMixin.js';
import { ContentStrategy } from './ContentStrategy.js';
import { extractFromSummary, fallbackToTextParsing, sanitizeData } from './schemas/SchemaValidator.js';

export class BaseWebSearchClient extends SearchQualityMixin {
  constructor(rateLimiter, exaApiKey, contentStrategy = null) {
    super();
    this.rateLimiter = rateLimiter;
    this.exaApiKey = exaApiKey || process.env.EXA_API_KEY;

    // Inject ContentStrategy (dependency injection for testability)
    this.contentStrategy = contentStrategy || new ContentStrategy();

    if (!this.exaApiKey) {
      console.warn('EXA_API_KEY not configured. Web search functionality will be limited.');
    }

    // Domain-specific summary queries - Enhanced with comprehensive legal terms
    // These queries guide AI summary generation (replaces deprecated highlights)
    this.summaryQueries = {
      // Core legal domains with expanded context terms
      case_law: 'holding precedent citation court judge opinion dissent concurrence reversed affirmed decision ruling ' +
                'remanded vacated en banc certiorari jurisdiction standing summary judgment motion dismiss preliminary injunction ' +
                'class action damages relief remedy',

      securities: 'revenue net income earnings assets liabilities cash flow EBITDA fiscal year quarterly annual ' +
                  'financial results 10-K 10-Q 8-K proxy statement material adverse change going concern audit opinion ' +
                  'restatement insider trading disclosure',

      patent: 'patent claims prior art inventor examiner filing date priority invalidity obviousness PTAB proceeding ' +
              'continuation prosecution history doctrine equivalents infringement willful treble damages licensing royalty',

      // Additional legal domains for cross-cutting searches
      bankruptcy: 'chapter 7 chapter 11 chapter 13 liquidation reorganization debtor creditor automatic stay discharge ' +
                  'plan confirmation priority claim secured unsecured administrative expense trustee DIP financing cram down',

      employment: 'discrimination harassment retaliation EEOC Title VII ADA FLSA overtime exempt non-exempt wrongful ' +
                  'termination hostile work environment reasonable accommodation collective bargaining NLRB',

      intellectual_property: 'copyright trademark trade secret fair use dilution likelihood confusion distinctiveness ' +
                            'secondary meaning first sale doctrine DMCA takedown',

      // Procedural and transactional domains
      procedural: 'statute limitations discovery deposition interrogatory subpoena motion limine ' +
                  'voir dire expert witness Daubert Frye admissible hearsay privilege work product ' +
                  'protective order summary judgment default judgment appeal brief oral argument amicus curiae',

      transactional: 'merger acquisition due diligence earnout escrow indemnification representations warranties ' +
                     'material adverse effect closing conditions regulatory approval HSR covenant breach cure period ' +
                     'definitive agreement LOI term sheet',

      // Existing domains (unchanged)
      environmental: 'compliance status violations penalties enforcement noncompliance quarters facility emissions permit NPDES',
      pharmaceutical_safety: 'adverse events warnings contraindications recall death serious hospitalization drug device safety risk black box FDA approval',
      antitrust: 'antitrust merger enforcement FTC complaint consent decree Hart Scott Rodino competition',
      automotive: 'recall defect NHTSA safety investigation campaign remedy',
      product_safety: 'recall hazard injury CPSC safety defect consumer product',
      regulatory: 'federal register rule regulation CFR USC agency enforcement guidance',
      state_law: 'statute code section amendment legislative session governor signed'
    };

    // Retry configuration
    this.retryConfig = {
      maxRetries: 2,
      baseDelayMs: 1000,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504]
    };
  }

  // ===========================================================================
  // RETRY HELPER METHODS
  // ===========================================================================

  /**
   * Check if an HTTP error is retryable
   * @param {number} statusCode - HTTP status code
   * @returns {boolean} true if should retry
   */
  isRetryableError(statusCode) {
    return this.retryConfig.retryableStatusCodes.includes(statusCode);
  }

  /**
   * Delay helper for retry backoff
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Standardized Exa search execution with ContentStrategy
   * @param {string} query - Search query
   * @param {number} limit - Result limit
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Processed search results
   */
  async executeExaSearch(query, limit, options = {}) {
    if (!this.exaApiKey) {
      // DEFENSIVE ERROR HANDLING - Returns empty array for graceful degradation
      console.error('Exa API key not configured. Set EXA_API_KEY environment variable.');
      return [];
    }

    if (this.rateLimiter && typeof this.rateLimiter.enforce === 'function') {
      await this.rateLimiter.enforce();
    }

    const {
      domain,
      dataType,
      highlightQuery, // Legacy support
      summaryQuery,
      includeDomains,
      includeFullText = false,
      comprehensive = false,
      fallbackToText = true,
      _retryCount = 0  // Internal retry tracking
    } = options;

    // Generate optimized summary query (replaces highlight query)
    const optimizedSummaryQuery = summaryQuery || this.generateSummaryQuery(
      highlightQuery, // Legacy
      query,
      domain
    );

    // Determine content strategy
    const strategyConfig = this.contentStrategy.determine({
      dataType,
      query,
      domain,
      limit,
      includeFullText,
      highlightQuery: optimizedSummaryQuery,
      comprehensive
    });

    // Build Exa API request
    // IMPORTANT: Exa API requires content extraction params under 'contents' key
    const requestBody = {
      query,
      numResults: limit,
      type: 'auto',
      livecrawl: 'preferred',  // Use 'preferred' for flexibility (matches Python working example)
      contents: strategyConfig.config  // Wrap config in 'contents' key
    };

    if (includeDomains) {
      requestBody.includeDomains = includeDomains;
    }

    // Exa API timeout: 60s per-request (doesn't block 10-min iterative research)
    const EXA_TIMEOUT_MS = 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXA_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': this.exaApiKey
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const statusCode = response.status;

        // Retry for transient errors (408, 429, 500, 502, 503, 504)
        if (this.isRetryableError(statusCode) && _retryCount < this.retryConfig.maxRetries) {
          const delayMs = this.retryConfig.baseDelayMs * (_retryCount + 1); // Linear backoff
          console.log(`[Exa] Retry ${_retryCount + 1}/${this.retryConfig.maxRetries} after ${statusCode}, waiting ${delayMs}ms`);
          await this.delay(delayMs);
          return this.executeExaSearch(query, limit, {
            ...options,
            _retryCount: _retryCount + 1
          });
        }

        throw new Error(`Exa API error: ${statusCode} - ${errorText}`);
      }

      const data = await response.json();
      let results = data.results || [];

      // Parse JSON strings in schema-based summaries FIRST
      // Exa returns structured summaries as JSON strings, need to parse them before quality assessment
      if (strategyConfig.type === 'summary_with_schema') {
        results = results.map(result => {
          if (result.summary && typeof result.summary === 'string') {
            try {
              const parsed = JSON.parse(result.summary);
              return { ...result, summary: parsed };
            } catch (e) {
              // Not valid JSON, leave as string
              return result;
            }
          }
          return result;
        });
      }

      // Assess content quality (replaces highlight quality)
      const qualityAssessment = await this.assessContentQuality(
        results,
        query,
        strategyConfig.type
      );

      // If content is insufficient and fallback is enabled, retry with full text
      if (qualityAssessment.needsFallback && fallbackToText && !includeFullText) {
        console.log(`🔄 Content quality insufficient (${qualityAssessment.confidence}), falling back to full text`);

        return this.executeExaSearch(query, limit, {
          ...options,
          includeFullText: true,
          fallbackToText: false // Prevent infinite recursion
        });
      }

      // Add quality metadata to results
      return results.map(result => ({
        ...result,
        _content_quality: {
          confidence: qualityAssessment.confidence,
          coverage: qualityAssessment.coverage,
          relevance: qualityAssessment.relevance,
          strategy_type: strategyConfig.type,
          extraction_method: includeFullText ? 'full_text' :
                           dataType ? 'schema_summary' : 'summary'
        }
      }));

    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`Exa API request timeout after ${EXA_TIMEOUT_MS}ms`);
      } else {
        console.error('Exa API request failed:', error);
      }
      return []; // Return empty results for graceful degradation
    }
  }

  /**
   * Generate optimized summary query based on domain and context
   * Replaces generateHighlightQuery - guides AI summary generation
   * @param {string} customQuery - Custom summary query
   * @param {string} originalQuery - Original search query
   * @param {string} domain - Domain type
   * @returns {string} Optimized summary query
   */
  generateSummaryQuery(customQuery, originalQuery, domain) {
    if (customQuery) {
      return customQuery;
    }

    // Use domain-specific query if available
    if (domain && this.summaryQueries[domain]) {
      return this.summaryQueries[domain];
    }

    // Extract key terms from original query for dynamic summary generation
    const queryTerms = originalQuery
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 3)
      .slice(0, 10)
      .join(' ');

    return queryTerms || originalQuery;
  }

  /**
   * Assess the quality of content (summary/text) results
   * Replaces assessHighlightQuality - works with new content strategies
   * @param {Array} results - Exa search results
   * @param {string} originalQuery - Original search query
   * @param {string} strategyType - Strategy type used
   * @returns {Object} Quality assessment
   */
  async assessContentQuality(results, originalQuery, strategyType) {
    if (!results || results.length === 0) {
      return {
        confidence: 0,
        coverage: 'none',
        relevance: 'low',
        needsFallback: true,
        issues: ['No results returned']
      };
    }

    const issues = [];
    let totalContentLength = 0;
    let substantialContent = 0;
    let relevantResults = 0;
    let structuredResults = 0;  // Track structured summaries from schema extraction

    // 🔍 DIAGNOSTIC: Logging disabled for production (uncomment for debugging)
    // console.log(`\n🔍 [DIAGNOSTIC] assessContentQuality() analyzing ${results.length} results (strategy: ${strategyType})`);

    for (const result of results) {
      // Get content (handle both strings and structured objects)
      let content = result.summary || result.text || '';
      let isStructured = false;

      // 🔍 DIAGNOSTIC: Logging disabled for production (uncomment for debugging)
      // const originalType = typeof content;
      // console.log(`   Result ${results.indexOf(result) + 1}: summary type = ${originalType}`);

      // Handle structured summaries from schema-based extraction
      if (typeof content === 'object' && content !== null) {
        isStructured = true;
        structuredResults++;

        // console.log(`      ✅ STRUCTURED summary detected! Keys: ${Object.keys(content).join(', ')}`);

        // Convert object fields to searchable text for quality assessment
        // Filter out null/undefined values and convert to strings
        const fieldValues = Object.values(content)
          .filter(v => v !== null && v !== undefined)
          .map(v => String(v))
          .join(' ');

        content = fieldValues;
      }

      if (!content || content.length === 0) {
        issues.push('Missing content in some results');
        continue;
      }

      totalContentLength += content.length;

      // For structured data, be more lenient on length requirements
      const minLength = isStructured ? 50 : 100;
      const minLengthForQuality = isStructured ? 30 : 50;

      // Check for substantial and relevant content
      if (content.length > minLength && this.containsRelevantTerms(content, originalQuery)) {
        substantialContent++;
        relevantResults++;
      } else if (content.length > minLengthForQuality) {
        substantialContent++;
      }
    }

    // Calculate metrics
    const avgContentLength = totalContentLength / results.length;
    const relevanceRatio = relevantResults / results.length;
    const qualityRatio = substantialContent / results.length;
    const structuredRatio = structuredResults / results.length;

    // Determine confidence score
    let confidence = 0;

    // Structured data gets bonus confidence (schema-based extraction is higher quality)
    if (structuredRatio > 0.5) {
      confidence += 0.2;  // Bonus for structured extraction
      if (avgContentLength >= 100) confidence += 0.2;
      else if (avgContentLength >= 50) confidence += 0.1;
    } else {
      // Original scoring for text-based content
      if (avgContentLength >= 200) confidence += 0.3;
      else if (avgContentLength >= 100) confidence += 0.2;
    }

    if (relevanceRatio >= 0.6) confidence += 0.4;
    if (qualityRatio >= 0.7) confidence += 0.3;

    // Determine coverage
    let coverage = 'minimal';
    if (relevanceRatio >= 0.8) coverage = 'complete';
    else if (relevanceRatio >= 0.6) coverage = 'substantial';
    else if (relevanceRatio >= 0.3) coverage = 'partial';

    // Determine relevance
    let relevance = 'low';
    if (qualityRatio >= 0.7) relevance = 'high';
    else if (qualityRatio >= 0.4) relevance = 'medium';

    // Don't fallback if we have good structured data
    const needsFallback = structuredRatio > 0.5
      ? confidence < 0.3  // More lenient for structured data
      : confidence < 0.5 || relevanceRatio < 0.3;  // Original threshold for text

    // 🔍 DIAGNOSTIC: Logging disabled for production (uncomment for debugging)
    // console.log(`\n🔍 [DIAGNOSTIC] Final Quality Assessment:`);
    // console.log(`   Confidence: ${confidence.toFixed(2)} (threshold: ${structuredRatio > 0.5 ? '0.3' : '0.5'})`);
    // console.log(`   Structured ratio: ${structuredRatio.toFixed(2)} (${structuredResults}/${results.length})`);
    // console.log(`   Relevance ratio: ${relevanceRatio.toFixed(2)}`);
    // console.log(`   Quality ratio: ${qualityRatio.toFixed(2)}`);
    // console.log(`   Avg content length: ${avgContentLength.toFixed(0)} chars`);
    // console.log(`   Decision: ${needsFallback ? '❌ FALLBACK TO FULL TEXT' : '✅ USE SUMMARIES'}`);

    return {
      confidence: Math.round(confidence * 100) / 100,
      coverage,
      relevance,
      needsFallback,
      metrics: {
        totalResults: results.length,
        relevantResults,
        structuredResults,  // Add structured results metric
        avgContentLength: Math.round(avgContentLength),
        relevanceRatio: Math.round(relevanceRatio * 100) / 100,
        qualityRatio: Math.round(qualityRatio * 100) / 100,
        structuredRatio: Math.round(structuredRatio * 100) / 100  // Add structured ratio
      },
      issues: issues.length > 0 ? issues : null
    };
  }

  /**
   * Check if text contains relevant terms from the query
   * @param {string} text - Text to analyze
   * @param {string} query - Original query
   * @returns {boolean} Whether text is relevant
   */
  containsRelevantTerms(text, query) {
    if (!text || !query) return false;

    const queryTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 3);

    const textLower = text.toLowerCase();
    
    // Check if at least 30% of significant query terms appear in text
    const matchingTerms = queryTerms.filter(term => textLower.includes(term));
    return matchingTerms.length >= Math.max(1, queryTerms.length * 0.3);
  }

  /**
   * Extract structured data from summary/text content
   * Replaces extractStructuredDataFromHighlights
   * @param {Array} results - Results with summary or text
   * @param {string} dataType - Type of data to extract
   * @param {Object} options - Extraction options
   * @returns {Array} Extracted structured data
   */
  extractStructuredData(results, dataType, options = {}) {
    const extractedData = [];

    for (const result of results) {
      const url = result.url;

      // Try schema-based extraction first (if summary is structured)
      if (result.summary && typeof result.summary === 'object') {
        const structuredItem = {
          ...result.summary,
          source_url: url,
          extraction_method: 'schema'
        };
        extractedData.push(structuredItem);
        continue;
      }

      // Fall back to text parsing
      const content = result.summary || result.text || '';
      if (content.length < 20) continue;

      // Try to parse JSON summary
      if (typeof content === 'string' && content.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(content);
          extractedData.push({
            ...parsed,
            source_url: url,
            extraction_method: 'json_parse'
          });
          continue;
        } catch (e) {
          // Not JSON, continue to text extraction
        }
      }

      // Text-based extraction using fallback methods
      const fallbackData = fallbackToTextParsing(content, dataType);
      if (fallbackData && Object.keys(fallbackData).length > 0) {
        extractedData.push({
          ...fallbackData,
          source_url: url,
          extraction_method: 'text_parsing'
        });
      } else {
        // Last resort: basic text extraction
        const structuredItem = this.extractDataFromText(
          content,
          dataType,
          { ...options, sourceUrl: url }
        );

        if (structuredItem) {
          extractedData.push(structuredItem);
        }
      }
    }

    return extractedData;
  }

  /**
   * Extract specific data types from text using context clues
   * @param {string} text - Text to extract from
   * @param {string} dataType - Type of data
   * @param {Object} options - Options
   * @returns {Object|null} Extracted data
   */
  extractDataFromText(text, dataType, options = {}) {
    // This method should be overridden by specific clients
    // but provides basic extraction capabilities
    
    const baseData = {
      source_text: text,
      source_url: options.sourceUrl,
      extraction_confidence: this.calculateExtractionConfidence(text, dataType)
    };

    switch (dataType) {
      case 'monetary_value':
        return this.extractMonetaryValue(text, baseData);
      case 'date':
        return this.extractDate(text, baseData);
      case 'citation':
        return this.extractCitation(text, baseData);
      default:
        return { ...baseData, value: text.slice(0, 500) };
    }
  }

  /**
   * Calculate confidence in data extraction
   * @param {string} text - Source text
   * @param {string} dataType - Data type
   * @returns {number} Confidence score
   */
  calculateExtractionConfidence(text, dataType) {
    let confidence = 0.5; // Base confidence

    // Increase confidence for longer, more specific text
    if (text.length > 100) confidence += 0.1;
    if (text.length > 200) confidence += 0.1;

    // Increase confidence for structured-looking content
    if (/\d{4}-\d{2}-\d{2}/.test(text)) confidence += 0.1; // Dates
    if (/\$[\d,]+/.test(text)) confidence += 0.1; // Money
    if (/\b\d+\s+[A-Z][\w.]+\s+\d+\b/.test(text)) confidence += 0.1; // Citations

    return Math.min(confidence, 1.0);
  }

  /**
   * Smart snippet extraction from summary/text content
   * Replaces extractSmartSnippetFromHighlights
   * @param {Array} results - Search results with summary or text
   * @param {number} maxLength - Maximum snippet length
   * @returns {string} Extracted snippet
   */
  extractSnippet(results, maxLength = 800) {
    const contentPieces = [];

    for (const result of results) {
      // Get content from summary or text
      let content = result.summary || result.text || '';

      // CRITICAL FIX: Convert object to string BEFORE length check
      // Schema-based extraction returns result.summary as object, not string
      if (typeof content === 'object' && content !== null) {
        content = JSON.stringify(content);
      }

      if (content && content.length > 30) {
        // Now content is always a string, length check works correctly
        const textContent = content;

        contentPieces.push({
          text: textContent,
          relevanceScore: this.calculateRelevanceScore(textContent),
          source: result.url
        });
      }
    }

    // Sort by relevance and combine top pieces
    contentPieces.sort((a, b) => b.relevanceScore - a.relevanceScore);

    let snippet = '';
    let remainingLength = maxLength;

    for (const piece of contentPieces) {
      if (remainingLength <= 0) break;

      // Extract most relevant portion if content is too long
      const relevantPortion = this._extractRelevantPortion(piece.text, remainingLength);

      const textToAdd = relevantPortion.length <= remainingLength
        ? relevantPortion
        : relevantPortion.substring(0, remainingLength - 3) + '...';

      snippet += (snippet ? ' ... ' : '') + textToAdd;
      remainingLength -= textToAdd.length + 5; // Account for separator
    }

    return snippet;
  }

  /**
   * Extract most relevant portion from longer text
   * @param {string} text - Full text content
   * @param {number} maxLength - Maximum length to extract
   * @returns {string} Relevant portion
   * @private
   */
  _extractRelevantPortion(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }

    // Try to find complete sentences near the beginning
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let portion = '';

    for (const sentence of sentences) {
      if (portion.length + sentence.length <= maxLength) {
        portion += sentence;
      } else {
        break;
      }
    }

    return portion || text.substring(0, maxLength);
  }

  /**
   * Calculate relevance score for a highlight
   * @param {string} text - Highlight text
   * @returns {number} Relevance score
   */
  calculateRelevanceScore(text) {
    let score = 0;

    // Length score (longer is generally better, but diminishing returns)
    score += Math.min(text.length / 100, 5);

    // Information density (numbers, specific terms)
    const numbers = (text.match(/\d+/g) || []).length;
    score += numbers * 0.5;

    const capitalizedWords = (text.match(/\b[A-Z][a-z]+\b/g) || []).length;
    score += capitalizedWords * 0.2;

    // Penalize very generic text
    if (/^(the|this|that|and|or|but|in|on|at|to|for|of|with|by)\s+/i.test(text)) {
      score -= 2;
    }

    return Math.max(score, 0);
  }

  /**
   * Get raw results for Gemini filtering (bypasses Exa summaries)
   * Used by ClaudeOrchestrator to feed raw text to Gemini 2.5 Flash
   *
   * @param {string} query - Search query
   * @param {number} limit - Number of results (default 5)
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Raw results with full text content
   */
  async getRawResults(query, limit = 5, options = {}) {
    if (!this.exaApiKey) {
      console.error('Exa API key not configured for raw results');
      return [];
    }

    if (this.rateLimiter && typeof this.rateLimiter.enforce === 'function') {
      await this.rateLimiter.enforce();
    }

    const {
      includeDomains,
      domain,
      _retryCount = 0  // Internal retry tracking
    } = options;

    // Build minimal Exa request - full text only, no summaries
    const requestBody = {
      query,
      numResults: Math.min(limit, 5),  // Cap at 5 for Gemini context efficiency
      type: 'auto',
      livecrawl: 'preferred',
      contents: {
        text: true  // Full text only - no summaries
      }
    };

    if (includeDomains) {
      requestBody.includeDomains = includeDomains;
    }

    // Exa API timeout: 60s per-request (doesn't block 10-min iterative research)
    const EXA_TIMEOUT_MS = 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXA_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': this.exaApiKey
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const statusCode = response.status;

        // Retry for transient errors (408, 429, 500, 502, 503, 504)
        if (this.isRetryableError(statusCode) && _retryCount < this.retryConfig.maxRetries) {
          const delayMs = this.retryConfig.baseDelayMs * (_retryCount + 1);
          console.log(`[Exa Raw] Retry ${_retryCount + 1}/${this.retryConfig.maxRetries} after ${statusCode}, waiting ${delayMs}ms`);
          await this.delay(delayMs);
          return this.getRawResults(query, limit, {
            ...options,
            _retryCount: _retryCount + 1
          });
        }

        throw new Error(`Exa API error: ${statusCode} - ${errorText}`);
      }

      const data = await response.json();
      const results = data.results || [];

      // Return minimal structure for Gemini processing
      return results.map(result => ({
        title: result.title || 'Untitled',
        url: result.url,
        text: result.text || '',
        rawContent: result.text || '',  // Alias for compatibility
        publishedDate: result.publishedDate,
        _source: 'exa_raw',
        _domain: domain
      }));

    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`Exa raw results request timeout after ${EXA_TIMEOUT_MS}ms`);
      } else {
        console.error('Exa raw results request failed:', error);
      }
      return [];
    }
  }

  // Basic extraction methods that can be overridden by specific clients
  extractMonetaryValue(text, baseData) {
    // First try standard monetary formats
    const moneyMatch = text.match(/\$?([\d,]+(?:\.\d{2})?)\s*(million|billion|thousand|M|B|K)?/i);
    if (moneyMatch) {
      let value = parseFloat(moneyMatch[1].replace(/,/g, ''));
      const unit = moneyMatch[2];

      if (unit && /million|M/i.test(unit)) value *= 1000000;
      if (unit && /billion|B/i.test(unit)) value *= 1000000000;
      if (unit && /thousand|K/i.test(unit)) value *= 1000;

      // Check for malformed concatenated values and fix them
      if (value > 1e15) {
        // Likely concatenated data, try to extract first valid number
        const valueStr = value.toString();
        const match = valueStr.match(/^(\d{1,12})/);
        if (match) {
          value = parseFloat(match[1]);
        }
      }

      return {
        ...baseData,
        value: value,
        formatted_value: moneyMatch[0],
        currency: 'USD'
      };
    }

    // Try to extract large numbers that might be financial values
    const largeNumberMatch = text.match(/(\d{1,15})/);
    if (largeNumberMatch) {
      let value = parseFloat(largeNumberMatch[1]);

      // Check for malformed concatenated values
      if (value > 1e15) {
        const valueStr = value.toString();
        const match = valueStr.match(/^(\d{1,12})/);
        if (match) {
          value = parseFloat(match[1]);
        }
      }

      return {
        ...baseData,
        value: value,
        formatted_value: largeNumberMatch[0],
        currency: 'USD'
      };
    }

    return null;
  }

  extractDate(text, baseData) {
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|[A-Za-z]+ \d{1,2}, \d{4})/);
    if (dateMatch) {
      return {
        ...baseData,
        value: dateMatch[1],
        parsed_date: new Date(dateMatch[1]).toISOString().split('T')[0]
      };
    }
    return null;
  }

  extractCitation(text, baseData) {
    const citationMatch = text.match(/(\d+\s+[A-Z][\w.]+\s+\d+)/);
    if (citationMatch) {
      return {
        ...baseData,
        value: citationMatch[1],
        citation_type: 'case_law'
      };
    }
    return null;
  }
}