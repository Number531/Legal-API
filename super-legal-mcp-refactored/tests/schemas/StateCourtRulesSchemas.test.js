/**
 * StateCourtRulesSchemas.test.js
 * Comprehensive unit tests for State Court Rules JSON schemas
 */

import { describe, it, expect } from '@jest/globals';
import {
  StateCourtRuleSchema,
  FormattingRequirementsSchema,
  ElectronicFilingRulesSchema,
  LocalRulesSchema,
  CourtProcedureSchema,
  RuleUpdateSchema,
  DocumentTemplateSchema,
  StateCourtRulesSchemas,
  StateCodeType,
  RuleTypeEnum,
  CourtLevelEnum,
  DocumentTypeEnum,
  ProcedureTypeEnum
} from '../../src/api-clients/schemas/StateCourtRulesSchemas.js';

describe('StateCourtRulesSchemas', () => {
  // ===== StateCourtRuleSchema Tests =====
  describe('StateCourtRuleSchema', () => {
    it('should have correct schema structure', () => {
      expect(StateCourtRuleSchema).toBeDefined();
      expect(StateCourtRuleSchema.type).toBe('object');
      expect(StateCourtRuleSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(StateCourtRuleSchema.required).toEqual(['title', 'state']);
    });

    it('should validate state code pattern', () => {
      const stateProperty = StateCourtRuleSchema.properties.state;
      expect(stateProperty.type).toBe('string');
      expect(stateProperty.pattern).toBe('^[A-Z]{2}$');
    });

    it('should have rule_type enum', () => {
      const ruleTypeProperty = StateCourtRuleSchema.properties.rule_type;
      expect(ruleTypeProperty.enum).toEqual([
        'formatting', 'procedural', 'electronic', 'local',
        'discovery', 'appellate', 'emergency'
      ]);
    });

    it('should have court_level enum', () => {
      const courtLevelProperty = StateCourtRuleSchema.properties.court_level;
      expect(courtLevelProperty.enum).toEqual([
        'supreme', 'appellate', 'superior', 'circuit',
        'district', 'county', 'municipal', 'other'
      ]);
    });

    it('should have all expected properties', () => {
      const properties = StateCourtRuleSchema.properties;
      expect(properties.title).toBeDefined();
      expect(properties.state).toBeDefined();
      expect(properties.rule_number).toBeDefined();
      expect(properties.rule_type).toBeDefined();
      expect(properties.court_level).toBeDefined();
      expect(properties.county).toBeDefined();
      expect(properties.summary).toBeDefined();
      expect(properties.effective_date).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== FormattingRequirementsSchema Tests =====
  describe('FormattingRequirementsSchema', () => {
    it('should have correct schema structure', () => {
      expect(FormattingRequirementsSchema).toBeDefined();
      expect(FormattingRequirementsSchema.type).toBe('object');
      expect(FormattingRequirementsSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(FormattingRequirementsSchema.required).toEqual(['title', 'state']);
    });

    it('should have font_requirements object', () => {
      const fontReqs = FormattingRequirementsSchema.properties.font_requirements;
      expect(fontReqs.type).toBe('object');
      expect(fontReqs.properties.typeface).toBeDefined();
      expect(fontReqs.properties.size).toBeDefined();
    });

    it('should have margin_requirements object with all sides', () => {
      const marginReqs = FormattingRequirementsSchema.properties.margin_requirements;
      expect(marginReqs.type).toBe('object');
      expect(marginReqs.properties.top).toBeDefined();
      expect(marginReqs.properties.bottom).toBeDefined();
      expect(marginReqs.properties.left).toBeDefined();
      expect(marginReqs.properties.right).toBeDefined();
    });

    it('should have document_type enum', () => {
      const docTypeProperty = FormattingRequirementsSchema.properties.document_type;
      expect(docTypeProperty.enum).toEqual([
        'complaint', 'motion', 'brief', 'order',
        'pleading', 'discovery', 'general'
      ]);
    });

    it('should have all expected properties', () => {
      const properties = FormattingRequirementsSchema.properties;
      expect(properties.title).toBeDefined();
      expect(properties.state).toBeDefined();
      expect(properties.court_level).toBeDefined();
      expect(properties.document_type).toBeDefined();
      expect(properties.font_requirements).toBeDefined();
      expect(properties.margin_requirements).toBeDefined();
      expect(properties.line_spacing).toBeDefined();
      expect(properties.page_limit).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== ElectronicFilingRulesSchema Tests =====
  describe('ElectronicFilingRulesSchema', () => {
    it('should have correct schema structure', () => {
      expect(ElectronicFilingRulesSchema).toBeDefined();
      expect(ElectronicFilingRulesSchema.type).toBe('object');
      expect(ElectronicFilingRulesSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(ElectronicFilingRulesSchema.required).toEqual(['title', 'state']);
    });

    it('should have mandatory boolean field', () => {
      const mandatoryProperty = ElectronicFilingRulesSchema.properties.mandatory;
      expect(mandatoryProperty.type).toBe('boolean');
    });

    it('should have file_formats array', () => {
      const fileFormatsProperty = ElectronicFilingRulesSchema.properties.file_formats;
      expect(fileFormatsProperty.type).toBe('array');
      expect(fileFormatsProperty.items.type).toBe('string');
    });

    it('should have pdf_requirements array', () => {
      const pdfReqsProperty = ElectronicFilingRulesSchema.properties.pdf_requirements;
      expect(pdfReqsProperty.type).toBe('array');
      expect(pdfReqsProperty.items.type).toBe('string');
    });

    it('should have technical_requirements array', () => {
      const techReqsProperty = ElectronicFilingRulesSchema.properties.technical_requirements;
      expect(techReqsProperty.type).toBe('array');
      expect(techReqsProperty.items.type).toBe('string');
    });

    it('should have all expected properties', () => {
      const properties = ElectronicFilingRulesSchema.properties;
      expect(properties.title).toBeDefined();
      expect(properties.state).toBeDefined();
      expect(properties.filing_system_name).toBeDefined();
      expect(properties.mandatory).toBeDefined();
      expect(properties.file_formats).toBeDefined();
      expect(properties.file_size_limit).toBeDefined();
      expect(properties.pdf_requirements).toBeDefined();
      expect(properties.technical_requirements).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== LocalRulesSchema Tests =====
  describe('LocalRulesSchema', () => {
    it('should have correct schema structure', () => {
      expect(LocalRulesSchema).toBeDefined();
      expect(LocalRulesSchema.type).toBe('object');
      expect(LocalRulesSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(LocalRulesSchema.required).toEqual(['title', 'state']);
    });

    it('should have rule_topic enum', () => {
      const ruleTopicProperty = LocalRulesSchema.properties.rule_topic;
      expect(ruleTopicProperty.enum).toEqual([
        'motion_practice', 'discovery', 'scheduling',
        'filing', 'appearances', 'general'
      ]);
    });

    it('should have differs_from_state boolean field', () => {
      const differsProperty = LocalRulesSchema.properties.differs_from_state;
      expect(differsProperty.type).toBe('boolean');
    });

    it('should have all expected properties', () => {
      const properties = LocalRulesSchema.properties;
      expect(properties.title).toBeDefined();
      expect(properties.state).toBeDefined();
      expect(properties.county).toBeDefined();
      expect(properties.district).toBeDefined();
      expect(properties.court_name).toBeDefined();
      expect(properties.rule_topic).toBeDefined();
      expect(properties.differs_from_state).toBeDefined();
      expect(properties.summary).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== CourtProcedureSchema Tests =====
  describe('CourtProcedureSchema', () => {
    it('should have correct schema structure', () => {
      expect(CourtProcedureSchema).toBeDefined();
      expect(CourtProcedureSchema.type).toBe('object');
      expect(CourtProcedureSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(CourtProcedureSchema.required).toEqual(['title', 'state', 'procedure_type']);
    });

    it('should have procedure_type enum', () => {
      const procedureTypeProperty = CourtProcedureSchema.properties.procedure_type;
      expect(procedureTypeProperty.enum).toEqual([
        'motion', 'discovery', 'trial', 'scheduling',
        'service', 'filing', 'general'
      ]);
    });

    it('should have deadlines array', () => {
      const deadlinesProperty = CourtProcedureSchema.properties.deadlines;
      expect(deadlinesProperty.type).toBe('array');
      expect(deadlinesProperty.items.type).toBe('string');
    });

    it('should have requirements array', () => {
      const requirementsProperty = CourtProcedureSchema.properties.requirements;
      expect(requirementsProperty.type).toBe('array');
      expect(requirementsProperty.items.type).toBe('string');
    });

    it('should have all expected properties', () => {
      const properties = CourtProcedureSchema.properties;
      expect(properties.title).toBeDefined();
      expect(properties.state).toBeDefined();
      expect(properties.procedure_type).toBeDefined();
      expect(properties.court_level).toBeDefined();
      expect(properties.deadlines).toBeDefined();
      expect(properties.requirements).toBeDefined();
      expect(properties.summary).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== RuleUpdateSchema Tests =====
  describe('RuleUpdateSchema', () => {
    it('should have correct schema structure', () => {
      expect(RuleUpdateSchema).toBeDefined();
      expect(RuleUpdateSchema.type).toBe('object');
      expect(RuleUpdateSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(RuleUpdateSchema.required).toEqual(['title', 'state', 'update_type']);
    });

    it('should have update_type enum', () => {
      const updateTypeProperty = RuleUpdateSchema.properties.update_type;
      expect(updateTypeProperty.enum).toEqual([
        'amendment', 'new_rule', 'repeal', 'clarification'
      ]);
    });

    it('should have impact enum', () => {
      const impactProperty = RuleUpdateSchema.properties.impact;
      expect(impactProperty.enum).toEqual([
        'major', 'moderate', 'minor', 'technical'
      ]);
    });

    it('should have all expected properties', () => {
      const properties = RuleUpdateSchema.properties;
      expect(properties.title).toBeDefined();
      expect(properties.state).toBeDefined();
      expect(properties.update_type).toBeDefined();
      expect(properties.rule_affected).toBeDefined();
      expect(properties.effective_date).toBeDefined();
      expect(properties.summary).toBeDefined();
      expect(properties.impact).toBeDefined();
      expect(properties.url).toBeDefined();
    });
  });

  // ===== DocumentTemplateSchema Tests =====
  describe('DocumentTemplateSchema', () => {
    it('should have correct schema structure', () => {
      expect(DocumentTemplateSchema).toBeDefined();
      expect(DocumentTemplateSchema.type).toBe('object');
      expect(DocumentTemplateSchema.properties).toBeDefined();
    });

    it('should have required fields', () => {
      expect(DocumentTemplateSchema.required).toEqual(['title', 'state', 'document_type']);
    });

    it('should have template_type enum', () => {
      const templateTypeProperty = DocumentTemplateSchema.properties.template_type;
      expect(templateTypeProperty.enum).toEqual([
        'official_form', 'sample_document', 'fillable_form', 'general_template'
      ]);
    });

    it('should have format enum', () => {
      const formatProperty = DocumentTemplateSchema.properties.format;
      expect(formatProperty.enum).toEqual([
        'PDF', 'Word', 'Online_Form', 'Other'
      ]);
    });

    it('should have mandatory boolean field', () => {
      const mandatoryProperty = DocumentTemplateSchema.properties.mandatory;
      expect(mandatoryProperty.type).toBe('boolean');
    });

    it('should have all expected properties', () => {
      const properties = DocumentTemplateSchema.properties;
      expect(properties.title).toBeDefined();
      expect(properties.state).toBeDefined();
      expect(properties.document_type).toBeDefined();
      expect(properties.template_type).toBeDefined();
      expect(properties.court_level).toBeDefined();
      expect(properties.mandatory).toBeDefined();
      expect(properties.format).toBeDefined();
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

  describe('RuleTypeEnum', () => {
    it('should contain all valid rule types', () => {
      expect(RuleTypeEnum).toEqual([
        'formatting', 'procedural', 'electronic', 'local',
        'discovery', 'appellate', 'emergency'
      ]);
    });
  });

  describe('CourtLevelEnum', () => {
    it('should contain all valid court levels', () => {
      expect(CourtLevelEnum).toEqual([
        'supreme', 'appellate', 'superior', 'circuit',
        'district', 'county', 'municipal', 'other'
      ]);
    });
  });

  describe('DocumentTypeEnum', () => {
    it('should contain all valid document types', () => {
      expect(DocumentTypeEnum).toEqual([
        'complaint', 'motion', 'brief', 'order',
        'pleading', 'discovery', 'general'
      ]);
    });
  });

  describe('ProcedureTypeEnum', () => {
    it('should contain all valid procedure types', () => {
      expect(ProcedureTypeEnum).toEqual([
        'motion', 'discovery', 'trial', 'scheduling',
        'service', 'filing', 'general'
      ]);
    });
  });

  // ===== Export Tests =====
  describe('StateCourtRulesSchemas Export', () => {
    it('should export all schemas in StateCourtRulesSchemas object', () => {
      expect(StateCourtRulesSchemas).toBeDefined();
      expect(StateCourtRulesSchemas.state_court_rule).toBe(StateCourtRuleSchema);
      expect(StateCourtRulesSchemas.formatting_requirements).toBe(FormattingRequirementsSchema);
      expect(StateCourtRulesSchemas.electronic_filing_rules).toBe(ElectronicFilingRulesSchema);
      expect(StateCourtRulesSchemas.local_rules).toBe(LocalRulesSchema);
      expect(StateCourtRulesSchemas.court_procedure).toBe(CourtProcedureSchema);
      expect(StateCourtRulesSchemas.rule_update).toBe(RuleUpdateSchema);
      expect(StateCourtRulesSchemas.document_template).toBe(DocumentTemplateSchema);
    });

    it('should have exactly 7 schemas', () => {
      const schemaKeys = Object.keys(StateCourtRulesSchemas);
      expect(schemaKeys.length).toBe(7);
    });
  });

  // ===== Schema Compatibility Tests =====
  describe('Schema Compatibility', () => {
    it('all schemas should have $schema property', () => {
      expect(StateCourtRuleSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(FormattingRequirementsSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(ElectronicFilingRulesSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(LocalRulesSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(CourtProcedureSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(RuleUpdateSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(DocumentTemplateSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
    });
  });

  // ===== Property Description Tests =====
  describe('Property Descriptions', () => {
    it('StateCourtRuleSchema properties should have descriptions', () => {
      const properties = StateCourtRuleSchema.properties;
      expect(properties.title.description).toBeDefined();
      expect(properties.state.description).toBeDefined();
      expect(properties.rule_number.description).toBeDefined();
      expect(properties.rule_type.description).toBeDefined();
      expect(properties.court_level.description).toBeDefined();
    });

    it('FormattingRequirementsSchema properties should have descriptions', () => {
      const properties = FormattingRequirementsSchema.properties;
      expect(properties.title.description).toBeDefined();
      expect(properties.state.description).toBeDefined();
      expect(properties.font_requirements.description).toBeDefined();
      expect(properties.margin_requirements.description).toBeDefined();
    });

    it('ElectronicFilingRulesSchema properties should have descriptions', () => {
      const properties = ElectronicFilingRulesSchema.properties;
      expect(properties.title.description).toBeDefined();
      expect(properties.state.description).toBeDefined();
      expect(properties.filing_system_name.description).toBeDefined();
      expect(properties.mandatory.description).toBeDefined();
    });
  });
});
