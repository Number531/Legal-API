/**
 * PTAB API Diagnostic Tool
 * Use this to test different PTAB API endpoints and find the correct configuration
 */

const USPTO_API_KEY = process.env.USPTO_API_KEY;

// Possible base URLs based on USPTO documentation
const BASE_URLS = [
  'https://developer.uspto.gov/api/ptab/v2',
  'https://developer.uspto.gov/ptab-api/v2',
  'https://developer.uspto.gov/ptab-web/api/v2',
  'https://data.uspto.gov/ptab-api/v2',
  'https://developer.uspto.gov/ptab/v2',
  'https://api.uspto.gov/ptab/v2'
];

// Possible endpoint patterns
const ENDPOINTS = [
  '/proceedings/search',
  '/search',
  '/trials',
  '/documents',
  '/decisions',
  '/proceedings',
  ''  // Test base URL directly
];

async function testEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint}`;
  
  try {
    // Test both with and without auth
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (USPTO_API_KEY) {
      headers['X-Api-Key'] = USPTO_API_KEY;
      headers['Authorization'] = `Bearer ${USPTO_API_KEY}`;
    }
    
    const response = await fetch(url, {
      method: endpoint.includes('search') ? 'POST' : 'GET',
      headers,
      body: endpoint.includes('search') ? JSON.stringify({
        limit: 1,
        proceedingType: 'IPR'
      }) : undefined
    });
    
    return {
      url,
      status: response.status,
      statusText: response.statusText,
      success: response.status >= 200 && response.status < 300
    };
  } catch (error) {
    return {
      url,
      status: 'ERROR',
      statusText: error.message,
      success: false
    };
  }
}

export async function runPTABDiagnostic() {
  console.log('Starting PTAB API Diagnostic...');
  console.log('USPTO_API_KEY present:', !!USPTO_API_KEY);
  console.log('---');
  
  const results = [];
  
  for (const baseUrl of BASE_URLS) {
    for (const endpoint of ENDPOINTS) {
      const result = await testEndpoint(baseUrl, endpoint);
      results.push(result);
      
      console.log(`${result.success ? '✅' : '❌'} ${result.url}`);
      console.log(`   Status: ${result.status} ${result.statusText}`);
      
      if (result.success) {
        console.log('   🎉 FOUND WORKING ENDPOINT!');
      }
    }
  }
  
  const workingEndpoints = results.filter(r => r.success);
  
  console.log('\n=== SUMMARY ===');
  if (workingEndpoints.length > 0) {
    console.log('Working endpoints found:');
    workingEndpoints.forEach(ep => {
      console.log(`  ✅ ${ep.url}`);
    });
  } else {
    console.log('❌ No working endpoints found');
    console.log('This could mean:');
    console.log('  1. API key is invalid or missing');
    console.log('  2. PTAB API requires different authentication');
    console.log('  3. PTAB API has been deprecated');
    console.log('  4. Endpoints require specific request format');
  }
  
  return results;
}

// Run diagnostic if this file is executed directly
runPTABDiagnostic().catch(console.error);