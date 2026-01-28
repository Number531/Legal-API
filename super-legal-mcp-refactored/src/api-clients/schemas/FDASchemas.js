/**
 * FDASchemas.js
 * JSON Schema v7 definitions for FDA data types
 *
 * Covers:
 * - Drug adverse events (FAERS)
 * - Medical device events (MAUDE)
 * - Drug labeling (SPL)
 * - Recalls and enforcement actions
 */

import { CommonTypes, createSchema } from './BaseSchemas.js';

/**
 * Drug Adverse Event Schema (FAERS data)
 * Structured extraction from FDA adverse event reports
 */
export const DrugAdverseEventSchema = createSchema(
  'FDA Drug Adverse Event',
  {
    report_id: {
      type: 'string',
      description: 'Unique identifier for the adverse event report'
    },
    drug_name: {
      type: 'string',
      description: 'Name of the drug (medicinal product)'
    },
    active_ingredient: {
      type: 'string',
      description: 'Active substance or ingredient'
    },
    serious: {
      type: 'boolean',
      description: 'Whether the adverse event is classified as serious'
    },
    report_date: {
      ...CommonTypes.date,
      description: 'Date the report was received by FDA'
    },
    patient_reaction: {
      type: 'string',
      description: 'Description of the adverse reaction or event'
    },
    outcome: {
      type: 'string',
      enum: ['death', 'hospitalization', 'life-threatening', 'disability', 'required-intervention', 'other'],
      description: 'Outcome of the adverse event'
    },
    manufacturer: {
      type: 'string',
      description: 'Drug manufacturer name'
    }
  },
  ['drug_name', 'patient_reaction'] // Minimum required fields
);

/**
 * Medical Device Event Schema (MAUDE data)
 * Structured extraction from FDA device adverse event reports
 */
export const DeviceEventSchema = createSchema(
  'FDA Device Event',
  {
    report_id: {
      type: 'string',
      description: 'Unique identifier for the device event report'
    },
    device_brand_name: {
      type: 'string',
      description: 'Brand name of the medical device'
    },
    device_generic_name: {
      type: 'string',
      description: 'Generic name or type of device'
    },
    manufacturer: {
      type: 'string',
      description: 'Device manufacturer name'
    },
    event_date: {
      ...CommonTypes.date,
      description: 'Date of the device event'
    },
    event_type: {
      type: 'string',
      description: 'Type of device event (malfunction, injury, death, etc.)'
    },
    event_description: {
      type: 'string',
      description: 'Description of the device event'
    },
    device_problem: {
      type: 'string',
      description: 'Specific device problem or malfunction'
    }
  },
  ['device_generic_name', 'event_description'] // Minimum required fields
);

/**
 * Drug Label Schema (SPL data)
 * Structured extraction from FDA drug labeling and prescribing information
 */
export const DrugLabelSchema = createSchema(
  'FDA Drug Label',
  {
    brand_name: {
      type: 'string',
      description: 'Brand name of the drug product'
    },
    generic_name: {
      type: 'string',
      description: 'Generic name of the drug'
    },
    active_ingredient: {
      type: 'string',
      description: 'Active pharmaceutical ingredient'
    },
    manufacturer: {
      type: 'string',
      description: 'Drug manufacturer name'
    },
    indications: {
      type: 'string',
      description: 'Approved indications and usage'
    },
    warnings: {
      type: 'string',
      description: 'Warnings, precautions, and contraindications'
    },
    dosage: {
      type: 'string',
      description: 'Dosage and administration information'
    },
    ndc_code: {
      type: 'string',
      pattern: '^\\d{4,5}-\\d{3,4}-\\d{1,2}$',
      description: 'National Drug Code (NDC)'
    },
    approval_date: {
      ...CommonTypes.date,
      description: 'FDA approval date'
    }
  },
  ['brand_name', 'active_ingredient'] // Minimum required fields
);

/**
 * Recall Schema
 * Structured extraction from FDA enforcement reports (drug/device/food recalls)
 */
export const RecallSchema = createSchema(
  'FDA Recall',
  {
    recall_number: {
      type: 'string',
      description: 'Unique recall identification number'
    },
    product_description: {
      type: 'string',
      description: 'Description of the recalled product'
    },
    product_type: {
      type: 'string',
      enum: ['drug', 'device', 'food', 'biologics', 'cosmetics'],
      description: 'Type of product recalled'
    },
    reason_for_recall: {
      type: 'string',
      description: 'Reason for the recall'
    },
    classification: {
      type: 'string',
      enum: ['Class I', 'Class II', 'Class III'],
      description: 'FDA recall classification (Class I = most serious)'
    },
    status: {
      type: 'string',
      enum: ['ongoing', 'completed', 'terminated'],
      description: 'Current status of the recall'
    },
    recalling_firm: {
      type: 'string',
      description: 'Name of the firm initiating the recall'
    },
    recall_initiation_date: {
      ...CommonTypes.date,
      description: 'Date the recall was initiated'
    },
    distribution_pattern: {
      type: 'string',
      description: 'Geographic distribution of the recalled product'
    },
    quantity: {
      type: 'string',
      description: 'Quantity of product being recalled'
    }
  },
  ['product_description', 'reason_for_recall', 'classification'] // Minimum required fields
);

/**
 * NDC (National Drug Code) type
 * Reusable type for NDC validation
 */
export const NDCType = {
  type: 'string',
  pattern: '^\\d{4,5}-\\d{3,4}-\\d{1,2}$',
  description: 'National Drug Code in format: labeler-product-package'
};

/**
 * Recall Classification type
 * Reusable enum for recall severity
 */
export const RecallClassificationType = {
  type: 'string',
  enum: ['Class I', 'Class II', 'Class III'],
  description: 'FDA recall classification: Class I (most serious) to Class III (least serious)'
};

/**
 * Export all schemas
 */
export const FDASchemas = {
  fda_adverse_event: DrugAdverseEventSchema,
  fda_device_event: DeviceEventSchema,
  fda_drug_label: DrugLabelSchema,
  fda_recall: RecallSchema
};

/**
 * Default export
 */
export default FDASchemas;
