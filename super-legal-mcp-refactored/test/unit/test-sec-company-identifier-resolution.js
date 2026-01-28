/**
 * Unit Tests for SEC Company Identifier Resolution
 *
 * Tests the ticker/CIK detection and company name resolution functionality
 * that enables "JPMorgan Chase & Co." to work by resolving to "JPM" ticker.
 */

import { SECWebSearchClient } from '../../src/api-clients/SECWebSearchClient.js';

// Test Suite 1: _isTickerOrCIK() Helper Method Tests
console.log('\n📋 TEST SUITE 1: _isTickerOrCIK() Helper Method');
console.log('=' + '='.repeat(60));

const secClient = new SECWebSearchClient();

// Test 1: Recognizes valid tickers
console.log('\n✓ Test 1: Recognizes valid ticker symbols');
const tickerTests = [
  { input: 'TSLA', expected: 'ticker' },
  { input: 'AAPL', expected: 'ticker' },
  { input: 'JPM', expected: 'ticker' },
  { input: 'MSFT', expected: 'ticker' },
  { input: 'BRK.B', expected: 'ticker' },  // Dual-class stock
  { input: 'BF.A', expected: 'ticker' }     // Dual-class stock
];

let test1Passed = 0;
let test1Failed = 0;

for (const test of tickerTests) {
  const result = secClient._isTickerOrCIK(test.input);
  if (result.type === test.expected && result.value === test.input) {
    console.log(`  ✅ "${test.input}" → type: ${result.type}, value: ${result.value}`);
    test1Passed++;
  } else {
    console.log(`  ❌ "${test.input}" → Expected type: ${test.expected}, Got: ${result.type}, value: ${result.value}`);
    test1Failed++;
  }
}

console.log(`  Result: ${test1Passed}/${tickerTests.length} passed`);

// Test 2: Recognizes valid CIK numbers
console.log('\n✓ Test 2: Recognizes valid CIK numbers');
const cikTests = [
  { input: '0000019617', expected: 'cik', expectedValue: '0000019617' },
  { input: '0001318605', expected: 'cik', expectedValue: '0001318605' },
  { input: '19617', expected: 'cik', expectedValue: '0000019617' },  // Short CIK, should pad
  { input: '1318605', expected: 'cik', expectedValue: '0001318605' },
  { input: '320193', expected: 'cik', expectedValue: '0000320193' }
];

let test2Passed = 0;
let test2Failed = 0;

for (const test of cikTests) {
  const result = secClient._isTickerOrCIK(test.input);
  if (result.type === test.expected && result.value === test.expectedValue) {
    console.log(`  ✅ "${test.input}" → type: ${result.type}, value: ${result.value}`);
    test2Passed++;
  } else {
    console.log(`  ❌ "${test.input}" → Expected type: ${test.expected}, value: ${test.expectedValue}, Got: ${result.type}, value: ${result.value}`);
    test2Failed++;
  }
}

console.log(`  Result: ${test2Passed}/${cikTests.length} passed`);

// Test 3: Recognizes company names
console.log('\n✓ Test 3: Recognizes company names');
const nameTests = [
  { input: 'Tesla Inc', expected: 'name' },
  { input: 'JPMorgan Chase & Co.', expected: 'name' },
  { input: 'Apple Inc.', expected: 'name' },
  { input: 'Procter & Gamble', expected: 'name' },
  { input: 'AT&T Inc.', expected: 'name' },
  { input: 'Johnson & Johnson', expected: 'name' }
];

let test3Passed = 0;
let test3Failed = 0;

for (const test of nameTests) {
  const result = secClient._isTickerOrCIK(test.input);
  if (result.type === test.expected && result.value === test.input) {
    console.log(`  ✅ "${test.input}" → type: ${result.type}`);
    test3Passed++;
  } else {
    console.log(`  ❌ "${test.input}" → Expected type: ${test.expected}, Got: ${result.type}, value: ${result.value}`);
    test3Failed++;
  }
}

console.log(`  Result: ${test3Passed}/${nameTests.length} passed`);

// Test 4: Edge cases
console.log('\n✓ Test 4: Edge cases');
const edgeTests = [
  { input: 'tsla', expected: 'name', description: 'Lowercase ticker (treated as name)' },
  { input: 'VERYLONGTICKER', expected: 'name', description: 'Too long for ticker (>5 chars)' },
  { input: '', expected: 'name', description: 'Empty string' },
  { input: '  AAPL  ', expected: 'ticker', expectedValue: 'AAPL', description: 'Ticker with whitespace' },
  { input: 'A', expected: 'ticker', description: 'Single letter ticker' },
  { input: '12345678901', expected: 'name', description: 'Too many digits for CIK' }
];

let test4Passed = 0;
let test4Failed = 0;

for (const test of edgeTests) {
  const result = secClient._isTickerOrCIK(test.input);
  const expectedValue = test.expectedValue || test.input.trim();
  if (result.type === test.expected && (test.input === '' ? result.value === '' : result.value === expectedValue)) {
    console.log(`  ✅ ${test.description}: "${test.input}" → type: ${result.type}`);
    test4Passed++;
  } else {
    console.log(`  ❌ ${test.description}: "${test.input}" → Expected type: ${test.expected}, Got: ${result.type}, value: ${result.value}`);
    test4Failed++;
  }
}

console.log(`  Result: ${test4Passed}/${edgeTests.length} passed`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUITE 1 SUMMARY');
console.log('='.repeat(60));
const totalTests = tickerTests.length + cikTests.length + nameTests.length + edgeTests.length;
const totalPassed = test1Passed + test2Passed + test3Passed + test4Passed;
const totalFailed = test1Failed + test2Failed + test3Failed + test4Failed;

console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${totalPassed}`);
console.log(`❌ Failed: ${totalFailed}`);
console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

if (totalFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Ready to proceed to Step 1.3');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED. Fix issues before proceeding.');
  process.exit(1);
}
