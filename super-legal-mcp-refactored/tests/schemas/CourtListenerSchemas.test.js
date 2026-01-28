/**
 * CourtListenerSchemas.test.js
 * Comprehensive unit tests for CourtListener JSON schemas
 */

import { describe, it, expect } from '@jest/globals';
import {
  CourtOpinionSchema,
  JudgeSchema,
  DocketSchema,
  OralArgumentAudioSchema,
  CourtInfoSchema,
  CourtListenerSchemas,
  OpinionTypeEnum,
  PrecedentialStatusEnum,
  PositionTypeEnum,
  PoliticalAffiliationEnum,
  PartyTypeEnum,
  JurisdictionTypeEnum,
  CourtLevelEnum
} from '../../src/api-clients/schemas/CourtListenerSchemas.js';

describe('CourtListenerSchemas', () => {
  // ===== CourtOpinionSchema Tests =====
  describe('CourtOpinionSchema', () => {
    it('should have correct schema structure', () => {
      expect(CourtOpinionSchema).toBeDefined();
      expect(CourtOpinionSchema.type).toBe('object');
      expect(CourtOpinionSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(CourtOpinionSchema.required).toEqual(['case_name']);
    });

    it('should have opinion_type enum', () => {
      const opinionTypeProperty = CourtOpinionSchema.properties.opinion_type;
      expect(opinionTypeProperty.enum).toEqual([
        'Lead Opinion', 'Concurrence', 'Dissent', 'Combined', 'Per Curiam', 'Other'
      ]);
    });

    it('should have precedential_status enum', () => {
      const precedentialStatusProperty = CourtOpinionSchema.properties.precedential_status;
      expect(precedentialStatusProperty.enum).toEqual([
        'Published', 'Unpublished', 'Errata', 'Separate', 'In-chambers', 'Relating-to', 'Unknown'
      ]);
    });

    it('should have cited_cases array', () => {
      const citedCasesProperty = CourtOpinionSchema.properties.cited_cases;
      expect(citedCasesProperty.type).toBe('array');
      expect(citedCasesProperty.items.type).toBe('string');
    });

    it('should have all expected properties', () => {
      const properties = CourtOpinionSchema.properties;
      expect(properties.case_name).toBeDefined();
      expect(properties.citation).toBeDefined();
      expect(properties.court).toBeDefined();
      expect(properties.docket_number).toBeDefined();
      expect(properties.date_filed).toBeDefined();
      expect(properties.judge).toBeDefined();
      expect(properties.opinion_type).toBeDefined();
      expect(properties.precedential_status).toBeDefined();
      expect(properties.summary).toBeDefined();
      expect(properties.syllabus).toBeDefined();
      expect(properties.holding).toBeDefined();
      expect(properties.disposition).toBeDefined();
      expect(properties.cited_cases).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== JudgeSchema Tests =====
  describe('JudgeSchema', () => {
    it('should have correct schema structure', () => {
      expect(JudgeSchema).toBeDefined();
      expect(JudgeSchema.type).toBe('object');
      expect(JudgeSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(JudgeSchema.required).toEqual(['name']);
    });

    it('should have position_type enum', () => {
      const positionTypeProperty = JudgeSchema.properties.position_type;
      expect(positionTypeProperty.enum).toEqual([
        'Judge', 'Chief Judge', 'Associate Justice', 'Chief Justice', 'Magistrate Judge', 'Justice', 'Other'
      ]);
    });

    it('should have political_affiliation enum', () => {
      const politicalAffiliationProperty = JudgeSchema.properties.political_affiliation;
      expect(politicalAffiliationProperty.enum).toEqual([
        'Democrat', 'Republican', 'Independent', 'Other', 'Unknown'
      ]);
    });

    it('should have selection_method enum', () => {
      const selectionMethodProperty = JudgeSchema.properties.selection_method;
      expect(selectionMethodProperty.enum).toEqual([
        'Presidential Appointment', 'Gubernatorial Appointment', 'Legislative Appointment',
        'Election', 'Merit Selection', 'Other'
      ]);
    });

    it('should have education array with object structure', () => {
      const educationProperty = JudgeSchema.properties.education;
      expect(educationProperty.type).toBe('array');
      expect(educationProperty.items.type).toBe('object');
      expect(educationProperty.items.properties.school).toBeDefined();
      expect(educationProperty.items.properties.degree).toBeDefined();
      expect(educationProperty.items.properties.year).toBeDefined();
      expect(educationProperty.items.properties.year.type).toBe('integer');
    });

    it('should have all expected properties', () => {
      const properties = JudgeSchema.properties;
      expect(properties.name).toBeDefined();
      expect(properties.name_first).toBeDefined();
      expect(properties.name_last).toBeDefined();
      expect(properties.court).toBeDefined();
      expect(properties.position_type).toBeDefined();
      expect(properties.appointer).toBeDefined();
      expect(properties.appointment_date).toBeDefined();
      expect(properties.termination_date).toBeDefined();
      expect(properties.political_affiliation).toBeDefined();
      expect(properties.selection_method).toBeDefined();
      expect(properties.education).toBeDefined();
      expect(properties.bio).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== DocketSchema Tests =====
  describe('DocketSchema', () => {
    it('should have correct schema structure', () => {
      expect(DocketSchema).toBeDefined();
      expect(DocketSchema.type).toBe('object');
      expect(DocketSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(DocketSchema.required).toEqual(['case_name', 'docket_number']);
    });

    it('should have parties array with object structure', () => {
      const partiesProperty = DocketSchema.properties.parties;
      expect(partiesProperty.type).toBe('array');
      expect(partiesProperty.items.type).toBe('object');
      expect(partiesProperty.items.properties.name).toBeDefined();
      expect(partiesProperty.items.properties.type).toBeDefined();
      expect(partiesProperty.items.properties.type.enum).toEqual([
        'Plaintiff', 'Defendant', 'Appellant', 'Appellee',
        'Petitioner', 'Respondent', 'Intervenor', 'Other'
      ]);
    });

    it('should have docket_entries array with object structure', () => {
      const docketEntriesProperty = DocketSchema.properties.docket_entries;
      expect(docketEntriesProperty.type).toBe('array');
      expect(docketEntriesProperty.items.type).toBe('object');
      expect(docketEntriesProperty.items.properties.entry_number).toBeDefined();
      expect(docketEntriesProperty.items.properties.entry_number.type).toBe('integer');
      expect(docketEntriesProperty.items.properties.date).toBeDefined();
      expect(docketEntriesProperty.items.properties.description).toBeDefined();
    });

    it('should have all expected properties', () => {
      const properties = DocketSchema.properties;
      expect(properties.case_name).toBeDefined();
      expect(properties.docket_number).toBeDefined();
      expect(properties.court).toBeDefined();
      expect(properties.date_filed).toBeDefined();
      expect(properties.date_terminated).toBeDefined();
      expect(properties.assigned_to).toBeDefined();
      expect(properties.referred_to).toBeDefined();
      expect(properties.nature_of_suit).toBeDefined();
      expect(properties.cause).toBeDefined();
      expect(properties.parties).toBeDefined();
      expect(properties.docket_entries).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== OralArgumentAudioSchema Tests =====
  describe('OralArgumentAudioSchema', () => {
    it('should have correct schema structure', () => {
      expect(OralArgumentAudioSchema).toBeDefined();
      expect(OralArgumentAudioSchema.type).toBe('object');
      expect(OralArgumentAudioSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(OralArgumentAudioSchema.required).toEqual(['case_name', 'court']);
    });

    it('should have judges array', () => {
      const judgesProperty = OralArgumentAudioSchema.properties.judges;
      expect(judgesProperty.type).toBe('array');
      expect(judgesProperty.items.type).toBe('string');
    });

    it('should have duration with minimum validation', () => {
      const durationProperty = OralArgumentAudioSchema.properties.duration;
      expect(durationProperty.type).toBe('integer');
      expect(durationProperty.minimum).toBe(0);
    });

    it('should have duration_minutes with minimum validation', () => {
      const durationMinutesProperty = OralArgumentAudioSchema.properties.duration_minutes;
      expect(durationMinutesProperty.type).toBe('number');
      expect(durationMinutesProperty.minimum).toBe(0);
    });

    it('should have has_transcript boolean field', () => {
      const hasTranscriptProperty = OralArgumentAudioSchema.properties.has_transcript;
      expect(hasTranscriptProperty.type).toBe('boolean');
    });

    it('should have all expected properties', () => {
      const properties = OralArgumentAudioSchema.properties;
      expect(properties.case_name).toBeDefined();
      expect(properties.docket_number).toBeDefined();
      expect(properties.court).toBeDefined();
      expect(properties.date_argued).toBeDefined();
      expect(properties.judges).toBeDefined();
      expect(properties.duration).toBeDefined();
      expect(properties.duration_minutes).toBeDefined();
      expect(properties.has_transcript).toBeDefined();
      expect(properties.transcript).toBeDefined();
      expect(properties.audio_url).toBeDefined();
      expect(properties.summary).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== CourtInfoSchema Tests =====
  describe('CourtInfoSchema', () => {
    it('should have correct schema structure', () => {
      expect(CourtInfoSchema).toBeDefined();
      expect(CourtInfoSchema.type).toBe('object');
      expect(CourtInfoSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(CourtInfoSchema.required).toEqual(['name']);
    });

    it('should have jurisdiction enum', () => {
      const jurisdictionProperty = CourtInfoSchema.properties.jurisdiction;
      expect(jurisdictionProperty.enum).toEqual([
        'Federal', 'State', 'Tribal', 'International', 'Other'
      ]);
    });

    it('should have level enum', () => {
      const levelProperty = CourtInfoSchema.properties.level;
      expect(levelProperty.enum).toEqual([
        'Supreme Court', 'Appellate', 'District', 'Trial', 'Bankruptcy', 'Special', 'Other'
      ]);
    });

    it('should have in_use boolean field', () => {
      const inUseProperty = CourtInfoSchema.properties.in_use;
      expect(inUseProperty.type).toBe('boolean');
    });

    it('should have has_opinion_scraper boolean field', () => {
      const hasOpinionScraperProperty = CourtInfoSchema.properties.has_opinion_scraper;
      expect(hasOpinionScraperProperty.type).toBe('boolean');
    });

    it('should have has_oral_argument_scraper boolean field', () => {
      const hasOralArgumentScraperProperty = CourtInfoSchema.properties.has_oral_argument_scraper;
      expect(hasOralArgumentScraperProperty.type).toBe('boolean');
    });

    it('should have all expected properties', () => {
      const properties = CourtInfoSchema.properties;
      expect(properties.name).toBeDefined();
      expect(properties.short_name).toBeDefined();
      expect(properties.court_id).toBeDefined();
      expect(properties.jurisdiction).toBeDefined();
      expect(properties.level).toBeDefined();
      expect(properties.location).toBeDefined();
      expect(properties.start_date).toBeDefined();
      expect(properties.end_date).toBeDefined();
      expect(properties.in_use).toBeDefined();
      expect(properties.has_opinion_scraper).toBeDefined();
      expect(properties.has_oral_argument_scraper).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== Enum Tests =====
  describe('OpinionTypeEnum', () => {
    it('should contain all valid opinion types', () => {
      expect(OpinionTypeEnum).toEqual([
        'Lead Opinion', 'Concurrence', 'Dissent', 'Combined', 'Per Curiam', 'Other'
      ]);
    });
  });

  describe('PrecedentialStatusEnum', () => {
    it('should contain all valid precedential statuses', () => {
      expect(PrecedentialStatusEnum).toEqual([
        'Published', 'Unpublished', 'Errata', 'Separate', 'In-chambers', 'Relating-to', 'Unknown'
      ]);
    });
  });

  describe('PositionTypeEnum', () => {
    it('should contain all valid position types', () => {
      expect(PositionTypeEnum).toEqual([
        'Judge', 'Chief Judge', 'Associate Justice', 'Chief Justice', 'Magistrate Judge', 'Justice', 'Other'
      ]);
    });
  });

  describe('PoliticalAffiliationEnum', () => {
    it('should contain all valid political affiliations', () => {
      expect(PoliticalAffiliationEnum).toEqual([
        'Democrat', 'Republican', 'Independent', 'Other', 'Unknown'
      ]);
    });
  });

  describe('PartyTypeEnum', () => {
    it('should contain all valid party types', () => {
      expect(PartyTypeEnum).toEqual([
        'Plaintiff', 'Defendant', 'Appellant', 'Appellee',
        'Petitioner', 'Respondent', 'Intervenor', 'Other'
      ]);
    });
  });

  describe('JurisdictionTypeEnum', () => {
    it('should contain all valid jurisdiction types', () => {
      expect(JurisdictionTypeEnum).toEqual([
        'Federal', 'State', 'Tribal', 'International', 'Other'
      ]);
    });
  });

  describe('CourtLevelEnum', () => {
    it('should contain all valid court levels', () => {
      expect(CourtLevelEnum).toEqual([
        'Supreme Court', 'Appellate', 'District', 'Trial', 'Bankruptcy', 'Special', 'Other'
      ]);
    });
  });

  // ===== Export Tests =====
  describe('CourtListenerSchemas Export', () => {
    it('should export all schemas in CourtListenerSchemas object', () => {
      expect(CourtListenerSchemas).toBeDefined();
      expect(CourtListenerSchemas.court_opinion).toBe(CourtOpinionSchema);
      expect(CourtListenerSchemas.judge).toBe(JudgeSchema);
      expect(CourtListenerSchemas.docket).toBe(DocketSchema);
      expect(CourtListenerSchemas.oral_argument_audio).toBe(OralArgumentAudioSchema);
      expect(CourtListenerSchemas.court_info).toBe(CourtInfoSchema);
    });

    it('should have exactly 5 schemas', () => {
      const schemaKeys = Object.keys(CourtListenerSchemas);
      expect(schemaKeys.length).toBe(5);
    });
  });

  // ===== Schema Compatibility Tests =====
  describe('Schema Compatibility', () => {
    it('all schemas should have $schema property', () => {
      expect(CourtOpinionSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(JudgeSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(DocketSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(OralArgumentAudioSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(CourtInfoSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
    });
  });

  // ===== Property Description Tests =====
  describe('Property Descriptions', () => {
    it('CourtOpinionSchema properties should have descriptions', () => {
      const properties = CourtOpinionSchema.properties;
      expect(properties.case_name.description).toBeDefined();
      expect(properties.citation.description).toBeDefined();
      expect(properties.court.description).toBeDefined();
      expect(properties.opinion_type.description).toBeDefined();
    });

    it('JudgeSchema properties should have descriptions', () => {
      const properties = JudgeSchema.properties;
      expect(properties.name.description).toBeDefined();
      expect(properties.court.description).toBeDefined();
      expect(properties.position_type.description).toBeDefined();
      expect(properties.political_affiliation.description).toBeDefined();
    });

    it('DocketSchema properties should have descriptions', () => {
      const properties = DocketSchema.properties;
      expect(properties.case_name.description).toBeDefined();
      expect(properties.docket_number.description).toBeDefined();
      expect(properties.court.description).toBeDefined();
      expect(properties.parties.description).toBeDefined();
    });

    it('OralArgumentAudioSchema properties should have descriptions', () => {
      const properties = OralArgumentAudioSchema.properties;
      expect(properties.case_name.description).toBeDefined();
      expect(properties.court.description).toBeDefined();
      expect(properties.has_transcript.description).toBeDefined();
      expect(properties.duration.description).toBeDefined();
    });

    it('CourtInfoSchema properties should have descriptions', () => {
      const properties = CourtInfoSchema.properties;
      expect(properties.name.description).toBeDefined();
      expect(properties.jurisdiction.description).toBeDefined();
      expect(properties.level.description).toBeDefined();
      expect(properties.in_use.description).toBeDefined();
    });
  });
});
