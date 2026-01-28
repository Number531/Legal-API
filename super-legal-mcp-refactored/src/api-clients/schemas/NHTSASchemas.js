/**
 * NHTSASchemas.js
 * JSON Schema v7 definitions for NHTSA (National Highway Traffic Safety Administration) data types
 *
 * Covers:
 * - VIN decoding and vehicle information
 * - Vehicle recalls
 * - Consumer complaints and defect reports
 * - Safety ratings and crash test data
 * - Defect investigations
 */

import { CommonTypes, createSchema } from './BaseSchemas.js';

/**
 * NHTSA VIN Decode Schema
 * Structured extraction for VIN decoding and vehicle information
 */
export const NHTSAVinDecodeSchema = createSchema(
  'NHTSA VIN Decode',
  {
    vin: {
      type: 'string',
      pattern: '^[A-HJ-NPR-Z0-9]{17}$',
      description: 'Vehicle Identification Number (17 characters)'
    },
    make: {
      type: 'string',
      description: 'Vehicle manufacturer'
    },
    model: {
      type: 'string',
      description: 'Vehicle model'
    },
    model_year: {
      type: 'integer',
      minimum: 1900,
      maximum: 2100,
      description: 'Model year of the vehicle'
    },
    body_class: {
      type: 'string',
      description: 'Body class (sedan, SUV, truck, etc.)'
    },
    engine_type: {
      type: 'string',
      description: 'Engine type and specifications'
    },
    transmission: {
      type: 'string',
      description: 'Transmission type'
    },
    drive_type: {
      type: 'string',
      enum: ['FWD', 'RWD', 'AWD', '4WD', 'Unknown'],
      description: 'Drive type'
    },
    fuel_type: {
      type: 'string',
      description: 'Primary fuel type'
    },
    manufacturer_name: {
      type: 'string',
      description: 'Full manufacturer name'
    },
    plant_country: {
      type: 'string',
      description: 'Country where vehicle was manufactured'
    },
    vehicle_type: {
      type: 'string',
      description: 'Vehicle type classification'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the VIN decode information'
    }
  },
  ['vin', 'make', 'model'] // Minimum required fields
);

/**
 * NHTSA Vehicle Model Schema
 * Structured extraction for vehicle model information
 */
export const NHTSAVehicleModelSchema = createSchema(
  'NHTSA Vehicle Model',
  {
    make: {
      type: 'string',
      description: 'Vehicle manufacturer'
    },
    model: {
      type: 'string',
      description: 'Vehicle model name'
    },
    year: {
      type: 'integer',
      minimum: 1900,
      maximum: 2100,
      description: 'Model year'
    },
    body_styles: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Available body styles for this model'
    },
    trim_levels: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Available trim levels'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to model information'
    }
  },
  ['make', 'model'] // Minimum required fields
);

/**
 * NHTSA Recall Schema
 * Structured extraction for vehicle recalls
 */
export const NHTSARecallSchema = createSchema(
  'NHTSA Recall',
  {
    campaign_id: {
      type: 'string',
      pattern: '^\\d{2,4}[VET]-?\\d{3,4}$',
      description: 'NHTSA campaign ID (e.g., 23V-456, 24E-123)'
    },
    recall_number: {
      type: 'string',
      description: 'Recall number or campaign number'
    },
    manufacturer: {
      type: 'string',
      description: 'Vehicle manufacturer'
    },
    make: {
      type: 'string',
      description: 'Vehicle make'
    },
    model: {
      type: 'string',
      description: 'Vehicle model'
    },
    model_year: {
      type: 'integer',
      minimum: 1900,
      maximum: 2100,
      description: 'Model year affected'
    },
    component: {
      type: 'string',
      description: 'Component or system affected'
    },
    summary: {
      type: 'string',
      description: 'Summary of the recall'
    },
    consequence: {
      type: 'string',
      description: 'Potential consequences of the defect'
    },
    remedy: {
      type: 'string',
      description: 'Remedy or corrective action'
    },
    recall_date: {
      ...CommonTypes.date,
      description: 'Date the recall was announced'
    },
    units_affected: {
      type: 'string',
      description: 'Number of units potentially affected'
    },
    recall_type: {
      type: 'string',
      enum: ['Safety', 'Compliance', 'Equipment', 'Tire'],
      description: 'Type of recall'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the recall announcement'
    }
  },
  ['campaign_id', 'manufacturer', 'summary'] // Minimum required fields
);

/**
 * NHTSA Complaint Schema
 * Structured extraction for consumer complaints and defect reports
 */
export const NHTSAComplaintSchema = createSchema(
  'NHTSA Complaint',
  {
    odi_number: {
      type: 'string',
      description: 'ODI (Office of Defects Investigation) number'
    },
    make: {
      type: 'string',
      description: 'Vehicle make'
    },
    model: {
      type: 'string',
      description: 'Vehicle model'
    },
    model_year: {
      type: 'integer',
      minimum: 1900,
      maximum: 2100,
      description: 'Model year'
    },
    component: {
      type: 'string',
      description: 'Component or system involved'
    },
    complaint_type: {
      type: 'string',
      enum: ['Crash', 'Fire', 'Injury', 'Property Damage', 'Other'],
      description: 'Type of complaint'
    },
    summary: {
      type: 'string',
      description: 'Summary of the complaint'
    },
    crash_indicator: {
      type: 'boolean',
      description: 'Whether a crash occurred'
    },
    fire_indicator: {
      type: 'boolean',
      description: 'Whether a fire occurred'
    },
    injury_count: {
      type: 'integer',
      minimum: 0,
      description: 'Number of injuries reported'
    },
    date_of_incident: {
      ...CommonTypes.date,
      description: 'Date of the incident'
    },
    mileage: {
      type: 'string',
      description: 'Vehicle mileage at time of incident'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the complaint details'
    }
  },
  ['make', 'model', 'summary'] // Minimum required fields
);

