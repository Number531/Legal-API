/**
 * Mock Tests for FTCWebSearchClient
 * Tests all functionality without making actual API calls
 */

import { FTCWebSearchClient } from '../src/api-clients/FTCWebSearchClient.js';

// Mock rate limiter
const mockRateLimiter = {
  acquire: async () => {}
};

// Mock Exa API responses
const mockHSRResponse = {
  results: [
    {
      title: "Hart-Scott-Rodino Early Termination - Microsoft Corporation and Activision Blizzard",
      url: "https://www.ftc.gov/news-events/news/press-releases/2023/05/ftc-grants-early-termination-microsoft-activision-merger",
      publishedDate: "2023-05-15",
      text: `EARLY TERMINATION: The Federal Trade Commission has granted early termination of the Hart-Scott-Rodino Act waiting period for the proposed $68.7 billion acquisition of Activision Blizzard, Inc. by Microsoft Corporation. 

COMPANIES INVOLVED: Microsoft Corporation and Activision Blizzard, Inc.

TRANSACTION DESCRIPTION: Microsoft Corporation seeks to acquire all outstanding shares of Activision Blizzard for approximately $68.7 billion. The transaction involves video gaming and entertainment software.

HSR-2023-015: This early termination notice was filed under the Hart-Scott-Rodino Premerger Notification Act and allows the parties to complete their transaction before the statutory waiting period expires.

EFFECTIVE DATE: Early termination granted on May 15, 2023, effective immediately.`
    },
    {
      title: "HSR Early Termination - Amazon and MGM Studios",
      url: "https://www.ftc.gov/news-events/news/press-releases/2023/03/early-termination-amazon-mgm",
      publishedDate: "2023-03-10",
      text: `Hart-Scott-Rodino early termination granted for Amazon's acquisition of MGM Studios for $8.45 billion. 

The premerger notification waiting period has been terminated early, allowing the parties to proceed with the transaction. Companies involved: Amazon.com, Inc. and Metro-Goldwyn-Mayer Studios Inc.

HSR-2023-008: Filing demonstrates compliance with antitrust review requirements.`
    }
  ]
};

const mockEnforcementResponse = {
  results: [
    {
      title: "FTC Takes Action Against Facebook for Privacy Violations - $5 Billion Settlement",
      url: "https://www.ftc.gov/news-events/news/press-releases/2019/07/ftc-imposes-5-billion-penalty-sweeping-new-privacy-restrictions-facebook",
      publishedDate: "2019-07-24",
      text: `ENFORCEMENT ACTION: The Federal Trade Commission today announced a $5 billion penalty against Facebook, Inc. for violations of a 2012 FTC order regarding user privacy.

COMPLAINT SUMMARY: The FTC alleged that Facebook violated the 2012 consent order by deceiving users about their ability to control the privacy of their personal information.

DEFENDANTS: Facebook, Inc. (now Meta Platforms, Inc.)

VIOLATION: Privacy violations, deceptive practices regarding user data protection and sharing with third parties including Cambridge Analytica.

CONSENT ORDER: Facebook has agreed to pay $5 billion and implement comprehensive privacy reforms including establishment of an independent privacy committee.

CASE NO.: C-4365 

RELIEF: $5 billion civil penalty plus ongoing compliance monitoring and privacy program requirements.`
    },
    {
      title: "FTC Settles with Equifax Over Data Security Breach - $700 Million Relief",
      url: "https://www.ftc.gov/news-events/news/press-releases/2019/07/equifax-pay-700-million-settle-ftc-cfpb-states-charges-related-2017-data-breach",
      publishedDate: "2019-07-22",
      text: `The Federal Trade Commission announced a settlement with Equifax Inc. regarding the 2017 data breach that exposed personal information of approximately 147 million consumers.

ENFORCEMENT ACTION: Settlement includes $700 million in relief for affected consumers and enhanced data security requirements.

RESPONDENT: Equifax Inc.

VIOLATION TYPE: Data security failures, inadequate safeguards for sensitive consumer information

ADMINISTRATIVE COMPLAINT: Filed July 22, 2019, alleging violations of Section 5 of the FTC Act.

CONSENT ORDER TERMS: $700 million consumer relief fund, enhanced data security programs, and ongoing compliance monitoring.`
    }
  ]
};

