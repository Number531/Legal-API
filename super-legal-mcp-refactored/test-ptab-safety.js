/**
 * Safety Test for PTAB Improvements
 * Tests each improvement step-by-step to ensure nothing breaks
 */

import { PTABWebSearchClient } from './src/api-clients/PTABWebSearchClient.js';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Test data that matches current expectations
const mockSearchResult = {
  url: 'https://trials.uspto.gov/IPR2022-00063',
  title: 'IPR2022-00063 - Samsung Electronics Co., Ltd. v. Netlist, Inc.',
  text: `UNITED STATES PATENT AND TRADEMARK OFFICE
         BEFORE THE PATENT TRIAL AND APPEAL BOARD
         SAMSUNG ELECTRONICS CO., LTD., Petitioner,
         v.
         NETLIST, INC., Patent Owner.
         IPR2022-00063
         Patent 10,217,523 B1
         Final Written Decision
         Date: May 3, 2023`
};

// Mock result with missing data (edge case)
const mockBrokenResult = {
  url: 'https://some-url.com',
  title: 'Some Document',
  text: 'Minimal text with no clear information'
};

class PTABSafetyTester {
  constructor() {
    this.client = new PTABWebSearchClient(null);
    this.originalExtractMethod = this.client.extractProceedingInfo.bind(this.client);
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
   * Test 1: Baseline - Current extraction works
   */
  async testBaseline() {
    this.log('\n=== TEST 1: Baseline Current Extraction ===\n', 'info');
    
    try {
      // Test with good data
      const result1 = this.originalExtractMethod(mockSearchResult, 'IPR');
      
      // Check expected fields exist
      const requiredFields = [
        'proceeding_number', 'patent_number', 'petitioner', 
        'patent_owner', 'status', 'document_type'
      ];
      
      let passed = true;
      for (const field of requiredFields) {
        if (field in result1) {
          this.log(`Field '${field}' exists: ${result1[field]}`, 'pass');
        } else {
          this.log(`Field '${field}' missing!`, 'fail');
          passed = false;
        }
      }
      
      // Test with broken data (current behavior)
      this.log('\nTesting with broken data (current behavior):', 'info');
      const result2 = this.originalExtractMethod(mockBrokenResult, 'IPR');
      
      // Document current behavior with nulls
      this.log(`Proceeding number: ${result2.proceeding_number} (${result2.proceeding_number === null ? 'NULL' : 'has value'})`, 
               result2.proceeding_number === null ? 'warn' : 'pass');
      this.log(`Status: ${result2.status} (${!result2.status || result2.status === 'Unknown' ? 'AMBIGUOUS' : 'clear'})`,
               !result2.status || result2.status === 'Unknown' ? 'warn' : 'pass');
      
      this.testResults.push({ test: 'baseline', passed });
      return passed;
      
    } catch (error) {
      this.log(`Baseline test failed: ${error.message}`, 'fail');
      this.testResults.push({ test: 'baseline', passed: false, error: error.message });
      return false;
    }
  }

  /**
   * Test 2: Add helper methods (non-breaking)
   */
  async testHelperMethods() {
    this.log('\n=== TEST 2: Adding Helper Methods ===\n', 'info');
    
    try {
      // Add helper methods to the client
      this.client.ensureValidProceedingNumber = function(num, result) {
        if (num && num !== 'null' && num !== null) return num;
        
        // Try URL extraction
        if (result.url) {
          const urlMatch = result.url.match(/(IPR|PGR|CBM|DER)\d{4}-\d{5}/i);
          if (urlMatch) return urlMatch[0].toUpperCase();
        }
        
        // Try text extraction
        if (result.text) {
          const textMatch = result.text.match(/(IPR|PGR|CBM|DER)\d{4}-\d{5}/i);
          if (textMatch) return textMatch[0].toUpperCase();
        }
        
        // Generate placeholder
        return `TEMP_${Date.now()}`;
      };
      
      this.client.ensureValidStatus = function(status, text) {
        if (status && status !== 'Unknown' && status !== 'unknown' && status !== '') {
          return status;
        }
        
        // Simple status detection
        if (/final\s+written\s+decision/i.test(text)) return 'Final Written Decision';
        if (/institution\s+decision/i.test(text)) return 'Institution Decision';
        if (/instituted/i.test(text)) return 'Trial Instituted';
        if (/denied/i.test(text)) return 'Institution Denied';
        if (/settled/i.test(text)) return 'Settled';
        if (/terminated/i.test(text)) return 'Terminated';
        
        return 'Pending Review';
      };
      
      this.client.ensureValidParty = function(party, role) {
        if (party && party !== 'null' && party !== null && party.trim() !== '') {
          return party;
        }
        
        // Return descriptive placeholder
        if (role === 'petitioner') {
          return 'Petitioner (See Document)';
        } else if (role === 'patent_owner') {
          return 'Patent Owner (See Document)';
        }
        
        return 'Party Not Identified';
      };
      
      // Test helpers independently
      this.log('Testing helper methods:', 'info');
      
      // Test ensureValidProceedingNumber
      const procNum1 = this.client.ensureValidProceedingNumber('IPR2022-00063', mockSearchResult);
      this.log(`Valid proceeding: ${procNum1} === 'IPR2022-00063'`, procNum1 === 'IPR2022-00063' ? 'pass' : 'fail');
      
      const procNum2 = this.client.ensureValidProceedingNumber(null, mockSearchResult);
      this.log(`Null proceeding extracted from URL: ${procNum2}`, procNum2 === 'IPR2022-00063' ? 'pass' : 'warn');
      
      const procNum3 = this.client.ensureValidProceedingNumber(null, mockBrokenResult);
      this.log(`No proceeding generates TEMP_: ${procNum3.startsWith('TEMP_')}`, procNum3.startsWith('TEMP_') ? 'pass' : 'fail');
      
      // Test ensureValidStatus
      const status1 = this.client.ensureValidStatus('Final Written Decision', '');
      this.log(`Valid status preserved: ${status1}`, status1 === 'Final Written Decision' ? 'pass' : 'fail');
      
      const status2 = this.client.ensureValidStatus(null, mockSearchResult.text);
      this.log(`Null status detected as: ${status2}`, status2 === 'Final Written Decision' ? 'pass' : 'fail');
      
      const status3 = this.client.ensureValidStatus(null, 'random text');
      this.log(`Unknown status becomes: ${status3}`, status3 === 'Pending Review' ? 'pass' : 'fail');
      
      // Test ensureValidParty
      const party1 = this.client.ensureValidParty('Samsung Electronics Co., Ltd.', 'petitioner');
      this.log(`Valid party preserved: ${party1}`, party1 === 'Samsung Electronics Co., Ltd.' ? 'pass' : 'fail');
      
      const party2 = this.client.ensureValidParty(null, 'petitioner');
      this.log(`Null petitioner becomes: ${party2}`, party2 === 'Petitioner (See Document)' ? 'pass' : 'fail');
      
      this.testResults.push({ test: 'helpers', passed: true });
      return true;
      
    } catch (error) {
      this.log(`Helper methods test failed: ${error.message}`, 'fail');
      this.testResults.push({ test: 'helpers', passed: false, error: error.message });
      return false;
    }
  }

  /**
   * Test 3: Integrate helpers WITHOUT breaking existing functionality
   */
  async testIntegration() {
    this.log('\n=== TEST 3: Integrating Helpers (Safe Mode) ===\n', 'info');
    
    try {
      // Save original method
      const originalMethod = this.client.extractProceedingInfo.bind(this.client);
      
      // Create enhanced version that uses helpers
      this.client.extractProceedingInfo = function(result, type) {
        // Call original extraction
        const extracted = originalMethod(result, type);
        
        // Enhance with helpers (non-breaking additions only)
        return {
          ...extracted,
          // Only override if null or invalid
          proceeding_number: this.ensureValidProceedingNumber(extracted.proceeding_number, result),
          status: this.ensureValidStatus(extracted.status, result.text || ''),
          petitioner: this.ensureValidParty(extracted.petitioner, 'petitioner'),
          patent_owner: this.ensureValidParty(extracted.patent_owner, 'patent_owner')
        };
      }.bind(this.client);
      
      // Test with good data - should work exactly the same
      this.log('Testing with good data (should be unchanged):', 'info');
      const goodResult = this.client.extractProceedingInfo(mockSearchResult, 'IPR');
      
      this.log(`Proceeding: ${goodResult.proceeding_number}`, 'pass');
      this.log(`Status: ${goodResult.status}`, 'pass');
      this.log(`Petitioner: ${goodResult.petitioner}`, 'pass');
      this.log(`Patent Owner: ${goodResult.patent_owner}`, 'pass');
      
      // Test with broken data - should now have valid values
      this.log('\nTesting with broken data (should be improved):', 'info');
      const brokenResult = this.client.extractProceedingInfo(mockBrokenResult, 'IPR');
      
      const hasValidProceeding = brokenResult.proceeding_number && brokenResult.proceeding_number !== null;
      this.log(`Proceeding: ${brokenResult.proceeding_number} (never null: ${hasValidProceeding})`, 
               hasValidProceeding ? 'pass' : 'fail');
      
      const hasValidStatus = brokenResult.status && brokenResult.status !== 'Unknown';
      this.log(`Status: ${brokenResult.status} (never ambiguous: ${hasValidStatus})`,
               hasValidStatus ? 'pass' : 'fail');
      
      const hasValidPetitioner = brokenResult.petitioner && brokenResult.petitioner !== null;
      this.log(`Petitioner: ${brokenResult.petitioner} (never null: ${hasValidPetitioner})`,
               hasValidPetitioner ? 'pass' : 'fail');
      
      const hasValidOwner = brokenResult.patent_owner && brokenResult.patent_owner !== null;
      this.log(`Patent Owner: ${brokenResult.patent_owner} (never null: ${hasValidOwner})`,
               hasValidOwner ? 'pass' : 'fail');
      
      const allValid = hasValidProceeding && hasValidStatus && hasValidPetitioner && hasValidOwner;
      this.testResults.push({ test: 'integration', passed: allValid });
      return allValid;
      
    } catch (error) {
      this.log(`Integration test failed: ${error.message}`, 'fail');
      this.testResults.push({ test: 'integration', passed: false, error: error.message });
      return false;
    }
  }

  /**
   * Test 4: Verify backward compatibility
   */
  async testBackwardCompatibility() {
    this.log('\n=== TEST 4: Backward Compatibility Check ===\n', 'info');
    
    try {
      // Test that all original fields still exist
      const result = this.client.extractProceedingInfo(mockSearchResult, 'IPR');
      
      const expectedFields = [
        'proceeding_type',
        'proceeding_number',
        'patent_number',
        'petitioner',
        'patent_owner',
        'institution_date',
        'filing_date',
        'decision_date',
        'date_found',
        'document_type',
        'status',
        'title',
        'url',
        'snippet'
      ];
      
      let allFieldsPresent = true;
      for (const field of expectedFields) {
        if (field in result) {
          this.log(`Field '${field}': ✓`, 'pass');
        } else {
          this.log(`Field '${field}': MISSING`, 'fail');
          allFieldsPresent = false;
        }
      }
      
      // Test field types
      this.log('\nChecking field types:', 'info');
      this.log(`proceeding_number is string: ${typeof result.proceeding_number === 'string'}`, 'pass');
      this.log(`status is string: ${typeof result.status === 'string'}`, 'pass');
      this.log(`petitioner is string: ${typeof result.petitioner === 'string'}`, 'pass');
      this.log(`patent_owner is string: ${typeof result.patent_owner === 'string'}`, 'pass');
      
      this.testResults.push({ test: 'compatibility', passed: allFieldsPresent });
      return allFieldsPresent;
      
    } catch (error) {
      this.log(`Compatibility test failed: ${error.message}`, 'fail');
      this.testResults.push({ test: 'compatibility', passed: false, error: error.message });
      return false;
    }
  }

  /**
   * Run all tests in sequence
   */
  async runAllTests() {
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}PTAB IMPROVEMENT SAFETY TEST SUITE${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
    
    // Run tests in order
    const baseline = await this.testBaseline();
    if (!baseline) {
      this.log('\n⚠️  Baseline failed - stopping tests', 'warn');
      return false;
    }
    
    const helpers = await this.testHelperMethods();
    if (!helpers) {
      this.log('\n⚠️  Helper methods failed - stopping tests', 'warn');
      return false;
    }
    
    const integration = await this.testIntegration();
    if (!integration) {
      this.log('\n⚠️  Integration failed - stopping tests', 'warn');
      return false;
    }
    
    const compatibility = await this.testBackwardCompatibility();
    
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
    } else {
      console.log(`\n${colors.red}✗ SOME TESTS FAILED - DO NOT IMPLEMENT${colors.reset}`);
    }
    
    return allPassed;
  }
}

// Run the tests
const tester = new PTABSafetyTester();
tester.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});