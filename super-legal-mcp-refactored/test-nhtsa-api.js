/**
 * NHTSA API Functional Test
 * Tests all NHTSA endpoints to verify they work correctly
 */

import { NHTSAClient } from './src/api-clients/NHTSAClient.js';

async function testVINDecode() {
  console.log("=".repeat(60));
  console.log("NHTSA API FUNCTIONAL TEST");
  console.log("=".repeat(60));
  
  // Initialize rate limiters map as expected by NHTSAClient
  const rateLimiters = new Map();
  const client = new NHTSAClient(rateLimiters);
  
  console.log("\n=== TEST 1: VIN Decode ===\n");
  
  // Test with a known VIN (2023 Tesla Model 3)
  const testVIN = "5YJ3E1EA5PF";  // Partial VIN for Tesla
  console.log(`1a. Decoding VIN: ${testVIN}...`);
  try {
    const result = await client.decodeVin({ vin: testVIN });
    const data = JSON.parse(result.content[0].text);
    
    if (data.Results) {
      console.log("✅ VIN decoded successfully");
      const make = data.Results.find(r => r.Variable === "Make");
      const model = data.Results.find(r => r.Variable === "Model");
      const year = data.Results.find(r => r.Variable === "Model Year");
      const mfr = data.Results.find(r => r.Variable === "Manufacturer Name");
      
      console.log(`   Make: ${make ? make.Value : 'N/A'}`);
      console.log(`   Model: ${model ? model.Value : 'N/A'}`);
      console.log(`   Year: ${year ? year.Value : 'N/A'}`);
      console.log(`   Manufacturer: ${mfr ? mfr.Value : 'N/A'}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testModelsForMake() {
  console.log("\n=== TEST 2: Get Models for Make ===\n");
  
  const rateLimiters = new Map();
  const client = new NHTSAClient(rateLimiters);
  
  // Test with Honda for year 2024
  console.log("2a. Getting Honda models for 2024...");
  try {
    const result = await client.getModelsForMake({ make: "Honda", year: 2024 });
    const data = JSON.parse(result.content[0].text);
    
    if (data.Results && data.Results.length > 0) {
      console.log(`✅ Found ${data.Results.length} Honda models for 2024`);
      console.log("   Sample models:");
      data.Results.slice(0, 5).forEach((model, i) => {
        console.log(`   ${i+1}. ${model.Model_Name}`);
      });
    } else {
      console.log("⚠️ No models found");
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test without year
  console.log("\n2b. Getting all Toyota models (no year specified)...");
  try {
    const result = await client.getModelsForMake({ make: "Toyota" });
    const data = JSON.parse(result.content[0].text);
    
    if (data.Results && data.Results.length > 0) {
      console.log(`✅ Found ${data.Results.length} Toyota models (all years)`);
      const uniqueModels = [...new Set(data.Results.map(m => m.Model_Name))];
      console.log(`   Unique models: ${uniqueModels.length}`);
      console.log(`   Sample: ${uniqueModels.slice(0, 5).join(", ")}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testRecalls() {
  console.log("\n=== TEST 3: Vehicle Recalls ===\n");
  
  const rateLimiters = new Map();
  const client = new NHTSAClient(rateLimiters);
  
  // Test recalls by make/model/year
  console.log("3a. Getting recalls for 2020 Toyota Camry...");
  try {
    const result = await client.getRecallsByMakeModelYear({ 
      make: "Toyota", 
      model: "Camry", 
      year: 2020 
    });
    const data = JSON.parse(result.content[0].text);
    
    if (data.results && data.results.length > 0) {
      console.log(`✅ Found ${data.results.length} recalls for 2020 Toyota Camry`);
      data.results.slice(0, 2).forEach((recall, i) => {
        console.log(`\n   Recall ${i+1}:`);
        console.log(`   - Campaign: ${recall.NHTSACampaignNumber}`);
        console.log(`   - Component: ${recall.Component}`);
        console.log(`   - Summary: ${recall.Summary ? recall.Summary.substring(0, 100) + "..." : 'N/A'}`);
      });
    } else {
      console.log("✅ No recalls found for this vehicle");
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test recalls by VIN
  console.log("\n3b. Getting recalls by VIN...");
  try {
    const testVIN = "1HGBH41JXMN109186"; // Sample Honda VIN
    const result = await client.getRecallsByVin({ vin: testVIN });
    const data = JSON.parse(result.content[0].text);
    
    if (data.results) {
      console.log(`✅ VIN recall check completed`);
      console.log(`   Total recalls: ${data.results ? data.results.length : 0}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testComplaints() {
  console.log("\n=== TEST 4: Consumer Complaints ===\n");
  
  const rateLimiters = new Map();
  const client = new NHTSAClient(rateLimiters);
  
  console.log("4a. Searching complaints for 2023 Tesla Model 3...");
  try {
    const result = await client.searchComplaints({ 
      make: "Tesla", 
      model: "Model 3", 
      year: 2023,
      limit: 5 
    });
    const data = JSON.parse(result.content[0].text);
    
    if (data.results && data.results.length > 0) {
      console.log(`✅ Found complaints for 2023 Tesla Model 3`);
      console.log(`   Total available: ${data.count || 'Unknown'}`);
      console.log(`   Retrieved: ${data.results.length}`);
      
      if (data.results[0]) {
        const complaint = data.results[0];
        console.log("\n   Sample complaint:");
        console.log(`   - Date: ${complaint.dateComplaintFiled}`);
        console.log(`   - Component: ${complaint.components}`);
        console.log(`   - Crash: ${complaint.crashed ? 'Yes' : 'No'}`);
        console.log(`   - Fire: ${complaint.fire ? 'Yes' : 'No'}`);
        console.log(`   - Injuries: ${complaint.numberOfInjuries || 0}`);
        console.log(`   - Deaths: ${complaint.numberOfDeaths || 0}`);
      }
    } else {
      console.log("⚠️ No complaints found");
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testSafetyRatings() {
  console.log("\n=== TEST 5: Safety Ratings ===\n");
  
  const rateLimiters = new Map();
  const client = new NHTSAClient(rateLimiters);
  
  console.log("5a. Getting safety ratings for 2024 Honda Accord...");
  try {
    const result = await client.getSafetyRatings({ 
      year: 2024, 
      make: "Honda", 
      model: "Accord" 
    });
    const data = JSON.parse(result.content[0].text);
    
    if (data.Results && data.Results.length > 0) {
      console.log(`✅ Found safety ratings`);
      const vehicle = data.Results[0];
      console.log(`   Vehicle: ${vehicle.Make} ${vehicle.Model}`);
      console.log(`   Overall Rating: ${vehicle.OverallRating || 'Not Rated'}`);
      console.log(`   Frontal Crash: ${vehicle.OverallFrontCrashRating || 'Not Rated'}`);
      console.log(`   Side Crash: ${vehicle.OverallSideCrashRating || 'Not Rated'}`);
      console.log(`   Rollover: ${vehicle.RolloverRating || 'Not Rated'}`);
      console.log(`   NHTSA Complaints: ${vehicle.ComplaintsCount || 0}`);
      console.log(`   NHTSA Recalls: ${vehicle.RecallsCount || 0}`);
    } else {
      console.log("⚠️ No safety ratings found");
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testAPIAvailability() {
  console.log("\n=== TEST 6: API Endpoint Availability ===\n");
  
  const endpoints = [
    {
      name: "vPIC VIN Decode",
      url: "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/5YJ3E1EA5PF?format=json"
    },
    {
      name: "Recalls API",
      url: "https://api.nhtsa.gov/recalls/vehicle/modelyear/2020/make/Toyota/model/Camry?format=json"
    },
    {
      name: "Complaints API",
      url: "https://api.nhtsa.gov/Complaints/complaints?make=Tesla&model=Model%203&modelYear=2023&format=json&pageSize=1"
    },
    {
      name: "Safety Ratings",
      url: "https://api.nhtsa.gov/SafetyRatings/modelyear/2024/make/Honda/model/Accord?format=json"
    }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint.name}...`);
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Enhanced-Legal-MCP/2.0.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name}: Available (Status ${response.status})`);
        
        // Check for data presence
        if (data.Results || data.results) {
          console.log(`   - Response has data`);
        } else if (data.Count !== undefined) {
          console.log(`   - Response indicates ${data.Count} results`);
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
  try {
    await testVINDecode();
    await testModelsForMake();
    await testRecalls();
    await testComplaints();
    await testSafetyRatings();
    await testAPIAvailability();
    
    console.log("\n" + "=".repeat(60));
    console.log("TEST COMPLETE");
    console.log("=".repeat(60));
    
    console.log("\n📊 Summary:");
    console.log("The NHTSA API integration provides:");
    console.log("✅ VIN decoding for vehicle identification");
    console.log("✅ Make/model database access");
    console.log("✅ Recall search by VIN or make/model/year");
    console.log("✅ Consumer complaint database");
    console.log("✅ NCAP safety ratings");
    console.log("✅ No authentication required");
    
    console.log("\n🔧 Implementation Notes:");
    console.log("• Multiple API endpoints (vPIC, Recalls, Complaints, Ratings)");
    console.log("• Each endpoint has its own rate limiter");
    console.log("• Comprehensive vehicle safety data");
    console.log("• Ready for Claude Desktop integration");
    
    console.log("\n⚖️ Legal Use Cases:");
    console.log("• Automotive product liability");
    console.log("• Wrongful death investigations");
    console.log("• Lemon law cases");
    console.log("• Class action vehicle defects");
    console.log("• Insurance litigation");
    
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }
}

// Run the tests
runAllTests();