/**
 * Phase 3 Integration Test
 * Tests the Gemini Filter Layer integration
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('='.repeat(60));
console.log('PHASE 3 INTEGRATION TEST');
console.log('='.repeat(60));
console.log('');

// Test 1: Environment Configuration
console.log('TEST 1: Environment Configuration');
console.log('-'.repeat(40));
const envChecks = {
  GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  ENABLE_GEMINI_FILTERING: process.env.ENABLE_GEMINI_FILTERING === 'true',
  ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
  EXA_API_KEY: !!process.env.EXA_API_KEY
};

Object.entries(envChecks).forEach(([key, value]) => {
  console.log(`  ${value ? '✅' : '❌'} ${key}: ${value ? 'configured' : 'MISSING'}`);
});
console.log('');

// Test 2: Import GeminiFilterModule
console.log('TEST 2: Import GeminiFilterModule');
console.log('-'.repeat(40));
try {
  const { GeminiFilterModule } = await import('./src/filters/GeminiFilterModule.js');
  console.log('  ✅ GeminiFilterModule imported successfully');

  // Test instantiation with a domain prompt
  const { SECURITIES_PROMPT } = await import('./src/filters/prompts/securities.js');
  const filter = new GeminiFilterModule('securities', {
    systemPrompt: SECURITIES_PROMPT,
    maxOutputTokens: 1500
  });
  console.log('  ✅ GeminiFilterModule instantiated for securities domain');
  console.log(`     Status: ${JSON.stringify(filter.getStatus())}`);
} catch (error) {
  console.log(`  ❌ GeminiFilterModule failed: ${error.message}`);
}
console.log('');

// Test 3: Import ClaudeOrchestrator
console.log('TEST 3: Import ClaudeOrchestrator');
console.log('-'.repeat(40));
try {
  const { ClaudeOrchestrator } = await import('./src/server/ClaudeOrchestrator.js');
  console.log('  ✅ ClaudeOrchestrator imported successfully');

  const orchestrator = new ClaudeOrchestrator({
    maxIterations: 3,
    enableGeminiFiltering: true
  });
  console.log('  ✅ ClaudeOrchestrator instantiated');
  console.log(`     Stats: ${JSON.stringify(orchestrator.getStats())}`);
} catch (error) {
  console.log(`  ❌ ClaudeOrchestrator failed: ${error.message}`);
  console.log(`     Stack: ${error.stack}`);
}
console.log('');

// Test 4: Import BaseWebSearchClient with getRawResults
console.log('TEST 4: BaseWebSearchClient.getRawResults()');
console.log('-'.repeat(40));
try {
  const { BaseWebSearchClient } = await import('./src/api-clients/BaseWebSearchClient.js');
  console.log('  ✅ BaseWebSearchClient imported');

  const client = new BaseWebSearchClient(null, process.env.EXA_API_KEY);
  console.log('  ✅ BaseWebSearchClient instantiated');
  console.log(`     Has getRawResults: ${typeof client.getRawResults === 'function' ? '✅ YES' : '❌ NO'}`);
} catch (error) {
  console.log(`  ❌ BaseWebSearchClient failed: ${error.message}`);
}
console.log('');

// Test 5: Import toolImplementations with orchestrator
console.log('TEST 5: toolImplementations with orchestrator');
console.log('-'.repeat(40));
try {
  const { createToolImplementations } = await import('./src/tools/toolImplementations.js');
  console.log('  ✅ createToolImplementations imported');
  console.log(`     Signature accepts 3 params: ${createToolImplementations.length === 3 || createToolImplementations.length === 0 ? '✅' : '❌'}`);
} catch (error) {
  console.log(`  ❌ toolImplementations failed: ${error.message}`);
}
console.log('');

// Test 6: Live Gemini API Test
console.log('TEST 6: Live Gemini API Test');
console.log('-'.repeat(40));
try {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  console.log('  ⏳ Testing Gemini API connection...');
  const result = await model.generateContent('Say "Phase 3 test successful" in exactly those words.');
  const response = result.response.text();

  console.log(`  ✅ Gemini API responded: "${response.substring(0, 50)}..."`);
} catch (error) {
  console.log(`  ❌ Gemini API failed: ${error.message}`);
}
console.log('');

// Test 7: Full Filter Pipeline Test
console.log('TEST 7: Full Filter Pipeline Test');
console.log('-'.repeat(40));
try {
  const { GeminiFilterModule } = await import('./src/filters/GeminiFilterModule.js');
  const { SECURITIES_PROMPT } = await import('./src/filters/prompts/securities.js');

  const filter = new GeminiFilterModule('securities', {
    systemPrompt: SECURITIES_PROMPT,
    maxOutputTokens: 1500
  });

  // Simulate raw results from Exa
  const mockRawResults = [
    {
      title: 'Apple Inc. 10-K Annual Report 2024',
      url: 'https://sec.gov/example',
      text: `Apple Inc. (AAPL) filed its Form 10-K for fiscal year 2024 on November 1, 2024.
             The company reported total net revenue of $383.3 billion, a decrease of 3% compared to 2023.
             Net income was $97.0 billion. Risk factors include supply chain disruptions,
             competition, and regulatory changes. The company has 161,000 full-time employees.`,
      rawContent: 'Same as text for testing'
    }
  ];

  console.log('  ⏳ Processing mock SEC filing through Gemini filter...');
  const focusPoints = 'Extract financial metrics and risk factors for Apple Inc.';

  const filterResult = await filter.processAndFilter(mockRawResults, focusPoints);

  console.log('  ✅ Filter processing complete');
  console.log(`     Domain: ${filterResult.domain}`);
  console.log(`     Source count: ${filterResult.sourceCount}`);
  console.log(`     Confidence: ${filterResult.confidence || 'N/A'}`);
  console.log(`     Fallback: ${filterResult.fallback ? 'Yes' : 'No'}`);
  console.log(`     Findings preview: ${typeof filterResult.findings === 'string'
    ? filterResult.findings.substring(0, 150) + '...'
    : JSON.stringify(filterResult.findings).substring(0, 150) + '...'}`);
} catch (error) {
  console.log(`  ❌ Filter pipeline failed: ${error.message}`);
  console.log(`     Stack: ${error.stack?.split('\n').slice(0, 3).join('\n')}`);
}
console.log('');

// Summary
console.log('='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log(`
Phase 3 Integration Status:
  - Environment: ${envChecks.ENABLE_GEMINI_FILTERING ? '✅ Ready' : '❌ Not configured'}
  - Gemini API: ${envChecks.GEMINI_API_KEY ? '✅ Key present' : '❌ Missing'}
  - Feature Flag: ENABLE_GEMINI_FILTERING=${process.env.ENABLE_GEMINI_FILTERING}

To run full integration:
  1. Ensure .env has GEMINI_API_KEY and ENABLE_GEMINI_FILTERING=true
  2. Start the server: node src/server/EnhancedLegalMcpServer.js
  3. Complex queries will route through Gemini filtering
`);
