/**
 * Mock tests for USPTO Web Search Client
 * Tests all 6 tool methods with mocked Exa API responses
 */

import { UsptoWebSearchClient } from '../src/api-clients/UsptoWebSearchClient.js';

// Mock rate limiter
class MockRateLimiter {
  async enforce() {
    // Mock rate limiting - no delay in tests
    return Promise.resolve();
  }
}

// Mock Exa API responses for different patent scenarios
const mockPatentResults = [
  {
    id: 'patent-1',
    title: 'US10123456B2 - Artificial Intelligence System for Data Processing',
    url: 'https://patents.uspto.gov/patent/documents/US10123456B2',
    text: `
      ABSTRACT
      An artificial intelligence system comprising a neural network configured to process large datasets and extract meaningful patterns. The system includes machine learning algorithms optimized for real-time data analysis.
      
      INVENTORS
      Smith, John A. (San Francisco, CA)
      Johnson, Mary B. (Palo Alto, CA)
      
      ASSIGNEE
      Tech Innovations Inc. (Mountain View, CA)
      
      CPC: G06N3/08, G06N3/04
      USPC: 706/15
      Publication Date: 2024-01-15
    `
  },
  {
    id: 'patent-2', 
    title: 'US20230098765A1 - Method for Wireless Communication Enhancement',
    url: 'https://patents.google.com/patent/US20230098765A1',
    text: `
      ABSTRACT
      A method for enhancing wireless communication by implementing advanced signal processing techniques. The invention provides improved data transmission rates and reduced interference.
      
      INVENTORS
      Chen, Wei (Beijing, CN)
      Williams, Robert (Austin, TX)
      
      ASSIGNEE
      Wireless Solutions Corp. (Dallas, TX)
      
      CPC: H04B7/04, H04L27/26
      IPC: H04B7/04
      Publication Date: 2023-08-22
    `
  }
];

const mockCPCResults = [
  {
    id: 'cpc-1',
    title: 'CPC Classification G06N - Computing arrangements based on specific computational models',
    url: 'https://www.uspto.gov/web/patents/classification/cpc/html/cpc-G06N.html',
    text: `
      G06N COMPUTING ARRANGEMENTS BASED ON SPECIFIC COMPUTATIONAL MODELS
      
      This subclass covers:
      - Neural networks
      - Machine learning
      - Artificial intelligence systems
      - Knowledge representation
      
      Examples:
      G06N3/08 - Learning methods
      G06N3/04 - Architecture
      G06N20/00 - Machine learning
    `
  }
];

const mockLocationResults = [
  {
    id: 'location-1',
    title: 'California Patents - Top Innovation Hub',
    url: 'https://patents.google.com/patents/location/california',
    text: `
      California Patent Statistics
      
      Total patents: 145,623
      Top cities:
      - San Francisco: 25,432 patents
      - Palo Alto: 18,765 patents
      - Mountain View: 12,987 patents
      
      Major assignees:
      - Apple Inc.: 8,234 patents
      - Google LLC: 6,543 patents
      - Intel Corporation: 5,432 patents
    `
  }
];

// Extended mock client for testing
class MockUsptoWebSearchClient extends UsptoWebSearchClient {
  constructor() {
    super(new MockRateLimiter(), 'mock-exa-key');
  }

  // Override executeExaSearch with mock responses
  async executeExaSearch(query, limit, includeContents) {
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate API delay

    // Determine response type based on query content
    if (query.includes('CPC')) {
      return mockCPCResults.slice(0, limit);
    } else if (query.includes('location')) {
      return mockLocationResults.slice(0, limit);
    } else {
      return mockPatentResults.slice(0, limit);
    }
  }
}

