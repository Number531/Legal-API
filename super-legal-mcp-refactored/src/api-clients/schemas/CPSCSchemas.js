/**
 * CPSCSchemas.js
 * JSON Schema v7 definitions for CPSC (Consumer Product Safety Commission) data types
 *
 * Covers:
 * - Product recalls and safety alerts
 * - Enforcement actions and violations
 * - Injury data and statistics (NEISS)
 * - Safety standards and regulations
 * - Business guidance for manufacturers
 * - News and press releases
 * - Research reports and studies
 */

import { CommonTypes, createSchema } from './BaseSchemas.js';

/**
 * CPSC Recall Schema
 * Structured extraction for product recall information
 */
export const CPSCRecallSchema = createSchema(
  'CPSC Recall',
  {
    recall_number: {
      type: 'string',
      pattern: '^\\d{2}-\\d{3,4}$',
      description: 'CPSC recall number (e.g., 23-456)'
    },
    title: {
      type: 'string',
      description: 'Title of the recall announcement'
    },
    product_name: {
      type: 'string',
      description: 'Name of the recalled product'
    },
    manufacturer: {
      type: 'string',
      description: 'Manufacturer or distributor of the product'
    },
    hazard_type: {
      type: 'string',
      enum: [
        'Fire',
        'Burn',
        'Choking',
        'Laceration',
        'Fall',
        'Entanglement',
        'Chemical',
        'Electrical',
        'Impact',
        'Ingestion',
        'Other'
      ],
      description: 'Type of safety hazard'
    },
    hazard_description: {
      type: 'string',
      description: 'Detailed description of the hazard'
    },
    remedy_action: {
      type: 'string',
      description: 'Recommended remedy or action for consumers'
    },
    incident_count: {
      type: 'integer',
      minimum: 0,
      description: 'Number of reported incidents'
    },
    injury_count: {
      type: 'integer',
      minimum: 0,
      description: 'Number of reported injuries'
    },
    death_count: {
      type: 'integer',
      minimum: 0,
      description: 'Number of reported deaths'
    },
    units_sold: {
      type: 'string',
      description: 'Number of units sold or affected'
    },
    recall_date: {
      ...CommonTypes.date,
      description: 'Date the recall was announced'
    },
    product_category: {
      type: 'string',
      description: 'Category of the product (toys, furniture, electronics, etc.)'
    },
    model_number: {
      type: 'string',
      description: 'Model number or product identifier'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the recall announcement'
    }
  },
  ['recall_number', 'title', 'manufacturer'] // Minimum required fields
);

/**
 * CPSC Enforcement Schema
 * Structured extraction for enforcement actions and violations
 */
export const CPSCEnforcementSchema = createSchema(
  'CPSC Enforcement',
  {
    title: {
      type: 'string',
      description: 'Title of the enforcement action'
    },
    company_name: {
      type: 'string',
      description: 'Company subject to enforcement action'
    },
    violation_type: {
      type: 'string',
      enum: [
        'Section 15 Violation',
        'Certification Violation',
        'Testing Violation',
        'Labeling Violation',
        'Import Violation',
        'Substantial Product Hazard',
        'Other'
      ],
      description: 'Type of violation'
    },
    violation_description: {
      type: 'string',
      description: 'Description of the violation'
    },
    penalty_amount: {
      type: 'string',
      description: 'Civil penalty amount (if applicable)'
    },
    settlement_terms: {
      type: 'string',
      description: 'Terms of the settlement or enforcement action'
    },
    action_date: {
      ...CommonTypes.date,
      description: 'Date of the enforcement action'
    },
    product_involved: {
      type: 'string',
      description: 'Product involved in the violation'
    },
    corrective_actions: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Required corrective actions'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the enforcement announcement'
    }
  },
  ['title', 'company_name'] // Minimum required fields
);

/**
 * CPSC Injury Data Schema
 * Structured extraction for injury statistics (NEISS data)
 */
export const CPSCInjuryDataSchema = createSchema(
  'CPSC Injury Data',
  {
    title: {
      type: 'string',
      description: 'Title of the injury data report'
    },
    product_code: {
      type: 'string',
      description: 'NEISS product code'
    },
    product_name: {
      type: 'string',
      description: 'Name of the product category'
    },
    injury_type: {
      type: 'string',
      description: 'Type of injury'
    },
    injury_count: {
      type: 'integer',
      minimum: 0,
      description: 'Estimated number of injuries'
    },
    age_group: {
      type: 'string',
      description: 'Age group affected'
    },
    treatment_type: {
      type: 'string',
      enum: [
        'Treated and Released',
        'Hospitalized',
        'Transferred',
        'Left Without Treatment',
        'DOA/Fatal'
      ],
      description: 'Type of emergency department treatment'
    },
    reporting_period: {
      type: 'string',
      description: 'Time period for the data (e.g., 2023)'
    },
    data_source: {
      type: 'string',
      enum: ['NEISS', 'NEISS-AIP', 'CPSRMS', 'Other'],
      description: 'Source of injury data'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the injury data report'
    }
  },
  ['title', 'product_name'] // Minimum required fields
);

/**
 * CPSC Safety Standard Schema
 * Structured extraction for safety standards and regulations
 */
