/**
 * BaseSchemas.js
 * Common JSON schema patterns and utilities for Exa summary extraction
 *
 * Provides reusable type definitions and schema composition helpers
 * used across all domain-specific schema modules.
 */

/**
 * Common type definitions for use in domain schemas
 */
export const CommonTypes = {
  // Date formats
  date: {
    type: "string",
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    description: "ISO 8601 date format (YYYY-MM-DD)"
  },

  dateTime: {
    type: "string",
    format: "date-time",
    description: "ISO 8601 datetime format"
  },

  // Numeric types
  monetary: {
    type: "number",
    minimum: 0,
    description: "Monetary value (non-negative)"
  },

  monetaryOptional: {
    type: ["number", "null"],
    minimum: 0,
    description: "Optional monetary value"
  },

  percentage: {
    type: "number",
    minimum: 0,
    maximum: 100,
    description: "Percentage value (0-100)"
  },

  // String types
  url: {
    type: "string",
    format: "uri",
    description: "Valid URL"
  },

  email: {
    type: "string",
    format: "email",
    description: "Valid email address"
  },

  phoneNumber: {
    type: "string",
    pattern: "^\\+?[1-9]\\d{1,14}$",
    description: "Phone number in E.164 format"
  },

  // Location types
  zipCode: {
    type: "string",
    pattern: "^\\d{5}(-\\d{4})?$",
    description: "US ZIP code (5 or 9 digits)"
  },

  stateCode: {
    type: "string",
    pattern: "^[A-Z]{2}$",
    description: "Two-letter US state code"
  },

  // Legal identifiers
  citation: {
    type: "string",
    description: "Legal citation format"
  },

  caseNumber: {
    type: "string",
    description: "Court case number"
  },

  // Status types
  status: {
    type: "string",
    enum: ["active", "inactive", "pending", "completed", "cancelled"],
    description: "Generic status field"
  }
};

/**
 * Schema creation utility
 * Creates a JSON Schema v7 object with standard structure
 *
 * @param {string} title - Schema title
 * @param {Object} properties - Property definitions
 * @param {string[]} required - Required field names
 * @param {Object} options - Additional schema options
 * @returns {Object} JSON Schema v7 object
 */
export function createSchema(title, properties, required = [], options = {}) {
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title,
    type: "object",
    properties,
    ...options
  };

  if (required.length > 0) {
    schema.required = required;
  }

  return schema;
}

/**
 * Schema composition utility
 * Merges multiple property objects into a single schema
 *
 * @param {string} title - Schema title
 * @param {Object[]} propertySets - Array of property objects to merge
 * @param {string[]} required - Required field names
 * @returns {Object} JSON Schema v7 object
 */
export function composeSchema(title, propertySets, required = []) {
  const properties = {};

  for (const propSet of propertySets) {
    Object.assign(properties, propSet);
  }

  return createSchema(title, properties, required);
}

/**
 * Array schema utility
 * Creates a schema for an array of items with specific schema
 *
 * @param {string} title - Schema title
 * @param {Object} itemSchema - Schema for array items
 * @param {number} minItems - Minimum number of items
 * @param {number} maxItems - Maximum number of items
 * @returns {Object} JSON Schema v7 array object
 */
export function createArraySchema(title, itemSchema, minItems = 0, maxItems = null) {
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title,
    type: "array",
    items: itemSchema
  };

  if (minItems > 0) {
    schema.minItems = minItems;
  }

  if (maxItems !== null) {
    schema.maxItems = maxItems;
  }

  return schema;
}

/**
 * Enum schema utility
 * Creates a schema for string enum values
 *
 * @param {string} title - Schema title
 * @param {string[]} values - Allowed enum values
 * @param {string} description - Field description
 * @returns {Object} JSON Schema v7 enum object
 */
export function createEnumSchema(title, values, description = "") {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title,
    type: "string",
    enum: values,
    description
  };
}

/**
 * Optional field wrapper
 * Makes a type definition optional (allows null)
 *
 * @param {Object} typeDefinition - Base type definition
 * @returns {Object} Modified type definition allowing null
 */
export function makeOptional(typeDefinition) {
  return {
    ...typeDefinition,
    type: Array.isArray(typeDefinition.type)
      ? [...typeDefinition.type, "null"]
      : [typeDefinition.type, "null"]
  };
}

/**
 * Common property sets for composition
 */
export const CommonProperties = {
  // Address components
  address: {
    street: { type: "string", description: "Street address" },
    city: { type: "string", description: "City" },
    state: CommonTypes.stateCode,
    zipCode: CommonTypes.zipCode,
    country: { type: "string", description: "Country" }
  },

  // Contact information
  contact: {
    name: { type: "string", description: "Contact name" },
    email: CommonTypes.email,
    phone: CommonTypes.phoneNumber
  },

  // Temporal metadata
  timestamps: {
    created_date: CommonTypes.date,
    modified_date: CommonTypes.date,
    published_date: CommonTypes.date
  },

  // Document metadata
  documentMeta: {
    title: { type: "string", description: "Document title" },
    document_number: { type: "string", description: "Document identifier" },
    url: CommonTypes.url,
    document_type: { type: "string", description: "Type of document" }
  }
};

/**
 * Validation helpers
 */
export const ValidationHelpers = {
  /**
   * Check if a value matches a date pattern
   */
  isValidDate(value) {
    if (typeof value !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  },

  /**
   * Check if a value is a valid URL
   */
  isValidUrl(value) {
    if (typeof value !== 'string') return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if a value is a valid monetary amount
   */
  isValidMonetary(value) {
    return typeof value === 'number' && value >= 0;
  },

  /**
   * Check if a value matches state code pattern
   */
  isValidStateCode(value) {
    if (typeof value !== 'string') return false;
    return /^[A-Z]{2}$/.test(value);
  }
};

/**
 * Default export - single object with all utilities
 */
export default {
  CommonTypes,
  CommonProperties,
  ValidationHelpers,
  createSchema,
  composeSchema,
  createArraySchema,
  createEnumSchema,
  makeOptional
};
