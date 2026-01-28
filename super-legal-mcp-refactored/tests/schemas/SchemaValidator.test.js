/**
 * SchemaValidator.test.js
 * Unit tests for SchemaValidator module
 */

import { strict as assert } from 'assert';
import {
  validateSchema,
  extractFromSummary,
  fallbackToTextParsing,
  sanitizeData
} from '../../src/api-clients/schemas/SchemaValidator.js';

describe('SchemaValidator', () => {

  describe('validateSchema', () => {
    describe('Basic Validation', () => {
      it('should validate null/undefined data', () => {
        const schema = { type: 'object', properties: {} };
        const result1 = validateSchema(null, schema);
        const result2 = validateSchema(undefined, schema);

        assert.strictEqual(result1.valid, false);
        assert.strictEqual(result1.errors.length, 1);
        assert.strictEqual(result1.errors[0].code, 'NULL_DATA');

        assert.strictEqual(result2.valid, false);
        assert.strictEqual(result2.errors.length, 1);
      });

      it('should validate type mismatch', () => {
        const schema = { type: 'object' };
        const result = validateSchema('not an object', schema);

        assert.strictEqual(result.valid, false);
        assert.strictEqual(result.errors[0].code, 'TYPE_MISMATCH');
      });

      it('should validate correct type', () => {
        const schema = { type: 'object', properties: {} };
        const result = validateSchema({}, schema);

        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.errors.length, 0);
      });
    });

    describe('Required Fields', () => {
      it('should detect missing required fields', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name']
        };

        const result = validateSchema({ age: 30 }, schema);

        assert.strictEqual(result.valid, false);
        assert.strictEqual(result.errors.length, 1);
        assert.strictEqual(result.errors[0].field, 'name');
        assert.strictEqual(result.errors[0].code, 'MISSING_REQUIRED');
      });

      it('should pass when all required fields present', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name']
        };

        const result = validateSchema({ name: 'John', age: 30 }, schema);

        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.errors.length, 0);
      });

      it('should detect null as missing required field', () => {
        const schema = {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name']
        };

        const result = validateSchema({ name: null }, schema);

        assert.strictEqual(result.valid, false);
        assert.strictEqual(result.errors[0].code, 'MISSING_REQUIRED');
      });
    });

    describe('Property Validation', () => {
      it('should validate property types', () => {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          }
        };

        const result1 = validateSchema({ name: 'John', age: 30 }, schema);
        assert.strictEqual(result1.valid, true);

        const result2 = validateSchema({ name: 'John', age: 'thirty' }, schema);
        assert.strictEqual(result2.valid, false);
        assert.ok(result2.errors.some(e => e.field === 'age' && e.code === 'TYPE_MISMATCH'));
      });

      it('should validate enum values', () => {
        const schema = {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'inactive'] }
          }
        };

        const result1 = validateSchema({ status: 'active' }, schema);
        assert.strictEqual(result1.valid, true);

        const result2 = validateSchema({ status: 'pending' }, schema);
        assert.strictEqual(result2.valid, true); // Warnings only
        assert.strictEqual(result2.warnings.length, 1);
        assert.strictEqual(result2.warnings[0].code, 'INVALID_ENUM');
      });

      it('should validate pattern matching', () => {
        const schema = {
          type: 'object',
          properties: {
            code: { type: 'string', pattern: '^[A-Z]{2}$' }
          }
        };

        const result1 = validateSchema({ code: 'CA' }, schema);
        assert.strictEqual(result1.valid, true);

        const result2 = validateSchema({ code: 'CAL' }, schema);
        assert.strictEqual(result2.valid, true); // Warning only
        assert.strictEqual(result2.warnings.length, 1);
        assert.strictEqual(result2.warnings[0].code, 'PATTERN_MISMATCH');
      });

      it('should validate numeric constraints', () => {
        const schema = {
          type: 'object',
          properties: {
            age: { type: 'number', minimum: 0, maximum: 120 }
          }
        };

        const result1 = validateSchema({ age: 30 }, schema);
        assert.strictEqual(result1.valid, true);

        const result2 = validateSchema({ age: -5 }, schema);
        assert.strictEqual(result2.warnings.length, 1);
        assert.strictEqual(result2.warnings[0].code, 'BELOW_MINIMUM');

        const result3 = validateSchema({ age: 150 }, schema);
        assert.strictEqual(result3.warnings.length, 1);
        assert.strictEqual(result3.warnings[0].code, 'ABOVE_MAXIMUM');
      });

      it('should validate array constraints', () => {
        const schema = {
          type: 'object',
          properties: {
            items: { type: 'array', minItems: 2, maxItems: 5 }
          }
        };

        const result1 = validateSchema({ items: [1, 2, 3] }, schema);
        assert.strictEqual(result1.valid, true);

        const result2 = validateSchema({ items: [1] }, schema);
        assert.strictEqual(result2.warnings.length, 1);
        assert.strictEqual(result2.warnings[0].code, 'TOO_FEW_ITEMS');

        const result3 = validateSchema({ items: [1, 2, 3, 4, 5, 6] }, schema);
        assert.strictEqual(result3.warnings.length, 1);
        assert.strictEqual(result3.warnings[0].code, 'TOO_MANY_ITEMS');
      });
    });

    describe('Complex Schemas', () => {
      it('should validate nested objects', () => {
        const schema = {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' }
              }
            }
          },
          required: ['user']
        };

        const result = validateSchema({ user: { name: 'John', email: 'john@example.com' } }, schema);
        assert.strictEqual(result.valid, true);
      });

      it('should handle optional fields gracefully', () => {
        const schema = {
          type: 'object',
          properties: {
            required: { type: 'string' },
            optional: { type: 'string' }
          },
          required: ['required']
        };

        const result = validateSchema({ required: 'value' }, schema);
        assert.strictEqual(result.valid, true);
      });
    });
  });

  describe('extractFromSummary', () => {
    it('should extract from JSON string', () => {
      const summary = '{"name": "John", "age": 30}';
      const result = extractFromSummary(summary, ['name', 'age']);

      assert.strictEqual(result.name, 'John');
      assert.strictEqual(result.age, 30);
    });

    it('should extract from object', () => {
      const summary = { name: 'John', age: 30 };
      const result = extractFromSummary(summary, ['name', 'age']);

      assert.strictEqual(result.name, 'John');
      assert.strictEqual(result.age, 30);
    });

    it('should use defaults for missing fields', () => {
      const summary = '{"name": "John"}';
      const defaults = { name: 'Unknown', age: 0 };
      const result = extractFromSummary(summary, ['name', 'age'], defaults);

      assert.strictEqual(result.name, 'John');
      assert.strictEqual(result.age, 0);
    });

    it('should return defaults on parse error', () => {
      const summary = 'invalid json';
      const defaults = { name: 'Unknown' };
      const result = extractFromSummary(summary, ['name'], defaults);

      assert.deepStrictEqual(result, defaults);
    });

    it('should handle null/undefined summary', () => {
      const defaults = { name: 'Unknown' };
      const result1 = extractFromSummary(null, ['name'], defaults);
      const result2 = extractFromSummary(undefined, ['name'], defaults);

      assert.deepStrictEqual(result1, defaults);
      assert.deepStrictEqual(result2, defaults);
    });

    it('should skip null values in extraction', () => {
      const summary = { name: 'John', age: null, city: 'NYC' };
      const defaults = { name: '', age: 0, city: '' };
      const result = extractFromSummary(summary, ['name', 'age', 'city'], defaults);

      assert.strictEqual(result.name, 'John');
      assert.strictEqual(result.age, 0); // Default used for null
      assert.strictEqual(result.city, 'NYC');
    });
  });

  describe('fallbackToTextParsing', () => {
    describe('Date Extraction', () => {
      it('should extract ISO dates', () => {
        const text = 'The date was 2024-01-15 and another on 2024-12-31';
        const result = fallbackToTextParsing(text, 'date');

        assert.ok(result.dates);
        assert.strictEqual(result.dates.length, 2);
        assert.ok(result.dates.includes('2024-01-15'));
        assert.ok(result.dates.includes('2024-12-31'));
      });

      it('should extract formatted dates', () => {
        const text = 'Filed on January 15, 2024';
        const result = fallbackToTextParsing(text, 'date');

        assert.ok(result.dates);
        assert.ok(result.dates.length > 0);
      });

      it('should return null when no dates found', () => {
        const text = 'No dates here';
        const result = fallbackToTextParsing(text, 'date');

        assert.strictEqual(result.dates, null);
      });
    });

    describe('Monetary Extraction', () => {
      it('should extract dollar amounts', () => {
        const text = 'Revenue was $100,000.00 and profit $50,000';
        const result = fallbackToTextParsing(text, 'monetary');

        assert.ok(result.monetary_values);
        assert.strictEqual(result.monetary_values.length, 2);
        assert.strictEqual(result.monetary_values[0], 100000);
        assert.strictEqual(result.monetary_values[1], 50000);
      });

      it('should handle millions and billions', () => {
        const text = 'Revenue of $5.5 million and $2 billion in assets';
        const result = fallbackToTextParsing(text, 'monetary');

        assert.ok(result.monetary_values);
        assert.ok(result.monetary_values.some(v => v === 5500000));
        assert.ok(result.monetary_values.some(v => v === 2000000000));
      });

      it('should return null when no amounts found', () => {
        const text = 'No monetary values';
        const result = fallbackToTextParsing(text, 'monetary');

        assert.strictEqual(result.monetary_values, null);
      });
    });

    describe('Citation Extraction', () => {
      it('should extract U.S. Reports citations', () => {
        const text = 'See 410 U.S. 113 and 347 U.S. 483';
        const result = fallbackToTextParsing(text, 'citation');

        assert.ok(result.citations);
        assert.strictEqual(result.citations.length, 2);
      });

      it('should extract Federal Reporter citations', () => {
        const text = 'Case 123 F.3d 456';
        const result = fallbackToTextParsing(text, 'citation');

        assert.ok(result.citations);
        assert.ok(result.citations.length > 0);
      });
    });

    describe('Patent Number Extraction', () => {
      it('should extract US patent numbers', () => {
        const text = 'Patent US1234567A and US9876543B1';
        const result = fallbackToTextParsing(text, 'patent_number');

        assert.ok(result.patent_numbers);
        assert.ok(result.patent_numbers.length >= 1);
      });

      it('should extract comma-formatted patent numbers', () => {
        const text = 'Patent number 9,876,543';
        const result = fallbackToTextParsing(text, 'patent_number');

        assert.ok(result.patent_numbers);
        assert.ok(result.patent_numbers.length > 0);
      });
    });

    describe('Email Extraction', () => {
      it('should extract email addresses', () => {
        const text = 'Contact john@example.com or support@test.org';
        const result = fallbackToTextParsing(text, 'email');

        assert.ok(result.emails);
        assert.strictEqual(result.emails.length, 2);
        assert.ok(result.emails.includes('john@example.com'));
        assert.ok(result.emails.includes('support@test.org'));
      });
    });

    describe('URL Extraction', () => {
      it('should extract URLs', () => {
        const text = 'Visit https://example.com and http://test.org/path';
        const result = fallbackToTextParsing(text, 'url');

        assert.ok(result.urls);
        assert.strictEqual(result.urls.length, 2);
        assert.ok(result.urls.includes('https://example.com'));
      });
    });

    it('should handle empty text', () => {
      const result = fallbackToTextParsing('', 'date');
      assert.deepStrictEqual(result, {});
    });

    it('should handle null text', () => {
      const result = fallbackToTextParsing(null, 'date');
      assert.deepStrictEqual(result, {});
    });

    it('should return empty object for unknown dataType', () => {
      const result = fallbackToTextParsing('some text', 'unknown_type');
      assert.deepStrictEqual(result, {});
    });
  });

  describe('sanitizeData', () => {
    it('should remove null values', () => {
      const data = { name: 'John', age: null, city: 'NYC' };
      const result = sanitizeData(data);

      assert.strictEqual(result.name, 'John');
      assert.strictEqual(result.city, 'NYC');
      assert.strictEqual(result.age, undefined);
    });

    it('should remove undefined values', () => {
      const data = { name: 'John', age: undefined, city: 'NYC' };
      const result = sanitizeData(data);

      assert.strictEqual(result.name, 'John');
      assert.strictEqual(result.city, 'NYC');
      assert.strictEqual(result.age, undefined);
    });

    it('should trim strings', () => {
      const data = { name: '  John  ', city: ' NYC ' };
      const result = sanitizeData(data);

      assert.strictEqual(result.name, 'John');
      assert.strictEqual(result.city, 'NYC');
    });

    it('should remove empty strings', () => {
      const data = { name: 'John', empty: '  ', city: 'NYC' };
      const result = sanitizeData(data);

      assert.strictEqual(result.name, 'John');
      assert.strictEqual(result.city, 'NYC');
      assert.strictEqual(result.empty, undefined);
    });

    it('should filter empty arrays', () => {
      const data = { items: [], valid: [1, 2], nulls: [null, undefined, 1] };
      const result = sanitizeData(data);

      assert.strictEqual(result.items, undefined);
      assert.deepStrictEqual(result.valid, [1, 2]);
      assert.deepStrictEqual(result.nulls, [1]);
    });

    it('should recursively sanitize nested objects', () => {
      const data = {
        user: {
          name: '  John  ',
          age: null,
          address: {
            city: ' NYC ',
            zip: null
          }
        }
      };
      const result = sanitizeData(data);

      assert.strictEqual(result.user.name, 'John');
      assert.strictEqual(result.user.age, undefined);
      assert.strictEqual(result.user.address.city, 'NYC');
      assert.strictEqual(result.user.address.zip, undefined);
    });

    it('should remove empty nested objects', () => {
      const data = { user: {}, other: { name: 'John' } };
      const result = sanitizeData(data);

      assert.strictEqual(result.user, undefined);
      assert.ok(result.other);
      assert.strictEqual(result.other.name, 'John');
    });

    it('should handle null/undefined input', () => {
      assert.deepStrictEqual(sanitizeData(null), {});
      assert.deepStrictEqual(sanitizeData(undefined), {});
    });

    it('should handle non-object input', () => {
      assert.deepStrictEqual(sanitizeData('string'), {});
      assert.deepStrictEqual(sanitizeData(123), {});
    });

    it('should preserve valid values', () => {
      const data = {
        string: 'text',
        number: 123,
        boolean: true,
        zero: 0,
        false_value: false
      };
      const result = sanitizeData(data);

      assert.strictEqual(result.string, 'text');
      assert.strictEqual(result.number, 123);
      assert.strictEqual(result.boolean, true);
      assert.strictEqual(result.zero, 0);
      assert.strictEqual(result.false_value, false);
    });
  });

  describe('Integration Tests', () => {
    it('should extract and validate data flow', () => {
      // Simulate Exa summary response
      const summaryJson = '{"patent_number": "US1234567A", "filing_date": "2024-01-15", "inventors": ["John Doe"]}';

      // Extract
      const extracted = extractFromSummary(summaryJson, ['patent_number', 'filing_date', 'inventors']);

      // Validate
      const schema = {
        type: 'object',
        properties: {
          patent_number: { type: 'string' },
          filing_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          inventors: { type: 'array' }
        },
        required: ['patent_number']
      };

      const validation = validateSchema(extracted, schema);

      assert.strictEqual(validation.valid, true);
      assert.strictEqual(extracted.patent_number, 'US1234567A');
      assert.strictEqual(extracted.filing_date, '2024-01-15');
    });

    it('should fallback to text parsing when schema fails', () => {
      const text = 'Patent US9876543B1 filed on 2024-01-15';

      // Try schema extraction (would fail in real scenario)
      const summary = null;
      const extracted = extractFromSummary(summary, ['patent_number'], {});

      // Fallback to text parsing
      const fallback = {
        ...extracted,
        ...fallbackToTextParsing(text, 'patent_number'),
        ...fallbackToTextParsing(text, 'date')
      };

      assert.ok(fallback.patent_numbers);
      assert.ok(fallback.dates);
    });
  });
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running SchemaValidator tests...');
  // Tests will be run by test runner
}
