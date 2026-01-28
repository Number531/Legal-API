/**
 * NHTSA Web Search Client Live Tests
 * Tests NHTSA WebSearch functionality with real Exa API calls
 * Requires EXA_API_KEY environment variable
 */

import { NHTSAWebSearchClient } from '../src/api-clients/NHTSAWebSearchClient.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Mock rate limiter for testing
class MockRateLimiter {
  async enforce() {
    // Small delay to simulate rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function runLiveTests() {
  console.log('🧪 Starting NHTSA Web Search Client Live Tests\\n');
  
  // Check for API key
  if (!process.env.EXA_API_KEY) {
    console.log('❌ EXA_API_KEY not found in environment variables');
    console.log('   Please set EXA_API_KEY in your .env file');
    process.exit(1);
  }
  
  const client = new NHTSAWebSearchClient(new MockRateLimiter(), process.env.EXA_API_KEY);
  let passed = 0;
  let failed = 0;

  // Helper function to run a test
  async function runTest(testName, testFn) {
    try {
      console.log(`⚡ Running: ${testName}`);
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      console.log(`✅ PASSED: ${testName} (${duration}ms)\\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}\\n`);
      failed++;
    }
  }

  // Test 1: VIN decode search
  await runTest('VIN decode - basic search', async () => {
    const result = await client.decodeVinWeb({
      vin: '1HGBH41JXMN109186',
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'nhtsa_vin_decode_web') throw new Error('Wrong search type');
    if (!Array.isArray(data.results)) throw new Error('Results not array');
    if (data.results.length === 0) throw new Error('No results returned');
    
    // Check first result has required fields
    const firstResult = data.results[0];
    if (!firstResult.title) throw new Error('Missing title');
    if (!firstResult.url) throw new Error('Missing URL');
    if (!firstResult.url.includes('nhtsa.gov') && !firstResult.url.includes('vpic.nhtsa.dot.gov')) {
      throw new Error('URL not from NHTSA domain');
    }
    if (firstResult.result_type !== 'vin_decode') throw new Error('Wrong result type');
    
    console.log(`   Found ${data.results.length} VIN decode results`);
    console.log(`   First result: ${firstResult.title.substring(0, 80)}...`);
    if (firstResult.snippet) {
      console.log(`   Snippet preview: ${firstResult.snippet.substring(0, 100)}...`);
    }
  });

  // Test 2: Models for make search
  await runTest('Models for make search', async () => {
    const result = await client.getModelsForMakeWeb({
      make: 'Honda',
      year: 2021,
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'nhtsa_models_web') throw new Error('Wrong search type');
    if (data.results.length === 0) throw new Error('No results returned');
    
    const firstResult = data.results[0];
    if (firstResult.result_type !== 'vehicle_models') throw new Error('Wrong result type');
    if (!firstResult.url.includes('nhtsa.gov') && !firstResult.url.includes('vpic.nhtsa.dot.gov')) {
      throw new Error('URL not from NHTSA domain');
    }
    
    console.log(`   Found ${data.results.length} model results for ${data.make} ${data.year || ''}`);
    console.log(`   First result: ${firstResult.title.substring(0, 80)}...`);
  });

  // Test 3: Recalls by VIN
  await runTest('Recalls by VIN search', async () => {
    const result = await client.getRecallsByVinWeb({
      vin: '1HGBH41JXMN109186',
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'nhtsa_recalls_vin_web') throw new Error('Wrong search type');
    
    console.log(`   Found ${data.results.length} recall results for VIN`);
    
    if (data.results.length > 0) {
      const firstResult = data.results[0];
      if (firstResult.result_type !== 'recall') throw new Error('Wrong result type');
      if (!firstResult.url.includes('nhtsa.gov')) throw new Error('URL not from NHTSA domain');
      
      console.log(`   First result: ${firstResult.title.substring(0, 80)}...`);
      
      // Check metadata extraction
      const metadata = firstResult.metadata;
      if (Object.keys(metadata).length > 0) {
        console.log(`   ✓ Metadata extracted: ${Object.keys(metadata).join(', ')}`);
      }
    }
  });

  // Test 4: Recalls by make/model/year with full text
  await runTest('Recalls by vehicle - detailed', async () => {
    const result = await client.getRecallsByMakeModelYearWeb({
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      include_text: true,
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'nhtsa_recalls_vehicle_web') throw new Error('Wrong search type');
    
    console.log(`   Found ${data.results.length} recall results for ${data.make} ${data.model} ${data.year}`);
    
    if (data.results.length > 0) {
      const firstResult = data.results[0];
      if (firstResult.result_type !== 'recall') throw new Error('Wrong result type');
      
      if (firstResult.full_text) {
        console.log(`   Full text length: ${firstResult.full_text.length} characters`);
        if (firstResult.full_text.length < 100) {
          throw new Error('Full text too short');
        }
      }
      
      if (firstResult.snippet) {
        console.log(`   Snippet quality check: ${firstResult.snippet.length} chars`);
      }
    }
  });

  // Test 5: Consumer complaints search
  await runTest('Consumer complaints search', async () => {
    const result = await client.searchComplaintsWeb({
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      limit: 5,
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'nhtsa_complaints_web') throw new Error('Wrong search type');
    
    console.log(`   Found ${data.results.length} complaint results`);
    
    if (data.results.length > 0) {
      const firstResult = data.results[0];
      if (firstResult.result_type !== 'complaint') throw new Error('Wrong result type');
      if (!firstResult.url.includes('nhtsa.gov')) throw new Error('URL not from NHTSA domain');
      
      console.log(`   First result: ${firstResult.title.substring(0, 80)}...`);
    }
  });

  // Test 6: Safety ratings search
  await runTest('Safety ratings search', async () => {
    const result = await client.getSafetyRatingsWeb({
      year: 2021,
      make: 'Honda',
      model: 'Accord',
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'nhtsa_safety_ratings_web') throw new Error('Wrong search type');
    
    console.log(`   Found ${data.results.length} safety rating results`);
    
    if (data.results.length > 0) {
      const firstResult = data.results[0];
      if (firstResult.result_type !== 'safety_rating') throw new Error('Wrong result type');
      if (!firstResult.url.includes('nhtsa.gov')) throw new Error('URL not from NHTSA domain');
      
      console.log(`   First result: ${firstResult.title.substring(0, 80)}...`);
      
      // Check for safety rating in metadata
      const metadata = firstResult.metadata;
      if (metadata.overall_safety_rating) {
        console.log(`   ✓ Safety rating extracted: ${metadata.overall_safety_rating} stars`);
      }
    }
  });

  // Test 7: Response time validation
  await runTest('Response time performance', async () => {
    const startTime = Date.now();
    
    const result = await client.decodeVinWeb({
      vin: '1HGBH41JXMN109186'
    });
    
    const duration = Date.now() - startTime;
    
    if (duration > 5000) {
      throw new Error(`Response too slow: ${duration}ms (should be < 5000ms)`);
    }
    
    const data = JSON.parse(result.content[0].text);
    if (data.results.length === 0) throw new Error('No results returned');
    
    console.log(`   Response time: ${duration}ms (✓ under 5000ms limit)`);
  });

  // Test 8: Metadata extraction validation
  await runTest('Metadata extraction validation', async () => {
    const result = await client.getRecallsByMakeModelYearWeb({
      make: 'Honda',
      model: 'Accord', 
      year: 2021,
      include_text: true
    });
    
    const data = JSON.parse(result.content[0].text);
    
    if (data.results.length > 0) {
      // Check if any result has extracted metadata
      const hasMetadata = data.results.some(r => 
        Object.keys(r.metadata).length > 0
      );
      
      if (!hasMetadata) {
        console.log('   Warning: No metadata extracted from any result');
      } else {
        console.log('   ✓ Metadata successfully extracted from at least one result');
        
        // Show details of metadata fields found
        const metadataFields = new Set();
        data.results.forEach(r => {
          Object.keys(r.metadata).forEach(field => metadataFields.add(field));
        });
        console.log(`   Metadata fields found: ${Array.from(metadataFields).join(', ')}`);
      }
    } else {
      console.log('   No results to validate metadata extraction');
    }
  });

  // Summary
  console.log('📊 NHTSA Web Search Client Live Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\\n🎉 All live tests passed! NHTSA WebSearch client is working correctly with real Exa API.');
  } else {
    console.log('\\n⚠️  Some tests failed. Please review API responses and error handling.');
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLiveTests().catch(err => {
    console.error('❌ Live tests failed with error:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
}

export { runLiveTests };