/**
 * NHTSA Safety Rating Schema
 * Structured extraction for NCAP safety ratings and crash test data
 */
export const NHTSASafetyRatingSchema = createSchema(
  'NHTSA Safety Rating',
  {
    make: {
      type: 'string',
      description: 'Vehicle make'
    },
    model: {
      type: 'string',
      description: 'Vehicle model'
    },
    model_year: {
      type: 'integer',
      minimum: 1900,
      maximum: 2100,
      description: 'Model year'
    },
    overall_rating: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Overall safety rating (1-5 stars)'
    },
    frontal_crash_rating: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Frontal crash test rating'
    },
    side_crash_rating: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Side crash test rating'
    },
    rollover_rating: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Rollover resistance rating'
    },
    frontal_driver_rating: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Frontal crash driver side rating'
    },
    frontal_passenger_rating: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Frontal crash passenger side rating'
    },
    side_driver_rating: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Side crash driver side rating'
    },
    side_passenger_rating: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Side crash passenger side rating'
    },
    test_year: {
      type: 'integer',
      description: 'Year the safety tests were conducted'
    },
    body_type: {
      type: 'string',
      description: 'Body type tested'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the safety rating details'
    }
  },
  ['make', 'model', 'overall_rating'] // Minimum required fields
);

/**
 * NHTSA Investigation Schema
 * Structured extraction for defect investigations
 */
export const NHTSAInvestigationSchema = createSchema(
  'NHTSA Investigation',
  {
    investigation_id: {
      type: 'string',
      pattern: '^[A-Z]{2}\\d{2}-\\d{3}$',
      description: 'Investigation ID (e.g., PE23-001, EA22-005)'
    },
    investigation_type: {
      type: 'string',
      enum: ['Preliminary Evaluation', 'Engineering Analysis', 'Recall Query', 'Defect Petition'],
      description: 'Type of investigation'
    },
    make: {
      type: 'string',
      description: 'Vehicle make under investigation'
    },
    model: {
      type: 'string',
      description: 'Vehicle model under investigation'
    },
    model_years: {
      type: 'array',
      items: {
        type: 'integer'
      },
      description: 'Model years affected'
    },
    component: {
      type: 'string',
      description: 'Component or system under investigation'
    },
    summary: {
      type: 'string',
      description: 'Summary of the investigation'
    },
    alleged_defect: {
      type: 'string',
      description: 'Description of the alleged defect'
    },
    incidents: {
      type: 'integer',
      minimum: 0,
      description: 'Number of incidents reported'
    },
    injuries: {
      type: 'integer',
      minimum: 0,
      description: 'Number of injuries reported'
    },
    deaths: {
      type: 'integer',
      minimum: 0,
      description: 'Number of deaths reported'
    },
    open_date: {
      ...CommonTypes.date,
      description: 'Date investigation was opened'
    },
    close_date: {
      ...CommonTypes.date,
      description: 'Date investigation was closed'
    },
    status: {
      type: 'string',
      enum: ['Open', 'Closed - Action', 'Closed - No Action', 'Upgraded'],
      description: 'Investigation status'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to investigation details'
    }
  },
  ['investigation_id', 'investigation_type', 'summary'] // Minimum required fields
);

/**
 * Campaign ID type
 * Reusable type for NHTSA campaign IDs
 */
export const CampaignIDType = {
  type: 'string',
  pattern: '^\\d{2,4}[VET]-?\\d{3,4}$',
  description: 'NHTSA campaign ID (e.g., 23V-456, 24E-123, 2023V-7041)'
};

/**
 * VIN type
 * Reusable type for Vehicle Identification Numbers
 */
export const VINType = {
  type: 'string',
  pattern: '^[A-HJ-NPR-Z0-9]{17}$',
  description: 'Vehicle Identification Number (17 characters, excludes I, O, Q)'
};

/**
 * Recall Type enum
 * Valid NHTSA recall types
 */
export const RecallTypeEnum = ['Safety', 'Compliance', 'Equipment', 'Tire'];

/**
 * Investigation Type enum
 * Valid NHTSA investigation types
 */
export const InvestigationTypeEnum = [
  'Preliminary Evaluation',
  'Engineering Analysis',
  'Recall Query',
  'Defect Petition'
];

/**
 * Complaint Type enum
 * Valid complaint classifications
 */
export const ComplaintTypeEnum = [
  'Crash',
  'Fire',
  'Injury',
  'Property Damage',
  'Other'
];

/**
 * Export all schemas
 */
export const NHTSASchemas = {
  nhtsa_vin_decode: NHTSAVinDecodeSchema,
  nhtsa_vehicle_model: NHTSAVehicleModelSchema,
  nhtsa_recall: NHTSARecallSchema,
  nhtsa_complaint: NHTSAComplaintSchema,
  nhtsa_safety_rating: NHTSASafetyRatingSchema,
  nhtsa_investigation: NHTSAInvestigationSchema
};

/**
 * Default export
 */
export default NHTSASchemas;
