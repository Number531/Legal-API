#!/usr/bin/env node

/**
 * GPT-5 Bridge Testing Suite
 * Tests the current working implementation using Chat Completions API
 * This works with today's OpenAI API while maintaining GPT-5 orchestrator structure
 */

import 'dotenv/config';
import { Gpt5Bridge } from '../src/orchestrator/gpt5Bridge.js';
import OpenAI from 'openai';
import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class GPT5CurrentTest {
  constructor() {
    this.baseDir = path.resolve(__dirname, '..');
    this.runnerPath = `${this.baseDir}/run-legal-mcp.sh`;
    this.testResults = [];
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.GPT5_MODEL || 'gpt-4o-2024-08-06';
    
    console.log('🚀 GPT-5 Bridge & MCP Testing Suite (Current API)');
    console.log('='.repeat(60));
    console.log(`📍 Base Directory: ${this.baseDir}`);
    console.log(`🤖 Model: ${this.model}`);
    console.log(`🔧 Runner: ${this.runnerPath}`);
    console.log('='.repeat(60));
  }

  async initialize() {
    console.log('\n📋 Initialization');
    console.log('-'.repeat(40));
    
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY not found');
    }
    console.log('✅ OpenAI API key found');
    
    await this.ensureRunnerScript();
    
    // Initialize Bridge
    this.bridge = new Gpt5Bridge({
      apiKey: this.apiKey,
      runnerPath: this.runnerPath,
      model: this.model
    });
    console.log('✅ GPT-5 Bridge initialized');
    
    // Initialize direct OpenAI client for advanced tests
    this.openai = new OpenAI({ apiKey: this.apiKey });
    console.log('✅ OpenAI client initialized');
  }

  async ensureRunnerScript() {
    try {
      await fs.access(this.runnerPath);
      console.log('✅ Runner script exists');
    } catch {
      console.log('📝 Creating runner script...');
      const content = `#!/bin/bash
cd "${this.baseDir}"
exec node index.js
`;
      await fs.writeFile(this.runnerPath, content, { mode: 0o755 });
      console.log('✅ Runner script created');
    }
  }

  /**
   * Test 1: MCP Tool Discovery
   */
  async testToolDiscovery() {
    console.log('\n🧪 Test 1: MCP Tool Discovery');
    console.log('-'.repeat(40));
    
    const start = Date.now();
    try {
      const transport = new StdioClientTransport({
        command: 'bash',
        args: [this.runnerPath]
      });
      
      const mcp = new MCPClient(
        { name: 'test-client', version: '1.0.0' },
        { capabilities: {} }
      );
      
      await mcp.connect(transport);
      const tools = await mcp.listTools();
      
      const duration = Date.now() - start;
      console.log(`✅ Found ${tools.tools.length} tools in ${duration}ms`);
      
      // Group tools by API
      const toolsByApi = {};
      tools.tools.forEach(tool => {
        const prefix = tool.name.split('_')[0];
        toolsByApi[prefix] = (toolsByApi[prefix] || []);
        toolsByApi[prefix].push(tool.name);
      });
      
      console.log('\n📊 Tools by API:');
      Object.entries(toolsByApi).forEach(([api, toolList]) => {
        console.log(`  ${api}: ${toolList.length} tools`);
      });
      
      await mcp.close();
      
      this.testResults.push({
        test: 'Tool Discovery',
        status: 'passed',
        duration,
        toolCount: tools.tools.length,
        apis: Object.keys(toolsByApi).length
      });
      
      return tools.tools;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.testResults.push({
        test: 'Tool Discovery',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 2: Simple Legal Query
   */
  async testSimpleQuery() {
    console.log('\n🧪 Test 2: Simple Legal Query');
    console.log('-'.repeat(40));
    
    const query = 'What is Chapter 11 bankruptcy?';
    console.log(`Query: "${query}"`);
    
    const start = Date.now();
    try {
      const result = await this.bridge.runResearch(query);
      
      const duration = Date.now() - start;
      console.log(`✅ Success in ${duration}ms`);
      console.log(`📄 Response length: ${result.text?.length || 0} characters`);
      
      this.testResults.push({
        test: 'Simple Query',
        status: 'passed',
        duration,
        responseLength: result.text?.length
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.testResults.push({
        test: 'Simple Query',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 3: Case Law Search
   */
  async testCaseLawSearch() {
    console.log('\n🧪 Test 3: Case Law Search with Tools');
    console.log('-'.repeat(40));
    
    const query = 'Find recent intellectual property cases from 2024 involving AI or machine learning';
    console.log(`Query: "${query.substring(0, 60)}..."`);
    
    const start = Date.now();
    try {
      const result = await this.bridge.runResearch(query);
      
      const duration = Date.now() - start;
      console.log(`✅ Success in ${duration}ms`);
      console.log(`📄 Response length: ${result.text?.length || 0} characters`);
      
      // Check if cases were mentioned
      const casePattern = /\bv\.\s+|\bvs?\.\s+/gi;
      const matches = result.text?.match(casePattern) || [];
      console.log(`⚖️  Potential cases found: ${matches.length}`);
      
      this.testResults.push({
        test: 'Case Law Search',
        status: 'passed',
        duration,
        responseLength: result.text?.length,
        casesFound: matches.length
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.testResults.push({
        test: 'Case Law Search',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 4: SEC Filing Search
   */
  async testSECFilingSearch() {
    console.log('\n🧪 Test 4: SEC Filing Search');
    console.log('-'.repeat(40));
    
    const query = 'Get the latest 10-K filing information for Apple Inc (AAPL)';
    console.log(`Query: "${query}"`);
    
    const start = Date.now();
    try {
      const result = await this.bridge.runResearch(query);
      
      const duration = Date.now() - start;
      console.log(`✅ Success in ${duration}ms`);
      console.log(`📄 Response length: ${result.text?.length || 0} characters`);
      
      // Check if filing information was found
      const filingPattern = /10-K|annual report|fiscal year/gi;
      const matches = result.text?.match(filingPattern) || [];
      console.log(`📊 Filing references: ${matches.length}`);
      
      this.testResults.push({
        test: 'SEC Filing Search',
        status: 'passed',
        duration,
        responseLength: result.text?.length,
        filingRefs: matches.length
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.testResults.push({
        test: 'SEC Filing Search',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 5: Patent Search
   */
  async testPatentSearch() {
    console.log('\n🧪 Test 5: Patent Search');
    console.log('-'.repeat(40));
    
    const query = 'Search for recent machine learning patents filed by Google in 2024';
    console.log(`Query: "${query}"`);
    
    const start = Date.now();
    try {
      const result = await this.bridge.runResearch(query);
      
      const duration = Date.now() - start;
      console.log(`✅ Success in ${duration}ms`);
      console.log(`📄 Response length: ${result.text?.length || 0} characters`);
      
      // Check for patent numbers or references
      const patentPattern = /patent|USPTO|US\d{7,}|application/gi;
      const matches = result.text?.match(patentPattern) || [];
      console.log(`🔬 Patent references: ${matches.length}`);
      
      this.testResults.push({
        test: 'Patent Search',
        status: 'passed',
        duration,
        responseLength: result.text?.length,
        patentRefs: matches.length
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.testResults.push({
        test: 'Patent Search',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 6: Multi-Tool Complex Query
   */
  async testComplexQuery() {
    console.log('\n🧪 Test 6: Complex Multi-Tool Query');
    console.log('-'.repeat(40));
    
    const query = `Analyze the legal landscape for AI companies:
    1. Find recent AI-related litigation
    2. Check regulatory filings mentioning AI risks
    3. Search for AI patents
    Provide a brief summary of findings.`;
    
    console.log('Query: Complex multi-tool analysis');
    
    const start = Date.now();
    try {
      const result = await this.bridge.runResearch(query);
      
      const duration = Date.now() - start;
      console.log(`✅ Success in ${duration}ms`);
      console.log(`📄 Response length: ${result.text?.length || 0} characters`);
      
      // Check coverage of different aspects
      const coverageChecks = {
        litigation: /litigation|lawsuit|case/gi,
        regulatory: /SEC|filing|disclosure|regulation/gi,
        patents: /patent|USPTO|intellectual property/gi
      };
      
      console.log('\n📊 Coverage analysis:');
      Object.entries(coverageChecks).forEach(([aspect, pattern]) => {
        const matches = result.text?.match(pattern) || [];
        console.log(`  ${aspect}: ${matches.length > 0 ? '✅' : '❌'} (${matches.length} references)`);
      });
      
      this.testResults.push({
        test: 'Complex Query',
        status: 'passed',
        duration,
        responseLength: result.text?.length,
        aspectsCovered: Object.keys(coverageChecks).filter(
          aspect => (result.text?.match(coverageChecks[aspect]) || []).length > 0
        ).length
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.testResults.push({
        test: 'Complex Query',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 7: Direct Tool Execution
   */
  async testDirectToolExecution() {
    console.log('\n🧪 Test 7: Direct MCP Tool Execution');
    console.log('-'.repeat(40));
    
    try {
      const transport = new StdioClientTransport({
        command: 'bash',
        args: [this.runnerPath]
      });
      
      const mcp = new MCPClient(
        { name: 'test-client', version: '1.0.0' },
        { capabilities: {} }
      );
      
      await mcp.connect(transport);
      
      // Test specific tools directly
      const toolTests = [
        {
          name: 'courtlistener_search_cases',
          args: { query: 'bankruptcy', type: 'o', limit: 3 }
        },
        {
          name: 'sec_edgar_search_companies',
          args: { query: 'Apple', limit: 2 }
        },
        {
          name: 'uspto_patent_search',
          args: { query: 'artificial intelligence', rows: 3 }
        }
      ];
      
      for (const test of toolTests) {
        const start = Date.now();
        console.log(`\n  Testing: ${test.name}`);
        
        try {
          const result = await mcp.callTool({
            name: test.name,
            arguments: test.args
          });
          
          const duration = Date.now() - start;
          const content = result.content?.[0]?.text || '';
          console.log(`    ✅ Success in ${duration}ms`);
          console.log(`    📄 Result length: ${content.length} characters`);
          
          this.testResults.push({
            test: `Direct: ${test.name}`,
            status: 'passed',
            duration,
            resultLength: content.length
          });
        } catch (error) {
          console.log(`    ❌ Failed: ${error.message}`);
          this.testResults.push({
            test: `Direct: ${test.name}`,
            status: 'failed',
            error: error.message
          });
        }
      }
      
      await mcp.close();
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST REPORT');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    
    console.log(`\n✅ Passed: ${passed}/${this.testResults.length}`);
    console.log(`❌ Failed: ${failed}/${this.testResults.length}`);
    
    // Calculate performance metrics
    const timings = this.testResults
      .filter(r => r.duration)
      .map(r => r.duration);
    
    if (timings.length > 0) {
      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const minTime = Math.min(...timings);
      const maxTime = Math.max(...timings);
      
      console.log('\n⏱️  Performance Metrics:');
      console.log(`  Average: ${avgTime.toFixed(0)}ms`);
      console.log(`  Fastest: ${minTime}ms`);
      console.log(`  Slowest: ${maxTime}ms`);
    }
    
    // Show failed tests
    const failures = this.testResults.filter(r => r.status === 'failed');
    if (failures.length > 0) {
      console.log('\n❌ Failed Tests:');
      failures.forEach(f => {
        console.log(`  - ${f.test}: ${f.error}`);
      });
    }
    
    // Success rate by category
    console.log('\n📈 Success by Category:');
    const categories = {
      'Tool Discovery': this.testResults.filter(r => r.test.includes('Discovery')),
      'Legal Queries': this.testResults.filter(r => r.test.includes('Query')),
      'Search Operations': this.testResults.filter(r => r.test.includes('Search')),
      'Direct Tools': this.testResults.filter(r => r.test.includes('Direct'))
    };
    
    Object.entries(categories).forEach(([cat, results]) => {
      if (results.length > 0) {
        const catPassed = results.filter(r => r.status === 'passed').length;
        const percentage = (catPassed / results.length * 100).toFixed(0);
        console.log(`  ${cat}: ${catPassed}/${results.length} (${percentage}%)`);
      }
    });
  }

  async saveResults() {
    const reportPath = path.join(this.baseDir, 'test', 'gpt5-current-results.json');
    const report = {
      timestamp: new Date().toISOString(),
      model: this.model,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'passed').length,
        failed: this.testResults.filter(r => r.status === 'failed').length
      },
      results: this.testResults
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Results saved to: ${reportPath}`);
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      console.log('\n' + '='.repeat(60));
      console.log('🚀 STARTING TESTS');
      console.log('='.repeat(60));
      
      await this.testToolDiscovery();
      await this.testSimpleQuery();
      await this.testCaseLawSearch();
      await this.testSECFilingSearch();
      await this.testPatentSearch();
      await this.testComplexQuery();
      await this.testDirectToolExecution();
      
      this.generateReport();
      await this.saveResults();
      
      console.log('\n✨ Testing complete!');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    }
  }
}

// Run tests
const tester = new GPT5CurrentTest();
tester.runAllTests().catch(console.error);