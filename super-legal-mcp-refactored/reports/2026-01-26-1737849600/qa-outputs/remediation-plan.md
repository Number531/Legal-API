# REMEDIATION PLAN

**Source:** diagnostic-assessment.md
**Generated:** January 26, 2026
**Diagnostic Score:** 86.7%
**Remediation Tier:** TIER 2 — STANDARD REMEDIATION
**Issues in Scope:** 5 (1 CRITICAL, 3 MEDIUM, 1 LOW)
**Estimated Duration:** 2-3 hours

---

## EXECUTIVE SUMMARY

The memorandum scores **86.7%** (below 88% REMEDIATE threshold) due to a **single structural deficiency**: missing CREAC headers. The substantive analysis is exceptional (partner-quality content), but the formal organization lacks explicit structural signposting.

**One Critical Issue dominates the gap:**
- **Issue-001 (CREAC Headers):** -14 weighted points
- All other issues: -6 weighted points combined

**Remediation Strategy:** TIER 2 (Standard) remediation targeting all 5 issues across 5 waves.

**Projected Post-Remediation Score:**
- **Minimum (Issue-001 only):** 93.1% (CERTIFY threshold)
- **Maximum (all issues):** 95.4% (Grade: A)

---

## ISSUE CATALOG

### CRITICAL SEVERITY (1 Issue)

#### ISSUE-001: Missing CREAC Structural Headers

**Dimension:** 2 (CREAC Structure)
**Current Score:** 3/10 (weighted 6/20)
**Target Score:** 9/10 (weighted 18/20)
**Impact:** -14 weighted points (-7% of overall score)

