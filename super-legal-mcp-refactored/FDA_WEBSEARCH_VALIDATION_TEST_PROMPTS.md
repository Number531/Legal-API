# FDA WebSearch-First Validation Test Prompts
## Comprehensive Testing Suite for Token Management and Extraction Quality

**Purpose**: Validate that FDA queries route through WebSearch by default, produce high-quality Gemini-extracted results, and stay within token limits.

**Expected Behavior**:
- All queries should complete without "prompt is too long" errors
- Tool execution times ~20-35 seconds (WebSearch + Gemini extraction)
- Results should contain relevant, structured information
- Token usage should be ~5-10k per query (not 200k+)
- Multiple queries should be possible in single session

---

## Test Category 1: Drug Adverse Events (FAERS Data)

### Test 1.1: Specific Drug + Specific Adverse Event
**Prompt**:
```
Search FDA adverse event reports for Eliquis (apixaban) and bleeding complications.
I need to understand the frequency and severity of bleeding events reported to FAERS.
```

**Expected Routing**: WebSearch-first (natural language query)

**Expected Results**:
- FDA safety communications about Eliquis bleeding risk
- FAERS quarterly reports mentioning anticoagulant bleeding
- Structured extraction of bleeding event details
- No 200k+ token overflow

**Validation Checklist**:
- [ ] Query completes successfully
- [ ] Execution time ~20-35 seconds per tool call
- [ ] Results mention Eliquis/apixaban specifically
- [ ] Bleeding events discussed with severity information
- [ ] No token overflow errors

---

### Test 1.2: GLP-1 Agonist Class Query
**Prompt**:
```
What are the most serious adverse events reported for GLP-1 receptor agonists like
Ozempic, Wegovy, and Mounjaro? I'm particularly interested in gastrointestinal
and pancreatic adverse effects.
```

**Expected Routing**: WebSearch-first (natural language, class-wide query)

**Expected Results**:
- FDA safety communications for GLP-1 agonist class
- Pancreatitis and gastroparesis mentions
- Multiple drug names in results
- Comparative safety information

**Validation Checklist**:
- [ ] Query completes successfully
- [ ] Multiple GLP-1 drugs mentioned in results
- [ ] Pancreatic and GI adverse events discussed
- [ ] Class-wide safety information provided
- [ ] Token usage reasonable (~5-10k)

---

### Test 1.3: Recent Adverse Event Query
**Prompt**:
```
Search for the latest FDA adverse event reports from 2024-2025 involving
weight loss medications. What new safety signals have been identified?
```

**Expected Routing**: WebSearch-first (temporal keywords "latest", "2024-2025")

**Expected Results**:
- Recent FAERS quarterly reports (Q3-Q4 2024, Q1-Q2 2025)
- Weight loss medication safety signals
- New safety information identified by FDA
- Temporal relevance (recent data)

**Validation Checklist**:
- [ ] Results include 2024-2025 time period
- [ ] FAERS quarterly report references
- [ ] Weight loss drug safety signals
- [ ] Recent safety communications
- [ ] No token overflow

---

## Test Category 2: Drug Labeling & Prescribing Information

### Test 2.1: Specific Drug Label Warnings
**Prompt**:
```
What warnings and contraindications are listed in the FDA-approved prescribing
information for Xarelto (rivaroxaban)? Focus on bleeding risks and drug interactions.
```

**Expected Routing**: WebSearch-first (natural language)

**Expected Results**:
- Xarelto prescribing information excerpts
- Black box warnings about bleeding
- Contraindications listed
- Drug interaction information
- Structured Gemini extraction

**Validation Checklist**:
- [ ] Prescribing information content extracted
- [ ] Bleeding warnings specifically mentioned
- [ ] Contraindications identified
- [ ] Drug interactions discussed
- [ ] Results well-structured and readable

---

### Test 2.2: Drug Class Labeling Comparison
**Prompt**:
```
Compare the warnings in FDA drug labels for SGLT2 inhibitors (Jardiance, Farxiga,
Invokana). What are the common serious warnings across this class?
```

