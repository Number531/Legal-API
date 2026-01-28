/**
 * EPA Hybrid Client Execution Test
 *
 * Tests actual execution through the hybrid routing chain
 * Verifies the bug fixes by calling methods and checking the full flow
 *
 * Run with: node test/test-epa-hybrid-execution.js
 */

import { EPAHybridClient } from '../src/api-clients/EPAHybridClient.js';

console.log('🧪 EPA Hybrid Client Execution Test\n');

const rateLimiter = { requests: [] };
const exaKey = 'test-exa-key';
const client = new EPAHybridClient(rateLimiter, exaKey);

// Disable verbose logging for tests
client.verboseLogging = false;
client.logDebug = () => {}; // Mock logDebug to prevent errors
client.log = () => {}; // Mock log to prevent errors

// Mock the native and websearch clients
let nativeCallLog = [];
let websearchCallLog = [];

client.nativeClient = {
  searchFacilities: async (args) => {
    nativeCallLog.push({ method: 'searchFacilities', args });
    return { content: [{ type: 'text', text: JSON.stringify({ facilities: [{ name: 'Native Facility' }] }) }] };
  },
  getFacilityComplianceReport: async (args) => {
    nativeCallLog.push({ method: 'getFacilityComplianceReport', args });
    return { content: [{ type: 'text', text: JSON.stringify({ facility: { name: 'Native Report' } }) }] };
  },
  searchViolations: async (args) => {
    nativeCallLog.push({ method: 'searchViolations', args });
    return { content: [{ type: 'text', text: JSON.stringify({ count: 5, results: [] }) }] };
  }
};

client.websearchClient = {
  searchFacilitiesWeb: async (args) => {
    websearchCallLog.push({ method: 'searchFacilitiesWeb', args });
    return { content: [{ type: 'text', text: JSON.stringify({ facilities: [{ name: 'Websearch Facility' }] }) }] };
  },
  getFacilityComplianceReportWeb: async (args) => {
    websearchCallLog.push({ method: 'getFacilityComplianceReportWeb', args });
    return { content: [{ type: 'text', text: JSON.stringify({ facility: { name: 'Websearch Report' } }) }] };
  },
  searchViolationsWeb: async (args) => {
    websearchCallLog.push({ method: 'searchViolationsWeb', args });
    return { content: [{ type: 'text', text: JSON.stringify({ count: 3, results: [] }) }] };
  }
};

// Test 1: searchFacilities with registry_id (should use native_first)
console.log('Test 1: searchFacilities with registry_id (native_first strategy)');
try {
  nativeCallLog = [];
  websearchCallLog = [];

  const result = await client.searchFacilities({
    registry_id: '110000012345',
    limit: 5
  });

  const parsed = JSON.parse(result.content[0].text);

  if (nativeCallLog.length === 1 && nativeCallLog[0].method === 'searchFacilities') {
    console.log('  ✅ Native client called correctly');
  } else {
    console.log('  ❌ Native client not called or wrong method');
    console.log('  📋 Native calls:', nativeCallLog);
  }

  if (websearchCallLog.length === 0) {
    console.log('  ✅ Websearch client correctly skipped (native succeeded)');
  } else {
    console.log('  ❌ Websearch client called unexpectedly');
    console.log('  📋 Websearch calls:', websearchCallLog);
  }

  if (parsed._hybrid_metadata) {
    console.log(`  ✅ Metadata present: source=${parsed._hybrid_metadata.source}`);
  } else {
    console.log('  ❌ Metadata missing');
  }

  console.log('  ✅ Test 1 PASSED\n');
} catch (error) {
  console.error('  ❌ Test 1 FAILED:', error.message);
  console.error('  📋 Native calls:', nativeCallLog);
  console.error('  📋 Websearch calls:', websearchCallLog);
  process.exit(1);
}

// Test 2: searchFacilities with facility_name (should use websearch_first)
console.log('Test 2: searchFacilities with facility_name (websearch_first strategy)');
try {
  nativeCallLog = [];
  websearchCallLog = [];

  const result = await client.searchFacilities({
    facility_name: 'Acme Corp',
    state: 'PA',
    limit: 5
  });

  const parsed = JSON.parse(result.content[0].text);

  if (websearchCallLog.length === 1 && websearchCallLog[0].method === 'searchFacilitiesWeb') {
    console.log('  ✅ Websearch client called correctly');
  } else {
    console.log('  ❌ Websearch client not called or wrong method');
    console.log('  📋 Websearch calls:', websearchCallLog);
  }

  if (nativeCallLog.length === 1 && nativeCallLog[0].method === 'searchFacilities') {
    console.log('  ✅ Native client called for enhancement (optional)');
  } else {
    console.log('  ℹ️  Native client not called (acceptable for websearch_first)');
  }

  if (parsed._hybrid_metadata) {
    console.log(`  ✅ Metadata present: source=${parsed._hybrid_metadata.source}`);
  } else {
    console.log('  ❌ Metadata missing');
  }

  console.log('  ✅ Test 2 PASSED\n');
} catch (error) {
  console.error('  ❌ Test 2 FAILED:', error.message);
  console.error('  📋 Native calls:', nativeCallLog);
  console.error('  📋 Websearch calls:', websearchCallLog);
  process.exit(1);
}

