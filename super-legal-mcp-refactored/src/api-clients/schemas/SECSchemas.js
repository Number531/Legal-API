/**
 * SECSchemas.js
 * JSON Schema v7 definitions for SEC data types
 *
 * Covers:
 * - SEC filings (10-K, 10-Q, 8-K, etc.)
 * - Financial metrics and company facts
 * - Company information and tickers
 * - XBRL data frames
 */

import { CommonTypes, createSchema } from './BaseSchemas.js';

/**
 * SEC Filing Schema
 * Structured extraction from SEC EDGAR filings
 */
export const SECFilingSchema = createSchema(
  'SEC Filing',
  {
    accession_number: {
      type: 'string',
      // RELAXED: Removed strict pattern to allow flexible formats
      // pattern: '^\\d{10}-\\d{2}-\\d{6}$',
      description: 'Unique SEC accession number (flexible format accepted)'
    },
    form_type: {
      type: 'string',
      // RELAXED: Removed strict enum to allow variations and abbreviated forms
      // enum: ['10-K', '10-Q', '8-K', '10-K/A', '10-Q/A', '8-K/A', 'S-1', 'S-3', 'S-4', 'DEF 14A', '13F-HR', '13D', '13G', '4', '3', 'SC 13D', 'SC 13G'],
      description: 'Type of SEC form filed (e.g., 10-K, 10-Q, 8-K)'
    },
    filing_date: {
      ...CommonTypes.date,
      description: 'Date the filing was submitted to SEC (flexible date format accepted)'
    },
    report_date: {
      ...CommonTypes.date,
      description: 'Period end date covered by the report'
    },
    company_name: {
      type: 'string',
      description: 'Name of the company filing'
    },
    cik: {
      type: 'string',
      // RELAXED: Removed strict 10-digit pattern to allow flexible formats
      // pattern: '^\\d{10}$',
      description: 'Central Index Key - company identifier (flexible format accepted)'
    },
    ticker: {
      type: 'string',
      // RELAXED: Removed strict uppercase pattern
      // pattern: '^[A-Z]{1-5}$',
      description: 'Stock ticker symbol (1-5 characters)'
    },
    primary_document: {
      type: 'string',
      description: 'Primary document filename'
    },
    edgar_url: {
      ...CommonTypes.url,
      description: 'URL to the filing on SEC EDGAR'
    }
  },
  // SIMPLIFIED: Reduced from 4 required fields to 2 (matches EPA/FDA pattern)
  // Previous: ['accession_number', 'form_type', 'filing_date', 'company_name']
  // New: Only require the two most reliably extractable fields
  ['company_name', 'form_type'] // Minimum required fields - allows Gemini to return partial matches
);

/**
 * SEC Financial Metrics Schema
 * Structured extraction of financial data from SEC filings
 */
export const SECFinancialSchema = createSchema(
  'SEC Financial Metrics',
  {
    company_name: {
      type: 'string',
      description: 'Name of the company'
    },
    cik: {
      type: 'string',
      pattern: '^\\d{10}$',
      description: 'Central Index Key'
    },
    fiscal_year: {
      type: 'integer',
      minimum: 1900,
      maximum: 2100,
      description: 'Fiscal year for the financial data'
    },
    fiscal_period: {
      type: 'string',
      enum: ['FY', 'Q1', 'Q2', 'Q3', 'Q4'],
      description: 'Fiscal period (FY for annual, Q1-Q4 for quarterly)'
    },
    revenue: {
      ...CommonTypes.monetary,
      description: 'Total revenue/sales'
    },
    net_income: {
      type: 'number',
      description: 'Net income (can be negative for losses)'
    },
    total_assets: {
      ...CommonTypes.monetary,
      description: 'Total assets'
    },
    total_liabilities: {
      ...CommonTypes.monetary,
      description: 'Total liabilities'
    },
    stockholders_equity: {
      type: 'number',
      description: 'Stockholders equity (can be negative)'
    },
    earnings_per_share: {
      type: 'number',
      description: 'Earnings per share (EPS)'
    },
    cash_and_equivalents: {
      ...CommonTypes.monetary,
      description: 'Cash and cash equivalents'
    },
    filing_date: {
      ...CommonTypes.date,
      description: 'Date the financial data was filed'
    }
  },
  ['company_name', 'fiscal_year', 'fiscal_period'] // Minimum required fields
);

