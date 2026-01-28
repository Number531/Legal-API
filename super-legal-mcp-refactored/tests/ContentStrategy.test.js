/**
 * ContentStrategy.test.js
 * Unit tests for ContentStrategy module
 */

import { strict as assert } from 'assert';
import { ContentStrategy, StrategyType } from '../src/api-clients/ContentStrategy.js';
import { createSchema } from '../src/api-clients/schemas/BaseSchemas.js';

describe('ContentStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new ContentStrategy();
  });

  describe('Constructor and Schema Registry', () => {
    it('should initialize with empty schema registry', () => {
      assert.strictEqual(typeof strategy.schemaRegistry, 'object');
      assert.strictEqual(Object.keys(strategy.schemaRegistry).length, 0);
    });

    it('should accept schema registry in constructor', () => {
      const schemas = { test: { type: 'object' } };
      const customStrategy = new ContentStrategy(schemas);
      assert.strictEqual(customStrategy.schemaRegistry, schemas);
    });

    it('should register and retrieve schemas', () => {
      const schema = createSchema('Test', { name: { type: 'string' } });
      strategy.registerSchema('test_data', schema);

      const retrieved = strategy.getSchema('test_data');
      assert.strictEqual(retrieved.title, 'Test');
    });

    it('should return null for unregistered schema', () => {
      const retrieved = strategy.getSchema('nonexistent');
      assert.strictEqual(retrieved, null);
    });
  });

  describe('Strategy Determination', () => {
    describe('SUMMARY_WITH_SCHEMA Strategy', () => {
      it('should select schema strategy when dataType matches registered schema', () => {
        const schema = createSchema('Patent', { patent_number: { type: 'string' } }, ['patent_number']);
        strategy.registerSchema('patent', schema);

        const result = strategy.determine({
          dataType: 'patent',
          query: 'find patent',
          limit: 5
        });

        assert.strictEqual(result.type, StrategyType.SUMMARY_WITH_SCHEMA);
        assert.ok(result.config.summary);
        assert.ok(result.config.summary.schema);
        assert.strictEqual(result.dataType, 'patent');
        assert.ok(Array.isArray(result.expectedFields));
      });

      it('should include required fields in response', () => {
        const schema = createSchema(
          'Test',
          { field1: { type: 'string' }, field2: { type: 'number' } },
          ['field1']
        );
        strategy.registerSchema('test', schema);

        const result = strategy.determine({ dataType: 'test', query: 'test' });

        assert.deepStrictEqual(result.expectedFields, ['field1']);
      });

      it('should generate appropriate schema query', () => {
        const schema = createSchema('Filing', { accession: { type: 'string' } });
        strategy.registerSchema('sec_filing', schema);

        const result = strategy.determine({ dataType: 'sec_filing', query: 'find filing' });

        assert.ok(result.config.summary.query);
        assert.ok(result.config.summary.query.includes('SEC'));
      });
    });

    describe('TEXT Strategy', () => {
      it('should select text strategy when includeFullText is true', () => {
        const result = strategy.determine({
          query: 'test query',
          includeFullText: true,
          limit: 10
        });

        assert.strictEqual(result.type, StrategyType.TEXT);
        assert.strictEqual(result.config.text, true);
        assert.strictEqual(result.config.summary, undefined);
      });

      it('should select text strategy for low limit queries (≤3)', () => {
        const result1 = strategy.determine({ query: 'test', limit: 1 });
        const result2 = strategy.determine({ query: 'test', limit: 3 });
        const result3 = strategy.determine({ query: 'test', limit: 5 });

        assert.strictEqual(result1.type, StrategyType.TEXT);
        assert.strictEqual(result2.type, StrategyType.TEXT);
        assert.notStrictEqual(result3.type, StrategyType.TEXT);
      });

      it('should prioritize text over schema for low limits', () => {
        const schema = createSchema('Test', { field: { type: 'string' } });
        strategy.registerSchema('test', schema);

        const result = strategy.determine({
          dataType: 'test',
          query: 'query',
          limit: 2
        });

        assert.strictEqual(result.type, StrategyType.TEXT);
      });
    });

    describe('TEXT_WITH_SUMMARY Strategy', () => {
      it('should select comprehensive strategy when comprehensive=true', () => {
        const result = strategy.determine({
          query: 'test',
          comprehensive: true,
          limit: 10
        });

        assert.strictEqual(result.type, StrategyType.TEXT_WITH_SUMMARY);
        assert.strictEqual(result.config.text, true);
        assert.ok(result.config.summary);
        assert.ok(result.config.summary.query);
      });

      it('should use provided highlightQuery in comprehensive mode', () => {
        const result = strategy.determine({
          query: 'original query',
          highlightQuery: 'custom summary query',
          comprehensive: true
        });

        assert.strictEqual(result.config.summary.query, 'custom summary query');
      });

      it('should fallback to main query if no highlightQuery', () => {
        const result = strategy.determine({
          query: 'main query',
          comprehensive: true
        });

        assert.strictEqual(result.config.summary.query, 'main query');
      });
    });

    describe('SUMMARY_QUERY Strategy (Default)', () => {
      it('should select summary query strategy by default', () => {
        const result = strategy.determine({
          query: 'test query',
          limit: 10
        });

        assert.strictEqual(result.type, StrategyType.SUMMARY_QUERY);
        assert.ok(result.config.summary);
        assert.strictEqual(result.config.summary.query, 'test query');
        assert.strictEqual(result.config.summary.schema, undefined);
      });

      it('should use highlightQuery when provided (legacy support)', () => {
        const result = strategy.determine({
          query: 'main query',
          highlightQuery: 'highlight terms',
          limit: 10
        });

        assert.strictEqual(result.type, StrategyType.SUMMARY_QUERY);
        assert.strictEqual(result.config.summary.query, 'highlight terms');
      });

      it('should handle undefined dataType gracefully', () => {
        const result = strategy.determine({
          dataType: undefined,
          query: 'test query'
        });

        assert.strictEqual(result.type, StrategyType.SUMMARY_QUERY);
      });

      it('should handle dataType with no matching schema', () => {
        const result = strategy.determine({
          dataType: 'nonexistent_type',
          query: 'test query'
        });

        assert.strictEqual(result.type, StrategyType.SUMMARY_QUERY);
      });
    });
  });

  describe('Schema Query Generation', () => {
    it('should generate appropriate query for SEC filings', () => {
      const schema = createSchema('Filing', { accession: { type: 'string' } });
      strategy.registerSchema('sec_filing', schema);

      const result = strategy.determine({ dataType: 'sec_filing', query: 'test' });

      assert.ok(result.config.summary.query.toLowerCase().includes('sec'));
      assert.ok(result.config.summary.query.toLowerCase().includes('filing'));
    });

    it('should generate appropriate query for patents', () => {
      const schema = createSchema('Patent', { patent_number: { type: 'string' } });
      strategy.registerSchema('patent', schema);

      const result = strategy.determine({ dataType: 'patent', query: 'test' });

      assert.ok(result.config.summary.query.toLowerCase().includes('patent'));
      assert.ok(result.config.summary.query.toLowerCase().includes('inventor'));
    });

    it('should generate appropriate query for EPA facilities', () => {
      const schema = createSchema('Facility', { registry_id: { type: 'string' } });
      strategy.registerSchema('epa_facility', schema);

      const result = strategy.determine({ dataType: 'epa_facility', query: 'test' });

      assert.ok(result.config.summary.query.toLowerCase().includes('facility'));
    });

    it('should use default query for unrecognized dataTypes', () => {
      const schema = createSchema('Custom', { field: { type: 'string' } });
      strategy.registerSchema('custom_type', schema);

      const result = strategy.determine({ dataType: 'custom_type', query: 'my query' });

      assert.ok(result.config.summary.query.includes('my query'));
    });
  });

  describe('Strategy Priority', () => {
    it('should prioritize schema over text for normal limits', () => {
      const schema = createSchema('Test', { field: { type: 'string' } });
      strategy.registerSchema('test', schema);

      const result = strategy.determine({
        dataType: 'test',
        query: 'query',
        limit: 10
      });

      assert.strictEqual(result.type, StrategyType.SUMMARY_WITH_SCHEMA);
    });

    it('should prioritize includeFullText over everything', () => {
      const schema = createSchema('Test', { field: { type: 'string' } });
      strategy.registerSchema('test', schema);

      const result = strategy.determine({
        dataType: 'test',
        query: 'query',
        includeFullText: true,
        comprehensive: true
      });

      assert.strictEqual(result.type, StrategyType.TEXT);
    });

    it('should prioritize comprehensive after text', () => {
      const result = strategy.determine({
        query: 'test',
        comprehensive: true,
        limit: 10
      });

      assert.strictEqual(result.type, StrategyType.TEXT_WITH_SUMMARY);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options', () => {
      const result = strategy.determine({});

      assert.ok(result.type);
      assert.ok(result.config);
    });

    it('should handle missing query', () => {
      const result = strategy.determine({ limit: 5 });

      assert.ok(result.type);
      assert.ok(result.config);
    });

    it('should handle zero limit', () => {
      const result = strategy.determine({ query: 'test', limit: 0 });

      assert.strictEqual(result.type, StrategyType.TEXT);
    });

    it('should handle negative limit', () => {
      const result = strategy.determine({ query: 'test', limit: -1 });

      assert.strictEqual(result.type, StrategyType.TEXT);
    });

    it('should default limit to 10 when not provided', () => {
      const result = strategy.determine({ query: 'test' });

      // Should not select TEXT strategy (which triggers for limit ≤ 3)
      assert.notStrictEqual(result.type, StrategyType.TEXT);
    });
  });

  describe('analyzeStrategyUsage', () => {
    it('should analyze strategy distribution', () => {
      const selections = [
        { type: StrategyType.SUMMARY_WITH_SCHEMA },
        { type: StrategyType.SUMMARY_WITH_SCHEMA },
        { type: StrategyType.TEXT },
        { type: StrategyType.SUMMARY_QUERY }
      ];

      const analysis = ContentStrategy.analyzeStrategyUsage(selections);

      assert.strictEqual(analysis.total, 4);
      assert.strictEqual(analysis.counts[StrategyType.SUMMARY_WITH_SCHEMA], 2);
      assert.strictEqual(analysis.counts[StrategyType.TEXT], 1);
      assert.strictEqual(analysis.counts[StrategyType.SUMMARY_QUERY], 1);
      assert.strictEqual(analysis.percentages[StrategyType.SUMMARY_WITH_SCHEMA], '50.0');
    });

    it('should handle empty selections', () => {
      const analysis = ContentStrategy.analyzeStrategyUsage([]);

      assert.strictEqual(analysis.total, 0);
      assert.strictEqual(analysis.percentages[StrategyType.TEXT], 0);
    });

    it('should handle single selection', () => {
      const selections = [{ type: StrategyType.TEXT }];
      const analysis = ContentStrategy.analyzeStrategyUsage(selections);

      assert.strictEqual(analysis.total, 1);
      assert.strictEqual(analysis.percentages[StrategyType.TEXT], '100.0');
    });
  });
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running ContentStrategy tests...');
}
