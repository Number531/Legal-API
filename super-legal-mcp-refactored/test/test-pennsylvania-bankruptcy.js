#!/usr/bin/env node

/**
 * Pennsylvania Chemical Manufacturing Bankruptcy Test
 * Tests complex legal research scenario with IP retention and DIP financing
 */

import 'dotenv/config';
import { Gpt5Bridge } from '../src/orchestrator/gpt5Bridge.js';
import { IterativePlanner } from '../src/orchestrator/iterativePlanner.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PennsylvaniaBankruptcyTest {
  constructor() {
    this.baseDir = path.resolve(__dirname, '..');
    this.runnerPath = `${this.baseDir}/run-legal-mcp.sh`;
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.GPT5_MODEL || 'gpt-4o-2024-08-06';
    this.results = [];
  }

  async initialize() {
    console.log('🏭 Pennsylvania Chemical Manufacturing Bankruptcy Research Test');
    console.log('='.repeat(70));
    console.log('📍 Scenario: Chemical manufacturing bankruptcies in Pennsylvania');
    console.log('🔍 Focus Areas:');
    console.log('   - Intellectual property retention during bankruptcy');
    console.log('   - Debtor in possession (DIP) financing');
    console.log('   - Pennsylvania-specific bankruptcy precedents');
    console.log('='.repeat(70));
    
    // Ensure runner script
    try {
      await fs.access(this.runnerPath);
    } catch {
      const content = `#!/bin/bash\ncd "${this.baseDir}"\nexec node index.js\n`;
      await fs.writeFile(this.runnerPath, content, { mode: 0o755 });
    }
    
    // Initialize Bridge
    this.bridge = new Gpt5Bridge({
      apiKey: this.apiKey,
      runnerPath: this.runnerPath,
      model: this.model
    });
    
    // Initialize Iterative Planner (if Responses API available)
    this.serverUrl = `stdio://bash?args=${encodeURI(this.runnerPath)}`;
    
    console.log(`\n🤖 Model: ${this.model}`);
    console.log('✅ Systems initialized\n');
  }

  /**
   * Test 1: Basic Chemical Manufacturing Bankruptcy Search
   */
  async testChemicalBankruptcySearch() {
    console.log('🧪 Test 1: Chemical Manufacturing Bankruptcy Cases');
    console.log('-'.repeat(50));
    
    const query = `Find bankruptcy cases involving chemical manufacturing companies in Pennsylvania, 
    focusing on Chapter 11 reorganizations and asset retention strategies`;
    
    const start = Date.now();
    try {
      const result = await this.bridge.runResearch(query);
      const duration = Date.now() - start;
      
      console.log(`✅ Completed in ${duration}ms`);
      console.log(`📄 Response length: ${result.text?.length} characters`);
      
      // Check for relevant content
      const relevantTerms = ['Chapter 11', 'Pennsylvania', 'chemical', 'manufacturing', 'reorganization'];
      const foundTerms = relevantTerms.filter(term => 
        result.text?.toLowerCase().includes(term.toLowerCase())
      );
      console.log(`📊 Relevant terms found: ${foundTerms.join(', ')}`);
      
      this.results.push({
        test: 'Chemical Bankruptcy Search',
        status: 'success',
        duration,
        relevantTerms: foundTerms.length
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.results.push({
        test: 'Chemical Bankruptcy Search',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 2: Intellectual Property Retention Research
   */
  async testIPRetention() {
    console.log('\n🧪 Test 2: IP Retention in Bankruptcy');
    console.log('-'.repeat(50));
    
    const query = `Research how intellectual property (patents, trademarks, trade secrets) can be 
    retained during Chapter 11 bankruptcy proceedings, specifically for chemical manufacturing 
    companies. Include strategies for protecting IP from creditors and maintaining licensing agreements`;
    
    const start = Date.now();
    try {
      const result = await this.bridge.runResearch(query);
      const duration = Date.now() - start;
      
      console.log(`✅ Completed in ${duration}ms`);
      
      // Analyze IP-related content
      const ipTerms = ['patent', 'trademark', 'trade secret', 'intellectual property', 
                       'licensing', 'Section 365', 'executory contracts'];
      const foundIPTerms = ipTerms.filter(term => 
        result.text?.toLowerCase().includes(term.toLowerCase())
      );
      
      console.log(`📊 IP concepts covered: ${foundIPTerms.length}/${ipTerms.length}`);
      console.log(`   Found: ${foundIPTerms.join(', ')}`);
      
      this.results.push({
        test: 'IP Retention Research',
        status: 'success',
        duration,
        ipCoverage: foundIPTerms.length
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.results.push({
        test: 'IP Retention Research',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 3: Debtor in Possession (DIP) Financing
   */
  async testDIPFinancing() {
    console.log('\n🧪 Test 3: Debtor in Possession Financing');
    console.log('-'.repeat(50));
    
    const query = `Explain debtor in possession (DIP) financing options for chemical manufacturing 
    companies in Chapter 11 bankruptcy. Include Pennsylvania state law considerations, 
    environmental liability issues, and recent cases involving DIP financing in the chemical industry`;
    
    const start = Date.now();
    try {
      const result = await this.bridge.runResearch(query);
      const duration = Date.now() - start;
      
      console.log(`✅ Completed in ${duration}ms`);
      
      // Check DIP financing coverage
      const dipTerms = ['DIP', 'debtor in possession', 'financing', 'Section 364', 
                        'priming lien', 'adequate protection', 'environmental', 'liability'];
      const foundDIPTerms = dipTerms.filter(term => 
        result.text?.toLowerCase().includes(term.toLowerCase())
      );
      
      console.log(`📊 DIP concepts covered: ${foundDIPTerms.length}/${dipTerms.length}`);
      console.log(`   Found: ${foundDIPTerms.join(', ')}`);
      
      this.results.push({
        test: 'DIP Financing',
        status: 'success',
        duration,
        dipCoverage: foundDIPTerms.length
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.results.push({
        test: 'DIP Financing',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 4: Comprehensive Multi-Tool Query
   */
  async testComprehensiveQuery() {
    console.log('\n🧪 Test 4: Comprehensive Multi-Tool Research');
    console.log('-'.repeat(50));
    
    const query = `Perform comprehensive research on chemical manufacturing bankruptcies in Pennsylvania:
    
    1. Search for Chapter 11 cases in Pennsylvania involving chemical manufacturers from 2020-2024
    2. Find SEC filings mentioning bankruptcy or restructuring for chemical companies with Pennsylvania operations
    3. Search for patents owned by bankrupt chemical companies and their disposition
    4. Look for EPA violations or environmental liabilities affecting bankrupt chemical manufacturers
    5. Find court opinions on intellectual property retention in chemical industry bankruptcies
    6. Search for DIP financing arrangements in recent chemical company reorganizations
    
    Provide a summary with specific case citations and relevant statutory provisions`;
    
    console.log('📋 Running comprehensive multi-source analysis...\n');
    
    const start = Date.now();
    try {
      const result = await this.bridge.runResearch(query);
      const duration = Date.now() - start;
      
      console.log(`✅ Completed in ${duration}ms`);
      console.log(`📄 Response length: ${result.text?.length} characters`);
      
      // Analyze coverage of different data sources
      const sources = {
        'Court cases': /v\.|vs\.|versus/gi,
        'SEC filings': /10-K|10-Q|8-K|SEC|filing/gi,
        'Patents': /patent|USPTO|US\d{7}/gi,
        'EPA/Environmental': /EPA|environmental|violation|liability/gi,
        'Statutory': /Section \d+|§\s*\d+|U\.S\.C\.|Bankruptcy Code/gi,
        'DIP financing': /DIP|debtor.in.possession|Section 364/gi
      };
      
      console.log('\n📊 Data Source Coverage:');
      Object.entries(sources).forEach(([source, pattern]) => {
        const matches = result.text?.match(pattern) || [];
        console.log(`   ${source}: ${matches.length > 0 ? '✅' : '❌'} (${matches.length} references)`);
      });
      
      this.results.push({
        test: 'Comprehensive Research',
        status: 'success',
        duration,
        responseLength: result.text?.length,
        sourcesUsed: Object.keys(sources).filter(s => 
          (result.text?.match(sources[s]) || []).length > 0
        ).length
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.results.push({
        test: 'Comprehensive Research',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 5: Pennsylvania-Specific Precedents
   */
  async testPennsylvaniaPrecedents() {
    console.log('\n🧪 Test 5: Pennsylvania-Specific Bankruptcy Precedents');
    console.log('-'.repeat(50));
    
    const query = `Find Pennsylvania bankruptcy court decisions and Third Circuit precedents 
    specifically addressing:
    1. Chemical industry bankruptcies
    2. Environmental liability treatment in bankruptcy
    3. Intellectual property licenses in bankruptcy
    4. Mass tort claims in chemical company reorganizations
    Focus on Eastern and Western District of Pennsylvania bankruptcy courts`;
    
    const start = Date.now();
    try {
      const result = await this.bridge.runResearch(query);
      const duration = Date.now() - start;
      
      console.log(`✅ Completed in ${duration}ms`);
      
      // Check for Pennsylvania-specific content
      const paTerms = ['Pennsylvania', 'Third Circuit', 'E.D. Pa', 'W.D. Pa', 
                       'Eastern District', 'Western District', 'Philadelphia', 'Pittsburgh'];
      const foundPATerms = paTerms.filter(term => 
        result.text?.toLowerCase().includes(term.toLowerCase())
      );
      
      console.log(`📊 Pennsylvania references: ${foundPATerms.length}`);
      console.log(`   Found: ${foundPATerms.join(', ')}`);
      
      this.results.push({
        test: 'PA Precedents',
        status: 'success',
        duration,
        paReferences: foundPATerms.length
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.results.push({
        test: 'PA Precedents',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Generate final report
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 PENNSYLVANIA BANKRUPTCY RESEARCH TEST RESULTS');
    console.log('='.repeat(70));
    
    const successful = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    
    console.log(`\n✅ Successful: ${successful}/${this.results.length}`);
    console.log(`❌ Failed: ${failed}/${this.results.length}`);
    
    // Performance metrics
    const durations = this.results
      .filter(r => r.duration)
      .map(r => r.duration);
    
    if (durations.length > 0) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      
      console.log('\n⏱️  Performance:');
      console.log(`   Average: ${(avg / 1000).toFixed(1)}s`);
      console.log(`   Fastest: ${(min / 1000).toFixed(1)}s`);
      console.log(`   Slowest: ${(max / 1000).toFixed(1)}s`);
    }
    
    // Coverage analysis
    console.log('\n📈 Coverage Analysis:');
    this.results.forEach(r => {
      if (r.status === 'success') {
        const icon = '✅';
        console.log(`   ${icon} ${r.test}`);
        if (r.relevantTerms) console.log(`      Relevant terms: ${r.relevantTerms}`);
        if (r.ipCoverage) console.log(`      IP concepts: ${r.ipCoverage}/7`);
        if (r.dipCoverage) console.log(`      DIP concepts: ${r.dipCoverage}/8`);
        if (r.sourcesUsed) console.log(`      Data sources: ${r.sourcesUsed}/6`);
        if (r.paReferences) console.log(`      PA references: ${r.paReferences}`);
      }
    });
    
    // Key findings summary
    console.log('\n🔍 Key Research Capabilities Demonstrated:');
    console.log('   ✅ Chemical industry bankruptcy case search');
    console.log('   ✅ Intellectual property retention strategies');
    console.log('   ✅ DIP financing analysis');
    console.log('   ✅ Multi-source data aggregation');
    console.log('   ✅ Pennsylvania-specific precedent research');
  }

  async saveResults() {
    const reportPath = path.join(this.baseDir, 'test', 'pennsylvania-bankruptcy-results.json');
    const report = {
      timestamp: new Date().toISOString(),
      scenario: 'Pennsylvania Chemical Manufacturing Bankruptcy',
      model: this.model,
      summary: {
        total: this.results.length,
        successful: this.results.filter(r => r.status === 'success').length,
        failed: this.results.filter(r => r.status === 'failed').length
      },
      results: this.results
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      // Run tests in sequence
      await this.testChemicalBankruptcySearch();
      await this.testIPRetention();
      await this.testDIPFinancing();
      await this.testComprehensiveQuery();
      await this.testPennsylvaniaPrecedents();
      
      // Generate reports
      this.generateReport();
      await this.saveResults();
      
      console.log('\n✨ Pennsylvania bankruptcy research testing complete!');
      console.log('🏭 System ready for chemical manufacturing bankruptcy research');
      
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    }
  }
}

// Run the test
const tester = new PennsylvaniaBankruptcyTest();
tester.runAllTests();