/**
 * Domain JSON Schemas for structured outputs (Phase 3).
 */

export const SEC_FILING_SCHEMA = {
  type: 'object',
  properties: {
    company: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        ticker: { type: 'string' },
        cik: { type: 'string' }
      },
      required: ['name']
    },
    filings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          filed_date: { type: 'string', format: 'date' },
          accession_number: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          summary: { type: 'string' }
        },
        required: ['type', 'filed_date', 'url']
      }
    },
    metadata: {
      type: 'object',
      properties: {
        total_results: { type: 'number' },
        query_time_ms: { type: 'number' },
        source: { type: 'string' }
      }
    }
  },
  required: ['company', 'filings']
};

export const EPA_FACILITY_SCHEMA = {
  type: 'object',
  properties: {
    facility_name: { type: 'string' },
    registry_id: { type: 'string' },
    location: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        zip: { type: 'string' }
      }
    },
    violations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          statute: { type: 'string' },
          description: { type: 'string' },
          penalty: { type: 'number' }
        }
      }
    }
  },
  required: ['facility_name', 'registry_id']
};

export const FDA_DEVICE_SCHEMA = {
  type: 'object',
  properties: {
    device_name: { type: 'string' },
    recall_number: { type: 'string' },
    recall_date: { type: 'string', format: 'date' },
    reason: { type: 'string' },
    classification: { type: 'string' },
    manufacturer: { type: 'string' }
  },
  required: ['device_name', 'recall_number', 'recall_date']
};

export const GOVINFO_BILL_SCHEMA = {
  type: 'object',
  properties: {
    bill_number: { type: 'string' },
    title: { type: 'string' },
    sponsor: { type: 'string' },
    congress: { type: 'string' },
    status: { type: 'string' },
    introduced_date: { type: 'string', format: 'date' }
  },
  required: ['bill_number', 'title']
};

export const STRUCTURED_OUTPUT_ENABLED = {
  // SEC
  search_sec_filings: SEC_FILING_SCHEMA,
  get_sec_company_facts: SEC_FILING_SCHEMA,

  // EPA
  search_epa_violations: EPA_FACILITY_SCHEMA,
  search_epa_facilities: EPA_FACILITY_SCHEMA,

  // FDA
  search_fda_device_events: FDA_DEVICE_SCHEMA,
  search_fda_recalls: FDA_DEVICE_SCHEMA,

  // GovInfo
  search_federal_register: GOVINFO_BILL_SCHEMA,
  search_us_code: GOVINFO_BILL_SCHEMA,
  search_federal_register_notices: GOVINFO_BILL_SCHEMA
};