// Test suite
async function runMockTests() {
  console.log('🧪 Running USPTO Web Search Client Mock Tests...\n');
  
  const client = new MockUsptoWebSearchClient();
  let testsRun = 0;
  let testsPassed = 0;

  // Helper function to run a test
  const runTest = async (testName, testFunction) => {
    testsRun++;
    try {
      await testFunction();
      console.log(`✅ ${testName}`);
      testsPassed++;
    } catch (error) {
      console.error(`❌ ${testName}: ${error.message}`);
    }
  };

  // Test 1: Basic patent search
  await runTest('Patent search with basic parameters', async () => {
    const result = await client.searchPatentsWeb({
      search_text: 'artificial intelligence',
      limit: 5
    });
    
    const parsed = JSON.parse(result.content[0].text);
    if (parsed.search_type !== 'uspto_patents_web') {
      throw new Error('Wrong search type');
    }
    if (parsed.results.length === 0) {
      throw new Error('No results returned');
    }
    if (!parsed.results[0].patent_number) {
      throw new Error('Patent number not extracted');
    }
  });

  // Test 2: Patent search with inventor filter
  await runTest('Patent search with inventor filter', async () => {
    const result = await client.searchPatentsWeb({
      inventor_name: 'Smith, John',
      assignee_organization: 'Tech Innovations Inc',
      limit: 3
    });
    
    const parsed = JSON.parse(result.content[0].text);
    if (parsed.results[0].inventors.length === 0) {
      throw new Error('No inventors found');
    }
  });

  // Test 3: Patent search with snippet
  await runTest('Patent search with snippet extraction', async () => {
    const result = await client.searchPatentsWeb({
      search_text: 'neural network',
      include_snippet: true,
      limit: 2
    });
    
    const parsed = JSON.parse(result.content[0].text);
    if (!parsed.results[0].snippet) {
      throw new Error('Snippet not extracted');
    }
    if (parsed.results[0].snippet.length > 500) {
      throw new Error('Snippet too long');
    }
  });

  // Test 4: Patent locations search
  await runTest('Patent locations search', async () => {
    const result = await client.searchPatentLocationsWeb({
      location_state: 'California',
      location_country: 'US',
      limit: 5
    });
    
    const parsed = JSON.parse(result.content[0].text);
    if (parsed.search_type !== 'uspto_locations_web') {
      throw new Error('Wrong search type');
    }
    if (parsed.results[0].location_state !== 'California') {
      throw new Error('Location filter not applied');
    }
  });

  // Test 5: CPC classifications search
  await runTest('CPC classifications search', async () => {
    const result = await client.searchCPCClassificationsWeb({
      cpc_section: 'G',
      search_text: 'neural networks',
      limit: 3
    });
    
    const parsed = JSON.parse(result.content[0].text);
    if (parsed.search_type !== 'uspto_cpc_web') {
      throw new Error('Wrong search type');
    }
    if (!parsed.results[0].cpc_subclass_title.includes('neural')) {
      throw new Error('CPC classification not matched');
    }
  });

  // Test 6: CPC groups search
  await runTest('CPC groups search', async () => {
    const result = await client.searchCPCGroupsWeb({
      cpc_subclass_id: 'G06N',
      search_text: 'machine learning',
      limit: 2
    });
    
    const parsed = JSON.parse(result.content[0].text);
    if (parsed.search_type !== 'uspto_cpc_groups_web') {
      throw new Error('Wrong search type');
    }
  });

  // Test 7: USPC classifications search
  await runTest('USPC classifications search', async () => {
    const result = await client.searchUSPCClassificationsWeb({
      classification_type: 'mainclass',
      uspc_mainclass_id: '706',
      search_text: 'artificial intelligence',
      limit: 3
    });
    
    const parsed = JSON.parse(result.content[0].text);
    if (parsed.search_type !== 'uspto_uspc_web') {
      throw new Error('Wrong search type');
    }
    if (!parsed.uspc_mainclasses) {
      throw new Error('USPC mainclasses not returned');
    }
  });

  // Test 8: WIPO classifications search
  await runTest('WIPO classifications search', async () => {
    const result = await client.searchWIPOClassificationsWeb({
      wipo_field_id: '06',
      search_text: 'computer technology',
      limit: 2
    });
    
    const parsed = JSON.parse(result.content[0].text);
    if (parsed.search_type !== 'uspto_wipo_web') {
      throw new Error('Wrong search type');
    }
    if (parsed.results[0].field_title !== 'computer technology') {
      throw new Error('WIPO field not matched');
    }
  });

  // Test 9: Query building validation
  await runTest('Query building with multiple parameters', async () => {
    const query = client.buildPatentQuery({
      search_text: 'artificial intelligence',
      inventor_name: 'Smith, John',
      assignee_organization: 'Tech Corp',
      cpc_code: 'G06N',
      patent_date_start: '2020-01-01',
      patent_date_end: '2024-12-31'
    });
    
    if (!query.includes('site:uspto.gov')) {
      throw new Error('USPTO domain not included');
    }
    if (!query.includes('site:patents.google.com')) {
      throw new Error('Google Patents not included');
    }
    if (!query.includes('artificial intelligence')) {
      throw new Error('Search text not included');
    }
    if (!query.includes('after:2020-01-01')) {
      throw new Error('Date filtering not applied');
    }
  });

  // Test 10: Metadata extraction validation
  await runTest('Patent metadata extraction', async () => {
    const mockResult = {
      title: 'US10123456B2 - AI System',
      text: `
        US10123456B2
        Inventors: Smith, John A. (San Francisco, CA); Johnson, Mary B. (Palo Alto, CA)
        Assignee: Tech Innovations Inc. (Mountain View, CA)
        CPC: G06N3/08, G06N3/04
        USPC: 706/15
        Publication Date: 2024-01-15
        ABSTRACT
        An artificial intelligence system for data processing.
      `
    };
    
    const metadata = client.extractPatentMetadata(mockResult);
    
    if (!metadata.patent_number) {
      throw new Error('Patent number not extracted');
    }
    if (metadata.inventors.length !== 2) {
      throw new Error('Wrong number of inventors extracted');
    }
    if (!metadata.assignee_organization.includes('Tech Innovations')) {
      throw new Error('Assignee not extracted correctly');
    }
    if (metadata.cpc_classifications.length === 0) {
      throw new Error('CPC classifications not extracted');
    }
  });

  // Test 11: Smart snippet extraction
  await runTest('Smart snippet extraction prioritization', async () => {
    const mockText = `
      US Patent 10123456
      BACKGROUND
      This is background information.
      ABSTRACT
      This is the most important abstract content that should be prioritized.
      CLAIMS
      1. A system comprising...
      DETAILED DESCRIPTION
      Long detailed description follows.
    `;
    
    const snippet = client.extractSmartSnippet(mockText, 100);
    
    if (!snippet.includes('abstract')) {
      throw new Error('Abstract not prioritized in snippet');
    }
    if (snippet.length > 103) { // 100 + '...'
      throw new Error('Snippet not properly truncated');
    }
  });

  // Test 12: Error handling
  await runTest('Error handling with invalid parameters', async () => {
    try {
      // Test with null parameters
      await client.searchPatentsWeb(null);
      // Should not throw error, should use defaults
    } catch (error) {
      throw new Error('Should handle null parameters gracefully');
    }
    
    // Test empty result handling
    client.executeExaSearch = async () => [];
    const result = await client.searchPatentsWeb({ search_text: 'nonexistent' });
    const parsed = JSON.parse(result.content[0].text);
    if (parsed.results.length !== 0) {
      throw new Error('Should handle empty results');
    }
  });

  // Print test results
  console.log(`\n📊 Mock Test Results: ${testsPassed}/${testsRun} tests passed`);
  
  if (testsPassed === testsRun) {
    console.log('🎉 All mock tests passed!');
    return true;
  } else {
    console.log(`❌ ${testsRun - testsPassed} tests failed`);
    return false;
  }
}

// Run the tests
runMockTests().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});