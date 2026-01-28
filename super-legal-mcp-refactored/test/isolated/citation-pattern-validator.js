/**
 * Isolated Citation Pattern Validator
 *
 * Run: node test/isolated/citation-pattern-validator.js
 *
 * ZERO production dependencies - pure regex testing
 */

// =============================================================================
// CITATION PATTERNS (Aligned with Bluebook & eyecite)
// =============================================================================

const CITATION_PATTERNS = {
  // U.S. Supreme Court: "531 U.S. 98" or "410 U.S. 113, 120"
  us_reports: {
    pattern: /(\d+)\s+U\.S\.\s+(\d+)(?:,\s*(\d+))?/g,
    extractor: (m) => ({ volume: m[1], reporter: 'U.S.', page: m[2], pinpoint: m[3] })
  },

  // Federal Reporter: "500 F.3d 123" (NO space between F. and 3d per Bluebook)
  federal_reporter: {
    pattern: /(\d+)\s+F\.(?:\s*(2d|3d))?\s+(\d+)/g,
    extractor: (m) => ({ volume: m[1], reporter: `F.${m[2] || ''}`, page: m[3] })
  },

  // Federal Supplement: "123 F. Supp. 3d 456" (space between F. and Supp.)
  federal_supplement: {
    pattern: /(\d+)\s+F\.\s*Supp\.(?:\s*(2d|3d))?\s+(\d+)/g,
    extractor: (m) => ({ volume: m[1], reporter: `F. Supp.${m[2] ? ' ' + m[2] : ''}`, page: m[3] })
  },

  // Regional Reporters: "123 S.W.2d 456"
  regional_reporter: {
    pattern: /(\d+)\s+(S\.W\.|P\.|So\.|N\.E\.|N\.W\.|S\.E\.|A\.)(?:\s*(2d|3d))?\s+(\d+)/g,
    extractor: (m) => ({ volume: m[1], reporter: `${m[2]}${m[3] || ''}`, page: m[4] })
  },

  // USC: "21 U.S.C. § 355" or "42 U.S.C.A. § 1983"
  usc_citation: {
    pattern: /(\d+)\s+U\.?S\.?C\.?(?:A\.|S\.)?\s*(?:§|section|sec\.?)\s*(\d+[a-z]*(?:\([a-z0-9]+\))*)/gi,
    extractor: (m) => ({ title: m[1], section: m[2] })
  },

  // CFR: "21 C.F.R. § 312.32"
  cfr_citation: {
    pattern: /(\d+)\s+C\.?F\.?R\.?\s*(?:§|section|sec\.?)?\s*([\d]+(?:\.[\d]+)*)/gi,
    extractor: (m) => ({ title: m[1], section: m[2] })
  },

  // Federal Register: "89 Fed. Reg. 12345"
  federal_register: {
    pattern: /(\d+)\s+Fed\.\s*Reg\.\s*(\d+)/gi,
    extractor: (m) => ({ volume: m[1], page: m[2] })
  },

  // SEC Filings: includes all 10-K variants per SEC best practices
  sec_filing: {
    pattern: /(?:Form\s+(10-K(?:T|SB|\/A|405)?|10-Q(?:\/A)?|8-K(?:\/A)?|DEF\s*14A|S-[1-4]|424B\d)|SEC\s+File\s+No\.\s*([\d-]+))/gi,
    extractor: (m) => ({ form: m[1], fileNumber: m[2] })
  },

  // Patents: "U.S. Patent No. 7,123,456"
  patent_citation: {
    pattern: /(?:U\.?S\.?\s*)?Pat(?:ent)?\.?\s*(?:No\.?\s*)?([\d,]+(?:B\d)?)/gi,
    extractor: (m) => ({ number: m[1].replace(/,/g, '') })
  },

  // FDA: "NDA 012345" or "BLA 123456"
  fda_reference: {
    pattern: /(NDA|BLA|ANDA|IND|ABBR)\s*#?\s*(\d{6})/gi,
    extractor: (m) => ({ type: m[1].toUpperCase(), number: m[2] })
  },

  // Short form: "Id." and "Id. at 123"
  id_citation: {
    pattern: /\bId\.\s*(?:at\s+(\d+))?/gi,
    extractor: (m) => ({ type: 'id', pinpoint: m[1] })
  },

  // Supra: "Smith, supra, at 123"
  supra_citation: {
    pattern: /(\w+),?\s+supra(?:\s+note\s+(\d+))?(?:,?\s+at\s+(\d+))?/gi,
    extractor: (m) => ({ name: m[1], note: m[2], pinpoint: m[3] })
  }
};

// =============================================================================
// TEST CORPUS (Ground Truth from Authoritative Sources)
// =============================================================================

