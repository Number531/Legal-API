/**
 * SchemaValidator.js
 * Validation and extraction utilities for Exa summary responses
 *
 * Provides schema validation, fallback text parsing, and safe data extraction
 * for handling structured summary responses from the Exa API.
 */

/**
 * Validate data against a JSON schema
 *
 * @param {*} data - Data to validate
 * @param {Object} schema - JSON Schema v7 object
 * @returns {Object} Validation result with { valid, errors, warnings }
 */
export function validateSchema(data, schema) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  // Handle null/undefined data
  if (data === null || data === undefined) {
    result.valid = false;
    result.errors.push({
      field: 'root',
      message: 'Data is null or undefined',
      code: 'NULL_DATA'
    });
    return result;
  }

  // Validate type
  if (schema.type && !validateType(data, schema.type)) {
    result.valid = false;
    result.errors.push({
      field: 'root',
      message: `Expected type ${schema.type}, got ${typeof data}`,
      code: 'TYPE_MISMATCH'
    });
    return result;
  }

  // For object schemas, validate properties
  if (schema.type === 'object' && schema.properties) {
    // Check required fields
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in data) || data[requiredField] === null || data[requiredField] === undefined) {
          result.valid = false;
          result.errors.push({
            field: requiredField,
            message: `Required field '${requiredField}' is missing`,
            code: 'MISSING_REQUIRED'
          });
        }
      }
    }

    // Validate each property
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (propName in data && data[propName] !== null && data[propName] !== undefined) {
        const propResult = validateProperty(data[propName], propSchema, propName);
        if (!propResult.valid) {
          result.valid = false;
          result.errors.push(...propResult.errors);
        }
        if (propResult.warnings.length > 0) {
          result.warnings.push(...propResult.warnings);
        }
      }
    }
  }

  return result;
}

/**
 * Validate a single property against its schema
 *
 * @param {*} value - Property value
 * @param {Object} propSchema - Property schema definition
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {Object} Validation result
 */
function validateProperty(value, propSchema, fieldName) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  // Type validation
  if (propSchema.type && !validateType(value, propSchema.type)) {
    result.valid = false;
    result.errors.push({
      field: fieldName,
      message: `Expected type ${propSchema.type}, got ${typeof value}`,
      code: 'TYPE_MISMATCH'
    });
    return result;
  }

  // Enum validation
  if (propSchema.enum && !propSchema.enum.includes(value)) {
    result.warnings.push({
      field: fieldName,
      message: `Value '${value}' not in enum [${propSchema.enum.join(', ')}]`,
      code: 'INVALID_ENUM'
    });
  }

  // Pattern validation
  if (propSchema.pattern && typeof value === 'string') {
    const regex = new RegExp(propSchema.pattern);
    if (!regex.test(value)) {
      result.warnings.push({
        field: fieldName,
        message: `Value does not match pattern ${propSchema.pattern}`,
        code: 'PATTERN_MISMATCH'
      });
    }
  }

  // Numeric constraints
  if (typeof value === 'number') {
    if (propSchema.minimum !== undefined && value < propSchema.minimum) {
      result.warnings.push({
        field: fieldName,
        message: `Value ${value} is less than minimum ${propSchema.minimum}`,
        code: 'BELOW_MINIMUM'
      });
    }
    if (propSchema.maximum !== undefined && value > propSchema.maximum) {
      result.warnings.push({
        field: fieldName,
        message: `Value ${value} exceeds maximum ${propSchema.maximum}`,
        code: 'ABOVE_MAXIMUM'
      });
    }
  }

  // Array validation
  if (propSchema.type === 'array' && Array.isArray(value)) {
    if (propSchema.minItems && value.length < propSchema.minItems) {
      result.warnings.push({
        field: fieldName,
        message: `Array has ${value.length} items, minimum is ${propSchema.minItems}`,
        code: 'TOO_FEW_ITEMS'
      });
    }
    if (propSchema.maxItems && value.length > propSchema.maxItems) {
      result.warnings.push({
        field: fieldName,
        message: `Array has ${value.length} items, maximum is ${propSchema.maxItems}`,
        code: 'TOO_MANY_ITEMS'
      });
    }
  }

  return result;
}

/**
 * Validate type (supports union types)
 *
 * @param {*} value - Value to check
 * @param {string|string[]} type - Expected type(s)
 * @returns {boolean} True if type matches
 */
function validateType(value, type) {
  const types = Array.isArray(type) ? type : [type];
  const actualType = Array.isArray(value) ? 'array' : typeof value;

  return types.some(t => {
    if (t === 'null') return value === null;
    if (t === 'array') return Array.isArray(value);
    if (t === 'object') return actualType === 'object' && !Array.isArray(value) && value !== null;
    return actualType === t;
  });
}

/**
 * Extract data from summary with safe field access
 * Handles string JSON, objects, and provides defaults
 *
 * @param {string|Object} summary - Summary data from Exa
 * @param {string[]} expectedFields - Fields to extract
 * @param {Object} defaults - Default values for missing fields
 * @returns {Object} Extracted data with defaults
 */
