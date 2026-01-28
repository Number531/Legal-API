/**
 * StateStatuteSchemas.js
 * JSON Schema v7 definitions for state statutes and legislation
 *
 * Covers:
 * - State statutes and code sections
 * - State bills and pending legislation
 * - State regulations and administrative rules
 * - State resolutions
 * - Legislative amendments
 */

import { CommonTypes, createSchema } from './BaseSchemas.js';

/**
 * State Statute Schema (General)
 * Structured extraction for state statutes and code sections
 */
export const StateStatuteSchema = createSchema(
  'State Statute',
  {
    title: {
      type: 'string',
      description: 'Title of the statute or code section'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    },
    citation: {
      type: 'string',
      description: 'Official statute citation (e.g., Cal. Penal Code § 187)'
    },
    section_number: {
      type: 'string',
      description: 'Section or chapter number'
    },
    subject_area: {
      type: 'string',
      description: 'Subject area or topic (e.g., Criminal Law, Family Law)'
    },
    code_title: {
      type: 'string',
      description: 'Title of the code (e.g., Penal Code, Business Code)'
    },
    effective_date: {
      ...CommonTypes.date,
      description: 'Effective date of the statute'
    },
    summary: {
      type: 'string',
      description: 'Summary of the statute content'
    },
    full_text: {
      type: 'string',
      description: 'Full text of the statute (if available)'
    },
    related_sections: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Related statute sections'
    },
    amendments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          year: {
            type: 'integer',
            description: 'Year of amendment'
          },
          description: {
            type: 'string',
            description: 'Description of amendment'
          }
        }
      },
      description: 'Amendment history'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the official statute text'
    }
  },
  ['title', 'state'] // Minimum required fields
);

/**
 * State Bill Schema
 * Structured extraction for state bills and pending legislation
 */
export const StateBillSchema = createSchema(
  'State Bill',
  {
    title: {
      type: 'string',
      description: 'Title of the bill'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    },
    bill_number: {
      type: 'string',
      description: 'Bill number (e.g., AB 123, SB 456)'
    },
    bill_type: {
      type: 'string',
      enum: ['Assembly Bill', 'Senate Bill', 'House Bill', 'Joint Resolution', 'Concurrent Resolution', 'Other'],
      description: 'Type of bill'
    },
    status: {
      type: 'string',
      enum: ['Introduced', 'In Committee', 'Passed House', 'Passed Senate', 'Enrolled', 'Signed', 'Vetoed', 'Failed', 'Other'],
      description: 'Current status of the bill'
    },
    sponsor: {
      type: 'string',
      description: 'Primary sponsor or author'
    },
    cosponsors: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'List of cosponsors'
    },
    session_year: {
      type: 'integer',
      minimum: 1900,
      maximum: 2100,
      description: 'Legislative session year'
    },
    introduced_date: {
      ...CommonTypes.date,
      description: 'Date the bill was introduced'
    },
    summary: {
      type: 'string',
      description: 'Summary of the bill'
    },
    subject_area: {
      type: 'string',
      description: 'Subject area or topic'
    },
    fiscal_impact: {
      type: 'string',
      description: 'Fiscal impact statement'
    },
    committee: {
      type: 'string',
      description: 'Committee currently assigned to'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the bill text and status'
    }
  },
  ['title', 'state', 'bill_number'] // Minimum required fields
);

/**
 * State Regulation Schema
 * Structured extraction for state administrative regulations
 */
