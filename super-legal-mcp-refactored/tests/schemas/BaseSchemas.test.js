/**
 * BaseSchemas.test.js
 * Unit tests for BaseSchemas utility module
 */

import { strict as assert } from 'assert';
import {
  CommonTypes,
  CommonProperties,
  ValidationHelpers,
  createSchema,
  composeSchema,
  createArraySchema,
  createEnumSchema,
  makeOptional
} from '../../src/api-clients/schemas/BaseSchemas.js';

describe('BaseSchemas', () => {

  describe('CommonTypes', () => {
    it('should have date type definition', () => {
      assert.ok(CommonTypes.date);
      assert.strictEqual(CommonTypes.date.type, 'string');
      assert.ok(CommonTypes.date.pattern);
    });

    it('should have monetary type definition', () => {
      assert.ok(CommonTypes.monetary);
      assert.strictEqual(CommonTypes.monetary.type, 'number');
      assert.strictEqual(CommonTypes.monetary.minimum, 0);
    });

    it('should have url type definition', () => {
      assert.ok(CommonTypes.url);
      assert.strictEqual(CommonTypes.url.type, 'string');
      assert.strictEqual(CommonTypes.url.format, 'uri');
    });

    it('should have email type definition', () => {
      assert.ok(CommonTypes.email);
      assert.strictEqual(CommonTypes.email.type, 'string');
      assert.strictEqual(CommonTypes.email.format, 'email');
    });

    it('should have stateCode type definition', () => {
      assert.ok(CommonTypes.stateCode);
      assert.strictEqual(CommonTypes.stateCode.type, 'string');
      assert.ok(CommonTypes.stateCode.pattern);
    });
  });

  describe('createSchema', () => {
    it('should create basic schema with properties', () => {
      const schema = createSchema('TestSchema', {
        name: { type: 'string' },
        age: { type: 'number' }
      });

      assert.strictEqual(schema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(schema.title, 'TestSchema');
      assert.strictEqual(schema.type, 'object');
      assert.ok(schema.properties);
      assert.ok(schema.properties.name);
      assert.ok(schema.properties.age);
    });

    it('should create schema with required fields', () => {
      const schema = createSchema(
        'TestSchema',
        { name: { type: 'string' } },
        ['name']
      );

      assert.ok(schema.required);
      assert.strictEqual(schema.required.length, 1);
      assert.strictEqual(schema.required[0], 'name');
    });

    it('should handle empty required array', () => {
      const schema = createSchema(
        'TestSchema',
        { name: { type: 'string' } },
        []
      );

      assert.strictEqual(schema.required, undefined);
    });

    it('should accept additional options', () => {
      const schema = createSchema(
        'TestSchema',
        { name: { type: 'string' } },
        [],
        { additionalProperties: false }
      );

      assert.strictEqual(schema.additionalProperties, false);
    });
  });

  describe('composeSchema', () => {
    it('should merge multiple property sets', () => {
      const schema = composeSchema(
        'ComposedSchema',
        [
          { name: { type: 'string' } },
          { age: { type: 'number' } },
          { email: { type: 'string' } }
        ]
      );

      assert.ok(schema.properties.name);
      assert.ok(schema.properties.age);
      assert.ok(schema.properties.email);
    });

    it('should handle required fields in composed schema', () => {
      const schema = composeSchema(
        'ComposedSchema',
        [
          { name: { type: 'string' } },
          { age: { type: 'number' } }
        ],
        ['name']
      );

      assert.ok(schema.required);
      assert.strictEqual(schema.required.length, 1);
      assert.strictEqual(schema.required[0], 'name');
    });

    it('should handle empty property sets', () => {
      const schema = composeSchema('EmptySchema', []);
      assert.ok(schema.properties);
      assert.strictEqual(Object.keys(schema.properties).length, 0);
    });
  });

  describe('createArraySchema', () => {
    it('should create array schema with item type', () => {
      const schema = createArraySchema(
        'StringArray',
        { type: 'string' }
      );

      assert.strictEqual(schema.type, 'array');
      assert.ok(schema.items);
      assert.strictEqual(schema.items.type, 'string');
    });

    it('should set minItems when provided', () => {
      const schema = createArraySchema(
        'StringArray',
        { type: 'string' },
        2
      );

      assert.strictEqual(schema.minItems, 2);
    });

    it('should set maxItems when provided', () => {
      const schema = createArraySchema(
        'StringArray',
        { type: 'string' },
        0,
        10
      );

      assert.strictEqual(schema.maxItems, 10);
    });

    it('should not set minItems when 0', () => {
      const schema = createArraySchema(
        'StringArray',
        { type: 'string' },
        0
      );

      assert.strictEqual(schema.minItems, undefined);
    });

    it('should not set maxItems when null', () => {
      const schema = createArraySchema(
        'StringArray',
        { type: 'string' },
        0,
        null
      );

      assert.strictEqual(schema.maxItems, undefined);
    });
  });

  describe('createEnumSchema', () => {
    it('should create enum schema with values', () => {
      const schema = createEnumSchema(
        'Status',
        ['active', 'inactive', 'pending']
      );

      assert.strictEqual(schema.type, 'string');
      assert.ok(schema.enum);
      assert.strictEqual(schema.enum.length, 3);
      assert.ok(schema.enum.includes('active'));
    });

    it('should accept description', () => {
      const schema = createEnumSchema(
        'Status',
        ['active', 'inactive'],
        'User status'
      );

      assert.strictEqual(schema.description, 'User status');
    });
  });

  describe('makeOptional', () => {
    it('should make single type optional', () => {
      const stringType = { type: 'string' };
      const optional = makeOptional(stringType);

      assert.ok(Array.isArray(optional.type));
      assert.ok(optional.type.includes('string'));
      assert.ok(optional.type.includes('null'));
    });

    it('should make array type optional', () => {
      const unionType = { type: ['string', 'number'] };
      const optional = makeOptional(unionType);

      assert.ok(Array.isArray(optional.type));
      assert.ok(optional.type.includes('string'));
      assert.ok(optional.type.includes('number'));
      assert.ok(optional.type.includes('null'));
    });

    it('should preserve other properties', () => {
      const typeWithProps = {
        type: 'string',
        pattern: '^[A-Z]+$',
        description: 'Test'
      };
      const optional = makeOptional(typeWithProps);

      assert.strictEqual(optional.pattern, '^[A-Z]+$');
      assert.strictEqual(optional.description, 'Test');
    });
  });

  describe('CommonProperties', () => {
    it('should have address properties', () => {
      assert.ok(CommonProperties.address);
      assert.ok(CommonProperties.address.street);
      assert.ok(CommonProperties.address.city);
      assert.ok(CommonProperties.address.state);
      assert.ok(CommonProperties.address.zipCode);
    });

    it('should have contact properties', () => {
      assert.ok(CommonProperties.contact);
      assert.ok(CommonProperties.contact.name);
      assert.ok(CommonProperties.contact.email);
      assert.ok(CommonProperties.contact.phone);
    });

    it('should have timestamp properties', () => {
      assert.ok(CommonProperties.timestamps);
      assert.ok(CommonProperties.timestamps.created_date);
      assert.ok(CommonProperties.timestamps.modified_date);
    });

    it('should have document metadata properties', () => {
      assert.ok(CommonProperties.documentMeta);
      assert.ok(CommonProperties.documentMeta.title);
      assert.ok(CommonProperties.documentMeta.document_number);
      assert.ok(CommonProperties.documentMeta.url);
    });
  });

  describe('ValidationHelpers', () => {
    describe('isValidDate', () => {
      it('should validate ISO date format', () => {
        assert.strictEqual(ValidationHelpers.isValidDate('2024-01-15'), true);
        assert.strictEqual(ValidationHelpers.isValidDate('2024-12-31'), true);
      });

      it('should reject invalid date formats', () => {
        assert.strictEqual(ValidationHelpers.isValidDate('01/15/2024'), false);
        assert.strictEqual(ValidationHelpers.isValidDate('2024-1-5'), false);
        assert.strictEqual(ValidationHelpers.isValidDate('not-a-date'), false);
      });

      it('should reject non-string values', () => {
        assert.strictEqual(ValidationHelpers.isValidDate(123), false);
        assert.strictEqual(ValidationHelpers.isValidDate(null), false);
        assert.strictEqual(ValidationHelpers.isValidDate(undefined), false);
      });
    });

    describe('isValidUrl', () => {
      it('should validate valid URLs', () => {
        assert.strictEqual(ValidationHelpers.isValidUrl('https://example.com'), true);
        assert.strictEqual(ValidationHelpers.isValidUrl('http://test.org/path'), true);
      });

      it('should reject invalid URLs', () => {
        assert.strictEqual(ValidationHelpers.isValidUrl('not-a-url'), false);
        assert.strictEqual(ValidationHelpers.isValidUrl(''), false);
      });

      it('should reject non-string values', () => {
        assert.strictEqual(ValidationHelpers.isValidUrl(123), false);
        assert.strictEqual(ValidationHelpers.isValidUrl(null), false);
      });
    });

    describe('isValidMonetary', () => {
      it('should validate positive numbers', () => {
        assert.strictEqual(ValidationHelpers.isValidMonetary(100), true);
        assert.strictEqual(ValidationHelpers.isValidMonetary(0), true);
        assert.strictEqual(ValidationHelpers.isValidMonetary(999.99), true);
      });

      it('should reject negative numbers', () => {
        assert.strictEqual(ValidationHelpers.isValidMonetary(-10), false);
      });

      it('should reject non-numbers', () => {
        assert.strictEqual(ValidationHelpers.isValidMonetary('100'), false);
        assert.strictEqual(ValidationHelpers.isValidMonetary(null), false);
      });
    });

    describe('isValidStateCode', () => {
      it('should validate two-letter uppercase codes', () => {
        assert.strictEqual(ValidationHelpers.isValidStateCode('CA'), true);
        assert.strictEqual(ValidationHelpers.isValidStateCode('NY'), true);
      });

      it('should reject invalid formats', () => {
        assert.strictEqual(ValidationHelpers.isValidStateCode('ca'), false);
        assert.strictEqual(ValidationHelpers.isValidStateCode('CAL'), false);
        assert.strictEqual(ValidationHelpers.isValidStateCode('C'), false);
      });

      it('should reject non-string values', () => {
        assert.strictEqual(ValidationHelpers.isValidStateCode(12), false);
        assert.strictEqual(ValidationHelpers.isValidStateCode(null), false);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should create complete schema using CommonTypes', () => {
      const schema = createSchema(
        'TestEntity',
        {
          name: { type: 'string' },
          amount: CommonTypes.monetary,
          date: CommonTypes.date,
          url: CommonTypes.url
        },
        ['name', 'date']
      );

      assert.ok(schema.properties.amount);
      assert.strictEqual(schema.properties.amount.type, 'number');
      assert.strictEqual(schema.properties.amount.minimum, 0);
      assert.strictEqual(schema.required.length, 2);
    });

    it('should compose schema with CommonProperties', () => {
      const schema = composeSchema(
        'EntityWithMetadata',
        [
          { id: { type: 'string' } },
          CommonProperties.timestamps,
          CommonProperties.documentMeta
        ],
        ['id']
      );

      assert.ok(schema.properties.id);
      assert.ok(schema.properties.created_date);
      assert.ok(schema.properties.title);
      assert.strictEqual(schema.required.length, 1);
    });
  });
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running BaseSchemas tests...');
  // Tests will be run by test runner
}
