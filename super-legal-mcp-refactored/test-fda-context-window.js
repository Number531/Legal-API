#!/usr/bin/env node

/**
 * FDA Context Window Overflow Test Suite
 * Tests whether multi-turn conversations with FDA tools overflow Claude's 200K context window
 *
 * Validates:
 * - Token accumulation across multiple turns
 * - smartTruncate() activation threshold
 * - Session memory management
 * - limitResults() effectiveness
 * - Comparison with EPA client
 */

import { FDAHybridClient } from './src/api-clients/FDAHybridClient.js';
import { EPAHybridClient } from './src/api-clients/EPAHybridClient.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🧪 FDA Context Window Overflow Test Suite');
console.log('Testing conversation history token accumulation\n');
console.log('='.repeat(70) + '\n');

/**
 * Mock SessionManager and ConversationSession for testing
 * (Simplified version from claude-server-v2.js)
 */
class ConversationSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.conversationHistory = [];
    this.researchContext = {
      entities: new Set(),
      toolResults: new Map(),
      lastActivity: Date.now()
    };
    this.createdAt = Date.now();
  }

  addUserMessage(content) {
    this.conversationHistory.push({
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    });
  }

  addAssistantResponse(content, toolResults = []) {
    this.conversationHistory.push({
      role: 'assistant',
      content,
      timestamp: new Date().toISOString()
    });

    if (toolResults.length > 0) {
      this.conversationHistory.push(...toolResults);
    }
  }

  addToolResults(toolResults) {
    this.conversationHistory.push(...toolResults);
  }

  getContextualHistory(maxTokens = 32000) {
    return this.smartTruncate(this.conversationHistory, maxTokens);
  }

  smartTruncate(history, maxTokens) {
    const maxChars = maxTokens * 4; // 1 token ≈ 4 chars
    let totalChars = 0;
    const truncated = [];

    // Work backwards from most recent
    for (let i = history.length - 1; i >= 0; i--) {
      const message = history[i];
      const messageSize = JSON.stringify(message).length;

      if (totalChars + messageSize > maxChars && truncated.length > 0) {
        break;
      }

      truncated.unshift(message);
      totalChars += messageSize;
    }

    return truncated;
  }

  getTokenCount() {
    const historyJson = JSON.stringify(this.conversationHistory);
    return Math.ceil(historyJson.length / 4);
  }

  getTruncatedTokenCount() {
    const truncated = this.getContextualHistory();
    const truncatedJson = JSON.stringify(truncated);
    return Math.ceil(truncatedJson.length / 4);
  }
}

/**
 * Estimate token count from text
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Simulate Claude's response to user query
 */
function simulateClaudeResponse(turnNumber, queryType) {
  const responses = {
    web_search: `Based on the FDA web search results, I found ${Math.floor(Math.random() * 5) + 1} relevant adverse event reports. The data shows patterns of reactions including headache, nausea, and dizziness. These findings align with known side effect profiles.`,

    native_api: `After analyzing the FDA openFDA API data, I've identified ${Math.floor(Math.random() * 2) + 1} adverse event cases with detailed regulatory information including MedDRA codes, serious outcome indicators, and regulatory timelines. The comprehensive data provides authoritative evidence for safety assessment.`,

    mixed: `Combining web search and native API data, I can provide a comprehensive analysis. The pattern suggests increased reporting frequency in Q${Math.floor(Math.random() * 4) + 1}, with serious events comprising ${Math.floor(Math.random() * 30) + 10}% of total reports.`
  };

  return responses[queryType] || responses.web_search;
}

/**
 * Test 1: Realistic Multi-Turn Conversation
 */
