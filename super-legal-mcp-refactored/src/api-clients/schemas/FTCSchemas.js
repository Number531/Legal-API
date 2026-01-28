/**
 * FTCSchemas.js
 * JSON Schema v7 definitions for FTC (Federal Trade Commission) data types
 *
 * Covers:
 * - Competition matters (antitrust, mergers, HSR filings)
 * - Enforcement cases (consent orders, complaints)
 * - Guidance and policy statements
 * - Rulemaking activities
 * - News and press releases
 * - Consumer alerts
 */

import { CommonTypes, createSchema } from './BaseSchemas.js';

/**
 * FTC Competition Matter Schema
 * Structured extraction for antitrust, merger, and HSR matters
 */
export const FTCCompetitionMatterSchema = createSchema(
  'FTC Competition Matter',
  {
    matter_number: {
      type: 'string',
      description: 'FTC matter number or file number'
    },
    title: {
      type: 'string',
      description: 'Title of the competition matter'
    },
    matter_type: {
      type: 'string',
      enum: [
        'Merger Review',
        'HSR Early Termination',
        'Monopolization',
        'Anticompetitive Conduct',
        'Horizontal Agreement',
        'Vertical Restraint',
        'Other'
      ],
      description: 'Type of competition matter'
    },
    parties: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Companies or parties involved'
    },
    transaction_value: {
      type: 'string',
      description: 'Value of the transaction (for mergers/acquisitions)'
    },
    industries: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Industries affected'
    },
    status: {
      type: 'string',
      enum: [
        'Under Review',
        'Approved',
        'Challenged',
        'Abandoned',
        'Early Terminated',
        'Closed'
      ],
      description: 'Current status of the matter'
    },
    filing_date: {
      ...CommonTypes.date,
      description: 'Date filed with FTC'
    },
    termination_date: {
      ...CommonTypes.date,
      description: 'Early termination date (for HSR)'
    },
    summary: {
      type: 'string',
      description: 'Summary of the matter'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the matter details'
    }
  },
  ['title'] // Minimum required fields
);

/**
 * FTC Enforcement Case Schema
 * Structured extraction for enforcement actions and consent orders
 */
export const FTCEnforcementCaseSchema = createSchema(
  'FTC Enforcement Case',
  {
    case_number: {
      type: 'string',
      description: 'FTC case number or docket number'
    },
    title: {
      type: 'string',
      description: 'Case title'
    },
    case_type: {
      type: 'string',
      enum: [
        'Consent Order',
        'Administrative Complaint',
        'Federal Court Complaint',
        'Final Order',
        'Settlement',
        'Civil Penalty',
        'Injunction'
      ],
      description: 'Type of enforcement action'
    },
    respondents: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Defendants or respondents'
    },
    violations: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Alleged violations or charges'
    },
    industries: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Industries involved'
    },
    monetary_relief: {
      type: 'string',
      description: 'Monetary relief or penalty amount'
    },
    equitable_relief: {
      type: 'string',
      description: 'Equitable relief or injunctive measures'
    },
    filed_date: {
      ...CommonTypes.date,
      description: 'Date case was filed'
    },
    order_date: {
      ...CommonTypes.date,
      description: 'Date of final order or consent decree'
    },
    summary: {
      type: 'string',
      description: 'Summary of the case'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to case details'
    }
  },
  ['title'] // Minimum required fields
);

/**
 * FTC Guidance Schema
 * Structured extraction for guidance documents and policy statements
 */
export const FTCGuidanceSchema = createSchema(
  'FTC Guidance',
  {
    title: {
      type: 'string',
      description: 'Title of the guidance document'
    },
    guidance_type: {
      type: 'string',
      enum: [
        'Policy Statement',
        'Advisory Opinion',
        'Guidance',
        'Staff Perspective',
        'Business Guidance',
        'Compliance Guide',
        'Interpretation'
      ],
      description: 'Type of guidance'
    },
    topics: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Topics covered in the guidance'
    },
    industries: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Industries addressed'
    },
    publication_date: {
      ...CommonTypes.date,
      description: 'Date published'
    },
    summary: {
      type: 'string',
      description: 'Summary of the guidance'
    },
    key_points: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Key points or takeaways'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the guidance document'
    }
  },
  ['title', 'guidance_type'] // Minimum required fields
);

/**
 * FTC Rulemaking Schema
 * Structured extraction for rulemaking activities
 */
