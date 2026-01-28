#!/usr/bin/env node

/**
 * Quick NHTSA All Endpoints Test
 */

console.log('🚗 Quick NHTSA All Endpoints Test');
console.log('==================================\n');

try {
  const { NHTSAWebSearchClient } = await import('./src/api-clients/NHTSAWebSearchClient.js');

  const mockRateLimiter = {
    enforce: async () => { await new Promise(resolve => setTimeout(resolve, 100)); }
  };

  const client = new NHTSAWebSearchClient(mockRateLimiter, process.env.EXA_API_KEY);

  const testResults = {};

  // Test parameters
  const testParams = {
    vin: '1HGBH41JXMN109186',
    make: 'Honda',
    model: 'Civic',
    year: 2023
  };

  console.log(`Using test parameters: ${testParams.year} ${testParams.make} ${testParams.model}, VIN: ${testParams.vin}\n`);

  // Test each endpoint with basic error handling
  const endpoints = [
    {
      name: 'decodeVinWeb',
      method: () => client.decodeVinWeb({ vin: testParams.vin, include_snippet: true })
    },
    {
      name: 'getModelsForMakeWeb',
      method: () => client.getModelsForMakeWeb({ make: testParams.make, year: testParams.year, include_snippet: true })
    },
    {
      name: 'getRecallsByVinWeb',
      method: () => client.getRecallsByVinWeb({ vin: testParams.vin, include_snippet: true })
    },
    {
      name: 'getRecallsByMakeModelYearWeb',
      method: () => client.getRecallsByMakeModelYearWeb({ make: testParams.make, model: testParams.model, year: testParams.year, include_snippet: true })
    },
    {
      name: 'searchComplaintsWeb',
      method: () => client.searchComplaintsWeb({ make: testParams.make, model: testParams.model, year: testParams.year, include_snippet: true, limit: 5 })
    },
    {
      name: 'getSafetyRatingsWeb',
      method: () => client.getSafetyRatingsWeb({ make: testParams.make, model: testParams.model, year: testParams.year, include_snippet: true })
    }
  ];

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`${i + 1}️⃣ Testing ${endpoint.name}...`);

    try {
      const startTime = Date.now();
      const result = await endpoint.method();
      const endTime = Date.now();

      const data = JSON.parse(result.content[0].text);

      testResults[endpoint.name] = {
        status: 'SUCCESS',
        time: endTime - startTime,
        results: data.total_results || 0,
        campaign_id_coverage: data.quality_summary?.campaign_id_coverage || '0%',
        vehicle_info_coverage: data.quality_summary?.vehicle_info_coverage || '0%',
        nhtsa_domain_coverage: data.quality_summary?.nhtsa_domain_coverage || '0%',
        safety_critical: data.quality_summary?.safety_critical_count || 0
      };

      console.log(`   ✅ SUCCESS (${testResults[endpoint.name].time}ms)`);
      console.log(`   📊 ${testResults[endpoint.name].results} results`);
      console.log(`   📊 Campaign ID: ${testResults[endpoint.name].campaign_id_coverage}`);
      console.log(`   📊 Vehicle Info: ${testResults[endpoint.name].vehicle_info_coverage}`);

    } catch (error) {
      testResults[endpoint.name] = {
        status: 'ERROR',
        error: error.message
      };
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    console.log('');
  }

  // Summary
  console.log('📊 ENDPOINT TEST SUMMARY');
  console.log('========================\n');

  const successCount = Object.values(testResults).filter(r => r.status === 'SUCCESS').length;
  console.log(`✅ Successful: ${successCount}/${endpoints.length} endpoints\n`);

  Object.entries(testResults).forEach(([name, result]) => {
    if (result.status === 'SUCCESS') {
      console.log(`✅ ${name}:`);
      console.log(`   Results: ${result.results}, Campaign ID: ${result.campaign_id_coverage}, Vehicle: ${result.vehicle_info_coverage}`);
    } else {
      console.log(`❌ ${name}: ${result.error}`);
    }
  });

  // Key Metrics
  if (successCount > 0) {
    const campaignIdResults = Object.values(testResults)
      .filter(r => r.status === 'SUCCESS')
      .map(r => parseFloat(r.campaign_id_coverage.replace('%', '')));

    const vehicleInfoResults = Object.values(testResults)
      .filter(r => r.status === 'SUCCESS')
      .map(r => parseFloat(r.vehicle_info_coverage.replace('%', '')));

    const avgCampaignId = campaignIdResults.reduce((a, b) => a + b, 0) / campaignIdResults.length;
    const avgVehicleInfo = vehicleInfoResults.reduce((a, b) => a + b, 0) / vehicleInfoResults.length;

    console.log('\n🎯 KEY IMPROVEMENTS:');
    console.log(`   Average Campaign ID Coverage: ${avgCampaignId.toFixed(1)}% (Target: 60-80%)`);
    console.log(`   Average Vehicle Info Coverage: ${avgVehicleInfo.toFixed(1)}% (NEW CAPABILITY)`);

    if (avgCampaignId >= 60) {
      console.log('   🎉 EXCELLENT: Campaign ID extraction meets target!');
    } else if (avgCampaignId >= 30) {
      console.log('   📈 GOOD: Significant campaign ID improvement!');
    } else {
      console.log('   🔧 NEEDS WORK: Campaign ID extraction below expectations');
    }

    if (avgVehicleInfo > 0) {
      console.log('   🎉 SUCCESS: Vehicle info extraction working!');
    }
  }

  console.log('\n✅ Quick test completed!');

} catch (error) {
  console.error('❌ Fatal Error:', error.message);
  process.exit(1);
}