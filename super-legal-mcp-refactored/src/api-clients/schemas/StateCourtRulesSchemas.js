/**
 * StateCourtRulesSchemas.js
 * JSON Schema v7 definitions for state court rules and procedural requirements
 *
 * Covers:
 * - General court rules (procedural, formatting, electronic)
 * - Local county and district rules
 * - Document formatting requirements
 * - Electronic filing technical specifications
 * - Discovery and appellate rules
 * - Document templates and compliance
 */

import { CommonTypes, createSchema } from './BaseSchemas.js';

/**
 * State Court Rule Schema (General)
 * Structured extraction for state court rules
 */
export const StateCourtRuleSchema = createSchema(
  'State Court Rule',
  {
    title: {
      type: 'string',
      description: 'Title of the court rule or regulation'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    },
    rule_number: {
      type: 'string',
      description: 'Rule number or citation (e.g., Rule 12, FRCP 56)'
    },
    rule_type: {
      type: 'string',
      enum: ['formatting', 'procedural', 'electronic', 'local', 'discovery', 'appellate', 'emergency'],
      description: 'Category of court rule'
    },
    court_level: {
      type: 'string',
      enum: ['supreme', 'appellate', 'superior', 'circuit', 'district', 'county', 'municipal', 'other'],
      description: 'Court level this rule applies to'
    },
    county: {
      type: 'string',
      description: 'County for local rules (if applicable)'
    },
    summary: {
      type: 'string',
      description: 'Summary of the rule'
    },
    effective_date: {
      ...CommonTypes.date,
      description: 'Effective date of the rule or amendment'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the full rule text'
    }
  },
  ['title', 'state'] // Minimum required fields
);

/**
 * Formatting Requirements Schema
 * Structured extraction for document formatting requirements
 */
export const FormattingRequirementsSchema = createSchema(
  'Formatting Requirements',
  {
    title: {
      type: 'string',
      description: 'Title of the formatting requirement document'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    },
    court_level: {
      type: 'string',
      description: 'Court level these requirements apply to'
    },
    document_type: {
      type: 'string',
      enum: ['complaint', 'motion', 'brief', 'order', 'pleading', 'discovery', 'general'],
      description: 'Type of document'
    },
    font_requirements: {
      type: 'object',
      properties: {
        typeface: {
          type: 'string',
          description: 'Required font typeface'
        },
        size: {
          type: 'string',
          description: 'Required font size (e.g., 12 point)'
        }
      },
      description: 'Font and typography requirements'
    },
    margin_requirements: {
      type: 'object',
      properties: {
        top: {
          type: 'string',
          description: 'Top margin measurement'
        },
        bottom: {
          type: 'string',
          description: 'Bottom margin measurement'
        },
        left: {
          type: 'string',
          description: 'Left margin measurement'
        },
        right: {
          type: 'string',
          description: 'Right margin measurement'
        }
      },
      description: 'Margin and spacing requirements'
    },
    line_spacing: {
      type: 'string',
      description: 'Required line spacing (e.g., double-spaced)'
    },
    page_limit: {
      type: 'string',
      description: 'Maximum page length (if applicable)'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to formatting requirements'
    }
  },
  ['title', 'state'] // Minimum required fields
);

/**
 * Electronic Filing Rules Schema
 * Structured extraction for e-filing technical requirements
 */
export const ElectronicFilingRulesSchema = createSchema(
  'Electronic Filing Rules',
  {
    title: {
      type: 'string',
      description: 'Title of the e-filing rule or guide'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    },
    filing_system_name: {
      type: 'string',
      description: 'Name of the e-filing system (e.g., eFileTexas, NYSCEF)'
    },
    mandatory: {
      type: 'boolean',
      description: 'Whether e-filing is mandatory'
    },
    file_formats: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Accepted file formats (e.g., PDF, DOCX)'
    },
    file_size_limit: {
      type: 'string',
      description: 'Maximum file size limit'
    },
    pdf_requirements: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'PDF-specific requirements (searchable, bookmarks, etc.)'
    },
    technical_requirements: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Technical requirements and specifications'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to e-filing rules'
    }
  },
  ['title', 'state'] // Minimum required fields
);

/**
 * Local Rules Schema
 * Structured extraction for county and district-specific rules
 */
export const LocalRulesSchema = createSchema(
  'Local Rules',
  {
    title: {
      type: 'string',
      description: 'Title of the local rule'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    },
    county: {
      type: 'string',
      description: 'County name'
    },
    district: {
      type: 'string',
      description: 'Judicial district (if applicable)'
    },
    court_name: {
      type: 'string',
      description: 'Specific court name'
    },
    rule_topic: {
      type: 'string',
      enum: ['motion_practice', 'discovery', 'scheduling', 'filing', 'appearances', 'general'],
      description: 'Topic of the local rule'
    },
    differs_from_state: {
      type: 'boolean',
      description: 'Whether this local rule differs from state rules'
    },
    summary: {
      type: 'string',
      description: 'Summary of the local rule'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to local rules'
    }
  },
  ['title', 'state'] // Minimum required fields
);