**Expected Routing**: WebSearch-first (comparative query, natural language)

**Expected Results**:
- Multiple SGLT2 inhibitor labels referenced
- Common class warnings (DKA, amputations, UTIs)
- Comparative safety information
- FDA guidance on class-wide warnings

**Validation Checklist**:
- [ ] Multiple drugs in class mentioned
- [ ] Common warnings identified
- [ ] Class-wide safety concerns discussed
- [ ] Comparative analysis provided
- [ ] Token usage manageable

---

## Test Category 3: Recalls & Enforcement Actions

### Test 3.1: Recent Recall Search
**Prompt**:
```
Search FDA recalls for medical devices in the cardiovascular category from the
past 12 months. Which manufacturers have the most recalls?
```

**Expected Routing**: WebSearch-first (temporal "past 12 months", natural language)

**Expected Results**:
- Recent device recalls (2024-2025)
- Cardiovascular device category focus
- Manufacturer names mentioned
- Recall classifications (Class I, II, III)
- Reason for recall information

**Validation Checklist**:
- [ ] Recent recalls (2024-2025) included
- [ ] Cardiovascular devices specifically
- [ ] Manufacturer names provided
- [ ] Recall details extracted
- [ ] Execution completes successfully

---

### Test 3.2: Contamination Recall Query
**Prompt**:
```
Find FDA drug recalls related to contamination or impurities in the last 2 years.
What types of contamination were found and what drugs were affected?
```

**Expected Routing**: WebSearch-first (temporal query, natural language)

**Expected Results**:
- Contamination-related recalls
- Specific drugs affected
- Types of contamination (NDMA, bacteria, etc.)
- Manufacturer responses
- Voluntary vs. mandatory recall info

**Validation Checklist**:
- [ ] Contamination recalls specifically found
- [ ] Drug names provided
- [ ] Contamination types identified
- [ ] 2-year timeframe respected
- [ ] No token overflow

---

## Test Category 4: Safety Communications

### Test 4.1: Recent Safety Alert Search
**Prompt**:
```
What are the most recent FDA drug safety communications from 2025?
Are there any new black box warnings or drug label changes?
```

**Expected Routing**: WebSearch-first (temporal "2025", "recent")

**Expected Results**:
- 2025 FDA safety communications
- New black box warnings if any
- Recent label changes
- Drug safety alerts
- Structured chronological information

**Validation Checklist**:
- [ ] 2025 timeframe respected
- [ ] Safety communications found
- [ ] Label changes mentioned
- [ ] Recent alerts included
- [ ] Well-organized temporal results

---

### Test 4.2: Drug Class Safety Communication
**Prompt**:
```
Has the FDA issued any safety communications about antidepressants and
suicidal ideation in adolescents? What do current warnings say?
```

**Expected Routing**: WebSearch-first (natural language, sensitive topic)

**Expected Results**:
- Black box warning for antidepressants
- Adolescent suicide risk information
- FDA guidance on monitoring
- Specific antidepressant classes mentioned
- Patient counseling recommendations

**Validation Checklist**:
- [ ] Antidepressant warnings found
- [ ] Suicide risk discussed
- [ ] Adolescent population focus
- [ ] Black box warning mentioned
- [ ] Clinically relevant information

---

## Test Category 5: Complex Multi-Drug Queries

### Test 5.1: Drug Interaction Safety
**Prompt**:
```
What does the FDA say about drug interactions between warfarin and commonly
prescribed antibiotics? Which antibiotics pose the highest bleeding risk?
```

**Expected Routing**: WebSearch-first (complex interaction query)

**Expected Results**:
- Warfarin interaction information
- Specific antibiotics mentioned
- Bleeding risk quantification
- Clinical guidance for monitoring
- Drug-specific interaction warnings

**Validation Checklist**:
- [ ] Warfarin interactions discussed
- [ ] Specific antibiotics named
- [ ] Bleeding risk information
- [ ] Clinical guidance provided
- [ ] Token usage acceptable

---

### Test 5.2: Pregnancy Safety Query
**Prompt**:
```
Search FDA pregnancy and lactation labeling for ACE inhibitors. What are
the warnings about use during pregnancy and what trimester risks exist?
```