export function extractFromSummary(summary, expectedFields = [], defaults = {}) {
  let data = {};

  // Parse if string
  if (typeof summary === 'string') {
    try {
      data = JSON.parse(summary);
    } catch (error) {
      console.warn('Failed to parse summary as JSON:', error.message);
      return defaults;
    }
  } else if (summary && typeof summary === 'object') {
    data = summary;
  } else {
    return defaults;
  }

  // Extract expected fields with defaults
  const result = { ...defaults };
  for (const field of expectedFields) {
    if (field in data && data[field] !== null && data[field] !== undefined) {
      result[field] = data[field];
    }
  }

  return result;
}

/**
 * Fallback to text parsing when schema extraction fails
 * Uses regex patterns to extract structured data from plain text
 *
 * @param {string} text - Text content to parse
 * @param {string} dataType - Type of data to extract
 * @returns {Object} Extracted data or empty object
 */
export function fallbackToTextParsing(text, dataType) {
  if (!text || typeof text !== 'string') {
    return {};
  }

  switch (dataType) {
    case 'date':
      return extractDates(text);
    case 'monetary':
      return extractMonetaryValues(text);
    case 'citation':
      return extractCitations(text);
    case 'patent_number':
      return extractPatentNumbers(text);
    case 'case_number':
      return extractCaseNumbers(text);
    case 'email':
      return extractEmails(text);
    case 'url':
      return extractUrls(text);
    default:
      return {};
  }
}

/**
 * Extract dates from text
 */
function extractDates(text) {
  const datePatterns = [
    /\b(\d{4}-\d{2}-\d{2})\b/g,                           // ISO format
    /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g,                     // MM/DD/YYYY
    /\b([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\b/g              // Month DD, YYYY
  ];

  const dates = [];
  for (const pattern of datePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      dates.push(match[1]);
    }
  }

  return { dates: dates.length > 0 ? dates : null };
}

/**
 * Extract monetary values from text
 */
function extractMonetaryValues(text) {
  const moneyPattern = /\$\s*([\d,]+(?:\.\d+)?)\s*(million|billion|thousand)?/gi;
  const values = [];

  const matches = text.matchAll(moneyPattern);
  for (const match of matches) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    const multiplier = match[2] ?
      (match[2].toLowerCase() === 'billion' ? 1000000000 :
       match[2].toLowerCase() === 'million' ? 1000000 :
       match[2].toLowerCase() === 'thousand' ? 1000 : 1) : 1;
    values.push(amount * multiplier);
  }

  return { monetary_values: values.length > 0 ? values : null };
}

/**
 * Extract legal citations from text
 */
function extractCitations(text) {
  const citationPatterns = [
    /\b(\d+)\s+U\.?S\.?\s+(\d+)\b/g,                      // U.S. Reports
    /\b(\d+)\s+F\.\s*(?:2d|3d)?\s+(\d+)\b/g,              // Federal Reporter
    /\b(\d+)\s+S\.\s*Ct\.\s+(\d+)\b/g                     // Supreme Court Reporter
  ];

  const citations = [];
  for (const pattern of citationPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      citations.push(match[0]);
    }
  }

  return { citations: citations.length > 0 ? citations : null };
}

/**
 * Extract patent numbers from text
 */
function extractPatentNumbers(text) {
  const patentPatterns = [
    /\b(US\s*\d{7,8}[A-Z]\d?)\b/gi,                      // US patent format
    /\b(\d{1,2},\d{3},\d{3})\b/g                          // 9,999,999 format
  ];

  const patents = [];
  for (const pattern of patentPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      patents.push(match[1]);
    }
  }

  return { patent_numbers: patents.length > 0 ? patents : null };
}

/**
 * Extract case numbers from text
 */
function extractCaseNumbers(text) {
  const casePattern = /\b(\d{1,2}:\d{2}-[a-z]{2}-\d{5})\b/gi;
  const matches = [...text.matchAll(casePattern)];
  const caseNumbers = matches.map(m => m[1]);

  return { case_numbers: caseNumbers.length > 0 ? caseNumbers : null };
}

/**
 * Extract emails from text
 */
function extractEmails(text) {
  const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
  const matches = [...text.matchAll(emailPattern)];
  const emails = matches.map(m => m[1]);

  return { emails: emails.length > 0 ? emails : null };
}

/**
 * Extract URLs from text
 */
function extractUrls(text) {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const matches = [...text.matchAll(urlPattern)];
  const urls = matches.map(m => m[0]);

  return { urls: urls.length > 0 ? urls : null };
}

/**
 * Sanitize extracted data
 * Removes null/undefined fields and normalizes values
 *
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
export function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    // Skip null/undefined
    if (value === null || value === undefined) {
      continue;
    }

    // Trim strings
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        sanitized[key] = trimmed;
      }
    }
    // Recursively sanitize objects
    else if (typeof value === 'object' && !Array.isArray(value)) {
      const sanitizedObj = sanitizeData(value);
      if (Object.keys(sanitizedObj).length > 0) {
        sanitized[key] = sanitizedObj;
      }
    }
    // Filter empty arrays
    else if (Array.isArray(value)) {
      const filteredArray = value.filter(item => item !== null && item !== undefined);
      if (filteredArray.length > 0) {
        sanitized[key] = filteredArray;
      }
    }
    // Keep other values as-is
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Default export
 */
export default {
  validateSchema,
  extractFromSummary,
  fallbackToTextParsing,
  sanitizeData
};
