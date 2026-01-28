/**
 * Test USPTO with simpler queries to isolate the 500 error cause
 */

async function testUSPTOQueries() {
  console.log('🔍 Testing Different USPTO Query Approaches...\n');
  
  const EXA_API_KEY = 'dbcb656b-61e0-48c2-8237-b9205b1b84db';
  
  const queries = [
    {
      name: 'Simple patent query',
      query: 'patent artificial intelligence',
      domains: []
    },
    {
      name: 'USPTO site only',
      query: 'artificial intelligence',
      domains: ['uspto.gov']
    },
    {
      name: 'Google Patents only', 
      query: 'artificial intelligence',
      domains: ['patents.google.com']
    },
    {
      name: 'Our complex query',
      query: '(site:uspto.gov OR site:patents.google.com) "artificial intelligence"',
      domains: []
    },
    {
      name: 'Simple site syntax',
      query: 'site:uspto.gov artificial intelligence',
      domains: []
    }
  ];
  
  for (const test of queries) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      console.log(`   Query: "${test.query}"`);
      
      const body = {
        query: test.query,
        num_results: 2,
        use_autoprompt: true,
        type: 'neural'
      };
      
      if (test.domains.length > 0) {
        body.include_domains = test.domains;
      }
      
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY
        },
        body: JSON.stringify(body)
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success! Found ${data.results?.length} results`);
        if (data.results?.[0]) {
          console.log(`   📄 First: ${data.results[0].title?.substring(0, 60)}...`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 100)}...`);
      }
      
      console.log('');
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
      console.log('');
    }
  }
}

testUSPTOQueries();