import { describe, test, expect } from '@jest/globals';
import {
  STRUCTURED_OUTPUT_ENABLED,
  SEC_FILING_SCHEMA,
  EPA_FACILITY_SCHEMA,
  FDA_DEVICE_SCHEMA,
  GOVINFO_BILL_SCHEMA
} from '../../src/config/structuredOutputSchemas.js';
import { validateSchema, safeParseStructured } from '../../src/utils/structuredOutputValidator.js';

const sampleSec = {
  company: { name: 'Tesla', ticker: 'TSLA', cik: '0001318605' },
  filings: [
    {
      type: '10-K',
      filed_date: '2024-02-01',
      accession_number: '0001318605-24-000010',
      url: 'https://www.sec.gov/Archives/edgar/data/1318605/000131860524000010/tsla-20231231x10k.htm',
      summary: 'Annual report'
    }
  ],
  metadata: { total_results: 1, source: 'api' }
};

const sampleEpa = {
  facility_name: 'Exxon Baytown',
  registry_id: '1100000000001',
  location: { address: '123 Main', city: 'Baytown', state: 'TX', zip: '77001' },
  violations: [{ date: '2024-01-10', statute: 'CAA', description: 'Emission exceedance', penalty: 50000 }]
};

const sampleFda = {
  device_name: 'Pacemaker X',
  recall_number: 'Z-1234-2024',
  recall_date: '2024-03-15',
  reason: 'Battery failure',
  classification: 'Class I',
  manufacturer: 'MediCorp'
};

const sampleGovinfo = {
  bill_number: 'H.R.1234',
  title: 'Climate Action Act',
  sponsor: 'Rep. Smith',
  congress: '118',
  status: 'Introduced',
  introduced_date: '2024-02-10'
};

describe('Structured output schemas', () => {
  test('SEC schema validates sample', () => {
    const { valid, errors } = validateSchema(sampleSec, SEC_FILING_SCHEMA);
    expect(valid).toBe(true);
    expect(errors).toBeNull();
  });

  test('EPA schema validates sample', () => {
    const { valid, errors } = validateSchema(sampleEpa, EPA_FACILITY_SCHEMA);
    expect(valid).toBe(true);
    expect(errors).toBeNull();
  });

  test('FDA schema validates sample', () => {
    const { valid, errors } = validateSchema(sampleFda, FDA_DEVICE_SCHEMA);
    expect(valid).toBe(true);
    expect(errors).toBeNull();
  });

  test('GovInfo schema validates sample', () => {
    const { valid, errors } = validateSchema(sampleGovinfo, GOVINFO_BILL_SCHEMA);
    expect(valid).toBe(true);
    expect(errors).toBeNull();
  });
});

describe('safeParseStructured', () => {
  test('parses and validates valid payload', () => {
    const parsed = safeParseStructured(JSON.stringify(sampleSec), SEC_FILING_SCHEMA, 'search_sec_filings');
    expect(parsed.valid).toBe(true);
    expect(parsed.errors).toBeNull();
  });

  test('flags invalid payload', () => {
    const bad = { ...sampleSec, filings: 'not-an-array' };
    const parsed = safeParseStructured(JSON.stringify(bad), SEC_FILING_SCHEMA, 'search_sec_filings');
    expect(parsed.valid).toBe(false);
  });
});

describe('STRUCTURED_OUTPUT_ENABLED map', () => {
  test('contains domain tool mappings', () => {
    expect(STRUCTURED_OUTPUT_ENABLED.search_sec_filings).toBeDefined();
    expect(STRUCTURED_OUTPUT_ENABLED.search_epa_violations).toBeDefined();
    expect(STRUCTURED_OUTPUT_ENABLED.search_fda_device_events).toBeDefined();
  });
});

