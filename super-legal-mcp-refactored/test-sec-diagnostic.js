/**
 * SEC WebSearchClient Diagnostic Test
 *
 * Purpose: Investigate why searchSECFilingsWeb() returns 0 results
 *
 * Diagnostics:
 * 1. Raw Exa search results count
 * 2. URL filtering behavior
 * 3. Permissive mode status
 * 4. Filing mapping success rate
 * 5. Query construction validation
 */

import dotenv from 'dotenv';
import { SECWebSearchClient } from './src/api-clients/SECWebSearchClient.js';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

async function diagnosticTest() {
  logSection('🔬 SEC WEBSEARCHCLIENT DIAGNOSTIC TEST');

  // Test query
  const testQuery = {
    company_identifier: 'Tesla',
    filing_type: '10-K',
    limit: 5
  };

  log('Test Query:', 'cyan');
  console.log(JSON.stringify(testQuery, null, 2));

  // Initialize client
  log('\n📋 Client Configuration:', 'cyan');
  const secClient = new SECWebSearchClient(null);
  console.log(`  Permissive Mode: ${secClient.usePermissiveExtraction}`);
  console.log(`  Enhanced Queries: ${secClient.USE_ENHANCED_QUERIES}`);
  console.log(`  Domain: ${secClient.domain}`);

  // Execute search
  logSection('🔍 EXECUTING SEARCH');
  log('Calling searchSECFilingsWeb()...', 'cyan');

  try {
    const startTime = Date.now();
    const response = await secClient.searchSECFilingsWeb(testQuery);
    const executionTime = Date.now() - startTime;

    log(`✅ Search completed (${executionTime}ms)`, 'green');

    // Parse response
    const text = response.content[0].text;
    const parsed = JSON.parse(text);

    logSection('📊 RESPONSE ANALYSIS');

    // Company info
    log('Company Object:', 'cyan');
    console.log(JSON.stringify(parsed.company, null, 2));

    // Filings array
    log('\nFilings Array:', 'cyan');
    console.log(`  Length: ${parsed.filings.length}`);
    console.log(`  Type: ${typeof parsed.filings}`);

    if (parsed.filings.length === 0) {
      log('  ⚠️  ZERO FILINGS RETURNED', 'yellow');
    } else {
      log(`  ✅ ${parsed.filings.length} filings found`, 'green');
      log('\nSample Filing:', 'cyan');
      console.log(JSON.stringify(parsed.filings[0], null, 2));
    }

    // Search criteria
    log('\nSearch Criteria:', 'cyan');
    console.log(JSON.stringify(parsed.search_criteria, null, 2));

    // Quality summary (if present)
    if (parsed.quality_summary) {
      log('\nQuality Summary:', 'cyan');
      console.log(JSON.stringify(parsed.quality_summary, null, 2));
    }

    // Advisory (if present)
    if (parsed.advisory) {
      log('\nAdvisory:', 'yellow');
      console.log(`  ${parsed.advisory}`);
    }

    // Debug: Check for _search_quality metadata
    if (parsed._search_quality) {
      log('\nSearch Quality Metadata:', 'cyan');
      console.log(JSON.stringify(parsed._search_quality, null, 2));
    }

    logSection('🔬 ROOT CAUSE ANALYSIS');

    // Hypothesis 1: No raw results from Exa
    if (parsed.total_results === 0 || parsed.filings.length === 0) {
      log('❌ HYPOTHESIS 1: No results from Exa web search', 'red');
      log('   Possible causes:', 'yellow');
      console.log('   - Query too restrictive (site:sec.gov + company + filing type)');
      console.log('   - Exa API not finding SEC filings');
      console.log('   - Rate limiting');
    }

    // Hypothesis 2: Results filtered out
    if (parsed.quality_summary) {
      const total = parsed.quality_summary.total_filings || 0;
      if (total > 0 && parsed.filings.length === 0) {
        log('❌ HYPOTHESIS 2: Results filtered out by client-side logic', 'red');
        log('   Possible causes:', 'yellow');
        console.log('   - URL filtering (line 101: .includes("sec.gov"))');
        console.log('   - Permissive extraction returning empty objects');
        console.log('   - Date filtering removing all results');
      }
    }

    // Hypothesis 3: Mapping failure
    if (parsed.filings.length > 0) {
      const invalidFilings = parsed.filings.filter(f =>
        !f.accessionNumber && !f.form && !f.filingDate && !f.edgar_url
      );
      if (invalidFilings.length > 0) {
        log('⚠️  HYPOTHESIS 3: Mapping failures detected', 'yellow');
        console.log(`   ${invalidFilings.length}/${parsed.filings.length} filings have no extracted data`);
      }
    }

    logSection('🛠️  RECOMMENDATIONS');

    if (parsed.filings.length === 0) {
      log('1. Test with broader query (remove filing_type filter)', 'cyan');
      log('2. Check if SEC is blocking Exa\'s web search', 'cyan');
      log('3. Verify URL filtering logic (line 101 in SECWebSearchClient.js)', 'cyan');
      log('4. Test permissive extraction vs strict extraction', 'cyan');
      log('5. Add debug logging to executeExaSearch() to see raw results', 'cyan');
    } else {
      log('✅ Client is working correctly', 'green');
    }

  } catch (error) {
    log('\n❌ SEARCH FAILED', 'red');
    console.error(error);

    logSection('ERROR ANALYSIS');
    console.log(`Error Message: ${error.message}`);
    console.log(`Error Stack: ${error.stack}`);
  }
}

// Run diagnostic
diagnosticTest().catch(error => {
  console.error('Diagnostic test failed:', error);
  process.exit(1);
});
