/**
 * Complete SEC API test to verify all endpoints work
 */

import { SecEdgarClient } from './src/api-clients/SecEdgarClient.js';

async function testSEC() {
  console.log("=== COMPLETE SEC API TEST ===\n");
  
  const client = new SecEdgarClient(null);
  const results = [];
  
  // Test 1: Search companies
  console.log("1. Testing company ticker search...");
  try {
    const companies = await client.searchSECCompanyTickers({ search_term: "Apple" });
    const data = JSON.parse(companies.content[0].text);
    console.log(`   ✅ Found ${data.count} companies`);
    results.push({ test: "searchSECCompanyTickers", status: "PASS" });
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    results.push({ test: "searchSECCompanyTickers", status: "FAIL", error: error.message });
  }
  
  // Test 2: Search filings
  console.log("2. Testing filing search...");
  try {
    const filings = await client.searchSECFilings({ 
      company_identifier: "AAPL",
      filing_type: "10-K",
      limit: 2
    });
    const data = JSON.parse(filings.content[0].text);
    console.log(`   ✅ Found ${data.filings.length} filings for ${data.company.name}`);
    console.log(`   - Ticker: ${data.company.ticker}`);
    console.log(`   - Financial facts: ${Object.keys(data.financial_facts).length > 0 ? 'Available' : 'Empty'}`);
    results.push({ test: "searchSECFilings", status: "PASS" });
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    results.push({ test: "searchSECFilings", status: "FAIL", error: error.message });
  }
  
  // Test 3: Get company facts
  console.log("3. Testing company facts...");
  try {
    const facts = await client.getSECCompanyFacts({ 
      company_identifier: "MSFT"
    });
    const data = JSON.parse(facts.content[0].text);
    console.log(`   ✅ Retrieved facts for ${data.company.name}`);
    console.log(`   - Taxonomies: ${Object.keys(data.taxonomies).join(", ")}`);
    results.push({ test: "getSECCompanyFacts", status: "PASS" });
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    results.push({ test: "getSECCompanyFacts", status: "FAIL", error: error.message });
  }
  
  // Test 4: XBRL Frames with different period formats
  const periodTests = [
    { period: "2021", desc: "Year only (2021)" },
    { period: "2021Q4", desc: "Quarter format (2021Q4)" },
    { period: "CY2021Q4I", desc: "Full format (CY2021Q4I)" }
  ];
  
  console.log("4. Testing XBRL frames with various period formats...");
  for (const test of periodTests) {
    try {
      const frames = await client.getSECXBRLFrames({ 
        taxonomy: "us-gaap",
        concept: "Assets",
        unit: "USD",
        period: test.period,
        limit: 5
      });
      const data = JSON.parse(frames.content[0].text);
      console.log(`   ✅ ${test.desc}: ${data.data.length} data points`);
      results.push({ test: `getSECXBRLFrames-${test.period}`, status: "PASS" });
    } catch (error) {
      console.log(`   ❌ ${test.desc}: ${error.message}`);
      results.push({ test: `getSECXBRLFrames-${test.period}`, status: "FAIL", error: error.message });
    }
  }
  
  // Summary
  console.log("\n=== TEST SUMMARY ===");
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log("\n🎉 All SEC API endpoints are working correctly!");
  } else {
    console.log("\n⚠️  Some endpoints need attention:");
    results.filter(r => r.status === "FAIL").forEach(r => {
      console.log(`   - ${r.test}: ${r.error}`);
    });
  }
}

testSEC().catch(error => {
  console.error("Test suite failed:", error);
  process.exit(1);
});