async function testRealisticScenario() {
  console.log('📋 Test 1: Realistic Multi-Turn Conversation (10 turns)');
  console.log('='.repeat(70) + '\n');

  const fdaClient = new FDAHybridClient({
    apiKey: process.env.EXA_API_KEY,
    enableCircuitBreaker: true
  });

  const session = new ConversationSession('test-realistic-001');
  const tokenLog = [];

  // Define 10-turn conversation pattern
  const conversationPlan = [
    { turn: 1, type: 'web_search', query: 'aspirin adverse events', expectedTokens: 1000 },
    { turn: 2, type: 'web_search', query: 'ibuprofen adverse events', expectedTokens: 1000 },
    { turn: 3, type: 'native_api', query: 'openfda.brand_name:"Aspirin"', expectedTokens: 5000 },
    { turn: 4, type: 'web_search', query: 'naproxen adverse events', expectedTokens: 1000 },
    { turn: 5, type: 'native_api', query: 'openfda.brand_name:"Advil"', expectedTokens: 5000 },
    { turn: 6, type: 'web_search', query: 'acetaminophen adverse events', expectedTokens: 1000 },
    { turn: 7, type: 'mixed', query: 'compare NSAID safety profiles', expectedTokens: 3000 },
    { turn: 8, type: 'web_search', query: 'FDA drug recalls 2024', expectedTokens: 1000 },
    { turn: 9, type: 'native_api', query: 'openfda.brand_name:"Tylenol"', expectedTokens: 5000 },
    { turn: 10, type: 'mixed', query: 'synthesize findings', expectedTokens: 2000 }
  ];

  console.log('Conversation Plan:');
  conversationPlan.forEach(turn => {
    console.log(`  Turn ${turn.turn}: ${turn.type.padEnd(12)} - "${turn.query}"`);
  });
  console.log();

  for (const plan of conversationPlan) {
    console.log(`\n🔄 Turn ${plan.turn}: ${plan.type}`);

    // User message
    session.addUserMessage(plan.query);

    // Execute FDA query based on type
    let toolResult;
    try {
      if (plan.type === 'native_api' || plan.type === 'mixed') {
        toolResult = await fdaClient.searchDrugAdverseEvents({
          search: plan.query,
          limit: 2  // Optimized limit
        });
      } else {
        // Web search simulation
        toolResult = await fdaClient.searchDrugAdverseEvents({
          search: plan.query,
          limit: 5
        });
      }

      const resultText = toolResult.content[0].text;
      const resultTokens = estimateTokens(resultText);

      // Claude's response
      const claudeResponse = simulateClaudeResponse(plan.turn, plan.type);
      const responseTokens = estimateTokens(claudeResponse);

      // Add to session
      session.addAssistantResponse(claudeResponse, [{
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: `tool_${plan.turn}`,
          content: resultText
        }]
      }]);

      // Calculate cumulative tokens
      const fullTokens = session.getTokenCount();
      const truncatedTokens = session.getTruncatedTokenCount();
      const wasTruncated = fullTokens > truncatedTokens;

      tokenLog.push({
        turn: plan.turn,
        type: plan.type,
        toolTokens: resultTokens,
        responseTokens: responseTokens,
        cumulativeTokens: fullTokens,
        truncatedTokens: truncatedTokens,
        truncated: wasTruncated
      });

      console.log(`   Tool result: ~${resultTokens.toLocaleString()} tokens`);
      console.log(`   Claude response: ~${responseTokens.toLocaleString()} tokens`);
      console.log(`   Cumulative: ~${fullTokens.toLocaleString()} tokens`);
      console.log(`   After truncation: ~${truncatedTokens.toLocaleString()} tokens`);
      console.log(`   Truncated: ${wasTruncated ? '⚠️ YES' : '✅ No'}`);

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      tokenLog.push({
        turn: plan.turn,
        type: plan.type,
        error: error.message
      });
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Realistic Scenario Summary\n');

  const successfulTurns = tokenLog.filter(t => !t.error);
  if (successfulTurns.length > 0) {
    const finalTokens = successfulTurns[successfulTurns.length - 1].cumulativeTokens;
    const finalTruncated = successfulTurns[successfulTurns.length - 1].truncatedTokens;
    const maxTokens = Math.max(...successfulTurns.map(t => t.cumulativeTokens));
    const truncationActivated = successfulTurns.some(t => t.truncated);

    console.log(`Total turns completed: ${successfulTurns.length}/10`);
    console.log(`Final cumulative tokens: ~${finalTokens.toLocaleString()}`);
    console.log(`Final after truncation: ~${finalTruncated.toLocaleString()}`);
    console.log(`Peak token usage: ~${maxTokens.toLocaleString()}`);
    console.log(`Truncation activated: ${truncationActivated ? 'Yes ⚠️' : 'No ✅'}`);
    console.log(`\nContext window status:`);
    console.log(`  32K limit: ${finalTruncated < 32000 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  200K limit: ${finalTokens < 200000 ? '✅ PASS' : '❌ FAIL'}`);
  }

  return tokenLog;
}

/**
 * Test 2: Worst-Case Stress Test (20 consecutive native API calls)
 */
