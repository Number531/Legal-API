/**
 * PTABSchemas.js
 * JSON Schema v7 definitions for PTAB (Patent Trial and Appeal Board) data types
 *
 * Covers:
 * - IPR (Inter Partes Review)
 * - PGR (Post-Grant Review)
 * - CBM (Covered Business Method)
 * - AIA (America Invents Act) proceedings
 */

import { CommonTypes, createSchema } from './BaseSchemas.js';

/**
 * PTAB Proceeding Schema
 * Structured extraction for Patent Trial and Appeal Board proceedings
 */
export const PTABProceedingSchema = createSchema(
  'PTAB Proceeding',
  {
    proceeding_type: {
      type: 'string',
      enum: ['IPR', 'PGR', 'CBM', 'DER', 'AIA'],
      description: 'Type of PTAB proceeding'
    },
    proceeding_number: {
      type: 'string',
      pattern: '^(IPR|PGR|CBM|DER)\\d{4}-\\d{5}$',
      description: 'PTAB proceeding number (e.g., IPR2023-00123)'
    },
    title: {
      type: 'string',
      description: 'Title of the proceeding or decision'
    },
    patent_number: {
      type: 'string',
      pattern: '^(US)?\\d{7,8}([A-Z]\\d?)?$',
      description: 'US Patent number under review'
    },
    petitioner: {
      type: 'string',
      description: 'Party filing the proceeding (challenger)'
    },
    patent_owner: {
      type: 'string',
      description: 'Owner of the patent being challenged'
    },
    status: {
      type: 'string',
      enum: [
        'Pending Review',
        'Trial Instituted',
        'Institution Denied',
        'Institution Decision',
        'Final Written Decision',
        'Settled',
        'Terminated',
        'Status unknown'
      ],
      description: 'Current status of the proceeding'
    },
    filed_date: {
      ...CommonTypes.date,
      description: 'Date the proceeding was filed'
    },
    decision_date: {
      ...CommonTypes.date,
      description: 'Date of final decision (if available)'
    },
    institution_date: {
      ...CommonTypes.date,
      description: 'Date trial was instituted (if applicable)'
    },
    snippet: {
      type: 'string',
      description: 'Key excerpt from the proceeding document'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the PTAB proceeding document'
    },
    claims_challenged: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Patent claims being challenged'
    },
    judges: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Administrative Patent Judges assigned to proceeding'
    },
    outcome: {
      type: 'string',
      enum: [
        'Claims Unpatentable',
        'Claims Patentable',
        'Partially Unpatentable',
        'Not Yet Decided',
        'Dismissed',
        'Not available'
      ],
      description: 'Outcome of the final written decision'
    }
  },
  ['proceeding_type', 'proceeding_number'] // Minimum required fields
);

/**
 * IPR (Inter Partes Review) Schema
 * Specialized schema for IPR proceedings
 */
export const IPRProceedingSchema = createSchema(
  'IPR Proceeding',
  {
    proceeding_number: {
      type: 'string',
      pattern: '^IPR\\d{4}-\\d{5}$',
      description: 'IPR proceeding number (e.g., IPR2023-00123)'
    },
    title: {
      type: 'string',
      description: 'Title of the IPR proceeding'
    },
    patent_number: {
      type: 'string',
      pattern: '^(US)?\\d{7,8}([A-Z]\\d?)?$',
      description: 'US Patent number under IPR'
    },
    petitioner: {
      type: 'string',
      description: 'Party filing the IPR petition'
    },
    patent_owner: {
      type: 'string',
      description: 'Owner of the patent under review'
    },
    status: {
      type: 'string',
      description: 'Current status of the IPR proceeding'
    },
    filed_date: {
      ...CommonTypes.date,
      description: 'Date the IPR petition was filed'
    },
    decision_date: {
      ...CommonTypes.date,
      description: 'Date of final written decision'
    },
    snippet: {
      type: 'string',
      description: 'Excerpt from IPR documents'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to IPR proceeding page'
    },
    claims_challenged: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Specific patent claims challenged in IPR'
    },
    prior_art_references: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Prior art cited in IPR petition'
    }
  },
  ['proceeding_number', 'patent_number'] // Minimum required fields
);

/**
 * PGR (Post-Grant Review) Schema
 * Specialized schema for PGR proceedings
 */
export const PGRProceedingSchema = createSchema(
  'PGR Proceeding',
  {
    proceeding_number: {
      type: 'string',
      pattern: '^PGR\\d{4}-\\d{5}$',
      description: 'PGR proceeding number (e.g., PGR2023-00001)'
    },
    title: {
      type: 'string',
      description: 'Title of the PGR proceeding'
    },
    patent_number: {
      type: 'string',
      pattern: '^(US)?\\d{7,8}([A-Z]\\d?)?$',
      description: 'US Patent number under PGR (must be post-AIA)'
    },
    petitioner: {
      type: 'string',
      description: 'Party filing the PGR petition'
    },
    patent_owner: {
      type: 'string',
      description: 'Owner of the patent under review'
    },
    status: {
      type: 'string',
      description: 'Current status of the PGR proceeding'
    },
    filed_date: {
      ...CommonTypes.date,
      description: 'Date the PGR petition was filed'
    },
    decision_date: {
      ...CommonTypes.date,
      description: 'Date of final written decision'
    },
    snippet: {
      type: 'string',
      description: 'Excerpt from PGR documents'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to PGR proceeding page'
    },
    grounds_for_challenge: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'Novelty (35 USC 102)',
          'Obviousness (35 USC 103)',
          'Written Description (35 USC 112)',
          'Enablement (35 USC 112)',
          'Subject Matter Eligibility (35 USC 101)'
        ]
      },
      description: 'Legal grounds for PGR challenge (broader than IPR)'
    }
  },
  ['proceeding_number', 'patent_number'] // Minimum required fields
);

