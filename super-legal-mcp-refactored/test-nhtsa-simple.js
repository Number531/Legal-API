#!/usr/bin/env node

/**
 * Simple NHTSA WebSearchClient Test
 */

console.log('Starting NHTSA test...');

try {
  console.log('Importing NHTSAWebSearchClient...');
  const { NHTSAWebSearchClient } = await import('./src/api-clients/NHTSAWebSearchClient.js');

  console.log('Creating mock rate limiter...');
  const mockRateLimiter = {
    enforce: async () => {
      console.log('  Rate limiting...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  console.log('Checking EXA_API_KEY...');
  if (!process.env.EXA_API_KEY) {
    console.log('❌ EXA_API_KEY not found');
    process.exit(1);
  }
  console.log('✅ EXA_API_KEY found');

  console.log('Creating NHTSAWebSearchClient...');
  const client = new NHTSAWebSearchClient(mockRateLimiter, process.env.EXA_API_KEY);
  console.log('✅ Client created successfully');

  console.log('Testing decodeVinWeb with simple parameters...');
  const startTime = Date.now();

  const result = await client.decodeVinWeb({
    vin: '1HGBH41JXMN109186',
    include_snippet: true
  });

  const endTime = Date.now();
  console.log(`✅ Test completed in ${endTime - startTime}ms`);

  const data = JSON.parse(result.content[0].text);
  console.log(`📊 Results: ${data.total_results} found`);
  console.log(`📊 Campaign ID Coverage: ${data.quality_summary?.campaign_id_coverage || 'N/A'}`);
  console.log(`📊 Vehicle Info Coverage: ${data.quality_summary?.vehicle_info_coverage || 'N/A'}`);

  // Look for URL extractions in first few results
  let urlExtractions = 0;
  if (data.results && Array.isArray(data.results)) {
    for (let i = 0; i < Math.min(3, data.results.length); i++) {
      const result = data.results[i];
      console.log(`\nResult ${i + 1}:`);
      console.log(`  URL: ${result.url}`);
      console.log(`  Campaign ID: ${result.metadata?.campaign_id || result.campaign_id || 'None'}`);
      console.log(`  Make: ${result.metadata?.make || result.make || 'None'}`);
      console.log(`  Model: ${result.metadata?.model || result.model || 'None'}`);
      console.log(`  Year: ${result.metadata?.year || result.year || 'None'}`);

      if (result.metadata?.make_source === 'url_extraction' ||
          result.metadata?.vehicle_source === 'url_extraction') {
        urlExtractions++;
        console.log(`  ✨ URL extraction detected!`);
      }
    }
  }

  console.log(`\n🎯 URL Extractions Found: ${urlExtractions}`);
  console.log('✅ Test completed successfully!');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}