const TEST_CORPUS = {
  us_reports: [
    { input: 'Bush v. Gore, 531 U.S. 98 (2000)', expected: { volume: '531', page: '98' } },
    { input: 'Roe v. Wade, 410 U.S. 113, 120 (1973)', expected: { volume: '410', page: '113', pinpoint: '120' } },
    { input: 'Brown v. Board of Education, 347 U.S. 483 (1954)', expected: { volume: '347', page: '483' } }
  ],

  federal_reporter: [
    { input: 'Smith v. Jones, 500 F.3d 123 (9th Cir. 2007)', expected: { volume: '500', reporter: 'F.3d', page: '123' } },
    { input: 'Doe v. Roe, 123 F.2d 456 (2d Cir. 1942)', expected: { volume: '123', reporter: 'F.2d', page: '456' } },
    { input: 'Old case, 50 F. 100 (1892)', expected: { volume: '50', reporter: 'F.', page: '100' } }
  ],

  federal_supplement: [
    { input: 'ABC v. XYZ, 123 F. Supp. 3d 456 (S.D.N.Y. 2015)', expected: { volume: '123', reporter: 'F. Supp. 3d', page: '456' } },
    { input: 'Test v. Case, 200 F. Supp. 2d 300 (D. Mass. 2002)', expected: { volume: '200', reporter: 'F. Supp. 2d', page: '300' } },
    { input: 'Early v. Case, 50 F. Supp. 100 (1943)', expected: { volume: '50', reporter: 'F. Supp.', page: '100' } }
  ],

  usc_citation: [
    { input: 'Under 21 U.S.C. § 355, new drug applications...', expected: { title: '21', section: '355' } },
    { input: 'Pursuant to 42 U.S.C.A. § 1983, civil rights...', expected: { title: '42', section: '1983' } },
    { input: 'See 15 USC section 78j for securities fraud', expected: { title: '15', section: '78j' } },
    { input: 'The statute at 26 U.S.C. § 501(c)(3) provides...', expected: { title: '26', section: '501(c)(3)' } }
  ],

  cfr_citation: [
    { input: 'Under 21 C.F.R. § 312.32, IND safety reports...', expected: { title: '21', section: '312.32' } },
    { input: 'Per 29 CFR 1910.1200, hazard communication...', expected: { title: '29', section: '1910.1200' } },
    { input: 'See 17 C.F.R. 240.10b-5 for Rule 10b-5', expected: { title: '17', section: '240.10b' } }
  ],

  federal_register: [
    { input: 'Published at 89 Fed. Reg. 12345', expected: { volume: '89', page: '12345' } },
    { input: 'See 88 Fed. Reg. 50000 for the final rule', expected: { volume: '88', page: '50000' } }
  ],

  sec_filing: [
    { input: 'Filed on Form 10-K', expected: { form: '10-K' } },
    { input: 'Amended Form 10-K/A filing', expected: { form: '10-K/A' } },
    { input: 'Form 10-KT transitional report', expected: { form: '10-KT' } },
    { input: 'Small business Form 10KSB', expected: { form: '10KSB' } },
    { input: 'SEC File No. 001-12345', expected: { fileNumber: '001-12345' } },
    { input: 'Form DEF 14A proxy statement', expected: { form: 'DEF 14A' } }
  ],

  patent_citation: [
    { input: 'U.S. Patent No. 7,123,456', expected: { number: '7123456' } },
    { input: 'Pat. 8,000,000B2', expected: { number: '8000000B2' } },
    { input: 'U.S. Patent 9,876,543', expected: { number: '9876543' } }
  ],

  fda_reference: [
    { input: 'NDA 012345 approval', expected: { type: 'NDA', number: '012345' } },
    { input: 'BLA 123456 for biologics', expected: { type: 'BLA', number: '123456' } },
    { input: 'ANDA 200100 generic', expected: { type: 'ANDA', number: '200100' } }
  ],

  id_citation: [
    { input: 'See id.', expected: { type: 'id', pinpoint: undefined } },
    { input: 'Id. at 123', expected: { type: 'id', pinpoint: '123' } },
    { input: 'See Id. at 456.', expected: { type: 'id', pinpoint: '456' } }
  ],

  supra_citation: [
    { input: 'Smith, supra, at 100', expected: { name: 'Smith', pinpoint: '100' } },
    { input: 'Jones, supra note 5, at 200', expected: { name: 'Jones', note: '5', pinpoint: '200' } },
    { input: 'Brown supra', expected: { name: 'Brown' } }
  ]
};

// =============================================================================
// FALSE POSITIVE TEST (Should NOT match)
// =============================================================================

const FALSE_POSITIVE_TESTS = [
  'The temperature was 98 degrees F. today.',
  'Section 5 of the report discusses...',
  'Form 1040 is due April 15.',
  'Patient ID: 123456',
  'Order #7654321',
  'In the year 2023, things changed.',
  'Reference number: ABC-12345'
];

