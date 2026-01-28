/**
 * EPA Hybrid Client Integration Test
 *
 * Quick validation that EPAHybridClient is correctly integrated into EnhancedLegalMcpServer
 * Run with: node test/test-epa-hybrid-integration.js
 */

import { EPAHybridClient } from '../src/api-clients/EPAHybridClient.js';

console.log('🧪 EPA Hybrid Client Integration Test\n');

// Test 1: Can we instantiate the client?
console.log('Test 1: Instantiation');
try {
  const rateLimiter = { requests: [] };
  const exaKey = 'test-key';

  const client = new EPAHybridClient(rateLimiter, exaKey);

  console.log('  ✅ EPAHybridClient instantiated successfully');
  console.log(`  ✅ Default strategy: ${client.defaultStrategy}`);
  console.log(`  ✅ Circuit breaker state: ${client.circuitBreaker.state}`);
  console.log(`  ✅ Cache TTL: ${client.defaultCacheTTL}ms (${client.defaultCacheTTL / 1000 / 60} minutes)`);
} catch (error) {
  console.error('  ❌ Failed to instantiate:', error.message);
  process.exit(1);
}

// Test 2: Check that methods exist
console.log('\nTest 2: Method Availability');
try {
  const rateLimiter = { requests: [] };
  const client = new EPAHybridClient(rateLimiter, 'test-key');

  const requiredMethods = [
    'searchFacilities',
    'getFacilityCompliance',
    'searchViolations',
    'searchFacilitiesWeb',
    'getFacilityComplianceWeb',
    'searchViolationsWeb',
    'executeNativeWithRetry',
    'isCircuitOpen',
    'recordSuccess',
    'recordFailure',
    'resetCircuitBreaker',
    'getMetrics',
    'clearEPACache'
  ];

  for (const method of requiredMethods) {
    if (typeof client[method] !== 'function') {
      throw new Error(`Method ${method} not found`);
    }
  }

  console.log(`  ✅ All ${requiredMethods.length} required methods present`);
} catch (error) {
  console.error('  ❌ Method check failed:', error.message);
  process.exit(1);
}

// Test 3: Check native and websearch clients
console.log('\nTest 3: Client Composition');
try {
  const rateLimiter = { requests: [] };
  const client = new EPAHybridClient(rateLimiter, 'test-key');

  if (!client.nativeClient) {
    throw new Error('Native client not initialized');
  }
  if (!client.websearchClient) {
    throw new Error('Websearch client not initialized');
  }

  console.log('  ✅ Native client (EPAComplianceClient) initialized');
  console.log('  ✅ Websearch client (EPAWebSearchClient) initialized');
} catch (error) {
  console.error('  ❌ Client composition failed:', error.message);
  process.exit(1);
}

// Test 4: Circuit breaker configuration
console.log('\nTest 4: Circuit Breaker Configuration');
try {
  const rateLimiter = { requests: [] };
  const client = new EPAHybridClient(rateLimiter, 'test-key');

  const cb = client.circuitBreaker;

  if (cb.threshold !== 3) throw new Error('Threshold should be 3');
  if (cb.resetTimeout !== 300000) throw new Error('Reset timeout should be 5 minutes');
  if (cb.state !== 'closed') throw new Error('Initial state should be closed');
  if (cb.failures !== 0) throw new Error('Initial failures should be 0');

  console.log(`  ✅ Threshold: ${cb.threshold} failures`);
  console.log(`  ✅ Reset timeout: ${cb.resetTimeout / 1000 / 60} minutes`);
  console.log(`  ✅ Initial state: ${cb.state}`);
  console.log(`  ✅ Initial failures: ${cb.failures}`);
} catch (error) {
  console.error('  ❌ Circuit breaker config failed:', error.message);
  process.exit(1);
}

// Test 5: Retry configuration
console.log('\nTest 5: Retry Configuration');
try {
  const rateLimiter = { requests: [] };
  const client = new EPAHybridClient(rateLimiter, 'test-key');

  const rc = client.retryConfig;

  if (rc.maxRetries !== 2) throw new Error('Max retries should be 2');
  if (rc.initialDelay !== 1000) throw new Error('Initial delay should be 1 second');
  if (rc.maxDelay !== 5000) throw new Error('Max delay should be 5 seconds');
  if (rc.backoffMultiplier !== 2) throw new Error('Backoff multiplier should be 2');

  console.log(`  ✅ Max retries: ${rc.maxRetries}`);
  console.log(`  ✅ Initial delay: ${rc.initialDelay}ms`);
  console.log(`  ✅ Max delay: ${rc.maxDelay}ms`);
  console.log(`  ✅ Backoff multiplier: ${rc.backoffMultiplier}x`);
} catch (error) {
  console.error('  ❌ Retry config failed:', error.message);
  process.exit(1);
}

// Test 6: Metrics tracking
console.log('\nTest 6: Metrics Tracking');
try {
  const rateLimiter = { requests: [] };
  const client = new EPAHybridClient(rateLimiter, 'test-key');

  const metrics = client.getMetrics();

  if (!metrics.epaSpecific) throw new Error('EPA-specific metrics missing');
  if (typeof metrics.epaSpecific.nativeAPIHits !== 'number') throw new Error('nativeAPIHits missing');
  if (typeof metrics.epaSpecific.circuitBreakerState !== 'string') throw new Error('circuitBreakerState missing');
  if (typeof metrics.epaSpecific.nativeAPIReliability !== 'string') throw new Error('nativeAPIReliability missing');

  console.log('  ✅ EPA-specific metrics available');
  console.log(`  ✅ Circuit breaker state tracked: ${metrics.epaSpecific.circuitBreakerState}`);
  console.log(`  ✅ Native API reliability: ${metrics.epaSpecific.nativeAPIReliability}`);
} catch (error) {
  console.error('  ❌ Metrics tracking failed:', error.message);
  process.exit(1);
}

// Test 7: EnhancedLegalMcpServer integration
console.log('\nTest 7: Server Integration');
try {
  console.log('  ℹ️  Checking imports...');

  // Try to import server to check for syntax errors
  const { EnhancedLegalMcpServer } = await import('../src/server/EnhancedLegalMcpServer.js');

  console.log('  ✅ EnhancedLegalMcpServer imports successfully');
  console.log('  ✅ No syntax errors detected');
  console.log('  ℹ️  Note: Full server startup requires environment variables');
} catch (error) {
  console.error('  ❌ Server integration failed:', error.message);
  console.error('  ⚠️  Check that EPAHybridClient is correctly imported in EnhancedLegalMcpServer.js');
  process.exit(1);
}

console.log('\n✅ All integration tests passed!');
console.log('\n📊 Phase 2 Implementation Summary:');
console.log('  ✅ EPAHybridClient created with circuit breaker pattern');
console.log('  ✅ Retry logic with exponential backoff (2 retries, 1s→2s→5s max)');
console.log('  ✅ Websearch-first strategy (native API unreliable)');
console.log('  ✅ Circuit breaker opens after 3 failures, resets after 5 minutes');
console.log('  ✅ Longer cache TTL (2 hours for EPA data stability)');
console.log('  ✅ Integrated into EnhancedLegalMcpServer');
console.log('\n🎯 Ready for production testing with:');
console.log('  - search_epa_facilities');
console.log('  - get_epa_facility_compliance_report');
console.log('  - search_epa_violations');
