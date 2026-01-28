/**
 * GeminiFilterModule - Intelligent extraction layer using Gemini 2.5 Flash
 *
 * Processes raw API data through Gemini's 1M context window and returns
 * only relevant findings to Claude Orchestrator. Uses domain-specific
 * system prompts combined with query-specific focus points.
 *
 * Features:
 * - Domain-specific system prompts for targeted extraction
 * - Rate limiting (sliding window, 10 req/min)
 * - Circuit breaker (3 failures = open, 30s reset)
 * - Fallback to limited preview when Gemini unavailable
 * - Exponential backoff for rate limit errors
 * - Content preprocessing (strips XBRL, HTML, limits size)
 * - MAX_TOKENS retry with reduced content
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { CircuitBreaker } from '../modules/conversation-bridge/core/CircuitBreaker.js';
import { GeminiRateLimiter } from '../utils/GeminiRateLimiter.js';
import { geminiConfig } from '../config/geminiConfig.js';

/**
 * @typedef {Object} FilterResult
 * @property {string} domain - Domain identifier (e.g., 'securities', 'case_law')
 * @property {string|Array<PreviewItem>} findings - Extracted findings or preview items
 * @property {number} sourceCount - Number of source documents processed
 * @property {string[]} sourceUrls - URLs of source documents
 * @property {number} [confidence] - Confidence score (0-1)
 * @property {boolean} [fallback] - Whether fallback was used
 * @property {string} [fallbackReason] - Reason for fallback
 */

/**
 * @typedef {Object} PreviewItem
 * @property {string} title - Document title
 * @property {string} url - Document URL
 * @property {string} preview - Truncated preview (max 500 chars)
 * @property {boolean} _truncated - Whether content was truncated
 */

export class GeminiFilterModule {
  /**
   * Create a new GeminiFilterModule
   *
   * @param {string} domain - Domain identifier (e.g., 'securities', 'case_law')
   * @param {Object} config - Configuration object
   * @param {string} config.systemPrompt - Domain-specific extraction prompt
   * @param {number} [config.maxOutputTokens=2000] - Max tokens for Gemini output
   * @param {number} [config.temperature=0.1] - Temperature (low for factual extraction)
   */
  constructor(domain, config) {
    if (!domain || typeof domain !== 'string') {
      throw new Error('GeminiFilterModule requires a valid domain string');
    }
    if (!config?.systemPrompt) {
      throw new Error('GeminiFilterModule requires a systemPrompt in config');
    }

    this.domain = domain;
    this.systemPrompt = config.systemPrompt;
    this.maxOutputTokens = config.maxOutputTokens || geminiConfig.defaultMaxOutputTokens;
    this.temperature = config.temperature ?? geminiConfig.defaultTemperature;

    // Initialize Gemini client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey && process.env.ENABLE_GEMINI_FILTERING === 'true') {
      console.warn(`[GeminiFilter:${domain}] GEMINI_API_KEY not set, will use fallback mode`);
    }

    if (apiKey) {
      this.gemini = new GoogleGenerativeAI(apiKey);
      this.model = this.gemini.getGenerativeModel({
        model: geminiConfig.model,
        systemInstruction: this.systemPrompt,
        generationConfig: {
          maxOutputTokens: this.maxOutputTokens,
          temperature: this.temperature
        }
      });
    } else {
      this.model = null;
    }

    // Rate limiter (shared across all instances)
    this.rateLimiter = GeminiRateLimiter.getInstance();

