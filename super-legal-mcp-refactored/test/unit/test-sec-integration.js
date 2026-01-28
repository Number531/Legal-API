/**
 * Integration Tests for SEC Company Identifier Resolution
 *
 * Tests the full searchSECFilingsWeb() method with ticker/CIK preprocessing
 * to verify "JPMorgan Chase & Co." now returns results by resolving to "JPM"
 */

import { SECWebSearchClient } from '../../src/api-clients/SECWebSearchClient.js';

// Test Suite 3: Integration Tests
console.log('\n📋 TEST SUITE 3: searchSECFilingsWeb() Integration Tests');
console.log('=' + '='.repeat(60));
console.log('Testing full method with preprocessing integrated\n');

const secClient = new SECWebSearchClient();

let totalTests = 0;
let totalPassed = 0;

// Test 12: searchSECFilingsWeb with ticker "JPM" (should work as before - backward compatibility)
console.log('✓ Test 12: Backward compatibility - ticker "JPM" still works');
totalTests++;
try {
  const result = await secClient.searchSECFilingsWeb({
    company_identifier: 'JPM',
    filing_type: '10-Q',
    date_after: '2024-01-01',
    date_before: '2024-09-30',
    include_snippet: true,
    limit: 5
  });

  if (result.company && result.company.cik === '0000019617' && result.filings.length > 0) {
    console.log(`  ✅ "JPM" → Found ${result.filings.length} filings, CIK: ${result.company.cik}`);
    console.log(`     First filing: ${result.filings[0].form}, Date: ${result.filings[0].filingDate}`);
    totalPassed++;
  } else {
    console.log(`  ❌ "JPM" → Expected CIK: 0000019617 and filings`);
    console.log(`     Got CIK: ${result.company?.cik}, Filings: ${result.filings?.length}`);
  }
} catch (error) {
  console.log(`  ❌ "JPM" → Error: ${error.message}`);
}

// Test 13: searchSECFilingsWeb with "JPMorgan" (SHOULD NOW WORK - THE FIX!)
console.log('\n✓ Test 13: THE FIX - "JPMorgan" now resolves to "JPM" and returns results');
totalTests++;
try {
  const result = await secClient.searchSECFilingsWeb({
    company_identifier: 'JPMorgan',
    filing_type: '10-Q',
    date_after: '2024-01-01',
    date_before: '2024-09-30',
    include_snippet: true,
    limit: 5
  });

  if (result.company && result.company.cik === '0000019617' && result.filings.length > 0) {
    console.log(`  ✅ "JPMorgan" → Resolved to JPM, Found ${result.filings.length} filings, CIK: ${result.company.cik}`);
    console.log(`     First filing: ${result.filings[0].form}, Date: ${result.filings[0].filingDate}`);
    if (result.filings[0].snippet) {
      console.log(`     Snippet exists: ${result.filings[0].snippet.substring(0, 80)}...`);
    }
    totalPassed++;
  } else {
    console.log(`  ❌ "JPMorgan" → Expected CIK: 0000019617 and filings`);
    console.log(`     Got CIK: ${result.company?.cik}, Filings: ${result.filings?.length}`);
  }
} catch (error) {
  console.log(`  ❌ "JPMorgan" → Error: ${error.message}`);
}

// Test 14: searchSECFilingsWeb with "Tesla" (should resolve to TSLA)
console.log('\n✓ Test 14: "Tesla" resolves to "TSLA" and returns results');
totalTests++;
try {
  const result = await secClient.searchSECFilingsWeb({
    company_identifier: 'Tesla',
    filing_type: '10-K',
    date_after: '2024-01-01',
    date_before: '2024-12-31',
    include_snippet: true,
    limit: 5
  });

  if (result.company && result.company.cik === '0001318605' && result.filings.length > 0) {
    console.log(`  ✅ "Tesla" → Resolved to TSLA, Found ${result.filings.length} filings, CIK: ${result.company.cik}`);
    console.log(`     First filing: ${result.filings[0].form}, Date: ${result.filings[0].filingDate}`);
    totalPassed++;
  } else {
    console.log(`  ❌ "Tesla" → Expected CIK: 0001318605 and filings`);
    console.log(`     Got CIK: ${result.company?.cik}, Filings: ${result.filings?.length}`);
  }
} catch (error) {
  console.log(`  ❌ "Tesla" → Error: ${error.message}`);
}

// Test 15: Verify CIK metadata populated correctly
console.log('\n✓ Test 15: CIK metadata populated from resolution');
totalTests++;
try {
  const result = await secClient.searchSECFilingsWeb({
    company_identifier: 'Microsoft',
    filing_type: '10-Q',
    date_after: '2024-01-01',
    date_before: '2024-12-31',
    include_snippet: true,
    limit: 3
  });

  if (result.company && result.company.cik === '0000789019') {
    console.log(`  ✅ "Microsoft" → CIK correctly populated: ${result.company.cik}`);
    console.log(`     Found ${result.filings.length} filings`);
    totalPassed++;
  } else {
    console.log(`  ❌ "Microsoft" → Expected CIK: 0000789019`);
    console.log(`     Got: ${result.company?.cik}`);
  }
} catch (error) {
  console.log(`  ❌ "Microsoft" → Error: ${error.message}`);
}

// Test 16: Fallback when resolution fails (unknown company)
console.log('\n✓ Test 16: Fallback behavior for unknown company');
totalTests++;
try {
  const result = await secClient.searchSECFilingsWeb({
    company_identifier: 'UnknownCompanyXYZ123',
    filing_type: 'all',
    date_after: '2024-01-01',
    date_before: '2024-12-31',
    limit: 5
  });

  // Should not throw error, but may return 0 results
  console.log(`  ✅ "UnknownCompanyXYZ123" → Graceful fallback, Found ${result.filings?.length || 0} filings`);
  console.log(`     CIK: ${result.company?.cik || 'null (expected)'}`);
  totalPassed++;
} catch (error) {
  console.log(`  ❌ "UnknownCompanyXYZ123" → Should not throw error: ${error.message}`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUITE 3 SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${totalPassed}`);
console.log(`❌ Failed: ${totalTests - totalPassed}`);
console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

if (totalPassed === totalTests) {
  console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
  console.log('✅ Solution 1 implementation SUCCESSFUL');
  console.log('✅ "JPMorgan" now returns results (resolves to JPM ticker)');
  console.log('✅ Backward compatibility maintained');
  console.log('✅ CIK metadata accurate');
  console.log('\n🚀 Ready for manual validation via claude-server-v2.js');
  process.exit(0);
} else {
  console.log('\n⚠️ SOME INTEGRATION TESTS FAILED');
  console.log('Review failures before manual testing');
  process.exit(1);
}
