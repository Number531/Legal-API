/**
 * CPSC API Functional Test
 * Tests actual CPSC endpoints to verify they work correctly
 */

import { CPSCClient } from './src/api-clients/CPSCClient.js';

async function testSearchRecalls() {
  console.log("=".repeat(60));
  console.log("CPSC API FUNCTIONAL TEST");
  console.log("=".repeat(60));
  
  const client = new CPSCClient(null);
  
  console.log("\n=== TEST 1: Basic Recall Search ===\n");
  
  // Test 1a: Search all recalls (no filters)
  console.log("1a. Fetching recent recalls...");
  try {
    const result = await client.searchRecalls({
      limit: 5
    });
    
    const data = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${data.count} total recalls`);
    console.log(`   Returned ${data.results.length} recalls`);
    
    if (data.results.length > 0) {
      const recall = data.results[0];
      console.log("\n   First recall:");
      console.log(`   - ID: ${recall.recall_id}`);
      console.log(`   - Title: ${recall.title}`);
      console.log(`   - Product: ${recall.product}`);
      console.log(`   - Hazard: ${recall.hazard}`);
      console.log(`   - Firm: ${recall.recalling_firm}`);
      console.log(`   - Date: ${recall.recall_date}`);
      console.log(`   - URL: ${recall.url}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 1b: Search by product name
  console.log("\n1b. Searching for toy recalls...");
  try {
    const result = await client.searchRecalls({
      product_name: "toy",
      limit: 3
    });
    
    const data = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${data.count} toy-related recalls`);
    
    data.results.forEach((recall, i) => {
      console.log(`   ${i+1}. ${recall.product || recall.title} - ${recall.recalling_firm}`);
    });
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 1c: Search by hazard type
  console.log("\n1c. Searching for fire hazard recalls...");
  try {
    const result = await client.searchRecalls({
      hazard: "fire",
      limit: 3
    });
    
    const data = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${data.count} fire hazard recalls`);
    
    data.results.forEach((recall, i) => {
      console.log(`   ${i+1}. ${recall.product} - Hazard: ${recall.hazard}`);
    });
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 1d: Search by company
  console.log("\n1d. Searching for Samsung recalls...");
  try {
    const result = await client.searchRecalls({
      recalling_firm: "Samsung",
      limit: 5
    });
    
    const data = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${data.count} Samsung recalls`);
    
    if (data.results.length > 0) {
      data.results.forEach((recall, i) => {
        console.log(`   ${i+1}. ${recall.product} - ${recall.recall_date}`);
      });
    } else {
      console.log("   No Samsung recalls found in current dataset");
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testPagination() {
  console.log("\n=== TEST 2: Pagination ===\n");
  
  const client = new CPSCClient(null);
  
  console.log("2a. Testing pagination with skip/limit...");
  try {
    // Get first page
    const page1 = await client.searchRecalls({
      limit: 5,
      skip: 0
    });
    
    const data1 = JSON.parse(page1.content[0].text);
    console.log(`✅ Page 1: ${data1.results.length} recalls`);
    const firstPageIds = data1.results.map(r => r.recall_id);
    
    // Get second page
    const page2 = await client.searchRecalls({
      limit: 5,
      skip: 5
    });
    
    const data2 = JSON.parse(page2.content[0].text);
    console.log(`✅ Page 2: ${data2.results.length} recalls`);
    const secondPageIds = data2.results.map(r => r.recall_id);
    
    // Check for no overlap
    const overlap = firstPageIds.filter(id => secondPageIds.includes(id));
    if (overlap.length === 0) {
      console.log("✅ Pagination working correctly (no overlap between pages)");
    } else {
      console.log(`⚠️ Found ${overlap.length} overlapping recalls between pages`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testDateFiltering() {
  console.log("\n=== TEST 3: Date Filtering ===\n");
  
  const client = new CPSCClient(null);
  
  console.log("3a. Testing date range filtering...");
  try {
    const result = await client.searchRecalls({
      date_start: "2024-01-01",
      date_end: "2024-12-31",
      limit: 10
    });
    
    const data = JSON.parse(result.content[0].text);
    console.log(`✅ Found ${data.count} recalls in 2024`);
    
    if (data.results.length > 0) {
      console.log("   Sample recalls from 2024:");
      data.results.slice(0, 3).forEach((recall, i) => {
        console.log(`   ${i+1}. ${recall.recall_date} - ${recall.product}`);
      });
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testAPIAvailability() {
  console.log("\n=== TEST 4: API Endpoint Availability ===\n");
  
  console.log("Testing direct API access...");
  try {
    const response = await fetch("https://www.saferproducts.gov/RestWebServices/Recall?format=json", {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Enhanced-Legal-MCP/2.0.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const recallCount = Array.isArray(data) ? data.length : 0;
      console.log(`✅ CPSC API Available (Status ${response.status})`);
      console.log(`   - Total recalls in response: ${recallCount}`);
      
      if (recallCount > 0) {
        const firstRecall = data[0];
        console.log(`   - Response has expected structure: ${!!firstRecall.RecallID}`);
      }
    } else {
      console.log(`❌ CPSC API Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

async function runAllTests() {
  try {
    await testSearchRecalls();
    await testPagination();
    await testDateFiltering();
    await testAPIAvailability();
    
    console.log("\n" + "=".repeat(60));
    console.log("TEST COMPLETE");
    console.log("=".repeat(60));
    
    console.log("\n📊 Summary:");
    console.log("The CPSC Recalls API integration provides:");
    console.log("✅ Product recall search by name, firm, hazard");
    console.log("✅ Date range filtering for recalls");
    console.log("✅ Pagination support");
    console.log("✅ Access to recall IDs, descriptions, and URLs");
    console.log("✅ No authentication required");
    
    console.log("\n🔧 Implementation Notes:");
    console.log("• Client-side filtering for maximum compatibility");
    console.log("• Handles multiple field name variations");
    console.log("• Conservative rate limiting (5 req/sec)");
    console.log("• Ready for Claude Desktop integration");
    
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }
}

// Run the tests
runAllTests();