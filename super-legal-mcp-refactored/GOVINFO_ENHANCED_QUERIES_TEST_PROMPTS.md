# GovInfo Enhanced Queries Validation Test Prompts
## Comprehensive Testing Suite for USC Schema Extraction and Section Match Validation

**Purpose**: Validate that GovInfo queries produce high-quality schema-extracted USC data with accurate section matching when ENHANCED_SUMMARY_QUERIES is enabled.

**Created**: 2025-11-06
**Status**: Ready for Testing

---

## Quick Start - Essential Test Prompts

### Server Configuration

**Baseline Mode** (static keywords):
```bash
cd /Users/ej/Google\ Grounding/super-legal-mcp-refactored
node src/server/claude-server-v2.js
```
Look for: `[GovInfo] Enhanced summary queries DISABLED - using static keyword queries (default)`

**Enhanced Mode** (context-aware queries):
```bash
export ENHANCED_SUMMARY_QUERIES=true
node src/server/claude-server-v2.js
```
Look for: `[GovInfo] ✨ Enhanced summary queries ENABLED - using context-aware natural language prompts`

---

### 3 Essential Test Prompts (5-Minute Validation)

#### Test 1: Main Civil Rights Test Case
```
Search for 42 USC 1983 - the civil rights statute about deprivation of rights under color of law. I need the full text.
```

**Expected Quality Metrics**:
- `_section_match`: true
- `title_number`: 42
- `section_number`: "1983"
- `_match_confidence`: 1.0
- `_extraction_method`: 'exa_schema' (goal) or 'regex_fallback'

**Success**: Section match accurate, correct citation extracted

---

#### Test 2: Schema Extraction Challenge
```
Find 26 USC 501 which defines tax-exempt organizations. What are the requirements for 501(c)(3) status?
```

**Expected Quality Metrics**:
- `_section_match`: true
- `title_number`: 26
- `section_number`: "501"
- `_extraction_method`: Baseline='regex_fallback', Enhanced='exa_schema' (GOAL)

**Success**: Enhanced mode improves extraction method to 'exa_schema'

---

#### Test 3: Citation Inference Test
```
Find section 1983 about civil rights violations. What are the remedies available?
```

**Expected Quality Metrics**:
- `title_number`: 42 (inferred from "civil rights" keyword)
- `section_number`: "1983"
- `_section_match`: true
- `_match_confidence`: 0.6-1.0

**Success**: parseUSCCitation() infers Title 42 from context

---

## Available GovInfo Endpoints

### 1. search_us_code
Search United States Code by keyword, title, or section.

**Parameters**:
- `search_term` (string): Keywords or USC citation
- `title` (integer 1-54): Specific USC title
- `section` (string): Specific section number
- `include_text` (boolean): Include full section text
- `include_snippet` (boolean): Include text snippets
- `limit` (integer): Max results (default: 5)

---

### 2. get_usc_section
Retrieve specific USC section with full text.

**Parameters**:
- `title` (integer 1-54, required): USC title number
- `section` (string, required): Section number
- `include_text` (boolean): Include full text (default: true)

**Smart Fallback**: Falls back to 42 USC 1983 if parameters missing

---

### 3. get_usc_title_structure
Get table of contents and chapter organization for a USC title.

**Parameters**:
- `title` (integer 1-54, required): USC title number
- `include_chapters` (boolean): Include chapter list (default: true)
- `include_sections` (boolean): Include section list (default: false)

**Smart Fallback**: Falls back to Title 42 if parameter missing

---

### 4. list_usc_titles
List all 54 USC titles.

**Parameters**:
- `include_descriptions` (boolean): Include title names (default: true)
- `include_enacted` (boolean): Show positive law status (default: false)

**No Parameters Required** - Returns static title list

---

## Quality Metrics Reference

### _extraction_method
- **'exa_schema'**: AI-powered extraction via ContentStrategy (GOAL for enhanced mode)
- **'regex_fallback'**: Traditional regex pattern matching (baseline default)

### _section_match
- **true**: Extracted section_number matches user's search intent
- **false**: No match or broad search with no specific target

### _title_match
- **true**: Extracted title_number matches user's search intent
- **false**: No match

### _match_confidence
- **1.0**: Exact title + section match
- **0.7**: Section match only
- **0.5**: No specific section to match (broad search)
- **0.0**: No match

---

## Comprehensive Test Suite

### Category 1: search_us_code - Specific Section Queries

#### Test 1.1: Civil Rights - 42 USC 1983
```
Search for 42 USC 1983 - the civil rights statute about deprivation of rights under color of law. I need the full text and information about when this statute applies.
```

