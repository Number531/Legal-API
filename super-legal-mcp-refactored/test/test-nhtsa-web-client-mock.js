/**
 * NHTSA Web Search Client Mock Tests
 * Tests NHTSA WebSearch functionality with simulated responses
 */

import { NHTSAWebSearchClient } from '../src/api-clients/NHTSAWebSearchClient.js';

// Mock rate limiter for testing
class MockRateLimiter {
  async enforce() {
    // No actual rate limiting in tests
    return Promise.resolve();
  }
}

// Mock NHTSA WebSearch client with simulated Exa responses
class MockNHTSAWebSearchClient extends NHTSAWebSearchClient {
  constructor() {
    super(new MockRateLimiter(), 'test-api-key');
  }

  async executeExaSearch(query, limit, includeContents = false) {
    // Simulate different search scenarios based on query
    // Order matters - check for more specific queries first
    
    if (query.includes('recall') && (query.includes('Honda') || query.includes('1HGBH41JXMN109186'))) {
      return [
        {
          id: 'recall-1',
          title: 'NHTSA Campaign ID: 21V-123 - Honda Accord Recall',
          url: 'https://www.nhtsa.gov/recalls/honda-accord-2021-fuel-system-recall',
          publishedDate: '2021-03-15',
          text: includeContents ? `DEFECT SUMMARY: Fuel pump may fail prematurely, causing engine to stall without warning.
CONSEQUENCE: An engine stall can increase the risk of a crash.
REMEDY: Dealers will replace the fuel pump assembly free of charge.
NHTSA Campaign ID: 21V-123
Recall Number: H21-001
Component: Fuel System
Manufacturer Recall Date: 02/28/2021
NHTSA Action Date: 03/15/2021
Potential Units Affected: 45,000
Affected Vehicles: 2021 Honda Accord with 1.5L engine
SAFETY RISK: High - Engine stall without warning` : ''
        },
        {
          id: 'recall-2',
          title: 'Honda Accord 2021 Airbag Recall - NHTSA 21V-456',
          url: 'https://www.nhtsa.gov/recalls/honda-accord-airbag-recall-21v456',
          publishedDate: '2021-05-10',
          text: includeContents ? `DEFECT SUMMARY: Driver airbag inflator may rupture due to manufacturing defect.
CONSEQUENCE: Ruptured inflator can cause metal fragments to strike occupants, causing serious injury or death.
REMEDY: Dealers will replace the airbag inflator assembly.
NHTSA Campaign ID: 21V-456
Component: Airbag System
Manufacturer Recall Date: 04/20/2021
Potential Units Affected: 12,500` : ''
        }
      ];
    }
    
    if (query.includes('VIN') || query.includes('1HGBH41JXMN109186')) {
      return [
        {
          id: 'vin-1',
          title: '2021 Honda Accord VIN Decoder - NHTSA vPIC',
          url: 'https://vpic.nhtsa.dot.gov/decoder/VIN/1HGBH41JXMN109186',
          publishedDate: '2021-01-15',
          text: includeContents ? `Vehicle Identification Number: 1HGBH41JXMN109186
Make: Honda
Model: Accord
Year: 2021
Engine: 1.5L 4-Cylinder Turbo
Transmission: CVT
Body Class: Sedan
Vehicle Type: Passenger Car
Fuel Type: Gasoline
Plant: Marysville, Ohio` : ''
        },
        {
          id: 'vin-2',
          title: 'Vehicle Specifications - Honda Accord 2021',
          url: 'https://www.nhtsa.gov/vehicle-specs/2021-honda-accord',
          publishedDate: '2021-01-20',
          text: includeContents ? `2021 Honda Accord Specifications
Make: Honda
Model: Accord  
Year: 2021
VIN Pattern: 1HGBH41JXMN######
Safety Features: Honda Sensing Suite, Collision Mitigation
EPA Rating: 32 city / 42 highway MPG` : ''
        }
      ];
    }

    if (query.includes('Honda') && query.includes('models')) {
      return [
        {
          id: 'models-1',
          title: 'Honda Models 2021 - NHTSA Database',
          url: 'https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/Honda/modelyear/2021',
          publishedDate: '2021-01-01',
          text: includeContents ? `Honda 2021 Model Year Vehicles:
- Accord (Sedan)
- Civic (Sedan, Hatchback)
- CR-V (SUV)
- Pilot (SUV)
- Ridgeline (Pickup)
- Odyssey (Minivan)
- Passport (SUV)
- HR-V (SUV)
- Insight (Hybrid)` : ''
        }
      ];
    }

    if (query.includes('complaint') && query.includes('Honda')) {
      return [
        {
          id: 'complaint-1',
          title: 'ODI Consumer Complaint - Honda Accord Engine Stall',
          url: 'https://www.nhtsa.gov/complaints/honda-accord-2021-engine-stall-complaint',
          publishedDate: '2021-02-20',
          text: includeContents ? `Consumer Complaint Report
Vehicle: 2021 Honda Accord
Component: Engine
Date of Incident: 02/15/2021
Description: Engine stalled while driving on highway at 65 mph. Vehicle lost power steering and braking assist. Managed to coast to shoulder safely.
Complaint Number: 11234567
ODI Number: 21V-123-001
Outcome: Vehicle towed to dealer, fuel pump replaced` : ''
        }
      ];
    }

    if (query.includes('safety rating') || query.includes('NCAP')) {
      return [
        {
          id: 'rating-1',
          title: '2021 Honda Accord NCAP 5-Star Safety Rating',
          url: 'https://www.nhtsa.gov/vehicle-safety-ratings/2021-honda-accord-4dr-sedan',
          publishedDate: '2021-01-30',
          text: includeContents ? `2021 Honda Accord Safety Ratings
Overall Rating: 5 stars out of 5
Frontal Crash: 5 stars
Side Crash: 5 stars  
Rollover: 4 stars
Overall Vehicle Score: 5 stars
Standard Safety Features:
- Automatic Emergency Braking
- Blind Spot Monitoring
- Lane Keeping Assist
- Adaptive Cruise Control
Crash Test Results: Excellent protection for adult occupants` : ''
        }
      ];
    }

    // Default empty response
    return [];
  }
}

