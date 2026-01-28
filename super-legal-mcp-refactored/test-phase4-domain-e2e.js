/**
 * Phase 4: Comprehensive Domain E2E Test Suite
 * Tests all 12 domain-specific Gemini filters individually
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('='.repeat(80));
console.log('PHASE 4: COMPREHENSIVE DOMAIN E2E TEST SUITE');
console.log('='.repeat(80));
console.log('');

// Utility functions
function estimateTokens(text) {
  if (!text) return 0;
  const str = typeof text === 'string' ? text : JSON.stringify(text);
  return Math.ceil(str.length / 4);
}

function formatDuration(ms) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

// Domain test configurations
const DOMAIN_TESTS = [
  {
    domain: 'securities',
    query: 'Tesla 10-K 2024 risk factors electric vehicle competition supply chain',
    includeDomains: ['sec.gov'],
    focusPoints: 'Extract financial metrics, risk factors related to EV competition and supply chain issues.',
    expectedFields: ['revenue', 'risk', 'competition']
  },
  {
    domain: 'pharmaceutical_safety',
    query: 'Ozempic adverse events cardiac FDA FAERS semaglutide',
    includeDomains: ['fda.gov', 'accessdata.fda.gov'],
    focusPoints: 'Extract adverse event reports, cardiac safety signals, and FDA warnings.',
    expectedFields: ['adverse', 'cardiac', 'safety']
  },
  {
    domain: 'environmental',
    query: 'DuPont PFAS contamination EPA violations penalties 2024',
    includeDomains: ['epa.gov'],
    focusPoints: 'Extract violation types, penalty amounts, and compliance status.',
    expectedFields: ['violation', 'penalty', 'PFAS']
  },
  {
    domain: 'case_law',
    query: 'patent infringement summary judgment semiconductor technology',
    includeDomains: ['courtlistener.com', 'law.justia.com'],
    focusPoints: 'Extract holdings on summary judgment, cited precedent, and procedural history.',
    expectedFields: ['holding', 'court', 'patent']
  },
  {
    domain: 'legislation',
    query: 'Clean Air Act section 111 carbon emissions power plants',
    includeDomains: ['govinfo.gov', 'uscode.house.gov'],
    focusPoints: 'Extract statutory text, definitions, and regulatory authority.',
    expectedFields: ['emission', 'section', 'authority']
  },
  {
    domain: 'federal_register',
    query: 'SEC climate disclosure rule final effective date 2024',
    includeDomains: ['federalregister.gov'],
    focusPoints: 'Extract rule text, effective dates, compliance deadlines, and comment summary.',
    expectedFields: ['rule', 'effective', 'disclosure']
  },
  {
    domain: 'product_safety',
    query: 'CPSC recall children toys choking hazard 2024',
    includeDomains: ['cpsc.gov'],
    focusPoints: 'Extract hazard type, affected products, remedy actions, and injury reports.',
    expectedFields: ['recall', 'hazard', 'remedy']
  },
  {
    domain: 'antitrust',
    query: 'FTC merger review healthcare antitrust violation consent decree',
    includeDomains: ['ftc.gov'],
    focusPoints: 'Extract consent terms, merger conditions, and market concentration analysis.',
    expectedFields: ['merger', 'consent', 'competition']
  },
  {
    domain: 'patent',
    query: 'USPTO AI machine learning patent claims 2024',
    includeDomains: ['uspto.gov'],
    focusPoints: 'Extract claim language, prosecution history, and prior art references.',
    expectedFields: ['claim', 'patent', 'invention']
  },
  {
    domain: 'patent_appeals',
    query: 'PTAB inter partes review institution decision semiconductor',
    includeDomains: ['uspto.gov'],
    focusPoints: 'Extract institution decisions, claim construction, and final written decisions.',
    expectedFields: ['institution', 'claim', 'decision']
  },
  {
    domain: 'state_courts',
    query: 'California civil procedure summary judgment motion requirements',
    includeDomains: ['courts.ca.gov'],
    focusPoints: 'Extract procedural rules, filing deadlines, and motion requirements.',
    expectedFields: ['motion', 'deadline', 'procedure']
  },
  {
    domain: 'state_statutes',
    query: 'California consumer privacy CCPA data protection requirements',
    includeDomains: ['leginfo.legislature.ca.gov'],
    focusPoints: 'Extract statutory provisions, definitions, and compliance requirements.',
    expectedFields: ['privacy', 'consumer', 'data']
  }
];

// Results storage
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: [],
  tokenSavings: [],
  latencies: []
};

// Import required modules
let BaseWebSearchClient, GeminiFilterModule, DOMAIN_PROMPTS;

// Import for domain token limits
let getMaxTokensForDomain;

async function loadModules() {
  console.log('Loading test modules...');
  try {
    const bwscModule = await import('./src/api-clients/BaseWebSearchClient.js');
    BaseWebSearchClient = bwscModule.BaseWebSearchClient;

    const gfmModule = await import('./src/filters/GeminiFilterModule.js');
    GeminiFilterModule = gfmModule.GeminiFilterModule;

    // Load config for domain-specific token limits
    const configModule = await import('./src/config/geminiConfig.js');
    getMaxTokensForDomain = configModule.getMaxTokensForDomain;

    // Load all domain prompts
    DOMAIN_PROMPTS = {
      securities: (await import('./src/filters/prompts/securities.js')).SECURITIES_PROMPT,
      pharmaceutical_safety: (await import('./src/filters/prompts/pharmaceutical.js')).PHARMACEUTICAL_PROMPT,
      environmental: (await import('./src/filters/prompts/environmental.js')).ENVIRONMENTAL_PROMPT,
      case_law: (await import('./src/filters/prompts/caseLaw.js')).CASE_LAW_PROMPT,
      legislation: (await import('./src/filters/prompts/legislation.js')).LEGISLATION_PROMPT,
      federal_register: (await import('./src/filters/prompts/federalRegister.js')).FEDERAL_REGISTER_PROMPT,
      product_safety: (await import('./src/filters/prompts/productSafety.js')).PRODUCT_SAFETY_PROMPT,
      antitrust: (await import('./src/filters/prompts/antitrust.js')).ANTITRUST_PROMPT,
      patent: (await import('./src/filters/prompts/patent.js')).PATENT_PROMPT,
      patent_appeals: (await import('./src/filters/prompts/patentAppeals.js')).PATENT_APPEALS_PROMPT,
      state_courts: (await import('./src/filters/prompts/stateCourts.js')).STATE_COURTS_PROMPT,
      state_statutes: (await import('./src/filters/prompts/stateStatutes.js')).STATE_STATUTES_PROMPT
    };

    console.log(`  Loaded ${Object.keys(DOMAIN_PROMPTS).length} domain prompts`);
    return true;
  } catch (error) {
    console.error(`  Failed to load modules: ${error.message}`);
    return false;
  }
}

async function testDomain(config, testIndex) {
  const { domain, query, includeDomains, focusPoints, expectedFields } = config;

  console.log(`\n${'─'.repeat(80)}`);
  console.log(`TEST ${testIndex + 1}/${DOMAIN_TESTS.length}: ${domain.toUpperCase()}`);
  console.log(`${'─'.repeat(80)}`);
  console.log(`Query: "${query.substring(0, 60)}..."`);
  console.log(`Domains: ${includeDomains.join(', ')}`);

  const result = {
    domain,
    status: 'pending',
    rawTokens: 0,
    filteredTokens: 0,
    savings: 0,
    latency: { exa: 0, gemini: 0, total: 0 },
    errors: [],
    findings: null
  };

  try {
    // Step 1: Fetch raw results from Exa
    console.log(`\n  Step 1: Fetching raw results from Exa...`);
    const client = new BaseWebSearchClient(null, process.env.EXA_API_KEY);

    const exaStart = Date.now();
    const rawResults = await client.getRawResults(query, 3, {
      includeDomains,
      domain
    });
    result.latency.exa = Date.now() - exaStart;

    if (!rawResults || rawResults.length === 0) {
      console.log(`  ⚠️ No results from Exa for ${domain}`);
      result.status = 'skipped';
      result.errors.push('No Exa results');
      testResults.skipped++;
      return result;
    }

    result.rawTokens = estimateTokens(rawResults);
    console.log(`    ✓ Exa returned ${rawResults.length} results in ${formatDuration(result.latency.exa)}`);
    console.log(`    Raw tokens: ~${result.rawTokens.toLocaleString()}`);

    // Step 2: Process through Gemini filter
    console.log(`\n  Step 2: Processing through Gemini filter...`);
    const prompt = DOMAIN_PROMPTS[domain];

    if (!prompt) {
      console.log(`  ⚠️ No prompt found for domain: ${domain}`);
      result.status = 'failed';
      result.errors.push(`No prompt for domain: ${domain}`);
      testResults.failed++;
      return result;
    }

    const maxTokens = getMaxTokensForDomain(domain);
    const filter = new GeminiFilterModule(domain, {
      systemPrompt: prompt,
      maxOutputTokens: maxTokens
    });
    console.log(`    Using ${maxTokens} max output tokens for ${domain}`);

    const geminiStart = Date.now();
    const filtered = await filter.processAndFilter(rawResults, focusPoints);
    result.latency.gemini = Date.now() - geminiStart;
    result.latency.total = result.latency.exa + result.latency.gemini;

    console.log(`    ✓ Gemini processed in ${formatDuration(result.latency.gemini)}`);

    // Calculate token savings
    result.filteredTokens = estimateTokens(filtered.findings);
    result.savings = ((result.rawTokens - result.filteredTokens) / result.rawTokens * 100);

    console.log(`    Filtered tokens: ~${result.filteredTokens.toLocaleString()}`);
    console.log(`    Token savings: ${result.savings.toFixed(1)}%`);
    console.log(`    Confidence: ${filtered.confidence || 'N/A'}`);
    console.log(`    Fallback used: ${filtered.fallback ? 'Yes' : 'No'}`);

    // Step 3: Validate output
    console.log(`\n  Step 3: Validating output...`);
    const findingsText = typeof filtered.findings === 'string'
      ? filtered.findings.toLowerCase()
      : JSON.stringify(filtered.findings).toLowerCase();

    let validationsPassed = 0;
    const validationResults = [];

    for (const field of expectedFields) {
      const found = findingsText.includes(field.toLowerCase());
      validationResults.push({ field, found });
      if (found) validationsPassed++;
    }

    const validationRate = (validationsPassed / expectedFields.length * 100).toFixed(0);
    console.log(`    Validation: ${validationsPassed}/${expectedFields.length} expected fields found (${validationRate}%)`);

    for (const v of validationResults) {
      console.log(`      ${v.found ? '✓' : '✗'} "${v.field}"`);
    }

    // Step 4: Output preview
    console.log(`\n  Step 4: Output preview`);
    const preview = typeof filtered.findings === 'string'
      ? filtered.findings.substring(0, 400)
      : JSON.stringify(filtered.findings, null, 2).substring(0, 400);
    console.log('  ' + '─'.repeat(76));
    preview.split('\n').slice(0, 10).forEach(line => {
      console.log(`  │ ${line.substring(0, 74)}`);
    });
    console.log('  │ ...');
    console.log('  ' + '─'.repeat(76));

    // Determine test status
    result.findings = filtered;

    if (filtered.fallback) {
      result.status = 'passed_with_fallback';
      testResults.passed++;
      console.log(`\n  ⚠️ PASSED (with fallback)`);
    } else if (validationsPassed >= expectedFields.length * 0.5) {
      result.status = 'passed';
      testResults.passed++;
      console.log(`\n  ✅ PASSED`);
    } else {
      result.status = 'failed_validation';
      testResults.failed++;
      result.errors.push(`Only ${validationsPassed}/${expectedFields.length} fields validated`);
      console.log(`\n  ❌ FAILED (insufficient validation)`);
    }

  } catch (error) {
    result.status = 'error';
    result.errors.push(error.message);
    testResults.failed++;
    console.log(`\n  ❌ ERROR: ${error.message}`);
    console.log(`     Stack: ${error.stack?.split('\n').slice(0, 3).join('\n')}`);
  }

  testResults.details.push(result);
  testResults.tokenSavings.push(result.savings);
  testResults.latencies.push(result.latency);

  return result;
}

async function runAllTests() {
  console.log('\n');

  // Load modules first
  const modulesLoaded = await loadModules();
  if (!modulesLoaded) {
    console.error('Failed to load required modules. Exiting.');
    process.exit(1);
  }

  // Check environment
  console.log('\nEnvironment Check:');
  console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`  EXA_API_KEY: ${process.env.EXA_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`  ENABLE_GEMINI_FILTERING: ${process.env.ENABLE_GEMINI_FILTERING}`);

  if (!process.env.GEMINI_API_KEY || !process.env.EXA_API_KEY) {
    console.error('\nMissing required API keys. Exiting.');
    process.exit(1);
  }

  // Run all domain tests
  console.log(`\n${'═'.repeat(80)}`);
  console.log('RUNNING DOMAIN TESTS');
  console.log(`${'═'.repeat(80)}`);

  for (let i = 0; i < DOMAIN_TESTS.length; i++) {
    await testDomain(DOMAIN_TESTS[i], i);

    // Rate limit: wait between tests to avoid hitting Gemini rate limits
    if (i < DOMAIN_TESTS.length - 1) {
      console.log(`\n  ⏳ Waiting 3 seconds before next test (rate limiting)...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Print summary
  printSummary();
}

function printSummary() {
  console.log(`\n\n${'═'.repeat(80)}`);
  console.log('TEST SUMMARY');
  console.log(`${'═'.repeat(80)}`);

  // Overall results
  const total = testResults.passed + testResults.failed + testResults.skipped;
  const passRate = ((testResults.passed / total) * 100).toFixed(1);

  console.log(`\n📊 Overall Results:`);
  console.log(`   Passed:  ${testResults.passed}/${total} (${passRate}%)`);
  console.log(`   Failed:  ${testResults.failed}/${total}`);
  console.log(`   Skipped: ${testResults.skipped}/${total}`);

  // Token savings
  const validSavings = testResults.tokenSavings.filter(s => s > 0);
  if (validSavings.length > 0) {
    const avgSavings = validSavings.reduce((a, b) => a + b, 0) / validSavings.length;
    const minSavings = Math.min(...validSavings);
    const maxSavings = Math.max(...validSavings);

    console.log(`\n📉 Token Savings:`);
    console.log(`   Average: ${avgSavings.toFixed(1)}%`);
    console.log(`   Min:     ${minSavings.toFixed(1)}%`);
    console.log(`   Max:     ${maxSavings.toFixed(1)}%`);
  }

  // Latency statistics
  const validLatencies = testResults.latencies.filter(l => l.total > 0);
  if (validLatencies.length > 0) {
    const avgTotal = validLatencies.reduce((a, b) => a + b.total, 0) / validLatencies.length;
    const avgExa = validLatencies.reduce((a, b) => a + b.exa, 0) / validLatencies.length;
    const avgGemini = validLatencies.reduce((a, b) => a + b.gemini, 0) / validLatencies.length;

    console.log(`\n⏱️ Latency (Average):`);
    console.log(`   Total:  ${formatDuration(avgTotal)}`);
    console.log(`   Exa:    ${formatDuration(avgExa)}`);
    console.log(`   Gemini: ${formatDuration(avgGemini)}`);
  }

  // Per-domain breakdown
  console.log(`\n📋 Per-Domain Results:`);
  console.log(`${'─'.repeat(80)}`);
  console.log(`| ${'Domain'.padEnd(25)} | ${'Status'.padEnd(15)} | ${'Savings'.padEnd(10)} | ${'Latency'.padEnd(12)} |`);
  console.log(`${'─'.repeat(80)}`);

  for (const result of testResults.details) {
    const status = result.status === 'passed' ? '✅ Passed' :
                   result.status === 'passed_with_fallback' ? '⚠️ Fallback' :
                   result.status === 'skipped' ? '⏭️ Skipped' : '❌ Failed';
    const savings = result.savings > 0 ? `${result.savings.toFixed(1)}%` : 'N/A';
    const latency = result.latency.total > 0 ? formatDuration(result.latency.total) : 'N/A';

    console.log(`| ${result.domain.padEnd(25)} | ${status.padEnd(15)} | ${savings.padEnd(10)} | ${latency.padEnd(12)} |`);
  }
  console.log(`${'─'.repeat(80)}`);

  // Failed tests detail
  const failures = testResults.details.filter(r => r.status === 'error' || r.status === 'failed_validation');
  if (failures.length > 0) {
    console.log(`\n❌ Failed Test Details:`);
    for (const failure of failures) {
      console.log(`\n   ${failure.domain}:`);
      for (const error of failure.errors) {
        console.log(`     - ${error}`);
      }
    }
  }

  // Recommendations
  console.log(`\n💡 Recommendations:`);
  if (testResults.failed > 0) {
    console.log(`   - Review failed domains for query/prompt improvements`);
  }
  if (validSavings.some(s => s < 50)) {
    console.log(`   - Some domains have low token savings - consider prompt tuning`);
  }
  if (validLatencies.some(l => l.gemini > 10000)) {
    console.log(`   - Some Gemini calls exceed 10s - consider timeout adjustments`);
  }
  if (testResults.passed === total) {
    console.log(`   - All tests passed! Ready for Phase 4.2 performance benchmarks.`);
  }

  console.log(`\n${'═'.repeat(80)}\n`);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
