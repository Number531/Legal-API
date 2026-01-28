/**
 * USPTOSchemas.js
 * JSON Schema v7 definitions for USPTO/patent data types
 *
 * Covers:
 * - Patents and patent applications
 * - CPC (Cooperative Patent Classification)
 * - USPC (US Patent Classification - legacy)
 * - WIPO (World Intellectual Property Organization) classifications
 * - Patent locations and geographic data
 */

import { CommonTypes, createSchema } from './BaseSchemas.js';

/**
 * Patent Schema
 * Structured extraction from USPTO patent documents
 */
export const PatentSchema = createSchema(
  'USPTO Patent',
  {
    patent_number: {
      type: 'string',
      pattern: '^(US)?\\d{7,8}([A-Z]\\d?)?$',
      description: 'US Patent number (e.g., US1234567 or 1234567A1)'
    },
    title: {
      type: 'string',
      description: 'Title of the invention'
    },
    abstract: {
      type: 'string',
      description: 'Patent abstract summarizing the invention'
    },
    inventors: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'List of inventor names'
    },
    assignee: {
      type: 'string',
      description: 'Patent assignee (owner)'
    },
    filing_date: {
      ...CommonTypes.date,
      description: 'Date the patent application was filed'
    },
    issue_date: {
      ...CommonTypes.date,
      description: 'Date the patent was granted/issued'
    },
    application_number: {
      type: 'string',
      pattern: '^\\d{2}/\\d{3},\\d{3}$',
      description: 'Patent application number (e.g., 16/123,456)'
    },
    cpc_classifications: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^[A-HY]\\d{2}[A-Z]\\s*\\d+/\\d+$'
      },
      description: 'Cooperative Patent Classification codes'
    },
    uspc_classifications: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'US Patent Classification codes (legacy)'
    },
    ipc_classifications: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'International Patent Classification codes'
    },
    claims_count: {
      type: 'integer',
      minimum: 0,
      description: 'Number of claims in the patent'
    },
    cited_patents: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Patent numbers cited by this patent'
    },
    field_of_search: {
      type: 'string',
      description: 'Technical field of the invention'
    },
    patent_url: {
      ...CommonTypes.url,
      description: 'URL to the patent document'
    }
  },
  ['patent_number', 'title'] // Minimum required fields
);

/**
 * CPC Classification Schema
 * Cooperative Patent Classification system
 */
export const CPCClassificationSchema = createSchema(
  'CPC Classification',
  {
    classification_code: {
      type: 'string',
      pattern: '^[A-HY]\\d{2}[A-Z]\\s*\\d+/\\d+$',
      description: 'Full CPC classification code (e.g., G06F 17/30)'
    },
    section: {
      type: 'string',
      pattern: '^[A-HY]$',
      enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'Y'],
      description: 'CPC section letter'
    },
    section_title: {
      type: 'string',
      description: 'Title of the CPC section'
    },
    class_code: {
      type: 'string',
      pattern: '^[A-HY]\\d{2}[A-Z]$',
      description: 'CPC class code (e.g., G06F)'
    },
    class_title: {
      type: 'string',
      description: 'Title of the CPC class'
    },
    subclass: {
      type: 'string',
      description: 'CPC subclass'
    },
    main_group: {
      type: 'string',
      description: 'CPC main group'
    },
    subgroup: {
      type: 'string',
      description: 'CPC subgroup'
    },
    definition: {
      type: 'string',
      description: 'Definition or description of the classification'
    },
    patent_count: {
      type: 'integer',
      minimum: 0,
      description: 'Number of patents in this classification'
    }
  },
  ['classification_code', 'section'] // Minimum required fields
);

/**
 * USPC Classification Schema
 * Legacy US Patent Classification system
 */