**Expected Routing**: WebSearch-first (specific safety category query)

**Expected Results**:
- Pregnancy category/PLLR information
- Trimester-specific warnings
- Fetal risk information
- Lactation safety data
- Clinical recommendations

**Validation Checklist**:
- [ ] Pregnancy warnings found
- [ ] Trimester risks discussed
- [ ] ACE inhibitor class coverage
- [ ] Lactation information included
- [ ] Medically accurate content

---

## Test Category 6: Edge Cases & Stress Tests

### Test 6.1: Very Recent Query (Testing Data Freshness)
**Prompt**:
```
What FDA actions have been taken in November 2025? Any new drug approvals,
safety alerts, or recalls announced this month?
```

**Expected Routing**: WebSearch-first (very recent temporal query)

**Expected Results**:
- Most recent FDA actions (if available)
- Graceful handling if no November 2025 data yet
- Related recent actions (October 2025)
- Clear temporal boundaries in results

**Validation Checklist**:
- [ ] Query attempts to find recent data
- [ ] Graceful degradation if no results
- [ ] Related timeframe data provided
- [ ] No errors or crashes
- [ ] Reasonable fallback behavior

---

### Test 6.2: Broad Category Query (Testing Result Limitation)
**Prompt**:
```
Show me FDA adverse event reports for cardiovascular drugs. What are the
most commonly reported adverse effects in this therapeutic category?
```

**Expected Routing**: WebSearch-first (broad category)

**Expected Results**:
- Limited, focused results (not 200k+ tokens)
- Common cardiovascular adverse events
- Representative drug examples
- Structured summary format
- Manageable token usage

**Validation Checklist**:
- [ ] Results appropriately limited
- [ ] Token usage <20k
- [ ] No overwhelming data dump
- [ ] Useful summary information
- [ ] Query completes successfully

---

### Test 6.3: OpenFDA Syntax Query (Testing Native Routing Exception)
**Prompt**:
```
Search FDA FAERS database using: patient.drug.medicinalproduct:"LIPITOR"+AND+serious:1
Return adverse events matching this OpenFDA query syntax.
```

**Expected Routing**: Native-first (OpenFDA syntax detected)

**Expected Results**:
- Query recognized as OpenFDA syntax
- Native FDA API called
- Structured FDA API response
- **WARNING**: May have higher token usage (this is expected for OpenFDA syntax)

**Validation Checklist**:
- [ ] OpenFDA syntax recognized
- [ ] Native routing triggered (if verbose logging on)
- [ ] Valid FDA API response format
- [ ] Results match query criteria
- [ ] Token usage monitored (expected to be higher)

---

## Test Category 7: Iterative Multi-Query Session

### Test 7.1: Sequential FDA Queries (Testing Token Accumulation)
**Prompt 1**:
```
What are the black box warnings for Pradaxa (dabigatran)?
```

**Prompt 2** (after receiving results):
```
Compare those warnings to the black box warnings for Eliquis (apixaban).
```

**Prompt 3** (after receiving results):
```
What monitoring is recommended for patients taking these anticoagulants?
```

**Expected Behavior**:
- All three queries complete successfully
- Token usage accumulates but stays within 200k limit
- Each query ~5-10k tokens
- Total usage ~15-30k tokens (well within limit)
- Context maintained across queries

**Validation Checklist**:
- [ ] All 3 queries complete without error
- [ ] No "prompt is too long" error
- [ ] Each query executes ~20-35 seconds
- [ ] Results relevant and contextual
- [ ] Session maintains coherence

---

## Test Category 8: Error Handling & Graceful Degradation

### Test 8.1: Nonexistent Drug Query
**Prompt**:
```
Search FDA adverse events for the drug "Zyqorex" (made-up name).
What safety information exists?
```

**Expected Behavior**:
- Graceful "no results found" message
- Possible suggestions for similar drugs
- No crash or error
- Clear communication of search failure