**Expected**: _section_match: true, title: 42, section: "1983", _match_confidence: 1.0

---

#### Test 1.2: Tax Exempt - 26 USC 501
```
Find 26 USC 501 which defines tax-exempt organizations under the Internal Revenue Code. What are the requirements for 501(c)(3) status?
```

**Expected**: _section_match: true, title: 26, section: "501", Enhanced _extraction_method: 'exa_schema'

---

#### Test 1.3: Clean Air Act - 42 USC 7401
```
Search for 42 USC 7401 - the Congressional findings and declarations for the Clean Air Act.
```

**Expected**: _section_match: true, title: 42, section: "7401", _match_confidence: 1.0

---

#### Test 1.4: Section-Only Query (Inference Test)
```
Find section 1983 about civil rights violations. What are the remedies available?
```

**Expected**: title: 42 (inferred), section: "1983", _section_match: true, _match_confidence: 0.6-1.0

---

#### Test 1.5: Title-Only Search
```
Search Title 42 of the United States Code for provisions related to public health emergencies.
```

**Expected**: title_number: 42 for all results, _section_match: false (no specific section), _match_confidence: 0.5

---

### Category 2: search_us_code - Edge Cases

#### Test 2.1: Invalid Section Number
```
Search for 42 USC 99999 - non-existent section.
```

**Expected**: _section_match: false, _match_confidence: 0.0-0.5, no errors thrown

---

#### Test 2.2: Ambiguous Citation
```
Search USC for discrimination laws.
```

**Expected**: _section_match: false, _match_confidence: 0.5, multiple titles returned

---

#### Test 2.3: Empty Parameters (Smart Fallback Test)
```
search_us_code with no parameters
```

**Expected**: Returns recent USC updates, no crashes, smart fallback query executed

---

### Category 3: get_usc_section - Specific Section Retrieval

#### Test 3.1: Get 42 USC 1983 Full Text
```
Get the full text of 42 USC section 1983.
```

**Expected**: title: 42, section: "1983", section_title includes "civil" and "rights", full text present

---

#### Test 3.2: Get 26 USC 501 (Tax Exempt)
```
Retrieve 26 USC 501 with full text.
```

**Expected**: title: 26, section: "501", text includes subsection markers like "(c)(3)"

---

#### Test 3.3: Missing Parameters (Fallback to 42 USC 1983)
```
get_usc_section with title missing
```

**Expected**: Falls back to 42 USC 1983, console warning logged, no error thrown

---

#### Test 3.4: Invalid Title Number
```
Get section 100 of title 99 USC.
```

**Expected**: Error: "Invalid title number. Must be between 1 and 54"

---

### Category 4: get_usc_title_structure - Title Organization

#### Test 4.1: Get Title 42 Structure
```
Show me the structure and chapters of Title 42 USC.
```

**Expected**: title_number: 42, title_name: "The Public Health and Welfare", chapters object populated

---

#### Test 4.2: Get Title 26 Structure
```
Get the organizational structure of Title 26 - the Internal Revenue Code.
```

**Expected**: title_number: 26, title_name includes "Internal Revenue", chapters extracted

---

#### Test 4.3: Missing Title Parameter
```
get_usc_title_structure with no title parameter
```

**Expected**: Fallback to Title 42, no error

---

### Category 5: list_usc_titles - Complete Title Directory

#### Test 5.1: List All USC Titles
```
List all United States Code titles.
```

**Expected**: total_titles: 54, available_count: 53, all titles have number and name

---

#### Test 5.2: List Titles with Enacted Status
```
List all USC titles and show which are positive law.
```

**Expected**: enacted_positive_law field present, Title 1 enacted: true, Title 42 enacted: false

---

### Category 6: Cross-Endpoint Comparison

#### Test 6.1: Same Citation via Different Endpoints

**Test 6.1a**:
```
Search for 42 USC 1983
```

**Test 6.1b**:
```
Get section 1983 of title 42
```

**Expected**: Both return matching usc_citation, section_title; get_usc_section has more complete text

---

## Success Criteria

### Must-Pass (❌ BLOCK if failed)
- [ ] No regressions: Enhanced mode ≥ baseline on _section_match
- [ ] No errors: All test prompts execute without crashes in both modes
- [ ] Citation parsing: parseUSCCitation() works for explicit citations

### Should-Pass (⚠️ INVESTIGATE if failed)
- [ ] Schema extraction: Enhanced mode increases 'exa_schema' rate by >10%
- [ ] Match confidence: Enhanced avg confidence ≥ baseline avg
- [ ] Section match rate: Enhanced mode >90% _section_match for explicit queries
- [ ] Snippet quality: Enhanced snippets clearer/more complete

