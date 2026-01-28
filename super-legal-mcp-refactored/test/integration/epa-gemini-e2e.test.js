/**
 * End-to-end test: EPA ECHO -> Narrative -> Gemini Filter
 * Tests the complete pipeline with actual Gemini API calls
 *
 * Prerequisites:
 * - GEMINI_API_KEY in .env
 * - Network access to EPA ECHO API and Gemini API
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { EPAComplianceClient } from '../../src/api-clients/EPAComplianceClient.js';
import { GeminiFilterModule } from '../../src/filters/GeminiFilterModule.js';
import { ENVIRONMENTAL_PROMPT } from '../../src/filters/prompts/environmental.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Check for required API key
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY not set in .env');
  console.error('This test requires a valid Gemini API key.');
  process.exit(1);
}

const testCases = [
  {
    name: "Pittsburgh facilities",
    query: "in Pittsburgh, PA",  // City + state only - parser handles well
    focusPoints: "Extract penalty amounts, enforcement actions, and violation history",
    expectedInOutput: ["facility", "PA"],
    maxOutputTokens: 2000
  },
  {
    name: "Houston facilities",
    query: "in Houston, TX",
    focusPoints: "Extract compliance status, quarters in non-compliance, violation types",
    expectedInOutput: ["facility", "TX"],
    maxOutputTokens: 2000
  },
  {
    name: "Chicago facilities",
    query: "in Chicago, IL",
    focusPoints: "Extract facility details, location, compliance status",
    expectedInOutput: ["facility", "IL"],
    maxOutputTokens: 1500
  }
];

async function runE2ETest(testCase) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log(`Query: "${testCase.query}"`);
  console.log(`${'─'.repeat(60)}`);

  const client = new EPAComplianceClient(null);
  const filter = new GeminiFilterModule('environmental', {
    systemPrompt: ENVIRONMENTAL_PROMPT
  });

  try {
    // Step 1: Get raw results from EPA ECHO
    console.log('\n1. Fetching from EPA ECHO...');
    const rawResults = await client.getRawResults(testCase.query, 3);

    if (rawResults.length === 0) {
      console.log('   ⚠️ No results from EPA ECHO for this query');
      return { passed: 0, failed: testCase.expectedInOutput.length + 2, skipped: true };
    }

    const inputChars = rawResults.reduce((sum, r) => sum + r.text.length, 0);
    const inputTokens = Math.ceil(inputChars / 4);
    console.log(`   Raw results: ${rawResults.length} facilities`);
    console.log(`   Input size: ${inputChars.toLocaleString()} chars (~${inputTokens.toLocaleString()} tokens)`);

    // Step 2: Run through Gemini filter
    console.log('\n2. Processing through Gemini filter...');
    const filterResult = await filter.processAndFilter(rawResults, testCase.focusPoints);

    // Extract findings text
    let findings = '';
    if (typeof filterResult.findings === 'string') {
      findings = filterResult.findings;
    } else if (Array.isArray(filterResult.findings)) {
      findings = filterResult.findings.map(f => f.preview || f.title || '').join(' ');
    }

    const outputChars = findings.length;
    const outputTokens = Math.ceil(outputChars / 4);
    const reduction = inputTokens > 0 ? ((1 - outputTokens / inputTokens) * 100).toFixed(1) : 0;

    console.log(`   Output size: ${outputChars.toLocaleString()} chars (~${outputTokens.toLocaleString()} tokens)`);
    console.log(`   Token reduction: ${reduction}%`);

    if (filterResult.fallback) {
      console.log(`   ⚠️ Fallback used: ${filterResult.fallbackReason}`);
    }

    // Step 3: Validate output
    console.log('\n3. Validating output...');
    let passed = 0;
    let failed = 0;

    // Check expected content
    for (const expected of testCase.expectedInOutput) {
      if (findings.toLowerCase().includes(expected.toLowerCase())) {
        console.log(`   ✓ Contains "${expected}"`);
        passed++;
      } else {
        console.log(`   ✗ Missing "${expected}"`);
        failed++;
      }
    }

    // Check token limit (only if not fallback)
    if (!filterResult.fallback) {
      if (outputTokens <= testCase.maxOutputTokens) {
        console.log(`   ✓ Within token limit (${outputTokens} <= ${testCase.maxOutputTokens})`);
        passed++;
      } else {
        console.log(`   ✗ Exceeds token limit (${outputTokens} > ${testCase.maxOutputTokens})`);
        failed++;
      }
    } else {
      console.log(`   ○ Token limit check skipped (fallback mode)`);
    }

    // Check non-empty
    if (findings.trim().length > 50) {
      console.log(`   ✓ Output is substantial (${findings.length} chars)`);
      passed++;
    } else {
      console.log(`   ✗ Output too short (${findings.length} chars)`);
      failed++;
    }

    return { passed, failed, reduction: parseFloat(reduction), fallback: filterResult.fallback };

  } catch (error) {
    console.log(`   ✗ ERROR: ${error.message}`);
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      console.log('   ⚠️ Rate limited - waiting 60s before next test...');
      await new Promise(r => setTimeout(r, 60000));
    }
    return { passed: 0, failed: testCase.expectedInOutput.length + 2, error: error.message };
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('EPA ECHO → GEMINI END-TO-END TEST');
  console.log('='.repeat(60));
  console.log(`Gemini API Key: ${process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`Test cases: ${testCases.length}`);

  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  const reductions = [];

  for (const testCase of testCases) {
    const result = await runE2ETest(testCase);
    totalPassed += result.passed;
    totalFailed += result.failed;

    if (result.skipped) {
      totalSkipped++;
    }

    if (result.reduction && !result.fallback) {
      reductions.push(result.reduction);
    }

    // Rate limit between tests
    console.log('\n   Waiting 3s before next test...');
    await new Promise(r => setTimeout(r, 3000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);

  if (totalSkipped > 0) {
    console.log(`Skipped: ${totalSkipped} tests (no EPA results)`);
  }

  if (reductions.length > 0) {
    const avgReduction = (reductions.reduce((a, b) => a + b, 0) / reductions.length).toFixed(1);
    console.log(`Average token reduction: ${avgReduction}%`);
  }

  const success = totalFailed === 0;
  console.log(`\nOverall: ${success ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('');

  return success;
}

runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
