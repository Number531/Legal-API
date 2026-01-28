/**
 * FederalRegisterSchemas.js
 * JSON Schema v7 definitions for Federal Register document types
 *
 * Covers:
 * - General Federal Register documents
 * - Proposed rules and notices of proposed rulemaking (NPRM)
 * - Final rules and direct final rules
 * - Notices and announcements
 * - Presidential documents (executive orders, proclamations)
 * - Public inspection documents (pre-publication)
 */

import { CommonTypes, createSchema } from './BaseSchemas.js';

/**
 * Federal Register Document Schema (General)
 * Structured extraction for all Federal Register documents
 */
export const FederalRegisterDocumentSchema = createSchema(
  'Federal Register Document',
  {
    document_number: {
      type: 'string',
      pattern: '^\\d{4}-\\d{5}$',
      description: 'Federal Register document number (e.g., 2024-12345)'
    },
    title: {
      type: 'string',
      description: 'Title of the document'
    },
    agency: {
      type: 'string',
      description: 'Issuing agency or department'
    },
    document_type: {
      type: 'string',
      enum: ['Rule', 'Proposed Rule', 'Notice', 'Presidential Document', 'Other'],
      description: 'Type of Federal Register document'
    },
    publication_date: {
      ...CommonTypes.date,
      description: 'Date published in Federal Register'
    },
    abstract: {
      type: 'string',
      description: 'Summary or abstract of the document'
    },
    cfr_references: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'integer',
            description: 'CFR title number'
          },
          part: {
            type: 'string',
            description: 'CFR part or section'
          },
          citation: {
            type: 'string',
            description: 'Full CFR citation (e.g., 40 CFR 52.21)'
          }
        }
      },
      description: 'Code of Federal Regulations references'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the Federal Register document'
    }
  },
  ['title'] // Minimum required fields
);

/**
 * Federal Register Proposed Rule Schema
 * Structured extraction for proposed rules and NPRMs
 */
export const FederalRegisterProposedRuleSchema = createSchema(
  'Federal Register Proposed Rule',
  {
    document_number: {
      type: 'string',
      pattern: '^\\d{4}-\\d{5}$',
      description: 'Federal Register document number'
    },
    title: {
      type: 'string',
      description: 'Title of the proposed rule'
    },
    agency: {
      type: 'string',
      description: 'Issuing agency'
    },
    publication_date: {
      ...CommonTypes.date,
      description: 'Date published in Federal Register'
    },
    comment_deadline: {
      ...CommonTypes.date,
      description: 'Deadline for public comments'
    },
    days_to_comment: {
      type: 'integer',
      minimum: 0,
      description: 'Days remaining until comment deadline'
    },
    summary: {
      type: 'string',
      description: 'Summary of the proposed rule'
    },
    cfr_affected: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'CFR sections that would be affected'
    },
    regulatory_impact: {
      type: 'string',
      enum: ['Significant', 'Major', 'Minor', 'Not Significant'],
      description: 'Regulatory impact designation'
    },
    docket_id: {
      type: 'string',
      description: 'Regulations.gov docket ID'
    },
    rin: {
      type: 'string',
      pattern: '^\\d{4}-[A-Z]{2}\\d{2}$',
      description: 'Regulation Identifier Number (RIN)'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the proposed rule'
    }
  },
  ['title', 'agency'] // Minimum required fields
);

/**
 * Federal Register Final Rule Schema
 * Structured extraction for final rules
 */
export const FederalRegisterFinalRuleSchema = createSchema(
  'Federal Register Final Rule',
  {
    document_number: {
      type: 'string',
      pattern: '^\\d{4}-\\d{5}$',
      description: 'Federal Register document number'
    },
    title: {
      type: 'string',
      description: 'Title of the final rule'
    },
    agency: {
      type: 'string',
      description: 'Issuing agency'
    },
    publication_date: {
      ...CommonTypes.date,
      description: 'Date published in Federal Register'
    },
    effective_date: {
      ...CommonTypes.date,
      description: 'Date the rule becomes effective'
    },
    days_until_effective: {
      type: 'integer',
      description: 'Days until the rule becomes effective'
    },
    summary: {
      type: 'string',
      description: 'Summary of the final rule'
    },
    cfr_affected: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'CFR sections amended or added'
    },
    rule_type: {
      type: 'string',
      enum: ['Final Rule', 'Interim Final Rule', 'Direct Final Rule', 'Emergency Rule'],
      description: 'Type of final rule'
    },
    regulatory_impact: {
      type: 'string',
      enum: ['Significant', 'Major', 'Minor', 'Not Significant'],
      description: 'Regulatory impact designation'
    },
    rin: {
      type: 'string',
      pattern: '^\\d{4}-[A-Z]{2}\\d{2}$',
      description: 'Regulation Identifier Number (RIN)'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the final rule'
    }
  },
  ['title', 'agency'] // Minimum required fields
);

/**
 * Federal Register Notice Schema
 * Structured extraction for notices and announcements
 */
export const FederalRegisterNoticeSchema = createSchema(
  'Federal Register Notice',
  {
    document_number: {
      type: 'string',
      pattern: '^\\d{4}-\\d{5}$',
      description: 'Federal Register document number'
    },
    title: {
      type: 'string',
      description: 'Title of the notice'
    },
    agency: {
      type: 'string',
      description: 'Issuing agency'
    },
    notice_type: {
      type: 'string',
      enum: [
        'Public Meeting',
        'Request for Comments',
        'Availability of Document',
        'Agency Information Collection',
        'Sunshine Act Meeting',
        'Advisory Committee Meeting',
        'Petition',
        'Other'
      ],
      description: 'Type of notice'
    },
    publication_date: {
      ...CommonTypes.date,
      description: 'Date published in Federal Register'
    },
    summary: {
      type: 'string',
      description: 'Summary of the notice'
    },
    meeting_date: {
      ...CommonTypes.date,
      description: 'Date of meeting (if applicable)'
    },
    comment_deadline: {
      ...CommonTypes.date,
      description: 'Deadline for comments (if applicable)'
    },
    contact_info: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Contact person name'
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'Contact email'
        },
        phone: {
          type: 'string',
          description: 'Contact phone number'
        }
      },
      description: 'Contact information'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the notice'
    }
  },
  ['title', 'agency'] // Minimum required fields
);

