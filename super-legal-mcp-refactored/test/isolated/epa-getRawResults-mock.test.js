/**
 * Isolated test for getRawResults() using mocked ECHO API responses
 * Tests the full flow without external dependencies
 */

import { EPAComplianceClient } from '../../src/api-clients/EPAComplianceClient.js';

// Mock the searchFacilities method to return fixture data
class MockEPAComplianceClient extends EPAComplianceClient {
  constructor() {
    super(null);
  }

  async searchFacilities(params) {
    // Return mock facility data matching the 60-column format
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          facilities: [
            {
              name: "Mock Steel Corp",
              registry_id: "110009999999",
              location: { address: "100 Test St", city: "Pittsburgh", state: "PA", zip: "15201", county: "Allegheny", epa_region: "3" },
              industry: { naics_codes: "331110", sic_codes: "3312" },
              compliance: { overall_status: "In Violation", significant_noncompliance: true, by_program: { air: { high_priority_violator: true } } },
              inspections: { total_count: 5, last_inspection_date: "2024-06-01", by_program: {} },
              enforcement: { formal_actions: 2, informal_actions: 1, federal_cases: { count: 1, total_penalties: 50000 } },
              penalties: { total: 100000, count: 3, by_program: { air: 75000, water: 25000 } },
              emissions: { ghg_co2_releases: "50000" },
              demographics: { percent_minority: 35, population_density: 4500 },
              program_ids: { air: "003-0001234" },
              flags: { active: true, major_facility: true },
              dfr_url: "https://echo.epa.gov/detailed-facility-report?fid=110009999999"
            },
            {
              name: "Mock Chemical Plant",
              registry_id: "110008888888",
              location: { address: "200 Industrial Blvd", city: "Pittsburgh", state: "PA", zip: "15219" },
              compliance: { overall_status: "No Violation", significant_noncompliance: false, by_program: {} },
              inspections: { total_count: 3, by_program: {} },
              enforcement: { formal_actions: 0, federal_cases: {} },
              penalties: { total: 0, by_program: {} },
              emissions: {},
              demographics: {},
              program_ids: {},
              flags: { active: true },
              dfr_url: "https://echo.epa.gov/detailed-facility-report?fid=110008888888"
            }
          ],
          total_facilities: 2
        })
      }]
    };
  }
}

async function runTests() {
  const client = new MockEPAComplianceClient();
  let passed = 0;
  let failed = 0;

  console.log('='.repeat(60));
  console.log('ISOLATED TEST: getRawResults() with Mocked ECHO API');
  console.log('='.repeat(60));

  // Test 1: Basic getRawResults call
  console.log('\n--- Test 1: getRawResults() returns correct structure ---');
  try {
    const results = await client.getRawResults("Steel facilities in Pittsburgh, PA", 5);

    const checks = [
      { name: "Returns array", pass: Array.isArray(results) },
      { name: "Has results", pass: results.length > 0 },
      { name: "Has title", pass: results[0]?.title?.includes("EPA Facility") },
      { name: "Has url", pass: results[0]?.url?.startsWith("https://") },
      { name: "Has text", pass: typeof results[0]?.text === "string" && results[0].text.length > 0 },
      { name: "Has rawContent", pass: results[0]?.rawContent === results[0]?.text },
      { name: "_source is epa_echo_native", pass: results[0]?._source === "epa_echo_native" },
      { name: "_domain is environmental", pass: results[0]?._domain === "environmental" },
    ];

    for (const check of checks) {
      if (check.pass) {
        console.log(`  ✓ ${check.name}`);
        passed++;
      } else {
        console.log(`  ✗ ${check.name}`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`  ✗ CRASHED: ${error.message}`);
    failed += 8;
  }

  // Test 2: Narrative contains expected sections
  console.log('\n--- Test 2: Narrative text contains required sections ---');
  try {
    const results = await client.getRawResults("facilities", 1);
    const text = results[0].text;

    const sections = ["FACILITY:", "COMPLIANCE STATUS:", "INSPECTIONS:", "ENFORCEMENT:", "PENALTIES:"];
    for (const section of sections) {
      if (text.includes(section)) {
        console.log(`  ✓ Contains ${section}`);
        passed++;
      } else {
        console.log(`  ✗ Missing ${section}`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`  ✗ CRASHED: ${error.message}`);
    failed += 5;
  }

  // Test 3: URL cleanup works
  console.log('\n--- Test 3: URL cleanup (no spaces in query params) ---');
  try {
    const results = await client.getRawResults("test", 1);
    const url = results[0].url;

    if (!url.includes(' = ') && !url.includes('= ') && !url.includes(' =')) {
      console.log(`  ✓ URL has no spaces around =`);
      passed++;
    } else {
      console.log(`  ✗ URL has spaces: ${url}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ CRASHED: ${error.message}`);
    failed++;
  }

  // Test 4: Limit parameter works
  console.log('\n--- Test 4: Limit parameter respected ---');
  try {
    const results = await client.getRawResults("facilities", 1);

    if (results.length === 1) {
      console.log(`  ✓ Returned exactly 1 result when limit=1`);
      passed++;
    } else {
      console.log(`  ✗ Expected 1 result, got ${results.length}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ CRASHED: ${error.message}`);
    failed++;
  }

  // Test 5: Multiple results
  console.log('\n--- Test 5: Multiple results returned ---');
  try {
    const results = await client.getRawResults("facilities", 10);

    if (results.length === 2) {  // Mock has 2 facilities
      console.log(`  ✓ Returned all 2 available facilities`);
      passed++;
    } else {
      console.log(`  ✗ Expected 2 results, got ${results.length}`);
      failed++;
    }

    // Check both have unique titles
    const titles = results.map(r => r.title);
    const uniqueTitles = new Set(titles);
    if (uniqueTitles.size === results.length) {
      console.log(`  ✓ All results have unique titles`);
      passed++;
    } else {
      console.log(`  ✗ Duplicate titles found`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ CRASHED: ${error.message}`);
    failed += 2;
  }

  // Test 6: Content quality checks
  console.log('\n--- Test 6: Content quality ---');
  try {
    const results = await client.getRawResults("facilities", 1);
    const text = results[0].text;

    // Check for specific data from mock
    const qualityChecks = [
      { name: "Contains facility name", pass: text.includes("Mock Steel Corp") },
      { name: "Contains penalty amount", pass: text.includes("$100000") },
      { name: "Contains state", pass: text.includes("PA") },
      { name: "Contains violation status", pass: text.includes("In Violation") },
    ];

    for (const check of qualityChecks) {
      if (check.pass) {
        console.log(`  ✓ ${check.name}`);
        passed++;
      } else {
        console.log(`  ✗ ${check.name}`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`  ✗ CRASHED: ${error.message}`);
    failed += 4;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  return failed === 0;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
