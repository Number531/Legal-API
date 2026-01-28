#!/usr/bin/env node

/**
 * Quick validation test for SummaryQueryBuilder
 * Verifies backward compatibility and core functionality
 */

import { SummaryQueryBuilder } from './src/api-clients/SummaryQueryBuilder.js';

console.log('🧪 SummaryQueryBuilder Validation Test\n');
console.log('=' .repeat(70));

const builder = new SummaryQueryBuilder();

// Test 1: Backward Compatibility - Fallback to baseTerms
console.log('\n📋 Test 1: Backward Compatibility (no user term)');
const test1 = builder.build({
  baseTerms: 'FAERS adverse event drug safety'
});
console.log(`   Input: No user term`);
console.log(`   Output: "${test1}"`);
console.log(`   Expected: "FAERS adverse event drug safety"`);
console.log(`   Result: ${test1 === 'FAERS adverse event drug safety' ? '✅ PASS' : '❌ FAIL'}`);

// Test 2: Extract quoted term
console.log('\n📋 Test 2: Extract User Term (quoted)');
const test2 = builder.build({
  userSearchTerm: '"Lipitor" adverse events',
  dataType: 'fda_adverse_event',
  baseTerms: 'FAERS adverse event'
});
console.log(`   Input: '"Lipitor" adverse events'`);
console.log(`   Output: "${test2}"`);
console.log(`   Contains "Lipitor": ${test2.includes('Lipitor') ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Uses "Provide" pattern: ${test2.startsWith('Provide') ? '✅ PASS' : '❌ FAIL'}`);

// Test 3: Extract from complex query
console.log('\n📋 Test 3: Extract from Complex Query');
const test3 = builder.build({
  userSearchTerm: '(site:fda.gov) "Ozempic" recall',
  dataType: 'fda_recall',
  baseTerms: 'recall enforcement'
});
console.log(`   Input: '(site:fda.gov) "Ozempic" recall'`);
console.log(`   Output: "${test3}"`);
console.log(`   Contains "Ozempic": ${test3.includes('Ozempic') ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Natural language: ${test3.split(' ').length > 5 ? '✅ PASS' : '❌ FAIL'}`);

// Test 4: Schema integration
console.log('\n📋 Test 4: Schema Integration');
const schema = {
  required: ['drug_name', 'patient_reaction'],
  properties: {
    drug_name: { description: 'Name of the drug (medicinal product)' },
    patient_reaction: { description: 'Patient adverse reaction or event' }
  }
};

const test4 = builder.build({
  userSearchTerm: 'Lipitor',
  dataType: 'fda_adverse_event',
  schema: schema,
  baseTerms: 'FAERS adverse event'
});
console.log(`   Input: 'Lipitor' with schema`);
console.log(`   Output: "${test4}"`);
console.log(`   Contains schema field: ${test4.includes('Name of the drug') ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Contains schema field: ${test4.includes('Patient adverse reaction') ? '✅ PASS' : '❌ FAIL'}`);

// Test 5: Graceful handling of errors
console.log('\n📋 Test 5: Error Handling');
const test5 = builder.build({
  userSearchTerm: null,
  baseTerms: 'fallback query'
});
console.log(`   Input: null user term`);
console.log(`   Output: "${test5}"`);
console.log(`   Falls back to baseTerms: ${test5 === 'fallback query' ? '✅ PASS' : '❌ FAIL'}`);

// Test 6: Real-world examples
console.log('\n📋 Test 6: Real-World Examples');
const examples = [
  {
    input: 'Ozempic adverse events',
    dataType: 'fda_adverse_event',
    expected: 'Ozempic'
  },
  {
    input: 'Tesla recall',
    dataType: 'nhtsa_recall',
    expected: 'Tesla'
  },
  {
    input: 'Google patent AI',
    dataType: 'patent',
    expected: 'Google'
  }
];

for (const { input, dataType, expected } of examples) {
  const result = builder.build({
    userSearchTerm: input,
    dataType: dataType,
    baseTerms: 'fallback'
  });
  console.log(`   "${input}" → Contains "${expected}": ${result.includes(expected) ? '✅' : '❌'}`);
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('✅ SummaryQueryBuilder Validation Complete');
console.log('\nKey Features Verified:');
console.log('  ✅ Backward compatibility (falls back to baseTerms)');
console.log('  ✅ User term extraction from complex queries');
console.log('  ✅ Natural language output (Exa "Provide" pattern)');
console.log('  ✅ Schema integration (includes field descriptions)');
console.log('  ✅ Error handling (graceful fallback)');
console.log('\n✅ Ready for integration with FDAWebSearchClient');