/**
 * SEC Company Information Schema
 * Structured extraction of company details and identifiers
 */
export const SECCompanySchema = createSchema(
  'SEC Company Information',
  {
    company_name: {
      type: 'string',
      description: 'Official company name as registered with SEC'
    },
    cik: {
      type: 'string',
      pattern: '^\\d{10}$',
      description: 'Central Index Key - 10-digit identifier'
    },
    ticker: {
      type: 'string',
      pattern: '^[A-Z]{1,5}$',
      description: 'Stock ticker symbol'
    },
    exchange: {
      type: 'string',
      enum: ['NYSE', 'NASDAQ', 'AMEX', 'OTC', 'OTHER'],
      description: 'Stock exchange where company is listed'
    },
    sic_code: {
      type: 'string',
      pattern: '^\\d{4}$',
      description: 'Standard Industrial Classification code'
    },
    sic_description: {
      type: 'string',
      description: 'Description of the SIC industry category'
    },
    business_address: {
      type: 'string',
      description: 'Company business address'
    },
    state_of_incorporation: {
      type: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'Two-letter state code of incorporation'
    },
    fiscal_year_end: {
      type: 'string',
      pattern: '^(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$',
      description: 'Fiscal year end date (MMDD format)'
    }
  },
  ['company_name', 'cik'] // Minimum required fields
);

/**
 * SEC XBRL Concept Schema
 * Structured extraction of XBRL taxonomy concepts
 */
export const SECXBRLConceptSchema = createSchema(
  'SEC XBRL Concept',
  {
    concept_name: {
      type: 'string',
      description: 'XBRL concept/tag name (e.g., us-gaap:Revenue)'
    },
    label: {
      type: 'string',
      description: 'Human-readable label for the concept'
    },
    value: {
      type: 'number',
      description: 'Numeric value of the concept'
    },
    unit: {
      type: 'string',
      enum: ['USD', 'shares', 'pure', 'USD/shares'],
      description: 'Unit of measurement'
    },
    period_start: {
      ...CommonTypes.date,
      description: 'Start date of the reporting period'
    },
    period_end: {
      ...CommonTypes.date,
      description: 'End date of the reporting period'
    },
    filed_date: {
      ...CommonTypes.date,
      description: 'Date the data was filed with SEC'
    }
  },
  ['concept_name', 'value', 'period_end'] // Minimum required fields
);

/**
 * Accession Number type
 * Reusable type for SEC accession numbers
 */
export const AccessionNumberType = {
  type: 'string',
  pattern: '^\\d{10}-\\d{2}-\\d{6}$',
  description: 'SEC accession number format: 0000000000-00-000000'
};

/**
 * CIK (Central Index Key) type
 * Reusable type for company CIK numbers
 */
export const CIKType = {
  type: 'string',
  pattern: '^\\d{10}$',
  description: 'Central Index Key - 10-digit company identifier with leading zeros'
};

/**
 * Ticker Symbol type
 * Reusable type for stock ticker symbols
 */
export const TickerType = {
  type: 'string',
  pattern: '^[A-Z]{1,5}$',
  description: 'Stock ticker symbol (1-5 uppercase letters)'
};

/**
 * Form Type enum
 * Common SEC form types
 */
export const FormTypeEnum = [
  '10-K',    // Annual report
  '10-Q',    // Quarterly report
  '8-K',     // Current report
  '10-K/A',  // Amended annual report
  '10-Q/A',  // Amended quarterly report
  '8-K/A',   // Amended current report
  'S-1',     // Registration statement
  'S-3',     // Registration statement
  'S-4',     // Registration statement
  'DEF 14A', // Proxy statement
  '13F-HR',  // Institutional investment manager holdings
  '13D',     // Beneficial ownership report
  '13G',     // Beneficial ownership report
  '4',       // Insider trading report
  '3',       // Initial insider trading report
  'SC 13D',  // Tender offer/acquisition report
  'SC 13G'   // Tender offer/acquisition report
];

/**
 * Export all schemas
 */
export const SECSchemas = {
  sec_filing: SECFilingSchema,
  sec_financial: SECFinancialSchema,
  sec_company: SECCompanySchema,
  sec_xbrl_concept: SECXBRLConceptSchema
};

/**
 * Default export
 */
export default SECSchemas;
