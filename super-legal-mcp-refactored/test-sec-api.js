/**
 * Test SEC API endpoints to diagnose 404 errors
 */

import { SecEdgarClient } from './src/api-clients/SecEdgarClient.js';

// Test cases
const tests = [
  {
    name: "Search SEC Filings (Apple)",
    method: "searchSECFilings",
    args: {
      company_identifier: "AAPL",
      filing_type: "10-K",
      limit: 1
    }
  },
  {
    name: "Get SEC Company Facts (Apple)",
    method: "getSECCompanyFacts",
    args: {
      company_identifier: "AAPL"
    }
  },
  {
    name: "Get SEC XBRL Frames",
    method: "getSECXBRLFrames",
    args: {
      taxonomy: "us-gaap",
      concept: "Assets",
      unit: "USD",
      period: "2023"
    }
  }
];

async function runTests() {
  console.log("=== SEC API DIAGNOSTIC TEST ===\n");
  
  const client = new SecEdgarClient(null);
  
  for (const test of tests) {
    console.log(`\nTesting: ${test.name}`);
    console.log(`Method: ${test.method}`);
    console.log(`Args:`, JSON.stringify(test.args, null, 2));
    console.log("-".repeat(50));
    
    try {
      const result = await client[test.method](test.args);
      
      // Parse the response
      const data = JSON.parse(result.content[0].text);
      
      console.log("✅ SUCCESS");
      console.log("Response structure:");
      console.log("- Keys:", Object.keys(data).join(", "));
      
      if (data.company) {
        console.log("- Company:", data.company.name, `(${data.company.ticker})`);
      }
      if (data.filings) {
        console.log("- Filings found:", data.filings.length);
      }
      if (data.facts) {
        console.log("- Facts available:", Object.keys(data.facts).length > 0);
      }
      if (data.data && Array.isArray(data.data)) {
        console.log("- Data points:", data.data.length);
      }
      
    } catch (error) {
      console.log("❌ ERROR:", error.message);
      
      // Extract more details if available
      if (error.message.includes("404")) {
        console.log("⚠️  404 Error - endpoint not found");
      }
      if (error.message.includes("URL:")) {
        const urlMatch = error.message.match(/URL: (https?:\/\/[^\s]+)/);
        if (urlMatch) {
          console.log("Failed URL:", urlMatch[1]);
        }
      }
    }
  }
  
  console.log("\n=== TEST COMPLETE ===\n");
}

// Run the tests
runTests().catch(error => {
  console.error("Test suite failed:", error);
  process.exit(1);
});