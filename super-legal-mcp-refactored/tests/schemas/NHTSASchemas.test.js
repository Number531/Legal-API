/**
 * NHTSASchemas.test.js
 * Unit tests for NHTSA schema definitions
 */

import { strict as assert } from 'assert';
import {
  NHTSAVinDecodeSchema,
  NHTSAVehicleModelSchema,
  NHTSARecallSchema,
  NHTSAComplaintSchema,
  NHTSASafetyRatingSchema,
  NHTSAInvestigationSchema,
  NHTSASchemas,
  CampaignIDType,
  VINType,
  RecallTypeEnum,
  InvestigationTypeEnum,
  ComplaintTypeEnum
} from '../../src/api-clients/schemas/NHTSASchemas.js';

describe('NHTSASchemas', () => {
  describe('NHTSAVinDecodeSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(NHTSAVinDecodeSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(NHTSAVinDecodeSchema.type, 'object');
      assert.strictEqual(NHTSAVinDecodeSchema.title, 'NHTSA VIN Decode');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(NHTSAVinDecodeSchema.required));
      assert.ok(NHTSAVinDecodeSchema.required.includes('vin'));
      assert.ok(NHTSAVinDecodeSchema.required.includes('make'));
      assert.ok(NHTSAVinDecodeSchema.required.includes('model'));
    });

    it('should have key VIN decode properties', () => {
      const props = NHTSAVinDecodeSchema.properties;
      assert.ok(props.vin);
      assert.ok(props.make);
      assert.ok(props.model);
      assert.ok(props.model_year);
      assert.ok(props.body_class);
      assert.ok(props.engine_type);
      assert.ok(props.transmission);
      assert.ok(props.drive_type);
      assert.ok(props.fuel_type);
    });

    it('should have VIN pattern validation', () => {
      const vin = NHTSAVinDecodeSchema.properties.vin;
      assert.strictEqual(vin.type, 'string');
      assert.ok(vin.pattern);
      assert.ok(vin.pattern.includes('[A-HJ-NPR-Z0-9]{17}'));
    });

    it('should have drive_type enum', () => {
      const driveType = NHTSAVinDecodeSchema.properties.drive_type;
      assert.strictEqual(driveType.type, 'string');
      assert.ok(Array.isArray(driveType.enum));
      assert.ok(driveType.enum.includes('FWD'));
      assert.ok(driveType.enum.includes('AWD'));
    });

    it('should have model_year with range validation', () => {
      const modelYear = NHTSAVinDecodeSchema.properties.model_year;
      assert.strictEqual(modelYear.type, 'integer');
      assert.ok(modelYear.minimum !== undefined);
      assert.ok(modelYear.maximum !== undefined);
    });
  });

  describe('NHTSAVehicleModelSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(NHTSAVehicleModelSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(NHTSAVehicleModelSchema.type, 'object');
      assert.strictEqual(NHTSAVehicleModelSchema.title, 'NHTSA Vehicle Model');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(NHTSAVehicleModelSchema.required));
      assert.ok(NHTSAVehicleModelSchema.required.includes('make'));
      assert.ok(NHTSAVehicleModelSchema.required.includes('model'));
    });

    it('should have vehicle model properties', () => {
      const props = NHTSAVehicleModelSchema.properties;
      assert.ok(props.make);
      assert.ok(props.model);
      assert.ok(props.year);
      assert.ok(props.body_styles);
      assert.ok(props.trim_levels);
    });

    it('should have array types for body_styles and trim_levels', () => {
      const bodyStyles = NHTSAVehicleModelSchema.properties.body_styles;
      const trimLevels = NHTSAVehicleModelSchema.properties.trim_levels;
      assert.strictEqual(bodyStyles.type, 'array');
      assert.strictEqual(trimLevels.type, 'array');
    });
  });

  describe('NHTSARecallSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(NHTSARecallSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(NHTSARecallSchema.type, 'object');
      assert.strictEqual(NHTSARecallSchema.title, 'NHTSA Recall');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(NHTSARecallSchema.required));
      assert.ok(NHTSARecallSchema.required.includes('campaign_id'));
      assert.ok(NHTSARecallSchema.required.includes('manufacturer'));
      assert.ok(NHTSARecallSchema.required.includes('summary'));
    });

    it('should have recall properties', () => {
      const props = NHTSARecallSchema.properties;
      assert.ok(props.campaign_id);
      assert.ok(props.recall_number);
      assert.ok(props.manufacturer);
      assert.ok(props.make);
      assert.ok(props.model);
      assert.ok(props.component);
      assert.ok(props.summary);
      assert.ok(props.consequence);
      assert.ok(props.remedy);
      assert.ok(props.recall_type);
    });

    it('should have campaign_id pattern validation', () => {
      const campaignId = NHTSARecallSchema.properties.campaign_id;
      assert.strictEqual(campaignId.type, 'string');
      assert.ok(campaignId.pattern);
      assert.ok(campaignId.pattern.includes('[VET]'));
    });

    it('should have recall_type enum', () => {
      const recallType = NHTSARecallSchema.properties.recall_type;
      assert.strictEqual(recallType.type, 'string');
      assert.ok(Array.isArray(recallType.enum));
      assert.ok(recallType.enum.includes('Safety'));
      assert.ok(recallType.enum.includes('Compliance'));
      assert.ok(recallType.enum.includes('Tire'));
    });
  });

  describe('NHTSAComplaintSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(NHTSAComplaintSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(NHTSAComplaintSchema.type, 'object');
      assert.strictEqual(NHTSAComplaintSchema.title, 'NHTSA Complaint');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(NHTSAComplaintSchema.required));
      assert.ok(NHTSAComplaintSchema.required.includes('make'));
      assert.ok(NHTSAComplaintSchema.required.includes('model'));
      assert.ok(NHTSAComplaintSchema.required.includes('summary'));
    });

    it('should have complaint properties', () => {
      const props = NHTSAComplaintSchema.properties;
      assert.ok(props.odi_number);
      assert.ok(props.make);
      assert.ok(props.model);
      assert.ok(props.component);
      assert.ok(props.complaint_type);
      assert.ok(props.crash_indicator);
      assert.ok(props.fire_indicator);
      assert.ok(props.injury_count);
    });

    it('should have complaint_type enum', () => {
      const complaintType = NHTSAComplaintSchema.properties.complaint_type;
      assert.strictEqual(complaintType.type, 'string');
      assert.ok(Array.isArray(complaintType.enum));
      assert.ok(complaintType.enum.includes('Crash'));
      assert.ok(complaintType.enum.includes('Fire'));
      assert.ok(complaintType.enum.includes('Injury'));
    });

    it('should have boolean types for indicators', () => {
      const crashIndicator = NHTSAComplaintSchema.properties.crash_indicator;
      const fireIndicator = NHTSAComplaintSchema.properties.fire_indicator;
      assert.strictEqual(crashIndicator.type, 'boolean');
      assert.strictEqual(fireIndicator.type, 'boolean');
    });

    it('should have integer type for injury_count', () => {
      const injuryCount = NHTSAComplaintSchema.properties.injury_count;
      assert.strictEqual(injuryCount.type, 'integer');
      assert.ok(injuryCount.minimum !== undefined);
    });
  });

  describe('NHTSASafetyRatingSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(NHTSASafetyRatingSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(NHTSASafetyRatingSchema.type, 'object');
      assert.strictEqual(NHTSASafetyRatingSchema.title, 'NHTSA Safety Rating');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(NHTSASafetyRatingSchema.required));
      assert.ok(NHTSASafetyRatingSchema.required.includes('make'));
      assert.ok(NHTSASafetyRatingSchema.required.includes('model'));
      assert.ok(NHTSASafetyRatingSchema.required.includes('overall_rating'));
    });

    it('should have safety rating properties', () => {
      const props = NHTSASafetyRatingSchema.properties;
      assert.ok(props.overall_rating);
      assert.ok(props.frontal_crash_rating);
      assert.ok(props.side_crash_rating);
      assert.ok(props.rollover_rating);
      assert.ok(props.frontal_driver_rating);
      assert.ok(props.frontal_passenger_rating);
      assert.ok(props.side_driver_rating);
      assert.ok(props.side_passenger_rating);
    });

    it('should have rating fields with 1-5 range', () => {
      const ratings = [
        'overall_rating',
        'frontal_crash_rating',
        'side_crash_rating',
        'rollover_rating'
      ];

      ratings.forEach(rating => {
        const prop = NHTSASafetyRatingSchema.properties[rating];
        assert.strictEqual(prop.type, 'integer');
        assert.strictEqual(prop.minimum, 1);
        assert.strictEqual(prop.maximum, 5);
      });
    });
  });

  describe('NHTSAInvestigationSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(NHTSAInvestigationSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(NHTSAInvestigationSchema.type, 'object');
      assert.strictEqual(NHTSAInvestigationSchema.title, 'NHTSA Investigation');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(NHTSAInvestigationSchema.required));
      assert.ok(NHTSAInvestigationSchema.required.includes('investigation_id'));
      assert.ok(NHTSAInvestigationSchema.required.includes('investigation_type'));
      assert.ok(NHTSAInvestigationSchema.required.includes('summary'));
    });

    it('should have investigation properties', () => {
      const props = NHTSAInvestigationSchema.properties;
      assert.ok(props.investigation_id);
      assert.ok(props.investigation_type);
      assert.ok(props.make);
      assert.ok(props.model);
      assert.ok(props.model_years);
      assert.ok(props.component);
      assert.ok(props.alleged_defect);
      assert.ok(props.incidents);
      assert.ok(props.injuries);
      assert.ok(props.deaths);
      assert.ok(props.status);
    });

    it('should have investigation_id pattern validation', () => {
      const investigationId = NHTSAInvestigationSchema.properties.investigation_id;
      assert.strictEqual(investigationId.type, 'string');
      assert.ok(investigationId.pattern);
      assert.ok(investigationId.pattern.includes('[A-Z]{2}'));
    });

    it('should have investigation_type enum', () => {
      const investigationType = NHTSAInvestigationSchema.properties.investigation_type;
      assert.strictEqual(investigationType.type, 'string');
      assert.ok(Array.isArray(investigationType.enum));
      assert.ok(investigationType.enum.includes('Preliminary Evaluation'));
      assert.ok(investigationType.enum.includes('Engineering Analysis'));
    });

    it('should have status enum', () => {
      const status = NHTSAInvestigationSchema.properties.status;
      assert.strictEqual(status.type, 'string');
      assert.ok(Array.isArray(status.enum));
      assert.ok(status.enum.includes('Open'));
      assert.ok(status.enum.includes('Closed - Action'));
    });

    it('should have integer types for counts', () => {
      const incidents = NHTSAInvestigationSchema.properties.incidents;
      const injuries = NHTSAInvestigationSchema.properties.injuries;
      const deaths = NHTSAInvestigationSchema.properties.deaths;
      assert.strictEqual(incidents.type, 'integer');
      assert.strictEqual(injuries.type, 'integer');
      assert.strictEqual(deaths.type, 'integer');
    });
  });

  describe('Reusable Types and Enums', () => {
    it('should have CampaignIDType', () => {
      assert.strictEqual(CampaignIDType.type, 'string');
      assert.ok(CampaignIDType.pattern);
      assert.ok(CampaignIDType.description);
    });

    it('should have VINType', () => {
      assert.strictEqual(VINType.type, 'string');
      assert.ok(VINType.pattern);
      assert.ok(VINType.description);
      assert.ok(VINType.pattern.includes('17'));
    });

    it('should have RecallTypeEnum', () => {
      assert.ok(Array.isArray(RecallTypeEnum));
      assert.ok(RecallTypeEnum.includes('Safety'));
      assert.ok(RecallTypeEnum.includes('Compliance'));
      assert.ok(RecallTypeEnum.includes('Equipment'));
      assert.ok(RecallTypeEnum.includes('Tire'));
    });

    it('should have InvestigationTypeEnum', () => {
      assert.ok(Array.isArray(InvestigationTypeEnum));
      assert.ok(InvestigationTypeEnum.includes('Preliminary Evaluation'));
      assert.ok(InvestigationTypeEnum.includes('Engineering Analysis'));
    });

    it('should have ComplaintTypeEnum', () => {
      assert.ok(Array.isArray(ComplaintTypeEnum));
      assert.ok(ComplaintTypeEnum.includes('Crash'));
      assert.ok(ComplaintTypeEnum.includes('Fire'));
      assert.ok(ComplaintTypeEnum.includes('Injury'));
    });
  });

  describe('NHTSASchemas export', () => {
    it('should export all schemas in collection', () => {
      assert.ok(NHTSASchemas.nhtsa_vin_decode);
      assert.ok(NHTSASchemas.nhtsa_vehicle_model);
      assert.ok(NHTSASchemas.nhtsa_recall);
      assert.ok(NHTSASchemas.nhtsa_complaint);
      assert.ok(NHTSASchemas.nhtsa_safety_rating);
      assert.ok(NHTSASchemas.nhtsa_investigation);
    });

    it('should have matching references', () => {
      assert.strictEqual(NHTSASchemas.nhtsa_vin_decode, NHTSAVinDecodeSchema);
      assert.strictEqual(NHTSASchemas.nhtsa_vehicle_model, NHTSAVehicleModelSchema);
      assert.strictEqual(NHTSASchemas.nhtsa_recall, NHTSARecallSchema);
      assert.strictEqual(NHTSASchemas.nhtsa_complaint, NHTSAComplaintSchema);
      assert.strictEqual(NHTSASchemas.nhtsa_safety_rating, NHTSASafetyRatingSchema);
      assert.strictEqual(NHTSASchemas.nhtsa_investigation, NHTSAInvestigationSchema);
    });
  });

  describe('Schema Compatibility', () => {
    it('should be compatible with SchemaValidator', () => {
      const schemas = [
        NHTSAVinDecodeSchema,
        NHTSAVehicleModelSchema,
        NHTSARecallSchema,
        NHTSAComplaintSchema,
        NHTSASafetyRatingSchema,
        NHTSAInvestigationSchema
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
        NHTSAVinDecodeSchema,
        NHTSAVehicleModelSchema,
        NHTSARecallSchema,
        NHTSAComplaintSchema,
        NHTSASafetyRatingSchema,
        NHTSAInvestigationSchema
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

  describe('Pattern Validations', () => {
    it('should validate VIN numbers', () => {
      const pattern = new RegExp(NHTSAVinDecodeSchema.properties.vin.pattern);
      assert.ok(pattern.test('1HGBH41JXMN109186'));
      assert.ok(pattern.test('JM1BL1S55A1234567'));
      assert.ok(!pattern.test('1HGBH41JXMN10918')); // Too short
      assert.ok(!pattern.test('1HGBH41JXMN1091866')); // Too long
      assert.ok(!pattern.test('1HGBH41JXIN109186')); // Contains 'I'
      assert.ok(!pattern.test('1HGBH41JXON109186')); // Contains 'O'
    });

    it('should validate campaign IDs', () => {
      const pattern = new RegExp(NHTSARecallSchema.properties.campaign_id.pattern);
      assert.ok(pattern.test('23V-456'));
      assert.ok(pattern.test('24E-123'));
      assert.ok(pattern.test('2023V-7041'));
      assert.ok(pattern.test('23T456')); // Without dash
      assert.ok(!pattern.test('23-456')); // Missing letter
      assert.ok(!pattern.test('V23-456')); // Wrong order
    });

    it('should validate investigation IDs', () => {
      const pattern = new RegExp(NHTSAInvestigationSchema.properties.investigation_id.pattern);
      assert.ok(pattern.test('PE23-001'));
      assert.ok(pattern.test('EA22-005'));
      assert.ok(pattern.test('RQ24-123'));
      assert.ok(!pattern.test('P23-001')); // Only one letter
      assert.ok(!pattern.test('PE2023-001')); // Year too long
    });
  });
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running NHTSASchemas tests...');
}
