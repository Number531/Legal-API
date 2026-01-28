/**
 * SEC API Debug Test - Diagnose 404 errors in Claude Desktop
 */

import { SecEdgarClient } from './src/api-clients/SecEdgarClient.js';
import { makeSECApiRequest } from './src/utils/secApiHelper.js';

// Test direct API calls
async function testDirectAPICalls() {
  console.log("=== DIRECT API CALLS TEST ===\n");
  
  const endpoints = [
    {
      name: "Submissions (Apple)",
      endpoint: "/submissions/CIK0000320193.json"
    },
    {
      name: "Company Facts (Apple)", 
      endpoint: "/api/xbrl/companyfacts/CIK0000320193.json"
    },
    {
      name: "XBRL Frames",
      endpoint: "/api/xbrl/frames/us-gaap/Assets/USD/CY2021Q4I.json"
    }
  ];
  
  for (const test of endpoints) {
    console.log(`Testing: ${test.name}`);
    console.log(`Endpoint: ${test.endpoint}`);
    
    try {
      const data = await makeSECApiRequest(test.endpoint, null);
      console.log(`✅ SUCCESS - Response has ${Object.keys(data).length} keys`);
      if (data.cik) console.log(`   CIK: ${data.cik}`);
      if (data.name) console.log(`   Name: ${data.name}`);
      if (data.taxonomy) console.log(`   Taxonomy: ${data.taxonomy}`);
      if (data.pts) console.log(`   Data points: ${data.pts}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      
      // Try to diagnose the issue
      if (error.message.includes("404")) {
        console.log("   Debugging 404 error...");
        
        // Build the URL manually
        let debugUrl;
        if (test.endpoint === '/company_tickers.json') {
          debugUrl = 'https://www.sec.gov/files/company_tickers.json';
        } else if (test.endpoint.startsWith('/submissions/')) {
          debugUrl = `https://data.sec.gov${test.endpoint}`;
        } else if (test.endpoint.startsWith('/api/xbrl/')) {
          debugUrl = `https://data.sec.gov${test.endpoint}`;
        } else {
          debugUrl = `https://data.sec.gov/api${test.endpoint}`;
        }
        
        console.log(`   Expected URL: ${debugUrl}`);
        
        // Test with fetch directly
        try {
          const response = await fetch(debugUrl, {
            headers: {
              'User-Agent': 'Enhanced-Legal-MCP/1.0.0 (contact@yourorg.com)',
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log(`   ✅ Direct fetch works! Status: ${response.status}`);
            console.log("   ⚠️  Issue is in the helper function");
          } else {
            console.log(`   ❌ Direct fetch also fails: ${response.status}`);
            const text = await response.text();
            console.log(`   Response: ${text.substring(0, 200)}`);
          }
        } catch (fetchError) {
          console.log(`   ❌ Direct fetch error: ${fetchError.message}`);
        }
      }
    }
    console.log("");
  }
}

// Test through the client
async function testThroughClient() {
  console.log("=== CLIENT METHOD TEST ===\n");
  
  const client = new SecEdgarClient(null);
  
  // Test searchSECFilings (which has been reported as failing)
  console.log("Testing searchSECFilings...");
  try {
    const result = await client.searchSECFilings({
      company_identifier: "AAPL",
      filing_type: "10-K",
      limit: 1
    });
    
    const data = JSON.parse(result.content[0].text);
    console.log("✅ SUCCESS");
    console.log(`   Company: ${data.company.name}`);
    console.log(`   Filings: ${data.filings.length}`);
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    
    // Check if it's a CIK resolution issue
    if (error.message.includes("Could not find company")) {
      console.log("   ⚠️  Issue with CIK resolution");
      
      // Test CIK resolution separately
      try {
        const tickersResponse = await fetch('https://www.sec.gov/files/company_tickers.json', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Enhanced-Legal-MCP/1.0.0)',
            'Accept': 'application/json'
          }
        });
        
        if (tickersResponse.ok) {
          console.log("   ✅ Can fetch tickers file");
          const tickers = await tickersResponse.json();
          const apple = Object.values(tickers).find(c => c.ticker === 'AAPL');
          if (apple) {
            console.log(`   ✅ Found Apple: CIK ${apple.cik_str}`);
          } else {
            console.log("   ❌ Could not find AAPL in tickers");
          }
        } else {
          console.log(`   ❌ Cannot fetch tickers: ${tickersResponse.status}`);
        }
      } catch (tickerError) {
        console.log(`   ❌ Ticker fetch error: ${tickerError.message}`);
      }
    }
  }
}

// Test environment and dependencies
async function testEnvironment() {
  console.log("=== ENVIRONMENT CHECK ===\n");
  
  // Check if we're in a restricted environment
  console.log("Node version:", process.version);
  console.log("Platform:", process.platform);
  
  // Test basic fetch
  console.log("\nTesting basic fetch capability...");
  try {
    const response = await fetch('https://www.sec.gov/robots.txt');
    console.log(`✅ Can fetch from SEC.gov - Status: ${response.status}`);
  } catch (error) {
    console.log(`❌ Cannot fetch from SEC.gov: ${error.message}`);
  }
  
  // Test data.sec.gov
  console.log("\nTesting data.sec.gov access...");
  try {
    const response = await fetch('https://data.sec.gov/submissions/', {
      headers: {
        'User-Agent': 'Test/1.0'
      }
    });
    console.log(`✅ Can access data.sec.gov - Status: ${response.status}`);
  } catch (error) {
    console.log(`❌ Cannot access data.sec.gov: ${error.message}`);
  }
}

// Run all tests
async function runDiagnostics() {
  console.log("SEC API DIAGNOSTIC TEST");
  console.log("=".repeat(50));
  console.log("");
  
  await testEnvironment();
  console.log("");
  
  await testDirectAPICalls();
  console.log("");
  
  await testThroughClient();
  
  console.log("\n" + "=".repeat(50));
  console.log("DIAGNOSTIC COMPLETE");
}

runDiagnostics().catch(error => {
  console.error("Diagnostic failed:", error);
  process.exit(1);
});