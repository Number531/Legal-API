/**
 * FTCSchemas.test.js
 * Unit tests for FTC schema definitions
 */

import { strict as assert } from 'assert';
import {
  FTCCompetitionMatterSchema,
  FTCEnforcementCaseSchema,
  FTCGuidanceSchema,
  FTCRulemakingSchema,
  FTCNewsSchema,
  FTCConsumerAlertSchema,
  FTCSchemas,
  MatterTypeEnum,
  CaseTypeEnum,
  GuidanceTypeEnum,
  RulemakingTypeEnum
} from '../../src/api-clients/schemas/FTCSchemas.js';

describe('FTCSchemas', () => {
  describe('FTCCompetitionMatterSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(FTCCompetitionMatterSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(FTCCompetitionMatterSchema.type, 'object');
      assert.strictEqual(FTCCompetitionMatterSchema.title, 'FTC Competition Matter');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(FTCCompetitionMatterSchema.required));
      assert.ok(FTCCompetitionMatterSchema.required.includes('title'));
    });

    it('should have competition matter properties', () => {
      const props = FTCCompetitionMatterSchema.properties;
      assert.ok(props.matter_number);
      assert.ok(props.title);
      assert.ok(props.matter_type);
      assert.ok(props.parties);
      assert.ok(props.transaction_value);
      assert.ok(props.industries);
      assert.ok(props.status);
      assert.ok(props.filing_date);
      assert.ok(props.termination_date);
      assert.ok(props.summary);
    });

    it('should have matter_type enum', () => {
      const matterType = FTCCompetitionMatterSchema.properties.matter_type;
      assert.strictEqual(matterType.type, 'string');
      assert.ok(Array.isArray(matterType.enum));
      assert.ok(matterType.enum.includes('Merger Review'));
      assert.ok(matterType.enum.includes('HSR Early Termination'));
      assert.ok(matterType.enum.includes('Monopolization'));
    });

    it('should have status enum', () => {
      const status = FTCCompetitionMatterSchema.properties.status;
      assert.strictEqual(status.type, 'string');
      assert.ok(Array.isArray(status.enum));
      assert.ok(status.enum.includes('Under Review'));
      assert.ok(status.enum.includes('Approved'));
      assert.ok(status.enum.includes('Early Terminated'));
    });

    it('should have array types for parties and industries', () => {
      const parties = FTCCompetitionMatterSchema.properties.parties;
      const industries = FTCCompetitionMatterSchema.properties.industries;
      assert.strictEqual(parties.type, 'array');
      assert.strictEqual(industries.type, 'array');
    });
  });

  describe('FTCEnforcementCaseSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(FTCEnforcementCaseSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(FTCEnforcementCaseSchema.type, 'object');
      assert.strictEqual(FTCEnforcementCaseSchema.title, 'FTC Enforcement Case');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(FTCEnforcementCaseSchema.required));
      assert.ok(FTCEnforcementCaseSchema.required.includes('title'));
    });

    it('should have enforcement case properties', () => {
      const props = FTCEnforcementCaseSchema.properties;
      assert.ok(props.case_number);
      assert.ok(props.title);
      assert.ok(props.case_type);
      assert.ok(props.respondents);
      assert.ok(props.violations);
      assert.ok(props.industries);
      assert.ok(props.monetary_relief);
      assert.ok(props.equitable_relief);
      assert.ok(props.filed_date);
      assert.ok(props.order_date);
    });

    it('should have case_type enum', () => {
      const caseType = FTCEnforcementCaseSchema.properties.case_type;
      assert.strictEqual(caseType.type, 'string');
      assert.ok(Array.isArray(caseType.enum));
      assert.ok(caseType.enum.includes('Consent Order'));
      assert.ok(caseType.enum.includes('Administrative Complaint'));
      assert.ok(caseType.enum.includes('Settlement'));
    });

    it('should have array types for respondents and violations', () => {
      const respondents = FTCEnforcementCaseSchema.properties.respondents;
      const violations = FTCEnforcementCaseSchema.properties.violations;
      assert.strictEqual(respondents.type, 'array');
      assert.strictEqual(violations.type, 'array');
    });
  });

  describe('FTCGuidanceSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(FTCGuidanceSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(FTCGuidanceSchema.type, 'object');
      assert.strictEqual(FTCGuidanceSchema.title, 'FTC Guidance');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(FTCGuidanceSchema.required));
      assert.ok(FTCGuidanceSchema.required.includes('title'));
      assert.ok(FTCGuidanceSchema.required.includes('guidance_type'));
    });

    it('should have guidance properties', () => {
      const props = FTCGuidanceSchema.properties;
      assert.ok(props.title);
      assert.ok(props.guidance_type);
      assert.ok(props.topics);
      assert.ok(props.industries);
      assert.ok(props.publication_date);
      assert.ok(props.summary);
      assert.ok(props.key_points);
    });

    it('should have guidance_type enum', () => {
      const guidanceType = FTCGuidanceSchema.properties.guidance_type;
      assert.strictEqual(guidanceType.type, 'string');
      assert.ok(Array.isArray(guidanceType.enum));
      assert.ok(guidanceType.enum.includes('Policy Statement'));
      assert.ok(guidanceType.enum.includes('Advisory Opinion'));
      assert.ok(guidanceType.enum.includes('Business Guidance'));
    });

    it('should have array types for topics and key_points', () => {
      const topics = FTCGuidanceSchema.properties.topics;
      const keyPoints = FTCGuidanceSchema.properties.key_points;
      assert.strictEqual(topics.type, 'array');
      assert.strictEqual(keyPoints.type, 'array');
    });
  });

  describe('FTCRulemakingSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(FTCRulemakingSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(FTCRulemakingSchema.type, 'object');
      assert.strictEqual(FTCRulemakingSchema.title, 'FTC Rulemaking');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(FTCRulemakingSchema.required));
      assert.ok(FTCRulemakingSchema.required.includes('title'));
      assert.ok(FTCRulemakingSchema.required.includes('rulemaking_type'));
    });

    it('should have rulemaking properties', () => {
      const props = FTCRulemakingSchema.properties;
      assert.ok(props.title);
      assert.ok(props.rulemaking_type);
      assert.ok(props.rule_number);
      assert.ok(props.docket_number);
      assert.ok(props.topics);
      assert.ok(props.publication_date);
      assert.ok(props.comment_deadline);
      assert.ok(props.effective_date);
      assert.ok(props.summary);
    });

    it('should have rulemaking_type enum', () => {
      const rulemakingType = FTCRulemakingSchema.properties.rulemaking_type;
      assert.strictEqual(rulemakingType.type, 'string');
      assert.ok(Array.isArray(rulemakingType.enum));
      assert.ok(rulemakingType.enum.includes('Proposed Rule'));
      assert.ok(rulemakingType.enum.includes('Final Rule'));
      assert.ok(rulemakingType.enum.includes('Request for Comment'));
    });

    it('should have array type for topics', () => {
      const topics = FTCRulemakingSchema.properties.topics;
      assert.strictEqual(topics.type, 'array');
    });
  });

  describe('FTCNewsSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(FTCNewsSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(FTCNewsSchema.type, 'object');
      assert.strictEqual(FTCNewsSchema.title, 'FTC News');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(FTCNewsSchema.required));
      assert.ok(FTCNewsSchema.required.includes('title'));
      assert.ok(FTCNewsSchema.required.includes('news_type'));
      assert.ok(FTCNewsSchema.required.includes('publication_date'));
    });

    it('should have news properties', () => {
      const props = FTCNewsSchema.properties;
      assert.ok(props.title);
      assert.ok(props.news_type);
      assert.ok(props.publication_date);
      assert.ok(props.topics);
      assert.ok(props.summary);
      assert.ok(props.related_matters);
    });

    it('should have news_type enum', () => {
      const newsType = FTCNewsSchema.properties.news_type;
      assert.strictEqual(newsType.type, 'string');
      assert.ok(Array.isArray(newsType.enum));
      assert.ok(newsType.enum.includes('Press Release'));
      assert.ok(newsType.enum.includes('Statement'));
      assert.ok(newsType.enum.includes('Speech'));
    });

    it('should have array types for topics and related_matters', () => {
      const topics = FTCNewsSchema.properties.topics;
      const relatedMatters = FTCNewsSchema.properties.related_matters;
      assert.strictEqual(topics.type, 'array');
      assert.strictEqual(relatedMatters.type, 'array');
    });
  });

  describe('FTCConsumerAlertSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(FTCConsumerAlertSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(FTCConsumerAlertSchema.type, 'object');
      assert.strictEqual(FTCConsumerAlertSchema.title, 'FTC Consumer Alert');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(FTCConsumerAlertSchema.required));
      assert.ok(FTCConsumerAlertSchema.required.includes('title'));
      assert.ok(FTCConsumerAlertSchema.required.includes('alert_type'));
    });

    it('should have consumer alert properties', () => {
      const props = FTCConsumerAlertSchema.properties;
      assert.ok(props.title);
      assert.ok(props.alert_type);
      assert.ok(props.publication_date);
      assert.ok(props.risk_level);
      assert.ok(props.affected_groups);
      assert.ok(props.warning_details);
      assert.ok(props.protective_actions);
      assert.ok(props.related_scams);
    });

    it('should have alert_type enum', () => {
      const alertType = FTCConsumerAlertSchema.properties.alert_type;
      assert.strictEqual(alertType.type, 'string');
      assert.ok(Array.isArray(alertType.enum));
      assert.ok(alertType.enum.includes('Scam Alert'));
      assert.ok(alertType.enum.includes('Identity Theft'));
      assert.ok(alertType.enum.includes('Fraud Warning'));
    });

    it('should have risk_level enum', () => {
      const riskLevel = FTCConsumerAlertSchema.properties.risk_level;
      assert.strictEqual(riskLevel.type, 'string');
      assert.ok(Array.isArray(riskLevel.enum));
      assert.ok(riskLevel.enum.includes('High'));
      assert.ok(riskLevel.enum.includes('Medium'));
      assert.ok(riskLevel.enum.includes('Low'));
    });

    it('should have array types for multiple fields', () => {
      const affectedGroups = FTCConsumerAlertSchema.properties.affected_groups;
      const protectiveActions = FTCConsumerAlertSchema.properties.protective_actions;
      const relatedScams = FTCConsumerAlertSchema.properties.related_scams;
      assert.strictEqual(affectedGroups.type, 'array');
      assert.strictEqual(protectiveActions.type, 'array');
      assert.strictEqual(relatedScams.type, 'array');
    });
  });

  describe('Reusable Types and Enums', () => {
    it('should have MatterTypeEnum', () => {
      assert.ok(Array.isArray(MatterTypeEnum));
      assert.ok(MatterTypeEnum.includes('Merger Review'));
      assert.ok(MatterTypeEnum.includes('HSR Early Termination'));
      assert.ok(MatterTypeEnum.includes('Monopolization'));
    });

    it('should have CaseTypeEnum', () => {
      assert.ok(Array.isArray(CaseTypeEnum));
      assert.ok(CaseTypeEnum.includes('Consent Order'));
      assert.ok(CaseTypeEnum.includes('Administrative Complaint'));
      assert.ok(CaseTypeEnum.includes('Settlement'));
    });

    it('should have GuidanceTypeEnum', () => {
      assert.ok(Array.isArray(GuidanceTypeEnum));
      assert.ok(GuidanceTypeEnum.includes('Policy Statement'));
      assert.ok(GuidanceTypeEnum.includes('Advisory Opinion'));
      assert.ok(GuidanceTypeEnum.includes('Guidance'));
    });

    it('should have RulemakingTypeEnum', () => {
      assert.ok(Array.isArray(RulemakingTypeEnum));
      assert.ok(RulemakingTypeEnum.includes('Proposed Rule'));
      assert.ok(RulemakingTypeEnum.includes('Final Rule'));
      assert.ok(RulemakingTypeEnum.includes('Request for Comment'));
    });
  });

  describe('FTCSchemas export', () => {
    it('should export all schemas in collection', () => {
      assert.ok(FTCSchemas.ftc_competition_matter);
      assert.ok(FTCSchemas.ftc_enforcement_case);
      assert.ok(FTCSchemas.ftc_guidance);
      assert.ok(FTCSchemas.ftc_rulemaking);
      assert.ok(FTCSchemas.ftc_news);
      assert.ok(FTCSchemas.ftc_consumer_alert);
    });

    it('should have matching references', () => {
      assert.strictEqual(FTCSchemas.ftc_competition_matter, FTCCompetitionMatterSchema);
      assert.strictEqual(FTCSchemas.ftc_enforcement_case, FTCEnforcementCaseSchema);
      assert.strictEqual(FTCSchemas.ftc_guidance, FTCGuidanceSchema);
      assert.strictEqual(FTCSchemas.ftc_rulemaking, FTCRulemakingSchema);
      assert.strictEqual(FTCSchemas.ftc_news, FTCNewsSchema);
      assert.strictEqual(FTCSchemas.ftc_consumer_alert, FTCConsumerAlertSchema);
    });
  });

  describe('Schema Compatibility', () => {
    it('should be compatible with SchemaValidator', () => {
      const schemas = [
        FTCCompetitionMatterSchema,
        FTCEnforcementCaseSchema,
        FTCGuidanceSchema,
        FTCRulemakingSchema,
        FTCNewsSchema,
        FTCConsumerAlertSchema
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
        FTCCompetitionMatterSchema,
        FTCEnforcementCaseSchema,
        FTCGuidanceSchema,
        FTCRulemakingSchema,
        FTCNewsSchema,
        FTCConsumerAlertSchema
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
  console.log('Running FTCSchemas tests...');
}
