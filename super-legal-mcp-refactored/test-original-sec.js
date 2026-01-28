// Test script to understand why original works
// This replicates the EXACT logic from the original index.js

class TestOriginalSEC {
  constructor() {
    this.apiConfigs = {
      sec_edgar: {
        baseUrl: "https://data.sec.gov/api",
        requiresAuth: false,
        headers: {
          'User-Agent': 'Enhanced-Legal-MCP/1.0.0 (contact@yourorg.com)',
          'Accept': 'application/json'
        }
      }
    };
  }

  async makeApiRequest(endpoint, params = {}, options = {}) {
    const { apiType = 'sec_edgar' } = options;
    const config = this.apiConfigs[apiType];
    const url = new URL(`${config.baseUrl}${endpoint}`);
    const headers = { ...config.headers };
    
    console.log(`Testing URL: ${url.toString()}`);
    
    const response = await fetch(url.toString(), { headers });
    
    if (!response.ok) {
      console.error(`Failed: ${response.status} ${response.statusText}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  async resolveToCIK(identifier) {
    if (/^\d{10}$/.test(identifier)) {
      return identifier;
    }
    
    // This is EXACTLY what the original does
    const tickersResponse = await this.makeApiRequest(
      '/company_tickers.json',
      {},
      { apiType: 'sec_edgar' }
    );
    
    const companies = Object.values(tickersResponse);
    const upperIdentifier = identifier.toUpperCase();
    
    let company = companies.find((c) => c.ticker === upperIdentifier);
    
    if (!company) {
      company = companies.find((c) => 
        c.title.toUpperCase().includes(upperIdentifier) ||
        upperIdentifier.includes(c.title.toUpperCase())
      );
    }
    
    if (!company) {
      throw new Error(`Could not find company matching: ${identifier}`);
    }
    
    return String(company.cik_str);
  }

  async searchSECFilings(company_identifier) {
    try {
      console.log('Step 1: Resolving CIK for:', company_identifier);
      const cik = await this.resolveToCIK(company_identifier);
      console.log('Step 2: Got CIK:', cik);
      
      // Get company submissions
      const submissionsResponse = await this.makeApiRequest(
        `/submissions/CIK${cik.padStart(10, '0')}.json`,
        {},
        { apiType: 'sec_edgar' }
      );
      
      console.log('Success! Got submissions for:', submissionsResponse.name);
      return true;
    } catch (error) {
      console.error('Failed:', error.message);
      return false;
    }
  }
}

// Test it
async function test() {
  const tester = new TestOriginalSEC();
  
  console.log('\n=== Testing Original Logic ===\n');
  
  // Test 1: Try to resolve AAPL
  console.log('Test 1: Resolve AAPL to CIK');
  try {
    const cik = await tester.resolveToCIK('AAPL');
    console.log('✅ SUCCESS: AAPL resolved to CIK:', cik);
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  // Test 2: Try full filing search
  console.log('\nTest 2: Search SEC filings for AAPL');
  const result = await tester.searchSECFilings('AAPL');
  if (result) {
    console.log('✅ Filing search succeeded!');
  } else {
    console.log('❌ Filing search failed');
  }
}

test().catch(console.error);