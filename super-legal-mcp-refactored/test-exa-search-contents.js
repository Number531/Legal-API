/**
 * Test Exa search_and_contents endpoint with proper structured output format
 * Based on the exact Python SDK example format
 */

const EXA_API_KEY = 'dbcb656b-61e0-48c2-8237-b9205b1b84db';

async function testSearchAndContentsStructured() {
  console.log('🧪 TESTING EXA search_and_contents WITH STRUCTURED OUTPUT\n');
  console.log('='.repeat(60));
  
  // Exact format from Python SDK example, adapted for PTAB
  const requestBody = {
    query: 'Samsung Netlist IPR patent trial decision PTAB',
    type: 'auto',
    use_autoprompt: true,
    num_results: 5,
    text: true,
    livecrawl: 'always',
    include_domains: [
      'trials.uspto.gov',
      'ptabsearch.uspto.gov',
      'ptab.uspto.gov'
    ],
    summary: {
      schema: {
        description: 'Schema for PTAB proceeding metadata extraction',
        type: 'object',
        properties: {
          proceeding_number: {
            type: 'string',
            description: 'PTAB proceeding number (e.g., IPR2022-00063)'
          },
          patent_number: {
            type: 'string',
            description: 'US Patent number being challenged'
          },
          petitioner: {
            type: 'string',
            description: 'Name of the petitioner company'
          },
          patent_owner: {
            type: 'string',
            description: 'Name of the patent owner'
          },
          document_type: {
            type: 'string',
            description: 'Type of PTAB document'
          },
          decision_date: {
            type: 'string',
            description: 'Date of the decision'
          },
          status: {
            type: 'string',
            description: 'Current status of the proceeding'
          },
          challenged_claims: {
            type: 'array',
            description: 'List of challenged patent claims',
            items: {
              type: 'string'
            }
          }
        },
        required: ['proceeding_number', 'patent_number', 'petitioner', 'patent_owner', 'document_type'],
        additional_properties: false
      }
    }
  };

  try {
    console.log('📤 Sending request to /search_and_contents endpoint...\n');
    console.log('Query:', requestBody.query);
    console.log('Domains:', requestBody.include_domains);
    console.log('Livecrawl:', requestBody.livecrawl);
    console.log('Schema fields:', Object.keys(requestBody.summary.schema.properties));
    console.log('\n' + '-'.repeat(60) + '\n');
    
    // Try the search_and_contents endpoint first
    let response = await fetch('https://api.exa.ai/search_and_contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': EXA_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    // If search_and_contents doesn't exist, try /search
    if (response.status === 404) {
      console.log('⚠️  /search_and_contents not found, trying /search endpoint...\n');
      response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': EXA_API_KEY
        },
        body: JSON.stringify(requestBody)
      });
    }

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', response.status);
      console.error('Error details:', error);
      return null;
    }

    const data = await response.json();
    
    console.log('📥 Response received!\n');
    console.log('Endpoint used:', response.url.includes('search_and_contents') ? '/search_and_contents' : '/search');
    console.log('Total results:', data.results?.length || 0);
    
    if (data.results && data.results.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('📊 STRUCTURED DATA EXTRACTION RESULTS');
      console.log('='.repeat(60));
      
      let successCount = 0;
      
      data.results.forEach((result, index) => {
        console.log(`\n📄 Result ${index + 1}:`);
        console.log('URL:', result.url);
        console.log('Title:', result.title || 'No title');
        
        // Check for structured summary
        if (result.summary) {
          successCount++;
          console.log('\n✅ STRUCTURED DATA EXTRACTED:');
          console.log(JSON.stringify(result.summary, null, 2));
        } else {
          console.log('\n⚠️  No structured summary for this result');
          
          // Try to show what fields are available
          console.log('Available fields:', Object.keys(result));
        }
        
        // Show text preview if available
        if (result.text) {
          const preview = result.text.substring(0, 200);
          console.log('\nText preview:', preview + '...');
        }
        
        console.log('\n' + '-'.repeat(60));
      });
      
      // Summary statistics
      const successRate = (successCount / data.results.length * 100).toFixed(1);
      console.log('\n📈 EXTRACTION SUCCESS RATE:');
      console.log(`${successCount}/${data.results.length} results have structured data (${successRate}%)`);
      
      if (successCount > 0) {
        console.log('\n✅ SUCCESS: Structured output is working!');
        console.log('Recommendation: Migrate to structured extraction for PTAB data');
      } else {
        console.log('\n❌ Structured output not working with current configuration');
        console.log('Recommendation: Continue using manual regex extraction');
      }
    } else {
      console.log('\n❌ No results found');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return null;
  }
}

