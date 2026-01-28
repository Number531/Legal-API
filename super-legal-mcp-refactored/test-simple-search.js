/**
 * Simple test to verify the highlights implementation works
 */

import { CourtListenerWebSearchClient } from './src/api-clients/CourtListenerWebSearchClient.js';

async function simpleTest() {
  console.log('🔍 Simple CourtListener Search Test\n');
  
  const rateLimiter = { enforce: async () => {} };
  const client = new CourtListenerWebSearchClient(rateLimiter);
  
  try {
    // Try a very common legal term
    console.log('Testing with query: "Brown v Board"');
    
    const result = await client.searchOpinionsWeb({
      query: 'Brown v Board',
      limit: 1,
      include_snippet: true,
      include_full_text: false
    });
    
    console.log('Raw result length:', JSON.stringify(result).length);
    
    const data = JSON.parse(result.content[0].text);
    console.log('Search results count:', data.total_results);
    console.log('Actual results:', data.results.length);
    
    if (data.results.length > 0) {
      const first = data.results[0];
      console.log('\n📄 First result:');
      console.log('- Case name:', first.case_name);
      console.log('- URL:', first.absolute_url);
      console.log('- Has snippet:', !!first.snippet);
      console.log('- Snippet length:', first.snippet?.length || 0);
      console.log('- Has full text:', !!first.full_text);
      
      if (first.snippet) {
        console.log('- Snippet preview:', first.snippet.substring(0, 200) + '...');
      }
    } else {
      console.log('❓ No results found. This might indicate:');
      console.log('   1. Query too specific');
      console.log('   2. Domain restrictions too narrow');
      console.log('   3. API key issues');
    }
    
    console.log('\n✅ Test completed without errors');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Check if it's an API error
    if (error.message.includes('Exa API error')) {
      console.log('\n🔧 Debugging info:');
      console.log('- API key configured:', !!process.env.EXA_API_KEY);
      console.log('- Error suggests API communication issue');
    }
  }
}

simpleTest();