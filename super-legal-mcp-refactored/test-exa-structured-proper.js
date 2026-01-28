/**
 * Proper Exa Structured Output Test for PTAB Data
 * Using the correct API format for structured extraction
 */

const EXA_API_KEY = 'dbcb656b-61e0-48c2-8237-b9205b1b84db';

async function testStructuredPTAB() {
  console.log('🧪 TESTING EXA STRUCTURED OUTPUT FOR PTAB DATA\n');
  console.log('='.repeat(60));
  
  // The correct format for Exa structured output
  const requestBody = {
    query: 'Samsung Netlist IPR patent trial decision',
    num_results: 5,
    type: 'auto',
    use_autoprompt: true,
    // Include specific domains
    include_domains: ['uspto.gov', 'trials.uspto.gov', 'ptabsearch.uspto.gov'],
    // Request both text and structured summary
    text: true,
    summary: {
      query: 'Extract the PTAB proceeding details from this document',
      // Define the schema for structured extraction
      schema: {
        type: 'object',
        properties: {
          proceeding_number: {
            type: 'string',
            description: 'The PTAB proceeding number (e.g., IPR2022-00063, PGR2023-00001)'
          },
          patent_number: {
            type: 'string', 
            description: 'The US patent number being challenged'
          },
          petitioner: {
            type: 'string',
            description: 'The name of the petitioner company or entity'
          },
          patent_owner: {
            type: 'string',
            description: 'The name of the patent owner'
          },
          document_type: {
            type: 'string',
            description: 'Type of PTAB document (Institution Decision, Final Written Decision, etc.)'
          },
          decision_date: {
            type: 'string',
            description: 'The date of the decision or document'
          },
          status: {
            type: 'string',
            description: 'The current status or outcome of the proceeding'
          },
          key_claims: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of key patent claims being challenged'
          }
        },
        required: ['proceeding_number']
      }
    }
  };

  try {
    console.log('📤 Sending structured output request to Exa...\n');
    console.log('Query:', requestBody.query);
    console.log('Domains:', requestBody.include_domains);
    console.log('Schema fields:', Object.keys(requestBody.summary.schema.properties));
    console.log('\n' + '-'.repeat(60) + '\n');
    
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': EXA_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', response.status, error);
      return null;
    }

    const data = await response.json();
    
    console.log('📥 Response received!\n');
    console.log('Total results:', data.results?.length || 0);
    console.log('Search type:', data.resolvedSearchType);
    console.log('Autoprompt:', data.autopromptString);
    
    if (data.results && data.results.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('📊 STRUCTURED DATA EXTRACTION RESULTS');
      console.log('='.repeat(60));
      
      data.results.forEach((result, index) => {
        console.log(`\n📄 Result ${index + 1}:`);
        console.log('URL:', result.url);
        console.log('Title:', result.title);
        console.log('Score:', result.score);
        
        // Check for structured summary
        if (result.summary) {
          console.log('\n✅ STRUCTURED DATA EXTRACTED:');
          console.log(JSON.stringify(result.summary, null, 2));
        } else {
          console.log('\n⚠️  No structured summary for this result');
        }
        
        // Show a snippet of text
        if (result.text) {
          console.log('\nText preview (first 300 chars):');
          console.log(result.text.substring(0, 300) + '...');
        }
        
        console.log('\n' + '-'.repeat(60));
      });
      
      // Analysis
      const withSummary = data.results.filter(r => r.summary).length;
      const successRate = (withSummary / data.results.length * 100).toFixed(1);
      
      console.log('\n📈 EXTRACTION SUCCESS RATE:');
      console.log(`${withSummary}/${data.results.length} results have structured data (${successRate}%)`);
      
      if (withSummary > 0) {
        console.log('\n✅ SUCCESS: Structured output is working!');
        console.log('The API can extract PTAB data into structured format.');
        
        // Show example of extracted data
        const example = data.results.find(r => r.summary);
        if (example && example.summary) {
          console.log('\n📋 Example extracted data:');
          Object.entries(example.summary).forEach(([key, value]) => {
            if (value) {
              console.log(`   ${key}: ${JSON.stringify(value)}`);
            }
          });
        }
      }
    } else {
      console.log('\n❌ No results found. Try adjusting the query or domains.');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

// Alternative test with simpler query
async function testSimpleStructured() {
  console.log('\n\n🧪 SIMPLE STRUCTURED OUTPUT TEST\n');
  console.log('='.repeat(60));
  
  const requestBody = {
    query: 'artificial intelligence news',
    num_results: 2,
    text: true,
    summary: {
      query: 'What is this article about?',
      schema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Main topic of the article'
          },
          summary: {
            type: 'string',
            description: 'Brief summary in one sentence'
          }
        }
      }
    }
  };

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    console.log('Results:', data.results?.length || 0);
    
    if (data.results && data.results[0]) {
      if (data.results[0].summary) {
        console.log('\n✅ Structured output working for general queries!');
        console.log('Summary:', JSON.stringify(data.results[0].summary, null, 2));
      } else {
        console.log('\n❌ No structured summary in response');
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

// Run both tests
async function runTests() {
  // Test PTAB structured extraction
  const ptabResult = await testStructuredPTAB();
  
  // Test simple structured extraction
  const simpleResult = await testSimpleStructured();
  
  // Final recommendations
  console.log('\n\n' + '='.repeat(60));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  const ptabWorks = ptabResult?.results?.some(r => r.summary);
  const simpleWorks = simpleResult?.results?.some(r => r.summary);
  
  if (ptabWorks) {
    console.log('\n✅ MIGRATE TO STRUCTURED OUTPUT');
    console.log('- Structured extraction works for PTAB data');
    console.log('- Will provide cleaner, more accurate data');
    console.log('- Eliminates complex regex maintenance');
    console.log('- Use the schema format shown in this test');
  } else if (simpleWorks) {
    console.log('\n⚠️  PARTIAL SUPPORT');
    console.log('- Structured output works but may not extract PTAB-specific fields');
    console.log('- Consider hybrid approach: structured for general fields, regex for specific');
  } else {
    console.log('\n❌ KEEP CURRENT APPROACH');
    console.log('- Structured output not available or not working');
    console.log('- Continue using manual regex extraction');
    console.log('- Current implementation is working well');
  }
  
  console.log('\n📝 Implementation notes:');
  console.log('- Use "text: true" instead of "contents: { text: true }"');
  console.log('- Use "num_results" instead of "numResults"');
  console.log('- Use "include_domains" instead of "includeDomains"');
  console.log('- Summary schema should include field descriptions');
}

runTests().catch(console.error);