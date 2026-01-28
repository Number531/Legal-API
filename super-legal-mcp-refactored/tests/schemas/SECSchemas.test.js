/**
 * SECSchemas.test.js
 * Unit tests for SEC schema definitions
 */

import { strict as assert } from 'assert';
import {
  SECFilingSchema,
  SECFinancialSchema,
  SECCompanySchema,
  SECXBRLConceptSchema,
  SECSchemas,
  AccessionNumberType,
  CIKType,
  TickerType,
  FormTypeEnum
} from '../../src/api-clients/schemas/SECSchemas.js';

describe('SECSchemas', () => {
  describe('SECFilingSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(SECFilingSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(SECFilingSchema.type, 'object');
      assert.strictEqual(SECFilingSchema.title, 'SEC Filing');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(SECFilingSchema.required));
      assert.ok(SECFilingSchema.required.includes('accession_number'));
      assert.ok(SECFilingSchema.required.includes('form_type'));
      assert.ok(SECFilingSchema.required.includes('filing_date'));
      assert.ok(SECFilingSchema.required.includes('company_name'));
    });

    it('should have key properties', () => {
      const props = SECFilingSchema.properties;
      assert.ok(props.accession_number);
      assert.ok(props.form_type);
      assert.ok(props.filing_date);
      assert.ok(props.report_date);
      assert.ok(props.company_name);
      assert.ok(props.cik);
      assert.ok(props.ticker);
      assert.ok(props.primary_document);
      assert.ok(props.edgar_url);
    });

    it('should have accession_number pattern validation', () => {
      const accession = SECFilingSchema.properties.accession_number;
      assert.strictEqual(accession.type, 'string');
      assert.ok(accession.pattern);
      assert.ok(accession.pattern.includes('\\d{10}'));
    });

    it('should have form_type enum with common forms', () => {
      const formType = SECFilingSchema.properties.form_type;
      assert.strictEqual(formType.type, 'string');
      assert.ok(Array.isArray(formType.enum));
      assert.ok(formType.enum.includes('10-K'));
      assert.ok(formType.enum.includes('10-Q'));
      assert.ok(formType.enum.includes('8-K'));
      assert.ok(formType.enum.includes('S-1'));
    });

    it('should have CIK pattern validation', () => {
      const cik = SECFilingSchema.properties.cik;
      assert.strictEqual(cik.type, 'string');
      assert.ok(cik.pattern);
      assert.ok(cik.pattern.includes('\\d{10}'));
    });

    it('should have ticker pattern validation', () => {
      const ticker = SECFilingSchema.properties.ticker;
      assert.strictEqual(ticker.type, 'string');
      assert.ok(ticker.pattern);
      assert.ok(ticker.pattern.includes('[A-Z]'));
    });

    it('should have date types for filing_date and report_date', () => {
      const filingDate = SECFilingSchema.properties.filing_date;
      const reportDate = SECFilingSchema.properties.report_date;
      assert.strictEqual(filingDate.type, 'string');
      assert.strictEqual(reportDate.type, 'string');
      assert.ok(filingDate.pattern);
      assert.ok(reportDate.pattern);
    });
  });

  describe('SECFinancialSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(SECFinancialSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(SECFinancialSchema.type, 'object');
      assert.strictEqual(SECFinancialSchema.title, 'SEC Financial Metrics');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(SECFinancialSchema.required));
      assert.ok(SECFinancialSchema.required.includes('company_name'));
      assert.ok(SECFinancialSchema.required.includes('fiscal_year'));
      assert.ok(SECFinancialSchema.required.includes('fiscal_period'));
    });

    it('should have key financial properties', () => {
      const props = SECFinancialSchema.properties;
      assert.ok(props.company_name);
      assert.ok(props.cik);
      assert.ok(props.fiscal_year);
      assert.ok(props.fiscal_period);
      assert.ok(props.revenue);
      assert.ok(props.net_income);
      assert.ok(props.total_assets);
      assert.ok(props.total_liabilities);
      assert.ok(props.stockholders_equity);
      assert.ok(props.earnings_per_share);
      assert.ok(props.cash_and_equivalents);
      assert.ok(props.filing_date);
    });

    it('should have fiscal_year as integer with bounds', () => {
      const fiscalYear = SECFinancialSchema.properties.fiscal_year;
      assert.strictEqual(fiscalYear.type, 'integer');
      assert.strictEqual(fiscalYear.minimum, 1900);
      assert.strictEqual(fiscalYear.maximum, 2100);
    });

    it('should have fiscal_period enum', () => {
      const fiscalPeriod = SECFinancialSchema.properties.fiscal_period;
      assert.strictEqual(fiscalPeriod.type, 'string');
      assert.ok(Array.isArray(fiscalPeriod.enum));
      assert.ok(fiscalPeriod.enum.includes('FY'));
      assert.ok(fiscalPeriod.enum.includes('Q1'));
      assert.ok(fiscalPeriod.enum.includes('Q2'));
      assert.ok(fiscalPeriod.enum.includes('Q3'));
      assert.ok(fiscalPeriod.enum.includes('Q4'));
    });

    it('should allow negative values for net_income and stockholders_equity', () => {
      const netIncome = SECFinancialSchema.properties.net_income;
      const equity = SECFinancialSchema.properties.stockholders_equity;
      assert.strictEqual(netIncome.type, 'number');
      assert.strictEqual(equity.type, 'number');
      // No minimum constraint, allowing negative values
      assert.strictEqual(netIncome.minimum, undefined);
      assert.strictEqual(equity.minimum, undefined);
    });

    it('should have monetary type for positive-only fields', () => {
      const revenue = SECFinancialSchema.properties.revenue;
      const assets = SECFinancialSchema.properties.total_assets;
      assert.strictEqual(revenue.type, 'number');
      assert.strictEqual(assets.type, 'number');
      assert.ok(revenue.minimum !== undefined);
      assert.ok(assets.minimum !== undefined);
    });
  });

  describe('SECCompanySchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(SECCompanySchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(SECCompanySchema.type, 'object');
      assert.strictEqual(SECCompanySchema.title, 'SEC Company Information');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(SECCompanySchema.required));
      assert.ok(SECCompanySchema.required.includes('company_name'));
      assert.ok(SECCompanySchema.required.includes('cik'));
    });

    it('should have key company properties', () => {
      const props = SECCompanySchema.properties;
      assert.ok(props.company_name);
      assert.ok(props.cik);
      assert.ok(props.ticker);
      assert.ok(props.exchange);
      assert.ok(props.sic_code);
      assert.ok(props.sic_description);
      assert.ok(props.business_address);
      assert.ok(props.state_of_incorporation);
      assert.ok(props.fiscal_year_end);
    });

    it('should have exchange enum', () => {
      const exchange = SECCompanySchema.properties.exchange;
      assert.strictEqual(exchange.type, 'string');
      assert.ok(Array.isArray(exchange.enum));
      assert.ok(exchange.enum.includes('NYSE'));
      assert.ok(exchange.enum.includes('NASDAQ'));
      assert.ok(exchange.enum.includes('AMEX'));
    });

    it('should have sic_code pattern validation', () => {
      const sicCode = SECCompanySchema.properties.sic_code;
      assert.strictEqual(sicCode.type, 'string');
      assert.ok(sicCode.pattern);
      assert.ok(sicCode.pattern.includes('\\d{4}'));
    });

    it('should have state_of_incorporation pattern', () => {
      const state = SECCompanySchema.properties.state_of_incorporation;
      assert.strictEqual(state.type, 'string');
      assert.ok(state.pattern);
      assert.ok(state.pattern.includes('[A-Z]{2}'));
    });

    it('should have fiscal_year_end pattern (MMDD)', () => {
      const fye = SECCompanySchema.properties.fiscal_year_end;
      assert.strictEqual(fye.type, 'string');
      assert.ok(fye.pattern);
      // Should match MMDD format
      assert.ok(fye.description.includes('MMDD'));
    });
  });

  describe('SECXBRLConceptSchema', () => {
    it('should have correct schema structure', () => {
      assert.strictEqual(SECXBRLConceptSchema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(SECXBRLConceptSchema.type, 'object');
      assert.strictEqual(SECXBRLConceptSchema.title, 'SEC XBRL Concept');
    });

    it('should have required fields', () => {
      assert.ok(Array.isArray(SECXBRLConceptSchema.required));
      assert.ok(SECXBRLConceptSchema.required.includes('concept_name'));
      assert.ok(SECXBRLConceptSchema.required.includes('value'));
      assert.ok(SECXBRLConceptSchema.required.includes('period_end'));
    });

    it('should have key XBRL properties', () => {
      const props = SECXBRLConceptSchema.properties;
      assert.ok(props.concept_name);
      assert.ok(props.label);
      assert.ok(props.value);
      assert.ok(props.unit);
      assert.ok(props.period_start);
      assert.ok(props.period_end);
      assert.ok(props.filed_date);
    });

    it('should have unit enum', () => {
      const unit = SECXBRLConceptSchema.properties.unit;
      assert.strictEqual(unit.type, 'string');
      assert.ok(Array.isArray(unit.enum));
      assert.ok(unit.enum.includes('USD'));
      assert.ok(unit.enum.includes('shares'));
      assert.ok(unit.enum.includes('pure'));
      assert.ok(unit.enum.includes('USD/shares'));
    });

    it('should have numeric value type', () => {
      const value = SECXBRLConceptSchema.properties.value;
      assert.strictEqual(value.type, 'number');
    });

    it('should have date types for periods', () => {
      const periodStart = SECXBRLConceptSchema.properties.period_start;
      const periodEnd = SECXBRLConceptSchema.properties.period_end;
      assert.strictEqual(periodStart.type, 'string');
      assert.strictEqual(periodEnd.type, 'string');
      assert.ok(periodStart.pattern);
      assert.ok(periodEnd.pattern);
    });
  });

  describe('Reusable Types', () => {
    describe('AccessionNumberType', () => {
      it('should have correct structure', () => {
        assert.strictEqual(AccessionNumberType.type, 'string');
        assert.ok(AccessionNumberType.pattern);
        assert.ok(AccessionNumberType.description);
      });

      it('should have pattern for accession number format', () => {
        assert.ok(AccessionNumberType.pattern.includes('\\d{10}'));
        assert.ok(AccessionNumberType.pattern.includes('\\d{2}'));
        assert.ok(AccessionNumberType.pattern.includes('\\d{6}'));
      });
    });

    describe('CIKType', () => {
      it('should have correct structure', () => {
        assert.strictEqual(CIKType.type, 'string');
        assert.ok(CIKType.pattern);
        assert.ok(CIKType.description);
      });

      it('should require exactly 10 digits', () => {
        assert.ok(CIKType.pattern.includes('\\d{10}'));
      });
    });

    describe('TickerType', () => {
      it('should have correct structure', () => {
        assert.strictEqual(TickerType.type, 'string');
        assert.ok(TickerType.pattern);
        assert.ok(TickerType.description);
      });

      it('should match 1-5 uppercase letters', () => {
        assert.ok(TickerType.pattern.includes('[A-Z]'));
        assert.ok(TickerType.pattern.includes('{1,5}'));
      });
    });

    describe('FormTypeEnum', () => {
      it('should be an array of form types', () => {
        assert.ok(Array.isArray(FormTypeEnum));
        assert.ok(FormTypeEnum.length > 0);
      });

      it('should include common form types', () => {
        assert.ok(FormTypeEnum.includes('10-K'));
        assert.ok(FormTypeEnum.includes('10-Q'));
        assert.ok(FormTypeEnum.includes('8-K'));
        assert.ok(FormTypeEnum.includes('10-K/A'));
        assert.ok(FormTypeEnum.includes('S-1'));
        assert.ok(FormTypeEnum.includes('DEF 14A'));
      });

      it('should include insider trading forms', () => {
        assert.ok(FormTypeEnum.includes('3'));
        assert.ok(FormTypeEnum.includes('4'));
      });

      it('should include beneficial ownership forms', () => {
        assert.ok(FormTypeEnum.includes('13D'));
        assert.ok(FormTypeEnum.includes('13G'));
        assert.ok(FormTypeEnum.includes('SC 13D'));
        assert.ok(FormTypeEnum.includes('SC 13G'));
      });
    });
  });

  describe('SECSchemas export', () => {
    it('should export all schemas in collection', () => {
      assert.ok(SECSchemas.sec_filing);
      assert.ok(SECSchemas.sec_financial);
      assert.ok(SECSchemas.sec_company);
      assert.ok(SECSchemas.sec_xbrl_concept);
    });

    it('should have matching references', () => {
      assert.strictEqual(SECSchemas.sec_filing, SECFilingSchema);
      assert.strictEqual(SECSchemas.sec_financial, SECFinancialSchema);
      assert.strictEqual(SECSchemas.sec_company, SECCompanySchema);
      assert.strictEqual(SECSchemas.sec_xbrl_concept, SECXBRLConceptSchema);
    });
  });

  describe('Schema Compatibility', () => {
    it('should be compatible with SchemaValidator', () => {
      const schemas = [
        SECFilingSchema,
        SECFinancialSchema,
        SECCompanySchema,
        SECXBRLConceptSchema
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
        SECFilingSchema,
        SECFinancialSchema,
        SECCompanySchema,
        SECXBRLConceptSchema
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
  console.log('Running SECSchemas tests...');
}
