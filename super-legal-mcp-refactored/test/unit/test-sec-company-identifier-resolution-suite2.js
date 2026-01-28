/**
 * Unit Tests for SEC Company Identifier Resolution - Suite 2
 *
 * Tests the _resolveCompanyIdentifier() method which resolves company names
 * to ticker symbols using SEC's company tickers API.
 */

import { SECWebSearchClient } from '../../src/api-clients/SECWebSearchClient.js';

// Test Suite 2: _resolveCompanyIdentifier() Tests
console.log('\n📋 TEST SUITE 2: _resolveCompanyIdentifier() Method');
console.log('=' + '='.repeat(60));

const secClient = new SECWebSearchClient();

// Test 5: Returns ticker unchanged
console.log('\n✓ Test 5: Ticker symbols returned unchanged');
const test5Cases = [
  { input: 'JPM', expectedIdentifier: 'JPM', expectedSource: 'original' },
  { input: 'TSLA', expectedIdentifier: 'TSLA', expectedSource: 'original' },
  { input: 'AAPL', expectedIdentifier: 'AAPL', expectedSource: 'original' }
];

let test5Passed = 0;
let test5Failed = 0;

for (const testCase of test5Cases) {
  try {
    const result = await secClient._resolveCompanyIdentifier(testCase.input);
    if (result.identifier === testCase.expectedIdentifier && result.source === testCase.expectedSource) {
      console.log(`  ✅ "${testCase.input}" → identifier: ${result.identifier}, source: ${result.source}`);
      test5Passed++;
    } else {
      console.log(`  ❌ "${testCase.input}" → Expected: ${testCase.expectedIdentifier}/${testCase.expectedSource}, Got: ${result.identifier}/${result.source}`);
      test5Failed++;
    }
  } catch (error) {
    console.log(`  ❌ "${testCase.input}" → Error: ${error.message}`);
    test5Failed++;
  }
}

console.log(`  Result: ${test5Passed}/${test5Cases.length} passed`);

// Test 6: Returns CIK unchanged
console.log('\n✓ Test 6: CIK numbers returned unchanged');
const test6Cases = [
  { input: '0000019617', expectedIdentifier: '0000019617', expectedSource: 'original', expectedCIK: '0000019617' },
  { input: '0001318605', expectedIdentifier: '0001318605', expectedSource: 'original', expectedCIK: '0001318605' },
  { input: '320193', expectedIdentifier: '0000320193', expectedSource: 'original', expectedCIK: '0000320193' } // Short CIK
];

let test6Passed = 0;
let test6Failed = 0;

for (const testCase of test6Cases) {
  try {
    const result = await secClient._resolveCompanyIdentifier(testCase.input);
    if (result.identifier === testCase.expectedIdentifier &&
        result.source === testCase.expectedSource &&
        result.cik === testCase.expectedCIK) {
      console.log(`  ✅ "${testCase.input}" → identifier: ${result.identifier}, cik: ${result.cik}, source: ${result.source}`);
      test6Passed++;
    } else {
      console.log(`  ❌ "${testCase.input}" → Expected: ${testCase.expectedIdentifier}/${testCase.expectedCIK}/${testCase.expectedSource}`);
      console.log(`     Got: ${result.identifier}/${result.cik}/${result.source}`);
      test6Failed++;
    }
  } catch (error) {
    console.log(`  ❌ "${testCase.input}" → Error: ${error.message}`);
    test6Failed++;
  }
}

console.log(`  Result: ${test6Passed}/${test6Cases.length} passed`);

// Test 7: Resolves "Tesla" to TSLA (using simple name for reliable matching)
console.log('\n✓ Test 7: Resolve "Tesla" to ticker TSLA');
let test7Passed = 0;
try {
  const result = await secClient._resolveCompanyIdentifier('Tesla');
  if (result.source === 'resolved' && result.identifier === 'TSLA' && result.cik === '0001318605') {
    console.log(`  ✅ "Tesla" → ticker: ${result.identifier}, CIK: ${result.cik}, source: ${result.source}`);
    console.log(`     Resolved name: ${result.resolvedName}`);
    test7Passed = 1;
  } else {
    console.log(`  ❌ "Tesla" → Expected: TSLA/0001318605/resolved`);
    console.log(`     Got: ${result.identifier}/${result.cik}/${result.source}`);
  }
} catch (error) {
  console.log(`  ❌ "Tesla" → Error: ${error.message}`);
}

