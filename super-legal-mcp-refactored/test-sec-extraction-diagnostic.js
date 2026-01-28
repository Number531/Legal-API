/**
 * SEC Extraction Improvements - Diagnostic Test
 *
 * Purpose: Verify that the enhanced extraction logic can extract metadata
 * from both URLs and narrative text
 *
 * Tests:
 * 1. URL-based CIK extraction
 * 2. URL-based accession number extraction
 * 3. Filename-based date extraction
 * 4. Narrative-friendly form type patterns
 */

import dotenv from 'dotenv';
import { SECWebSearchClient } from './src/api-clients/SECWebSearchClient.js';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\\n');
}

// Test cases simulating Exa search results
const testCases = [
  {
    name: 'URL-Based Extraction (Tesla 10-K)',
    input: {
      url: 'https://www.sec.gov/Archives/edgar/data/1318605/000162828025035806/tsla-20250630.htm',
      title: 'Tesla, Inc. - SEC.gov',
      text: 'Tesla files annual reports with the SEC including financial statements and risk disclosures.'
    },
    expected: {
      cik: '1318605',
      accession_number: '0001628280-25-035806',
      filing_date: '2025-06-30',
      form_type: null  // Not in URL, needs text extraction
    }
  },
  {
    name: 'Narrative Form Type (10-K annual report)',
    input: {
      url: 'https://www.sec.gov/Archives/edgar/data/1318605/000162828025035806/tsla-20250630.htm',
      title: 'Tesla 10-K Annual Report',
      text: 'Tesla filed a 10-K annual report for the fiscal year ending December 31, 2024, reporting total revenue of $95 billion.'
    },
    expected: {
      cik: '1318605',
      accession_number: '0001628280-25-035806',
      filing_date: '2025-06-30',
      form_type: '10-K'  // Should extract from "filed a 10-K"
    }
  },
  {
    name: 'Narrative Form Type (10-Q quarterly report)',
    input: {
      url: 'https://www.sec.gov/Archives/edgar/data/19617/000001961725000421/jpm-20250331.htm',
      title: 'JPMorgan Chase Quarterly Report',
      text: 'JPMorgan Chase submitted a 10-Q quarterly report for Q1 2025 showing strong performance.'
    },
    expected: {
      cik: '0000019617',
      accession_number: '0000019617-25-000421',
      filing_date: '2025-03-31',
      form_type: '10-Q'  // Should extract from "submitted a 10-Q"
    }
  },
  {
    name: 'Keyword-Only Form Type (8-K)',
    input: {
      url: 'https://www.sec.gov/Archives/edgar/data/34088/000003408825000006/xom-20250131.htm',
      title: 'Exxon Mobil Corporation - 8-K',
      text: 'Exxon Mobil 8-K current report regarding material events and corporate changes'
    },
    expected: {
      cik: '0000034088',
      accession_number: '0000034088-25-000006',
      filing_date: '2025-01-31',
      form_type: '8-K'  // Should extract from "8-K" keyword
    }
  },
  {
    name: 'ISO Date in Text (fallback)',
    input: {
      url: 'https://www.sec.gov/Archives/edgar/data/1318605/000162828025035806/document.htm',
      title: 'Tesla SEC Filing',
      text: 'Tesla 10-K report dated 2025-06-30 includes comprehensive financial disclosures'
    },
    expected: {
      cik: '1318605',
      accession_number: '0001628280-25-035806',
      filing_date: '2025-06-30',  // From text "dated 2025-06-30"
      form_type: '10-K'
    }
  }
];