// Test with a simpler, general query to verify structured output works
async function testGeneralStructured() {
  console.log('\n\n🧪 TESTING GENERAL STRUCTURED OUTPUT\n');
  console.log('='.repeat(60));
  
  const requestBody = {
    query: 'OpenAI GPT-4 announcement',
    type: 'auto',
    num_results: 2,
    text: true,
    livecrawl: 'when_necessary',
    summary: {
      schema: {
        description: 'Schema for structured metadata extraction',
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the content'
          },
          author: {
            type: 'string',
            description: 'Author of the content'
          },
          date: {
            type: 'string',
            description: 'Publication or creation date'
          },
          keywords: {
            type: 'array',
            description: 'List of keywords or tags',
            items: {
              type: 'string'
            }
          },
          description: {
            type: 'string',
            description: 'Brief description or summary'
          }
        },
        required: ['title'],
        additional_properties: false
      }
    }
  };

  try {
    // Try search_and_contents first
    let response = await fetch('https://api.exa.ai/search_and_contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': EXA_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    // Fallback to /search if needed
    if (response.status === 404) {
      response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': EXA_API_KEY
        },
        body: JSON.stringify(requestBody)
      });
    }

    const data = await response.json();
    
    console.log('Results:', data.results?.length || 0);
    
    if (data.results && data.results[0]) {
      if (data.results[0].summary) {
        console.log('\n✅ Structured output working for general queries!');
        console.log('First result summary:');
        console.log(JSON.stringify(data.results[0].summary, null, 2));
      } else {
        console.log('\n❌ No structured summary in response');
        console.log('Available fields:', Object.keys(data.results[0]));
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Exa API structured output tests...\n');
  console.log('API Key:', EXA_API_KEY.substring(0, 8) + '...\n');
  
  // Test PTAB structured extraction
  const ptabResult = await testSearchAndContentsStructured();
  
  // Test general structured extraction
  const generalResult = await testGeneralStructured();
  
  // Final analysis
  console.log('\n\n' + '='.repeat(60));
  console.log('💡 FINAL RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  const ptabWorks = ptabResult?.results?.some(r => r.summary);
  const generalWorks = generalResult?.results?.some(r => r.summary);
  
  if (ptabWorks) {
    console.log('\n✅ MIGRATE TO STRUCTURED OUTPUT FOR PTAB');
    console.log('Implementation steps:');
    console.log('1. Use /search_and_contents endpoint (or /search if it works)');
    console.log('2. Set livecrawl: "always" for real-time data');
    console.log('3. Use the schema format from this test');
    console.log('4. Remove manual regex extraction code');
    console.log('\nBenefits:');
    console.log('- More accurate data extraction');
    console.log('- Handles edge cases automatically');
    console.log('- No regex maintenance');
    console.log('- Cleaner, simpler code');
  } else if (generalWorks && !ptabWorks) {
    console.log('\n⚠️  PARTIAL SUPPORT DETECTED');
    console.log('- Structured output works for general content');
    console.log('- May not work for USPTO PDFs or specific domains');
    console.log('- Consider hybrid approach or continue with regex');
  } else {
    console.log('\n❌ STRUCTURED OUTPUT NOT AVAILABLE');
    console.log('- Feature may require different API tier');
    console.log('- Continue using current manual extraction');
    console.log('- Current implementation is proven and working well');
  }
  
  console.log('\n📝 Key findings:');
  console.log('- Endpoint:', ptabResult || generalResult ? 'Tested successfully' : 'Not tested');
  console.log('- PTAB extraction:', ptabWorks ? '✅ Working' : '❌ Not working');
  console.log('- General extraction:', generalWorks ? '✅ Working' : '❌ Not working');
  
  console.log('\n✨ Test complete!');
}

// Run the tests
runTests().catch(console.error);