// Test 8: Resolves "JPMorgan" to JPM (using simple name for reliable matching)
console.log('\n✓ Test 8: Resolve "JPMorgan" to ticker JPM');
let test8Passed = 0;
try {
  const result = await secClient._resolveCompanyIdentifier('JPMorgan');
  if (result.source === 'resolved' && result.identifier === 'JPM' && result.cik === '0000019617') {
    console.log(`  ✅ "JPMorgan" → ticker: ${result.identifier}, CIK: ${result.cik}, source: ${result.source}`);
    console.log(`     Resolved name: ${result.resolvedName}`);
    test8Passed = 1;
  } else {
    console.log(`  ❌ "JPMorgan" → Expected: JPM/0000019617/resolved`);
    console.log(`     Got: ${result.identifier}/${result.cik}/${result.source}`);
  }
} catch (error) {
  console.log(`  ❌ "JPMorgan" → Error: ${error.message}`);
}

// Test 9: Resolves "Apple Inc." to AAPL
console.log('\n✓ Test 9: Resolve "Apple Inc." to ticker AAPL');
let test9Passed = 0;
try {
  const result = await secClient._resolveCompanyIdentifier('Apple Inc.');
  if (result.source === 'resolved' && result.identifier === 'AAPL' && result.cik === '0000320193') {
    console.log(`  ✅ "Apple Inc." → ticker: ${result.identifier}, CIK: ${result.cik}, source: ${result.source}`);
    console.log(`     Resolved name: ${result.resolvedName}`);
    test9Passed = 1;
  } else {
    console.log(`  ❌ "Apple Inc." → Expected: AAPL/0000320193/resolved`);
    console.log(`     Got: ${result.identifier}/${result.cik}/${result.source}`);
  }
} catch (error) {
  console.log(`  ❌ "Apple Inc." → Error: ${error.message}`);
}

// Test 10: Fallback on unknown company
console.log('\n✓ Test 10: Fallback to original for unknown company');
let test10Passed = 0;
try {
  const result = await secClient._resolveCompanyIdentifier('Nonexistent Company XYZ123');
  if (result.source === 'original' && result.identifier === 'Nonexistent Company XYZ123') {
    console.log(`  ✅ "Nonexistent Company XYZ123" → Falls back to original`);
    console.log(`     Source: ${result.source}, Warning: ${result.warning || 'none'}`);
    test10Passed = 1;
  } else {
    console.log(`  ❌ "Nonexistent Company XYZ123" → Expected: original/Nonexistent Company XYZ123`);
    console.log(`     Got: ${result.source}/${result.identifier}`);
  }
} catch (error) {
  console.log(`  ❌ "Nonexistent Company XYZ123" → Error: ${error.message}`);
}

// Test 11: Additional company name resolutions
console.log('\n✓ Test 11: Additional company name resolutions');
const test11Cases = [
  { input: 'Microsoft', expectedTicker: 'MSFT', expectedCIK: '0000789019' },
  { input: 'Amazon', expectedTicker: 'AMZN', expectedCIK: '0001018724' }
];

let test11Passed = 0;
let test11Failed = 0;

for (const testCase of test11Cases) {
  try {
    const result = await secClient._resolveCompanyIdentifier(testCase.input);
    if (result.source === 'resolved' &&
        result.identifier === testCase.expectedTicker &&
        result.cik === testCase.expectedCIK) {
      console.log(`  ✅ "${testCase.input}" → ticker: ${result.identifier}, CIK: ${result.cik}`);
      test11Passed++;
    } else {
      console.log(`  ❌ "${testCase.input}" → Expected: ${testCase.expectedTicker}/${testCase.expectedCIK}/resolved`);
      console.log(`     Got: ${result.identifier}/${result.cik}/${result.source}`);
      test11Failed++;
    }
  } catch (error) {
    console.log(`  ❌ "${testCase.input}" → Error: ${error.message}`);
    test11Failed++;
  }
}

console.log(`  Result: ${test11Passed}/${test11Cases.length} passed`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUITE 2 SUMMARY');
console.log('='.repeat(60));
const totalPassed = test5Passed + test6Passed + test7Passed + test8Passed + test9Passed + test10Passed + test11Passed;
const totalTests = test5Cases.length + test6Cases.length + 1 + 1 + 1 + 1 + test11Cases.length; // Tests 5,6,7,8,9,10,11

console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${totalPassed}`);
console.log(`❌ Failed: ${totalTests - totalPassed}`);
console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

if (totalPassed === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! Ready to proceed to Phase 2: Integration');
  process.exit(0);
} else {
  console.log('\n⚠️ SOME TESTS FAILED. Review and fix before proceeding.');
  process.exit(1);
}
