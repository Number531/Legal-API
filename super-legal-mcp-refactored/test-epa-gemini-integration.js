/**
 * Test EPA ECHO Native Data → Gemini Filter Integration
 * Validates the new getRawResults() method and narrative conversion
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { EPAComplianceClient } from './src/api-clients/EPAComplianceClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('='.repeat(70));
console.log('EPA ECHO → GEMINI INTEGRATION TEST');
console.log('='.repeat(70));

// Test queries
const testQueries = [
  {
    query: "What penalties has US Steel received in Pennsylvania?",
    expectedParams: { facility_name: 'US Steel', state: 'PA', violations_last_3_years: true }
  },
  {
    query: "Environmental facilities in Pittsburgh, PA",
    expectedParams: { city: 'Pittsburgh', state: 'PA' }
  },
  {
    query: "Show compliance violations for BASF",
    expectedParams: { facility_name: 'BASF', violations_last_3_years: true }
  },
  {
    query: "Facilities near Houston TX with enforcement actions",
    expectedParams: { city: 'Houston', state: 'TX', violations_last_3_years: true }
  }
];

async function testQueryParsing(client) {
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 1: Query Parsing');
  console.log('─'.repeat(70));

  for (const test of testQueries) {
    const params = client._parseSearchQuery(test.query);
    console.log(`\nQuery: "${test.query}"`);
    console.log(`Parsed: ${JSON.stringify(params)}`);

    // Check key parameters
    const checks = [];
    if (test.expectedParams.facility_name && params.facility_name) {
      checks.push(params.facility_name.toLowerCase().includes(test.expectedParams.facility_name.toLowerCase()) ? '✓ facility_name' : '✗ facility_name');
    }
    if (test.expectedParams.state && params.state === test.expectedParams.state) {
      checks.push('✓ state');
    }
    if (test.expectedParams.city && params.city) {
      checks.push(params.city.toLowerCase().includes(test.expectedParams.city.toLowerCase()) ? '✓ city' : '✗ city');
    }
    if (test.expectedParams.violations_last_3_years && params.violations_last_3_years) {
      checks.push('✓ violations_filter');
    }
    console.log(`Checks: ${checks.join(', ') || 'none'}`);
  }
}

async function testGetRawResults(client) {
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 2: getRawResults() → Narrative Conversion');
  console.log('─'.repeat(70));

  const query = "Facilities in Pittsburgh, PA";
  console.log(`\nQuery: "${query}"`);
  console.log('Fetching from EPA ECHO...\n');

  try {
    const results = await client.getRawResults(query, 3);

    console.log(`Results returned: ${results.length} facilities`);

    if (results.length > 0) {
      const first = results[0];
      console.log(`\n--- First Result ---`);
      console.log(`Title: ${first.title}`);
      console.log(`URL: ${first.url}`);
      console.log(`Source: ${first._source}`);
      console.log(`Domain: ${first._domain}`);
      console.log(`\nNarrative Text (first 1500 chars):`);
      console.log(first.text.substring(0, 1500));
      console.log('...');

      // Calculate sizes
      const totalTextSize = results.reduce((sum, r) => sum + r.text.length, 0);
      const avgTextSize = Math.round(totalTextSize / results.length);
      const estimatedTokens = Math.ceil(totalTextSize / 4);

      console.log(`\n--- Size Metrics ---`);
      console.log(`Total text size: ${totalTextSize.toLocaleString()} chars`);
      console.log(`Average per facility: ${avgTextSize.toLocaleString()} chars`);
      console.log(`Estimated tokens (pre-Gemini): ~${estimatedTokens.toLocaleString()}`);
      console.log(`Post-Gemini extraction: ~${Math.ceil(estimatedTokens * 0.15).toLocaleString()} tokens (estimated 85% reduction)`);
    }

    return results;

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return [];
  }
}

async function testNarrativeContent(client) {
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 3: Narrative Content Completeness');
  console.log('─'.repeat(70));

  const query = "Steel facilities in Pittsburgh, PA with violations";
  console.log(`\nQuery: "${query}"`);

  try {
    const results = await client.getRawResults(query, 1);

    if (results.length > 0) {
      const text = results[0].text;

      // Check for key sections
      const sections = [
        { name: 'FACILITY', pattern: /FACILITY:/i },
        { name: 'Registry ID', pattern: /Registry ID:/i },
        { name: 'Location', pattern: /Location:/i },
        { name: 'COMPLIANCE STATUS', pattern: /COMPLIANCE STATUS:/i },
        { name: 'INSPECTIONS', pattern: /INSPECTIONS:/i },
        { name: 'ENFORCEMENT', pattern: /ENFORCEMENT:/i },
        { name: 'PENALTIES', pattern: /PENALTIES:/i },
        { name: 'EMISSIONS', pattern: /EMISSIONS:/i },
        { name: 'DEMOGRAPHICS', pattern: /DEMOGRAPHICS/i }
      ];

      console.log('\nSection Completeness:');
      for (const section of sections) {
        const found = section.pattern.test(text);
        console.log(`  ${found ? '✓' : '✗'} ${section.name}`);
      }

      // Check for specific data points
      const dataPoints = [
        { name: 'Formal Actions', pattern: /Formal Actions:\s*\d+/i },
        { name: 'Total Penalties', pattern: /Total:\s*\$[\d,]+/i },
        { name: 'Last Inspection', pattern: /Last Inspection:/i },
        { name: 'Quarters NC', pattern: /Quarters in NC/i },
        { name: 'HPV Flag', pattern: /HIGH PRIORITY VIOLATOR/i },
        { name: 'SNC Flag', pattern: /Significant Non-Compliance/i }
      ];

      console.log('\nKey Data Points:');
      for (const dp of dataPoints) {
        const found = dp.pattern.test(text);
        console.log(`  ${found ? '✓' : '○'} ${dp.name}`);
      }
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

async function runAllTests() {
  const client = new EPAComplianceClient(null);

  await testQueryParsing(client);
  await testGetRawResults(client);
  await testNarrativeContent(client);

  console.log('\n' + '='.repeat(70));
  console.log('INTEGRATION TEST COMPLETE');
  console.log('='.repeat(70));
  console.log('\nNext step: Run through ClaudeOrchestrator to test full Gemini pipeline');
  console.log('');
}

runAllTests().catch(console.error);
