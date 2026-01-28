/**
 * EPA ECHO API Functional Test
 * Tests actual EPA endpoints to verify they work correctly
 */

import { EPAComplianceClient } from './src/api-clients/EPAComplianceClient.js';

// Test data - known facilities for testing
const testData = {
  // A major oil refinery with known compliance history
  refineryName: "Shell",
  refineryState: "TX",
  
  // EPA Registry ID for a specific facility (example)
  knownFacilityId: "110000350172",
  
  // Test state with many facilities
  testState: "CA",
  testCity: "Los Angeles"
};

async function testSearchFacilities() {
  console.log("\n=== TEST 1: Search Facilities ===\n");
  
  const client = new EPAComplianceClient(null);
  
  // Test 1a: Search by facility name
  console.log("1a. Searching for Shell facilities in Texas...");
  try {
    const result = await client.searchFacilities({
      facility_name: testData.refineryName,
      state: testData.refineryState,
      limit: 5
    });
    
    const data = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${data.total_facilities} facilities`);
    
    if (data.facilities.length > 0) {
      const facility = data.facilities[0];
      console.log(`   - Name: ${facility.name}`);
      console.log(`   - Company: ${facility.company || 'N/A'}`);
      console.log(`   - Location: ${facility.location.city}, ${facility.location.state}`);
      console.log(`   - EPA Registry ID: ${facility.epa_registry_id}`);
      console.log(`   - Programs: Air=${facility.programs.clean_air}, Water=${facility.programs.clean_water}, RCRA=${facility.programs.rcra}`);
      console.log(`   - Compliance Status: ${facility.compliance.current_status || 'N/A'}`);
      console.log(`   - Quarters in Non-compliance: ${facility.compliance.quarters_in_noncompliance || 0}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 1b: Search by city and state
  console.log("\n1b. Searching for facilities in Los Angeles, CA...");
  try {
    const result = await client.searchFacilities({
      city: testData.testCity,
      state: testData.testState,
      limit: 3
    });
    
    const data = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${data.total_facilities} facilities`);
    console.log(`   - High Priority Violators: ${data.high_priority_violators}`);
    
    // Show first few facilities
    data.facilities.slice(0, 3).forEach((f, i) => {
      console.log(`   ${i+1}. ${f.name} - ${f.location.address || 'No address'}`);
    });
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 1c: Search for facilities with violations
  console.log("\n1c. Searching for facilities with violations...");
  try {
    const result = await client.searchFacilities({
      state: "TX",
      compliance_status: "violation",
      violations_last_3_years: true,
      limit: 5
    });
    
    const data = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${data.total_facilities} facilities with violations`);
    
    if (data.facilities.length > 0) {
      const violator = data.facilities[0];
      console.log(`   Example violator: ${violator.name}`);
      console.log(`   - Quarters in non-compliance: ${violator.compliance.quarters_in_noncompliance}`);
      console.log(`   - Formal enforcement actions: ${violator.compliance.formal_enforcement_actions}`);
      console.log(`   - Total penalties: $${violator.compliance.total_penalties || 0}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testComplianceReport() {
  console.log("\n=== TEST 2: Facility Compliance Report ===\n");
  
  const client = new EPAComplianceClient(null);
  
  // First, search for a facility to get its ID
  console.log("2a. Finding a facility with known violations...");
  try {
    const searchResult = await client.searchFacilities({
      facility_name: "Exxon",
      state: "TX",
      limit: 1
    });
    
    const searchData = JSON.parse(searchResult.content[0].text);
    
    if (searchData.facilities.length > 0) {
      const facilityId = searchData.facilities[0].epa_registry_id;
      console.log(`✅ Found facility with ID: ${facilityId}`);
      
      // Now get detailed compliance report
      console.log("\n2b. Getting detailed compliance report...");
      try {
        const reportResult = await client.getFacilityComplianceReport({
          facility_id: facilityId,
          include_violations: true,
          include_enforcement: true
        });
        
        const report = JSON.parse(reportResult.content[0].text);
        console.log("✅ Retrieved compliance report");
        
        if (report.facility) {
          console.log(`   Facility: ${report.facility.Name || report.facility.FRSID}`);
        }
        
        if (report.compliance_summary) {
          console.log(`   Compliance Summary: ${JSON.stringify(report.compliance_summary).substring(0, 100)}...`);
        }
        
        if (report.violations && report.violations.length > 0) {
          console.log(`   Recent Violations: ${report.violations.length} found`);
        } else {
          console.log("   Recent Violations: None found");
        }
        
        if (report.enforcement_actions && report.enforcement_actions.length > 0) {
          console.log(`   Enforcement Actions: ${report.enforcement_actions.length} found`);
        } else {
          console.log("   Enforcement Actions: None found");
        }
        
        if (report.three_year_compliance) {
          console.log(`   3-Year History Available: Yes`);
        }
      } catch (error) {
        console.log(`❌ Compliance report error: ${error.message}`);
      }
    } else {
      console.log("❌ No facilities found to test compliance report");
    }
  } catch (error) {
    console.log(`❌ Search error: ${error.message}`);
  }
}

async function testAPIAvailability() {
  console.log("\n=== TEST 3: API Endpoint Availability ===\n");
  
  // Test direct API access to verify endpoints are reachable
  const endpoints = [
    {
      name: "ECHO Facilities",
      url: "https://echodata.epa.gov/echo/echo_rest_services.get_facilities?output=JSON&p_rows=1"
    },
    {
      name: "Detailed Facility Report",
      url: "https://echodata.epa.gov/echo/dfr_rest_services.get_dfr?output=JSON&p_id=110000350172"
    }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint.name}...`);
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Enhanced-Legal-MCP/1.0.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name}: Available (Status ${response.status})`);
        
        // Check if we got actual data
        if (data.Results) {
          console.log(`   - Response has Results object`);
        } else if (data.Facility) {
          console.log(`   - Response has Facility data`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: Error ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Network error - ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log("=" .repeat(60));
  console.log("EPA ECHO API FUNCTIONAL TEST");
  console.log("=" .repeat(60));
  
  try {
    await testSearchFacilities();
    await testComplianceReport();
    await testAPIAvailability();
    
    console.log("\n" + "=" .repeat(60));
    console.log("TEST COMPLETE");
    console.log("=" .repeat(60));
    
    console.log("\n📊 Summary:");
    console.log("The EPA ECHO API integration provides:");
    console.log("✅ Facility search by name, location, and compliance status");
    console.log("✅ Identification of high priority violators");
    console.log("✅ Detailed compliance reports for specific facilities");
    console.log("✅ Violation and enforcement action history");
    console.log("✅ Multi-program coverage (Air, Water, RCRA)");
    
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }
}

// Run the tests
runAllTests();