/**
 * Unit tests for EPAComplianceClient._structuredToNarrative()
 * Tests conversion of structured facility data to narrative text
 */

import { EPAComplianceClient } from '../../src/api-clients/EPAComplianceClient.js';

const client = new EPAComplianceClient(null);

// Complete facility fixture
const completeFacility = {
  name: "Test Steel Corporation",
  registry_id: "110001234567",
  location: {
    address: "123 Industrial Way",
    city: "Pittsburgh",
    state: "PA",
    zip: "15201",
    county: "Allegheny",
    epa_region: "3",
    latitude: 40.4406,
    longitude: -79.9959,
    indian_country: false
  },
  industry: {
    naics_codes: "331110",
    sic_codes: "3312"
  },
  compliance: {
    overall_status: "Significant Violation",
    significant_noncompliance: true,
    quarters_in_noncompliance: 8,
    three_year_history: "VVVVNNNNNNNN",
    by_program: {
      air: { status: "In Violation", quarters_nc: 4, high_priority_violator: true },
      water: { status: "No Violation", quarters_nc: 0, significant_noncompliance: false },
      hazardous_waste: { status: "No Violation", quarters_nc: 0, significant_noncompliance: false },
      drinking_water: { status: "N/A" }
    }
  },
  inspections: {
    total_count: 15,
    days_since_last: 120,
    last_inspection_date: "2024-08-15",
    by_program: { air_evaluations: 8, water_inspections: 5, rcra_inspections: 2 }
  },
  enforcement: {
    informal_actions: 3,
    formal_actions: 2,
    last_formal_action_date: "2024-06-01",
    federal_cases: { case_ids: "EPA-03-2024-0001", count: 1, last_case_date: "2024-05-15", total_penalties: 250000 }
  },
  penalties: {
    total: 500000,
    count: 5,
    last_penalty_date: "2024-06-15",
    last_penalty_amount: 75000,
    by_program: { air: 350000, water: 100000, hazardous_waste: 50000 }
  },
  emissions: {
    ghg_co2_releases: "125000",
    tri_releases_transfers: "45000",
    tri_onsite_releases: "30000"
  },
  demographics: {
    population_density: 5200,
    percent_minority: 42
  },
  program_ids: {
    air: "003-0001234",
    npdes: "PA0012345",
    rcra: "PAD123456789",
    superfund: null,
    tri: "15201TSTST123IN"
  },
  flags: {
    major_facility: true,
    active: true
  },
  dfr_url: "https://echo.epa.gov/detailed-facility-report?fid=110001234567"
};

// Minimal facility (sparse data)
const minimalFacility = {
  name: "Unknown Facility",
  registry_id: null,
  location: {},
  industry: {},
  compliance: { by_program: {} },
  inspections: { by_program: {} },
  enforcement: { federal_cases: {} },
  penalties: { by_program: {} },
  emissions: {},
  demographics: {},
  program_ids: {},
  flags: {}
};

// Test cases
const tests = [
  {
    name: "Complete facility - all sections present",
    facility: completeFacility,
    assertions: [
      { section: "FACILITY:", shouldExist: true },
      { section: "Registry ID:", shouldExist: true },
      { section: "COMPLIANCE STATUS:", shouldExist: true },
      { section: "HIGH PRIORITY VIOLATOR", shouldExist: true },
      { section: "INSPECTIONS:", shouldExist: true },
      { section: "ENFORCEMENT:", shouldExist: true },
      { section: "Federal Cases: 1", shouldExist: true },
      { section: "PENALTIES:", shouldExist: true },
      { section: "Total: $500000", shouldExist: true },
      { section: "EMISSIONS:", shouldExist: true },
      { section: "DEMOGRAPHICS", shouldExist: true },
      { section: "Minority Population: 42%", shouldExist: true },
      { section: "PROGRAM IDs:", shouldExist: true },
      { section: "STATUS FLAGS:", shouldExist: true },
      { section: "Detailed Report:", shouldExist: true },
    ]
  },
  {
    name: "Minimal facility - handles missing data gracefully",
    facility: minimalFacility,
    assertions: [
      { section: "FACILITY: Unknown Facility", shouldExist: true },
      { section: "Registry ID: N/A", shouldExist: true },
      { section: "COMPLIANCE STATUS:", shouldExist: true },
      { section: "HIGH PRIORITY VIOLATOR", shouldExist: false },  // Should NOT appear
      { section: "EMISSIONS:", shouldExist: false },  // No emissions data
      { section: "DEMOGRAPHICS", shouldExist: false },  // No demographics
    ]
  },
  {
    name: "Null nested objects - no crash",
    facility: { name: "Null Test", compliance: null, location: null },
    assertions: [
      { section: "FACILITY: Null Test", shouldExist: true },
    ]
  }
];

// Test runner
function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('='.repeat(60));
  console.log('UNIT TEST: EPAComplianceClient._structuredToNarrative()');
  console.log('='.repeat(60));

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);

    try {
      const narrative = client._structuredToNarrative(test.facility);

      for (const assertion of test.assertions) {
        const found = narrative.includes(assertion.section);
        const pass = found === assertion.shouldExist;

        if (pass) {
          console.log(`  ✓ "${assertion.section}" ${assertion.shouldExist ? 'present' : 'absent'}`);
          passed++;
        } else {
          console.log(`  ✗ "${assertion.section}" expected ${assertion.shouldExist ? 'present' : 'absent'}, got ${found ? 'present' : 'absent'}`);
          failed++;
        }
      }
    } catch (error) {
      console.log(`  ✗ CRASHED: ${error.message}`);
      failed += test.assertions.length;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  return failed === 0;
}

// Additional test: Output size check
function testOutputSize() {
  console.log('\n--- Output Size Check ---');

  const narrative = client._structuredToNarrative(completeFacility);
  const charCount = narrative.length;
  const estimatedTokens = Math.ceil(charCount / 4);

  console.log(`  Complete facility narrative: ${charCount} chars (~${estimatedTokens} tokens)`);

  // Narrative should be comprehensive but not bloated
  if (charCount > 500 && charCount < 3000) {
    console.log(`  ✓ Size is within expected range (500-3000 chars)`);
    return true;
  } else {
    console.log(`  ✗ Size outside expected range: ${charCount} chars`);
    return false;
  }
}

// Run tests
const success = runTests() && testOutputSize();
process.exit(success ? 0 : 1);