**Description:**
Document lacks explicit CREAC subheaders (### Conclusion, ### Rule, ### Explanation, ### Application, ### Counter-Analysis) despite following CREAC reasoning substantively. Grep search returned 0 matches for expected 50-95 headers across 12 sections.

**Why Critical:**
This single issue prevents certification. Legal memoranda require scannable structure where readers can jump to "Counter-Analysis" subsections to evaluate adversarial arguments. Currently, counter-analyses are embedded in narrative paragraphs, making them difficult to locate.

**Evidence:**
- Expected: 50-95 CREAC headers (4-8 per section × 12 sections)
- Found: 0 explicit headers
- Alternative format detected: 151 inline `**Conclusion:**` labels (not headers)

**Remediation Approach:** HYBRID (Script + Agent)
1. **Script (apply-creac-headers.py):** Achieve ~23% of headers via pattern detection
2. **Agent (memo-remediation-writer):** Validate and complete to 50-95 total headers

**Wave Assignment:** Wave 1 (CRITICAL priority, parallel execution with W1-VALIDATE)

---

### MEDIUM SEVERITY (3 Issues)

#### ISSUE-002: One Section Missing Formal Risk Assessment Table

**Dimension:** 7 (Quantification & Risk Tables)
**Current Score:** 9/10 (weighted 18/20)
**Target Score:** 10/10 (weighted 20/20)
**Impact:** -2 weighted points (-1% of overall score)

**Description:**
Grep returned 11 risk table headers vs. 12 expected (one per section IV.A-IV.L). One section lacks formal table with columns: Finding | Severity | Probability | Exposure | Mitigation. Aggregate risk summary in Section II partially compensates.

**Remediation Approach:** Targeted agent insertion
1. Systematically check IV.A-IV.L for risk table presence
2. Identify missing section
3. Generate table following Section II format

**Wave Assignment:** Wave 3 (MEDIUM priority, after W1-W2 complete)

---

#### ISSUE-003: Minor Advocacy Language Instances

**Dimension:** 3 (Objectivity)
**Current Score:** 9/10 (weighted 18/20)
**Target Score:** 10/10 (weighted 20/20)
**Impact:** -2 weighted points (-1% of overall score)

**Description:**
10 total matches for advocacy language:
- "clearly" — 4 instances (lines 2651, 4171, 4798, 5223) in analytical context
- "excellent" — 1 instance (line 4171) — potentially promotional
- "outstanding" — 2 instances (financial term "outstanding liabilities" — acceptable)

**Remediation Approach:** Targeted language neutralization
1. Replace "clearly" with neutral phrasing ("the evidence indicates," "based on precedent")
2. Verify line 4171 "excellent" context and neutralize if promotional

**Wave Assignment:** Wave 4 (MEDIUM priority, cosmetic cleanup)

---

#### ISSUE-004: Incomplete Precedent Transaction Citations in Draft Provisions

**Dimension:** 9 (Draft Contract Language)
**Current Score:** 9/10 (weighted 18/20)
**Target Score:** 10/10 (weighted 20/20)
**Impact:** -2 weighted points (-1% of overall score)

**Description:**
13 draft contract provisions present (exceeds 8-10 expected), but precedent transaction citations inconsistent. Some provisions reference *Halifax*, *Covenant* settlements; others lack market benchmarking context.

**Remediation Approach:** Add market context
1. Identify all 13 draft provision sections
2. Add precedent transaction reference OR market context to each provision
3. Example: "This escrow structure mirrors the $15M, 24-month escrow in *Kindred/Gentiva* transaction"

**Wave Assignment:** Wave 4 (MEDIUM priority, parallel with W4-001)

---

### LOW SEVERITY (1 Issue)

#### ISSUE-005: Table of Contents Header Level Notation Mismatch

**Dimension:** 10 (Formatting & Structure)
**Current Score:** 9/10 (weighted 9/10)
**Target Score:** 10/10 (weighted 10/10)
**Impact:** -1 weighted point (-0.5% of overall score)

**Description:**
TOC (lines 17-40) uses `#### IV.A` (H4 notation), but actual section headers in document body correctly use `## IV.A` (H2 notation). Pure display inconsistency; does not affect rendering or navigation.

**Remediation Approach:** Trivial text replacement
Update TOC lines 21-32: Change `####` to `##` for IV.A-IV.L section references

**Wave Assignment:** Wave 5 (LOW priority, cosmetic fix)

---

## REMEDIATION WAVE STRUCTURE

### Wave 1: Critical Structural Fix (HYBRID — Script + Agent)
**Parallel Execution:** YES (script and agent validation)
**Gate:** None (first wave)
**Estimated Duration:** 60-90 minutes

| Task ID | Agent/Script | Priority | Est. Time | Description |
|---------|--------------|----------|-----------|-------------|
| W1-001-SCRIPT | apply-creac-headers.py | CRITICAL | 10 min | Insert CREAC headers via pattern detection (--min-headers 50) |
| W1-001-VALIDATE | memo-remediation-writer | CRITICAL | 60-80 min | Validate script output and enhance to 50-95 total headers |

**Script Command:**
```bash
python3 scripts/apply-creac-headers.py \
  /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/final-memorandum.md \
  /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/final-memorandum-creac.md \
  --min-headers 50
```

**Agent Instructions (W1-001-VALIDATE):**
```
Task: Validate and enhance CREAC headers in final-memorandum-creac.md

Input: final-memorandum-creac.md (output from apply-creac-headers.py)

Objective:
1. Verify script correctly inserted Conclusion headers (expected ~12 minimum)
2. Add missing CREAC components to achieve 50-95 total headers:
   - Rule (15-20 headers expected)
   - Explanation (15-20 headers)
   - Application (12-15 headers)
   - Counter-Analysis (15-25 headers)

Format:
### Conclusion
[Existing paragraph with conclusion statement]

### Rule
[Legal rule with statutory/regulatory citation]

### Explanation
[Case law analysis - precedent discussion only, NO client facts]

### Application
[Fact-to-fact comparison: precedent facts → client facts]

### Counter-Analysis
[Adversarial arguments against conclusion - must be substantive, not pro forma]

Success Criteria:
- Grep '^### (Conclusion|Rule|Explanation|Application|Counter-Analysis)' returns ≥50 matches
- Each section IV.A-IV.L has minimum 4 CREAC headers
- Counter-Analysis subsections separated from Application (not embedded)

Output: final-memorandum-v2.md with complete CREAC structure
```

---

### Wave 2: (SKIPPED — No Content Additions Required)

All substantive content is present. Wave 2 (typically used for adding missing analysis) is not needed for this remediation.

---

### Wave 3: Structural Completeness (Risk Table)
**Parallel Execution:** YES (only 1 task)
**Gate:** Wave 1 complete
**Estimated Duration:** 20 minutes

| Task ID | Agent | Priority | Est. Time | Description |
|---------|-------|----------|-----------|-------------|
| W3-001 | memo-remediation-writer | MEDIUM | 20 min | Identify and add missing risk assessment table |

**Agent Instructions (W3-001):**
```
Task: Add missing risk assessment table to one section (11/12 found, 1 missing)

Sections to Check: IV.A through IV.L (systematic verification)

Risk Table Format:
| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| [Brief description] | CRITICAL/HIGH/MEDIUM/LOW | X% (methodology) | $XM-$YM (basis) | [Specific action] |

Example (Section II, line 86):
| Federal Healthcare Fraud (STARK/AKS) | CRITICAL | 60% Base/30% Down/10% Severe | $42.4M-$364M | Equity buyout + voluntary disclosure |

Success Criteria:
- Grep '| Finding | Severity | Probability' returns 12 matches (currently 11)
- Missing section identified and table added
- Table follows format/style of existing 11 tables

Output: Edit to final-memorandum-v2.md with complete risk table coverage
```

---

### Wave 4: Language & Market Context Refinements
**Parallel Execution:** YES (2 tasks, independent)
**Gate:** Wave 3 complete
**Estimated Duration:** 45-60 minutes

| Task ID | Agent | Priority | Est. Time | Description |
|---------|-------|----------|-----------|-------------|
| W4-001 | memo-remediation-writer | MEDIUM | 20-30 min | Neutralize 5 advocacy language instances |
| W4-002 | memo-remediation-writer | MEDIUM | 25-30 min | Add precedent transaction citations to draft provisions |

**Agent Instructions (W4-001):**
```
Task: Neutralize advocacy language at 5 specific locations

Target Lines:
1. Line 2651: "clearly" → Replace with "the evidence indicates"
2. Line 4171: "excellent" → Verify context; if promotional, neutralize to factual statement with citation
3. Line 4798: "clearly" → Replace with "based on the analysis"
4. Line 5223: "clearly" → Replace with neutral phrasing (context: "10 factors clearly favor independent contractor")
5. Lines 7464-7465: "outstanding" → Verify context (appears to be financial term "outstanding liabilities" — if so, NO CHANGE)

Success Criteria:
- Grep 'clearly|excellent|outstanding' (excluding financial "outstanding") returns ≤2 matches
- No promotional language remains
- Factual accuracy maintained (don't weaken well-supported conclusions)

Output: Edit to final-memorandum-v2.md with neutralized language
```

**Agent Instructions (W4-002):**
```
Task: Add precedent transaction citations to 13 draft contract provisions

Objective: Provide "what's market?" context for each draft provision

Approach:
1. Locate all 13 draft provision sections (grep: 'DRAFT CONTRACT LANGUAGE|Draft.*Provision')
2. For each provision, add ONE of:
   (a) Specific precedent transaction: "This escrow structure mirrors the $15M, 24-month escrow in *Kindred/Gentiva* transaction"
   (b) Market context: "Market escrows for healthcare FCA exposure typically range 5-15% of purchase price per [source]"

Sources Available:
- *Halifax* settlement: $85M (STARK/FCA)
- *Covenant* settlement: $69M (STARK)
- *Tuomey* verdict: $237M (STARK/FCA) — reduced to $72.4M
- Generic market data from OIG/DOJ settlement databases

Success Criteria:
- All 13 provisions include precedent citation OR market context
- Citations formatted as footnotes (do NOT disrupt provision text)
- Market context adds negotiation value (helps assess reasonableness)

Output: Edit to final-memorandum-v2.md with enhanced draft provisions
```

---

### Wave 5: Cosmetic Formatting Fix
**Parallel Execution:** NO (sequential, trivial task)
**Gate:** Wave 4 complete
**Estimated Duration:** 5 minutes

| Task ID | Agent | Priority | Est. Time | Description |
|---------|-------|----------|-----------|-------------|
| W5-001 | memo-remediation-writer | LOW | 5 min | Correct TOC header level notation |

**Agent Instructions (W5-001):**
```
Task: Correct Table of Contents header level notation mismatch

Location: Lines 17-40 (Table of Contents)

Change:
#### IV.A Federal Healthcare Fraud and Abuse Laws
#### IV.B False Claims Act Exposure Analysis
[...all 12 sections...]

To:
## IV.A Federal Healthcare Fraud and Abuse Laws
## IV.B False Claims Act Exposure Analysis
[...all 12 sections...]

Rationale: TOC uses H4 notation (####) but actual section headers in document body use H2 (##). Correct TOC to match actual header levels.

Success Criteria:
- TOC lines 21-32 updated from #### to ##
- TOC notation matches document body header levels
- No other changes to TOC content

Output: Edit to final-memorandum-v2.md with corrected TOC
```

---

### Wave 6: Final Validation & Re-Certification
**Parallel Execution:** NO (sequential)
**Gate:** Wave 5 complete
**Estimated Duration:** 15 minutes (automated validation)

| Task ID | Script | Priority | Description |
|---------|--------|----------|-------------|
| W6-001 | pre-qa-validate.py | CRITICAL | Run all validation checks on final-memorandum-v2.md |
| W6-002 | (orchestrator) | CRITICAL | Trigger QA Pass 2 (quality-assessment-diagnostic) on v2 |

**Validation Command:**
```bash
python3 scripts/pre-qa-validate.py \
  /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/final-memorandum-v2.md
```

**Expected Exit Code:** 0 (pass)

**Expected Checks:**
- CREAC Headers: ≥50 (BLOCKING check)
- Risk Tables: 12 (currently 11, will be 12 after W3-001)
- Placeholders: 0 (already passing)
- Word Count: Stable ~154K words
- Provision Coverage: 100% for HIGH/CRITICAL findings

**If Exit Code 0:** Proceed to QA Pass 2 (quality-assessment-certification)
**If Exit Code 1:** Review validation output, identify blocking issue, escalate to HUMAN_REVIEW

---

## DEPENDENCY GRAPH

```
Wave 1 (CREAC Headers - CRITICAL)
   ↓
   ├─ W1-001-SCRIPT (apply-creac-headers.py) [10 min]
   └─ W1-001-VALIDATE (memo-remediation-writer) [60-80 min]
   ↓
Wave 3 (Risk Table Gap - MEDIUM) [20 min]
   ↓
Wave 4 (Language & Provisions - MEDIUM) [45-60 min]
   ↓
   ├─ W4-001 (Neutralize advocacy) [20-30 min]
   └─ W4-002 (Add precedent citations) [25-30 min]
   ↓
Wave 5 (TOC Formatting - LOW) [5 min]
   ↓
Wave 6 (Validation & Re-Certification) [15 min]
   ↓
   ├─ W6-001 (pre-qa-validate.py)
   └─ W6-002 (QA Pass 2 diagnostic)
```

**Total Sequential Path Duration:** 145-190 minutes (2.4-3.2 hours)

**Critical Path:** Wave 1 (W1-001-VALIDATE at 60-80 minutes dominates timeline)

---

## SUCCESS METRICS

### Dimension Score Targets

| Dimension | Current Score | Target Score | Improvement |
|-----------|---------------|--------------|-------------|
| 2. CREAC Structure | 3/10 | 9/10 | +6 raw points |
| 3. Objectivity | 9/10 | 10/10 | +1 raw point |
| 7. Quantification | 9/10 | 10/10 | +1 raw point |
| 9. Draft Provisions | 9/10 | 10/10 | +1 raw point |
| 10. Formatting | 9/10 | 10/10 | +1 raw point |

### Overall Score Projection

| Scenario | Score | Grade | Status |
|----------|-------|-------|--------|
| **Current (Baseline)** | 86.7% | B+ | REMEDIATE |
| **Wave 1 Only (CREAC)** | 93.1% | A- | CERTIFY |
| **All Waves (1-5)** | 95.4% | A | CERTIFY |

**Minimum Acceptable Outcome:** 93.1% (Wave 1 success = certification threshold)

**Target Outcome:** 95.4% (all issues resolved = Grade A)

---

## ESCALATION RULES

### Remediation Cycle Limits

- **Current Cycle:** 1 of 3 maximum
- **Escalation Trigger:** Same issue unresolved after 2 cycles
- **Escalation Action:** Flag for human review in qa-outputs/escalation-report.md

### Quality Gates

**Gate: W1 → W3**
- **Check:** Grep '^### (Conclusion|Rule|Explanation|Application|Counter-Analysis)' ≥ 50 matches
- **If Fail:** W1-001-VALIDATE did not achieve minimum CREAC header target
- **Action:** Extend W1-001-VALIDATE by 30 minutes OR escalate to human review

**Gate: W5 → W6**
- **Check:** All W1-W5 tasks marked COMPLETE in remediation-wave-state.json
- **If Fail:** One or more waves blocked
- **Action:** Review blocking_issue in state file, determine if retry or escalation warranted

**Gate: W6 Validation**
- **Check:** pre-qa-validate.py returns exit code 0
- **If Fail (exit code 1):** Blocking validation issue detected
- **Action:** Review stdout for specific check failure, determine remediation or escalation

---

## RISK ASSESSMENT

### Low Risk (95% Confidence)

**Issues W3-W5 (MEDIUM/LOW severity):**
- Risk table insertion: Straightforward template addition
- Language neutralization: 5 specific line edits
- Precedent citations: Research task, not analytical
- TOC formatting: Trivial text replacement

**Mitigation:** None needed (low complexity tasks)

### Medium Risk (70% Confidence)

**Issue W1 (CREAC headers - CRITICAL):**
- Script achieves ~23% of headers automatically (proven in prior runs)
- Agent must manually enhance 70-80% of structure
- Risk: Agent may miss some counter-analysis subsections OR create headers that don't align with paragraph content

**Mitigation:**
1. W1-001-VALIDATE receives explicit instructions with CREAC format examples
2. Success criteria includes grep verification (objective pass/fail)
3. If W1 fails gate check, extend by 30 minutes for agent refinement

### Escalation Threshold

If **2 consecutive remediation cycles** fail to achieve 93%+ score:
- **Action:** ESCALATE to HUMAN_REVIEW
- **Rationale:** Agent incapable of resolving issue without human semantic judgment
- **Outcome:** Document delivered with CERTIFY_WITH_LIMITATIONS status + disclosure of unresolved issues

---

## COST-BENEFIT ANALYSIS

### Time Investment vs. Score Gain

| Wave | Time (min) | Score Gain | Points per Minute |
|------|------------|------------|-------------------|
| W1 | 60-90 | +6.4% | 0.07-0.11 |
| W3 | 20 | +1.0% | 0.05 |
| W4 | 45-60 | +1.5% | 0.025-0.033 |
| W5 | 5 | +0.5% | 0.10 |

**Most Efficient:** Wave 1 (CREAC) delivers 6.4% score gain = 73% of total improvement

**Recommendation:** If time-constrained, execute Wave 1 only to achieve 93.1% (CERTIFY threshold). Waves 3-5 are refinements, not certification blockers.

---

## DELIVERABLES

### Remediation Outputs

| File | Generator | Purpose |
|------|-----------|---------|
| final-memorandum-creac.md | apply-creac-headers.py | Script output (intermediate) |
| final-memorandum-v2.md | memo-remediation-writer | Final remediated memorandum |
| remediation-outputs/W1-001-VALIDATE.md | memo-remediation-writer | CREAC enhancement log |
| remediation-outputs/W3-001.md | memo-remediation-writer | Risk table addition |
| remediation-outputs/W4-001.md | memo-remediation-writer | Language neutralization |
| remediation-outputs/W4-002.md | memo-remediation-writer | Precedent citations |
| remediation-outputs/W5-001.md | memo-remediation-writer | TOC formatting |
| remediation-wave-state.json | (orchestrator) | Wave completion tracking |

### Certification Outputs (Post-W6)

| File | Generator | Purpose |
|------|-----------|---------|
| diagnostic-assessment-v2.md | memo-qa-diagnostic | QA Pass 2 results |
| final-qa-certificate.md | memo-qa-certifier | Delivery certification |
| delivery-decision.md | memo-qa-certifier | CERTIFY / CERTIFY_WITH_LIMITATIONS / REJECT |

---

**END OF REMEDIATION PLAN**
