import dotenv from 'dotenv';
import { CourtListenerWebSearchClient } from './src/api-clients/CourtListenerWebSearchClient.js';

dotenv.config();

class MockRateLimiter {
  async enforce() {
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

async function testCourtListener() {
  try {
    console.log('🏛️ Testing CourtListenerWebSearchClient');
    
    const client = new CourtListenerWebSearchClient(new MockRateLimiter());
    console.log('✅ Client instantiated');
    
    const response = await client.searchOpinionsWeb({
      query: 'Miranda rights',
      limit: 1
    });
    
    console.log('✅ Response received');
    console.log('Response has content:', !!response.content);
    
    if (response.content && response.content[0]) {
      const data = JSON.parse(response.content[0].text);
      console.log('Search type:', data.search_type);
      console.log('Results count:', data.results?.length || 0);
      console.log('Original query:', data.original_query);
      
      // Check for enhanced highlights
      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        console.log('First result fields:');
        console.log('- Case name:', firstResult.case_name);
        console.log('- Court:', firstResult.court);
        console.log('- Has snippet:', !!firstResult.snippet);
        console.log('- Snippet length:', firstResult.snippet?.length || 0);
        console.log('- Has highlight quality:', !!firstResult._highlight_quality);
        
        if (firstResult._highlight_quality) {
          console.log('- Highlight confidence:', firstResult._highlight_quality.confidence);
          console.log('- Highlight coverage:', firstResult._highlight_quality.coverage);
          console.log('- Extraction method:', firstResult._highlight_quality.extraction_method);
        }
      }
      
      // Check for legal metadata
      if (data._search_quality && data._search_quality.legal_metadata) {
        console.log('Legal metadata present:');
        const legal = data._search_quality.legal_metadata;
        console.log('- Jurisdiction coverage:', legal.jurisdiction_coverage?.total_jurisdictions || 0);
        console.log('- Court levels:', Object.keys(legal.court_levels || {}));
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testCourtListener().then(success => {
  console.log(success ? '🎉 CourtListener test passed!' : '💥 CourtListener test failed!');
  process.exit(success ? 0 : 1);
});