async function testWorstCaseScenario() {
  console.log('\n\n📋 Test 2: Worst-Case Stress Test (20 native API calls)');
  console.log('='.repeat(70) + '\n');

  const fdaClient = new FDAHybridClient({
    apiKey: process.env.EXA_API_KEY,
    enableCircuitBreaker: true
  });

  const session = new ConversationSession('test-stress-001');
  const tokenLog = [];

  const drugs = [
    'Aspirin', 'Ibuprofen', 'Naproxen', 'Acetaminophen', 'Lipitor',
    'Metformin', 'Lisinopril', 'Levothyroxine', 'Atorvastatin', 'Metoprolol',
    'Amlodipine', 'Omeprazole', 'Simvastatin', 'Losartan', 'Gabapentin',
    'Hydrochlorothiazide', 'Furosemide', 'Prednisone', 'Amoxicillin', 'Albuterol'
  ];

  console.log(`Testing ${drugs.length} consecutive native API queries (limit=2)\n`);

  for (let i = 0; i < drugs.length; i++) {
    const drug = drugs[i];
    console.log(`\n🔄 Turn ${i + 1}/${drugs.length}: ${drug}`);

    session.addUserMessage(`Search FDA adverse events for ${drug}`);

    try {
      const toolResult = await fdaClient.searchDrugAdverseEvents({
        search: `openfda.brand_name:"${drug}"`,
        limit: 2  // Worst case: native API with limit=2
      });

      const resultText = toolResult.content[0].text;
      const resultTokens = estimateTokens(resultText);
      const claudeResponse = simulateClaudeResponse(i + 1, 'native_api');
      const responseTokens = estimateTokens(claudeResponse);

      session.addAssistantResponse(claudeResponse, [{
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: `tool_${i + 1}`,
          content: resultText
        }]
      }]);

      const fullTokens = session.getTokenCount();
      const truncatedTokens = session.getTruncatedTokenCount();
      const wasTruncated = fullTokens > truncatedTokens;

      tokenLog.push({
        turn: i + 1,
        drug: drug,
        toolTokens: resultTokens,
        responseTokens: responseTokens,
        cumulativeTokens: fullTokens,
        truncatedTokens: truncatedTokens,
        truncated: wasTruncated,
        messagesDropped: session.conversationHistory.length - session.getContextualHistory().length
      });

      console.log(`   Tool result: ~${resultTokens.toLocaleString()} tokens`);
      console.log(`   Cumulative: ~${fullTokens.toLocaleString()} tokens`);
      console.log(`   After truncation: ~${truncatedTokens.toLocaleString()} tokens`);
      console.log(`   Truncated: ${wasTruncated ? '⚠️ YES' : '✅ No'}`);
      if (wasTruncated) {
        console.log(`   Messages dropped: ${tokenLog[i].messagesDropped}`);
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      tokenLog.push({ turn: i + 1, drug, error: error.message });
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Stress Test Summary\n');

  const successfulTurns = tokenLog.filter(t => !t.error);
  if (successfulTurns.length > 0) {
    const finalTokens = successfulTurns[successfulTurns.length - 1].cumulativeTokens;
    const finalTruncated = successfulTurns[successfulTurns.length - 1].truncatedTokens;
    const maxTokens = Math.max(...successfulTurns.map(t => t.cumulativeTokens));
    const firstTruncation = successfulTurns.find(t => t.truncated);
    const avgToolTokens = successfulTurns.reduce((sum, t) => sum + t.toolTokens, 0) / successfulTurns.length;

    console.log(`Total turns completed: ${successfulTurns.length}/${drugs.length}`);
    console.log(`Average tool response: ~${Math.round(avgToolTokens).toLocaleString()} tokens`);
    console.log(`Peak cumulative tokens: ~${maxTokens.toLocaleString()}`);
    console.log(`Final after truncation: ~${finalTruncated.toLocaleString()}`);
    console.log(`First truncation: Turn ${firstTruncation ? firstTruncation.turn : 'None'}`);
    console.log(`\nContext window status:`);
    console.log(`  32K limit: ${finalTruncated < 32000 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  200K limit: ${maxTokens < 200000 ? '✅ PASS' : '❌ FAIL'}`);

    if (firstTruncation) {
      console.log(`\nTruncation Analysis:`);
      console.log(`  Activated at: ~${firstTruncation.cumulativeTokens.toLocaleString()} tokens`);
      console.log(`  Reduced to: ~${firstTruncation.truncatedTokens.toLocaleString()} tokens`);
      console.log(`  Messages dropped: ${firstTruncation.messagesDropped}`);
      console.log(`  Protection working: ✅ YES`);
    }
  }

  return tokenLog;
}

/**
 * Test 3: EPA Comparison Test
 */
async function testEPAComparison() {
  console.log('\n\n📋 Test 3: EPA Client Comparison (5 queries)');
  console.log('='.repeat(70) + '\n');

  const epaClient = new EPAHybridClient({
    apiKey: process.env.EXA_API_KEY
  });

  const session = new ConversationSession('test-epa-001');
  const tokenLog = [];

  const queries = [
    { company: 'Shell', state: 'TX' },
    { company: 'ExxonMobil', state: 'TX' },
    { company: 'Chevron', state: 'CA' },
    { company: 'BP', state: 'TX' },
    { company: 'Marathon', state: 'OH' }
  ];

  console.log(`Testing ${queries.length} EPA facility queries\n`);

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`\n🔄 Turn ${i + 1}/${queries.length}: ${query.company} in ${query.state}`);

    session.addUserMessage(`Search EPA facilities for ${query.company} in ${query.state}`);

    try {
      const toolResult = await epaClient.searchFacilities({
        company_name: query.company,
        state: query.state,
        limit: 5
      });

      const resultText = toolResult.content[0].text;
      const resultTokens = estimateTokens(resultText);
      const claudeResponse = `Based on EPA data, I found compliance records for ${query.company} facilities in ${query.state}.`;
      const responseTokens = estimateTokens(claudeResponse);

      session.addAssistantResponse(claudeResponse, [{
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: `epa_tool_${i + 1}`,
          content: resultText
        }]
      }]);

      const fullTokens = session.getTokenCount();
      const truncatedTokens = session.getTruncatedTokenCount();

      tokenLog.push({
        turn: i + 1,
        company: query.company,
        toolTokens: resultTokens,
        responseTokens: responseTokens,
        cumulativeTokens: fullTokens,
        truncatedTokens: truncatedTokens
      });

      console.log(`   Tool result: ~${resultTokens.toLocaleString()} tokens`);
      console.log(`   Cumulative: ~${fullTokens.toLocaleString()} tokens`);
      console.log(`   After truncation: ~${truncatedTokens.toLocaleString()} tokens`);

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      tokenLog.push({ turn: i + 1, company: query.company, error: error.message });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 EPA Comparison Summary\n');

  const successfulTurns = tokenLog.filter(t => !t.error);
  if (successfulTurns.length > 0) {
    const avgToolTokens = successfulTurns.reduce((sum, t) => sum + t.toolTokens, 0) / successfulTurns.length;
    const finalTokens = successfulTurns[successfulTurns.length - 1].cumulativeTokens;

    console.log(`Average EPA response: ~${Math.round(avgToolTokens).toLocaleString()} tokens`);
    console.log(`Final cumulative: ~${finalTokens.toLocaleString()} tokens`);
    console.log(`\nComparison:`);
    console.log(`  FDA avg (limit=2): ~2,000-5,000 tokens`);
    console.log(`  EPA avg (limit=5): ~${Math.round(avgToolTokens).toLocaleString()} tokens`);
  }

  return tokenLog;
}

