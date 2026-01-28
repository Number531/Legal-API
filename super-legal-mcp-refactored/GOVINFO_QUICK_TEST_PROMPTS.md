# GovInfo Quick Validation Test Prompts
## 5-Minute Validation Set for claude-server-v2.js

**Purpose**: Rapid validation of GovInfo enhanced queries functionality
**Time**: ~5 minutes per mode (baseline + enhanced)

---

## Server Configuration

### Baseline Mode (Static Keywords)
```bash
cd /Users/ej/Google\ Grounding/super-legal-mcp-refactored
node src/server/claude-server-v2.js
```

**Look for this log**:
```
[GovInfo] Enhanced summary queries DISABLED - using static keyword queries (default)
```

### Enhanced Mode (Context-Aware Queries)
```bash
export ENHANCED_SUMMARY_QUERIES=true
node src/server/claude-server-v2.js
```

**Look for this log**:
```
[GovInfo] ✨ Enhanced summary queries ENABLED - using context-aware natural language prompts
```

---

## 3 Essential Test Prompts

### Test 1: Main Civil Rights Test Case (42 USC 1983)

**Copy-Paste Prompt**:
```
Search for 42 USC 1983 - the civil rights statute about deprivation of rights under color of law. I need the full text.
```

**What to Check in Response**:
```json
{
  "title_number": 42,                    // ✅ Must be 42
  "section_number": "1983",              // ✅ Must be "1983"
  "usc_citation": "42 U.S.C. § 1983",   // ✅ Proper format
  "_section_match": true,                // ✅ CRITICAL - must be true
  "_title_match": true,                  // ✅ Should be true
  "_match_confidence": 1.0,              // ✅ Should be 1.0 or 0.7
  "_extraction_method": "exa_schema"     // 🎯 GOAL: exa_schema (may be regex_fallback)
}
```

**Pass Criteria**:
- ✅ `_section_match: true` (MUST PASS)
- ✅ `section_number: "1983"` (correct section)
- ✅ `title_number: 42` (correct title)
- 🎯 Enhanced mode: `_extraction_method: 'exa_schema'` (goal, not required)

**Known Issue**: May return wrong section (1981, 7604) despite correct query - this is Exa search quality issue, not implementation bug.

---

### Test 2: Schema Extraction Challenge (26 USC 501)

**Copy-Paste Prompt**:
```
Find 26 USC 501 which defines tax-exempt organizations. What are the requirements for 501(c)(3) status?
```

**What to Check in Response**:
```json
{
  "title_number": 26,                    // ✅ Must be 26
  "section_number": "501",               // ✅ Must be "501" (NOT "501c" or "501(c)(3)")
  "_section_match": true,                // ✅ CRITICAL - must be true
  "_extraction_method": "exa_schema",    // 🎯 GOAL: Baseline='regex_fallback', Enhanced='exa_schema'
  "snippet": "...501(c)(3)..."          // 🎯 Should mention 501(c)(3) requirements
}
```

**Pass Criteria**:
- ✅ `_section_match: true` (MUST PASS)
- ✅ `section_number: "501"` (not malformed)
- 🎯 Enhanced mode improves `_extraction_method` from 'regex_fallback' to 'exa_schema'
- 🎯 Enhanced mode provides better snippet quality

**Known Issue**: Exa schema extraction previously failed (0/5 results) - this test checks if it's improved.

---

### Test 3: Citation Inference (Section 1983)

**Copy-Paste Prompt**:
```
Find section 1983 about civil rights violations. What are the remedies available?
```

**What to Check in Response**:
```json
{
  "title_number": 42,                    // ✅ INFERRED from "civil rights" keyword
  "section_number": "1983",              // ✅ Must be "1983"
  "_section_match": true,                // ✅ Should be true
  "_match_confidence": 0.6,              // ✅ Lower confidence (0.6) is correct for inferred title
  "snippet": "...remedies...damages..."  // 🎯 Should mention remedies/damages
}
```

**Pass Criteria**:
- ✅ `title_number: 42` (correctly inferred from "civil rights")
- ✅ `section_number: "1983"`
- ✅ `_section_match: true`
- ✅ `_match_confidence: 0.6-1.0` (lower is OK for inferred)
- 🎯 parseUSCCitation() successfully inferred Title 42

**Technical Detail**: Tests `inferUSCTitle()` method which maps keywords → title numbers:
- "civil rights" → Title 42
- "tax" → Title 26
- "criminal" → Title 18

---

## Quick Comparison Table

After running all 3 tests in both modes, create this table:

