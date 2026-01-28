import dotenv from 'dotenv';
import { SECWebSearchClient } from './src/api-clients/SECWebSearchClient.js';

dotenv.config();

console.log('🧪 Simple WebSearchClient Test');
console.log('EXA_API_KEY present:', !!process.env.EXA_API_KEY);

class MockRateLimiter {
  async enforce() {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function testSEC() {
  try {
    const client = new SECWebSearchClient(new MockRateLimiter());
    console.log('✅ SECWebSearchClient instantiated');
    
    const response = await client.searchSECFilingsWeb({
      query: 'revenue',
      company_identifier: 'AAPL',
      limit: 1
    });
    
    console.log('✅ SECWebSearchClient response received');
    console.log('Response type:', typeof response);
    console.log('Has content:', !!response.content);
    
    if (response.content && response.content[0]) {
      const data = JSON.parse(response.content[0].text);
      console.log('Search type:', data.search_type);
      console.log('Results count:', data.results?.length || 0);
      
      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        console.log('First result has highlight quality:', !!firstResult._highlight_quality);
        if (firstResult._highlight_quality) {
          console.log('Confidence:', firstResult._highlight_quality.confidence);
          console.log('Coverage:', firstResult._highlight_quality.coverage);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSEC().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Critical error:', error);
  process.exit(1);
});