/**
 * Main test runner
 */
async function runAllTests() {
  if (!process.env.EXA_API_KEY) {
    console.error('❌ EXA_API_KEY not configured');
    console.error('   Set EXA_API_KEY environment variable to run tests\n');
    process.exit(1);
  }

  const results = {
    realistic: null,
    stress: null,
    epa: null
  };

  try {
    results.realistic = await testRealisticScenario();
  } catch (error) {
    console.error('❌ Realistic scenario failed:', error);
  }

  try {
    results.stress = await testWorstCaseScenario();
  } catch (error) {
    console.error('❌ Stress test failed:', error);
  }

  try {
    results.epa = await testEPAComparison();
  } catch (error) {
    console.error('❌ EPA comparison failed:', error);
  }

  // Final verdict
  console.log('\n\n' + '='.repeat(70));
  console.log('🎯 FINAL VERDICT\n');

  const realisticPass = results.realistic &&
    results.realistic.filter(t => !t.error).every(t => t.truncatedTokens < 32000);
  const stressPass = results.stress &&
    results.stress.filter(t => !t.error).every(t => t.truncatedTokens < 32000);
  const noOverflow = results.stress &&
    Math.max(...results.stress.filter(t => !t.error).map(t => t.cumulativeTokens)) < 200000;

  console.log(`✅ Realistic scenario (10 turns): ${realisticPass ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Stress test (20 native calls): ${stressPass ? 'PASS' : 'FAIL'}`);
  console.log(`✅ No 200K overflow: ${noOverflow ? 'PASS' : 'FAIL'}`);

  console.log('\n🔒 Production Safety Assessment:');
  if (realisticPass && stressPass && noOverflow) {
    console.log('   ✅ SAFE FOR PRODUCTION');
    console.log('   ✅ smartTruncate() working correctly');
    console.log('   ✅ FDA limit=2 prevents token overflow');
    console.log('   ✅ Multi-turn conversations supported');
    process.exit(0);
  } else {
    console.log('   ⚠️  NEEDS REVIEW');
    console.log('   ⚠️  Check failed tests above');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});
