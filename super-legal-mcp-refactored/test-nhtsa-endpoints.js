#!/usr/bin/env node

/**
 * NHTSA WebSearchClient Endpoint Testing Script
 * Tests all 6 endpoints to validate improvements in campaign ID and vehicle extraction
 */

import { NHTSAWebSearchClient } from './src/api-clients/NHTSAWebSearchClient.js';

// Mock rate limiter for testing
const mockRateLimiter = {
  enforce: async () => { await new Promise(resolve => setTimeout(resolve, 100)); }
};

async function testNHTSAEndpoints() {
  console.log('🚗 NHTSA WebSearchClient Endpoint Testing');
  console.log('==========================================\n');

  // Check API key availability
  if (!process.env.EXA_API_KEY) {
    console.log('❌ EXA_API_KEY environment variable not found');
    console.log('   This is required for NHTSA web searches.\n');
    return { error: 'Missing EXA_API_KEY' };
  }

  console.log('✅ EXA_API_KEY found');
  console.log(`   Key starts with: ${process.env.EXA_API_KEY.substring(0, 8)}...`);
  console.log('');

  let client;
  try {
    client = new NHTSAWebSearchClient(mockRateLimiter, process.env.EXA_API_KEY);
    console.log('✅ NHTSAWebSearchClient instantiated successfully\n');
  } catch (error) {
    console.log('❌ Failed to create NHTSAWebSearchClient:', error.message);
    return { error: error.message };
  }

  const testResults = {};

  // Test 1: VIN Decoder
  console.log('1️⃣ Testing decodeVinWeb...');
  try {
    const result1 = await client.decodeVinWeb({
      vin: '1HGBH41JXMN109186',
      include_snippet: true
    });

    const data1 = JSON.parse(result1.content[0].text);
    testResults.decodeVin = {
      status: 'SUCCESS',
      total_results: data1.total_results,
      campaign_id_coverage: data1.quality_summary?.campaign_id_coverage || '0%',
      vehicle_info_coverage: data1.quality_summary?.vehicle_info_coverage || '0%',
      nhtsa_domain_coverage: data1.quality_summary?.nhtsa_domain_coverage || '0%',
      high_confidence: data1.quality_summary?.high_confidence || 0,
      url_extractions: countURLExtractions(data1.results)
    };
    console.log(`   ✅ SUCCESS - ${data1.total_results} results`);
    console.log(`   Campaign ID Coverage: ${testResults.decodeVin.campaign_id_coverage}`);
    console.log(`   URL Vehicle Extractions: ${testResults.decodeVin.url_extractions}\n`);
  } catch (error) {
    testResults.decodeVin = { status: 'ERROR', error: error.message };
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  // Test 2: Models for Make
  console.log('2️⃣ Testing getModelsForMakeWeb...');
  try {
    const result2 = await client.getModelsForMakeWeb({
      make: 'Honda',
      year: 2023,
      include_snippet: true
    });

    const data2 = JSON.parse(result2.content[0].text);
    testResults.modelsForMake = {
      status: 'SUCCESS',
      total_results: data2.total_results,
      campaign_id_coverage: data2.quality_summary?.campaign_id_coverage || '0%',
      vehicle_info_coverage: data2.quality_summary?.vehicle_info_coverage || '0%',
      nhtsa_domain_coverage: data2.quality_summary?.nhtsa_domain_coverage || '0%',
      high_confidence: data2.quality_summary?.high_confidence || 0,
      url_extractions: countURLExtractions(data2.results)
    };
    console.log(`   ✅ SUCCESS - ${data2.total_results} results`);
    console.log(`   Campaign ID Coverage: ${testResults.modelsForMake.campaign_id_coverage}`);
    console.log(`   URL Vehicle Extractions: ${testResults.modelsForMake.url_extractions}\n`);
  } catch (error) {
    testResults.modelsForMake = { status: 'ERROR', error: error.message };
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  // Test 3: Recalls by VIN
  console.log('3️⃣ Testing getRecallsByVinWeb...');
  try {
    const result3 = await client.getRecallsByVinWeb({
      vin: '1HGBH41JXMN109186',
      include_snippet: true
    });

    const data3 = JSON.parse(result3.content[0].text);
    testResults.recallsByVin = {
      status: 'SUCCESS',
      total_results: data3.total_results,
      campaign_id_coverage: data3.quality_summary?.campaign_id_coverage || '0%',
      vehicle_info_coverage: data3.quality_summary?.vehicle_info_coverage || '0%',
      nhtsa_domain_coverage: data3.quality_summary?.nhtsa_domain_coverage || '0%',
      high_confidence: data3.quality_summary?.high_confidence || 0,
      url_extractions: countURLExtractions(data3.results),
      safety_critical: data3.quality_summary?.safety_critical_count || 0
    };
    console.log(`   ✅ SUCCESS - ${data3.total_results} results`);
    console.log(`   Campaign ID Coverage: ${testResults.recallsByVin.campaign_id_coverage}`);
    console.log(`   Safety Critical: ${testResults.recallsByVin.safety_critical}`);
    console.log(`   URL Vehicle Extractions: ${testResults.recallsByVin.url_extractions}\n`);
  } catch (error) {
    testResults.recallsByVin = { status: 'ERROR', error: error.message };
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  // Test 4: Recalls by Make/Model/Year
  console.log('4️⃣ Testing getRecallsByMakeModelYearWeb...');
  try {
    const result4 = await client.getRecallsByMakeModelYearWeb({
      make: 'Honda',
      model: 'Civic',
      year: 2023,
      include_snippet: true
    });

    const data4 = JSON.parse(result4.content[0].text);
    testResults.recallsByMMY = {
      status: 'SUCCESS',
      total_results: data4.total_results,
      campaign_id_coverage: data4.quality_summary?.campaign_id_coverage || '0%',
      vehicle_info_coverage: data4.quality_summary?.vehicle_info_coverage || '0%',
      nhtsa_domain_coverage: data4.quality_summary?.nhtsa_domain_coverage || '0%',
      high_confidence: data4.quality_summary?.high_confidence || 0,
      url_extractions: countURLExtractions(data4.results),
      safety_critical: data4.quality_summary?.safety_critical_count || 0
    };
    console.log(`   ✅ SUCCESS - ${data4.total_results} results`);
    console.log(`   Campaign ID Coverage: ${testResults.recallsByMMY.campaign_id_coverage}`);
    console.log(`   Vehicle Info Coverage: ${testResults.recallsByMMY.vehicle_info_coverage}`);
    console.log(`   URL Vehicle Extractions: ${testResults.recallsByMMY.url_extractions}\n`);
  } catch (error) {
    testResults.recallsByMMY = { status: 'ERROR', error: error.message };
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  // Test 5: Search Complaints
  console.log('5️⃣ Testing searchComplaintsWeb...');
  try {
    const result5 = await client.searchComplaintsWeb({
      make: 'Honda',
      model: 'Civic',
      year: 2021,
      include_snippet: true,
      limit: 10
    });

    const data5 = JSON.parse(result5.content[0].text);
    testResults.complaints = {
      status: 'SUCCESS',
      total_results: data5.total_results,
      campaign_id_coverage: data5.quality_summary?.campaign_id_coverage || '0%',
      vehicle_info_coverage: data5.quality_summary?.vehicle_info_coverage || '0%',
      nhtsa_domain_coverage: data5.quality_summary?.nhtsa_domain_coverage || '0%',
      high_confidence: data5.quality_summary?.high_confidence || 0,
      url_extractions: countURLExtractions(data5.results),
      safety_critical: data5.quality_summary?.safety_critical_count || 0
    };
    console.log(`   ✅ SUCCESS - ${data5.total_results} results`);
    console.log(`   Campaign ID Coverage: ${testResults.complaints.campaign_id_coverage}`);
    console.log(`   URL Vehicle Extractions: ${testResults.complaints.url_extractions}\n`);
  } catch (error) {
    testResults.complaints = { status: 'ERROR', error: error.message };
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  // Test 6: Safety Ratings
  console.log('6️⃣ Testing getSafetyRatingsWeb...');
  try {
    const result6 = await client.getSafetyRatingsWeb({
      make: 'Honda',
      model: 'Civic',
      year: 2023,
      include_snippet: true
    });

    const data6 = JSON.parse(result6.content[0].text);
    testResults.safetyRatings = {
      status: 'SUCCESS',
      total_results: data6.total_results,
      campaign_id_coverage: data6.quality_summary?.campaign_id_coverage || '0%',
      vehicle_info_coverage: data6.quality_summary?.vehicle_info_coverage || '0%',
      nhtsa_domain_coverage: data6.quality_summary?.nhtsa_domain_coverage || '0%',
      high_confidence: data6.quality_summary?.high_confidence || 0,
      url_extractions: countURLExtractions(data6.results)
    };
    console.log(`   ✅ SUCCESS - ${data6.total_results} results`);
    console.log(`   Campaign ID Coverage: ${testResults.safetyRatings.campaign_id_coverage}`);
    console.log(`   Vehicle Info Coverage: ${testResults.safetyRatings.vehicle_info_coverage}`);
    console.log(`   URL Vehicle Extractions: ${testResults.safetyRatings.url_extractions}\n`);
  } catch (error) {
    testResults.safetyRatings = { status: 'ERROR', error: error.message };
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  // Generate Summary Report
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('========================\n');

  const successfulTests = Object.values(testResults).filter(r => r.status === 'SUCCESS').length;
  const totalTests = Object.keys(testResults).length;

  console.log(`✅ Successful Tests: ${successfulTests}/${totalTests}\n`);

  if (successfulTests > 0) {
    // Campaign ID Coverage Analysis
    const campaignIdCoverages = Object.values(testResults)
      .filter(r => r.status === 'SUCCESS')
      .map(r => parseFloat(r.campaign_id_coverage.replace('%', '')));

    const avgCampaignId = campaignIdCoverages.length > 0
      ? (campaignIdCoverages.reduce((a, b) => a + b, 0) / campaignIdCoverages.length).toFixed(1)
      : 0;

    // Vehicle Info Coverage Analysis
    const vehicleInfoCoverages = Object.values(testResults)
      .filter(r => r.status === 'SUCCESS')
      .map(r => parseFloat(r.vehicle_info_coverage.replace('%', '')));

    const avgVehicleInfo = vehicleInfoCoverages.length > 0
      ? (vehicleInfoCoverages.reduce((a, b) => a + b, 0) / vehicleInfoCoverages.length).toFixed(1)
      : 0;

    // URL Extraction Analysis
    const totalURLExtractions = Object.values(testResults)
      .filter(r => r.status === 'SUCCESS')
      .reduce((sum, r) => sum + (r.url_extractions || 0), 0);

    console.log('🎯 KEY METRICS:');
    console.log(`   Average Campaign ID Coverage: ${avgCampaignId}% (Target: 60-80%)`);
    console.log(`   Average Vehicle Info Coverage: ${avgVehicleInfo}% (NEW CAPABILITY)`);
    console.log(`   Total URL Vehicle Extractions: ${totalURLExtractions} (NEW CAPABILITY)`);

    // Domain Coverage
    const nhtsaDomainCoverages = Object.values(testResults)
      .filter(r => r.status === 'SUCCESS')
      .map(r => parseFloat(r.nhtsa_domain_coverage.replace('%', '')));

    const avgDomainCoverage = nhtsaDomainCoverages.length > 0
      ? (nhtsaDomainCoverages.reduce((a, b) => a + b, 0) / nhtsaDomainCoverages.length).toFixed(1)
      : 0;

    console.log(`   Average NHTSA Domain Coverage: ${avgDomainCoverage}%\n`);

    // Detailed Results Table
    console.log('📈 DETAILED RESULTS:');
    console.log('┌─────────────────────┬─────────┬─────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ Endpoint            │ Status  │ Results │ Campaign ID │ Vehicle Info│ URL Extract │');
    console.log('├─────────────────────┼─────────┼─────────┼─────────────┼─────────────┼─────────────┤');

    const endpoints = [
      ['decodeVin', 'VIN Decoder'],
      ['modelsForMake', 'Models for Make'],
      ['recallsByVin', 'Recalls by VIN'],
      ['recallsByMMY', 'Recalls by MMY'],
      ['complaints', 'Search Complaints'],
      ['safetyRatings', 'Safety Ratings']
    ];

    endpoints.forEach(([key, name]) => {
      const result = testResults[key];
      if (result) {
        const status = result.status === 'SUCCESS' ? '   ✅   ' : '   ❌   ';
        const results = result.total_results ? result.total_results.toString().padStart(3) : ' - ';
        const campaignId = result.campaign_id_coverage ? result.campaign_id_coverage.padStart(9) : '    -    ';
        const vehicleInfo = result.vehicle_info_coverage ? result.vehicle_info_coverage.padStart(9) : '    -    ';
        const urlExtract = (result.url_extractions || 0).toString().padStart(9);

        console.log(`│ ${name.padEnd(19)} │${status}│   ${results}   │   ${campaignId}   │   ${vehicleInfo}   │   ${urlExtract}   │`);
      }
    });

    console.log('└─────────────────────┴─────────┴─────────┴─────────────┴─────────────┴─────────────┘\n');
  }

  // Error Analysis
  const errorTests = Object.entries(testResults).filter(([key, result]) => result.status === 'ERROR');
  if (errorTests.length > 0) {
    console.log('⚠️  ERRORS ENCOUNTERED:');
    errorTests.forEach(([endpoint, result]) => {
      console.log(`   ${endpoint}: ${result.error}`);
    });
    console.log();
  }

  // Recommendations
  console.log('💡 RECOMMENDATIONS:');
  if (avgCampaignId < 30) {
    console.log('   🔧 Campaign ID extraction still needs improvement (< 30% average)');
  } else if (avgCampaignId >= 60) {
    console.log('   ✨ Excellent campaign ID extraction improvement!');
  } else {
    console.log('   📈 Campaign ID extraction showing good improvement');
  }

  if (totalURLExtractions > 0) {
    console.log('   ✨ URL vehicle extraction is working - new capability successful!');
  } else {
    console.log('   🔧 URL vehicle extraction needs investigation');
  }

  if (errorTests.length > 0) {
    console.log('   🐛 Critical errors need immediate attention');
  }

  return testResults;
}

function countURLExtractions(results) {
  if (!results || !Array.isArray(results)) return 0;

  return results.filter(result => {
    // Look for URL-based vehicle extraction indicators
    return result.metadata && (
      result.metadata.make_source === 'url_extraction' ||
      result.metadata.vehicle_source === 'url_extraction' ||
      result.metadata.year_source === 'url_extraction'
    );
  }).length;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testNHTSAEndpoints().catch(console.error);
}

export { testNHTSAEndpoints };