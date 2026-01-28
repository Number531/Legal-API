#!/usr/bin/env node

/**
 * GPT-5 Orchestrator Testing Suite
 * Tests the existing GPT-5 implementation with MCP integration
 */

import 'dotenv/config';
import { Gpt5Orchestrator } from '../src/orchestrator/gpt5Orchestrator.js';
import { IterativePlanner } from '../src/orchestrator/iterativePlanner.js';
import { Gpt5Bridge } from '../src/orchestrator/gpt5Bridge.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class GPT5OrchestratorTest {
  constructor() {
    this.baseDir = path.resolve(__dirname, '..');
    this.runnerPath = `${this.baseDir}/run-legal-mcp.sh`;
    this.testResults = [];
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.GPT5_MODEL || 'gpt-4o-2024-08-06';
    
    console.log('🚀 GPT-5 Orchestrator Testing Suite');
    console.log('='.repeat(60));
    console.log(`📍 Base Directory: ${this.baseDir}`);
    console.log(`🤖 Model: ${this.model}`);
    console.log(`🔧 Runner: ${this.runnerPath}`);
    console.log('='.repeat(60));
  }

  async initialize() {
    console.log('\n📋 Initialization Phase');
    console.log('-'.repeat(40));
    
    // Verify API key
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment');
    }
    console.log('✅ OpenAI API key found');
    
    // Create runner script if needed
    await this.ensureRunnerScript();
    
    // Initialize orchestrator
    this.serverUrl = `stdio://bash?args=${encodeURI(this.runnerPath)}`;
    this.orchestrator = new Gpt5Orchestrator({
      apiKey: this.apiKey,
      serverUrl: this.serverUrl,
      serverLabel: 'legal_research',
      requireApproval: 'never',
      model: this.model
    });
    console.log('✅ GPT-5 Orchestrator initialized');
    
    // Initialize iterative planner
    this.planner = new IterativePlanner({
      apiKey: this.apiKey,
      serverUrl: this.serverUrl,
      model: this.model
    });
    console.log('✅ Iterative Planner initialized');
    
    // Initialize bridge (fallback mode)
    this.bridge = new Gpt5Bridge({
      apiKey: this.apiKey,
      runnerPath: this.runnerPath,
      model: this.model
    });
    console.log('✅ GPT-5 Bridge initialized (fallback)');
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
   * Test 1: Basic Research Query
   */
  async testBasicResearch() {
    console.log('\n🧪 Test 1: Basic Research Query');
    console.log('-'.repeat(40));
    
    const query = 'What are the key provisions of Section 363 of the Bankruptcy Code?';
    console.log(`Query: "${query}"`);
    
    const start = Date.now();
    try {
      const result = await this.orchestrator.runResearch({
        prompt: query,
        reasoningEffort: 'medium',
        verbosity: 'medium'
      });
      
      const duration = Date.now() - start;
      console.log(`✅ Success in ${duration}ms`);
      console.log(`📊 Tokens used: ${result.usage?.total_tokens || 'N/A'}`);
      console.log(`📄 Response length: ${result.text?.length || 0} characters`);
      
      this.testResults.push({
        test: 'Basic Research',
        status: 'passed',
        duration,
        tokens: result.usage?.total_tokens,
        responseLength: result.text?.length
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.testResults.push({
        test: 'Basic Research',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 2: Streaming Research with Tool Calls
   */
  async testStreamingResearch() {
    console.log('\n🧪 Test 2: Streaming Research with Tool Tracking');
    console.log('-'.repeat(40));
    
    const query = 'Find recent cases about artificial intelligence and copyright law from 2024';
    console.log(`Query: "${query}"`);
    
    const start = Date.now();
    const toolCalls = [];
    let outputBuffer = '';
    
    try {
      console.log('📡 Starting stream...');
      
      const result = await this.orchestrator.streamResearch({
        prompt: query,
        reasoningEffort: 'medium',
        verbosity: 'medium',
        onToolCall: (tool) => {
          toolCalls.push(tool);
          console.log(`  🔧 Tool called: ${tool.name}`);
          if (tool.arguments) {
            console.log(`     Args: ${JSON.stringify(tool.arguments).substring(0, 100)}...`);
          }
        },
        onContent: (delta) => {
          outputBuffer += delta;
          process.stdout.write('.');
        }
      });
      
      const duration = Date.now() - start;
      console.log(`\n✅ Stream completed in ${duration}ms`);
      console.log(`📊 Tools used: ${toolCalls.length}`);
      console.log(`📄 Output length: ${outputBuffer.length} characters`);
      
      // List unique tools used
      const uniqueTools = [...new Set(toolCalls.map(t => t.name))];
      console.log(`🔧 Unique tools: ${uniqueTools.join(', ')}`);
      
      this.testResults.push({
        test: 'Streaming Research',
        status: 'passed',
        duration,
        toolsUsed: toolCalls.length,
        uniqueTools: uniqueTools.length,
        outputLength: outputBuffer.length
      });
      
      return { text: outputBuffer, toolCalls };
    } catch (error) {
      console.log(`\n❌ Failed: ${error.message}`);
      this.testResults.push({
        test: 'Streaming Research',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 3: Iterative Planner
   */
  async testIterativePlanner() {
    console.log('\n🧪 Test 3: Iterative Planner (Multi-step Research)');
    console.log('-'.repeat(40));
    
    const query = 'Research the legal implications of using AI-generated content in commercial products, focusing on copyright and liability issues';
    console.log(`Query: "${query}"`);
    
    const start = Date.now();
    try {
      console.log('🔄 Starting iterative planning...');
      
      const state = await this.planner.run(query, {
        maxIterations: 5,
        targetDocs: 10
      });
      
      const duration = Date.now() - start;
      console.log(`✅ Completed in ${duration}ms`);
      console.log(`🔄 Iterations: ${state.iterations}`);
      console.log(`📚 Documents found: ${state.found.length}`);
      console.log(`🔧 Tools used: ${state.toolsUsed.join(', ')}`);
      
      // Show some found documents
      if (state.found.length > 0) {
        console.log('\n📄 Sample documents found:');
        state.found.slice(0, 3).forEach((doc, i) => {
          console.log(`  ${i + 1}. ${doc.source}: ${doc.snippet.substring(0, 100)}...`);
        });
      }
      
      this.testResults.push({
        test: 'Iterative Planner',
        status: 'passed',
        duration,
        iterations: state.iterations,
        documentsFound: state.found.length,
        toolsUsed: state.toolsUsed.length
      });
      
      return state;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.testResults.push({
        test: 'Iterative Planner',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 4: Structured Output with JSON Schema
   */
  async testStructuredOutput() {
    console.log('\n🧪 Test 4: Structured Output (JSON Schema)');
    console.log('-'.repeat(40));
    
    const query = 'Analyze Microsoft Corporation for potential legal risks';
    const schema = {
      type: 'object',
      properties: {
        entity: { type: 'string' },
        riskLevel: { 
          type: 'string',
          enum: ['low', 'medium', 'high']
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              severity: { 
                type: 'string',
                enum: ['minor', 'moderate', 'severe']
              }
            },
            required: ['category', 'description', 'severity']
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['entity', 'riskLevel', 'risks', 'recommendations']
    };
    
    console.log(`Query: "${query}"`);
    console.log('Schema: Legal Risk Analysis format');
    
    const start = Date.now();
    try {
      const result = await this.orchestrator.runResearch({
        prompt: query,
        reasoningEffort: 'high',
        verbosity: 'high',
        responseFormat: {
          type: 'json_schema',
          json_schema: {
            name: 'legal_risk_analysis',
            schema: schema,
            strict: true
          }
        }
      });
      
      const duration = Date.now() - start;
      console.log(`✅ Success in ${duration}ms`);
      console.log(`📊 Tokens used: ${result.usage?.total_tokens || 'N/A'}`);
      
      // Parse and validate the structured output
      try {
        const parsed = JSON.parse(result.text);
        console.log('✅ Valid JSON structure received');
        console.log(`📋 Entity: ${parsed.entity}`);
        console.log(`⚠️  Risk Level: ${parsed.riskLevel}`);
        console.log(`📊 Risks identified: ${parsed.risks?.length || 0}`);
        console.log(`💡 Recommendations: ${parsed.recommendations?.length || 0}`);
        
        this.testResults.push({
          test: 'Structured Output',
          status: 'passed',
          duration,
          tokens: result.usage?.total_tokens,
          validJson: true,
          risksFound: parsed.risks?.length || 0
        });
      } catch (parseError) {
        console.log('⚠️  JSON parsing failed:', parseError.message);
        this.testResults.push({
          test: 'Structured Output',
          status: 'partial',
          duration,
          error: 'Invalid JSON structure'
        });
      }
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.testResults.push({
        test: 'Structured Output',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 5: Complex Multi-Tool Workflow
   */
  async testComplexWorkflow() {
    console.log('\n🧪 Test 5: Complex Multi-Tool Legal Research');
    console.log('-'.repeat(40));
    
    const query = `Perform a comprehensive analysis:
    1. Search for recent intellectual property cases involving Apple Inc
    2. Check Apple's recent SEC filings for litigation disclosures
    3. Search for any patents Apple filed related to the litigation topics
    4. Provide a summary of findings`;
    
    console.log('Query: Multi-step comprehensive analysis');
    
    const start = Date.now();
    const toolSequence = [];
    
    try {
      console.log('🔄 Starting complex workflow...');
      
      const result = await this.orchestrator.streamResearch({
        prompt: query,
        reasoningEffort: 'high',
        verbosity: 'high',
        onToolCall: (tool) => {
          toolSequence.push(tool.name);
          console.log(`  🔧 Step ${toolSequence.length}: ${tool.name}`);
        },
        onContent: () => {
          process.stdout.write('.');
        }
      });
      
      const duration = Date.now() - start;
      console.log(`\n✅ Workflow completed in ${duration}ms`);
      console.log(`🔧 Tools executed: ${toolSequence.length}`);
      console.log(`📋 Tool sequence: ${toolSequence.join(' → ')}`);
      
      this.testResults.push({
        test: 'Complex Workflow',
        status: 'passed',
        duration,
        toolsExecuted: toolSequence.length,
        toolSequence: toolSequence
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.testResults.push({
        test: 'Complex Workflow',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test 6: Bridge Mode (Fallback)
   */
  async testBridgeMode() {
    console.log('\n🧪 Test 6: GPT-5 Bridge Mode (Chat Completions Fallback)');
    console.log('-'.repeat(40));
    
    const query = 'What are the main requirements for filing a Chapter 11 bankruptcy?';
    console.log(`Query: "${query}"`);
    
    const start = Date.now();
    try {
      console.log('🌉 Using bridge mode...');
      
      const result = await this.bridge.runResearch(query);
      
      const duration = Date.now() - start;
      console.log(`✅ Success in ${duration}ms`);
      console.log(`📊 Tokens used: ${result.usage?.total_tokens || 'N/A'}`);
      console.log(`🔧 Tool calls: ${result.toolCalls?.length || 0}`);
      console.log(`📄 Response length: ${result.text?.length || 0} characters`);
      
      this.testResults.push({
        test: 'Bridge Mode',
        status: 'passed',
        duration,
        tokens: result.usage?.total_tokens,
        toolCalls: result.toolCalls?.length || 0
      });
      
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      this.testResults.push({
        test: 'Bridge Mode',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 GPT-5 ORCHESTRATOR TEST REPORT');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const partial = this.testResults.filter(r => r.status === 'partial').length;
    
    console.log(`\n✅ Passed: ${passed}`);
    console.log(`⚠️  Partial: ${partial}`);
    console.log(`❌ Failed: ${failed}`);
    
    console.log('\n📋 Test Details:');
    console.log('-'.repeat(40));
    
    this.testResults.forEach(result => {
      const statusIcon = result.status === 'passed' ? '✅' : 
                         result.status === 'partial' ? '⚠️' : '❌';
      console.log(`${statusIcon} ${result.test}`);
      
      if (result.duration) {
        console.log(`   ⏱️  Time: ${result.duration}ms`);
      }
      if (result.tokens) {
        console.log(`   📊 Tokens: ${result.tokens}`);
      }
      if (result.toolsUsed) {
        console.log(`   🔧 Tools: ${result.toolsUsed}`);
      }
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      }
    });
    
    // Calculate averages
    const timings = this.testResults.filter(r => r.duration).map(r => r.duration);
    if (timings.length > 0) {
      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      console.log(`\n⏱️  Average response time: ${avgTime.toFixed(0)}ms`);
    }
    
    const tokenCounts = this.testResults.filter(r => r.tokens).map(r => r.tokens);
    if (tokenCounts.length > 0) {
      const avgTokens = tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length;
      console.log(`📊 Average tokens used: ${avgTokens.toFixed(0)}`);
    }
  }

  async saveResults() {
    const reportPath = path.join(this.baseDir, 'test', 'gpt5-test-results.json');
    const report = {
      timestamp: new Date().toISOString(),
      model: this.model,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'passed').length,
        failed: this.testResults.filter(r => r.status === 'failed').length,
        partial: this.testResults.filter(r => r.status === 'partial').length
      },
      results: this.testResults
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      console.log('\n' + '='.repeat(60));
      console.log('🚀 STARTING GPT-5 ORCHESTRATOR TESTS');
      console.log('='.repeat(60));
      
      await this.testBasicResearch();
      await this.testStreamingResearch();
      await this.testIterativePlanner();
      await this.testStructuredOutput();
      await this.testComplexWorkflow();
      await this.testBridgeMode();
      
      this.generateReport();
      await this.saveResults();
      
      console.log('\n✨ All tests completed!');
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    }
  }
}

// Run the test suite
const tester = new GPT5OrchestratorTest();
tester.runAllTests().catch(console.error);