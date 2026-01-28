#!/usr/bin/env node

/**
 * Minimal FDA diagnostic test
 * Shows raw Exa responses and schema validation behavior
 */

import { FDAWebSearchClient } from './src/api-clients/FDAWebSearchClient.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔍 FDA Diagnostic Test - Schema Validation Investigation\n');
console.log('='.repeat(70));

async function runDiagnostic() {
  if (!process.env.EXA_API_KEY) {
    console.error('❌ EXA_API_KEY not configured');
    process.exit(1);
  }

  const client = new FDAWebSearchClient({
    apiKey: process.env.EXA_API_KEY
  });

  console.log('\n📋 Test: Drug Adverse Events (Web Search)');
  console.log('Query: aspirin adverse events');
  console.log('Expected: Schema-based extraction with structured summaries');
  console.log('='.repeat(70));

  try {
    const result = await client.searchDrugAdverseEventsWeb({
      search: 'aspirin adverse events',
      limit: 3,  // Small limit for diagnostic
      include_snippet: true
    });

    const content = result.content[0].text;
    const data = JSON.parse(content);

    console.log('\n📊 Final Result:');
    console.log(`   Results returned: ${data.results?.length || 0}`);
    console.log(`   Total size: ${(content.length / 1024).toFixed(1)} KB`);
    console.log(`   Estimated tokens: ${Math.ceil(content.length / 4).toLocaleString()}`);

    if (data._content_quality) {
      console.log('\n📈 Content Quality Metadata:');
      console.log(`   Confidence: ${data._content_quality.confidence}`);
      console.log(`   Extraction method: ${data._content_quality.extraction_method}`);
      console.log(`   Strategy type: ${data._content_quality.strategy_type}`);
    }

    // Check first result structure
    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0];
      console.log('\n🔬 First Result Structure:');
      console.log(`   Has summary: ${!!firstResult.summary}`);
      console.log(`   Has text: ${!!firstResult.text}`);
      console.log(`   Has full_text: ${!!firstResult.full_text}`);

      if (firstResult.summary) {
        console.log(`   Summary type: ${typeof firstResult.summary}`);
        if (typeof firstResult.summary === 'object') {
          console.log(`   Summary keys: ${Object.keys(firstResult.summary).join(', ')}`);
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Diagnostic test complete');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runDiagnostic().catch(console.error);