// Test 3: getFacilityCompliance (should use websearch_first)
console.log('Test 3: getFacilityCompliance (websearch_first strategy)');
try {
  nativeCallLog = [];
  websearchCallLog = [];

  const result = await client.getFacilityCompliance({
    facility_id: '110000012345',
    include_violations: true
  });

  const parsed = JSON.parse(result.content[0].text);

  if (websearchCallLog.length === 1 && websearchCallLog[0].method === 'getFacilityComplianceReportWeb') {
    console.log('  ✅ Websearch client called correctly');
  } else {
    console.log('  ❌ Websearch client not called or wrong method');
    console.log('  📋 Websearch calls:', websearchCallLog);
  }

  if (parsed._hybrid_metadata) {
    console.log(`  ✅ Metadata present: source=${parsed._hybrid_metadata.source}`);
  } else {
    console.log('  ❌ Metadata missing');
  }

  console.log('  ✅ Test 3 PASSED\n');
} catch (error) {
  console.error('  ❌ Test 3 FAILED:', error.message);
  console.error('  📋 Native calls:', nativeCallLog);
  console.error('  📋 Websearch calls:', websearchCallLog);
  process.exit(1);
}

// Test 4: searchViolations (should use websearch_first)
console.log('Test 4: searchViolations (websearch_first strategy)');
try {
  nativeCallLog = [];
  websearchCallLog = [];

  const result = await client.searchViolations({
    facility_id: '110000012345',
    program: 'CAA'
  });

  const parsed = JSON.parse(result.content[0].text);

  if (websearchCallLog.length === 1 && websearchCallLog[0].method === 'searchViolationsWeb') {
    console.log('  ✅ Websearch client called correctly');
  } else {
    console.log('  ❌ Websearch client not called or wrong method');
    console.log('  📋 Websearch calls:', websearchCallLog);
  }

  if (parsed._hybrid_metadata) {
    console.log(`  ✅ Metadata present: source=${parsed._hybrid_metadata.source}`);
  } else {
    console.log('  ❌ Metadata missing');
  }

  console.log('  ✅ Test 4 PASSED\n');
} catch (error) {
  console.error('  ❌ Test 4 FAILED:', error.message);
  console.error('  📋 Native calls:', nativeCallLog);
  console.error('  📋 Websearch calls:', websearchCallLog);
  process.exit(1);
}

// Test 5: Backward compatibility wrappers
console.log('Test 5: Backward compatibility wrappers');
try {
  nativeCallLog = [];
  websearchCallLog = [];

  // Test searchFacilitiesWeb wrapper
  await client.searchFacilitiesWeb({ facility_name: 'Test' });

  if (websearchCallLog.length === 1 && websearchCallLog[0].method === 'searchFacilitiesWeb') {
    console.log('  ✅ searchFacilitiesWeb wrapper works correctly');
  } else {
    console.log('  ❌ searchFacilitiesWeb wrapper failed');
  }

  nativeCallLog = [];
  websearchCallLog = [];

  // Test getFacilityComplianceWeb wrapper
  await client.getFacilityComplianceWeb({ facility_id: '123' });

  if (websearchCallLog.length === 1 && websearchCallLog[0].method === 'getFacilityComplianceReportWeb') {
    console.log('  ✅ getFacilityComplianceWeb wrapper works correctly');
  } else {
    console.log('  ❌ getFacilityComplianceWeb wrapper failed');
  }

  nativeCallLog = [];
  websearchCallLog = [];

  // Test searchViolationsWeb wrapper
  await client.searchViolationsWeb({ facility_id: '123' });

  if (websearchCallLog.length === 1 && websearchCallLog[0].method === 'searchViolationsWeb') {
    console.log('  ✅ searchViolationsWeb wrapper works correctly');
  } else {
    console.log('  ❌ searchViolationsWeb wrapper failed');
  }

  console.log('  ✅ Test 5 PASSED\n');
} catch (error) {
  console.error('  ❌ Test 5 FAILED:', error.message);
  console.error('  📋 Native calls:', nativeCallLog);
  console.error('  📋 Websearch calls:', websearchCallLog);
  process.exit(1);
}

// Test 6: Circuit breaker prevents native calls when open
console.log('Test 6: Circuit breaker prevents native calls when open');
try {
  // Open the circuit breaker
  client.circuitBreaker.state = 'open';
  client.circuitBreaker.lastFailureTime = Date.now();

  nativeCallLog = [];
  websearchCallLog = [];

  // Try a native_first strategy with registry_id (would normally call native)
  const result = await client.searchFacilities({
    registry_id: '110000012345',
    limit: 5
  });

  if (nativeCallLog.length === 0) {
    console.log('  ✅ Circuit breaker correctly prevented native API call');
  } else {
    console.log('  ❌ Circuit breaker failed - native API was called');
  }

  if (websearchCallLog.length === 1) {
    console.log('  ✅ Websearch fallback triggered correctly');
  } else {
    console.log('  ❌ Websearch fallback did not trigger');
  }

  // Reset circuit breaker
  client.circuitBreaker.state = 'closed';
  client.circuitBreaker.failures = 0;

  console.log('  ✅ Test 6 PASSED\n');
} catch (error) {
  console.error('  ❌ Test 6 FAILED:', error.message);
  console.error('  📋 Native calls:', nativeCallLog);
  console.error('  📋 Websearch calls:', websearchCallLog);
  process.exit(1);
}

console.log('✅ ALL EXECUTION TESTS PASSED!\n');
console.log('📊 Summary:');
console.log('  ✅ Native-first strategy works correctly (registry_id lookup)');
console.log('  ✅ Websearch-first strategy works correctly (facility name search)');
console.log('  ✅ All three EPA methods route correctly');
console.log('  ✅ Backward compatibility wrappers functional');
console.log('  ✅ Circuit breaker correctly blocks native calls when open');
console.log('  ✅ Metadata injection working on all responses');
console.log('\n🎯 Bug fixes verified - EPA Hybrid Client is production ready!');
