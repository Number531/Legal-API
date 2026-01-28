/**
 * Gemini Content Size Limit Test
 * Tests different content sizes to find threshold where responses become empty
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('='.repeat(70));
console.log('GEMINI CONTENT SIZE LIMIT TEST');
console.log('='.repeat(70));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate sample content of specified size
function generateContent(charCount) {
  const sampleDoc = `
Document Title: Sample SEC Filing
Company: Test Corporation (TSLA, CIK 1234567890)
Filing Date: 2024-01-15
Period: Q4 2024

Financial Highlights:
- Total Revenue: $50.3 billion (up 25% YoY)
- Net Income: $8.2 billion
- Operating Cash Flow: $12.1 billion

Risk Factors:
1. Supply chain disruptions could impact production
2. Intense competition in the electric vehicle market
3. Regulatory changes may affect operations
4. Currency fluctuations could impact international revenue

Management Discussion:
The company experienced strong growth in all segments during the quarter.
Production capacity increased by 30% with new factory openings.
Investment in R&D continued at $2.5 billion quarterly rate.

Forward Looking Statements:
The company expects continued growth in 2025 with new product launches.
Capital expenditure planned at $8-10 billion for facility expansion.

`;

  // Repeat to reach target size
  const repeats = Math.ceil(charCount / sampleDoc.length);
  let content = '';
  for (let i = 0; i < repeats && content.length < charCount; i++) {
    content += `\n=== DOCUMENT ${i + 1} ===\n${sampleDoc}`;
  }
  return content.substring(0, charCount);
}

// Test sizes (in characters, roughly 4 chars = 1 token)
const testSizes = [
  { chars: 1000, desc: '~250 tokens' },
  { chars: 10000, desc: '~2.5K tokens' },
  { chars: 50000, desc: '~12.5K tokens' },
  { chars: 100000, desc: '~25K tokens' },
  { chars: 250000, desc: '~62.5K tokens' },
  { chars: 500000, desc: '~125K tokens' },
  { chars: 1000000, desc: '~250K tokens' },
  { chars: 1500000, desc: '~375K tokens' },
];

async function testSize(size) {
  const content = generateContent(size.chars);
  const actualChars = content.length;
  const approxTokens = Math.ceil(actualChars / 4);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Testing: ${size.chars.toLocaleString()} chars (${size.desc})`);
  console.log(`Actual: ${actualChars.toLocaleString()} chars (~${approxTokens.toLocaleString()} tokens)`);

  const { SECURITIES_PROMPT } = await import('./src/filters/prompts/securities.js');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SECURITIES_PROMPT,
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.1
    }
  });

  const prompt = `Extract financial metrics and risk factors from these SEC filings.\n\nDOCUMENTS:\n${content}`;

  try {
    const startTime = Date.now();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    const duration = Date.now() - startTime;

    const responseText = result.response.text();
    const finishReason = result.response.candidates?.[0]?.finishReason || 'unknown';

    console.log(`  Duration: ${duration}ms`);
    console.log(`  Finish reason: ${finishReason}`);
    console.log(`  Response length: ${responseText.length} chars`);

    if (responseText.length === 0) {
      console.log(`  ⚠️ EMPTY RESPONSE`);

      // Check for blocked content
      const feedback = result.response.promptFeedback;
      if (feedback) {
        console.log(`  Prompt feedback: ${JSON.stringify(feedback)}`);
      }

      const candidate = result.response.candidates?.[0];
      if (candidate?.safetyRatings) {
        const blocked = candidate.safetyRatings.filter(r => r.blocked);
        if (blocked.length > 0) {
          console.log(`  Blocked categories: ${JSON.stringify(blocked)}`);
        }
      }
    } else {
      console.log(`  ✅ Response preview: ${responseText.substring(0, 150).replace(/\n/g, ' ')}...`);
    }

    return {
      size: size.chars,
      success: responseText.length > 0,
      responseLength: responseText.length,
      duration,
      finishReason
    };

  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    return {
      size: size.chars,
      success: false,
      error: error.message,
      responseLength: 0
    };
  }
}

async function runAllTests() {
  const results = [];

  for (const size of testSizes) {
    const result = await testSize(size);
    results.push(result);

    // Stop if we hit empty response threshold
    if (!result.success && !result.error) {
      console.log(`\n⚠️ Found empty response threshold at ~${size.chars.toLocaleString()} chars`);
      break;
    }

    // Rate limit between tests
    await new Promise(r => setTimeout(r, 2000));
  }

  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log('SIZE TEST SUMMARY');
  console.log(`${'═'.repeat(70)}`);
  console.log('');
  console.log('| Size (chars) | Tokens | Status | Response Len | Duration |');
  console.log('|--------------|--------|--------|--------------|----------|');

  for (const r of results) {
    const tokens = Math.ceil(r.size / 4);
    const status = r.success ? '✅' : (r.error ? '❌ Error' : '⚠️ Empty');
    const respLen = r.responseLength?.toLocaleString() || 'N/A';
    const duration = r.duration ? `${r.duration}ms` : 'N/A';
    console.log(`| ${r.size.toLocaleString().padEnd(12)} | ${tokens.toLocaleString().padEnd(6)} | ${status.padEnd(6)} | ${respLen.padEnd(12)} | ${duration.padEnd(8)} |`);
  }

  // Find threshold
  const lastSuccess = results.filter(r => r.success).pop();
  const firstFail = results.find(r => !r.success);

  if (lastSuccess && firstFail) {
    console.log(`\n📊 Content Size Threshold:`);
    console.log(`   Last success: ${lastSuccess.size.toLocaleString()} chars (~${Math.ceil(lastSuccess.size/4).toLocaleString()} tokens)`);
    console.log(`   First failure: ${firstFail.size.toLocaleString()} chars (~${Math.ceil(firstFail.size/4).toLocaleString()} tokens)`);
    console.log(`\n💡 Recommendation: Truncate raw content to ~${lastSuccess.size.toLocaleString()} chars per request`);
  } else if (results.every(r => r.success)) {
    console.log(`\n✅ All sizes successful! Gemini handled up to ${testSizes[testSizes.length-1].chars.toLocaleString()} chars`);
  }

  console.log('');
}

runAllTests().catch(console.error);