/**
 * Federal Register Presidential Document Schema
 * Structured extraction for presidential documents
 */
export const FederalRegisterPresidentialDocumentSchema = createSchema(
  'Federal Register Presidential Document',
  {
    document_number: {
      type: 'string',
      pattern: '^\\d{4}-\\d{5}$',
      description: 'Federal Register document number'
    },
    title: {
      type: 'string',
      description: 'Title of the presidential document'
    },
    document_type: {
      type: 'string',
      enum: [
        'Executive Order',
        'Presidential Proclamation',
        'Presidential Determination',
        'Presidential Memorandum',
        'Administrative Order',
        'Notice',
        'Other'
      ],
      description: 'Type of presidential document'
    },
    executive_order_number: {
      type: 'string',
      pattern: '^\\d{5}$',
      description: 'Executive Order number (e.g., 14033)'
    },
    signing_date: {
      ...CommonTypes.date,
      description: 'Date signed by the President'
    },
    publication_date: {
      ...CommonTypes.date,
      description: 'Date published in Federal Register'
    },
    summary: {
      type: 'string',
      description: 'Summary of the presidential document'
    },
    subject_areas: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Subject areas addressed'
    },
    agencies_affected: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Federal agencies affected or directed'
    },
    revokes: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Previous executive orders or documents revoked'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the presidential document'
    }
  },
  ['title', 'document_type'] // Minimum required fields
);

/**
 * Federal Register Public Inspection Document Schema
 * Structured extraction for pre-publication documents
 */
export const FederalRegisterPublicInspectionSchema = createSchema(
  'Federal Register Public Inspection Document',
  {
    document_number: {
      type: 'string',
      description: 'Public inspection document number or filing number'
    },
    title: {
      type: 'string',
      description: 'Title of the document'
    },
    agency: {
      type: 'string',
      description: 'Issuing agency'
    },
    document_type: {
      type: 'string',
      enum: ['Rule', 'Proposed Rule', 'Notice', 'Presidential Document', 'Other'],
      description: 'Type of document'
    },
    filing_date: {
      ...CommonTypes.date,
      description: 'Date filed for public inspection'
    },
    expected_publication_date: {
      ...CommonTypes.date,
      description: 'Expected Federal Register publication date'
    },
    pages: {
      type: 'integer',
      minimum: 1,
      description: 'Number of pages'
    },
    subject: {
      type: 'string',
      description: 'Subject of the document'
    },
    summary: {
      type: 'string',
      description: 'Summary or abstract'
    },
    toc_subject: {
      type: 'string',
      description: 'Table of contents subject classification'
    },
    docket_numbers: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Associated docket numbers'
    },
    special_filing: {
      type: 'boolean',
      description: 'Whether this is a special filing'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the public inspection document'
    }
  },
  ['title', 'agency'] // Minimum required fields
);

/**
 * Document Number type
 * Reusable type for Federal Register document numbers
 */
export const DocumentNumberType = {
  type: 'string',
  pattern: '^\\d{4}-\\d{5}$',
  description: 'Federal Register document number (e.g., 2024-12345)'
};

/**
 * RIN type
 * Reusable type for Regulation Identifier Numbers
 */
export const RINType = {
  type: 'string',
  pattern: '^\\d{4}-[A-Z]{2}\\d{2}$',
  description: 'Regulation Identifier Number (e.g., 2050-AG45)'
};

/**
 * Document Type enum
 * Valid Federal Register document types
 */
export const DocumentTypeEnum = [
  'Rule',
  'Proposed Rule',
  'Notice',
  'Presidential Document',
  'Other'
];

/**
 * Rule Type enum
 * Valid final rule types
 */
export const RuleTypeEnum = [
  'Final Rule',
  'Interim Final Rule',
  'Direct Final Rule',
  'Emergency Rule'
];

/**
 * Presidential Document Type enum
 * Valid presidential document types
 */
export const PresidentialDocumentTypeEnum = [
  'Executive Order',
  'Presidential Proclamation',
  'Presidential Determination',
  'Presidential Memorandum',
  'Administrative Order',
  'Notice',
  'Other'
];

/**
 * Notice Type enum
 * Valid notice types
 */
export const NoticeTypeEnum = [
  'Public Meeting',
  'Request for Comments',
  'Availability of Document',
  'Agency Information Collection',
  'Sunshine Act Meeting',
  'Advisory Committee Meeting',
  'Petition',
  'Other'
];

/**
 * Export all schemas
 */
export const FederalRegisterSchemas = {
  federal_register_document: FederalRegisterDocumentSchema,
  federal_register_proposed_rule: FederalRegisterProposedRuleSchema,
  federal_register_final_rule: FederalRegisterFinalRuleSchema,
  federal_register_notice: FederalRegisterNoticeSchema,
  federal_register_presidential_document: FederalRegisterPresidentialDocumentSchema,
  federal_register_public_inspection: FederalRegisterPublicInspectionSchema
};

/**
 * Default export
 */
export default FederalRegisterSchemas;