export const CPSCSafetyStandardSchema = createSchema(
  'CPSC Safety Standard',
  {
    title: {
      type: 'string',
      description: 'Title of the safety standard'
    },
    standard_number: {
      type: 'string',
      description: 'CFR citation or standard number (e.g., 16 CFR 1500)'
    },
    standard_type: {
      type: 'string',
      enum: ['Mandatory', 'Voluntary', 'Proposed', 'Final Rule'],
      description: 'Type of safety standard'
    },
    product_category: {
      type: 'string',
      description: 'Product category covered by the standard'
    },
    effective_date: {
      ...CommonTypes.date,
      description: 'Effective date of the standard'
    },
    requirements: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Key requirements of the standard'
    },
    testing_requirements: {
      type: 'string',
      description: 'Testing and certification requirements'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the standard document'
    }
  },
  ['title', 'standard_number'] // Minimum required fields
);

/**
 * CPSC Business Guidance Schema
 * Structured extraction for manufacturer and importer guidance
 */
export const CPSCBusinessGuidanceSchema = createSchema(
  'CPSC Business Guidance',
  {
    title: {
      type: 'string',
      description: 'Title of the guidance document'
    },
    guidance_type: {
      type: 'string',
      enum: [
        'Compliance Guide',
        'Testing Requirements',
        'Certification',
        'Import Requirements',
        'Labeling Requirements',
        'General Guidance'
      ],
      description: 'Type of business guidance'
    },
    target_audience: {
      type: 'string',
      description: 'Intended audience (manufacturers, importers, retailers, etc.)'
    },
    product_category: {
      type: 'string',
      description: 'Product category addressed'
    },
    key_requirements: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Key compliance requirements'
    },
    publication_date: {
      ...CommonTypes.date,
      description: 'Date the guidance was published'
    },
    related_standards: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Related safety standards or regulations'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the guidance document'
    }
  },
  ['title', 'guidance_type'] // Minimum required fields
);

/**
 * CPSC News Schema
 * Structured extraction for news and press releases
 */
export const CPSCNewsSchema = createSchema(
  'CPSC News',
  {
    title: {
      type: 'string',
      description: 'Title of the news article or press release'
    },
    news_type: {
      type: 'string',
      enum: [
        'Press Release',
        'Safety Alert',
        'Recall Announcement',
        'Enforcement Notice',
        'Public Meeting Notice',
        'Commissioner Statement',
        'General News'
      ],
      description: 'Type of news or announcement'
    },
    publication_date: {
      ...CommonTypes.date,
      description: 'Date the news was published'
    },
    summary: {
      type: 'string',
      description: 'Brief summary of the news'
    },
    related_product: {
      type: 'string',
      description: 'Product related to the news (if applicable)'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the news article'
    }
  },
  ['title', 'news_type', 'publication_date'] // Minimum required fields
);

/**
 * CPSC Report Schema
 * Structured extraction for research reports and studies
 */
export const CPSCReportSchema = createSchema(
  'CPSC Report',
  {
    title: {
      type: 'string',
      description: 'Title of the report or study'
    },
    report_type: {
      type: 'string',
      enum: [
        'Research Study',
        'Statistical Report',
        'Technical Report',
        'Annual Report',
        'Special Study',
        'Risk Assessment',
        'Policy Analysis'
      ],
      description: 'Type of report'
    },
    publication_date: {
      ...CommonTypes.date,
      description: 'Date the report was published'
    },
    authors: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Report authors'
    },
    abstract: {
      type: 'string',
      description: 'Abstract or executive summary'
    },
    product_category: {
      type: 'string',
      description: 'Product category studied'
    },
    key_findings: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Key findings or conclusions'
    },
    data_period: {
      type: 'string',
      description: 'Time period covered by the report data'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the report document'
    }
  },
  ['title', 'report_type'] // Minimum required fields
);

/**
 * Hazard Type enum
 * Valid CPSC hazard classifications
 */
export const HazardTypeEnum = [
  'Fire',
  'Burn',
  'Choking',
  'Laceration',
  'Fall',
  'Entanglement',
  'Chemical',
  'Electrical',
  'Impact',
  'Ingestion',
  'Other'
];

/**
 * Violation Type enum
 * Valid CPSC violation types
 */
export const ViolationTypeEnum = [
  'Section 15 Violation',
  'Certification Violation',
  'Testing Violation',
  'Labeling Violation',
  'Import Violation',
  'Substantial Product Hazard',
  'Other'
];

/**
 * Recall Number type
 * Reusable type for CPSC recall numbers
 */
export const RecallNumberType = {
  type: 'string',
  pattern: '^\\d{2}-\\d{3,4}$',
  description: 'CPSC recall number (e.g., 23-456, 24-1234)'
};

/**
 * Export all schemas
 */
export const CPSCSchemas = {
  cpsc_recall: CPSCRecallSchema,
  cpsc_enforcement: CPSCEnforcementSchema,
  cpsc_injury_data: CPSCInjuryDataSchema,
  cpsc_safety_standard: CPSCSafetyStandardSchema,
  cpsc_business_guidance: CPSCBusinessGuidanceSchema,
  cpsc_news: CPSCNewsSchema,
  cpsc_report: CPSCReportSchema
};

/**
 * Default export
 */
export default CPSCSchemas;