/**
 * CBM (Covered Business Method) Schema
 * Specialized schema for CBM proceedings
 */
export const CBMProceedingSchema = createSchema(
  'CBM Proceeding',
  {
    proceeding_number: {
      type: 'string',
      pattern: '^CBM\\d{4}-\\d{5}$',
      description: 'CBM proceeding number (e.g., CBM2023-00001)'
    },
    title: {
      type: 'string',
      description: 'Title of the CBM proceeding'
    },
    patent_number: {
      type: 'string',
      pattern: '^(US)?\\d{7,8}([A-Z]\\d?)?$',
      description: 'US Patent number under CBM review (business method patent)'
    },
    petitioner: {
      type: 'string',
      description: 'Party filing the CBM petition'
    },
    patent_owner: {
      type: 'string',
      description: 'Owner of the business method patent'
    },
    status: {
      type: 'string',
      description: 'Current status of the CBM proceeding'
    },
    filed_date: {
      ...CommonTypes.date,
      description: 'Date the CBM petition was filed'
    },
    decision_date: {
      ...CommonTypes.date,
      description: 'Date of final written decision'
    },
    snippet: {
      type: 'string',
      description: 'Excerpt from CBM documents'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to CBM proceeding page'
    },
    business_method_classification: {
      type: 'string',
      description: 'Classification of the business method patent'
    },
    technological_invention_determination: {
      type: 'string',
      enum: ['Technological Invention', 'Not Technological Invention', 'Undetermined'],
      description: 'Whether patent qualifies as technological invention (affects CBM eligibility)'
    }
  },
  ['proceeding_number', 'patent_number'] // Minimum required fields
);

/**
 * PTAB Decision Schema
 * Schema for PTAB decisions and orders
 */
export const PTABDecisionSchema = createSchema(
  'PTAB Decision',
  {
    decision_type: {
      type: 'string',
      enum: [
        'Institution Decision',
        'Final Written Decision',
        'Termination Order',
        'Denial of Institution',
        'Rehearing Decision',
        'Miscellaneous Order'
      ],
      description: 'Type of PTAB decision or order'
    },
    proceeding_number: {
      type: 'string',
      pattern: '^(IPR|PGR|CBM|DER)\\d{4}-\\d{5}$',
      description: 'Associated proceeding number'
    },
    decision_date: {
      ...CommonTypes.date,
      description: 'Date the decision was issued'
    },
    patent_number: {
      type: 'string',
      description: 'Patent number affected by decision'
    },
    decision_summary: {
      type: 'string',
      description: 'Summary of the decision'
    },
    claims_analysis: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claim_number: { type: 'string' },
          determination: {
            type: 'string',
            enum: ['Unpatentable', 'Patentable', 'Not Instituted']
          },
          reasoning: { type: 'string' }
        }
      },
      description: 'Claim-by-claim analysis from decision'
    },
    judges: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Panel of judges who issued the decision'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the decision document'
    }
  },
  ['decision_type', 'proceeding_number', 'decision_date'] // Minimum required fields
);

/**
 * Proceeding Type enum
 * Valid PTAB proceeding types
 */
export const ProceedingTypeEnum = ['IPR', 'PGR', 'CBM', 'DER', 'AIA'];

/**
 * Proceeding Status enum
 * Valid status values for PTAB proceedings
 */
export const ProceedingStatusEnum = [
  'Pending Review',
  'Trial Instituted',
  'Institution Denied',
  'Institution Decision',
  'Final Written Decision',
  'Settled',
  'Terminated',
  'Status unknown'
];

/**
 * Decision Outcome enum
 * Possible outcomes of PTAB final decisions
 */
export const DecisionOutcomeEnum = [
  'Claims Unpatentable',
  'Claims Patentable',
  'Partially Unpatentable',
  'Not Yet Decided',
  'Dismissed',
  'Not available'
];

/**
 * Proceeding Number type
 * Reusable type for PTAB proceeding numbers
 */
export const ProceedingNumberType = {
  type: 'string',
  pattern: '^(IPR|PGR|CBM|DER)\\d{4}-\\d{5}$',
  description: 'PTAB proceeding number (e.g., IPR2023-00123, PGR2024-00001)'
};

/**
 * Export all schemas
 */
export const PTABSchemas = {
  ptab_proceeding: PTABProceedingSchema,
  ptab_ipr_proceeding: IPRProceedingSchema,
  ptab_pgr_proceeding: PGRProceedingSchema,
  ptab_cbm_proceeding: CBMProceedingSchema,
  ptab_decision: PTABDecisionSchema
};

/**
 * Default export
 */
export default PTABSchemas;
