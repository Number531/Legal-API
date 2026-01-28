/**
 * Validation Helper Functions
 * Contains input validation methods for dates, court IDs, limits, and other parameters
 */

import { DATE_REGEX, COURT_ID_REGEX } from '../config/apiConfig.js';

/**
 * Validates date format and value
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {string} fieldName - Name of the field for error messages
 * @throws {Error} If date format or value is invalid
 */
export function validateDate(date, fieldName) {
  if (!DATE_REGEX.test(date)) {
    throw new Error(`Invalid date format for ${fieldName}. Expected YYYY-MM-DD, got: ${date}`);
  }
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date value for ${fieldName}: ${date}`);
  }
}

/**
 * Validates court ID format
 * @param {string} courtId - Court ID to validate
 * @throws {Error} If court ID format is invalid
 */
export function validateCourtId(courtId) {
  if (!COURT_ID_REGEX.test(courtId)) {
    throw new Error(`Invalid court ID format. Expected lowercase alphanumeric, got: ${courtId}`);
  }
}

/**
 * Validates and normalizes limit parameter
 * @param {number} limit - Limit value to validate
 * @param {number} max - Maximum allowed limit (default: 20)
 * @returns {number} Validated and normalized limit
 */
export function validateLimit(limit, max = 20) {
  if (limit < 1) return 1;
  if (limit > max) return max;
  return Math.floor(limit);
}

/**
 * Validates required parameters
 * @param {Object} params - Parameters object
 * @param {string[]} required - Array of required parameter names
 * @throws {Error} If any required parameter is missing
 */
export function validateRequired(params, required) {
  for (const param of required) {
    if (params[param] === undefined || params[param] === null) {
      throw new Error(`Required parameter missing: ${param}`);
    }
  }
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email format is valid
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates year parameter
 * @param {number} year - Year to validate
 * @param {number} minYear - Minimum allowed year (default: 1900)
 * @param {number} maxYear - Maximum allowed year (default: current year + 1)
 * @throws {Error} If year is out of range
 */
export function validateYear(year, minYear = 1900, maxYear = new Date().getFullYear() + 1) {
  if (year < minYear || year > maxYear) {
    throw new Error(`Invalid year: ${year}. Must be between ${minYear} and ${maxYear}`);
  }
}

/**
 * Validates CIK (Central Index Key) format
 * @param {string} cik - CIK to validate
 * @returns {boolean} True if CIK format is valid
 */
export function validateCIK(cik) {
  const cikRegex = /^\d{10}$/;
  return cikRegex.test(cik);
}

/**
 * Validates state code format
 * @param {string} stateCode - Two-letter state code
 * @returns {boolean} True if state code format is valid
 */
export function validateStateCode(stateCode) {
  const stateRegex = /^[A-Z]{2}$/;
  return stateRegex.test(stateCode);
}

/**
 * Validates patent number format
 * @param {string} patentNumber - Patent number to validate
 * @returns {boolean} True if patent number format is valid
 */
export function validatePatentNumber(patentNumber) {
  // US patent numbers can be various formats
  const patentRegex = /^(US)?\d{6,8}[A-Z]?\d?$/i;
  return patentRegex.test(patentNumber);
}

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL format is valid
 */
export function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes string input by removing potentially harmful characters
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  // Remove potentially harmful characters but preserve legal text
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
}

/**
 * Validates pagination parameters
 * @param {Object} params - Pagination parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {Object} Validated pagination parameters
 */
export function validatePagination(params, maxLimit = 100) {
  const { page = 1, limit = 20 } = params;
  
  return {
    page: Math.max(1, Math.floor(page)),
    limit: validateLimit(limit, maxLimit)
  };
}

/**
 * Validates date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @throws {Error} If date range is invalid
 */
export function validateDateRange(startDate, endDate) {
  if (startDate) validateDate(startDate, 'startDate');
  if (endDate) validateDate(endDate, 'endDate');

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new Error('Start date must be before or equal to end date');
    }
  }
}

// ===== INPUT LENGTH LIMITS =====
// These limits prevent overly long queries that could cause:
// - API timeout issues
// - Context window overflow
// - Memory exhaustion
// - Rate limiting

/**
 * Default input length limits for different field types
 */
export const INPUT_LENGTH_LIMITS = {
  // Search queries (company names, search terms)
  SEARCH_QUERY: 500,

  // Company identifiers (names, tickers, CIKs)
  COMPANY_IDENTIFIER: 200,

  // Legal text snippets (case citations, statute references)
  LEGAL_REFERENCE: 1000,

  // Full text content (document excerpts)
  FULL_TEXT: 50000,

  // URL fields
  URL: 2048,

  // Generic short text
  SHORT_TEXT: 100,

  // Generic medium text
  MEDIUM_TEXT: 500
};

/**
 * Validates string input length with configurable limits
 * @param {string} input - Input string to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {number} maxLength - Maximum allowed length (default: SEARCH_QUERY limit)
 * @returns {string} The validated input (trimmed)
 * @throws {Error} If input exceeds max length
 *
 * @example
 * // Validate company name
 * validateInputLength(companyName, 'company_identifier', INPUT_LENGTH_LIMITS.COMPANY_IDENTIFIER);
 *
 * @example
 * // Validate search query with default limit
 * validateInputLength(query, 'search_query');
 */
export function validateInputLength(input, fieldName, maxLength = INPUT_LENGTH_LIMITS.SEARCH_QUERY) {
  if (input === null || input === undefined) {
    return input;
  }

  const str = String(input).trim();

  if (str.length > maxLength) {
    throw new Error(
      `Input for "${fieldName}" exceeds maximum length of ${maxLength} characters ` +
      `(received ${str.length}). Please provide a shorter input.`
    );
  }

  return str;
}

/**
 * Truncates input to max length with ellipsis (non-throwing alternative)
 * Use when graceful degradation is preferred over errors
 * @param {string} input - Input string to truncate
 * @param {number} maxLength - Maximum allowed length
 * @param {string} suffix - Suffix to append when truncated (default: '...')
 * @returns {string} Truncated string
 *
 * @example
 * const truncated = truncateInput(longQuery, 500);
 * // Returns first 497 chars + '...'
 */
export function truncateInput(input, maxLength = INPUT_LENGTH_LIMITS.SEARCH_QUERY, suffix = '...') {
  if (input === null || input === undefined) {
    return '';
  }

  const str = String(input).trim();

  if (str.length <= maxLength) {
    return str;
  }

  // Account for suffix length
  const truncateAt = maxLength - suffix.length;
  return str.substring(0, truncateAt) + suffix;
}

/**
 * Validates multiple inputs at once with specified limits
 * @param {Object} inputs - Object with field names as keys and input values
 * @param {Object} limits - Object with field names as keys and max lengths as values
 * @returns {Object} Object with validated/trimmed inputs
 * @throws {Error} If any input exceeds its limit
 *
 * @example
 * const validated = validateInputs(
 *   { company: 'Apple Inc', query: 'annual report' },
 *   { company: INPUT_LENGTH_LIMITS.COMPANY_IDENTIFIER, query: INPUT_LENGTH_LIMITS.SEARCH_QUERY }
 * );
 */
export function validateInputs(inputs, limits) {
  const validated = {};

  for (const [fieldName, value] of Object.entries(inputs)) {
    const maxLength = limits[fieldName] || INPUT_LENGTH_LIMITS.SEARCH_QUERY;
    validated[fieldName] = validateInputLength(value, fieldName, maxLength);
  }

  return validated;
}