async function runMockTests() {
  console.log('🧪 Starting NHTSA Web Search Client Mock Tests\\n');
  
  const client = new MockNHTSAWebSearchClient();
  let passed = 0;
  let failed = 0;

  // Helper function to run a test
  async function runTest(testName, testFn) {
    try {
      console.log(`⚡ Running: ${testName}`);
      await testFn();
      console.log(`✅ PASSED: ${testName}\\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}\\n`);
      failed++;
    }
  }

  // Test 1: VIN decode basic functionality
  await runTest('VIN decode - basic functionality', async () => {
    const result = await client.decodeVinWeb({
      vin: '1HGBH41JXMN109186'
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'nhtsa_vin_decode_web') throw new Error('Wrong search type');
    if (!Array.isArray(data.results)) throw new Error('Results not array');
    if (data.results.length === 0) throw new Error('No results returned');
    
    const firstResult = data.results[0];
    if (!firstResult.title) throw new Error('Missing title');
    if (!firstResult.url) throw new Error('Missing URL');
    if (!firstResult.url.includes('nhtsa.gov') && !firstResult.url.includes('vpic.nhtsa.dot.gov')) throw new Error('URL not from NHTSA domain');
    if (firstResult.result_type !== 'vin_decode') throw new Error('Wrong result type');
    
    console.log(`   Found ${data.results.length} VIN decode results`);
  });

  // Test 2: VIN decode with snippet
  await runTest('VIN decode - with snippet extraction', async () => {
    const result = await client.decodeVinWeb({
      vin: '1HGBH41JXMN109186',
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    const firstResult = data.results[0];
    if (!firstResult.snippet) throw new Error('Snippet not extracted');
    if (firstResult.snippet.length < 30) throw new Error('Snippet too short');
    
    console.log(`   Snippet: ${firstResult.snippet.substring(0, 80)}...`);
  });

  // Test 3: Models for make search
  await runTest('Models for make search', async () => {
    const result = await client.getModelsForMakeWeb({
      make: 'Honda',
      year: 2021
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'nhtsa_models_web') throw new Error('Wrong search type');
    if (data.results.length === 0) throw new Error('No results returned');
    
    const firstResult = data.results[0];
    if (firstResult.result_type !== 'vehicle_models') throw new Error('Wrong result type');
    
    console.log(`   Found ${data.results.length} model results for ${data.make}`);
  });

  // Test 4: Recalls by VIN
  await runTest('Recalls by VIN search', async () => {
    const result = await client.getRecallsByVinWeb({
      vin: '1HGBH41JXMN109186',
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'nhtsa_recalls_vin_web') throw new Error('Wrong search type');
    if (data.results.length === 0) throw new Error('No results returned');
    
    const firstResult = data.results[0];
    if (firstResult.result_type !== 'recall') throw new Error('Wrong result type');
    if (!firstResult.snippet) throw new Error('Snippet not extracted');
    
    // Check for safety-critical content in snippet
    const snippet = firstResult.snippet.toLowerCase();
    const hasSafetyCritical = ['defect', 'consequence', 'remedy', 'safety', 'risk', 'recall'].some(term => 
      snippet.includes(term)
    );
    if (!hasSafetyCritical) throw new Error('Snippet missing safety-critical content');
    
    console.log(`   Found ${data.results.length} recall results`);
    console.log(`   Safety content detected in snippet: ✓`);
  });

  // Test 5: Recalls by make/model/year with metadata
  await runTest('Recalls by vehicle - metadata extraction', async () => {
    const result = await client.getRecallsByMakeModelYearWeb({
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      include_text: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.results.length === 0) throw new Error('No results returned');
    
    const firstResult = data.results[0];
    if (!firstResult.full_text) throw new Error('Full text not included');
    
    // Check metadata extraction
    const metadata = firstResult.metadata;
    const hasMetadata = Object.keys(metadata).length > 0;
    if (!hasMetadata) {
      console.log('   Warning: No metadata extracted from result');
    } else {
      console.log(`   ✓ Metadata extracted: ${Object.keys(metadata).join(', ')}`);
    }
    
    console.log(`   Full text length: ${firstResult.full_text.length} characters`);
  });

  // Test 6: Consumer complaints search
  await runTest('Consumer complaints search', async () => {
    const result = await client.searchComplaintsWeb({
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      limit: 10
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'nhtsa_complaints_web') throw new Error('Wrong search type');
    if (data.results.length === 0) throw new Error('No results returned');
    
    const firstResult = data.results[0];
    if (firstResult.result_type !== 'complaint') throw new Error('Wrong result type');
    
    console.log(`   Found ${data.results.length} complaint results`);
  });

  // Test 7: Safety ratings search
  await runTest('Safety ratings search', async () => {
    const result = await client.getSafetyRatingsWeb({
      year: 2021,
      make: 'Honda',
      model: 'Accord',
      include_snippet: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.search_type !== 'nhtsa_safety_ratings_web') throw new Error('Wrong search type');
    if (data.results.length === 0) throw new Error('No results returned');
    
    const firstResult = data.results[0];
    if (firstResult.result_type !== 'safety_rating') throw new Error('Wrong result type');
    if (!firstResult.snippet) throw new Error('Snippet not extracted');
    
    // Check for rating information
    const snippet = firstResult.snippet.toLowerCase();
    const hasRatingInfo = ['star', 'rating', 'crash', 'safety'].some(term => 
      snippet.includes(term)
    );
    if (!hasRatingInfo) throw new Error('Snippet missing rating information');
    
    console.log(`   Found ${data.results.length} safety rating results`);
  });

  // Test 8: NHTSA metadata extraction
  await runTest('NHTSA metadata extraction patterns', async () => {
    const result = await client.getRecallsByMakeModelYearWeb({
      make: 'Honda',
      model: 'Accord', 
      year: 2021,
      include_text: true
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.results.length === 0) throw new Error('No results returned');
    
    const firstResult = data.results[0];
    const metadata = firstResult.metadata;
    
    // Check if campaign ID was extracted
    if (metadata.nhtsa_campaign_id) {
      console.log(`   ✓ Campaign ID extracted: ${metadata.nhtsa_campaign_id}`);
    }
    
    // Check if component was extracted
    if (metadata.component) {
      console.log(`   ✓ Component extracted: ${metadata.component}`);
    }
    
    // Check if units affected was extracted
    if (metadata.potential_units_affected) {
      console.log(`   ✓ Units affected: ${metadata.potential_units_affected}`);
    }
    
    const extractedFields = Object.keys(metadata).length;
    if (extractedFields === 0) throw new Error('No metadata fields extracted');
    
    console.log(`   Total metadata fields extracted: ${extractedFields}`);
  });

  // Test 9: Query building validation
  await runTest('Query building validation', async () => {
    const testQueries = [
      client.buildNHTSAQuery({
        searchType: 'recall',
        make: 'Honda',
        model: 'Accord',
        year: 2021,
        biasTerms: ['recall', 'campaign']
      }),
      client.buildNHTSAQuery({
        searchType: 'vin_decode',
        vin: '1HGBH41JXMN109186',
        biasTerms: ['decode', 'specifications']
      })
    ];
    
    for (const query of testQueries) {
      if (!query.includes('site:nhtsa.gov')) throw new Error('Missing NHTSA site restriction');
      if (query.length < 20) throw new Error('Query too short');
    }
    
    console.log('   ✓ All queries properly formatted with site restrictions');
  });

  // Test 10: Error handling validation
  await runTest('Error handling - missing required parameters', async () => {
    try {
      await client.decodeVinWeb({});
      throw new Error('Should have thrown error for missing VIN');
    } catch (error) {
      if (!error.message.includes('VIN is required')) {
        throw new Error(`Wrong error message: ${error.message}`);
      }
    }
    
    try {
      await client.getSafetyRatingsWeb({ make: 'Honda' });
      throw new Error('Should have thrown error for missing year/model');
    } catch (error) {
      if (!error.message.includes('required')) {
        throw new Error(`Wrong error message: ${error.message}`);
      }
    }
    
    console.log('   ✓ Proper error handling for missing parameters');
  });

  // Summary
  console.log('📊 NHTSA Web Search Client Mock Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\\n🎉 All mock tests passed! NHTSA WebSearch client is ready for live testing.');
    return true;
  } else {
    console.log('\\n⚠️  Some tests failed. Please review implementation before proceeding.');
    return false;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMockTests().catch(err => {
    console.error('❌ Mock tests failed with error:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
}

export { runMockTests };