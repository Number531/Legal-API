/**
 * CPSCSchemas.test.js
 * Unit tests for CPSC schema definitions
 */

import { strict as assert } from 'assert';
import {
  CPSCRecallSchema,
  CPSCEnforcementSchema,
  CPSCInjuryDataSchema,
  CPSCSafetyStandardSchema,
  CPSCBusinessGuidanceSchema,
  CPSCNewsSchema,
  CPSCReportSchema,
  CPSCSchemas,
  HazardTypeEnum,
  ViolationTypeEnum,
  RecallNumberType
} from '../../src/api-clients/schemas/CPSCSchemas.js';

describe('CPSCSchemas', () => {
  describe('CPSCRecallSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(CPSCRecallSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(CPSCRecallSchema.type, 'object');
      assert.strictEqual(CPSCRecallSchema.title, 'CPSC Recall');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(CPSCRecallSchema.required));
      assert.ok(CPSCRecallSchema.required.includes('recall_number'));
      assert.ok(CPSCRecallSchema.required.includes('title'));
      assert.ok(CPSCRecallSchema.required.includes('manufacturer'));
    });

    it('should have key recall properties', () => {
      const props = CPSCRecallSchema.properties;
      assert.ok(props.recall_number);
      assert.ok(props.title);
      assert.ok(props.product_name);
      assert.ok(props.manufacturer);
      assert.ok(props.hazard_type);
      assert.ok(props.hazard_description);
      assert.ok(props.remedy_action);
      assert.ok(props.incident_count);
      assert.ok(props.injury_count);
      assert.ok(props.death_count);
      assert.ok(props.recall_date);
    });

    it('should have recall_number pattern validation', () => {
      const recallNum = CPSCRecallSchema.properties.recall_number;
      assert.strictEqual(recallNum.type, 'string');
      assert.ok(recallNum.pattern);
      assert.ok(recallNum.pattern.includes('\\d{2}-\\d{3,4}'));
    });

    it('should have hazard_type enum', () => {
      const hazardType = CPSCRecallSchema.properties.hazard_type;
      assert.strictEqual(hazardType.type, 'string');
      assert.ok(Array.isArray(hazardType.enum));
      assert.ok(hazardType.enum.includes('Fire'));
      assert.ok(hazardType.enum.includes('Choking'));
      assert.ok(hazardType.enum.includes('Electrical'));
    });

    it('should have integer types for counts', () => {
      const incidentCount = CPSCRecallSchema.properties.incident_count;
      const injuryCount = CPSCRecallSchema.properties.injury_count;
      const deathCount = CPSCRecallSchema.properties.death_count;
      assert.strictEqual(incidentCount.type, 'integer');
      assert.strictEqual(injuryCount.type, 'integer');
      assert.strictEqual(deathCount.type, 'integer');
      assert.ok(incidentCount.minimum !== undefined);
    });
  });

  describe('CPSCEnforcementSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(CPSCEnforcementSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(CPSCEnforcementSchema.type, 'object');
      assert.strictEqual(CPSCEnforcementSchema.title, 'CPSC Enforcement');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(CPSCEnforcementSchema.required));
      assert.ok(CPSCEnforcementSchema.required.includes('title'));
      assert.ok(CPSCEnforcementSchema.required.includes('company_name'));
    });

    it('should have enforcement-specific properties', () => {
      const props = CPSCEnforcementSchema.properties;
      assert.ok(props.company_name);
      assert.ok(props.violation_type);
      assert.ok(props.violation_description);
      assert.ok(props.penalty_amount);
      assert.ok(props.settlement_terms);
      assert.ok(props.corrective_actions);
    });

    it('should have violation_type enum', () => {
      const violationType = CPSCEnforcementSchema.properties.violation_type;
      assert.strictEqual(violationType.type, 'string');
      assert.ok(Array.isArray(violationType.enum));
      assert.ok(violationType.enum.includes('Section 15 Violation'));
      assert.ok(violationType.enum.includes('Certification Violation'));
      assert.ok(violationType.enum.includes('Substantial Product Hazard'));
    });

    it('should have array type for corrective_actions', () => {
      const actions = CPSCEnforcementSchema.properties.corrective_actions;
      assert.strictEqual(actions.type, 'array');
      assert.strictEqual(actions.items.type, 'string');
    });
  });

  describe('CPSCInjuryDataSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(CPSCInjuryDataSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(CPSCInjuryDataSchema.type, 'object');
      assert.strictEqual(CPSCInjuryDataSchema.title, 'CPSC Injury Data');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(CPSCInjuryDataSchema.required));
      assert.ok(CPSCInjuryDataSchema.required.includes('title'));
      assert.ok(CPSCInjuryDataSchema.required.includes('product_name'));
    });

    it('should have injury data properties', () => {
      const props = CPSCInjuryDataSchema.properties;
      assert.ok(props.product_code);
      assert.ok(props.injury_type);
      assert.ok(props.injury_count);
      assert.ok(props.age_group);
      assert.ok(props.treatment_type);
      assert.ok(props.data_source);
    });

    it('should have treatment_type enum', () => {
      const treatment = CPSCInjuryDataSchema.properties.treatment_type;
      assert.strictEqual(treatment.type, 'string');
      assert.ok(Array.isArray(treatment.enum));
      assert.ok(treatment.enum.includes('Treated and Released'));
      assert.ok(treatment.enum.includes('Hospitalized'));
      assert.ok(treatment.enum.includes('DOA/Fatal'));
    });

    it('should have data_source enum', () => {
      const dataSource = CPSCInjuryDataSchema.properties.data_source;
      assert.strictEqual(dataSource.type, 'string');
      assert.ok(Array.isArray(dataSource.enum));
      assert.ok(dataSource.enum.includes('NEISS'));
      assert.ok(dataSource.enum.includes('NEISS-AIP'));
    });

    it('should have integer type for injury_count', () => {
      const count = CPSCInjuryDataSchema.properties.injury_count;
      assert.strictEqual(count.type, 'integer');
      assert.ok(count.minimum !== undefined);
    });
  });

  describe('CPSCSafetyStandardSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(CPSCSafetyStandardSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(CPSCSafetyStandardSchema.type, 'object');
      assert.strictEqual(CPSCSafetyStandardSchema.title, 'CPSC Safety Standard');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(CPSCSafetyStandardSchema.required));
      assert.ok(CPSCSafetyStandardSchema.required.includes('title'));
      assert.ok(CPSCSafetyStandardSchema.required.includes('standard_number'));
    });

    it('should have safety standard properties', () => {
      const props = CPSCSafetyStandardSchema.properties;
      assert.ok(props.standard_number);
      assert.ok(props.standard_type);
      assert.ok(props.product_category);
      assert.ok(props.effective_date);
      assert.ok(props.requirements);
      assert.ok(props.testing_requirements);
    });

    it('should have standard_type enum', () => {
      const standardType = CPSCSafetyStandardSchema.properties.standard_type;
      assert.strictEqual(standardType.type, 'string');
      assert.ok(Array.isArray(standardType.enum));
      assert.ok(standardType.enum.includes('Mandatory'));
      assert.ok(standardType.enum.includes('Voluntary'));
      assert.ok(standardType.enum.includes('Final Rule'));
    });

    it('should have array type for requirements', () => {
      const requirements = CPSCSafetyStandardSchema.properties.requirements;
      assert.strictEqual(requirements.type, 'array');
      assert.strictEqual(requirements.items.type, 'string');
    });
  });

  describe('CPSCBusinessGuidanceSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(CPSCBusinessGuidanceSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(CPSCBusinessGuidanceSchema.type, 'object');
      assert.strictEqual(CPSCBusinessGuidanceSchema.title, 'CPSC Business Guidance');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(CPSCBusinessGuidanceSchema.required));
      assert.ok(CPSCBusinessGuidanceSchema.required.includes('title'));
      assert.ok(CPSCBusinessGuidanceSchema.required.includes('guidance_type'));
    });

    it('should have guidance properties', () => {
      const props = CPSCBusinessGuidanceSchema.properties;
      assert.ok(props.guidance_type);
      assert.ok(props.target_audience);
      assert.ok(props.product_category);
      assert.ok(props.key_requirements);
      assert.ok(props.related_standards);
    });

    it('should have guidance_type enum', () => {
      const guidanceType = CPSCBusinessGuidanceSchema.properties.guidance_type;
      assert.strictEqual(guidanceType.type, 'string');
      assert.ok(Array.isArray(guidanceType.enum));
      assert.ok(guidanceType.enum.includes('Compliance Guide'));
      assert.ok(guidanceType.enum.includes('Testing Requirements'));
      assert.ok(guidanceType.enum.includes('Certification'));
    });

    it('should have array types for requirements and standards', () => {
      const requirements = CPSCBusinessGuidanceSchema.properties.key_requirements;
      const standards = CPSCBusinessGuidanceSchema.properties.related_standards;
      assert.strictEqual(requirements.type, 'array');
      assert.strictEqual(standards.type, 'array');
    });
  });

  describe('CPSCNewsSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(CPSCNewsSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(CPSCNewsSchema.type, 'object');
      assert.strictEqual(CPSCNewsSchema.title, 'CPSC News');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(CPSCNewsSchema.required));
      assert.ok(CPSCNewsSchema.required.includes('title'));
      assert.ok(CPSCNewsSchema.required.includes('news_type'));
      assert.ok(CPSCNewsSchema.required.includes('publication_date'));
    });

    it('should have news properties', () => {
      const props = CPSCNewsSchema.properties;
      assert.ok(props.news_type);
      assert.ok(props.publication_date);
      assert.ok(props.summary);
      assert.ok(props.related_product);
    });

    it('should have news_type enum', () => {
      const newsType = CPSCNewsSchema.properties.news_type;
      assert.strictEqual(newsType.type, 'string');
      assert.ok(Array.isArray(newsType.enum));
      assert.ok(newsType.enum.includes('Press Release'));
      assert.ok(newsType.enum.includes('Safety Alert'));
      assert.ok(newsType.enum.includes('Recall Announcement'));
    });
  });

  describe('CPSCReportSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(CPSCReportSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(CPSCReportSchema.type, 'object');
      assert.strictEqual(CPSCReportSchema.title, 'CPSC Report');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(CPSCReportSchema.required));
      assert.ok(CPSCReportSchema.required.includes('title'));
      assert.ok(CPSCReportSchema.required.includes('report_type'));
    });

    it('should have report properties', () => {
      const props = CPSCReportSchema.properties;
      assert.ok(props.report_type);
      assert.ok(props.publication_date);
      assert.ok(props.authors);
      assert.ok(props.abstract);
      assert.ok(props.key_findings);
      assert.ok(props.data_period);
    });

    it('should have report_type enum', () => {
      const reportType = CPSCReportSchema.properties.report_type;
      assert.strictEqual(reportType.type, 'string');
      assert.ok(Array.isArray(reportType.enum));
      assert.ok(reportType.enum.includes('Research Study'));
      assert.ok(reportType.enum.includes('Statistical Report'));
      assert.ok(reportType.enum.includes('Risk Assessment'));
    });

    it('should have array types for authors and findings', () => {
      const authors = CPSCReportSchema.properties.authors;
      const findings = CPSCReportSchema.properties.key_findings;
      assert.strictEqual(authors.type, 'array');
      assert.strictEqual(findings.type, 'array');
    });
  });

  describe('Reusable Types and Enums', () => {
    it('should have RecallNumberType', () => {
      assert.strictEqual(RecallNumberType.type, 'string');
      assert.ok(RecallNumberType.pattern);
      assert.ok(RecallNumberType.description);
    });

    it('should have HazardTypeEnum', () => {
      assert.ok(Array.isArray(HazardTypeEnum));
      assert.ok(HazardTypeEnum.includes('Fire'));
      assert.ok(HazardTypeEnum.includes('Choking'));
      assert.ok(HazardTypeEnum.includes('Electrical'));
      assert.ok(HazardTypeEnum.includes('Chemical'));
    });

    it('should have ViolationTypeEnum', () => {
      assert.ok(Array.isArray(ViolationTypeEnum));
      assert.ok(ViolationTypeEnum.includes('Section 15 Violation'));
      assert.ok(ViolationTypeEnum.includes('Certification Violation'));
      assert.ok(ViolationTypeEnum.includes('Substantial Product Hazard'));
    });
  });

  describe('CPSCSchemas export', () => {
    it('should export all schemas in collection', () => {
      assert.ok(CPSCSchemas.cpsc_recall);
      assert.ok(CPSCSchemas.cpsc_enforcement);
      assert.ok(CPSCSchemas.cpsc_injury_data);
      assert.ok(CPSCSchemas.cpsc_safety_standard);
      assert.ok(CPSCSchemas.cpsc_business_guidance);
      assert.ok(CPSCSchemas.cpsc_news);
      assert.ok(CPSCSchemas.cpsc_report);
    });

    it('should have matching references', () => {
      assert.strictEqual(CPSCSchemas.cpsc_recall, CPSCRecallSchema);
      assert.strictEqual(CPSCSchemas.cpsc_enforcement, CPSCEnforcementSchema);
      assert.strictEqual(CPSCSchemas.cpsc_injury_data, CPSCInjuryDataSchema);
      assert.strictEqual(CPSCSchemas.cpsc_safety_standard, CPSCSafetyStandardSchema);
      assert.strictEqual(CPSCSchemas.cpsc_business_guidance, CPSCBusinessGuidanceSchema);
      assert.strictEqual(CPSCSchemas.cpsc_news, CPSCNewsSchema);
      assert.strictEqual(CPSCSchemas.cpsc_report, CPSCReportSchema);
    });
  });

  describe('Schema Compatibility', () => {
    it('should be compatible with SchemaValidator', () => {
      const schemas = [
        CPSCRecallSchema,
        CPSCEnforcementSchema,
        CPSCInjuryDataSchema,
        CPSCSafetyStandardSchema,
        CPSCBusinessGuidanceSchema,
        CPSCNewsSchema,
        CPSCReportSchema
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
        CPSCRecallSchema,
        CPSCEnforcementSchema,
        CPSCInjuryDataSchema,
        CPSCSafetyStandardSchema,
        CPSCBusinessGuidanceSchema,
        CPSCNewsSchema,
        CPSCReportSchema
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
    it('should validate recall numbers', () => {
      const pattern = new RegExp(CPSCRecallSchema.properties.recall_number.pattern);
      assert.ok(pattern.test('23-456'));
      assert.ok(pattern.test('24-1234'));
      assert.ok(pattern.test('22-001'));
      assert.ok(!pattern.test('2023-456'));
      assert.ok(!pattern.test('23456'));
      assert.ok(!pattern.test('23-12345'));
    });
  });
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running CPSCSchemas tests...');
}
