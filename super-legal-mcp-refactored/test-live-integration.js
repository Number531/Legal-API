#!/usr/bin/env node

/**
 * Test Live Integration with .env file
 */

import { config } from 'dotenv';
config(); // Load .env file

console.log('🚀 Testing Live Integration of NHTSA Improvements');
console.log('================================================\n');

console.log('📋 Environment Check:');
console.log(`   EXA_API_KEY: ${process.env.EXA_API_KEY ? '✅ Found' : '❌ Missing'}`);
console.log(`   NHTSA_PERMISSIVE_MODE: ${process.env.NHTSA_PERMISSIVE_MODE || 'Not Set'}`);
console.log('');

if (!process.env.EXA_API_KEY) {
  console.log('❌ Cannot test without EXA_API_KEY');
  process.exit(1);
}

try {
  const { NHTSAWebSearchClient } = await import('./src/api-clients/NHTSAWebSearchClient.js');

  const mockRateLimiter = {
    enforce: async () => { await new Promise(resolve => setTimeout(resolve, 100)); }
  };

  const client = new NHTSAWebSearchClient(mockRateLimiter, process.env.EXA_API_KEY);

  console.log('🎯 Testing Live Configuration:');
  console.log(`   Permissive Mode Active: ${process.env.NHTSA_PERMISSIVE_MODE === 'true' ? '✅ YES' : '❌ NO'}`);
  console.log('');

  // Quick test to verify improvements are active
  console.log('🧪 Running Quick Recall Test...');
  const result = await client.getRecallsByMakeModelYearWeb({
    make: 'Honda',
    model: 'Civic',
    year: 2023,
    include_snippet: true
  });

  const data = JSON.parse(result.content[0].text);

  console.log('📊 Results:');
  console.log(`   Total Results: ${data.total_results}`);
  console.log(`   Campaign ID Coverage: ${data.quality_summary?.campaign_id_coverage || '0%'}`);
  console.log(`   Vehicle Info Coverage: ${data.quality_summary?.vehicle_info_coverage || '0%'}`);
  console.log(`   NHTSA Domain Coverage: ${data.quality_summary?.nhtsa_domain_coverage || '0%'}`);

  // Check if improvements are working
  const campaignIdCoverage = parseFloat((data.quality_summary?.campaign_id_coverage || '0%').replace('%', ''));
  const vehicleInfoCoverage = parseFloat((data.quality_summary?.vehicle_info_coverage || '0%').replace('%', ''));

  console.log('\n🎯 Live Integration Status:');

  if (campaignIdCoverage >= 60) {
    console.log('   ✅ Campaign ID Extraction: ACTIVE & WORKING');
  } else if (campaignIdCoverage > 0) {
    console.log('   ⚠️  Campaign ID Extraction: PARTIALLY WORKING');
  } else {
    console.log('   ❌ Campaign ID Extraction: NOT ACTIVE (Check NHTSA_PERMISSIVE_MODE)');
  }

  if (vehicleInfoCoverage > 0) {
    console.log('   ✅ Vehicle Info Extraction: ACTIVE & WORKING');
  } else {
    console.log('   ❌ Vehicle Info Extraction: NOT ACTIVE');
  }

  // Overall status
  console.log('\n🚀 LIVE DEPLOYMENT STATUS:');
  if (campaignIdCoverage >= 60 && vehicleInfoCoverage > 0) {
    console.log('   🎉 FULLY ACTIVE - All improvements are live and working!');
    console.log('   👥 Ready for production user traffic');
  } else if (process.env.NHTSA_PERMISSIVE_MODE !== 'true') {
    console.log('   ⚠️  IMPROVEMENTS NOT ACTIVE - Set NHTSA_PERMISSIVE_MODE=true in .env');
  } else {
    console.log('   🔧 PARTIALLY ACTIVE - Some improvements working, monitoring needed');
  }

  console.log('\n✅ Live integration test completed!');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}