| Test | Baseline _extraction_method | Enhanced _extraction_method | Section Match | Verdict |
|------|---------------------------|---------------------------|--------------|---------|
| 42 USC 1983 | regex_fallback | exa_schema | ✅ true | ✅ PASS |
| 26 USC 501 | regex_fallback | regex_fallback | ❌ false | ❌ FAIL |
| Section 1983 | exa_schema | exa_schema | ✅ true | ✅ PASS |

**Pass/Fail Logic**:
- ✅ **PASS**: _section_match is true AND section_number matches expected
- ⚠️ **PARTIAL**: _section_match true BUT _extraction_method didn't improve
- ❌ **FAIL**: _section_match is false OR wrong section_number

---

## Expected Results (Based on Previous Testing)

### Likely Outcome: 0% Improvement ❌

From `GOVINFO_ENHANCED_TARGETING_RESULTS.md`:

**Test 1 (42 USC 1983)**:
- Results: 4 found
- Exact Section Matches: **0/4 (0%)**
- Returned: 1981, 241 (Title 18!), 6711 (Title 31!)
- _extraction_method: 'exa_schema' (extraction works)
- **Issue**: Exa returns WRONG sections

**Test 2 (26 USC 501)**:
- Results: 5 found
- Exact Section Matches: **0/5 (0%)**
- _extraction_method: 'regex_fallback' (schema extraction failed)
- **Issue**: Exa schema extraction fails + wrong sections

**Root Cause**: Exa semantic search unsuitable for USC statutory precision
- Ignores exact phrases ("42 USC 1983" → returns 1981)
- 100% Cornell Law, 0% GovInfo.gov
- Wrong title entirely (Title 18 instead of 42)

### If Results DIFFER from Expectation

**If tests actually PASS** (unexpected):
1. Document what changed between diagnostic testing and server testing
2. Check if server configuration differs
3. Verify results are reproducible
4. Consider enabling enhanced queries if consistent

**If tests FAIL as expected**:
1. Confirm findings from diagnostic testing
2. Document as "GovInfo unsuitable for Exa web search"
3. Proceed with CourtListenerWebSearchClient migration
4. Keep enhanced targeting code as reference

---

## Decision Matrix

Based on test results:

### Scenario A: All 3 Tests Pass ✅
**Verdict**: APPROVE enhanced queries for GovInfo
**Action**:
- Document successful validation
- Enable ENHANCED_SUMMARY_QUERIES=true in production
- Monitor real-world usage

### Scenario B: 1-2 Tests Pass ⚠️
**Verdict**: CONDITIONAL approval
**Action**:
- Identify which specific queries work
- Document limitations
- Consider partial rollout or additional testing

### Scenario C: 0 Tests Pass ❌
**Verdict**: REJECT enhanced queries
**Action**:
- Keep ENHANCED_SUMMARY_QUERIES=false (default)
- Document as "unsuitable for Exa web search"
- Proceed with CourtListenerWebSearchClient
- Explore alternative approaches (GovInfo API, legal search providers)

---

## Full Test Suite

For comprehensive testing beyond these 3 prompts, see:
`GOVINFO_ENHANCED_QUERIES_TEST_PROMPTS.md`

Contains 26 test prompts across:
- Specific section queries (5 tests)
- Edge cases (3 tests)
- get_usc_section endpoint (4 tests)
- get_usc_title_structure endpoint (3 tests)
- list_usc_titles endpoint (2 tests)
- Cross-endpoint comparison (1 test)

---

## Related Documentation

**Implementation**:
- `GovInfoWebSearchClient.js` (lines 736-857) - Enhanced targeting implementation
- `ContentStrategy.js` (lines 211-214) - USC extraction queries
- `GovInfoSchemas.js` - Schema definitions

**Test Results**:
- `GOVINFO_ENHANCED_TARGETING_RESULTS.md` - Diagnostic test results (0% improvement)
- `GOVINFO_OPTION_A_IMPLEMENTATION_RESULTS.md` - Exa schema extraction results
- `GOVINFO_ROOT_CAUSE_FINAL_ANALYSIS.md` - Root cause analysis

**Comparison Studies**:
- `FDA_ENHANCED_QUERIES_EXECUTIVE_SUMMARY.md` - FDA success (+15-30%)
- `SEC_ENHANCED_QUERIES_IMPLEMENTATION_REPORT.md` - SEC success (+16.2%)

---

**Created**: 2025-11-06
**Purpose**: Quick validation for GovInfo enhanced queries via claude-server-v2.js
**Time Required**: ~10 minutes (5 min baseline + 5 min enhanced)
