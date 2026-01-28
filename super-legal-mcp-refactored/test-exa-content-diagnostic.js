/**
 * Exa Raw Content Diagnostic
 * Examines actual content from Exa to understand why some domains fail
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('='.repeat(70));
console.log('EXA CONTENT DIAGNOSTIC');
console.log('='.repeat(70));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function loadClients() {
  const { BaseWebSearchClient } = await import('./src/api-clients/BaseWebSearchClient.js');
  return new BaseWebSearchClient(null, process.env.EXA_API_KEY);
}

async function analyzeContent(content, label) {
  console.log(`\n📋 Content Analysis for "${label}":`);
  console.log(`   Total chars: ${content.length.toLocaleString()}`);

  // Check for problematic patterns
  const checks = {
    hasNullBytes: content.includes('\x00'),
    hasBinaryLooking: /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(content),
    hasBase64Blocks: /[A-Za-z0-9+/=]{100,}/.test(content),
    hasHTMLTags: /<[a-z][\s\S]*>/i.test(content),
    hasScriptTags: /<script[\s\S]*?>/i.test(content),
    hasStyleTags: /<style[\s\S]*?>/i.test(content),
    htmlTagCount: (content.match(/<[^>]+>/g) || []).length,
    emptyLines: (content.match(/^\s*$/gm) || []).length,
    avgLineLength: content.split('\n').reduce((a, l) => a + l.length, 0) / content.split('\n').length,
    unicodeChars: (content.match(/[^\x00-\x7F]/g) || []).length,
    jsonLooking: content.trim().startsWith('{') || content.trim().startsWith('['),
  };

  console.log(`   Null bytes: ${checks.hasNullBytes}`);
  console.log(`   Binary chars: ${checks.hasBinaryLooking}`);
  console.log(`   Base64 blocks: ${checks.hasBase64Blocks}`);
  console.log(`   HTML tags: ${checks.htmlTagCount}`);
  console.log(`   Script tags: ${checks.hasScriptTags}`);
  console.log(`   Style tags: ${checks.hasStyleTags}`);
  console.log(`   Empty lines: ${checks.emptyLines}`);
  console.log(`   Avg line length: ${checks.avgLineLength.toFixed(0)}`);
  console.log(`   Unicode chars: ${checks.unicodeChars}`);
  console.log(`   JSON-looking: ${checks.jsonLooking}`);

  // Show first 500 chars
  console.log(`\n   First 500 chars:`);
  console.log('   ' + '-'.repeat(50));
  const preview = content.substring(0, 500).replace(/\n/g, '\\n').replace(/\t/g, '\\t');
  console.log(`   ${preview}`);
  console.log('   ' + '-'.repeat(50));

  return checks;
}

async function testWithGemini(content, domain, prompt) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: prompt,
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.1
    }
  });

  const userPrompt = `Extract key information from these documents.\n\nDOCUMENTS:\n${content}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
    });

    const responseText = result.response.text();
    const finishReason = result.response.candidates?.[0]?.finishReason;

    return {
      success: responseText.length > 0,
      length: responseText.length,
      finishReason,
      preview: responseText.substring(0, 200)
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runDiagnostic() {
  const client = await loadClients();

  // Test cases - one failing (securities) and one passing (product_safety)
  const tests = [
    {
      name: 'Securities (FAILED in E2E)',
      query: 'Tesla 10-K 2024 risk factors',
      includeDomains: ['sec.gov'],
      domain: 'securities'
    },
    {
      name: 'Product Safety (PASSED in E2E)',
      query: 'CPSC recall children toys choking hazard 2024',
      includeDomains: ['cpsc.gov'],
      domain: 'product_safety'
    },
    {
      name: 'Patent (PASSED in E2E)',
      query: 'USPTO AI machine learning patent claims 2024',
      includeDomains: ['uspto.gov'],
      domain: 'patent'
    }
  ];

  // Load prompts
  const { SECURITIES_PROMPT } = await import('./src/filters/prompts/securities.js');
  const { PRODUCT_SAFETY_PROMPT } = await import('./src/filters/prompts/productSafety.js');
  const { PATENT_PROMPT } = await import('./src/filters/prompts/patent.js');

  const prompts = {
    securities: SECURITIES_PROMPT,
    product_safety: PRODUCT_SAFETY_PROMPT,
    patent: PATENT_PROMPT
  };

  for (const test of tests) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`TEST: ${test.name}`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`Query: ${test.query}`);
    console.log(`Domains: ${test.includeDomains.join(', ')}`);

    // Fetch raw results
    console.log(`\n⏳ Fetching raw results from Exa...`);
    const rawResults = await client.getRawResults(test.query, 1, {
      includeDomains: test.includeDomains,
      domain: test.domain
    });

    if (!rawResults || rawResults.length === 0) {
      console.log(`   ⚠️ No results from Exa`);
      continue;
    }

    console.log(`   ✅ Got ${rawResults.length} result(s)`);

    // Analyze the first result's content
    const firstResult = rawResults[0];
    const content = firstResult.text || firstResult.rawContent || '';

    console.log(`\n📄 First Result:`);
    console.log(`   Title: ${firstResult.title || 'N/A'}`);
    console.log(`   URL: ${firstResult.url || 'N/A'}`);

    // Analyze content
    await analyzeContent(content, test.name);

    // Test with Gemini
    console.log(`\n🤖 Testing with Gemini...`);
    const geminiResult = await testWithGemini(content, test.domain, prompts[test.domain]);

    if (geminiResult.success) {
      console.log(`   ✅ Gemini returned ${geminiResult.length} chars`);
      console.log(`   Finish reason: ${geminiResult.finishReason}`);
      console.log(`   Preview: ${geminiResult.preview}...`);
    } else {
      console.log(`   ❌ Gemini returned empty or error`);
      console.log(`   Reason: ${geminiResult.error || geminiResult.finishReason}`);
    }

    // Also test with cleaned content (strip HTML, limit size)
    console.log(`\n🧹 Testing with cleaned content...`);
    const cleanedContent = content
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100000); // Limit to 100k chars

    console.log(`   Original: ${content.length.toLocaleString()} chars`);
    console.log(`   Cleaned: ${cleanedContent.length.toLocaleString()} chars`);

    const cleanedResult = await testWithGemini(cleanedContent, test.domain, prompts[test.domain]);

    if (cleanedResult.success) {
      console.log(`   ✅ Cleaned content: Gemini returned ${cleanedResult.length} chars`);
      console.log(`   Preview: ${cleanedResult.preview}...`);
    } else {
      console.log(`   ❌ Cleaned content: Still failed`);
      console.log(`   Reason: ${cleanedResult.error || cleanedResult.finishReason}`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log('DIAGNOSTIC COMPLETE');
  console.log(`${'═'.repeat(70)}\n`);
}

runDiagnostic().catch(console.error);
