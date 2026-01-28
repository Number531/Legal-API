/**
 * Test file for Exa Structured Outputs
 * This tests the viability of using Exa's structured output feature
 * for PTAB data extraction before modifying production code
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const EXA_API_KEY = process.env.EXA_API_KEY || 'dbcb656b-61e0-48c2-8237-b9205b1b84db';

if (!EXA_API_KEY) {
  console.error('ERROR: EXA_API_KEY not found in environment variables');
  process.exit(1);
}

/**
 * Test 1: Basic structured output for PTAB proceedings
 */
async function testStructuredPTABSearch() {
  console.log('\n=== Test 1: Structured Output for PTAB Proceedings ===\n');
  
  const requestBody = {
    query: 'IPR Samsung Netlist patent trial',
    type: 'auto',
    numResults: 3,
    includeDomains: [
      'trials.uspto.gov',
      'ptabsearch.uspto.gov',
      'ptab.uspto.gov'
    ],
    contents: {
      text: true,
      summary: {
        schema: {
          type: 'object',
          required: ['proceeding_number'],
          properties: {
            proceeding_number: {
              type: 'string',
              description: 'PTAB proceeding number in format like IPR2022-00063'
            },
            patent_number: {
              type: 'string',
              description: 'US Patent number without country code'
            },
            petitioner: {
              type: 'string',
              description: 'Name of the petitioner company'
            },
            patent_owner: {
              type: 'string',
              description: 'Name of the patent owner company'
            },
            document_type: {
              type: 'string',
              description: 'Type of document (Institution Decision, Final Written Decision, etc.)'
            },
            decision_date: {
              type: 'string',
              description: 'Date of the decision or filing'
            },
            status: {
              type: 'string',
              description: 'Current status of the proceeding'
            }
          }
        }
      }
    }
  };

  try {
    console.log('Sending request to Exa API with structured output schema...\n');
    
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
      console.error(`API Error (${response.status}):`, error);
      return null;
    }

    const data = await response.json();
    
    console.log('Response received. Analyzing structured outputs...\n');
    console.log('Number of results:', data.results?.length || 0);
    
    if (data.results && data.results.length > 0) {
      data.results.forEach((result, index) => {
        console.log(`\n--- Result ${index + 1} ---`);
        console.log('URL:', result.url);
        console.log('Title:', result.title);
        
        // Check if structured summary exists
        if (result.summary) {
          console.log('\n✅ STRUCTURED DATA EXTRACTED:');
          console.log(JSON.stringify(result.summary, null, 2));
        } else {
          console.log('\n❌ No structured summary in response');
        }
        
        // Show snippet of text for comparison
        if (result.text) {
          console.log('\nText snippet (first 200 chars):');
          console.log(result.text.substring(0, 200) + '...');
        }
      });
    }
    
    return data;
  } catch (error) {
    console.error('Request failed:', error.message);
    return null;
  }
}

/**
 * Test 2: Compare with current manual extraction approach
 */
async function testCurrentApproach() {
  console.log('\n=== Test 2: Current Manual Extraction Approach ===\n');
  
  const requestBody = {
    query: 'IPR Samsung Netlist patent trial',
    numResults: 3,
    includeDomains: [
      'trials.uspto.gov',
      'ptabsearch.uspto.gov',
      'ptab.uspto.gov'
    ],
    contents: {
      text: true
    }
  };

  try {
    console.log('Sending request with basic text content...\n');
    
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
      console.error(`API Error (${response.status}):`, error);
      return null;
    }

    const data = await response.json();
    
    console.log('Response received. Applying manual extraction...\n');
    
    if (data.results && data.results.length > 0) {
      data.results.forEach((result, index) => {
        console.log(`\n--- Result ${index + 1} ---`);
        console.log('URL:', result.url);
        
        // Manual extraction with regex (simplified version)
        const text = result.text || '';
        const title = result.title || '';
        const combined = `${title} ${text}`;
        
        // Extract proceeding number
        const proceedingMatch = combined.match(/\b(IPR\d{4}-\d{5})\b/i);
        const patentMatch = combined.match(/(?:Patent No\.|Patent)\s*([0-9,]+)/i);
        
        console.log('\n📝 MANUALLY EXTRACTED:');
        console.log('Proceeding:', proceedingMatch ? proceedingMatch[1] : 'Not found');
        console.log('Patent:', patentMatch ? patentMatch[1] : 'Not found');
        
        // Try to extract parties
        const petitionerMatch = combined.match(/([A-Z][A-Za-z\s\.,&]+(?:Inc\.|LLC|Ltd\.|Corporation|Corp\.|Co\.)?),?\s+Petitioner/i);
        const ownerMatch = combined.match(/v\.\s+([A-Z][A-Za-z\s\.,&]+(?:Inc\.|LLC|Ltd\.|Corporation|Corp\.|Co\.)?)/i);
        
        console.log('Petitioner:', petitionerMatch ? petitionerMatch[1].trim() : 'Not found');
        console.log('Patent Owner:', ownerMatch ? ownerMatch[1].trim() : 'Not found');
      });
    }
    
    return data;
  } catch (error) {
    console.error('Request failed:', error.message);
    return null;
  }
}

