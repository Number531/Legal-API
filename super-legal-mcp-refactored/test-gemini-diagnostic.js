/**
 * Gemini Response Diagnostic Test
 * Investigates why some domains return empty responses
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('='.repeat(70));
console.log('GEMINI RESPONSE DIAGNOSTIC TEST');
console.log('='.repeat(70));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test with a failing domain (securities) and a passing domain (product_safety)
const tests = [
  {
    name: 'Simple Test (No System Prompt)',
    systemPrompt: null,
    content: 'Apple Inc. reported $394 billion in revenue for fiscal 2023.',
    focus: 'Extract the company name and revenue figure.'
  },
  {
    name: 'Securities Domain (Short Content)',
    systemPrompt: `You are a securities extraction specialist. Extract company identifiers, financial metrics, and risk factors. Output in structured markdown format.`,
    content: `Apple Inc. (AAPL, CIK 0000320193) filed Form 10-K for fiscal year ending September 30, 2023.
    Total net revenue: $383.3 billion (down 3% YoY)
    Net income: $97.0 billion
    Risk factors include supply chain disruptions and intense competition.`,
    focus: 'Extract financial metrics and risk factors for Apple.'
  },
  {
    name: 'Securities Domain (With Full Prompt)',
    systemPrompt: (await import('./src/filters/prompts/securities.js')).SECURITIES_PROMPT,
    content: `Apple Inc. (AAPL, CIK 0000320193) filed Form 10-K for fiscal year ending September 30, 2023.
    Total net revenue: $383.3 billion (down 3% YoY)
    Net income: $97.0 billion
    Risk factors include supply chain disruptions and intense competition.`,
    focus: 'Extract financial metrics and risk factors.'
  },
  {
    name: 'Product Safety Domain (Short Content)',
    systemPrompt: (await import('./src/filters/prompts/productSafety.js')).PRODUCT_SAFETY_PROMPT,
    content: `CPSC Recall 24-123: Fisher-Price dumbbell toy recalled due to choking hazard.
    Affected units: 25,000 sold at Target and Walmart.
    Deaths: 0, Injuries: 0 reported.
    Remedy: Full refund available.`,
    focus: 'Extract recall details and hazard information.'
  }
];

async function runDiagnostic(test) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`TEST: ${test.name}`);
  console.log(`${'─'.repeat(70)}`);
  console.log(`System Prompt: ${test.systemPrompt ? test.systemPrompt.substring(0, 100) + '...' : 'None'}`);
  console.log(`Content length: ${test.content.length} chars`);
  console.log(`Focus: ${test.focus}`);

  try {
    const modelConfig = {
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0.1
      }
    };

    if (test.systemPrompt) {
      modelConfig.systemInstruction = test.systemPrompt;
    }

    const model = genAI.getGenerativeModel(modelConfig);

    const prompt = `${test.focus}\n\nDOCUMENTS:\n${test.content}`;

    console.log(`\nCalling Gemini...`);
    const startTime = Date.now();

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const duration = Date.now() - startTime;
    console.log(`Duration: ${duration}ms`);

    // Examine raw response structure
    console.log(`\n📋 Response Analysis:`);
    console.log(`   - candidates: ${result.response.candidates?.length || 0}`);

    if (result.response.candidates?.length > 0) {
      const candidate = result.response.candidates[0];
      console.log(`   - finishReason: ${candidate.finishReason}`);
      console.log(`   - safetyRatings: ${JSON.stringify(candidate.safetyRatings?.map(r => ({cat: r.category, prob: r.probability})) || 'none')}`);
      console.log(`   - content.parts: ${candidate.content?.parts?.length || 0}`);

      if (candidate.content?.parts?.length > 0) {
        const textPart = candidate.content.parts.find(p => p.text);
        console.log(`   - text length: ${textPart?.text?.length || 0}`);
      }
    }

    // Get response text
    const responseText = result.response.text();
    console.log(`\n📝 Response Text (${responseText.length} chars):`);
    console.log('─'.repeat(50));
    if (responseText.length === 0) {
      console.log('   ⚠️ EMPTY RESPONSE');
    } else {
      console.log(responseText.substring(0, 400) + (responseText.length > 400 ? '...' : ''));
    }
    console.log('─'.repeat(50));

    // Check prompt feedback
    if (result.response.promptFeedback) {
      console.log(`\n⚠️ Prompt Feedback: ${JSON.stringify(result.response.promptFeedback)}`);
    }

    return { success: true, length: responseText.length };

  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    console.log(`   Status: ${error.status || 'N/A'}`);
    console.log(`   Details: ${JSON.stringify(error.errorDetails || {})}`);
    return { success: false, error: error.message };
  }
}

async function runAllDiagnostics() {
  const results = [];

  for (const test of tests) {
    const result = await runDiagnostic(test);
    results.push({ name: test.name, ...result });

    // Wait between tests
    await new Promise(r => setTimeout(r, 2000));
  }

  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log('DIAGNOSTIC SUMMARY');
  console.log(`${'═'.repeat(70)}`);

  for (const r of results) {
    const status = r.success ? (r.length > 0 ? '✅' : '⚠️ EMPTY') : '❌';
    console.log(`${status} ${r.name}: ${r.success ? `${r.length} chars` : r.error}`);
  }

  console.log('');
}

runAllDiagnostics().catch(console.error);