**Validation Checklist**:
- [ ] Query handles nonexistent drug gracefully
- [ ] No server errors or crashes
- [ ] User-friendly "no results" message
- [ ] System remains stable
- [ ] Execution completes cleanly

---

### Test 8.2: Ambiguous Query
**Prompt**:
```
Tell me about FDA issues with the drug ASA.
```

**Expected Behavior**:
- Recognizes "ASA" as aspirin (acetylsalicylic acid)
- Returns relevant aspirin safety information
- Or asks for clarification if truly ambiguous

**Validation Checklist**:
- [ ] Query resolved appropriately
- [ ] Relevant results returned
- [ ] No confusion or errors
- [ ] Useful information provided
- [ ] Execution successful

---

## Success Criteria Summary

### Token Management ✅
- **Target**: <10k tokens per FDA query
- **Alert Threshold**: >50k tokens per query
- **Critical Failure**: >100k tokens or "prompt is too long" error

### Execution Performance ✅
- **Expected Time**: 20-35 seconds per WebSearch query
- **Native Routing**: <1 second (when triggered for OpenFDA syntax)
- **Multiple Queries**: 5+ queries possible per session

### Result Quality ✅
- **Relevance**: Results directly address query topic
- **Structure**: Well-organized Gemini extraction
- **Completeness**: Key safety information included
- **Accuracy**: Matches FDA source material

### Error Handling ✅
- **Graceful Degradation**: No crashes on edge cases
- **Clear Messaging**: User-friendly error messages
- **System Stability**: Server remains responsive

---

## Testing Procedure

### Manual Testing (Recommended)
1. Start server: `node src/server/claude-server-v2.js`
2. Open frontend: `test/claude-enhanced-interface.html`
3. Submit test prompts one at a time
4. Monitor server logs for:
   - Tool execution times (~30s = WebSearch, ~1ms = Native)
   - Token management messages (if verbose logging enabled)
   - Any errors or warnings
5. Verify results quality and relevance

### Verbose Logging (Optional)
```bash
export HYBRID_VERBOSE_LOGGING=true
node src/server/claude-server-v2.js
```

Expected logs with verbose mode:
```
[FDAHybridClient] [Route] Default → websearch_first (token-aware: ~5-10k tokens vs 211k native)
[FDAHybridClient] [Token Management] Using WebSearch + Gemini extraction (~5-10k tokens)
[BaseHybridClient] Returning websearch-only result (no native enhancement)
```

### Metrics to Track
- **Total queries executed**: Target 10+ in single session
- **Token overflow errors**: Target 0
- **Average query time**: Target 20-35 seconds
- **Result relevance**: Target >90% useful responses
- **System stability**: Target 100% uptime during testing

---

## Reporting Template

After testing, document results:

```markdown
## Test Results Summary

**Test Date**: [Date]
**Total Tests Run**: [Number]
**Successful**: [Number]
**Failed**: [Number]
**Token Overflow Errors**: [Number]

### Test Categories Completed
- [ ] Drug Adverse Events (6 tests)
- [ ] Drug Labeling (2 tests)
- [ ] Recalls (2 tests)
- [ ] Safety Communications (2 tests)
- [ ] Complex Queries (2 tests)
- [ ] Edge Cases (3 tests)
- [ ] Iterative Session (1 test)
- [ ] Error Handling (2 tests)

### Key Findings
1. [Finding 1]
2. [Finding 2]
3. [Finding 3]

### Issues Identified
1. [Issue 1]
2. [Issue 2]

### Recommendation
- [ ] APPROVE for production deployment
- [ ] CONDITIONAL approval with minor fixes
- [ ] REJECT - major issues found
```

---

## Quick Validation Set (5 Minutes)

For rapid validation, test these 3 prompts:

1. **Ozempic pancreatitis** (original failing query)
2. **Recent FDA recalls 2025** (temporal query)
3. **Warfarin drug interactions** (complex safety query)

All 3 should complete without token overflow and produce quality results.

---

**Created**: 2025-11-03
**Purpose**: Validation testing for FDA WebSearch-first implementation
**Related**: FDA_TOKEN_OVERFLOW_ROOT_CAUSE_AND_FIX.md
