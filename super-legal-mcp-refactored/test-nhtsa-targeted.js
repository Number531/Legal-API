#!/usr/bin/env node

/**
 * Targeted NHTSA Tests for Vehicle/Campaign ID Extraction
 */

console.log('🎯 NHTSA Targeted Extraction Tests');
console.log('===================================\n');

try {
  const { NHTSAWebSearchClient } = await import('./src/api-clients/NHTSAWebSearchClient.js');

  const mockRateLimiter = {
    enforce: async () => { await new Promise(resolve => setTimeout(resolve, 200)); }
  };

  const client = new NHTSAWebSearchClient(mockRateLimiter, process.env.EXA_API_KEY);
  console.log('✅ Client ready\n');

  // Test 1: Recalls by Make/Model/Year (likely to have campaign IDs)
  console.log('1️⃣ Testing Recalls by Make/Model/Year (Honda Civic 2023)');
  console.log('   Expected: Campaign IDs, Vehicle info from URLs');

  const recallTest = await client.getRecallsByMakeModelYearWeb({
    make: 'Honda',
    model: 'Civic',
    year: 2023,
    include_snippet: true
  });

  const recallData = JSON.parse(recallTest.content[0].text);
  console.log(`   📊 Results: ${recallData.total_results}`);
  console.log(`   📊 Campaign ID Coverage: ${recallData.quality_summary?.campaign_id_coverage || '0%'}`);
  console.log(`   📊 Vehicle Info Coverage: ${recallData.quality_summary?.vehicle_info_coverage || '0%'}`);
  console.log(`   📊 NHTSA Domain Coverage: ${recallData.quality_summary?.nhtsa_domain_coverage || '0%'}`);

  // Analyze first 3 results for extraction details
  let campaignIds = 0;
  let vehicleExtracted = 0;
  let urlVehicleExtracted = 0;

  if (recallData.results) {
    console.log('\n   🔍 Detailed Analysis:');
    for (let i = 0; i < Math.min(3, recallData.results.length); i++) {
      const result = recallData.results[i];
      console.log(`\n   Result ${i + 1}:`);
      console.log(`     URL: ${result.url}`);
      console.log(`     Title: ${result.title?.substring(0, 60)}...`);

      // Check campaign ID extraction
      const campaignId = result.campaign_id || result.metadata?.campaign_id;
      if (campaignId) {
        campaignIds++;
        console.log(`     ✨ Campaign ID: ${campaignId} (Source: ${result.metadata?.campaign_id_source || 'unknown'})`);
      } else {
        console.log(`     ❌ Campaign ID: None`);
      }

      // Check vehicle info extraction
      const make = result.make || result.metadata?.make;
      const model = result.model || result.metadata?.model;
      const year = result.year || result.metadata?.year;

      if (make && model && year) {
        vehicleExtracted++;
        const makeSource = result.metadata?.make_source || result.metadata?.vehicle_source;
        const modelSource = result.metadata?.model_source || result.metadata?.vehicle_source;
        const yearSource = result.metadata?.year_source || result.metadata?.vehicle_source;

        console.log(`     ✨ Vehicle: ${year} ${make} ${model}`);
        console.log(`       Make Source: ${makeSource || 'content'}`);
        console.log(`       Model Source: ${modelSource || 'content'}`);
        console.log(`       Year Source: ${yearSource || 'content'}`);

        if (makeSource?.includes('url') || modelSource?.includes('url') || yearSource?.includes('url')) {
          urlVehicleExtracted++;
          console.log(`     🎯 URL EXTRACTION SUCCESS!`);
        }
      } else {
        console.log(`     ❌ Vehicle: ${year || '?'} ${make || '?'} ${model || '?'}`);
      }

      // Check confidence scoring
      const confidence = result.data_quality?.confidence || result.extraction_confidence;
      console.log(`     📈 Confidence: ${confidence ? (confidence * 100).toFixed(1) + '%' : 'N/A'}`);
    }
  }

  console.log(`\n   📊 EXTRACTION SUMMARY:`);
  console.log(`     Campaign IDs Found: ${campaignIds}/${Math.min(3, recallData.results?.length || 0)}`);
  console.log(`     Vehicle Info Extracted: ${vehicleExtracted}/${Math.min(3, recallData.results?.length || 0)}`);
  console.log(`     URL Vehicle Extractions: ${urlVehicleExtracted}/${Math.min(3, recallData.results?.length || 0)}`);

  // Test 2: Safety Ratings (should have vehicle info in URLs)
  console.log('\n\n2️⃣ Testing Safety Ratings (Honda Accord 2023)');
  console.log('   Expected: Vehicle info from NHTSA URLs');

  const safetyTest = await client.getSafetyRatingsWeb({
    make: 'Honda',
    model: 'Accord',
    year: 2023,
    include_snippet: true
  });

  const safetyData = JSON.parse(safetyTest.content[0].text);
  console.log(`   📊 Results: ${safetyData.total_results}`);
  console.log(`   📊 Vehicle Info Coverage: ${safetyData.quality_summary?.vehicle_info_coverage || '0%'}`);

  // Look for vehicle URLs
  let vehicleUrls = 0;
  if (safetyData.results) {
    console.log('\n   🔍 URL Analysis:');
    for (let i = 0; i < Math.min(3, safetyData.results.length); i++) {
      const result = safetyData.results[i];
      console.log(`\n   Result ${i + 1}:`);
      console.log(`     URL: ${result.url}`);

      // Test our extractVehicleFromURL method directly
      const urlVehicleInfo = client.extractVehicleFromURL(result.url);
      if (urlVehicleInfo) {
        vehicleUrls++;
        console.log(`     ✨ URL Vehicle Info: ${urlVehicleInfo.year} ${urlVehicleInfo.make} ${urlVehicleInfo.model}`);
        console.log(`     🎯 Confidence: ${(urlVehicleInfo.confidence * 100).toFixed(1)}% (Source: ${urlVehicleInfo.source})`);
      } else {
        console.log(`     ❌ URL Vehicle Info: None extractable`);
      }
    }
  }

  console.log(`\n   📊 URL VEHICLE EXTRACTION: ${vehicleUrls}/${Math.min(3, safetyData.results?.length || 0)}`);

  // Summary
  console.log('\n\n🎯 IMPROVEMENT VALIDATION SUMMARY');
  console.log('=================================');

  const totalCampaignIds = campaignIds;
  const totalVehicleInfo = vehicleExtracted;
  const totalUrlExtractions = urlVehicleExtracted + vehicleUrls;

  console.log(`✨ Campaign ID Extraction: ${totalCampaignIds > 0 ? 'WORKING' : 'NEEDS ATTENTION'}`);
  console.log(`✨ Vehicle Info Extraction: ${totalVehicleInfo > 0 ? 'WORKING' : 'NEEDS ATTENTION'}`);
  console.log(`✨ URL Vehicle Extraction: ${totalUrlExtractions > 0 ? 'SUCCESS - NEW CAPABILITY!' : 'NEEDS DEBUGGING'}`);

  if (totalCampaignIds > 0) {
    console.log('\n🎉 Campaign ID improvements are working!');
  }
  if (totalUrlExtractions > 0) {
    console.log('🎉 URL vehicle extraction improvements are working!');
  }

  console.log('\n✅ Targeted tests completed successfully!');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}