export const StateRegulationSchema = createSchema(
  'State Regulation',
  {
    title: {
      type: 'string',
      description: 'Title of the regulation'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    },
    regulation_number: {
      type: 'string',
      description: 'Regulation citation or number'
    },
    agency: {
      type: 'string',
      description: 'State agency issuing the regulation'
    },
    regulation_type: {
      type: 'string',
      enum: ['Proposed', 'Final', 'Emergency', 'Temporary', 'Permanent'],
      description: 'Type of regulation'
    },
    subject_area: {
      type: 'string',
      description: 'Subject area or topic'
    },
    effective_date: {
      ...CommonTypes.date,
      description: 'Effective date of the regulation'
    },
    adoption_date: {
      ...CommonTypes.date,
      description: 'Date the regulation was adopted'
    },
    comment_period: {
      type: 'object',
      properties: {
        start_date: {
          ...CommonTypes.date,
          description: 'Start of public comment period'
        },
        end_date: {
          ...CommonTypes.date,
          description: 'End of public comment period'
        }
      },
      description: 'Public comment period (if applicable)'
    },
    summary: {
      type: 'string',
      description: 'Summary of the regulation'
    },
    statutory_authority: {
      type: 'string',
      description: 'Statutory authority for the regulation'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the regulation'
    }
  },
  ['title', 'state', 'agency'] // Minimum required fields
);

/**
 * State Resolution Schema
 * Structured extraction for state legislative resolutions
 */
export const StateResolutionSchema = createSchema(
  'State Resolution',
  {
    title: {
      type: 'string',
      description: 'Title of the resolution'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    },
    resolution_number: {
      type: 'string',
      description: 'Resolution number (e.g., HR 10, SR 25)'
    },
    resolution_type: {
      type: 'string',
      enum: ['Joint Resolution', 'Concurrent Resolution', 'House Resolution', 'Senate Resolution', 'Simple Resolution', 'Other'],
      description: 'Type of resolution'
    },
    sponsor: {
      type: 'string',
      description: 'Primary sponsor'
    },
    session_year: {
      type: 'integer',
      minimum: 1900,
      maximum: 2100,
      description: 'Legislative session year'
    },
    introduced_date: {
      ...CommonTypes.date,
      description: 'Date introduced'
    },
    adopted_date: {
      ...CommonTypes.date,
      description: 'Date adopted (if passed)'
    },
    status: {
      type: 'string',
      enum: ['Introduced', 'Adopted', 'Failed', 'Pending', 'Other'],
      description: 'Current status'
    },
    purpose: {
      type: 'string',
      description: 'Purpose or subject of the resolution'
    },
    summary: {
      type: 'string',
      description: 'Summary of the resolution'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the resolution'
    }
  },
  ['title', 'state', 'resolution_number'] // Minimum required fields
);

/**
 * State Code Type
 * Reusable type for two-letter state codes
 */
export const StateCodeType = {
  type: 'string',
  pattern: '^[A-Z]{2}$',
  description: 'Two-letter U.S. state code (e.g., CA, NY, TX)'
};

/**
 * Bill Type enum
 * Valid state bill types
 */
export const BillTypeEnum = [
  'Assembly Bill',
  'Senate Bill',
  'House Bill',
  'Joint Resolution',
  'Concurrent Resolution',
  'Other'
];

/**
 * Bill Status enum
 * Valid bill statuses
 */
export const BillStatusEnum = [
  'Introduced',
  'In Committee',
  'Passed House',
  'Passed Senate',
  'Enrolled',
  'Signed',
  'Vetoed',
  'Failed',
  'Other'
];

/**
 * Regulation Type enum
 * Valid regulation types
 */
export const RegulationTypeEnum = [
  'Proposed',
  'Final',
  'Emergency',
  'Temporary',
  'Permanent'
];

/**
 * Resolution Type enum
 * Valid resolution types
 */
export const ResolutionTypeEnum = [
  'Joint Resolution',
  'Concurrent Resolution',
  'House Resolution',
  'Senate Resolution',
  'Simple Resolution',
  'Other'
];

/**
 * Export all schemas
 */
export const StateStatuteSchemas = {
  state_statute: StateStatuteSchema,
  state_bill: StateBillSchema,
  state_regulation: StateRegulationSchema,
  state_resolution: StateResolutionSchema
};

/**
 * Default export
 */
export default StateStatuteSchemas;