// =============================================================================
// TEST RUNNER
// =============================================================================

function runTests() {
  console.log('='.repeat(70));
  console.log('CITATION PATTERN ISOLATED VALIDATION');
  console.log('='.repeat(70));
  console.log('');

  let totalTests = 0;
  let passedTests = 0;
  const failures = [];

  // Test each pattern category
  for (const [category, config] of Object.entries(CITATION_PATTERNS)) {
    const testCases = TEST_CORPUS[category] || [];
    if (testCases.length === 0) continue;

    console.log(`\n> Testing: ${category.toUpperCase()}`);
    console.log('-'.repeat(50));

    for (const testCase of testCases) {
      totalTests++;
      const regex = new RegExp(config.pattern.source, config.pattern.flags);
      const match = regex.exec(testCase.input);

      if (!match) {
        failures.push({ category, input: testCase.input, error: 'No match found' });
        console.log(`  [FAIL] "${testCase.input.substring(0, 50)}..."`);
        console.log(`     Expected match but got none`);
        continue;
      }

      const extracted = config.extractor(match);
      let passed = true;

      for (const [key, expectedValue] of Object.entries(testCase.expected)) {
        if (extracted[key] !== expectedValue && expectedValue !== undefined) {
          passed = false;
          failures.push({
            category,
            input: testCase.input,
            error: `${key}: expected "${expectedValue}", got "${extracted[key]}"`
          });
        }
      }

      if (passed) {
        passedTests++;
        console.log(`  [PASS] "${testCase.input.substring(0, 50)}..."`);
      } else {
        console.log(`  [FAIL] "${testCase.input.substring(0, 50)}..."`);
        console.log(`     Expected: ${JSON.stringify(testCase.expected)}`);
        console.log(`     Got: ${JSON.stringify(extracted)}`);
      }
    }
  }

  // False positive tests
  console.log(`\n> Testing: FALSE POSITIVES (should NOT match)`);
  console.log('-'.repeat(50));

  for (const input of FALSE_POSITIVE_TESTS) {
    totalTests++;
    let anyMatch = false;

    for (const [category, config] of Object.entries(CITATION_PATTERNS)) {
      if (['id_citation', 'supra_citation'].includes(category)) continue; // Skip short forms
      const regex = new RegExp(config.pattern.source, config.pattern.flags);
      if (regex.test(input)) {
        anyMatch = true;
        failures.push({ category: 'FALSE_POSITIVE', input, error: `Matched by ${category}` });
        break;
      }
    }

    if (!anyMatch) {
      passedTests++;
      console.log(`  [PASS] (no match): "${input}"`);
    } else {
      console.log(`  [FAIL] (false positive): "${input}"`);
    }
  }

  // Performance test
  console.log(`\n> Testing: PERFORMANCE`);
  console.log('-'.repeat(50));

  const perfInput = 'Under 21 U.S.C. § 355 and 42 U.S.C. § 1983, as discussed in Bush v. Gore, 531 U.S. 98 (2000), and pursuant to 21 C.F.R. § 312.32, the Form 10-K filing references NDA 012345. See id. at 123.';
  const iterations = 10000;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    for (const config of Object.values(CITATION_PATTERNS)) {
      const regex = new RegExp(config.pattern.source, config.pattern.flags);
      regex.exec(perfInput);
    }
  }

  const elapsed = performance.now() - start;
  const avgTime = elapsed / iterations;
  const perfPassed = avgTime < 1; // <1ms target

  console.log(`  ${perfPassed ? '[PASS]' : '[FAIL]'} ${iterations} iterations in ${elapsed.toFixed(2)}ms`);
  console.log(`  Average: ${avgTime.toFixed(4)}ms per full pattern set`);
  console.log(`  Target: <1ms`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failures.length}`);
  console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('');

  if (failures.length > 0) {
    console.log('FAILURES:');
    failures.forEach((f, i) => {
      console.log(`  ${i + 1}. [${f.category}] ${f.input.substring(0, 40)}... - ${f.error}`);
    });
  }

  // Integration gate
  const passRate = (passedTests / totalTests) * 100;
  console.log('\n' + '='.repeat(70));
  console.log('INTEGRATION GATE');
  console.log('='.repeat(70));

  if (passRate >= 95 && perfPassed) {
    console.log('[GATE PASSED] - Safe to integrate into production');
  } else {
    console.log('[GATE FAILED] - Do NOT integrate until issues resolved');
    if (passRate < 95) console.log(`   - Pass rate ${passRate.toFixed(1)}% < 95% required`);
    if (!perfPassed) console.log(`   - Performance ${avgTime.toFixed(4)}ms > 1ms target`);
  }

  console.log('='.repeat(70));

  return { totalTests, passedTests, failures, passRate, avgTime };
}

// Run tests
runTests();
