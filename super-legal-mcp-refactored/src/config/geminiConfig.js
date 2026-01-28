/**
 * Gemini Configuration for Legal MCP Server
 *
 * Centralized configuration for Gemini 2.5 Flash integration.
 * All settings can be overridden via environment variables.
 */

/**
 * @typedef {Object} GeminiConfig
 * @property {string} model - Gemini model name
 * @property {number} defaultMaxOutputTokens - Default max output tokens
 * @property {number} defaultTemperature - Default temperature (low for factual)
 * @property {Object} rateLimiter - Rate limiter configuration
 * @property {Object} circuitBreaker - Circuit breaker configuration
 * @property {Object} backoff - Exponential backoff configuration
 * @property {Object} fallback - Fallback behavior configuration
 */

export const geminiConfig = {
  // Model configuration
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

  // Default generation settings
  // Increased to 10000 to handle complex legal extraction without hitting MAX_TOKENS
  defaultMaxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS, 10) || 10000,
  defaultTemperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.1,

  // Rate limiter configuration
  rateLimiter: {
    maxRequestsPerMinute: parseInt(process.env.GEMINI_RATE_LIMIT, 10) || 10,
    windowMs: 60000  // 1 minute sliding window
  },

  // Circuit breaker configuration
  circuitBreaker: {
    failureThreshold: parseInt(process.env.GEMINI_CIRCUIT_FAILURE_THRESHOLD, 10) || 3,
    resetTimeout: parseInt(process.env.GEMINI_CIRCUIT_RESET_TIMEOUT_MS, 10) || 30000,
    maxConsecutiveFailures: parseInt(process.env.GEMINI_CIRCUIT_MAX_FAILURES, 10) || 5
  },

  // Exponential backoff configuration
  backoff: {
    baseDelayMs: 1000,   // 1 second base
    maxDelayMs: 30000,   // 30 seconds max
    jitterMs: 1000       // Up to 1 second random jitter
  },

  // Maximum retry attempts for rate limit errors
  maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES, 10) || 3,

  // Content preprocessing limits (to prevent MAX_TOKENS issues)
  // Lower limits ensure Gemini can produce complete responses within maxOutputTokens
  // Balance between coverage and avoiding MAX_TOKENS
  maxCharsPerDoc: parseInt(process.env.GEMINI_MAX_CHARS_PER_DOC, 10) || 12000,   // ~3K tokens per doc
  maxTotalChars: parseInt(process.env.GEMINI_MAX_TOTAL_CHARS, 10) || 30000,      // ~7.5K tokens total

  // Fallback configuration (when Gemini unavailable)
  fallback: {
    previewLength: parseInt(process.env.GEMINI_FALLBACK_PREVIEW_LENGTH, 10) || 500,
    maxResults: parseInt(process.env.GEMINI_FALLBACK_MAX_RESULTS, 10) || 5
  },

  // Feature flags
  features: {
    enabled: process.env.ENABLE_GEMINI_FILTERING === 'true',
    logRequests: process.env.GEMINI_LOG_REQUESTS === 'true',
    logResponses: process.env.GEMINI_LOG_RESPONSES === 'true'
  }
};

/**
 * Domain-specific token limits
 * Standardized to 10000 to avoid MAX_TOKENS issues with complex legal content
 */
export const domainTokenLimits = {
  securities: 10000,             // Complex XBRL content
  pharmaceutical_safety: 10000,  // Complex FDA AE reports
  environmental: 10000,          // EPA content can be verbose
  case_law: 10000,               // Court opinions can be verbose
  legislation: 10000,
  federal_register: 10000,
  product_safety: 10000,
  antitrust: 10000,
  patent: 10000,                 // Patent claims can be detailed
  patent_appeals: 10000,         // Verbose PTAB decisions with claim analysis
  state_courts: 10000,
  state_statutes: 10000
};

/**
 * Get the max output tokens for a specific domain
 *
 * @param {string} domain - Domain identifier
 * @returns {number} Max output tokens for domain
 */
export function getMaxTokensForDomain(domain) {
  return domainTokenLimits[domain] || geminiConfig.defaultMaxOutputTokens;
}

/**
 * Validate Gemini configuration
 *
 * @returns {Object} Validation result with status and messages
 */
export function validateConfig() {
  const issues = [];
  const warnings = [];

  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    if (geminiConfig.features.enabled) {
      issues.push('GEMINI_API_KEY not set but ENABLE_GEMINI_FILTERING is true');
    } else {
      warnings.push('GEMINI_API_KEY not set - Gemini filtering disabled');
    }
  }

  // Validate rate limit
  if (geminiConfig.rateLimiter.maxRequestsPerMinute > 60) {
    warnings.push('Rate limit above 60 req/min may exceed Gemini quotas');
  }

  // Validate circuit breaker
  if (geminiConfig.circuitBreaker.failureThreshold < 1) {
    issues.push('Circuit breaker failure threshold must be >= 1');
  }

  // Validate backoff
  if (geminiConfig.backoff.maxDelayMs < geminiConfig.backoff.baseDelayMs) {
    issues.push('Backoff maxDelayMs must be >= baseDelayMs');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    config: geminiConfig
  };
}

/**
 * Get configuration summary for logging
 *
 * @returns {Object} Configuration summary
 */
export function getConfigSummary() {
  return {
    model: geminiConfig.model,
    enabled: geminiConfig.features.enabled,
    maxTokens: geminiConfig.defaultMaxOutputTokens,
    rateLimit: `${geminiConfig.rateLimiter.maxRequestsPerMinute} req/min`,
    circuitBreaker: `${geminiConfig.circuitBreaker.failureThreshold} failures / ${geminiConfig.circuitBreaker.resetTimeout}ms reset`,
    fallback: `${geminiConfig.fallback.previewLength} chars preview`
  };
}

export default geminiConfig;
