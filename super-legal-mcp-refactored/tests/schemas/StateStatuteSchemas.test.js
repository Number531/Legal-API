/**
 * StateStatuteSchemas.test.js
 * Comprehensive unit tests for State Statute JSON schemas
 */

import { describe, it, expect } from '@jest/globals';
import {
  StateStatuteSchema,
  StateBillSchema,
  StateRegulationSchema,
  StateResolutionSchema,
  StateStatuteSchemas,
  StateCodeType,
  BillTypeEnum,
  BillStatusEnum,
  RegulationTypeEnum,
  ResolutionTypeEnum
} from '../../src/api-clients/schemas/StateStatuteSchemas.js';

describe('StateStatuteSchemas', () => {
  // ===== StateStatuteSchema Tests =====
  describe('StateStatuteSchema', () => {
    it('should have correct schema structure', () => {
      expect(StateStatuteSchema).toBeDefined();
      expect(StateStatuteSchema.type).toBe('object');
      expect(StateStatuteSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(StateStatuteSchema.required).toEqual(['title', 'state']);
    });

    it('should validate state code pattern', () => {
      const stateProperty = StateStatuteSchema.properties.state;
      expect(stateProperty.type).toBe('string');
      expect(stateProperty.pattern).toBe('^[A-Z]{2}$');
    });

    it('should have amendments array structure', () => {
      const amendmentsProperty = StateStatuteSchema.properties.amendments;
      expect(amendmentsProperty.type).toBe('array');
      expect(amendmentsProperty.items.type).toBe('object');
      expect(amendmentsProperty.items.properties.year).toBeDefined();
      expect(amendmentsProperty.items.properties.description).toBeDefined();
    });

    it('should have related_sections array', () => {
      const relatedProperty = StateStatuteSchema.properties.related_sections;
      expect(relatedProperty.type).toBe('array');
      expect(relatedProperty.items.type).toBe('string');
    });

    it('should have all expected properties', () => {
      const properties = StateStatuteSchema.properties;
      expect(properties.title).toBeDefined();
      expect(properties.state).toBeDefined();
      expect(properties.citation).toBeDefined();
      expect(properties.section_number).toBeDefined();
      expect(properties.subject_area).toBeDefined();
      expect(properties.code_title).toBeDefined();
      expect(properties.effective_date).toBeDefined();
      expect(properties.summary).toBeDefined();
      expect(properties.full_text).toBeDefined();
      expect(properties.related_sections).toBeDefined();
      expect(properties.amendments).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== StateBillSchema Tests =====
  describe('StateBillSchema', () => {
    it('should have correct schema structure', () => {
      expect(StateBillSchema).toBeDefined();
      expect(StateBillSchema.type).toBe('object');
      expect(StateBillSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(StateBillSchema.required).toEqual(['title', 'state', 'bill_number']);
    });

    it('should have bill_type enum', () => {
      const billTypeProperty = StateBillSchema.properties.bill_type;
      expect(billTypeProperty.enum).toEqual([
        'Assembly Bill', 'Senate Bill', 'House Bill',
        'Joint Resolution', 'Concurrent Resolution', 'Other'
      ]);
    });

    it('should have status enum', () => {
      const statusProperty = StateBillSchema.properties.status;
      expect(statusProperty.enum).toEqual([
        'Introduced', 'In Committee', 'Passed House', 'Passed Senate',
        'Enrolled', 'Signed', 'Vetoed', 'Failed', 'Other'
      ]);
    });

    it('should have session_year with range validation', () => {
      const sessionYearProperty = StateBillSchema.properties.session_year;
      expect(sessionYearProperty.type).toBe('integer');
      expect(sessionYearProperty.minimum).toBe(1900);
      expect(sessionYearProperty.maximum).toBe(2100);
    });

    it('should have cosponsors array', () => {
      const cosponsorsProperty = StateBillSchema.properties.cosponsors;
      expect(cosponsorsProperty.type).toBe('array');
      expect(cosponsorsProperty.items.type).toBe('string');
    });

    it('should have all expected properties', () => {
      const properties = StateBillSchema.properties;
      expect(properties.title).toBeDefined();
      expect(properties.state).toBeDefined();
      expect(properties.bill_number).toBeDefined();
      expect(properties.bill_type).toBeDefined();
      expect(properties.status).toBeDefined();
      expect(properties.sponsor).toBeDefined();
      expect(properties.cosponsors).toBeDefined();
      expect(properties.session_year).toBeDefined();
      expect(properties.introduced_date).toBeDefined();
      expect(properties.summary).toBeDefined();
      expect(properties.subject_area).toBeDefined();
      expect(properties.fiscal_impact).toBeDefined();
      expect(properties.committee).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== StateRegulationSchema Tests =====
  describe('StateRegulationSchema', () => {
    it('should have correct schema structure', () => {
      expect(StateRegulationSchema).toBeDefined();
      expect(StateRegulationSchema.type).toBe('object');
      expect(StateRegulationSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(StateRegulationSchema.required).toEqual(['title', 'state', 'agency']);
    });

    it('should have regulation_type enum', () => {
      const regulationTypeProperty = StateRegulationSchema.properties.regulation_type;
      expect(regulationTypeProperty.enum).toEqual([
        'Proposed', 'Final', 'Emergency', 'Temporary', 'Permanent'
      ]);
    });

    it('should have comment_period object structure', () => {
      const commentPeriodProperty = StateRegulationSchema.properties.comment_period;
      expect(commentPeriodProperty.type).toBe('object');
      expect(commentPeriodProperty.properties.start_date).toBeDefined();
      expect(commentPeriodProperty.properties.end_date).toBeDefined();
    });

    it('should have all expected properties', () => {
      const properties = StateRegulationSchema.properties;
      expect(properties.title).toBeDefined();
      expect(properties.state).toBeDefined();
      expect(properties.regulation_number).toBeDefined();
      expect(properties.agency).toBeDefined();
      expect(properties.regulation_type).toBeDefined();
      expect(properties.subject_area).toBeDefined();
      expect(properties.effective_date).toBeDefined();
      expect(properties.adoption_date).toBeDefined();
      expect(properties.comment_period).toBeDefined();
      expect(properties.summary).toBeDefined();
      expect(properties.statutory_authority).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== StateResolutionSchema Tests =====
  describe('StateResolutionSchema', () => {
    it('should have correct schema structure', () => {
      expect(StateResolutionSchema).toBeDefined();
      expect(StateResolutionSchema.type).toBe('object');
      expect(StateResolutionSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(StateResolutionSchema.required).toEqual(['title', 'state', 'resolution_number']);
    });

    it('should have resolution_type enum', () => {
      const resolutionTypeProperty = StateResolutionSchema.properties.resolution_type;
      expect(resolutionTypeProperty.enum).toEqual([
        'Joint Resolution', 'Concurrent Resolution', 'House Resolution',
        'Senate Resolution', 'Simple Resolution', 'Other'
      ]);
    });

    it('should have status enum', () => {
      const statusProperty = StateResolutionSchema.properties.status;
      expect(statusProperty.enum).toEqual([
        'Introduced', 'Adopted', 'Failed', 'Pending', 'Other'
      ]);
    });

    it('should have session_year with range validation', () => {
      const sessionYearProperty = StateResolutionSchema.properties.session_year;
      expect(sessionYearProperty.type).toBe('integer');
      expect(sessionYearProperty.minimum).toBe(1900);
      expect(sessionYearProperty.maximum).toBe(2100);
    });

    it('should have all expected properties', () => {
      const properties = StateResolutionSchema.properties;
      expect(properties.title).toBeDefined();
      expect(properties.state).toBeDefined();
      expect(properties.resolution_number).toBeDefined();
      expect(properties.resolution_type).toBeDefined();
      expect(properties.sponsor).toBeDefined();
      expect(properties.session_year).toBeDefined();
      expect(properties.introduced_date).toBeDefined();
      expect(properties.adopted_date).toBeDefined();
      expect(properties.status).toBeDefined();
      expect(properties.purpose).toBeDefined();
      expect(properties.summary).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== Type and Enum Tests =====
  describe('StateCodeType', () => {
    it('should have correct pattern for two-letter state codes', () => {
      expect(StateCodeType.type).toBe('string');
      expect(StateCodeType.pattern).toBe('^[A-Z]{2}$');
    });
  });

  describe('BillTypeEnum', () => {
    it('should contain all valid bill types', () => {
      expect(BillTypeEnum).toEqual([
        'Assembly Bill', 'Senate Bill', 'House Bill',
        'Joint Resolution', 'Concurrent Resolution', 'Other'
      ]);
    });
  });

  describe('BillStatusEnum', () => {
    it('should contain all valid bill statuses', () => {
      expect(BillStatusEnum).toEqual([
        'Introduced', 'In Committee', 'Passed House', 'Passed Senate',
        'Enrolled', 'Signed', 'Vetoed', 'Failed', 'Other'
      ]);
    });
  });

  describe('RegulationTypeEnum', () => {
    it('should contain all valid regulation types', () => {
      expect(RegulationTypeEnum).toEqual([
        'Proposed', 'Final', 'Emergency', 'Temporary', 'Permanent'
      ]);
    });
  });

  describe('ResolutionTypeEnum', () => {
    it('should contain all valid resolution types', () => {
      expect(ResolutionTypeEnum).toEqual([
        'Joint Resolution', 'Concurrent Resolution', 'House Resolution',
        'Senate Resolution', 'Simple Resolution', 'Other'
      ]);
    });
  });

  // ===== Export Tests =====
  describe('StateStatuteSchemas Export', () => {
    it('should export all schemas in StateStatuteSchemas object', () => {
      expect(StateStatuteSchemas).toBeDefined();
      expect(StateStatuteSchemas.state_statute).toBe(StateStatuteSchema);
      expect(StateStatuteSchemas.state_bill).toBe(StateBillSchema);
      expect(StateStatuteSchemas.state_regulation).toBe(StateRegulationSchema);
      expect(StateStatuteSchemas.state_resolution).toBe(StateResolutionSchema);
    });

    it('should have exactly 4 schemas', () => {
      const schemaKeys = Object.keys(StateStatuteSchemas);
      expect(schemaKeys.length).toBe(4);
    });
  });

  // ===== Schema Compatibility Tests =====
  describe('Schema Compatibility', () => {
    it('all schemas should have $schema property', () => {
      expect(StateStatuteSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(StateBillSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(StateRegulationSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(StateResolutionSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
    });
  });

  // ===== Property Description Tests =====
  describe('Property Descriptions', () => {
    it('StateStatuteSchema properties should have descriptions', () => {
      const properties = StateStatuteSchema.properties;
      expect(properties.title.description).toBeDefined();
      expect(properties.state.description).toBeDefined();
      expect(properties.citation.description).toBeDefined();
      expect(properties.subject_area.description).toBeDefined();
    });

    it('StateBillSchema properties should have descriptions', () => {
      const properties = StateBillSchema.properties;
      expect(properties.title.description).toBeDefined();
      expect(properties.state.description).toBeDefined();
      expect(properties.bill_number.description).toBeDefined();
      expect(properties.status.description).toBeDefined();
    });

    it('StateRegulationSchema properties should have descriptions', () => {
      const properties = StateRegulationSchema.properties;
      expect(properties.title.description).toBeDefined();
      expect(properties.state.description).toBeDefined();
      expect(properties.agency.description).toBeDefined();
      expect(properties.regulation_type.description).toBeDefined();
    });

    it('StateResolutionSchema properties should have descriptions', () => {
      const properties = StateResolutionSchema.properties;
      expect(properties.title.description).toBeDefined();
      expect(properties.state.description).toBeDefined();
      expect(properties.resolution_number.description).toBeDefined();
      expect(properties.status.description).toBeDefined();
    });
  });
});
