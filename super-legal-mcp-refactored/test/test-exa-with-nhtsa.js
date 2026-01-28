/**
 * Test Exa API with NHTSA client to isolate the issue
 */

import { NHTSAWebSearchClient } from '../src/api-clients/NHTSAWebSearchClient.js';

// Simple rate limiter
class SimpleRateLimiter {
  async enforce() {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function testNHTSA() {
  console.log('🧪 Testing NHTSA Web Search Client with Exa API...\n');
  
  const EXA_API_KEY = 'dbcb656b-61e0-48c2-8237-b9205b1b84db';
  const client = new NHTSAWebSearchClient(new SimpleRateLimiter(), EXA_API_KEY);

  try {
    console.log('🚗 Test 1: VIN Decode');
    const vinResult = await client.decodeVinWeb({
      vin: '1HGBH41JXMN109186',
      limit: 2
    });
    
    const vinParsed = JSON.parse(vinResult.content[0].text);
    console.log(`✅ VIN decode successful`);
    console.log(`📊 Results: ${vinParsed.total_results} found`);
    console.log(`🎯 Search type: ${vinParsed.search_type}`);
    if (vinParsed.results && vinParsed.results.length > 0) {
      console.log(`📄 Sample: ${vinParsed.results[0].title?.substring(0, 80)}...`);
    }
    console.log('');

    console.log('🚗 Test 2: Recalls by Make/Model');
    const recallResult = await client.getRecallsByMakeModelYearWeb({
      make: 'Honda',
      model: 'Civic',
      year: '2020',
      limit: 2
    });
    
    const recallParsed = JSON.parse(recallResult.content[0].text);
    console.log(`✅ Recalls search successful`);
    console.log(`📊 Results: ${recallParsed.total_results} found`);
    console.log(`🎯 Search type: ${recallParsed.search_type}`);
    console.log('');

    console.log('🎉 NHTSA Test Results:');
    console.log('=====================');
    console.log('✅ NHTSA VIN decode: WORKING with Exa API');
    console.log('✅ NHTSA recalls search: WORKING with Exa API');
    console.log('✅ Exa API is responding properly for NHTSA');
    console.log('');
    console.log('🔍 This suggests the issue might be specific to USPTO queries or temporary.');
    
  } catch (error) {
    console.error('❌ NHTSA test failed:', error.message);
    
    if (error.message.includes('500')) {
      console.log('⚠️  NHTSA also getting 500 errors - confirms it\'s an Exa API server issue');
    } else {
      console.log('🔍 Different error type - might be query-specific');
    }
  }
}

testNHTSA();