/**
 * Test 3: Test with search_and_contents endpoint
 */
async function testSearchAndContents() {
  console.log('\n=== Test 3: Search and Contents Endpoint ===\n');
  
  const requestBody = {
    query: 'IPR2022-00063 Samsung Netlist Final Written Decision',
    type: 'auto',
    numResults: 2,
    includeDomains: ['trials.uspto.gov', 'ptabsearch.uspto.gov'],
    text: true,
    summary: {
      schema: {
        type: 'object',
        properties: {
          proceeding_info: {
            type: 'object',
            properties: {
              number: { type: 'string', description: 'IPR/PGR/CBM proceeding number' },
              petitioner: { type: 'string', description: 'Petitioner name' },
              patent_owner: { type: 'string', description: 'Patent owner name' },
              patent: { type: 'string', description: 'Patent number' }
            }
          },
          decision: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Institution or Final Written Decision' },
              date: { type: 'string', description: 'Decision date' },
              outcome: { type: 'string', description: 'Decision outcome or status' }
            }
          }
        }
      }
    }
  };

  try {
    // Note: The search_and_contents endpoint might be different
    // Try both /search and /search_and_contents
    console.log('Testing search_and_contents endpoint...\n');
    
    const response = await fetch('https://api.exa.ai/search_and_contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': EXA_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // If search_and_contents doesn't work, fall back to search
      console.log('search_and_contents endpoint not available, trying /search...\n');
      
      const searchResponse = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': EXA_API_KEY
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!searchResponse.ok) {
        const error = await searchResponse.text();
        console.error(`API Error (${searchResponse.status}):`, error);
        return null;
      }
      
      const data = await searchResponse.json();
      console.log('Results from /search endpoint:');
      console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
      return data;
    }

    const data = await response.json();
    console.log('Results from /search_and_contents endpoint:');
    console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
    return data;
    
  } catch (error) {
    console.error('Request failed:', error.message);
    return null;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🧪 TESTING EXA STRUCTURED OUTPUTS FOR PTAB DATA');
  console.log('=' .repeat(50));
  console.log('API Key:', EXA_API_KEY.substring(0, 8) + '...');
  
  // Test 1: Structured output
  const structuredResult = await testStructuredPTABSearch();
  
  // Test 2: Current approach
  const manualResult = await testCurrentApproach();
  
  // Test 3: Search and contents endpoint
  const searchContentsResult = await testSearchAndContents();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  console.log('\n1. Structured Output Test:', structuredResult ? '✅ Response received' : '❌ Failed');
  if (structuredResult?.results?.[0]?.summary) {
    console.log('   - Structured data extraction: ✅ WORKING');
  } else {
    console.log('   - Structured data extraction: ❌ NOT AVAILABLE');
  }
  
  console.log('\n2. Manual Extraction Test:', manualResult ? '✅ Response received' : '❌ Failed');
  
  console.log('\n3. Search & Contents Test:', searchContentsResult ? '✅ Response received' : '❌ Failed');
  
  console.log('\n📝 RECOMMENDATIONS:');
  if (structuredResult?.results?.[0]?.summary) {
    console.log('✅ Structured outputs are supported! Consider migrating to this approach.');
    console.log('   Benefits: Cleaner code, better accuracy, no regex maintenance');
  } else {
    console.log('⚠️ Structured outputs may not be available with current API plan.');
    console.log('   Current manual extraction is working and should be maintained.');
  }
}

// Run tests
runAllTests().catch(console.error);