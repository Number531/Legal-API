/**
 * Simple Exa API test to isolate the issue
 */

async function testExaDirectly() {
  const EXA_API_KEY = 'dbcb656b-61e0-48c2-8237-b9205b1b84db';
  
  console.log('🧪 Testing Exa API directly...\n');
  
  try {
    console.log('📞 Making simple search request to Exa...');
    
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY
      },
      body: JSON.stringify({
        query: 'patent artificial intelligence',
        num_results: 2,
        include_domains: ['uspto.gov'],
        use_autoprompt: false,
        type: 'neural'
      })
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error response: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`✅ Success! Found ${data.results?.length || 0} results`);
    
    if (data.results && data.results.length > 0) {
      console.log(`📄 First result: ${data.results[0].title}`);
      console.log(`🔗 URL: ${data.results[0].url}`);
    }
    
  } catch (error) {
    console.error('❌ Direct API test failed:', error.message);
  }
}

testExaDirectly();