/**
 * Court Procedure Schema
 * Structured extraction for court procedures and practice requirements
 */
export const CourtProcedureSchema = createSchema(
  'Court Procedure',
  {
    title: {
      type: 'string',
      description: 'Title of the procedure or practice requirement'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    },
    procedure_type: {
      type: 'string',
      enum: ['motion', 'discovery', 'trial', 'scheduling', 'service', 'filing', 'general'],
      description: 'Type of procedure'
    },
    court_level: {
      type: 'string',
      description: 'Court level this procedure applies to'
    },
    deadlines: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Key deadlines (e.g., 30 days to respond)'
    },
    requirements: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Procedural requirements'
    },
    summary: {
      type: 'string',
      description: 'Summary of the procedure'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to procedure details'
    }
  },
  ['title', 'state', 'procedure_type'] // Minimum required fields
);

/**
 * Rule Update Schema
 * Structured extraction for recent rule changes and amendments
 */
export const RuleUpdateSchema = createSchema(
  'Rule Update',
  {
    title: {
      type: 'string',
      description: 'Title of the rule update or amendment'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    },
    update_type: {
      type: 'string',
      enum: ['amendment', 'new_rule', 'repeal', 'clarification'],
      description: 'Type of update'
    },
    rule_affected: {
      type: 'string',
      description: 'Rule number or citation affected'
    },
    effective_date: {
      ...CommonTypes.date,
      description: 'Effective date of the change'
    },
    summary: {
      type: 'string',
      description: 'Summary of the changes'
    },
    impact: {
      type: 'string',
      enum: ['major', 'moderate', 'minor', 'technical'],
      description: 'Impact level of the change'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to update details'
    }
  },
  ['title', 'state', 'update_type'] // Minimum required fields
);

/**
 * Document Template Schema
 * Structured extraction for court-approved document templates
 */
export const DocumentTemplateSchema = createSchema(
  'Document Template',
  {
    title: {
      type: 'string',
      description: 'Title of the template'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    },
    document_type: {
      type: 'string',
      description: 'Type of document (complaint, motion, etc.)'
    },
    template_type: {
      type: 'string',
      enum: ['official_form', 'sample_document', 'fillable_form', 'general_template'],
      description: 'Type of template'
    },
    court_level: {
      type: 'string',
      description: 'Court level this template is for'
    },
    mandatory: {
      type: 'boolean',
      description: 'Whether use of this template is mandatory'
    },
    format: {
      type: 'string',
      enum: ['PDF', 'Word', 'Online_Form', 'Other'],
      description: 'Template file format'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to download or access template'
    }
  },
  ['title', 'state', 'document_type'] // Minimum required fields
);

/**
 * State Code type
 * Reusable type for two-letter state codes
 */
export const StateCodeType = {
  type: 'string',
  pattern: '^[A-Z]{2}$',
  description: 'Two-letter U.S. state code (e.g., CA, NY, TX)'
};

/**
 * Rule Type enum
 * Valid court rule types
 */
export const RuleTypeEnum = [
  'formatting',
  'procedural',
  'electronic',
  'local',
  'discovery',
  'appellate',
  'emergency'
];

/**
 * Court Level enum
 * Valid court levels
 */
export const CourtLevelEnum = [
  'supreme',
  'appellate',
  'superior',
  'circuit',
  'district',
  'county',
  'municipal',
  'other'
];

/**
 * Document Type enum
 * Valid document types
 */
export const DocumentTypeEnum = [
  'complaint',
  'motion',
  'brief',
  'order',
  'pleading',
  'discovery',
  'general'
];

/**
 * Procedure Type enum
 * Valid procedure types
 */
export const ProcedureTypeEnum = [
  'motion',
  'discovery',
  'trial',
  'scheduling',
  'service',
  'filing',
  'general'
];

/**
 * Export all schemas
 */
export const StateCourtRulesSchemas = {
  state_court_rule: StateCourtRuleSchema,
  formatting_requirements: FormattingRequirementsSchema,
  electronic_filing_rules: ElectronicFilingRulesSchema,
  local_rules: LocalRulesSchema,
  court_procedure: CourtProcedureSchema,
  rule_update: RuleUpdateSchema,
  document_template: DocumentTemplateSchema
};

/**
 * Default export
 */
export default StateCourtRulesSchemas;