    // Circuit breaker per domain
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: geminiConfig.circuitBreaker.failureThreshold,
      resetTimeout: geminiConfig.circuitBreaker.resetTimeout,
      maxConsecutiveFailures: geminiConfig.circuitBreaker.maxConsecutiveFailures
    });

    // Retry tracking
    this.retryAttempts = 0;
    this.maxRetries = geminiConfig.maxRetries || 3;

    // Content limits
    this.maxCharsPerDoc = geminiConfig.maxCharsPerDoc || 50000;  // ~12.5K tokens per doc
    this.maxTotalChars = geminiConfig.maxTotalChars || 200000;   // ~50K tokens total

    console.log(`[GeminiFilter:${domain}] Initialized with ${this.maxOutputTokens} max tokens`);
  }

  /**
   * Process raw results through Gemini and return filtered findings
   *
   * @param {Array<Object>} rawResults - Raw API results with text/content
   * @param {string} extractionInstructions - Query-specific focus points from Claude
   * @returns {Promise<FilterResult>} Filtered findings
   */
  async processAndFilter(rawResults, extractionInstructions = '') {
    // Early validation
    if (!rawResults || !Array.isArray(rawResults) || rawResults.length === 0) {
      return this._emptyResult('no_input_data');
    }

    // Check if Gemini is available
    if (!this.model) {
      console.warn(`[GeminiFilter:${this.domain}] Gemini not available, using fallback`);
      return this.fallbackToLimitedPreview(rawResults);
    }

    // Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      console.warn(`[GeminiFilter:${this.domain}] Circuit breaker open, using fallback`);
      return this.fallbackToLimitedPreview(rawResults);
    }

    // Enforce rate limit
    try {
      await this.rateLimiter.enforce();
    } catch (rateLimitError) {
      console.warn(`[GeminiFilter:${this.domain}] Rate limit error: ${rateLimitError.message}`);
      return this.fallbackToLimitedPreview(rawResults);
    }

    try {
      // Preprocess and build context from raw results
      const preprocessedResults = this._preprocessResults(rawResults);
      const fullContext = this._buildContext(preprocessedResults);

      // Build the extraction prompt
      const prompt = this._buildPrompt(extractionInstructions, fullContext, preprocessedResults.length);

      console.log(`[GeminiFilter:${this.domain}] Sending ${fullContext.length.toLocaleString()} chars to Gemini`);

      // Call Gemini
      const startTime = Date.now();
      const result = await this.model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      });
      const duration = Date.now() - startTime;

      // Check finish reason
      const finishReason = result.response.candidates?.[0]?.finishReason;

      // Handle MAX_TOKENS - retry with less content
      if (finishReason === 'MAX_TOKENS' && this.retryAttempts < this.maxRetries) {
        console.warn(`[GeminiFilter:${this.domain}] MAX_TOKENS hit, retrying with reduced content`);
        this.retryAttempts++;
        // Reduce content limits by half
        const reducedResults = this._preprocessResults(rawResults, this.maxCharsPerDoc / 2, this.maxTotalChars / 2);
        const reducedContext = this._buildContext(reducedResults);
        const reducedPrompt = this._buildPrompt(extractionInstructions, reducedContext, reducedResults.length);

        const retryResult = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: reducedPrompt }] }]
        });

        const retryText = retryResult.response.text();
        const retryFinish = retryResult.response.candidates?.[0]?.finishReason;

        if (retryFinish === 'MAX_TOKENS' || retryText.length === 0) {
          console.warn(`[GeminiFilter:${this.domain}] Retry also hit MAX_TOKENS, using fallback`);
          return this.fallbackToLimitedPreview(rawResults);
        }

        this.circuitBreaker.recordSuccess();
        this.retryAttempts = 0;

        return {
          domain: this.domain,
          findings: retryText,
          sourceCount: reducedResults.length,
          sourceUrls: rawResults.map(r => r.url).filter(Boolean),
          confidence: this._assessConfidence(retryResult, retryText),
          processingTime: Date.now() - startTime,
          contentReduced: true
        };
      }

      // Record success
      this.circuitBreaker.recordSuccess();
      this.retryAttempts = 0;

      // Extract response text
      const responseText = result.response.text();
      const confidence = this._assessConfidence(result, responseText);

      console.log(`[GeminiFilter:${this.domain}] Processed ${rawResults.length} docs in ${duration}ms (confidence: ${confidence.toFixed(2)})`);

      return {
        domain: this.domain,
        findings: responseText,
        sourceCount: rawResults.length,
        sourceUrls: rawResults.map(r => r.url).filter(Boolean),
        confidence,
        processingTime: duration
      };

    } catch (error) {
      return this._handleError(error, rawResults, extractionInstructions);
    }
  }

  /**
   * Handle errors with retry logic and fallback
   *
   * @param {Error} error - The error that occurred
   * @param {Array<Object>} rawResults - Raw results for fallback
   * @param {string} extractionInstructions - Original instructions for retry
   * @returns {Promise<FilterResult>}
   */
  async _handleError(error, rawResults, extractionInstructions) {
    const errorStatus = error.status || error.statusCode;
    const errorMessage = error.message || 'Unknown error';

    console.error(`[GeminiFilter:${this.domain}] Error (${errorStatus}): ${errorMessage}`);

    // Handle rate limiting (429)
    if (errorStatus === 429) {
      this.retryAttempts++;

      if (this.retryAttempts <= this.maxRetries) {
        console.log(`[GeminiFilter:${this.domain}] Rate limited, retry ${this.retryAttempts}/${this.maxRetries}`);
        await this._exponentialBackoff(this.retryAttempts);
        return this.processAndFilter(rawResults, extractionInstructions);
      }

      // Max retries exceeded
      console.warn(`[GeminiFilter:${this.domain}] Max retries exceeded, using fallback`);
    }

    // Record failure for circuit breaker
    this.circuitBreaker.recordFailure();

    // Return fallback result
    return this.fallbackToLimitedPreview(rawResults);
  }

  /**
   * Fallback: Return limited preview when Gemini is unavailable
   *
   * @param {Array<Object>} rawResults - Raw API results
   * @returns {FilterResult} Limited preview result
   */
  fallbackToLimitedPreview(rawResults) {
    const previewLength = geminiConfig.fallback.previewLength;
    const maxResults = geminiConfig.fallback.maxResults;

    const previews = rawResults.slice(0, maxResults).map(r => ({
      title: r.title || r.name || 'Untitled',
      url: r.url || r.link || null,
      preview: this._truncateText(
        r.text || r.rawContent || r.content || r.snippet || JSON.stringify(r),
        previewLength
      ),
      _truncated: true
    }));

    return {
      domain: this.domain,
      findings: previews,
      sourceCount: rawResults.length,
      sourceUrls: rawResults.map(r => r.url || r.link).filter(Boolean),
      fallback: true,
      fallbackReason: 'gemini_unavailable'
    };
  }

  /**
   * Preprocess raw results to clean content and limit size
   *
   * @param {Array<Object>} rawResults - Raw API results
   * @param {number} [maxPerDoc] - Max chars per document
   * @param {number} [maxTotal] - Max total chars
   * @returns {Array<Object>} Preprocessed results with cleaned text
   */
  _preprocessResults(rawResults, maxPerDoc = this.maxCharsPerDoc, maxTotal = this.maxTotalChars) {
    let totalChars = 0;
    const processed = [];

    for (const result of rawResults) {
      if (totalChars >= maxTotal) break;

      const rawText = result.text || result.rawContent || result.content || result.snippet || '';

      // Clean the content
      let cleanedText = this._cleanContent(rawText);

      // Truncate if too long
      if (cleanedText.length > maxPerDoc) {
        cleanedText = cleanedText.substring(0, maxPerDoc) + '\n\n[Content truncated...]';
      }

      // Check total limit
      if (totalChars + cleanedText.length > maxTotal) {
        const remaining = maxTotal - totalChars;
        cleanedText = cleanedText.substring(0, remaining) + '\n\n[Content truncated due to total limit...]';
      }

      totalChars += cleanedText.length;

      processed.push({
        ...result,
        text: cleanedText,
        _preprocessed: true,
        _originalLength: rawText.length,
        _cleanedLength: cleanedText.length
      });
    }

    return processed;
  }

  /**
   * Clean raw content by removing problematic patterns
   *
   * @param {string} text - Raw text to clean
   * @returns {string} Cleaned text
   */
  _cleanContent(text) {
    if (!text || typeof text !== 'string') return '';

    let cleaned = text;

    // Remove script and style tags with content
    cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');

    // Remove HTML tags but keep content
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');

    // Remove XBRL/XML namespace references (common in SEC filings)
    cleaned = cleaned.replace(/http:\/\/[^\s]+#[^\s]+/g, '');
    cleaned = cleaned.replace(/xmlns[^=]*="[^"]*"/g, '');

    // Remove long base64-like strings
    cleaned = cleaned.replace(/[A-Za-z0-9+/=]{100,}/g, '[encoded data removed]');

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
    cleaned = cleaned.replace(/^\s+/gm, '');

    // Remove lines that are just numbers/IDs (common in XBRL)
    cleaned = cleaned.replace(/^[\d.]+\s*$/gm, '');

    // Remove common boilerplate patterns
    cleaned = cleaned.replace(/\[Skip to main content\][^\n]*/gi, '');
    cleaned = cleaned.replace(/\[Back to top\]/gi, '');

    // Clean up any remaining artifacts
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');

    return cleaned.trim();
  }

  /**
   * Build the context string from raw results
   *
   * @param {Array<Object>} rawResults - Raw API results
   * @returns {string} Concatenated context
   */
  _buildContext(rawResults) {
    return rawResults.map((r, idx) => {
      const text = r.text || r.rawContent || r.content || r.snippet || '';
      const title = r.title || r.name || `Document ${idx + 1}`;
      const url = r.url || r.link || 'No URL';

      return `
=== DOCUMENT ${idx + 1}: ${title} ===
URL: ${url}

${text}
`;
    }).join('\n---DOCUMENT SEPARATOR---\n');
  }

  /**
   * Build the extraction prompt
   *
   * @param {string} focusPoints - Query-specific focus points
   * @param {string} context - Document context
   * @param {number} docCount - Number of documents
   * @returns {string} Complete prompt
   */
  _buildPrompt(focusPoints, context, docCount) {
    let prompt = '';

    // Add focus points if provided
    if (focusPoints && focusPoints.trim()) {
      prompt += `QUERY-SPECIFIC FOCUS:\n${focusPoints}\n\n`;
    }

    prompt += `You have ${docCount} ${this.domain} document(s) to analyze.\n\n`;
    prompt += `DOCUMENTS:\n${context}`;

    return prompt;
  }

  /**
   * Assess confidence in the extraction result
   *
   * @param {Object} result - Gemini API result
   * @param {string} responseText - Extracted text
   * @returns {number} Confidence score 0-1
   */
  _assessConfidence(result, responseText) {
    let confidence = 0.5; // Base confidence

    // Check response length (longer usually means more findings)
    if (responseText.length > 1000) confidence += 0.2;
    else if (responseText.length > 500) confidence += 0.1;
    else if (responseText.length < 100) confidence -= 0.2;

    // Check for structured content indicators
    if (responseText.includes('##') || responseText.includes('**')) confidence += 0.1;
    if (responseText.includes('Source:') || responseText.includes('Citation:')) confidence += 0.1;

    // Check for "no results" indicators
    const noResultsIndicators = ['no relevant', 'not found', 'no information', 'unable to find'];
    if (noResultsIndicators.some(ind => responseText.toLowerCase().includes(ind))) {
      confidence -= 0.3;
    }

    // Clamp to 0-1 range
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Exponential backoff with jitter
   *
   * @param {number} attempt - Current attempt number
   * @returns {Promise<void>}
   */
  async _exponentialBackoff(attempt) {
    const baseDelay = geminiConfig.backoff.baseDelayMs;
    const maxDelay = geminiConfig.backoff.maxDelayMs;
    const jitter = Math.random() * geminiConfig.backoff.jitterMs;

    const delay = Math.min(
      baseDelay * Math.pow(2, attempt - 1) + jitter,
      maxDelay
    );

    console.log(`[GeminiFilter:${this.domain}] Backoff: waiting ${Math.round(delay)}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Truncate text to specified length
   *
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  _truncateText(text, maxLength) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Generate empty result
   *
   * @param {string} reason - Reason for empty result
   * @returns {FilterResult}
   */
  _emptyResult(reason) {
    return {
      domain: this.domain,
      findings: [],
      sourceCount: 0,
      sourceUrls: [],
      fallback: true,
      fallbackReason: reason
    };
  }

  /**
   * Get current status of this filter module
   *
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      domain: this.domain,
      geminiAvailable: !!this.model,
      circuitBreaker: this.circuitBreaker.getStatus(),
      rateLimiter: this.rateLimiter.getStatus(),
      retryAttempts: this.retryAttempts
    };
  }

  /**
   * Reset the filter module state
   */
  reset() {
    this.circuitBreaker.reset();
    this.retryAttempts = 0;
    console.log(`[GeminiFilter:${this.domain}] Reset complete`);
  }
}

export default GeminiFilterModule;
