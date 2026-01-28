#!/usr/bin/env node
/**
 * Federal Register Agency Slug Fix - Validation Test
 *
 * Tests that agency abbreviations are correctly converted to API slugs
 * and that the Federal Register API accepts the queries without 400 errors.
 */

import { buildFederalRegisterParams } from './src/utils/apiHelpers.js';

console.log('='.repeat(70));
console.log('FEDERAL REGISTER AGENCY SLUG FIX - VALIDATION TEST');
console.log('='.repeat(70));
console.log('');

// Test cases: abbreviation -> expected slug
const AGENCY_TEST_CASES = [
  { abbrev: 'FTC', expectedSlug: 'federal-trade-commission' },
  { abbrev: 'SEC', expectedSlug: 'securities-and-exchange-commission' },
  { abbrev: 'EPA', expectedSlug: 'environmental-protection-agency' },
  { abbrev: 'FDA', expectedSlug: 'food-and-drug-administration' },
  { abbrev: 'DOJ', expectedSlug: 'justice-department' },
  { abbrev: 'DOL', expectedSlug: 'labor-department' },
  { abbrev: 'HHS', expectedSlug: 'health-and-human-services-department' },
  { abbrev: 'DOE', expectedSlug: 'energy-department' },
  { abbrev: 'DOT', expectedSlug: 'transportation-department' },
  { abbrev: 'OSHA', expectedSlug: 'occupational-safety-and-health-administration' },
  { abbrev: 'CFPB', expectedSlug: 'consumer-financial-protection-bureau' },
  { abbrev: 'FERC', expectedSlug: 'federal-energy-regulatory-commission' },
  { abbrev: 'FCC', expectedSlug: 'federal-communications-commission' },
  { abbrev: 'USPTO', expectedSlug: 'patent-and-trademark-office' },
  { abbrev: 'IRS', expectedSlug: 'internal-revenue-service' }
];

let passed = 0;
let failed = 0;

// ─────────────────────────────────────────────────────────────────
// Test 1: Unit Tests - Slug Conversion
// ─────────────────────────────────────────────────────────────────
console.log('> Test 1: Agency Abbreviation -> Slug Conversion');
console.log('-'.repeat(50));

for (const { abbrev, expectedSlug } of AGENCY_TEST_CASES) {
  const params = buildFederalRegisterParams({
    query: 'test',
    agency: abbrev
  });

  const actualSlug = params.get('conditions[agencies][]');

  if (actualSlug === expectedSlug) {
    console.log(`  [PASS] ${abbrev} -> ${actualSlug}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${abbrev}: expected "${expectedSlug}", got "${actualSlug}"`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────
// Test 2: Case Insensitivity
// ─────────────────────────────────────────────────────────────────
console.log('\n> Test 2: Case Insensitivity');
console.log('-'.repeat(50));

const caseTests = [
  { input: 'ftc', expected: 'federal-trade-commission' },
  { input: 'Ftc', expected: 'federal-trade-commission' },
  { input: 'FTC', expected: 'federal-trade-commission' },
  { input: 'epa', expected: 'environmental-protection-agency' }
];

for (const { input, expected } of caseTests) {
  const params = buildFederalRegisterParams({ query: 'test', agency: input });
  const actual = params.get('conditions[agencies][]');

  if (actual === expected) {
    console.log(`  [PASS] "${input}" -> ${actual}`);
    passed++;
  } else {
    console.log(`  [FAIL] "${input}": expected "${expected}", got "${actual}"`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────
// Test 3: Fallback for Unknown Agencies
// ─────────────────────────────────────────────────────────────────
console.log('\n> Test 3: Fallback for Unknown Agencies');
console.log('-'.repeat(50));

const fallbackTests = [
  { input: 'UNKNOWN-AGENCY', expected: 'unknown-agency' },
  { input: 'CustomAgency', expected: 'customagency' }
];

for (const { input, expected } of fallbackTests) {
  const params = buildFederalRegisterParams({ query: 'test', agency: input });
  const actual = params.get('conditions[agencies][]');

  if (actual === expected) {
    console.log(`  [PASS] Unknown "${input}" -> fallback "${actual}"`);
    passed++;
  } else {
    console.log(`  [FAIL] Unknown "${input}": expected fallback "${expected}", got "${actual}"`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────
// Test 4: Live API Test (FTC - the one that was failing)
// ─────────────────────────────────────────────────────────────────
console.log('\n> Test 4: Live API Test (FTC pharmaceutical merger query)');
console.log('-'.repeat(50));

async function testLiveAPI() {
  try {
    const params = buildFederalRegisterParams({
      query: 'pharmaceutical merger',
      agency: 'FTC',
      limit: 3
    });

    const url = `https://www.federalregister.gov/api/v1/documents.json?${params.toString()}`;
    console.log(`  URL: ${url.substring(0, 80)}...`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Super-Legal-MCP/1.0.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`  [PASS] API returned ${response.status} OK`);
      console.log(`  Results: ${data.count || data.results?.length || 0} documents found`);

      if (data.results && data.results.length > 0) {
        console.log(`  Sample: "${data.results[0].title?.substring(0, 60)}..."`);
      }
      passed++;
    } else {
      console.log(`  [FAIL] API returned ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`  Error: ${errorText.substring(0, 200)}`);
      failed++;
    }
  } catch (error) {
    console.log(`  [FAIL] Request error: ${error.message}`);
    failed++;
  }
}

await testLiveAPI();

// ─────────────────────────────────────────────────────────────────
// Test 5: Live API Test - Multiple Agencies
// ─────────────────────────────────────────────────────────────────
console.log('\n> Test 5: Live API Tests - Multiple Agencies');
console.log('-'.repeat(50));

const liveTests = [
  { agency: 'SEC', query: 'securities fraud' },
  { agency: 'EPA', query: 'environmental compliance' },
  { agency: 'FDA', query: 'drug approval' }
];

for (const { agency, query } of liveTests) {
  try {
    const params = buildFederalRegisterParams({ query, agency, limit: 1 });
    const url = `https://www.federalregister.gov/api/v1/documents.json?${params.toString()}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Super-Legal-MCP/1.0.0' }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`  [PASS] ${agency}: ${response.status} OK (${data.count || 0} results)`);
      passed++;
    } else {
      console.log(`  [FAIL] ${agency}: ${response.status} ${response.statusText}`);
      failed++;
    }
  } catch (error) {
    console.log(`  [FAIL] ${agency}: ${error.message}`);
    failed++;
  }

  // Small delay between API calls
  await new Promise(r => setTimeout(r, 500));
}

// ─────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('');

if (failed === 0) {
  console.log('[SUCCESS] All tests passed! Federal Register agency slug fix verified.');
} else {
  console.log('[FAILURE] Some tests failed. Review the issues above.');
}

console.log('='.repeat(70));

process.exit(failed > 0 ? 1 : 0);