### Nice-to-Have (✅ BONUS if passed)
- [ ] Edge cases: Enhanced mode handles ambiguous queries better
- [ ] Subsection extraction: Better 501(c)(3) style extraction
- [ ] Contextual relevance: Enhanced snippets answer specific questions

---

## Testing Procedure

### Step 1: Baseline Testing
1. Start server without ENHANCED_SUMMARY_QUERIES
2. Run all test prompts via Claude Desktop connected to server
3. Save results to `govinfo-baseline-results.txt`
4. Note _extraction_method, _section_match, _match_confidence for each test

### Step 2: Enhanced Testing
1. Restart server with `ENHANCED_SUMMARY_QUERIES=true`
2. Run same test prompts
3. Save results to `govinfo-enhanced-results.txt`
4. Note same quality metrics

### Step 3: Compare Results
Create comparison table:

| Test | Baseline Extraction | Enhanced Extraction | Section Match | Confidence Δ |
|------|-------------------|-------------------|--------------|-------------|
| 42 USC 1983 | regex_fallback | exa_schema | ✅ true | +0.2 |
| 26 USC 501 | regex_fallback | regex_fallback | ❌ false | 0.0 |
| ... | ... | ... | ... | ... |

### Step 4: Calculate Metrics
- **exa_schema rate**: Count of 'exa_schema' / total tests
- **Section match accuracy**: Count of _section_match: true / explicit section queries
- **Average confidence**: Mean of _match_confidence scores

---

## Results Reporting Template

```markdown
# GovInfo Enhanced Queries Test Results

**Date**: YYYY-MM-DD
**Server**: claude-server-v2.js
**Feature**: ENHANCED_SUMMARY_QUERIES

## Summary
- Total Tests Run: X
- Tests Passed: X
- Tests Failed: X

## Metrics

### Extraction Method Distribution
| Mode | exa_schema | regex_fallback | exa_schema Rate |
|------|------------|----------------|-----------------|
| Baseline | X | Y | XX% |
| Enhanced | X | Y | XX% |
| **Improvement** | | | **+XX%** |

### Section Match Accuracy
| Mode | Matches | Total Section Queries | Accuracy |
|------|---------|---------------------|----------|
| Baseline | X | Y | XX% |
| Enhanced | X | Y | XX% |
| **Improvement** | | | **+XX%** |

### Average Match Confidence
| Mode | Avg Confidence | Std Dev |
|------|---------------|---------|
| Baseline | 0.XX | ±0.XX |
| Enhanced | 0.XX | ±0.XX |
| **Improvement** | **+0.XX** | |

## Recommendation
- [ ] ✅ APPROVE - Enhanced queries ready for production
- [ ] ⚠️ CONDITIONAL - Approve with noted improvements
- [ ] ❌ REJECT - Revert to baseline

**Rationale**: [...]

## Next Steps
1. [Action]
2. [Action]
```

---

## Expected Results (Based on Previous Testing)

### Likely Outcome: 0% Improvement

Based on diagnostic testing (see GOVINFO_ENHANCED_TARGETING_RESULTS.md):
- **Baseline exa_schema rate**: ~20% (variable)
- **Enhanced exa_schema rate**: ~20% (no improvement)
- **Section match accuracy**: 0% (Exa returns wrong sections)
- **Confidence scores**: ~0.07 avg (very low)

**Root Cause**: Exa semantic search unsuitable for USC citation precision
- Returns "42 USC 1981" when searching "42 USC 1983"
- 100% Cornell Law results, 0% GovInfo.gov
- Exact phrase queries ignored by Exa

### If Results Differ from Expectation
Document any unexpected improvements:
- Which tests showed improvement?
- What changed between diagnostic testing and server testing?
- Are improvements reproducible?

---

## Related Documentation
- `GOVINFO_ENHANCED_TARGETING_RESULTS.md` - Diagnostic test results
- `GOVINFO_OPTION_A_IMPLEMENTATION_RESULTS.md` - Exa schema extraction results
- `GOVINFO_ROOT_CAUSE_FINAL_ANALYSIS.md` - Deep dive into extraction vs search issues
- `GovInfoWebSearchClient.js` (lines 113-122) - Feature flag implementation
- `GovInfoSchemas.js` - Schema definitions for extraction
- `ContentStrategy.js` (lines 211-214) - USC-specific extraction queries

---

**End of Test Prompts Document**

Use these prompts to validate GovInfo enhanced queries functionality through claude-server-v2.js and determine whether to deploy enhanced queries for GovInfo in production.
