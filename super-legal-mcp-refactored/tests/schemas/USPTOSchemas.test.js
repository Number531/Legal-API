/**
 * USPTOSchemas.test.js
 * Unit tests for USPTO schema definitions
 */

import { strict as assert } from 'assert';
import {
  PatentSchema,
  CPCClassificationSchema,
  USPCClassificationSchema,
  WIPOClassificationSchema,
  PatentLocationSchema,
  USPTOSchemas,
  PatentNumberType,
  CPCSectionEnum,
  CPCSectionTitles,
  WIPOSectorEnum
} from '../../src/api-clients/schemas/USPTOSchemas.js';

describe('USPTOSchemas', () => {
  describe('PatentSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(PatentSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(PatentSchema.type, 'object');
      assert.strictEqual(PatentSchema.title, 'USPTO Patent');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(PatentSchema.required));
      assert.ok(PatentSchema.required.includes('patent_number'));
      assert.ok(PatentSchema.required.includes('title'));
    });

    it('should have key patent properties', () => {
      const props = PatentSchema.properties;
      assert.ok(props.patent_number);
      assert.ok(props.title);
      assert.ok(props.abstract);
      assert.ok(props.inventors);
      assert.ok(props.assignee);
      assert.ok(props.filing_date);
      assert.ok(props.issue_date);
      assert.ok(props.cpc_classifications);
      assert.ok(props.patent_url);
    });

    it('should have patent_number pattern validation', () => {
      const patentNum = PatentSchema.properties.patent_number;
      assert.strictEqual(patentNum.type, 'string');
      assert.ok(patentNum.pattern);
    });

    it('should have array types for classifications', () => {
      const cpc = PatentSchema.properties.cpc_classifications;
      const uspc = PatentSchema.properties.uspc_classifications;
      assert.strictEqual(cpc.type, 'array');
      assert.strictEqual(uspc.type, 'array');
    });

    it('should have integer type for claims_count', () => {
      const claims = PatentSchema.properties.claims_count;
      assert.strictEqual(claims.type, 'integer');
      assert.ok(claims.minimum !== undefined);
    });
  });

  describe('CPCClassificationSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(CPCClassificationSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(CPCClassificationSchema.type, 'object');
      assert.strictEqual(CPCClassificationSchema.title, 'CPC Classification');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(CPCClassificationSchema.required));
      assert.ok(CPCClassificationSchema.required.includes('classification_code'));
      assert.ok(CPCClassificationSchema.required.includes('section'));
    });

    it('should have CPC-specific properties', () => {
      const props = CPCClassificationSchema.properties;
      assert.ok(props.classification_code);
      assert.ok(props.section);
      assert.ok(props.section_title);
      assert.ok(props.class_code);
      assert.ok(props.main_group);
      assert.ok(props.subgroup);
    });

    it('should have section enum with all CPC sections', () => {
      const section = CPCClassificationSchema.properties.section;
      assert.strictEqual(section.type, 'string');
      assert.ok(Array.isArray(section.enum));
      assert.ok(section.enum.includes('A'));
      assert.ok(section.enum.includes('G'));
      assert.ok(section.enum.includes('H'));
    });

    it('should have pattern validation for classification_code', () => {
      const code = CPCClassificationSchema.properties.classification_code;
      assert.ok(code.pattern);
    });
  });

  describe('USPCClassificationSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(USPCClassificationSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(USPCClassificationSchema.type, 'object');
      assert.strictEqual(USPCClassificationSchema.title, 'USPC Classification');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(USPCClassificationSchema.required));
      assert.ok(USPCClassificationSchema.required.includes('class_number'));
      assert.ok(USPCClassificationSchema.required.includes('class_title'));
    });

    it('should have USPC-specific properties', () => {
      const props = USPCClassificationSchema.properties;
      assert.ok(props.class_number);
      assert.ok(props.class_title);
      assert.ok(props.subclass);
      assert.ok(props.status);
    });

    it('should have status enum', () => {
      const status = USPCClassificationSchema.properties.status;
      assert.strictEqual(status.type, 'string');
      assert.ok(Array.isArray(status.enum));
      assert.ok(status.enum.includes('active'));
      assert.ok(status.enum.includes('deprecated'));
    });

    it('should have pattern for class_number', () => {
      const classNum = USPCClassificationSchema.properties.class_number;
      assert.ok(classNum.pattern);
    });
  });

  describe('WIPOClassificationSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(WIPOClassificationSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(WIPOClassificationSchema.type, 'object');
      assert.strictEqual(WIPOClassificationSchema.title, 'WIPO Classification');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(WIPOClassificationSchema.required));
      assert.ok(WIPOClassificationSchema.required.includes('field_number'));
      assert.ok(WIPOClassificationSchema.required.includes('field_title'));
    });

    it('should have WIPO-specific properties', () => {
      const props = WIPOClassificationSchema.properties;
      assert.ok(props.field_number);
      assert.ok(props.field_title);
      assert.ok(props.sector);
      assert.ok(props.ipc_codes);
    });

    it('should have sector enum', () => {
      const sector = WIPOClassificationSchema.properties.sector;
      assert.strictEqual(sector.type, 'string');
      assert.ok(Array.isArray(sector.enum));
      assert.ok(sector.enum.includes('Electrical Engineering'));
      assert.ok(sector.enum.includes('Chemistry'));
    });

    it('should have field_number pattern', () => {
      const fieldNum = WIPOClassificationSchema.properties.field_number;
      assert.ok(fieldNum.pattern);
      assert.ok(fieldNum.pattern.includes('\\d{2}'));
    });
  });

  describe('PatentLocationSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(PatentLocationSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(PatentLocationSchema.type, 'object');
      assert.strictEqual(PatentLocationSchema.title, 'Patent Location');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(PatentLocationSchema.required));
      assert.ok(PatentLocationSchema.required.includes('location'));
      assert.ok(PatentLocationSchema.required.includes('patent_count'));
    });

    it('should have location properties', () => {
      const props = PatentLocationSchema.properties;
      assert.ok(props.location);
      assert.ok(props.city);
      assert.ok(props.state);
      assert.ok(props.country);
      assert.ok(props.patent_count);
      assert.ok(props.top_assignees);
    });

    it('should have state and country patterns', () => {
      const state = PatentLocationSchema.properties.state;
      const country = PatentLocationSchema.properties.country;
      assert.ok(state.pattern);
      assert.ok(country.pattern);
      assert.ok(state.pattern.includes('[A-Z]{2}'));
    });
  });

  describe('Reusable Types and Enums', () => {
    it('should have PatentNumberType', () => {
      assert.strictEqual(PatentNumberType.type, 'string');
      assert.ok(PatentNumberType.pattern);
      assert.ok(PatentNumberType.description);
    });

    it('should have CPCSectionEnum with all sections', () => {
      assert.ok(Array.isArray(CPCSectionEnum));
      assert.strictEqual(CPCSectionEnum.length, 9);
      assert.ok(CPCSectionEnum.includes('A'));
      assert.ok(CPCSectionEnum.includes('Y'));
    });

    it('should have CPCSectionTitles mapping', () => {
      assert.strictEqual(typeof CPCSectionTitles, 'object');
      assert.ok(CPCSectionTitles['A']);
      assert.ok(CPCSectionTitles['G']);
      assert.ok(CPCSectionTitles['A'].includes('HUMAN'));
      assert.ok(CPCSectionTitles['G'].includes('PHYSICS'));
    });

    it('should have WIPOSectorEnum', () => {
      assert.ok(Array.isArray(WIPOSectorEnum));
      assert.ok(WIPOSectorEnum.includes('Electrical Engineering'));
      assert.ok(WIPOSectorEnum.includes('Chemistry'));
    });
  });

  describe('USPTOSchemas export', () => {
    it('should export all schemas in collection', () => {
      assert.ok(USPTOSchemas.uspto_patent);
      assert.ok(USPTOSchemas.uspto_cpc_classification);
      assert.ok(USPTOSchemas.uspto_uspc_classification);
      assert.ok(USPTOSchemas.uspto_wipo_classification);
      assert.ok(USPTOSchemas.uspto_patent_location);
    });

    it('should have matching references', () => {
      assert.strictEqual(USPTOSchemas.uspto_patent, PatentSchema);
      assert.strictEqual(USPTOSchemas.uspto_cpc_classification, CPCClassificationSchema);
      assert.strictEqual(USPTOSchemas.uspto_uspc_classification, USPCClassificationSchema);
      assert.strictEqual(USPTOSchemas.uspto_wipo_classification, WIPOClassificationSchema);
      assert.strictEqual(USPTOSchemas.uspto_patent_location, PatentLocationSchema);
    });
  });

  describe('Schema Compatibility', () => {
    it('should be compatible with SchemaValidator', () => {
      const schemas = [
        PatentSchema,
        CPCClassificationSchema,
        USPCClassificationSchema,
        WIPOClassificationSchema,
        PatentLocationSchema
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
        PatentSchema,
        CPCClassificationSchema,
        USPCClassificationSchema,
        WIPOClassificationSchema,
        PatentLocationSchema
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
  console.log('Running USPTOSchemas tests...');
}
