/**
 * EPASchemas.test.js
 * Unit tests for EPA schema definitions
 */

import { strict as assert } from 'assert';
import {
  EPAFacilitySchema,
  EPAComplianceSchema,
  EPAViolationSchema,
  EPAEnforcementSchema,
  EPASchemas,
  RegistryIDType,
  EPAProgramEnum,
  ComplianceStatusEnum
} from '../../src/api-clients/schemas/EPASchemas.js';

describe('EPASchemas', () => {
  describe('EPAFacilitySchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(EPAFacilitySchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(EPAFacilitySchema.type, 'object');
      assert.strictEqual(EPAFacilitySchema.title, 'EPA Facility');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(EPAFacilitySchema.required));
      assert.ok(EPAFacilitySchema.required.includes('registry_id'));
      assert.ok(EPAFacilitySchema.required.includes('facility_name'));
    });

    it('should have key properties', () => {
      const props = EPAFacilitySchema.properties;
      assert.ok(props.registry_id);
      assert.ok(props.facility_name);
      assert.ok(props.street_address);
      assert.ok(props.city);
      assert.ok(props.state);
      assert.ok(props.zip_code);
      assert.ok(props.latitude);
      assert.ok(props.longitude);
      assert.ok(props.sic_codes);
      assert.ok(props.naics_codes);
      assert.ok(props.epa_region);
      assert.ok(props.compliance_status);
    });

    it('should have state pattern validation', () => {
      const state = EPAFacilitySchema.properties.state;
      assert.strictEqual(state.type, 'string');
      assert.ok(state.pattern.includes('[A-Z]{2}'));
    });

    it('should have zip_code pattern validation', () => {
      const zip = EPAFacilitySchema.properties.zip_code;
      assert.strictEqual(zip.type, 'string');
      assert.ok(zip.pattern);
    });

    it('should have coordinate bounds', () => {
      const lat = EPAFacilitySchema.properties.latitude;
      const lon = EPAFacilitySchema.properties.longitude;
      assert.strictEqual(lat.minimum, -90);
      assert.strictEqual(lat.maximum, 90);
      assert.strictEqual(lon.minimum, -180);
      assert.strictEqual(lon.maximum, 180);
    });

    it('should have array types for codes', () => {
      const sic = EPAFacilitySchema.properties.sic_codes;
      const naics = EPAFacilitySchema.properties.naics_codes;
      assert.strictEqual(sic.type, 'array');
      assert.strictEqual(naics.type, 'array');
      assert.ok(sic.items.pattern);
      assert.ok(naics.items.pattern);
    });

    it('should have epa_region bounds', () => {
      const region = EPAFacilitySchema.properties.epa_region;
      assert.strictEqual(region.type, 'integer');
      assert.strictEqual(region.minimum, 1);
      assert.strictEqual(region.maximum, 10);
    });

    it('should have compliance_status enum', () => {
      const status = EPAFacilitySchema.properties.compliance_status;
      assert.strictEqual(status.type, 'string');
      assert.ok(Array.isArray(status.enum));
      assert.ok(status.enum.includes('compliant'));
      assert.ok(status.enum.includes('non-compliant'));
    });
  });

  describe('EPAComplianceSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(EPAComplianceSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(EPAComplianceSchema.type, 'object');
      assert.strictEqual(EPAComplianceSchema.title, 'EPA Compliance Report');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(EPAComplianceSchema.required));
      assert.ok(EPAComplianceSchema.required.includes('registry_id'));
      assert.ok(EPAComplianceSchema.required.includes('facility_name'));
      assert.ok(EPAComplianceSchema.required.includes('compliance_status'));
    });

    it('should have key compliance properties', () => {
      const props = EPAComplianceSchema.properties;
      assert.ok(props.registry_id);
      assert.ok(props.facility_name);
      assert.ok(props.report_date);
      assert.ok(props.inspection_date);
      assert.ok(props.compliance_status);
      assert.ok(props.programs);
      assert.ok(props.violation_count);
      assert.ok(props.enforcement_actions);
      assert.ok(props.penalties_assessed);
    });

    it('should have programs array with enum items', () => {
      const programs = EPAComplianceSchema.properties.programs;
      assert.strictEqual(programs.type, 'array');
      assert.ok(Array.isArray(programs.items.enum));
      assert.ok(programs.items.enum.includes('CAA'));
      assert.ok(programs.items.enum.includes('CWA'));
      assert.ok(programs.items.enum.includes('RCRA'));
    });

    it('should have count properties as integers', () => {
      const violations = EPAComplianceSchema.properties.violation_count;
      const actions = EPAComplianceSchema.properties.enforcement_actions;
      assert.strictEqual(violations.type, 'integer');
      assert.strictEqual(actions.type, 'integer');
      assert.ok(violations.minimum !== undefined);
      assert.ok(actions.minimum !== undefined);
    });

    it('should have monetary type for penalties', () => {
      const penalties = EPAComplianceSchema.properties.penalties_assessed;
      assert.strictEqual(penalties.type, 'number');
      assert.ok(penalties.minimum !== undefined);
    });
  });

  describe('EPAViolationSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(EPAViolationSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(EPAViolationSchema.type, 'object');
      assert.strictEqual(EPAViolationSchema.title, 'EPA Violation');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(EPAViolationSchema.required));
      assert.ok(EPAViolationSchema.required.includes('registry_id'));
      assert.ok(EPAViolationSchema.required.includes('facility_name'));
      assert.ok(EPAViolationSchema.required.includes('violation_type'));
      assert.ok(EPAViolationSchema.required.includes('program'));
    });

    it('should have key violation properties', () => {
      const props = EPAViolationSchema.properties;
      assert.ok(props.violation_id);
      assert.ok(props.registry_id);
      assert.ok(props.facility_name);
      assert.ok(props.violation_date);
      assert.ok(props.violation_type);
      assert.ok(props.program);
      assert.ok(props.severity);
      assert.ok(props.description);
      assert.ok(props.resolution_date);
      assert.ok(props.penalty_amount);
    });

    it('should have violation_type enum', () => {
      const type = EPAViolationSchema.properties.violation_type;
      assert.strictEqual(type.type, 'string');
      assert.ok(Array.isArray(type.enum));
      assert.ok(type.enum.includes('emission'));
      assert.ok(type.enum.includes('discharge'));
      assert.ok(type.enum.includes('waste_disposal'));
    });

    it('should have severity enum', () => {
      const severity = EPAViolationSchema.properties.severity;
      assert.strictEqual(severity.type, 'string');
      assert.ok(Array.isArray(severity.enum));
      assert.ok(severity.enum.includes('high_priority'));
      assert.ok(severity.enum.includes('significant'));
      assert.ok(severity.enum.includes('minor'));
    });

    it('should have program enum', () => {
      const program = EPAViolationSchema.properties.program;
      assert.strictEqual(program.type, 'string');
      assert.ok(Array.isArray(program.enum));
      assert.ok(program.enum.includes('CAA'));
      assert.ok(program.enum.includes('CWA'));
    });
  });

  describe('EPAEnforcementSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(EPAEnforcementSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(EPAEnforcementSchema.type, 'object');
      assert.strictEqual(EPAEnforcementSchema.title, 'EPA Enforcement Action');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(EPAEnforcementSchema.required));
      assert.ok(EPAEnforcementSchema.required.includes('registry_id'));
      assert.ok(EPAEnforcementSchema.required.includes('facility_name'));
      assert.ok(EPAEnforcementSchema.required.includes('action_type'));
      assert.ok(EPAEnforcementSchema.required.includes('program'));
    });

    it('should have key enforcement properties', () => {
      const props = EPAEnforcementSchema.properties;
      assert.ok(props.action_id);
      assert.ok(props.registry_id);
      assert.ok(props.facility_name);
      assert.ok(props.action_date);
      assert.ok(props.action_type);
      assert.ok(props.program);
      assert.ok(props.lead_agency);
      assert.ok(props.penalty_amount);
      assert.ok(props.compliance_action_cost);
    });

    it('should have action_type enum', () => {
      const actionType = EPAEnforcementSchema.properties.action_type;
      assert.strictEqual(actionType.type, 'string');
      assert.ok(Array.isArray(actionType.enum));
      assert.ok(actionType.enum.includes('administrative'));
      assert.ok(actionType.enum.includes('civil_judicial'));
      assert.ok(actionType.enum.includes('criminal'));
    });

    it('should have lead_agency enum', () => {
      const agency = EPAEnforcementSchema.properties.lead_agency;
      assert.strictEqual(agency.type, 'string');
      assert.ok(Array.isArray(agency.enum));
      assert.ok(agency.enum.includes('EPA'));
      assert.ok(agency.enum.includes('STATE'));
      assert.ok(agency.enum.includes('LOCAL'));
    });
  });

  describe('Reusable Types and Enums', () => {
    it('should have RegistryIDType', () => {
      assert.strictEqual(RegistryIDType.type, 'string');
      assert.ok(RegistryIDType.description);
    });

    it('should have EPAProgramEnum with all programs', () => {
      assert.ok(Array.isArray(EPAProgramEnum));
      assert.ok(EPAProgramEnum.includes('CAA'));
      assert.ok(EPAProgramEnum.includes('CWA'));
      assert.ok(EPAProgramEnum.includes('RCRA'));
      assert.ok(EPAProgramEnum.includes('SDWA'));
      assert.ok(EPAProgramEnum.includes('CERCLA'));
    });

    it('should have ComplianceStatusEnum', () => {
      assert.ok(Array.isArray(ComplianceStatusEnum));
      assert.ok(ComplianceStatusEnum.includes('in_compliance'));
      assert.ok(ComplianceStatusEnum.includes('significant_violation'));
      assert.ok(ComplianceStatusEnum.includes('high_priority_violation'));
    });
  });

  describe('EPASchemas export', () => {
    it('should export all schemas in collection', () => {
      assert.ok(EPASchemas.epa_facility);
      assert.ok(EPASchemas.epa_compliance);
      assert.ok(EPASchemas.epa_violation);
      assert.ok(EPASchemas.epa_enforcement);
    });

    it('should have matching references', () => {
      assert.strictEqual(EPASchemas.epa_facility, EPAFacilitySchema);
      assert.strictEqual(EPASchemas.epa_compliance, EPAComplianceSchema);
      assert.strictEqual(EPASchemas.epa_violation, EPAViolationSchema);
      assert.strictEqual(EPASchemas.epa_enforcement, EPAEnforcementSchema);
    });
  });

  describe('Schema Compatibility', () => {
    it('should be compatible with SchemaValidator', () => {
      const schemas = [
        EPAFacilitySchema,
        EPAComplianceSchema,
        EPAViolationSchema,
        EPAEnforcementSchema
      ];

      schemas.forEach(schema => {
        assert.strictEqual(schema.$schema, 'http://json-schema.org/draft-07/schema#');
        assert.strictEqual(schema.type, 'object');
        assert.ok(schema.title);
        assert.ok(schema.properties);
        assert.ok(Array.isArray(schema.required));
      });
    });

    it('should have descriptions for all properties', () => {
      const schemas = [
        EPAFacilitySchema,
        EPAComplianceSchema,
        EPAViolationSchema,
        EPAEnforcementSchema
      ];

      schemas.forEach(schema => {
        Object.keys(schema.properties).forEach(prop => {
          assert.ok(
            schema.properties[prop].description,
            `Property ${prop} in ${schema.title} should have a description`
          );
        });
      });
    });
  });
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running EPASchemas tests...');
}