export const USPCClassificationSchema = createSchema(
  'USPC Classification',
  {
    class_number: {
      type: 'string',
      pattern: '^\\d{1,3}$',
      description: 'USPC class number (e.g., 706 for AI)'
    },
    class_title: {
      type: 'string',
      description: 'Title of the USPC class'
    },
    subclass: {
      type: 'string',
      description: 'USPC subclass designation'
    },
    subclass_title: {
      type: 'string',
      description: 'Title of the USPC subclass'
    },
    definition: {
      type: 'string',
      description: 'Definition or scope of the classification'
    },
    patent_count: {
      type: 'integer',
      minimum: 0,
      description: 'Number of patents in this classification'
    },
    status: {
      type: 'string',
      enum: ['active', 'deprecated', 'obsolete'],
      description: 'Status of the USPC classification'
    }
  },
  ['class_number', 'class_title'] // Minimum required fields
);

/**
 * WIPO Classification Schema
 * World Intellectual Property Organization technology fields
 */
export const WIPOClassificationSchema = createSchema(
  'WIPO Classification',
  {
    field_number: {
      type: 'string',
      pattern: '^\\d{2}$',
      description: 'WIPO technology field number (01-35)'
    },
    field_title: {
      type: 'string',
      description: 'Title of the WIPO technology field'
    },
    sector: {
      type: 'string',
      enum: ['Electrical Engineering', 'Instruments', 'Chemistry', 'Mechanical Engineering', 'Other Fields'],
      description: 'Broader WIPO sector'
    },
    ipc_codes: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Related International Patent Classification codes'
    },
    description: {
      type: 'string',
      description: 'Description of the technology field'
    },
    patent_count: {
      type: 'integer',
      minimum: 0,
      description: 'Number of patents in this field'
    }
  },
  ['field_number', 'field_title'] // Minimum required fields
);

/**
 * Patent Location Schema
 * Geographic distribution of patents
 */
export const PatentLocationSchema = createSchema(
  'Patent Location',
  {
    location: {
      type: 'string',
      description: 'Geographic location (city, state, country)'
    },
    city: {
      type: 'string',
      description: 'City name'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code (US)'
    },
    country: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter country code (ISO 3166-1)'
    },
    patent_count: {
      type: 'integer',
      minimum: 0,
      description: 'Number of patents from this location'
    },
    assignee_count: {
      type: 'integer',
      minimum: 0,
      description: 'Number of unique assignees in this location'
    },
    top_assignees: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Top patent assignees in this location'
    },
    technology_areas: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Primary technology areas for this location'
    }
  },
  ['location', 'patent_count'] // Minimum required fields
);

/**
 * Patent Number type
 * Reusable type for US patent numbers
 */
export const PatentNumberType = {
  type: 'string',
  pattern: '^(US)?\\d{7,8}([A-Z]\\d?)?$',
  description: 'US Patent number (7-8 digits, optional prefix/suffix)'
};

/**
 * CPC Section enum
 * All valid CPC section letters
 */
export const CPCSectionEnum = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'Y'];

/**
 * CPC Section Titles
 * Human-readable titles for CPC sections
 */
export const CPCSectionTitles = {
  'A': 'HUMAN NECESSITIES',
  'B': 'PERFORMING OPERATIONS; TRANSPORTING',
  'C': 'CHEMISTRY; METALLURGY',
  'D': 'TEXTILES; PAPER',
  'E': 'FIXED CONSTRUCTIONS',
  'F': 'MECHANICAL ENGINEERING; LIGHTING; HEATING; WEAPONS; BLASTING',
  'G': 'PHYSICS',
  'H': 'ELECTRICITY',
  'Y': 'GENERAL TAGGING OF NEW TECHNOLOGICAL DEVELOPMENTS'
};

/**
 * WIPO Sector enum
 * Five main WIPO technology sectors
 */
export const WIPOSectorEnum = [
  'Electrical Engineering',
  'Instruments',
  'Chemistry',
  'Mechanical Engineering',
  'Other Fields'
];

/**
 * Export all schemas
 */
export const USPTOSchemas = {
  uspto_patent: PatentSchema,
  uspto_cpc_classification: CPCClassificationSchema,
  uspto_uspc_classification: USPCClassificationSchema,
  uspto_wipo_classification: WIPOClassificationSchema,
  uspto_patent_location: PatentLocationSchema
};

/**
 * Default export
 */
export default USPTOSchemas;
