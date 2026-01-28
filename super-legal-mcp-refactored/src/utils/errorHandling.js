/**
 * Error Handling Utilities for Hybrid API System
 * 
 * Provides graceful error handling, classification, and logging
 * for expected API failures that trigger fallback mechanisms.
 */

/**
 * Error classification for hybrid API system
 */
export class APIError extends Error {
  constructor(message, statusCode, options = {}) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.isExpected = options.isExpected || false;
    this.isRetryable = options.isRetryable !== undefined ? options.isRetryable : true;
    this.category = options.category || 'unknown';
    this.context = options.context || {};
    this.willFallback = options.willFallback || false;
  }

  /**
   * Check if this is an expected API limitation (not an actual error)
   */
  isAPILimitation() {
    return this.isExpected && this.willFallback;
  }

  /**
   * Get a user-friendly message
   */
  getUserMessage() {
    if (this.isAPILimitation()) {
      return `Using web search (native API doesn't support this query type)`;
    }
    return this.message;
  }

  /**
   * Get log level based on error type
   */
  getLogLevel() {
    if (this.isAPILimitation()) return 'debug';
    if (this.willFallback) return 'warn';
    return 'error';
  }
}

/**
 * Classify HTTP errors
 */
export function classifyHTTPError(statusCode, endpoint, params) {
  const classifications = {
    // Expected API limitations (will fallback)
    400: {
      isExpected: detectExpectedBadRequest(endpoint, params),
      category: 'api_limitation',
      isRetryable: false,
      willFallback: true
    },
    // Authentication issues
    401: {
      isExpected: false,
      category: 'authentication',
      isRetryable: false,
      willFallback: false
    },
    403: {
      isExpected: false,
      category: 'authorization',
      isRetryable: false,
      willFallback: false
    },
    // Not found
    404: {
      isExpected: false,
      category: 'not_found',
      isRetryable: false,
      willFallback: true
    },
    // Rate limiting
    429: {
      isExpected: true,
      category: 'rate_limit',
      isRetryable: true,
      willFallback: false
    },
    // Server errors
    500: {
      isExpected: false,
      category: 'server_error',
      isRetryable: true,
      willFallback: true
    },
    502: {
      isExpected: false,
      category: 'bad_gateway',
      isRetryable: true,
      willFallback: true
    },
    503: {
      isExpected: false,
      category: 'service_unavailable',
      isRetryable: true,
      willFallback: true
    },
    504: {
      isExpected: false,
      category: 'gateway_timeout',
      isRetryable: true,
      willFallback: true
    }
  };

  return classifications[statusCode] || {
    isExpected: false,
    category: 'unknown',
    isRetryable: false,
    willFallback: false
  };
}

/**
 * Detect if a 400 Bad Request is an expected API limitation
 * Based on known Federal Register and GovInfo API constraints
 */
function detectExpectedBadRequest(endpoint, params) {
  // Federal Register known limitations
  if (endpoint.includes('federalregister.gov') || endpoint.includes('/documents.json')) {
    // Agency + document number combo not supported
    if (params.has('conditions[agencies][]') && params.has('conditions[term]')) {
      return true;
    }
    
    // Full agency names not supported (expects abbreviations)
    const agencyParam = params.get('conditions[agencies][]');
    if (agencyParam && agencyParam.length > 10) {
      return true;
    }
    
    // Type + agency + date range (complex queries often unsupported)
    if (params.has('conditions[type][]') && 
        params.has('conditions[agencies][]') && 
        params.has('conditions[publication_date][gte]')) {
      return true;
    }
  }

  // GovInfo known limitations
  if (endpoint.includes('api.govinfo.gov')) {
    // Package ID format issues
    if (params.has('packageId') && !params.get('packageId')?.match(/^[A-Z]+-\d{4}-title\d+$/)) {
      return true;
    }
  }

  return false;
}

/**
 * Log error with appropriate verbosity based on classification
 */
export function logError(error, context = {}) {
  const level = error.getLogLevel ? error.getLogLevel() : 'error';

  const logData = {
    message: error.message,
    category: error.category,
    context: { ...context, ...error.context },
    willFallback: error.willFallback
  };

  switch (level) {
    case 'debug':
      // Only log in verbose mode for expected limitations
      if (process.env.VERBOSE_LOGGING === 'true') {
        console.debug(`[API Limitation] ${error.message}`, logData);
      }
      break;
    
    case 'warn':
      // Log warnings for fallback scenarios
      console.warn(`[API Warning] ${error.getUserMessage?.() || error.message}`);
      break;
    
    case 'error':
    default:
      // Full error logging for unexpected failures
      console.error(`[API Error] ${error.message}`, logData);
      if (error.stack && process.env.DEBUG_MODE === 'true') {
        console.error(error.stack);
      }
      break;
  }
}

/**
 * Create a graceful error message for client responses
 */
export function createClientErrorMessage(error, fallbackAvailable = false) {
  if (error instanceof APIError && error.isAPILimitation()) {
    return {
      error: false, // Not actually an error from user perspective
      message: error.getUserMessage(),
      details: {
        native_api_limitation: true,
        using_fallback: fallbackAvailable,
        category: error.category
      }
    };
  }

  return {
    error: true,
    message: error.message,
    details: {
      category: error.category || 'unknown',
      retryable: error.isRetryable || false,
      fallback_available: fallbackAvailable
    }
  };
}

/**
 * Wrap async operations with graceful error handling
 */
export async function withGracefulError(operation, context = {}) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof APIError) {
      logError(error, context);
      throw error;
    }

    // Wrap unknown errors
    const wrappedError = new APIError(
      error.message || 'Unknown error occurred',
      error.statusCode || 500,
      {
        isExpected: false,
        category: 'unknown',
        context: { ...context, originalError: error.name }
      }
    );
    logError(wrappedError, context);
    throw wrappedError;
  }
}

export default {
  APIError,
  classifyHTTPError,
  logError,
  createClientErrorMessage,
  withGracefulError
};

