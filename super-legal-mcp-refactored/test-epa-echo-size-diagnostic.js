#!/usr/bin/env node

/**
 * EPA ECHO API Size Diagnostic Test
 *
 * Measures response sizes from EPA ECHO native API to establish baseline metrics
 * before implementing Gemini filtering for EPA data.
 *
 * Tests:
 * - searchFacilities() with various queries
 * - getFacilityComplianceReport() with full violations/enforcement
 * - Response size in chars/KB/tokens
 * - Facility count vs response size ratios
 *
 * Run with: node test-epa-echo-size-diagnostic.js
 */

import { EPAComplianceClient } from './src/api-clients/EPAComplianceClient.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('='.repeat(70));
console.log('EPA ECHO API SIZE DIAGNOSTIC TEST');
console.log('Measuring response sizes for Gemini filtering baseline');
console.log('='.repeat(70));
console.log('');

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 chars)
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Test queries for searchFacilities
 */
const FACILITY_SEARCH_TESTS = [
  {
    name: 'Single City (Pittsburgh, PA)',
    args: { city: 'Pittsburgh', state: 'PA', limit: 10 },
    description: 'Urban area with industrial facilities'
  },
  {
    name: 'Single City (Houston, TX)',
    args: { city: 'Houston', state: 'TX', limit: 10 },
    description: 'Major petrochemical hub'
  },
  {
    name: 'Company Search (Shell, TX)',
    args: { facility_name: 'Shell', state: 'TX', limit: 10 },
    description: 'Major oil company facilities'
  },
  {
    name: 'Company Search (Dow Chemical)',
    args: { facility_name: 'Dow', state: 'MI', limit: 10 },
    description: 'Chemical company facilities'
  },
  {
    name: 'Violation Focus (TX violators)',
    args: { state: 'TX', city: 'Houston', compliance_status: 'violation', limit: 10 },
    description: 'Facilities with compliance issues'
  },
  {
    name: 'High Limit Test (25 facilities)',
    args: { city: 'Los Angeles', state: 'CA', limit: 25 },
    description: 'Testing larger result sets'
  },
  {
    name: 'Pharmaceutical (NJ)',
    args: { city: 'New Brunswick', state: 'NJ', limit: 10 },
    description: 'Pharma manufacturing hub'
  }
];

/**
 * Test a single facility search and measure response size
 */