export const FTCRulemakingSchema = createSchema(
  'FTC Rulemaking',
  {
    title: {
      type: 'string',
      description: 'Title of the rulemaking'
    },
    rulemaking_type: {
      type: 'string',
      enum: [
        'Proposed Rule',
        'Final Rule',
        'Advance Notice of Proposed Rulemaking',
        'Request for Comment',
        'Rule Amendment',
        'Rule Review'
      ],
      description: 'Type of rulemaking activity'
    },
    rule_number: {
      type: 'string',
      description: 'Rule number or CFR citation'
    },
    docket_number: {
      type: 'string',
      description: 'Rulemaking docket number'
    },
    topics: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Topics covered by the rule'
    },
    publication_date: {
      ...CommonTypes.date,
      description: 'Date published in Federal Register'
    },
    comment_deadline: {
      ...CommonTypes.date,
      description: 'Deadline for public comments'
    },
    effective_date: {
      ...CommonTypes.date,
      description: 'Effective date of the rule'
    },
    summary: {
      type: 'string',
      description: 'Summary of the rulemaking'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the rulemaking notice'
    }
  },
  ['title', 'rulemaking_type'] // Minimum required fields
);

/**
 * FTC News Schema
 * Structured extraction for news and press releases
 */
export const FTCNewsSchema = createSchema(
  'FTC News',
  {
    title: {
      type: 'string',
      description: 'Title of the news article or press release'
    },
    news_type: {
      type: 'string',
      enum: [
        'Press Release',
        'Statement',
        'Announcement',
        'Speech',
        'Testimony',
        'Blog Post',
        'Event Notice'
      ],
      description: 'Type of news'
    },
    publication_date: {
      ...CommonTypes.date,
      description: 'Date published'
    },
    topics: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Topics covered'
    },
    summary: {
      type: 'string',
      description: 'Summary of the news'
    },
    related_matters: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Related cases or matters'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the news article'
    }
  },
  ['title', 'news_type', 'publication_date'] // Minimum required fields
);

/**
 * FTC Consumer Alert Schema
 * Structured extraction for consumer alerts and warnings
 */
export const FTCConsumerAlertSchema = createSchema(
  'FTC Consumer Alert',
  {
    title: {
      type: 'string',
      description: 'Title of the consumer alert'
    },
    alert_type: {
      type: 'string',
      enum: [
        'Scam Alert',
        'Product Alert',
        'Identity Theft',
        'Data Breach',
        'Fraud Warning',
        'Safety Alert',
        'Consumer Tip'
      ],
      description: 'Type of alert'
    },
    publication_date: {
      ...CommonTypes.date,
      description: 'Date published'
    },
    risk_level: {
      type: 'string',
      enum: ['High', 'Medium', 'Low', 'Informational'],
      description: 'Risk level to consumers'
    },
    affected_groups: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Consumer groups affected'
    },
    warning_details: {
      type: 'string',
      description: 'Details of the warning or alert'
    },
    protective_actions: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Recommended protective actions'
    },
    related_scams: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Related scams or frauds'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the alert'
    }
  },
  ['title', 'alert_type'] // Minimum required fields
);

/**
 * Matter Type enum
 * Valid FTC competition matter types
 */
export const MatterTypeEnum = [
  'Merger Review',
  'HSR Early Termination',
  'Monopolization',
  'Anticompetitive Conduct',
  'Horizontal Agreement',
  'Vertical Restraint',
  'Other'
];

/**
 * Case Type enum
 * Valid FTC enforcement case types
 */
export const CaseTypeEnum = [
  'Consent Order',
  'Administrative Complaint',
  'Federal Court Complaint',
  'Final Order',
  'Settlement',
  'Civil Penalty',
  'Injunction'
];

/**
 * Guidance Type enum
 * Valid FTC guidance types
 */
export const GuidanceTypeEnum = [
  'Policy Statement',
  'Advisory Opinion',
  'Guidance',
  'Staff Perspective',
  'Business Guidance',
  'Compliance Guide',
  'Interpretation'
];

/**
 * Rulemaking Type enum
 * Valid FTC rulemaking types
 */
export const RulemakingTypeEnum = [
  'Proposed Rule',
  'Final Rule',
  'Advance Notice of Proposed Rulemaking',
  'Request for Comment',
  'Rule Amendment',
  'Rule Review'
];

/**
 * Export all schemas
 */
export const FTCSchemas = {
  ftc_competition_matter: FTCCompetitionMatterSchema,
  ftc_enforcement_case: FTCEnforcementCaseSchema,
  ftc_guidance: FTCGuidanceSchema,
  ftc_rulemaking: FTCRulemakingSchema,
  ftc_news: FTCNewsSchema,
  ftc_consumer_alert: FTCConsumerAlertSchema
};

/**
 * Default export
 */
export default FTCSchemas;
