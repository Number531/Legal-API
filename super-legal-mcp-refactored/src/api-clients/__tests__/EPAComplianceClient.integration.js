#!/usr/bin/env node

/**
 * Test EPA Facility Search Fix
 * Verifies that broad searches are automatically filtered
 */

import { EPAComplianceClient } from '../src/api-clients/EPAComplianceClient.js';

// Mock rate limiter since it's not needed for testing
const rateLimiter = null;
const epaClient = new EPAComplianceClient(rateLimiter);

console.log('🧪 Testing EPA Facility Search Fix\n');

// Test 1: Broad search that should be auto-filtered
console.log('Test 1: Broad search (state only) - should auto-filter');
try {
  const result1 = await epaClient.searchFacilities({
    state: 'PA',
    company_name: 'chemical',
    compliance_status: 'violation'
  });
  
  const data = JSON.parse(result1.content[0].text);
  console.log('✅ Success! Auto-filtered search returned:', data.facilities.length, 'facilities');
  console.log('   First facility:', data.facilities[0]?.name);
} catch (error) {
  console.log('❌ Failed:', error.message);
}

console.log('\n---\n');

// Test 2: Specific search that shouldn't need filtering
console.log('Test 2: Specific search (with city) - no auto-filter needed');
try {
  const result2 = await epaClient.searchFacilities({
    state: 'PA',
    city: 'Pittsburgh',
    company_name: 'chemical'
  });
  
  const data = JSON.parse(result2.content[0].text);
  console.log('✅ Success! Specific search returned:', data.facilities.length, 'facilities');
} catch (error) {
  console.log('❌ Failed:', error.message);
}

console.log('\n---\n');

// Test 3: Very specific search with facility name
console.log('Test 3: Very specific search (facility name)');
try {
  const result3 = await epaClient.searchFacilities({
    facility_name: 'BASF',
    state: 'PA'
  });
  
  const data = JSON.parse(result3.content[0].text);
  console.log('✅ Success! Facility search returned:', data.facilities.length, 'facilities');
  if (data.facilities.length > 0) {
    console.log('   Facilities found:');
    data.facilities.forEach(f => {
      console.log(`   - ${f.name} in ${f.location.city}, ${f.location.state}`);
    });
  }
} catch (error) {
  console.log('❌ Failed:', error.message);
}

console.log('\n🎯 Test complete!');
process.exit(0);