async function testFacilitySearch(client, test) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📋 ${test.name}`);
  console.log(`   ${test.description}`);
  console.log(`   Args: ${JSON.stringify(test.args)}`);

  const startTime = Date.now();

  try {
    const result = await client.searchFacilities(test.args);
    const duration = Date.now() - startTime;

    // Parse and measure
    const content = result.content[0].text;
    const contentBytes = Buffer.byteLength(content, 'utf8');
    const tokens = estimateTokens(content);
    const data = JSON.parse(content);

    const facilityCount = data.facilities?.length || 0;
    const totalFacilities = data.total_facilities || facilityCount;
    const hasQueryId = !!data.query_id;
    const hpvCount = data.high_priority_violators || 0;

    // Calculate per-facility metrics
    const bytesPerFacility = facilityCount > 0 ? Math.round(contentBytes / facilityCount) : 0;
    const tokensPerFacility = facilityCount > 0 ? Math.round(tokens / facilityCount) : 0;

    // Check data richness
    const sampleFacility = data.facilities?.[0];
    const hasCompliance = sampleFacility?.compliance !== undefined;
    const hasPrograms = sampleFacility?.programs !== undefined;
    const hasLocation = sampleFacility?.location !== undefined;

    console.log(`\n   ✅ SUCCESS (${duration}ms)`);
    console.log(`   📊 Facilities: ${facilityCount} returned (${totalFacilities} total available)`);
    console.log(`   📏 Response Size: ${formatBytes(contentBytes)} (~${tokens.toLocaleString()} tokens)`);
    console.log(`   📐 Per Facility: ${formatBytes(bytesPerFacility)} (~${tokensPerFacility} tokens)`);
    console.log(`   🔍 High Priority Violators: ${hpvCount}`);
    console.log(`   📄 Has QueryID (pagination): ${hasQueryId ? 'Yes' : 'No'}`);
    console.log(`   📦 Data Fields: compliance=${hasCompliance}, programs=${hasPrograms}, location=${hasLocation}`);

    return {
      success: true,
      name: test.name,
      duration,
      facilityCount,
      totalFacilities,
      contentBytes,
      tokens,
      bytesPerFacility,
      tokensPerFacility,
      hpvCount,
      hasQueryId,
      dataRichness: { hasCompliance, hasPrograms, hasLocation }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`\n   ❌ FAILED (${duration}ms): ${error.message}`);

    return {
      success: false,
      name: test.name,
      duration,
      error: error.message
    };
  }
}

/**
 * Test compliance report for a specific facility
 */
async function testComplianceReport(client, facilityId, facilityName) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📋 Compliance Report: ${facilityName}`);
  console.log(`   Facility ID: ${facilityId}`);
  console.log(`   Options: include_violations=true, include_enforcement=true`);

  const startTime = Date.now();

  try {
    const result = await client.getFacilityComplianceReport({
      facility_id: facilityId,
      include_violations: true,
      include_enforcement: true
    });
    const duration = Date.now() - startTime;

    // Parse and measure
    const content = result.content[0].text;
    const contentBytes = Buffer.byteLength(content, 'utf8');
    const tokens = estimateTokens(content);
    const data = JSON.parse(content);

    // Extract component sizes
    const facilitySection = JSON.stringify(data.facility || {});
    const complianceSection = JSON.stringify(data.compliance_summary || {});
    const violationsSection = JSON.stringify(data.violations || []);
    const enforcementSection = JSON.stringify(data.enforcement_actions || []);
    const threeYearSection = JSON.stringify(data.three_year_compliance || []);

    const violationCount = data.violations?.length || 0;
    const enforcementCount = data.enforcement_actions?.length || 0;
    const threeYearCount = data.three_year_compliance?.length || 0;

    console.log(`\n   ✅ SUCCESS (${duration}ms)`);
    console.log(`   📏 Total Response: ${formatBytes(contentBytes)} (~${tokens.toLocaleString()} tokens)`);
    console.log(`\n   📦 Component Breakdown:`);
    console.log(`      Facility Info:     ${formatBytes(Buffer.byteLength(facilitySection))} (~${estimateTokens(facilitySection)} tokens)`);
    console.log(`      Compliance Summary: ${formatBytes(Buffer.byteLength(complianceSection))} (~${estimateTokens(complianceSection)} tokens)`);
    console.log(`      Violations (${violationCount}):    ${formatBytes(Buffer.byteLength(violationsSection))} (~${estimateTokens(violationsSection)} tokens)`);
    console.log(`      Enforcement (${enforcementCount}):  ${formatBytes(Buffer.byteLength(enforcementSection))} (~${estimateTokens(enforcementSection)} tokens)`);
    console.log(`      3-Year History (${threeYearCount}): ${formatBytes(Buffer.byteLength(threeYearSection))} (~${estimateTokens(threeYearSection)} tokens)`);

    return {
      success: true,
      facilityId,
      facilityName,
      duration,
      contentBytes,
      tokens,
      components: {
        facility: { bytes: Buffer.byteLength(facilitySection), tokens: estimateTokens(facilitySection) },
        compliance: { bytes: Buffer.byteLength(complianceSection), tokens: estimateTokens(complianceSection) },
        violations: { count: violationCount, bytes: Buffer.byteLength(violationsSection), tokens: estimateTokens(violationsSection) },
        enforcement: { count: enforcementCount, bytes: Buffer.byteLength(enforcementSection), tokens: estimateTokens(enforcementSection) },
        threeYear: { count: threeYearCount, bytes: Buffer.byteLength(threeYearSection), tokens: estimateTokens(threeYearSection) }
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`\n   ❌ FAILED (${duration}ms): ${error.message}`);

    return {
      success: false,
      facilityId,
      facilityName,
      duration,
      error: error.message
    };
  }
}

/**
 * Test violations search for a specific facility
 */
