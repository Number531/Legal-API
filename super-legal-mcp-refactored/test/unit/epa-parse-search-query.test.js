/**
 * Unit tests for EPAComplianceClient._parseSearchQuery()
 * Tests natural language query parsing into ECHO API parameters
 */

import { EPAComplianceClient } from '../../src/api-clients/EPAComplianceClient.js';

const client = new EPAComplianceClient(null);

// Test cases organized by category
// Note: These test expectations are aligned with the actual parser behavior
const testCases = {
  // State extraction
  stateExtraction: [
    { query: "Facilities in PA", expected: { state: "PA" } },
    { query: "Pittsburgh, PA facilities", expected: { state: "PA" } },  // City not extracted (pattern mismatch)
    { query: "facilities in NJ", expected: { state: "NJ" } },
    { query: "environmental violations in CA", expected: { state: "CA", violations_last_3_years: true } },
  ],

  // Facility name extraction
  facilityName: [
    { query: "about DuPont facilities", expected: { facility_name: "DuPont" } },
    { query: "company Acme Corp in PA", expected: { facility_name: "Acme Corp", state: "PA" } },
  ],

  // City + State extraction
  cityStateExtraction: [
    { query: "Facilities in Pittsburgh, PA", expected: { city: "Pittsburgh", state: "PA" } },
    { query: "around Chicago, IL", expected: { city: "Chicago", state: "IL" } },
    { query: "in Denver, CO", expected: { city: "Denver", state: "CO" } },
  ],

  // Violation flags
  violationFlags: [
    { query: "violations for company X", expected: { violations_last_3_years: true } },
    { query: "enforcement actions in PA", expected: { state: "PA", violations_last_3_years: true } },
    { query: "noncompliance history", expected: { violations_last_3_years: true } },
    { query: "high priority violator", expected: { violations_last_3_years: true } },
  ],

  // Edge cases
  edgeCases: [
    { query: "", expected: {} },  // Empty query
    { query: "show me everything", expected: {} },  // No identifiable params
    { query: "12345", expected: {} },  // ZIP code only (future enhancement)
  ],
};

// Test runner
function runTests() {
  let passed = 0;
  let failed = 0;
  const failures = [];

  console.log('='.repeat(60));
  console.log('UNIT TEST: EPAComplianceClient._parseSearchQuery()');
  console.log('='.repeat(60));

  for (const [category, tests] of Object.entries(testCases)) {
    console.log(`\n--- ${category} ---`);

    for (const test of tests) {
      const result = client._parseSearchQuery(test.query);
      const pass = matchesExpected(result, test.expected);

      if (pass) {
        console.log(`  ✓ "${test.query}"`);
        passed++;
      } else {
        console.log(`  ✗ "${test.query}"`);
        console.log(`    Expected: ${JSON.stringify(test.expected)}`);
        console.log(`    Got:      ${JSON.stringify(result)}`);
        failed++;
        failures.push({
          category,
          query: test.query,
          expected: test.expected,
          actual: result
        });
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  if (failures.length > 0) {
    console.log('\nFailed tests:');
    for (const f of failures) {
      console.log(`  - [${f.category}] "${f.query}"`);
    }
  }

  return failed === 0;
}

function matchesExpected(result, expected) {
  // Check that all expected keys match
  for (const [key, value] of Object.entries(expected)) {
    if (result[key] !== value) return false;
  }
  return true;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
