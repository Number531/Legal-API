/**
 * FederalRegisterSchemas.test.js
 * Unit tests for Federal Register schema definitions
 */

import { strict as assert } from 'assert';
import {
  FederalRegisterDocumentSchema,
  FederalRegisterProposedRuleSchema,
  FederalRegisterFinalRuleSchema,
  FederalRegisterNoticeSchema,
  FederalRegisterPresidentialDocumentSchema,
  FederalRegisterPublicInspectionSchema,
  FederalRegisterSchemas,
  DocumentTypeEnum,
  RuleTypeEnum,
  PresidentialDocumentTypeEnum,
  NoticeTypeEnum,
  DocumentNumberType,
  RINType
} from '../../src/api-clients/schemas/FederalRegisterSchemas.js';

describe('FederalRegisterSchemas', () => {
  describe('FederalRegisterDocumentSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(FederalRegisterDocumentSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(FederalRegisterDocumentSchema.type, 'object');
      assert.strictEqual(FederalRegisterDocumentSchema.title, 'Federal Register Document');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(FederalRegisterDocumentSchema.required));
      assert.ok(FederalRegisterDocumentSchema.required.includes('title'));
    });

    it('should have Federal Register document properties', () => {
      const props = FederalRegisterDocumentSchema.properties;
      assert.ok(props.document_number);
      assert.ok(props.title);
      assert.ok(props.agency);
      assert.ok(props.document_type);
      assert.ok(props.publication_date);
      assert.ok(props.abstract);
      assert.ok(props.cfr_references);
    });

    it('should have document_number pattern validation', () => {
      const docNum = FederalRegisterDocumentSchema.properties.document_number;
      assert.strictEqual(docNum.type, 'string');
      assert.strictEqual(docNum.pattern, '^\\d{4}-\\d{5}$');
    });

    it('should have document_type enum', () => {
      const docType = FederalRegisterDocumentSchema.properties.document_type;
      assert.strictEqual(docType.type, 'string');
      assert.ok(Array.isArray(docType.enum));
      assert.ok(docType.enum.includes('Rule'));
      assert.ok(docType.enum.includes('Proposed Rule'));
      assert.ok(docType.enum.includes('Notice'));
    });

    it('should have array type for cfr_references', () => {
      const cfrRefs = FederalRegisterDocumentSchema.properties.cfr_references;
      assert.strictEqual(cfrRefs.type, 'array');
      assert.ok(cfrRefs.items);
    });
  });

  describe('FederalRegisterProposedRuleSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(FederalRegisterProposedRuleSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(FederalRegisterProposedRuleSchema.type, 'object');
      assert.strictEqual(FederalRegisterProposedRuleSchema.title, 'Federal Register Proposed Rule');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(FederalRegisterProposedRuleSchema.required));
      assert.ok(FederalRegisterProposedRuleSchema.required.includes('title'));
      assert.ok(FederalRegisterProposedRuleSchema.required.includes('agency'));
    });

    it('should have proposed rule properties', () => {
      const props = FederalRegisterProposedRuleSchema.properties;
      assert.ok(props.document_number);
      assert.ok(props.comment_deadline);
      assert.ok(props.days_to_comment);
      assert.ok(props.summary);
      assert.ok(props.cfr_affected);
      assert.ok(props.regulatory_impact);
      assert.ok(props.docket_id);
      assert.ok(props.rin);
    });

    it('should have rin pattern validation', () => {
      const rin = FederalRegisterProposedRuleSchema.properties.rin;
      assert.strictEqual(rin.type, 'string');
      assert.strictEqual(rin.pattern, '^\\d{4}-[A-Z]{2}\\d{2}$');
    });

    it('should have regulatory_impact enum', () => {
      const regImpact = FederalRegisterProposedRuleSchema.properties.regulatory_impact;
      assert.strictEqual(regImpact.type, 'string');
      assert.ok(Array.isArray(regImpact.enum));
      assert.ok(regImpact.enum.includes('Significant'));
      assert.ok(regImpact.enum.includes('Major'));
    });

    it('should have integer type for days_to_comment', () => {
      const days = FederalRegisterProposedRuleSchema.properties.days_to_comment;
      assert.strictEqual(days.type, 'integer');
      assert.strictEqual(days.minimum, 0);
    });
  });

  describe('FederalRegisterFinalRuleSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(FederalRegisterFinalRuleSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(FederalRegisterFinalRuleSchema.type, 'object');
      assert.strictEqual(FederalRegisterFinalRuleSchema.title, 'Federal Register Final Rule');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(FederalRegisterFinalRuleSchema.required));
      assert.ok(FederalRegisterFinalRuleSchema.required.includes('title'));
      assert.ok(FederalRegisterFinalRuleSchema.required.includes('agency'));
    });

    it('should have final rule properties', () => {
      const props = FederalRegisterFinalRuleSchema.properties;
      assert.ok(props.document_number);
      assert.ok(props.effective_date);
      assert.ok(props.days_until_effective);
      assert.ok(props.summary);
      assert.ok(props.cfr_affected);
      assert.ok(props.rule_type);
      assert.ok(props.regulatory_impact);
    });

    it('should have rule_type enum', () => {
      const ruleType = FederalRegisterFinalRuleSchema.properties.rule_type;
      assert.strictEqual(ruleType.type, 'string');
      assert.ok(Array.isArray(ruleType.enum));
      assert.ok(ruleType.enum.includes('Final Rule'));
      assert.ok(ruleType.enum.includes('Interim Final Rule'));
      assert.ok(ruleType.enum.includes('Emergency Rule'));
    });

    it('should have array type for cfr_affected', () => {
      const cfrAffected = FederalRegisterFinalRuleSchema.properties.cfr_affected;
      assert.strictEqual(cfrAffected.type, 'array');
    });
  });

  describe('FederalRegisterNoticeSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(FederalRegisterNoticeSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(FederalRegisterNoticeSchema.type, 'object');
      assert.strictEqual(FederalRegisterNoticeSchema.title, 'Federal Register Notice');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(FederalRegisterNoticeSchema.required));
      assert.ok(FederalRegisterNoticeSchema.required.includes('title'));
      assert.ok(FederalRegisterNoticeSchema.required.includes('agency'));
    });

    it('should have notice properties', () => {
      const props = FederalRegisterNoticeSchema.properties;
      assert.ok(props.document_number);
      assert.ok(props.notice_type);
      assert.ok(props.publication_date);
      assert.ok(props.summary);
      assert.ok(props.meeting_date);
      assert.ok(props.comment_deadline);
      assert.ok(props.contact_info);
    });

    it('should have notice_type enum', () => {
      const noticeType = FederalRegisterNoticeSchema.properties.notice_type;
      assert.strictEqual(noticeType.type, 'string');
      assert.ok(Array.isArray(noticeType.enum));
      assert.ok(noticeType.enum.includes('Public Meeting'));
      assert.ok(noticeType.enum.includes('Request for Comments'));
      assert.ok(noticeType.enum.includes('Advisory Committee Meeting'));
    });

    it('should have contact_info object', () => {
      const contactInfo = FederalRegisterNoticeSchema.properties.contact_info;
      assert.strictEqual(contactInfo.type, 'object');
      assert.ok(contactInfo.properties.name);
      assert.ok(contactInfo.properties.email);
      assert.ok(contactInfo.properties.phone);
    });
  });

  describe('FederalRegisterPresidentialDocumentSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(FederalRegisterPresidentialDocumentSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(FederalRegisterPresidentialDocumentSchema.type, 'object');
      assert.strictEqual(FederalRegisterPresidentialDocumentSchema.title, 'Federal Register Presidential Document');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(FederalRegisterPresidentialDocumentSchema.required));
      assert.ok(FederalRegisterPresidentialDocumentSchema.required.includes('title'));
      assert.ok(FederalRegisterPresidentialDocumentSchema.required.includes('document_type'));
    });

    it('should have presidential document properties', () => {
      const props = FederalRegisterPresidentialDocumentSchema.properties;
      assert.ok(props.document_number);
      assert.ok(props.document_type);
      assert.ok(props.executive_order_number);
      assert.ok(props.signing_date);
      assert.ok(props.publication_date);
      assert.ok(props.summary);
      assert.ok(props.subject_areas);
      assert.ok(props.agencies_affected);
      assert.ok(props.revokes);
    });

    it('should have document_type enum', () => {
      const docType = FederalRegisterPresidentialDocumentSchema.properties.document_type;
      assert.strictEqual(docType.type, 'string');
      assert.ok(Array.isArray(docType.enum));
      assert.ok(docType.enum.includes('Executive Order'));
      assert.ok(docType.enum.includes('Presidential Proclamation'));
      assert.ok(docType.enum.includes('Presidential Memorandum'));
    });

    it('should have executive_order_number pattern', () => {
      const eoNumber = FederalRegisterPresidentialDocumentSchema.properties.executive_order_number;
      assert.strictEqual(eoNumber.type, 'string');
      assert.strictEqual(eoNumber.pattern, '^\\d{5}$');
    });

    it('should have array types for multiple fields', () => {
      const subjectAreas = FederalRegisterPresidentialDocumentSchema.properties.subject_areas;
      const agenciesAffected = FederalRegisterPresidentialDocumentSchema.properties.agencies_affected;
      const revokes = FederalRegisterPresidentialDocumentSchema.properties.revokes;
      assert.strictEqual(subjectAreas.type, 'array');
      assert.strictEqual(agenciesAffected.type, 'array');
      assert.strictEqual(revokes.type, 'array');
    });
  });

  describe('FederalRegisterPublicInspectionSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(FederalRegisterPublicInspectionSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(FederalRegisterPublicInspectionSchema.type, 'object');
      assert.strictEqual(FederalRegisterPublicInspectionSchema.title, 'Federal Register Public Inspection Document');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(FederalRegisterPublicInspectionSchema.required));
      assert.ok(FederalRegisterPublicInspectionSchema.required.includes('title'));
      assert.ok(FederalRegisterPublicInspectionSchema.required.includes('agency'));
    });

    it('should have public inspection properties', () => {
      const props = FederalRegisterPublicInspectionSchema.properties;
      assert.ok(props.document_number);
      assert.ok(props.title);
      assert.ok(props.agency);
      assert.ok(props.document_type);
      assert.ok(props.filing_date);
      assert.ok(props.expected_publication_date);
      assert.ok(props.pages);
      assert.ok(props.subject);
      assert.ok(props.docket_numbers);
      assert.ok(props.special_filing);
    });

    it('should have integer type for pages', () => {
      const pages = FederalRegisterPublicInspectionSchema.properties.pages;
      assert.strictEqual(pages.type, 'integer');
      assert.strictEqual(pages.minimum, 1);
    });

    it('should have boolean type for special_filing', () => {
      const specialFiling = FederalRegisterPublicInspectionSchema.properties.special_filing;
      assert.strictEqual(specialFiling.type, 'boolean');
    });

    it('should have array type for docket_numbers', () => {
      const docketNumbers = FederalRegisterPublicInspectionSchema.properties.docket_numbers;
      assert.strictEqual(docketNumbers.type, 'array');
    });
  });

  describe('Reusable Types', () => {
    it('should have DocumentNumberType', () => {
      assert.strictEqual(DocumentNumberType.type, 'string');
      assert.strictEqual(DocumentNumberType.pattern, '^\\d{4}-\\d{5}$');
    });

    it('should have RINType', () => {
      assert.strictEqual(RINType.type, 'string');
      assert.strictEqual(RINType.pattern, '^\\d{4}-[A-Z]{2}\\d{2}$');
    });
  });

  describe('Reusable Enums', () => {
    it('should have DocumentTypeEnum', () => {
      assert.ok(Array.isArray(DocumentTypeEnum));
      assert.ok(DocumentTypeEnum.includes('Rule'));
      assert.ok(DocumentTypeEnum.includes('Proposed Rule'));
      assert.ok(DocumentTypeEnum.includes('Notice'));
    });

    it('should have RuleTypeEnum', () => {
      assert.ok(Array.isArray(RuleTypeEnum));
      assert.ok(RuleTypeEnum.includes('Final Rule'));
      assert.ok(RuleTypeEnum.includes('Interim Final Rule'));
      assert.ok(RuleTypeEnum.includes('Emergency Rule'));
    });

    it('should have PresidentialDocumentTypeEnum', () => {
      assert.ok(Array.isArray(PresidentialDocumentTypeEnum));
      assert.ok(PresidentialDocumentTypeEnum.includes('Executive Order'));
      assert.ok(PresidentialDocumentTypeEnum.includes('Presidential Proclamation'));
      assert.ok(PresidentialDocumentTypeEnum.includes('Presidential Memorandum'));
    });

    it('should have NoticeTypeEnum', () => {
      assert.ok(Array.isArray(NoticeTypeEnum));
      assert.ok(NoticeTypeEnum.includes('Public Meeting'));
      assert.ok(NoticeTypeEnum.includes('Request for Comments'));
      assert.ok(NoticeTypeEnum.includes('Advisory Committee Meeting'));
    });
  });

  describe('FederalRegisterSchemas export', () => {
    it('should export all schemas in collection', () => {
      assert.ok(FederalRegisterSchemas.federal_register_document);
      assert.ok(FederalRegisterSchemas.federal_register_proposed_rule);
      assert.ok(FederalRegisterSchemas.federal_register_final_rule);
      assert.ok(FederalRegisterSchemas.federal_register_notice);
      assert.ok(FederalRegisterSchemas.federal_register_presidential_document);
      assert.ok(FederalRegisterSchemas.federal_register_public_inspection);
    });

    it('should have matching references', () => {
      assert.strictEqual(FederalRegisterSchemas.federal_register_document, FederalRegisterDocumentSchema);
      assert.strictEqual(FederalRegisterSchemas.federal_register_proposed_rule, FederalRegisterProposedRuleSchema);
      assert.strictEqual(FederalRegisterSchemas.federal_register_final_rule, FederalRegisterFinalRuleSchema);
      assert.strictEqual(FederalRegisterSchemas.federal_register_notice, FederalRegisterNoticeSchema);
      assert.strictEqual(FederalRegisterSchemas.federal_register_presidential_document, FederalRegisterPresidentialDocumentSchema);
      assert.strictEqual(FederalRegisterSchemas.federal_register_public_inspection, FederalRegisterPublicInspectionSchema);
    });
  });

  describe('Schema Compatibility', () => {
    it('should be compatible with SchemaValidator', () => {
      const schemas = [
        FederalRegisterDocumentSchema,
        FederalRegisterProposedRuleSchema,
        FederalRegisterFinalRuleSchema,
        FederalRegisterNoticeSchema,
        FederalRegisterPresidentialDocumentSchema,
        FederalRegisterPublicInspectionSchema
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
        FederalRegisterDocumentSchema,
        FederalRegisterProposedRuleSchema,
        FederalRegisterFinalRuleSchema,
        FederalRegisterNoticeSchema,
        FederalRegisterPresidentialDocumentSchema,
        FederalRegisterPublicInspectionSchema
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
  console.log('Running FederalRegisterSchemas tests...');
}