async function testViolationsSearch(client, facilityId, facilityName) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📋 Violations Search: ${facilityName}`);
  console.log(`   Facility ID: ${facilityId}`);
  console.log(`   Options: limit=200 (max)`);

  const startTime = Date.now();

  try {
    const result = await client.searchViolations({
      facility_id: facilityId,
      limit: 200
    });
    const duration = Date.now() - startTime;

    // Parse and measure
    const content = result.content[0].text;
    const contentBytes = Buffer.byteLength(content, 'utf8');
    const tokens = estimateTokens(content);
    const data = JSON.parse(content);

    const violationCount = data.count || data.results?.length || 0;
    const bytesPerViolation = violationCount > 0 ? Math.round(contentBytes / violationCount) : 0;

    console.log(`\n   ✅ SUCCESS (${duration}ms)`);
    console.log(`   📊 Violations: ${violationCount}`);
    console.log(`   📏 Response Size: ${formatBytes(contentBytes)} (~${tokens.toLocaleString()} tokens)`);
    console.log(`   📐 Per Violation: ${formatBytes(bytesPerViolation)} (~${Math.round(tokens / Math.max(violationCount, 1))} tokens)`);

    return {
      success: true,
      facilityId,
      facilityName,
      duration,
      violationCount,
      contentBytes,
      tokens,
      bytesPerViolation
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`\n   ❌ FAILED (${duration}ms): ${error.message}`);

    return {
      success: false,
      facilityId,
      facilityName,
      duration,
      error: error.message
    };
  }
}

/**
 * Main test runner
 */
async function runDiagnostics() {
  console.log('🚀 Initializing EPA Compliance Client...\n');

  const client = new EPAComplianceClient(null);

  console.log('✅ Client initialized');
  console.log('');

  // ============================================
  // PHASE 1: Facility Search Tests
  // ============================================
  console.log('═'.repeat(70));
  console.log('PHASE 1: FACILITY SEARCH SIZE TESTS');
  console.log('═'.repeat(70));

  const searchResults = [];

  for (const test of FACILITY_SEARCH_TESTS) {
    const result = await testFacilitySearch(client, test);
    searchResults.push(result);

    // Rate limit between API calls
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // ============================================
  // PHASE 2: Compliance Report Tests
  // ============================================
  console.log('\n\n' + '═'.repeat(70));
  console.log('PHASE 2: COMPLIANCE REPORT SIZE TESTS');
  console.log('═'.repeat(70));

  // Find facilities from successful searches to test detailed reports
  const facilitiesToTest = [];
  for (const result of searchResults) {
    if (result.success && result.facilityCount > 0) {
      // We'll need to re-fetch to get facility IDs
      break;
    }
  }

  // Use known facility IDs for testing
  const knownFacilities = [
    { id: '110000350172', name: 'Test Facility (TX)' },
    { id: '110070688053', name: 'Test Facility (PA)' }
  ];

  const reportResults = [];

  for (const facility of knownFacilities) {
    const result = await testComplianceReport(client, facility.id, facility.name);
    reportResults.push(result);

    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // ============================================
  // PHASE 3: Violations Search Tests
  // ============================================
  console.log('\n\n' + '═'.repeat(70));
  console.log('PHASE 3: VIOLATIONS SEARCH SIZE TESTS');
  console.log('═'.repeat(70));

  const violationResults = [];

  for (const facility of knownFacilities) {
    const result = await testViolationsSearch(client, facility.id, facility.name);
    violationResults.push(result);

    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // ============================================
  // SUMMARY REPORT
  // ============================================
  console.log('\n\n' + '═'.repeat(70));
  console.log('📊 DIAGNOSTIC SUMMARY REPORT');
  console.log('═'.repeat(70));

  // Facility Search Summary
  const successfulSearches = searchResults.filter(r => r.success);
  if (successfulSearches.length > 0) {
    const avgTokens = Math.round(successfulSearches.reduce((sum, r) => sum + r.tokens, 0) / successfulSearches.length);
    const avgBytes = Math.round(successfulSearches.reduce((sum, r) => sum + r.contentBytes, 0) / successfulSearches.length);
    const avgFacilities = Math.round(successfulSearches.reduce((sum, r) => sum + r.facilityCount, 0) / successfulSearches.length);
    const avgTokensPerFacility = Math.round(successfulSearches.reduce((sum, r) => sum + r.tokensPerFacility, 0) / successfulSearches.length);
    const maxTokens = Math.max(...successfulSearches.map(r => r.tokens));
    const maxBytes = Math.max(...successfulSearches.map(r => r.contentBytes));

    console.log('\n📋 FACILITY SEARCHES:');
    console.log(`   Successful: ${successfulSearches.length}/${searchResults.length}`);
    console.log(`   Average Response: ${formatBytes(avgBytes)} (~${avgTokens.toLocaleString()} tokens)`);
    console.log(`   Average Facilities: ${avgFacilities}`);
    console.log(`   Average per Facility: ~${avgTokensPerFacility} tokens`);
    console.log(`   Max Response: ${formatBytes(maxBytes)} (~${maxTokens.toLocaleString()} tokens)`);
  }

  // Compliance Report Summary
  const successfulReports = reportResults.filter(r => r.success);
  if (successfulReports.length > 0) {
    const avgTokens = Math.round(successfulReports.reduce((sum, r) => sum + r.tokens, 0) / successfulReports.length);
    const avgBytes = Math.round(successfulReports.reduce((sum, r) => sum + r.contentBytes, 0) / successfulReports.length);
    const maxTokens = Math.max(...successfulReports.map(r => r.tokens));

    console.log('\n📋 COMPLIANCE REPORTS:');
    console.log(`   Successful: ${successfulReports.length}/${reportResults.length}`);
    console.log(`   Average Response: ${formatBytes(avgBytes)} (~${avgTokens.toLocaleString()} tokens)`);
    console.log(`   Max Response: ~${maxTokens.toLocaleString()} tokens`);

    // Component breakdown averages
    if (successfulReports.length > 0) {
      const avgViolationTokens = Math.round(successfulReports.reduce((sum, r) => sum + r.components.violations.tokens, 0) / successfulReports.length);
      const avgEnforcementTokens = Math.round(successfulReports.reduce((sum, r) => sum + r.components.enforcement.tokens, 0) / successfulReports.length);

      console.log(`   Avg Violations Section: ~${avgViolationTokens} tokens`);
      console.log(`   Avg Enforcement Section: ~${avgEnforcementTokens} tokens`);
    }
  }

  // Violations Search Summary
  const successfulViolations = violationResults.filter(r => r.success);
  if (successfulViolations.length > 0) {
    const avgTokens = Math.round(successfulViolations.reduce((sum, r) => sum + r.tokens, 0) / successfulViolations.length);

    console.log('\n📋 VIOLATIONS SEARCHES:');
    console.log(`   Successful: ${successfulViolations.length}/${violationResults.length}`);
    console.log(`   Average Response: ~${avgTokens.toLocaleString()} tokens`);
  }

  // Gemini Filtering Recommendations
  console.log('\n' + '─'.repeat(70));
  console.log('💡 GEMINI FILTERING RECOMMENDATIONS');
  console.log('─'.repeat(70));

  const totalAvgTokens = successfulSearches.length > 0
    ? Math.round(successfulSearches.reduce((sum, r) => sum + r.tokens, 0) / successfulSearches.length)
    : 0;

  if (totalAvgTokens > 0) {
    console.log(`\n   Current EPA ECHO Response: ~${totalAvgTokens.toLocaleString()} tokens avg`);
    console.log(`   Gemini 2.5 Flash Input Limit: ~1M tokens`);
    console.log(`   Gemini Optimal Processing: <100K tokens per request`);

    if (totalAvgTokens < 5000) {
      console.log('\n   ✅ EPA responses are SMALL - Gemini filtering will be efficient');
      console.log('   📌 Can process multiple facilities in single Gemini call');
    } else if (totalAvgTokens < 50000) {
      console.log('\n   ⚠️  EPA responses are MODERATE');
      console.log('   📌 Recommend batch processing 5-10 facilities per Gemini call');
    } else {
      console.log('\n   ❌ EPA responses are LARGE');
      console.log('   📌 Recommend processing 1-2 facilities per Gemini call');
      console.log('   📌 Consider truncating violation/enforcement history');
    }

    console.log('\n   Key fields to extract via Gemini:');
    console.log('   • Facility name, location, registry ID');
    console.log('   • Compliance status summary');
    console.log('   • High priority violator flag');
    console.log('   • Recent enforcement actions (last 3 years)');
    console.log('   • Active programs (CAA, CWA, RCRA)');
  }

  console.log('\n' + '═'.repeat(70));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('═'.repeat(70) + '\n');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('\n❌ Diagnostic failed:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});
