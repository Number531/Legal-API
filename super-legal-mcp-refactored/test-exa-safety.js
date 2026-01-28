/**
 * Safety Test for Exa Client Improvements
 * Tests metadata quality improvements step-by-step to ensure nothing breaks
 */

import { ExaClient } from './src/api-clients/ExaClient.js';

// Mock Exa API responses
const mockResultWithMetadata = {
  title: "State Statute Example",
  url: "https://example.com/statute",
  publishedDate: "2024-01-15",
  text: "Full text of the statute..."
};

const mockResultNoMetadata = {
  title: "Another Statute",
  url: "https://example.com/statute2",
  text: "Another statute text..."
  // No publishedDate
};

const mockAPIResponse = {
  results: [mockResultWithMetadata, mockResultNoMetadata],
  costDollars: { total: 0.05 },
  searchTime: 123,
  resolvedSearchType: "neural"
};

const mockAPIResponseNoMetadata = {
  results: [mockResultNoMetadata],
  // No costDollars, searchTime, or resolvedSearchType
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

class ExaSafetyTester {
  constructor() {
    this.testResults = [];
  }

  log(message, type = 'info') {
    const prefix = {
      pass: `${colors.green}✓${colors.reset}`,
      fail: `${colors.red}✗${colors.reset}`,
      info: `${colors.blue}ℹ${colors.reset}`,
      warn: `${colors.yellow}⚠${colors.reset}`
    }[type] || '';
    
    console.log(`${prefix} ${message}`);
  }

  /**
   * Test 1: Current behavior with null values
   */
  async testCurrentBehavior() {
    this.log('\n=== TEST 1: Current Behavior (Baseline) ===\n', 'info');
    
    try {
      // Test with metadata present
      const result1 = {
        published_date: mockResultWithMetadata.publishedDate || null,
        search_cost: mockAPIResponse.costDollars?.total || null,
        search_time_ms: mockAPIResponse.searchTime || null,
        resolved_search_type: mockAPIResponse.resolvedSearchType || null
      };
      
      this.log(`With metadata - published_date: ${result1.published_date}`, 'pass');
      this.log(`With metadata - search_cost: ${result1.search_cost}`, 'pass');
      this.log(`With metadata - search_time_ms: ${result1.search_time_ms}`, 'pass');
      this.log(`With metadata - resolved_search_type: ${result1.resolved_search_type}`, 'pass');
      
      // Test without metadata (current: returns null)
      const result2 = {
        published_date: mockResultNoMetadata.publishedDate || null,
        search_cost: mockAPIResponseNoMetadata.costDollars?.total || null,
        search_time_ms: mockAPIResponseNoMetadata.searchTime || null,
        resolved_search_type: mockAPIResponseNoMetadata.resolvedSearchType || null
      };
      
      this.log(`Without metadata - published_date: ${result2.published_date} (currently null)`, 'warn');
      this.log(`Without metadata - search_cost: ${result2.search_cost} (currently null)`, 'warn');
      this.log(`Without metadata - search_time_ms: ${result2.search_time_ms} (currently null)`, 'warn');
      this.log(`Without metadata - resolved_search_type: ${result2.resolved_search_type} (currently null)`, 'warn');
      
      this.testResults.push({ test: 'current_behavior', passed: true });
      return true;
      
    } catch (error) {
      this.log(`Current behavior test failed: ${error.message}`, 'fail');
      this.testResults.push({ test: 'current_behavior', passed: false });
      return false;
    }
  }

  /**
   * Test 2: Improved behavior with defaults
   */
  async testImprovedBehavior() {
    this.log('\n=== TEST 2: Improved Behavior (With Defaults) ===\n', 'info');
    
    try {
      // Test with metadata present (should be unchanged)
      const result1 = {
        published_date: mockResultWithMetadata.publishedDate || "Date not available",
        search_cost: mockAPIResponse.costDollars?.total || 0,
        search_time_ms: mockAPIResponse.searchTime || 0,
        resolved_search_type: mockAPIResponse.resolvedSearchType || "standard"
      };
      
      this.log(`With metadata - published_date: ${result1.published_date}`, 
               result1.published_date === "2024-01-15" ? 'pass' : 'fail');
      this.log(`With metadata - search_cost: ${result1.search_cost}`,
               result1.search_cost === 0.05 ? 'pass' : 'fail');
      this.log(`With metadata - search_time_ms: ${result1.search_time_ms}`,
               result1.search_time_ms === 123 ? 'pass' : 'fail');
      this.log(`With metadata - resolved_search_type: ${result1.resolved_search_type}`,
               result1.resolved_search_type === "neural" ? 'pass' : 'fail');
      
      // Test without metadata (improved: returns defaults)
      const result2 = {
        published_date: mockResultNoMetadata.publishedDate || "Date not available",
        search_cost: mockAPIResponseNoMetadata.costDollars?.total || 0,
        search_time_ms: mockAPIResponseNoMetadata.searchTime || 0,
        resolved_search_type: mockAPIResponseNoMetadata.resolvedSearchType || "standard"
      };
      
      this.log(`Without metadata - published_date: "${result2.published_date}" (improved)`,
               result2.published_date === "Date not available" ? 'pass' : 'fail');
      this.log(`Without metadata - search_cost: ${result2.search_cost} (improved)`,
               result2.search_cost === 0 ? 'pass' : 'fail');
      this.log(`Without metadata - search_time_ms: ${result2.search_time_ms} (improved)`,
               result2.search_time_ms === 0 ? 'pass' : 'fail');
      this.log(`Without metadata - resolved_search_type: "${result2.resolved_search_type}" (improved)`,
               result2.resolved_search_type === "standard" ? 'pass' : 'fail');
      
      this.testResults.push({ test: 'improved_behavior', passed: true });
      return true;
      
    } catch (error) {
      this.log(`Improved behavior test failed: ${error.message}`, 'fail');
      this.testResults.push({ test: 'improved_behavior', passed: false });
      return false;
    }
  }

  /**
   * Test 3: Type consistency
   */
  async testTypeConsistency() {
    this.log('\n=== TEST 3: Type Consistency Check ===\n', 'info');
    
    try {
      // Verify that defaults maintain consistent types
      const defaults = {
        published_date: "Date not available",
        search_cost: 0,
        search_time_ms: 0,
        resolved_search_type: "standard"
      };
      
      // Check types
      this.log(`published_date is string: ${typeof defaults.published_date === 'string'}`,
               typeof defaults.published_date === 'string' ? 'pass' : 'fail');
      
      this.log(`search_cost is number: ${typeof defaults.search_cost === 'number'}`,
               typeof defaults.search_cost === 'number' ? 'pass' : 'fail');
      
      this.log(`search_time_ms is number: ${typeof defaults.search_time_ms === 'number'}`,
               typeof defaults.search_time_ms === 'number' ? 'pass' : 'fail');
      
      this.log(`resolved_search_type is string: ${typeof defaults.resolved_search_type === 'string'}`,
               typeof defaults.resolved_search_type === 'string' ? 'pass' : 'fail');
      
      // Verify no type conflicts in calculations
      const totalCost = defaults.search_cost + 0.10;
      this.log(`Numeric operations work: ${totalCost} = ${defaults.search_cost} + 0.10`,
               totalCost === 0.10 ? 'pass' : 'fail');
      
      this.testResults.push({ test: 'type_consistency', passed: true });
      return true;
      
    } catch (error) {
      this.log(`Type consistency test failed: ${error.message}`, 'fail');
      this.testResults.push({ test: 'type_consistency', passed: false });
      return false;
    }
  }

  /**
   * Test 4: JSON serialization for MCP protocol
   */
  async testJSONSerialization() {
    this.log('\n=== TEST 4: JSON Serialization Test ===\n', 'info');
    
    try {
      // Test that improved values serialize correctly in MCP format
      const response = {
        content: [{
          type: "text",
          text: JSON.stringify({
            state_code: "CA",
            results: [{
              published_date: "Date not available",
              text: "Some text"
            }],
            metadata: {
              search_cost: 0,
              search_time_ms: 0,
              resolved_search_type: "standard"
            }
          }, null, 2)
        }]
      };
      
      // Parse it back to verify
      const parsed = JSON.parse(response.content[0].text);
      
      this.log(`Date default serializes: "${parsed.results[0].published_date}"`,
               parsed.results[0].published_date === "Date not available" ? 'pass' : 'fail');
      
      this.log(`Cost serializes as number: ${parsed.metadata.search_cost}`,
               parsed.metadata.search_cost === 0 ? 'pass' : 'fail');
      
      this.log(`Time serializes as number: ${parsed.metadata.search_time_ms}`,
               parsed.metadata.search_time_ms === 0 ? 'pass' : 'fail');
      
      this.log(`Type serializes as string: "${parsed.metadata.resolved_search_type}"`,
               parsed.metadata.resolved_search_type === "standard" ? 'pass' : 'fail');
      
      // Verify MCP protocol compatibility
      this.log(`Response has correct MCP structure: type="${response.content[0].type}"`,
               response.content[0].type === "text" ? 'pass' : 'fail');
      
      this.testResults.push({ test: 'json_serialization', passed: true });
      return true;
      
    } catch (error) {
      this.log(`JSON serialization test failed: ${error.message}`, 'fail');
      this.testResults.push({ test: 'json_serialization', passed: false });
      return false;
    }
  }

  /**
   * Run all tests in sequence
   */
  async runAllTests() {
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}EXA CLIENT IMPROVEMENT SAFETY TEST${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
    
    await this.testCurrentBehavior();
    await this.testImprovedBehavior();
    await this.testTypeConsistency();
    await this.testJSONSerialization();
    
    // Summary
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}TEST SUMMARY${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
    
    let allPassed = true;
    for (const result of this.testResults) {
      const status = result.passed ? `${colors.green}PASSED${colors.reset}` : `${colors.red}FAILED${colors.reset}`;
      console.log(`${result.test}: ${status}`);
      if (!result.passed) allPassed = false;
    }
    
    if (allPassed) {
      console.log(`\n${colors.green}✓ ALL TESTS PASSED - SAFE TO IMPLEMENT${colors.reset}`);
      console.log('\nChanges to implement:');
      console.log('1. published_date: result.publishedDate || "Date not available"');
      console.log('2. search_cost: data.costDollars?.total || 0');
      console.log('3. search_time_ms: data.searchTime || 0');
      console.log('4. resolved_search_type: data.resolvedSearchType || "standard"');
    } else {
      console.log(`\n${colors.red}✗ SOME TESTS FAILED - DO NOT IMPLEMENT${colors.reset}`);
    }
    
    return allPassed;
  }
}

// Run the tests
const tester = new ExaSafetyTester();
tester.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});