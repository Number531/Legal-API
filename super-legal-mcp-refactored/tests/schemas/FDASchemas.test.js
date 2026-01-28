/**
 * FDASchemas.test.js
 * Unit tests for FDA schema definitions
 */

import { strict as assert } from 'assert';
import {
  DrugAdverseEventSchema,
  DeviceEventSchema,
  DrugLabelSchema,
  RecallSchema,
  FDASchemas,
  NDCType,
  RecallClassificationType
} from '../../src/api-clients/schemas/FDASchemas.js';

describe('FDASchemas', () => {
  describe('DrugAdverseEventSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(DrugAdverseEventSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(DrugAdverseEventSchema.type, 'object');
      assert.strictEqual(DrugAdverseEventSchema.title, 'FDA Drug Adverse Event');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(DrugAdverseEventSchema.required));
      assert.ok(DrugAdverseEventSchema.required.includes('drug_name'));
      assert.ok(DrugAdverseEventSchema.required.includes('patient_reaction'));
    });

    it('should have key properties', () => {
      const props = DrugAdverseEventSchema.properties;
      assert.ok(props.report_id);
      assert.ok(props.drug_name);
      assert.ok(props.active_ingredient);
      assert.ok(props.serious);
      assert.ok(props.report_date);
      assert.ok(props.patient_reaction);
      assert.ok(props.outcome);
      assert.ok(props.manufacturer);
    });

    it('should have serious field as boolean', () => {
      assert.strictEqual(DrugAdverseEventSchema.properties.serious.type, 'boolean');
    });

    it('should have outcome enum with valid values', () => {
      const outcome = DrugAdverseEventSchema.properties.outcome;
      assert.strictEqual(outcome.type, 'string');
      assert.ok(Array.isArray(outcome.enum));
      assert.ok(outcome.enum.includes('death'));
      assert.ok(outcome.enum.includes('hospitalization'));
      assert.ok(outcome.enum.includes('life-threatening'));
    });

    it('should have date type for report_date', () => {
      const reportDate = DrugAdverseEventSchema.properties.report_date;
      assert.strictEqual(reportDate.type, 'string');
      assert.ok(reportDate.pattern);
    });
  });

  describe('DeviceEventSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(DeviceEventSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(DeviceEventSchema.type, 'object');
      assert.strictEqual(DeviceEventSchema.title, 'FDA Device Event');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(DeviceEventSchema.required));
      assert.ok(DeviceEventSchema.required.includes('device_generic_name'));
      assert.ok(DeviceEventSchema.required.includes('event_description'));
    });

    it('should have key properties', () => {
      const props = DeviceEventSchema.properties;
      assert.ok(props.report_id);
      assert.ok(props.device_brand_name);
      assert.ok(props.device_generic_name);
      assert.ok(props.manufacturer);
      assert.ok(props.event_date);
      assert.ok(props.event_type);
      assert.ok(props.event_description);
      assert.ok(props.device_problem);
    });

    it('should have date type for event_date', () => {
      const eventDate = DeviceEventSchema.properties.event_date;
      assert.strictEqual(eventDate.type, 'string');
      assert.ok(eventDate.pattern);
    });
  });

  describe('DrugLabelSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(DrugLabelSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(DrugLabelSchema.type, 'object');
      assert.strictEqual(DrugLabelSchema.title, 'FDA Drug Label');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(DrugLabelSchema.required));
      assert.ok(DrugLabelSchema.required.includes('brand_name'));
      assert.ok(DrugLabelSchema.required.includes('active_ingredient'));
    });

    it('should have key properties', () => {
      const props = DrugLabelSchema.properties;
      assert.ok(props.brand_name);
      assert.ok(props.generic_name);
      assert.ok(props.active_ingredient);
      assert.ok(props.manufacturer);
      assert.ok(props.indications);
      assert.ok(props.warnings);
      assert.ok(props.dosage);
      assert.ok(props.ndc_code);
      assert.ok(props.approval_date);
    });

    it('should have NDC code pattern', () => {
      const ndcCode = DrugLabelSchema.properties.ndc_code;
      assert.strictEqual(ndcCode.type, 'string');
      assert.ok(ndcCode.pattern);
      // Verify pattern string contains NDC format components
      assert.ok(ndcCode.pattern.includes('\\d{4,5}'));
      assert.ok(ndcCode.pattern.includes('\\d{3,4}'));
      assert.ok(ndcCode.pattern.includes('\\d{1,2}'));
    });

    it('should have date type for approval_date', () => {
      const approvalDate = DrugLabelSchema.properties.approval_date;
      assert.strictEqual(approvalDate.type, 'string');
      assert.ok(approvalDate.pattern);
    });
  });

  describe('RecallSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(RecallSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(RecallSchema.type, 'object');
      assert.strictEqual(RecallSchema.title, 'FDA Recall');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(RecallSchema.required));
      assert.ok(RecallSchema.required.includes('product_description'));
      assert.ok(RecallSchema.required.includes('reason_for_recall'));
      assert.ok(RecallSchema.required.includes('classification'));
    });

    it('should have key properties', () => {
      const props = RecallSchema.properties;
      assert.ok(props.recall_number);
      assert.ok(props.product_description);
      assert.ok(props.product_type);
      assert.ok(props.reason_for_recall);
      assert.ok(props.classification);
      assert.ok(props.status);
      assert.ok(props.recalling_firm);
      assert.ok(props.recall_initiation_date);
      assert.ok(props.distribution_pattern);
      assert.ok(props.quantity);
    });

    it('should have product_type enum with valid values', () => {
      const productType = RecallSchema.properties.product_type;
      assert.strictEqual(productType.type, 'string');
      assert.ok(Array.isArray(productType.enum));
      assert.ok(productType.enum.includes('drug'));
      assert.ok(productType.enum.includes('device'));
      assert.ok(productType.enum.includes('food'));
      assert.ok(productType.enum.includes('biologics'));
      assert.ok(productType.enum.includes('cosmetics'));
    });

    it('should have classification enum with recall classes', () => {
      const classification = RecallSchema.properties.classification;
      assert.strictEqual(classification.type, 'string');
      assert.ok(Array.isArray(classification.enum));
      assert.ok(classification.enum.includes('Class I'));
      assert.ok(classification.enum.includes('Class II'));
      assert.ok(classification.enum.includes('Class III'));
    });

    it('should have status enum', () => {
      const status = RecallSchema.properties.status;
      assert.strictEqual(status.type, 'string');
      assert.ok(Array.isArray(status.enum));
      assert.ok(status.enum.includes('ongoing'));
      assert.ok(status.enum.includes('completed'));
      assert.ok(status.enum.includes('terminated'));
    });

    it('should have date type for recall_initiation_date', () => {
      const initiationDate = RecallSchema.properties.recall_initiation_date;
      assert.strictEqual(initiationDate.type, 'string');
      assert.ok(initiationDate.pattern);
    });
  });

  describe('NDCType', () => {
    it('should have correct structure for NDC codes', () => {
      assert.strictEqual(NDCType.type, 'string');
      assert.ok(NDCType.pattern);
      assert.ok(NDCType.description);
    });

    it('should have pattern matching NDC format', () => {
      // Pattern should match: labeler-product-package
      // e.g., 12345-1234-12 or 1234-123-1
      assert.ok(NDCType.pattern.includes('\\d{4,5}'));
      assert.ok(NDCType.pattern.includes('\\d{3,4}'));
      assert.ok(NDCType.pattern.includes('\\d{1,2}'));
    });
  });

  describe('RecallClassificationType', () => {
    it('should have correct structure', () => {
      assert.strictEqual(RecallClassificationType.type, 'string');
      assert.ok(Array.isArray(RecallClassificationType.enum));
      assert.ok(RecallClassificationType.description);
    });

    it('should have all three recall classes', () => {
      assert.strictEqual(RecallClassificationType.enum.length, 3);
      assert.ok(RecallClassificationType.enum.includes('Class I'));
      assert.ok(RecallClassificationType.enum.includes('Class II'));
      assert.ok(RecallClassificationType.enum.includes('Class III'));
    });
  });

  describe('FDASchemas export', () => {
    it('should export all schemas in collection', () => {
      assert.ok(FDASchemas.fda_adverse_event);
      assert.ok(FDASchemas.fda_device_event);
      assert.ok(FDASchemas.fda_drug_label);
      assert.ok(FDASchemas.fda_recall);
    });

    it('should have matching references', () => {
      assert.strictEqual(FDASchemas.fda_adverse_event, DrugAdverseEventSchema);
      assert.strictEqual(FDASchemas.fda_device_event, DeviceEventSchema);
      assert.strictEqual(FDASchemas.fda_drug_label, DrugLabelSchema);
      assert.strictEqual(FDASchemas.fda_recall, RecallSchema);
    });
  });

  describe('Schema Compatibility', () => {
    it('should be compatible with SchemaValidator', () => {
      // All schemas should have required JSON Schema v7 properties
      const schemas = [
        DrugAdverseEventSchema,
        DeviceEventSchema,
        DrugLabelSchema,
        RecallSchema
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
        DrugAdverseEventSchema,
        DeviceEventSchema,
        DrugLabelSchema,
        RecallSchema
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
  console.log('Running FDASchemas tests...');
}
