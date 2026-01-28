/**
 * EPASchemas.js
 * JSON Schema v7 definitions for EPA data types
 *
 * Covers:
 * - EPA facilities (ECHO database)
 * - Compliance reports and enforcement actions
 * - Violations and penalties
 * - Environmental permits
 */

import { CommonTypes, createSchema } from './BaseSchemas.js';

/**
 * EPA Facility Schema
 * Structured extraction from EPA ECHO facility data
 */
export const EPAFacilitySchema = createSchema(
  'EPA Facility',
  {
    registry_id: {
      type: 'string',
      description: 'EPA Facility Registry ID'
    },
    facility_name: {
      type: 'string',
      description: 'Name of the facility'
    },
    street_address: {
      type: 'string',
      description: 'Street address of the facility'
    },
    city: {
      type: 'string',
      description: 'City where facility is located'
    },
    state: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code'
    },
    zip_code: {
      type: 'string',
      pattern: '^\\d{5}(-\\d{4})?$',
      description: 'ZIP code (5 or 9 digits)'
    },
    latitude: {
      type: 'number',
      minimum: -90,
      maximum: 90,
      description: 'Latitude coordinate'
    },
    longitude: {
      type: 'number',
      minimum: -180,
      maximum: 180,
      description: 'Longitude coordinate'
    },
    sic_codes: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^\\d{4}$'
      },
      description: 'Standard Industrial Classification codes'
    },
    naics_codes: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^\\d{6}$'
      },
      description: 'North American Industry Classification System codes'
    },
    epa_region: {
      type: 'integer',
      minimum: 1,
      maximum: 10,
      description: 'EPA Region number (1-10)'
    },
    compliance_status: {
      type: 'string',
      enum: ['compliant', 'non-compliant', 'unknown'],
      description: 'Current compliance status'
    }
  },
  ['registry_id', 'facility_name'] // Minimum required fields
);

/**
 * EPA Compliance Report Schema
 * Structured extraction of facility compliance information
 */
export const EPAComplianceSchema = createSchema(
  'EPA Compliance Report',
  {
    registry_id: {
      type: 'string',
      description: 'EPA Facility Registry ID'
    },
    facility_name: {
      type: 'string',
      description: 'Name of the facility'
    },
    report_date: {
      ...CommonTypes.date,
      description: 'Date of the compliance report'
    },
    inspection_date: {
      ...CommonTypes.date,
      description: 'Most recent inspection date'
    },
    compliance_status: {
      type: 'string',
      enum: ['in_compliance', 'significant_violation', 'high_priority_violation', 'unknown'],
      description: 'Overall compliance status'
    },
    programs: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['CAA', 'CWA', 'RCRA', 'SDWA', 'FIFRA', 'TSCA']
      },
      description: 'EPA programs (Clean Air Act, Clean Water Act, etc.)'
    },
    violation_count: {
      type: 'integer',
      minimum: 0,
      description: 'Number of violations'
    },
    enforcement_actions: {
      type: 'integer',
      minimum: 0,
      description: 'Number of enforcement actions'
    },
    penalties_assessed: {
      ...CommonTypes.monetary,
      description: 'Total penalties assessed in dollars'
    },
    last_inspection_finding: {
      type: 'string',
      description: 'Finding from most recent inspection'
    }
  },
  ['registry_id', 'facility_name', 'compliance_status'] // Minimum required fields
);

/**
 * EPA Violation Schema
 * Structured extraction of environmental violations
 */
