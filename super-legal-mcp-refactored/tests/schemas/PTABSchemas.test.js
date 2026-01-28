/**
 * PTABSchemas.test.js
 * Unit tests for PTAB schema definitions
 */

import { strict as assert } from 'assert';
import {
  PTABProceedingSchema,
  IPRProceedingSchema,
  PGRProceedingSchema,
  CBMProceedingSchema,
  PTABDecisionSchema,
  PTABSchemas,
  ProceedingTypeEnum,
  ProceedingStatusEnum,
  DecisionOutcomeEnum,
  ProceedingNumberType
} from '../../src/api-clients/schemas/PTABSchemas.js';

describe('PTABSchemas', () => {
  describe('PTABProceedingSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(PTABProceedingSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(PTABProceedingSchema.type, 'object');
      assert.strictEqual(PTABProceedingSchema.title, 'PTAB Proceeding');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(PTABProceedingSchema.required));
      assert.ok(PTABProceedingSchema.required.includes('proceeding_type'));
      assert.ok(PTABProceedingSchema.required.includes('proceeding_number'));
    });

    it('should have key proceeding properties', () => {
      const props = PTABProceedingSchema.properties;
      assert.ok(props.proceeding_type);
      assert.ok(props.proceeding_number);
      assert.ok(props.title);
      assert.ok(props.patent_number);
      assert.ok(props.petitioner);
      assert.ok(props.patent_owner);
      assert.ok(props.status);
      assert.ok(props.filed_date);
      assert.ok(props.decision_date);
      assert.ok(props.url);
    });

    it('should have proceeding_type enum', () => {
      const proceedingType = PTABProceedingSchema.properties.proceeding_type;
      assert.strictEqual(proceedingType.type, 'string');
      assert.ok(Array.isArray(proceedingType.enum));
      assert.ok(proceedingType.enum.includes('IPR'));
      assert.ok(proceedingType.enum.includes('PGR'));
      assert.ok(proceedingType.enum.includes('CBM'));
    });

    it('should have proceeding_number pattern validation', () => {
      const proceedingNum = PTABProceedingSchema.properties.proceeding_number;
      assert.strictEqual(proceedingNum.type, 'string');
      assert.ok(proceedingNum.pattern);
      assert.ok(proceedingNum.pattern.includes('IPR'));
    });

    it('should have status enum', () => {
      const status = PTABProceedingSchema.properties.status;
      assert.strictEqual(status.type, 'string');
      assert.ok(Array.isArray(status.enum));
      assert.ok(status.enum.includes('Trial Instituted'));
      assert.ok(status.enum.includes('Final Written Decision'));
    });

    it('should have outcome enum', () => {
      const outcome = PTABProceedingSchema.properties.outcome;
      assert.strictEqual(outcome.type, 'string');
      assert.ok(Array.isArray(outcome.enum));
      assert.ok(outcome.enum.includes('Claims Unpatentable'));
      assert.ok(outcome.enum.includes('Claims Patentable'));
    });
  });

  describe('IPRProceedingSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(IPRProceedingSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(IPRProceedingSchema.type, 'object');
      assert.strictEqual(IPRProceedingSchema.title, 'IPR Proceeding');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(IPRProceedingSchema.required));
      assert.ok(IPRProceedingSchema.required.includes('proceeding_number'));
      assert.ok(IPRProceedingSchema.required.includes('patent_number'));
    });

    it('should have IPR-specific properties', () => {
      const props = IPRProceedingSchema.properties;
      assert.ok(props.proceeding_number);
      assert.ok(props.patent_number);
      assert.ok(props.petitioner);
      assert.ok(props.patent_owner);
      assert.ok(props.claims_challenged);
      assert.ok(props.prior_art_references);
    });

    it('should have IPR proceeding_number pattern', () => {
      const proceedingNum = IPRProceedingSchema.properties.proceeding_number;
      assert.ok(proceedingNum.pattern);
      assert.ok(proceedingNum.pattern.includes('^IPR'));
      assert.ok(proceedingNum.pattern.includes('\\d{4}-\\d{5}'));
    });

    it('should have patent_number pattern', () => {
      const patentNum = IPRProceedingSchema.properties.patent_number;
      assert.ok(patentNum.pattern);
      assert.ok(patentNum.pattern.includes('\\d{7,8}'));
    });

    it('should have array types for claims and prior art', () => {
      const claims = IPRProceedingSchema.properties.claims_challenged;
      const priorArt = IPRProceedingSchema.properties.prior_art_references;
      assert.strictEqual(claims.type, 'array');
      assert.strictEqual(priorArt.type, 'array');
    });
  });

  describe('PGRProceedingSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(PGRProceedingSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(PGRProceedingSchema.type, 'object');
      assert.strictEqual(PGRProceedingSchema.title, 'PGR Proceeding');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(PGRProceedingSchema.required));
      assert.ok(PGRProceedingSchema.required.includes('proceeding_number'));
      assert.ok(PGRProceedingSchema.required.includes('patent_number'));
    });

    it('should have PGR-specific properties', () => {
      const props = PGRProceedingSchema.properties;
      assert.ok(props.proceeding_number);
      assert.ok(props.patent_number);
      assert.ok(props.petitioner);
      assert.ok(props.grounds_for_challenge);
    });

    it('should have PGR proceeding_number pattern', () => {
      const proceedingNum = PGRProceedingSchema.properties.proceeding_number;
      assert.ok(proceedingNum.pattern);
      assert.ok(proceedingNum.pattern.includes('^PGR'));
    });

    it('should have grounds_for_challenge enum', () => {
      const grounds = PGRProceedingSchema.properties.grounds_for_challenge;
      assert.strictEqual(grounds.type, 'array');
      assert.ok(grounds.items.enum);
      assert.ok(grounds.items.enum.includes('Novelty (35 USC 102)'));
      assert.ok(grounds.items.enum.includes('Subject Matter Eligibility (35 USC 101)'));
    });
  });

  describe('CBMProceedingSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(CBMProceedingSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(CBMProceedingSchema.type, 'object');
      assert.strictEqual(CBMProceedingSchema.title, 'CBM Proceeding');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(CBMProceedingSchema.required));
      assert.ok(CBMProceedingSchema.required.includes('proceeding_number'));
      assert.ok(CBMProceedingSchema.required.includes('patent_number'));
    });

    it('should have CBM-specific properties', () => {
      const props = CBMProceedingSchema.properties;
      assert.ok(props.proceeding_number);
      assert.ok(props.patent_number);
      assert.ok(props.business_method_classification);
      assert.ok(props.technological_invention_determination);
    });

    it('should have CBM proceeding_number pattern', () => {
      const proceedingNum = CBMProceedingSchema.properties.proceeding_number;
      assert.ok(proceedingNum.pattern);
      assert.ok(proceedingNum.pattern.includes('^CBM'));
    });

    it('should have technological_invention_determination enum', () => {
      const techInv = CBMProceedingSchema.properties.technological_invention_determination;
      assert.strictEqual(techInv.type, 'string');
      assert.ok(Array.isArray(techInv.enum));
      assert.ok(techInv.enum.includes('Technological Invention'));
      assert.ok(techInv.enum.includes('Not Technological Invention'));
    });
  });

  describe('PTABDecisionSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(PTABDecisionSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(PTABDecisionSchema.type, 'object');
      assert.strictEqual(PTABDecisionSchema.title, 'PTAB Decision');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(PTABDecisionSchema.required));
      assert.ok(PTABDecisionSchema.required.includes('decision_type'));
      assert.ok(PTABDecisionSchema.required.includes('proceeding_number'));
      assert.ok(PTABDecisionSchema.required.includes('decision_date'));
    });

    it('should have decision-specific properties', () => {
      const props = PTABDecisionSchema.properties;
      assert.ok(props.decision_type);
      assert.ok(props.proceeding_number);
      assert.ok(props.decision_date);
      assert.ok(props.decision_summary);
      assert.ok(props.claims_analysis);
      assert.ok(props.judges);
    });

    it('should have decision_type enum', () => {
      const decisionType = PTABDecisionSchema.properties.decision_type;
      assert.strictEqual(decisionType.type, 'string');
      assert.ok(Array.isArray(decisionType.enum));
      assert.ok(decisionType.enum.includes('Institution Decision'));
      assert.ok(decisionType.enum.includes('Final Written Decision'));
      assert.ok(decisionType.enum.includes('Denial of Institution'));
    });

    it('should have claims_analysis as array of objects', () => {
      const claimsAnalysis = PTABDecisionSchema.properties.claims_analysis;
      assert.strictEqual(claimsAnalysis.type, 'array');
      assert.strictEqual(claimsAnalysis.items.type, 'object');
      assert.ok(claimsAnalysis.items.properties);
      assert.ok(claimsAnalysis.items.properties.claim_number);
      assert.ok(claimsAnalysis.items.properties.determination);
    });
  });

  describe('Reusable Types and Enums', () => {
    it('should have ProceedingNumberType', () => {
      assert.strictEqual(ProceedingNumberType.type, 'string');
      assert.ok(ProceedingNumberType.pattern);
      assert.ok(ProceedingNumberType.description);
    });

    it('should have ProceedingTypeEnum with all types', () => {
      assert.ok(Array.isArray(ProceedingTypeEnum));
      assert.ok(ProceedingTypeEnum.includes('IPR'));
      assert.ok(ProceedingTypeEnum.includes('PGR'));
      assert.ok(ProceedingTypeEnum.includes('CBM'));
      assert.ok(ProceedingTypeEnum.includes('DER'));
      assert.ok(ProceedingTypeEnum.includes('AIA'));
    });

    it('should have ProceedingStatusEnum', () => {
      assert.ok(Array.isArray(ProceedingStatusEnum));
      assert.ok(ProceedingStatusEnum.includes('Trial Instituted'));
      assert.ok(ProceedingStatusEnum.includes('Final Written Decision'));
      assert.ok(ProceedingStatusEnum.includes('Institution Denied'));
    });

    it('should have DecisionOutcomeEnum', () => {
      assert.ok(Array.isArray(DecisionOutcomeEnum));
      assert.ok(DecisionOutcomeEnum.includes('Claims Unpatentable'));
      assert.ok(DecisionOutcomeEnum.includes('Claims Patentable'));
      assert.ok(DecisionOutcomeEnum.includes('Partially Unpatentable'));
    });
  });

  describe('PTABSchemas export', () => {
    it('should export all schemas in collection', () => {
      assert.ok(PTABSchemas.ptab_proceeding);
      assert.ok(PTABSchemas.ptab_ipr_proceeding);
      assert.ok(PTABSchemas.ptab_pgr_proceeding);
      assert.ok(PTABSchemas.ptab_cbm_proceeding);
      assert.ok(PTABSchemas.ptab_decision);
    });

    it('should have matching references', () => {
      assert.strictEqual(PTABSchemas.ptab_proceeding, PTABProceedingSchema);
      assert.strictEqual(PTABSchemas.ptab_ipr_proceeding, IPRProceedingSchema);
      assert.strictEqual(PTABSchemas.ptab_pgr_proceeding, PGRProceedingSchema);
      assert.strictEqual(PTABSchemas.ptab_cbm_proceeding, CBMProceedingSchema);
      assert.strictEqual(PTABSchemas.ptab_decision, PTABDecisionSchema);
    });
  });

  describe('Schema Compatibility', () => {
    it('should be compatible with SchemaValidator', () => {
      const schemas = [
        PTABProceedingSchema,
        IPRProceedingSchema,
        PGRProceedingSchema,
        CBMProceedingSchema,
        PTABDecisionSchema
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
        PTABProceedingSchema,
        IPRProceedingSchema,
        PGRProceedingSchema,
        CBMProceedingSchema,
        PTABDecisionSchema
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
    it('should validate IPR proceeding numbers', () => {
      const pattern = new RegExp(IPRProceedingSchema.properties.proceeding_number.pattern);
      assert.ok(pattern.test('IPR2023-00123'));
      assert.ok(pattern.test('IPR2024-99999'));
      assert.ok(!pattern.test('PGR2023-00123'));
      assert.ok(!pattern.test('IPR2023-123'));
    });

    it('should validate PGR proceeding numbers', () => {
      const pattern = new RegExp(PGRProceedingSchema.properties.proceeding_number.pattern);
      assert.ok(pattern.test('PGR2023-00001'));
      assert.ok(pattern.test('PGR2024-12345'));
      assert.ok(!pattern.test('IPR2023-00123'));
      assert.ok(!pattern.test('PGR202300001'));
    });

    it('should validate CBM proceeding numbers', () => {
      const pattern = new RegExp(CBMProceedingSchema.properties.proceeding_number.pattern);
      assert.ok(pattern.test('CBM2023-00001'));
      assert.ok(pattern.test('CBM2024-56789'));
      assert.ok(!pattern.test('IPR2023-00123'));
      assert.ok(!pattern.test('CBM-2023-00001'));
    });

    it('should validate patent numbers in all schemas', () => {
      const schemas = [PTABProceedingSchema, IPRProceedingSchema, PGRProceedingSchema, CBMProceedingSchema];
      schemas.forEach(schema => {
        const pattern = new RegExp(schema.properties.patent_number.pattern);
        assert.ok(pattern.test('US1234567'));
        assert.ok(pattern.test('12345678'));
        assert.ok(pattern.test('US12345678A1'));
        assert.ok(!pattern.test('123456'));
        assert.ok(!pattern.test('123456789'));
      });
    });
  });
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running PTABSchemas tests...');
}