async function testExtraction() {
  logSection('🔬 SEC EXTRACTION IMPROVEMENTS DIAGNOSTIC');

  const secClient = new SECWebSearchClient(null);

  let totalTests = 0;
  let passedTests = 0;
  const failures = [];

  for (const testCase of testCases) {
    logSection(`TEST: ${testCase.name}`);

    log('Input:', 'cyan');
    console.log(`  URL:   ${testCase.input.url}`);
    console.log(`  Title: ${testCase.input.title}`);
    console.log(`  Text:  ${testCase.input.text.substring(0, 100)}...`);

    // Call the extraction method directly
    const result = secClient.extractSECMetadataPermissive(testCase.input);

    log('\\nExtracted:', 'cyan');
    console.log(JSON.stringify(result.data, null, 2));
    console.log(`Confidence: ${result.confidence.toFixed(2)}`);
    console.log(`Fields Extracted: ${result.extraction_count}`);

    log('\\nExpected:', 'cyan');
    console.log(JSON.stringify(testCase.expected, null, 2));

    // Validate results
    log('\\nValidation:', 'cyan');
    const tests = [
      {
        name: 'CIK',
        actual: result.data.cik,
        expected: testCase.expected.cik
      },
      {
        name: 'Accession Number',
        actual: result.data.accession_number,
        expected: testCase.expected.accession_number
      },
      {
        name: 'Filing Date',
        actual: result.data.filing_date,
        expected: testCase.expected.filing_date
      },
      {
        name: 'Form Type',
        actual: result.data.form_type,
        expected: testCase.expected.form_type
      }
    ];

    let testPassed = true;
    for (const test of tests) {
      totalTests++;

      // Skip null expectations
      if (test.expected === null) {
        log(`  ${test.name}: SKIPPED (expected null)`, 'yellow');
        continue;
      }

      if (test.actual === test.expected) {
        passedTests++;
        log(`  ✅ ${test.name}: ${test.actual}`, 'green');
      } else {
        testPassed = false;
        log(`  ❌ ${test.name}: Got "${test.actual}", expected "${test.expected}"`, 'red');
        failures.push({
          testCase: testCase.name,
          field: test.name,
          actual: test.actual,
          expected: test.expected
        });
      }
    }

    if (testPassed) {
      log('\\n✅ TEST PASSED', 'green');
    } else {
      log('\\n❌ TEST FAILED', 'red');
    }
  }

  // Summary
  logSection('📊 TEST SUMMARY');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failures.length > 0) {
    log('\\n❌ FAILURES:', 'red');
    for (const failure of failures) {
      console.log(`  ${failure.testCase} - ${failure.field}`);
      console.log(`    Expected: ${failure.expected}`);
      console.log(`    Got:      ${failure.actual}`);
    }
  }

  logSection('🎯 COVERAGE ANALYSIS');

  // Calculate coverage by field
  const fieldCoverage = {
    cik: 0,
    accession_number: 0,
    filing_date: 0,
    form_type: 0
  };

  const fieldTotal = testCases.length;

  for (const testCase of testCases) {
    const result = secClient.extractSECMetadataPermissive(testCase.input);
    if (result.data.cik) fieldCoverage.cik++;
    if (result.data.accession_number) fieldCoverage.accession_number++;
    if (result.data.filing_date) fieldCoverage.filing_date++;
    if (result.data.form_type) fieldCoverage.form_type++;
  }

  console.log('Field Extraction Coverage:');
  console.log(`  CIK:              ${fieldCoverage.cik}/${fieldTotal} (${((fieldCoverage.cik / fieldTotal) * 100).toFixed(0)}%)`);
  console.log(`  Accession Number: ${fieldCoverage.accession_number}/${fieldTotal} (${((fieldCoverage.accession_number / fieldTotal) * 100).toFixed(0)}%)`);
  console.log(`  Filing Date:      ${fieldCoverage.filing_date}/${fieldTotal} (${((fieldCoverage.filing_date / fieldTotal) * 100).toFixed(0)}%)`);
  console.log(`  Form Type:        ${fieldCoverage.form_type}/${fieldTotal} (${((fieldCoverage.form_type / fieldTotal) * 100).toFixed(0)}%)`);

  logSection('🏁 FINAL VERDICT');

  const successRate = (passedTests / totalTests) * 100;

  if (successRate >= 90) {
    log('✅ EXTRACTION IMPROVEMENTS WORKING EXCELLENTLY (≥90%)', 'green');
    process.exit(0);
  } else if (successRate >= 75) {
    log('⚠️  EXTRACTION IMPROVEMENTS WORKING WELL (≥75%)', 'yellow');
    process.exit(0);
  } else {
    log('❌ EXTRACTION IMPROVEMENTS NEED MORE WORK (<75%)', 'red');
    process.exit(1);
  }
}

// Run test
testExtraction().catch(error => {
  logSection('❌ TEST FAILED');
  console.error(error);
  process.exit(1);
});
