import dotenv from 'dotenv';
import { EPAWebSearchClient } from './src/api-clients/EPAWebSearchClient.js';

dotenv.config();

class MockRateLimiter {
  async enforce() {
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

async function testEPA() {
  try {
    console.log('🌿 Testing EPAWebSearchClient');
    
    const client = new EPAWebSearchClient(new MockRateLimiter());
    console.log('✅ Client instantiated');
    
    const response = await client.searchFacilitiesWeb({
      facility_name: 'chemical plant',
      state: 'CA',
      limit: 2
    });
    
    console.log('✅ Response received');
    console.log('Response has content:', !!response.content);
    
    if (response.content && response.content[0]) {
      const data = JSON.parse(response.content[0].text);
      console.log('Facilities count:', data.facilities?.length || 0);
      console.log('Total facilities:', data.total_facilities);
      console.log('High priority violators:', data.high_priority_violators);
      
      // Check facilities data structure
      if (data.facilities && data.facilities.length > 0) {
        const firstFacility = data.facilities[0];
        console.log('First facility fields:');
        console.log('- Name:', firstFacility.name);
        console.log('- EPA Registry ID:', firstFacility.epa_registry_id);
        console.log('- Compliance status:', firstFacility.compliance_status);
        console.log('- Location:', firstFacility.location?.city, firstFacility.location?.state);
        console.log('- Has compliance object:', !!firstFacility.compliance);
        console.log('- Has programs object:', !!firstFacility.programs);
        console.log('- Has highlight quality:', !!firstFacility._highlight_quality);
        
        if (firstFacility._highlight_quality) {
          console.log('- Highlight confidence:', firstFacility._highlight_quality.confidence);
          console.log('- Highlight coverage:', firstFacility._highlight_quality.coverage);
          console.log('- Extraction method:', firstFacility._highlight_quality.extraction_method);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

testEPA().then(success => {
  console.log(success ? '🎉 EPA test passed!' : '💥 EPA test failed!');
  process.exit(success ? 0 : 1);
});