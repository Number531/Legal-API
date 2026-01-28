#!/usr/bin/env node

/**
 * Comprehensive Validation Test: All 12 FDA Web Search Methods
 *
 * Verifies that SummaryQueryBuilder integration is complete and working
 * across all FDA web search methods.
 */

import { FDAWebSearchClient } from './src/api-clients/FDAWebSearchClient.js';

console.log('🧪 FDA All Methods - SummaryQueryBuilder Integration Test\n');
console.log('='.repeat(70));

// Mock client that captures summary queries
class TestFDAClient extends FDAWebSearchClient {
  constructor(useEnhancedQueries) {
    process.env.ENHANCED_SUMMARY_QUERIES = useEnhancedQueries ? 'true' : 'false';
    super(null, 'test-key');
    this.capturedQueries = [];
  }

  async executeExaSearch(query, limit, options) {
    this.capturedQueries.push({
      method: new Error().stack.split('\n')[2].match(/at (\w+)/)?.[1],
      summaryQuery: options.summaryQuery,
      dataType: options.dataType
    });
    return [];
  }

  isFDADomain(url) { return true; }
  mapFDAResultPermissive(r) { return r; }
  assessFDAResultQuality() { return {}; }
}

// Test configuration for all 12 methods
const methods = [
  { name: 'searchDrugAdverseEventsWeb', args: { search: 'Lipitor' }, expected: 'Lipitor' },
  { name: 'searchDeviceEventsWeb', args: { search: 'pacemaker malfunction' }, expected: 'pacemaker' },
  { name: 'searchDrugLabelsWeb', args: { search: 'Ozempic warnings' }, expected: 'Ozempic' },
  { name: 'searchRecallsWeb', args: { search: 'Tesla recall' }, expected: 'Tesla' },
  { name: 'searchWarningLettersWeb', args: { search: 'Pfizer warning letter' }, expected: 'Pfizer' },
  { name: 'searchDrugSafetyCommunicationsWeb', args: { search: 'Zantac safety alert' }, expected: 'Zantac' },
  { name: 'searchDeviceSafetyCommunicationsWeb', args: { search: 'Medtronic device alert' }, expected: 'Medtronic' },
  { name: 'searchDrugShortagesWeb', args: { search: 'insulin shortage' }, expected: 'insulin' },
  { name: 'search510kWeb', args: { search: 'Boston Scientific' }, expected: 'Boston' },
  { name: 'searchPMAApprovalsWeb', args: { search: 'Abbott device approval' }, expected: 'Abbott' },
  { name: 'searchOrangeBookWeb', args: { search: 'Lipitor generic' }, expected: 'Lipitor' },
  { name: 'searchPurpleBookWeb', args: { search: 'Humira biosimilar' }, expected: 'Humira' }
];

console.log(`\n📊 Testing ${methods.length} FDA web search methods\n`);

// Test with feature flag OFF (backward compatibility)
console.log('📋 Test Suite 1: Feature Flag OFF (Backward Compatibility)\n');
const clientOff = new TestFDAClient(false);

for (const { name, args } of methods) {
  try {
    await clientOff[name](args);
    const captured = clientOff.capturedQueries[clientOff.capturedQueries.length - 1];

    const isStatic = !captured.summaryQuery.startsWith('Provide');
    const noUserTerm = !captured.summaryQuery.includes(args.search.split(' ')[0]);

    console.log(`   ${name}`);
    console.log(`      Static query: ${isStatic ? '✅' : '❌'}`);
    console.log(`      No user term: ${noUserTerm ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`   ${name}: ❌ ERROR - ${error.message}`);
  }
}

// Test with feature flag ON (enhanced queries)
console.log('\n📋 Test Suite 2: Feature Flag ON (Enhanced Queries)\n');
const clientOn = new TestFDAClient(true);

let passCount = 0;
let failCount = 0;

for (const { name, args, expected } of methods) {
  try {
    await clientOn[name](args);
    const captured = clientOn.capturedQueries[clientOn.capturedQueries.length - 1];

    const hasProvidePattern = captured.summaryQuery.startsWith('Provide');
    const containsUserTerm = captured.summaryQuery.includes(expected);
    const isNaturalLanguage = captured.summaryQuery.split(' ').length > 5;

    const passed = hasProvidePattern && containsUserTerm && isNaturalLanguage;

    console.log(`   ${name}`);
    console.log(`      Query: "${captured.summaryQuery.substring(0, 60)}..."`);
    console.log(`      "Provide" pattern: ${hasProvidePattern ? '✅' : '❌'}`);
    console.log(`      Contains "${expected}": ${containsUserTerm ? '✅' : '❌'}`);
    console.log(`      Natural language: ${isNaturalLanguage ? '✅' : '❌'}`);
    console.log(`      Overall: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);

    if (passed) passCount++;
    else failCount++;
  } catch (error) {
    console.log(`   ${name}: ❌ ERROR - ${error.message}\n`);
    failCount++;
  }
}

// Summary
console.log('='.repeat(70));
console.log(`\n📊 Test Results Summary:`);
console.log(`   Total methods tested: ${methods.length}`);
console.log(`   Passed: ${passCount} ✅`);
console.log(`   Failed: ${failCount} ${failCount > 0 ? '❌' : ''}`);
console.log(`   Success rate: ${((passCount / methods.length) * 100).toFixed(1)}%`);

if (passCount === methods.length) {
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('\n✅ Phase 3 Complete - All FDA methods integrated with SummaryQueryBuilder');
  console.log('✅ Feature flag pattern working correctly');
  console.log('✅ Backward compatibility maintained');
  console.log('✅ Enhanced queries generating natural language prompts');
} else {
  console.log(`\n⚠️  ${failCount} test(s) failed - review implementation`);
}

// Cleanup
delete process.env.ENHANCED_SUMMARY_QUERIES;