export const EPAViolationSchema = createSchema(
  'EPA Violation',
  {
    violation_id: {
      type: 'string',
      description: 'Unique violation identifier'
    },
    registry_id: {
      type: 'string',
      description: 'EPA Facility Registry ID'
    },
    facility_name: {
      type: 'string',
      description: 'Name of the facility'
    },
    violation_date: {
      ...CommonTypes.date,
      description: 'Date the violation occurred or was discovered'
    },
    violation_type: {
      type: 'string',
      enum: ['emission', 'discharge', 'waste_disposal', 'permit', 'reporting', 'other'],
      description: 'Type of violation'
    },
    program: {
      type: 'string',
      enum: ['CAA', 'CWA', 'RCRA', 'SDWA', 'FIFRA', 'TSCA', 'CERCLA', 'EPCRA'],
      description: 'EPA program under which violation occurred'
    },
    severity: {
      type: 'string',
      enum: ['high_priority', 'significant', 'minor', 'resolved'],
      description: 'Severity level of the violation'
    },
    description: {
      type: 'string',
      description: 'Description of the violation'
    },
    resolution_date: {
      ...CommonTypes.date,
      description: 'Date the violation was resolved'
    },
    penalty_amount: {
      ...CommonTypes.monetary,
      description: 'Penalty amount assessed'
    },
    enforcement_action: {
      type: 'string',
      description: 'Type of enforcement action taken'
    }
  },
  ['registry_id', 'facility_name', 'violation_type', 'program'] // Minimum required fields
);

/**
 * EPA Enforcement Action Schema
 * Structured extraction of EPA enforcement activities
 */
export const EPAEnforcementSchema = createSchema(
  'EPA Enforcement Action',
  {
    action_id: {
      type: 'string',
      description: 'Unique enforcement action identifier'
    },
    registry_id: {
      type: 'string',
      description: 'EPA Facility Registry ID'
    },
    facility_name: {
      type: 'string',
      description: 'Name of the facility'
    },
    action_date: {
      ...CommonTypes.date,
      description: 'Date of the enforcement action'
    },
    action_type: {
      type: 'string',
      enum: ['administrative', 'civil_judicial', 'criminal', 'notice_of_violation', 'consent_decree', 'other'],
      description: 'Type of enforcement action'
    },
    program: {
      type: 'string',
      enum: ['CAA', 'CWA', 'RCRA', 'SDWA', 'FIFRA', 'TSCA', 'CERCLA', 'EPCRA'],
      description: 'EPA program'
    },
    lead_agency: {
      type: 'string',
      enum: ['EPA', 'STATE', 'LOCAL'],
      description: 'Lead enforcement agency'
    },
    penalty_amount: {
      ...CommonTypes.monetary,
      description: 'Total penalty amount'
    },
    compliance_action_cost: {
      ...CommonTypes.monetary,
      description: 'Cost of compliance actions required'
    },
    settlement_date: {
      ...CommonTypes.date,
      description: 'Date of settlement if applicable'
    },
    description: {
      type: 'string',
      description: 'Description of the enforcement action'
    }
  },
  ['registry_id', 'facility_name', 'action_type', 'program'] // Minimum required fields
);

/**
 * Registry ID type
 * Reusable type for EPA Facility Registry IDs
 */
export const RegistryIDType = {
  type: 'string',
  description: 'EPA Facility Registry ID'
};

/**
 * EPA Program enum
 * Common EPA environmental programs
 */
export const EPAProgramEnum = [
  'CAA',     // Clean Air Act
  'CWA',     // Clean Water Act
  'RCRA',    // Resource Conservation and Recovery Act
  'SDWA',    // Safe Drinking Water Act
  'FIFRA',   // Federal Insecticide, Fungicide, and Rodenticide Act
  'TSCA',    // Toxic Substances Control Act
  'CERCLA',  // Comprehensive Environmental Response, Compensation, and Liability Act (Superfund)
  'EPCRA'    // Emergency Planning and Community Right-to-Know Act
];

/**
 * Compliance Status enum
 * Standard compliance status values
 */
export const ComplianceStatusEnum = [
  'in_compliance',
  'significant_violation',
  'high_priority_violation',
  'resolved',
  'unknown'
];

/**
 * Export all schemas
 */
export const EPASchemas = {
  epa_facility: EPAFacilitySchema,
  epa_compliance: EPAComplianceSchema,
  epa_violation: EPAViolationSchema,
  epa_enforcement: EPAEnforcementSchema
};

/**
 * Default export
 */
export default EPASchemas;