// Global fetch mock
global.fetch = async (url, options) => {
  const body = JSON.parse(options.body);
  
  // Handle /search endpoint
  if (url.includes('/search')) {
    // Mock HSR search responses (return IDs for content fetching)
    if (body.query && (body.query.includes('Hart-Scott-Rodino') || body.query.includes('early termination'))) {
      return {
        ok: true,
        json: async () => ({
          results: mockHSRResponse.results.map(r => ({
            id: r.url, // Use URL as ID for simplicity
            title: r.title,
            url: r.url,
            publishedDate: r.publishedDate
          }))
        })
      };
    }
    
    // Mock enforcement search responses
    if (body.query && (body.query.includes('enforcement') || body.query.includes('complaint'))) {
      return {
        ok: true,
        json: async () => ({
          results: mockEnforcementResponse.results.map(r => ({
            id: r.url,
            title: r.title,
            url: r.url,
            publishedDate: r.publishedDate
          }))
        })
      };
    }
    
    // Default empty response
    return {
      ok: true,
      json: async () => ({ results: [] })
    };
  }
  
  // Handle /contents endpoint
  if (url.includes('/contents')) {
    const requestedIds = body.ids || [];
    const contentsResults = [];
    
    // Find matching content for requested IDs
    requestedIds.forEach(id => {
      // Check HSR results
      const hsrResult = mockHSRResponse.results.find(r => r.url === id);
      if (hsrResult) {
        contentsResults.push({
          id: id,
          title: hsrResult.title,
          url: hsrResult.url,
          publishedDate: hsrResult.publishedDate,
          text: hsrResult.text
        });
      }
      
      // Check enforcement results
      const enfResult = mockEnforcementResponse.results.find(r => r.url === id);
      if (enfResult) {
        contentsResults.push({
          id: id,
          title: enfResult.title,
          url: enfResult.url,
          publishedDate: enfResult.publishedDate,
          text: enfResult.text
        });
      }
    });
    
    return {
      ok: true,
      json: async () => ({ results: contentsResults })
    };
  }
  
  // Default empty response for other endpoints
  return {
    ok: true,
    json: async () => ({ results: [] })
  };
};

/**
 * Test helper functions
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertContains(str, substring, message) {
  if (!str || !str.includes(substring)) {
    throw new Error(message || `Expected "${str}" to contain "${substring}"`);
  }
}

/**
 * Main test runner
 */
