/**
 * GovInfoSchemas.test.js
 * Comprehensive unit tests for GovInfo/USC JSON schemas
 */

import { describe, it, expect } from '@jest/globals';
import {
  USCSearchResultSchema,
  USCSectionSchema,
  USCTitleStructureSchema,
  GovInfoSchemas
} from '../../src/api-clients/schemas/GovInfoSchemas.js';

describe('GovInfoSchemas', () => {
  // ===== USCSearchResultSchema Tests =====
  describe('USCSearchResultSchema', () => {
    it('should have correct schema structure', () => {
      expect(USCSearchResultSchema).toBeDefined();
      expect(USCSearchResultSchema.type).toBe('object');
      expect(USCSearchResultSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(USCSearchResultSchema.required).toEqual(['usc_citation', 'title_number']);
    });

    it('should have usc_citation with pattern validation', () => {
      const uscCitationProperty = USCSearchResultSchema.properties.usc_citation;
      expect(uscCitationProperty.type).toBe('string');
      expect(uscCitationProperty.pattern).toBe('^\\d+\\s+(U\\.S\\.C\\.|USC)\\s*§?\\s*\\d+[a-z]?');
    });

    it('should have title_number with range validation', () => {
      const titleNumberProperty = USCSearchResultSchema.properties.title_number;
      expect(titleNumberProperty.type).toBe('integer');
      expect(titleNumberProperty.minimum).toBe(1);
      expect(titleNumberProperty.maximum).toBe(54);
    });

    it('should have relevance_score with range validation', () => {
      const relevanceScoreProperty = USCSearchResultSchema.properties.relevance_score;
      expect(relevanceScoreProperty.type).toBe('number');
      expect(relevanceScoreProperty.minimum).toBe(0);
      expect(relevanceScoreProperty.maximum).toBe(1);
    });

    it('should have url with format validation', () => {
      const urlProperty = USCSearchResultSchema.properties.url;
      expect(urlProperty.type).toBe('string');
      expect(urlProperty.format).toBe('uri');
    });

    it('should have all expected properties', () => {
      const properties = USCSearchResultSchema.properties;
      expect(properties.usc_citation).toBeDefined();
      expect(properties.title_number).toBeDefined();
      expect(properties.section_number).toBeDefined();
      expect(properties.section_title).toBeDefined();
      expect(properties.chapter).toBeDefined();
      expect(properties.url).toBeDefined();
      expect(properties.published_date).toBeDefined();
      expect(properties.snippet).toBeDefined();
      expect(properties.relevance_score).toBeDefined();
    });
  });

  // ===== USCSectionSchema Tests =====
  describe('USCSectionSchema', () => {
    it('should have correct schema structure', () => {
      expect(USCSectionSchema).toBeDefined();
      expect(USCSectionSchema.type).toBe('object');
      expect(USCSectionSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(USCSectionSchema.required).toEqual(['title_number', 'section_number', 'usc_citation']);
    });

    it('should have title_number with range validation', () => {
      const titleNumberProperty = USCSectionSchema.properties.title_number;
      expect(titleNumberProperty.type).toBe('integer');
      expect(titleNumberProperty.minimum).toBe(1);
      expect(titleNumberProperty.maximum).toBe(54);
    });

    it('should have usc_citation with pattern validation', () => {
      const uscCitationProperty = USCSectionSchema.properties.usc_citation;
      expect(uscCitationProperty.type).toBe('string');
      expect(uscCitationProperty.pattern).toBe('^\\d+\\s+(U\\.S\\.C\\.|USC)\\s*§?\\s*\\d+[a-z]?');
    });

    it('should have subsections array with object structure', () => {
      const subsectionsProperty = USCSectionSchema.properties.subsections;
      expect(subsectionsProperty.type).toBe('array');
      expect(subsectionsProperty.items.type).toBe('object');
      expect(subsectionsProperty.items.properties.designation).toBeDefined();
      expect(subsectionsProperty.items.properties.designation.type).toBe('string');
      expect(subsectionsProperty.items.properties.text).toBeDefined();
      expect(subsectionsProperty.items.properties.text.type).toBe('string');
    });

    it('should have amendments array with object structure', () => {
      const amendmentsProperty = USCSectionSchema.properties.amendments;
      expect(amendmentsProperty.type).toBe('array');
      expect(amendmentsProperty.items.type).toBe('object');
      expect(amendmentsProperty.items.properties.date).toBeDefined();
      expect(amendmentsProperty.items.properties.public_law).toBeDefined();
      expect(amendmentsProperty.items.properties.description).toBeDefined();
    });

    it('should have url with format validation', () => {
      const urlProperty = USCSectionSchema.properties.url;
      expect(urlProperty.type).toBe('string');
      expect(urlProperty.format).toBe('uri');
    });

    it('should have all expected properties', () => {
      const properties = USCSectionSchema.properties;
      expect(properties.title_number).toBeDefined();
      expect(properties.title_name).toBeDefined();
      expect(properties.section_number).toBeDefined();
      expect(properties.section_title).toBeDefined();
      expect(properties.usc_citation).toBeDefined();
      expect(properties.chapter).toBeDefined();
      expect(properties.text).toBeDefined();
      expect(properties.subsections).toBeDefined();
      expect(properties.url).toBeDefined();
      expect(properties.published_date).toBeDefined();
      expect(properties.effective_date).toBeDefined();
      expect(properties.amendments).toBeDefined();
    });
  });

  // ===== USCTitleStructureSchema Tests =====
  describe('USCTitleStructureSchema', () => {
    it('should have correct schema structure', () => {
      expect(USCTitleStructureSchema).toBeDefined();
      expect(USCTitleStructureSchema.type).toBe('object');
      expect(USCTitleStructureSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(USCTitleStructureSchema.required).toEqual(['title_number', 'title_name']);
    });

    it('should have title_number with range validation', () => {
      const titleNumberProperty = USCTitleStructureSchema.properties.title_number;
      expect(titleNumberProperty.type).toBe('integer');
      expect(titleNumberProperty.minimum).toBe(1);
      expect(titleNumberProperty.maximum).toBe(54);
    });

    it('should have year with range validation', () => {
      const yearProperty = USCTitleStructureSchema.properties.year;
      expect(yearProperty.type).toBe('integer');
      expect(yearProperty.minimum).toBe(1900);
      expect(yearProperty.maximum).toBe(2100);
    });

    it('should have total_sections with minimum validation', () => {
      const totalSectionsProperty = USCTitleStructureSchema.properties.total_sections;
      expect(totalSectionsProperty.type).toBe('integer');
      expect(totalSectionsProperty.minimum).toBe(0);
    });

    it('should have enacted_positive_law boolean field', () => {
      const enactedPositiveLawProperty = USCTitleStructureSchema.properties.enacted_positive_law;
      expect(enactedPositiveLawProperty.type).toBe('boolean');
    });

    it('should have chapters array with complex object structure', () => {
      const chaptersProperty = USCTitleStructureSchema.properties.chapters;
      expect(chaptersProperty.type).toBe('array');
      expect(chaptersProperty.items.type).toBe('object');
      expect(chaptersProperty.items.properties.chapter_number).toBeDefined();
      expect(chaptersProperty.items.properties.chapter_name).toBeDefined();
      expect(chaptersProperty.items.properties.sections).toBeDefined();
      expect(chaptersProperty.items.properties.sections.type).toBe('array');
      expect(chaptersProperty.items.properties.sections.items.type).toBe('string');
    });

    it('should have sources array with object structure', () => {
      const sourcesProperty = USCTitleStructureSchema.properties.sources;
      expect(sourcesProperty.type).toBe('array');
      expect(sourcesProperty.items.type).toBe('object');
      expect(sourcesProperty.items.properties.title).toBeDefined();
      expect(sourcesProperty.items.properties.url).toBeDefined();
      expect(sourcesProperty.items.properties.url.format).toBe('uri');
      expect(sourcesProperty.items.properties.published_date).toBeDefined();
    });

    it('should have all expected properties', () => {
      const properties = USCTitleStructureSchema.properties;
      expect(properties.title_number).toBeDefined();
      expect(properties.title_name).toBeDefined();
      expect(properties.year).toBeDefined();
      expect(properties.chapters).toBeDefined();
      expect(properties.total_sections).toBeDefined();
      expect(properties.enacted_positive_law).toBeDefined();
      expect(properties.sources).toBeDefined();
    });
  });

  // ===== Export Tests =====
  describe('GovInfoSchemas Export', () => {
    it('should export all schemas in GovInfoSchemas object', () => {
      expect(GovInfoSchemas).toBeDefined();
      expect(GovInfoSchemas.usc_search_result).toBe(USCSearchResultSchema);
      expect(GovInfoSchemas.usc_section).toBe(USCSectionSchema);
      expect(GovInfoSchemas.usc_title_structure).toBe(USCTitleStructureSchema);
    });

    it('should have exactly 3 schemas', () => {
      const schemaKeys = Object.keys(GovInfoSchemas);
      expect(schemaKeys.length).toBe(3);
    });
  });

  // ===== Schema Compatibility Tests =====
  describe('Schema Compatibility', () => {
    it('all schemas should have $schema property', () => {
      expect(USCSearchResultSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(USCSectionSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(USCTitleStructureSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
    });
  });

  // ===== Property Description Tests =====
  describe('Property Descriptions', () => {
    it('USCSearchResultSchema properties should have descriptions', () => {
      const properties = USCSearchResultSchema.properties;
      expect(properties.usc_citation.description).toBeDefined();
      expect(properties.title_number.description).toBeDefined();
      expect(properties.section_number.description).toBeDefined();
      expect(properties.section_title.description).toBeDefined();
    });

    it('USCSectionSchema properties should have descriptions', () => {
      const properties = USCSectionSchema.properties;
      expect(properties.title_number.description).toBeDefined();
      expect(properties.section_number.description).toBeDefined();
      expect(properties.usc_citation.description).toBeDefined();
      expect(properties.text.description).toBeDefined();
    });

    it('USCTitleStructureSchema properties should have descriptions', () => {
      const properties = USCTitleStructureSchema.properties;
      expect(properties.title_number.description).toBeDefined();
      expect(properties.title_name.description).toBeDefined();
      expect(properties.year.description).toBeDefined();
      expect(properties.chapters.description).toBeDefined();
    });
  });

  // ===== Pattern Validation Tests =====
  describe('Pattern Validations', () => {
    it('usc_citation pattern should match valid USC citations', () => {
      const pattern = new RegExp(USCSearchResultSchema.properties.usc_citation.pattern);
      expect(pattern.test('42 U.S.C. § 1983')).toBe(true);
      expect(pattern.test('18 USC § 242')).toBe(true);
      expect(pattern.test('26 U.S.C. 501')).toBe(true);
      expect(pattern.test('invalid citation')).toBe(false);
    });
  });
});