async function runMockTests() {
  const client = new FTCWebSearchClient(mockRateLimiter, 'test-key');
  
  console.log('🧪 Running FTC WebSearch Client Mock Tests...\n');
  
  let testCount = 0;
  let passCount = 0;
  
  // Test 1: HSR Terminations - Basic Search
  try {
    testCount++;
    console.log('Test 1: HSR Terminations - Basic Search');
    
    const result = await client.searchHSRTerminationsWeb({
      limit: 5
    });
    
    assert(result.content && result.content[0], 'Should return content array');
    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.search_type === 'ftc_hsr_terminations_web', 'Should have correct search type');
    assert(parsed.results.length === 2, 'Should return 2 HSR results');
    assert(parsed.results[0].title.includes('Microsoft'), 'Should contain Microsoft HSR result');
    // Basic search doesn't include text content, so metadata extraction should be null/empty
    assert(parsed.results[0].companies.length === 0, 'Basic search should not extract companies');
    assert(parsed.results[0].hsr_number === null, 'Basic search should not extract HSR number');
    
    console.log('✅ PASS: Basic HSR search works\n');
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 2: HSR Terminations - With Date Range
  try {
    testCount++;
    console.log('Test 2: HSR Terminations - With Date Range');
    
    const result = await client.searchHSRTerminationsWeb({
      date_after: '2023-01-01',
      date_before: '2023-12-31',
      limit: 10
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.results.length === 2, 'Should return filtered results by date');
    assertContains(parsed.query, '2023-01-01..2023-12-31', 'Query should contain date range');
    
    console.log('✅ PASS: Date range filtering works\n');
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 3: HSR Terminations - With Snippets
  try {
    testCount++;
    console.log('Test 3: HSR Terminations - With Snippets');
    
    const result = await client.searchHSRTerminationsWeb({
      limit: 3,
      include_snippet: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.results[0].snippet, 'Should include snippet');
    assert(parsed.results[0].snippet.length > 50, 'Snippet should be meaningful length');
    assert(parsed.results[0].snippet.length <= 500, 'Snippet should be within limit');
    
    console.log('✅ PASS: Snippet extraction works for HSR\n');
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 4: Enforcement Actions - Basic Search
  try {
    testCount++;
    console.log('Test 4: Enforcement Actions - Basic Search');
    
    const result = await client.searchEnforcementActionsWeb({
      limit: 5
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.search_type === 'ftc_enforcement_actions_web', 'Should have correct search type');
    assert(parsed.results.length === 2, 'Should return 2 enforcement results');
    assert(parsed.results[0].title.includes('Facebook'), 'Should contain Facebook enforcement');
    // Basic search doesn't include text content, so metadata extraction should be null/empty
    assert(parsed.results[0].defendants.length === 0, 'Basic search should not extract defendants');
    assert(parsed.results[0].case_number === null, 'Basic search should not extract case number');
    
    console.log('✅ PASS: Basic enforcement search works\n');
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 5: Enforcement Actions - With Defendant Filter
  try {
    testCount++;
    console.log('Test 5: Enforcement Actions - With Defendant Filter');
    
    const result = await client.searchEnforcementActionsWeb({
      defendant_name: 'Facebook',
      limit: 10
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assertContains(parsed.query, '"Facebook"', 'Query should contain defendant name');
    assert(parsed.results.length >= 1, 'Should return results with defendant filter');
    
    console.log('✅ PASS: Defendant name filtering works\n');
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 6: Enforcement Actions - With Date Range
  try {
    testCount++;
    console.log('Test 6: Enforcement Actions - With Date Range');
    
    const result = await client.searchEnforcementActionsWeb({
      date_filed_after: '2019-01-01',
      date_filed_before: '2019-12-31',
      limit: 5
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assertContains(parsed.query, '2019-01-01..2019-12-31', 'Query should contain date range');
    
    console.log('✅ PASS: Date range filtering works for enforcement\n');
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 7: Enforcement Actions - Without Consent Orders
  try {
    testCount++;
    console.log('Test 7: Enforcement Actions - Without Consent Orders');
    
    const result = await client.searchEnforcementActionsWeb({
      include_consent_orders: false,
      limit: 5
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assert(!parsed.query.includes('consent order'), 'Query should not include consent order terms');
    
    console.log('✅ PASS: Consent order exclusion works\n');
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 8: Enforcement Actions - With Full Text
  try {
    testCount++;
    console.log('Test 8: Enforcement Actions - With Full Text');
    
    const result = await client.searchEnforcementActionsWeb({
      limit: 2,
      include_text: true
    });
    
    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.results[0].full_text, 'Should include full text');
    assert(parsed.results[0].full_text.length > 500, 'Full text should be substantial');
    
    console.log('✅ PASS: Full text inclusion works\n');
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 9: Query Building - HSR Type
  try {
    testCount++;
    console.log('Test 9: Query Building - HSR Type');
    
    const query = client.buildFTCQuery({
      search_type: 'hsr_terminations',
      date_after: '2023-01-01',
      date_before: '2023-12-31'
    });
    
    assertContains(query, 'site:ftc.gov', 'Should include site restriction');
    assertContains(query, 'Hart-Scott-Rodino', 'Should include HSR terms');
    assertContains(query, 'early termination', 'Should include early termination');
    assertContains(query, '2023-01-01..2023-12-31', 'Should include date range');
    
    console.log('✅ PASS: HSR query building works\n');
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 10: Query Building - Enforcement Type
  try {
    testCount++;
    console.log('Test 10: Query Building - Enforcement Type');
    
    const query = client.buildFTCQuery({
      search_type: 'enforcement',
      defendant_name: 'Meta',
      include_consent_orders: true
    });
    
    assertContains(query, 'site:ftc.gov', 'Should include site restriction');
    assertContains(query, 'enforcement', 'Should include enforcement term');
    assertContains(query, '"Meta"', 'Should include defendant name');
    assertContains(query, 'consent order', 'Should include consent order terms');
    
    console.log('✅ PASS: Enforcement query building works\n');
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 11: Metadata Extraction - HSR
  try {
    testCount++;
    console.log('Test 11: Metadata Extraction - HSR');
    
    const result = mockHSRResponse.results[0];
    const companies = client.extractCompanies(result);
    const hsrNumber = client.extractHSRNumber(result);
    const transactionValue = client.extractTransactionValue(result);
    
    assert(companies.includes('Microsoft Corporation'), 'Should extract Microsoft');
    assert(companies.includes('Activision Blizzard, Inc.'), 'Should extract Activision');
    assert(hsrNumber === 'HSR-2023-015', 'Should extract HSR number');
    assert(transactionValue === '$68.7 billion', 'Should extract transaction value');
    
    console.log('✅ PASS: HSR metadata extraction works\n');
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test 12: Metadata Extraction - Enforcement
  try {
    testCount++;
    console.log('Test 12: Metadata Extraction - Enforcement');
    
    const result = mockEnforcementResponse.results[0];
    const caseNumber = client.extractCaseNumber(result);
    const defendants = client.extractDefendants(result);
    const violationType = client.extractViolationType(result);
    const reliefAmount = client.extractReliefAmount(result);
    
    assert(caseNumber === 'C-4365', 'Should extract case number');
    assert(defendants.includes('Facebook, Inc.'), 'Should extract defendant');
    assert(violationType === 'privacy', 'Should identify privacy violation');
    assert(reliefAmount && reliefAmount.some(amount => amount.includes('$5')), 'Should extract relief amount');
    
    console.log('✅ PASS: Enforcement metadata extraction works\n');
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  }
  
  // Test Summary
  console.log('='.repeat(50));
  console.log(`📊 FTC WebSearch Client Mock Test Results:`);
  console.log(`✅ Passed: ${passCount}/${testCount}`);
  console.log(`❌ Failed: ${testCount - passCount}/${testCount}`);
  console.log(`📈 Success Rate: ${Math.round((passCount/testCount) * 100)}%`);
  
  if (passCount === testCount) {
    console.log(`\n🎉 ALL TESTS PASSED! FTCWebSearchClient is ready for live testing.`);
    return true;
  } else {
    console.log(`\n⚠️  Some tests failed. Please review and fix issues.`);
    return false;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMockTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

export { runMockTests };