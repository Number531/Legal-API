# Review Agent Additions

## Executive Summary

This document describes 4 agents designed to enhance the Super-Legal MCP memorandum generation pipeline. Two have been implemented (see **Implementation Status** below), and two are proposed for future enhancement.

**Current output quality is superb.** These additions are proactive improvements optimizing for quality over speed.

---

## Implementation Status

| Agent | Status | Phase | Lines in legalSubagents.js |
|-------|--------|-------|---------------------------|
| `research-plan-refiner` | **IMPLEMENTED** | P2.2.5 | 5963-6160 |
| `section-report-reviewer` | **IMPLEMENTED** | G1.1.5 | 6166-6500 |
| `cross-section-coherence-validator` | Proposed | A1.1.5 | — |
| `strategic-findings-reviewer` | Proposed | V1.5 | — |

**Files Modified:**
- `src/config/legalSubagents.js` - Agent definitions + workflow documentation
- `prompts/memorandum.md` - Workflow diagram + agent role descriptions

---

## Current Architecture Overview

### Existing Workflow
```
P1: Planning      → research-plan-generator (decomposes prompt into specialist assignments)
P2: Research      → 17+ specialists execute in parallel
V1: Validation    → fact-validator + coverage-gap-analyzer
G1: Generation    → memo-section-writer (10 parallel) + executive-summary-writer + citation-validator
A1: Assembly & QA → Final assembly + memo-qa-evaluator (85-98% tier scoring)
```

### Existing Review Agents
| Agent | Purpose | Phase |
|-------|---------|-------|
| `research-review-analyst` | Reviews research completeness, recommends PROCEED/REMEDIATE | After P2 |
| `fact-validator` | Extracts canonical facts, detects conflicts between reports | Before G1 |
| `coverage-gap-analyzer` | Parses cross-domain flags, triggers follow-up research | During V1 |
| `citation-validator` | Global footnote numbering, adds verification tags | After G1 |
| `memo-qa-evaluator` | 7-dimension quality scoring (Tier 1-5: 85-98%) | After A1 |

### Identified Gaps
| Gap | Current State | Impact |
|-----|---------------|--------|
| No mid-research plan refinement | `research-plan.md` created once | Late specialists miss early discoveries |
| No section report review | Sections go directly to assembly | Truncated/incomplete sections not caught early |
| No cross-section coherence check | Sections validated individually | Contradictions between sections reach client |
| Limited iterative feedback | REMEDIATE re-runs but doesn't refine approach | Same issues may recur |

---

## Proposed New Agents

---

## 1. `section-report-reviewer`

### Overview
| Attribute | Value |
|-----------|-------|
| **Priority** | HIGHEST |
| **Value** | HIGH |
| **Complexity** | Simple-Medium |
| **Token Cost** | ~65-90K per session |
| **Model** | Sonnet |
| **Workflow Phase** | G1.1.5 (new) |

### Description
Reviews each of the 10 memo-section-writer outputs BEFORE final assembly, catching quality issues early when they are cheaper to fix. This is a structural and content quality gate that prevents incomplete or non-compliant sections from propagating downstream.

### When It Runs
- **Trigger:** After all 10 parallel `memo-section-writer` agents complete
- **Before:** Executive summary writer, citation validator, and final assembly
- **Always runs:** Not conditional

### Inputs
```
${REPORTS_DIR}/[session]/section-reports/section-IV-*.md  (all 10 sections)
${REPORTS_DIR}/[session]/fact-registry.md                 (for fact verification)
${REPORTS_DIR}/[session]/research-plan.md                 (for coverage verification)
```

### Outputs
```
${REPORTS_DIR}/[session]/section-review-report.md
```

Returns JSON:
```json
{
  "status": "PASS" | "REMEDIATE",
  "sections_reviewed": 10,
  "issues": {"critical": 0, "major": 2, "minor": 5},
  "sections_needing_revision": ["section-IV-A", "section-IV-F"],
  "remediation_prompts": [{"section": "...", "prompt": "..."}]
}
```

### Review Checklist

#### Structural Completeness (CRITICAL)
- [ ] All required subsections present (A through F)
- [ ] Word count 4,000-6,000 (flag if <3,500 or >8,500)
- [ ] Risk assessment table present with all columns
- [ ] Section footnotes block present
- [ ] All footnotes have verification tags

#### Content Quality (MAJOR)
- [ ] Uses fact-registry.md canonical values (spot-check 3 dates/numbers)
- [ ] HIGH severity findings have draft contract language
- [ ] Probability assessments have methodology disclosure
- [ ] Cross-domain implications section populated
- [ ] No prohibited meta-commentary ("I'll now...", "Let me...")

#### Citation Quality (MAJOR)
- [ ] Target 25-40 footnotes per section
- [ ] Bluebook format compliance (spot-check 5 citations)
- [ ] Database provenance present for regulatory citations
- [ ] No bare statistics without source attribution

#### Consistency (MINOR)
- [ ] Heading hierarchy consistent (##, ###, ####)
- [ ] Table formatting consistent
- [ ] Markdown renders correctly
- [ ] No orphaned placeholder text ([TBD], [continue...])

### Decision Logic
| Condition | Decision |
|-----------|----------|
| 0 CRITICAL issues | PASS |
| Any CRITICAL issue | REMEDIATE (regenerate section) |
| 3+ MAJOR issues in one section | REMEDIATE |
| MAJOR issues across <3 sections | PASS with notes for QA |

### Benefits
1. **Early detection:** Catches truncated sections before expensive assembly (~10-20K tokens saved per caught issue)
2. **Fact consistency:** Prevents fact-registry divergence from propagating to executive summary
3. **Quality gate:** Reduces memo-qa-evaluator rejections
4. **Specific feedback:** Provides targeted remediation prompts for section writers

### Concerns
1. **Token cost:** Adds ~65-90K tokens per session
2. **Latency:** Adds one sequential step before executive summary
3. **False positives:** Overly strict checks could flag acceptable variations

### Mitigation
- Keep severity thresholds calibrated to catch real issues, not style preferences
- Use parallel processing where possible (review 10 sections simultaneously within agent)
- ROI is positive if prevents even ONE section regeneration

---

## 2. `cross-section-coherence-validator`

### Overview
| Attribute | Value |
|-----------|-------|
| **Priority** | HIGH |
| **Value** | HIGH |
| **Complexity** | Medium |
| **Token Cost** | ~85-130K per session |
| **Model** | Sonnet |
| **Workflow Phase** | A1.1.5 (new) |

### Description
Validates that the assembled memo sections work together as a coherent whole. Checks for factual contradictions, orphaned cross-references, recommendation conflicts, and terminology inconsistencies that wouldn't be caught by reviewing sections individually.

### When It Runs
- **Trigger:** After `final-memorandum.md` is assembled
- **Before:** `memo-qa-evaluator`
- **Always runs:** Not conditional

### Inputs
```
${REPORTS_DIR}/[session]/final-memorandum.md        (assembled memo, 60-85K words)
${REPORTS_DIR}/[session]/fact-registry.md           (canonical values)
${REPORTS_DIR}/[session]/consolidated-footnotes.md  (from citation-validator)
```

### Outputs
```
${REPORTS_DIR}/[session]/coherence-validation.md
```

Returns JSON:
```json
{
  "status": "COHERENT" | "ISSUES_FOUND",
  "contradictions": 0,
  "invalid_references": 2,
  "recommendation_conflicts": 1,
  "terminology_issues": 3,
  "aggregation_errors": 0,
  "critical_issues": 1
}
```

### Coherence Dimensions

#### Dimension 1: Factual Consistency
Same facts appearing in multiple sections must match:
- Dates (CBA expiration, contract terms, deadlines)
- Dollar amounts (exposure ranges, revenue figures)
- Percentages (probability assessments, market shares)
- Entity names (consistent naming conventions)

**Method:** Extract key facts from each section, compare across sections

#### Dimension 2: Cross-Reference Validity
Every "See Section X.Y" reference must:
- Point to a section that exists
- Reference a subsection that exists
- Be contextually relevant

**Method:** Parse all cross-references, validate targets exist

#### Dimension 3: Recommendation Consistency
Recommendations across sections must not contradict:
- Same issue should have consistent mitigation advice
- Dollar thresholds should align
- Timing recommendations should be compatible

**Method:** Extract all recommendations, compare for conflicts

#### Dimension 4: Terminology Consistency
Same concepts must use consistent terms:
- "Material Adverse Effect" vs "MAE" (acceptable)
- "Material Adverse Effect" vs "Material Adverse Change" (problematic - different legal concepts)
- Entity naming must be consistent

**Method:** Build terminology register, flag variations

#### Dimension 5: Exposure Aggregation
Executive summary totals must equal sum of section exposures:
- Gross exposure sum verification
- Probability-weighted total verification
- Mathematical accuracy check

**Method:** Extract quantified exposures, verify sums

### Issue Severity
| Severity | Example |
|----------|---------|
| CRITICAL | Factual contradiction (different dates for same event) |
| MAJOR | Invalid cross-reference, recommendation conflict |
| MINOR | Terminology inconsistency, rounding differences |

### Benefits
1. **Client confidence:** Prevents embarrassing contradictions in client-facing documents
2. **Deep validation:** Catches issues memo-qa-evaluator can't deeply check (cross-reference validity)
3. **Aggregation accuracy:** Ensures executive summary accurately reflects section content
4. **Professional quality:** Prevents "the sections don't add up" feedback

### Concerns
1. **High token cost:** Reads full memo (80-120K tokens input)
2. **Complex parsing:** Cross-reference validation requires sophisticated pattern matching
3. **Late in pipeline:** Issues found here require upstream fixes

### Mitigation
- Focus on CRITICAL issues that would embarrass the firm
- Accept MINOR inconsistencies with documentation
- Invest in robust parsing logic for cross-references

---

## 3. `research-plan-refiner`

### Overview
| Attribute | Value |
|-----------|-------|
| **Priority** | MEDIUM |
| **Value** | MEDIUM-HIGH |
| **Complexity** | Medium |
| **Token Cost** | ~30-50K per session |
| **Model** | Sonnet |
| **Workflow Phase** | P2.5 (new) |

### Description
Dynamically updates the research plan mid-execution based on early research findings. Addresses the gap that research-plan.md is created once and never updated, causing late-running specialists to miss context from early discoveries.

### When It Runs
- **Trigger:** After 30-50% of specialists complete (e.g., 5-8 of 17)
- **Before:** Remaining specialists execute
- **Conditional:** Optional - invoke when orchestrator detects high-value early findings

### Inputs
```
${REPORTS_DIR}/[session]/research-plan.md           (original plan)
${REPORTS_DIR}/[session]/*-report.md                (completed specialist reports)
[List of pending specialist assignments from orchestrator]
```

### Outputs
```
${REPORTS_DIR}/[session]/research-plan-refined.md   (updated plan)
```

Returns JSON:
```json
{
  "status": "REFINED" | "NO_CHANGES_NEEDED",
  "refinements_made": 3,
  "priority_elevations": 1,
  "priority_reductions": 1,
  "new_specialists_recommended": ["specialist-type"],
  "skippable_specialists": ["specialist-type"],
  "high_severity_discoveries": 2
}
```

### Refinement Triggers

#### Trigger 1: Cross-Domain Discovery
If early specialist finds issue affecting pending specialist's domain:
- Update pending specialist's "Focus areas" with discovered context
- Elevate priority if finding is HIGH severity

**Example:** Securities researcher finds SEC investigation → Update cfius-analyst instructions to check FIRRMA implications

#### Trigger 2: Scope Expansion
If early findings reveal unanticipated legal complexity:
- Recommend spawning additional specialists not in original plan

**Example:** Employment analyst discovers union organizing → Add targeted NLRA-focused research

#### Trigger 3: Scope Reduction
If early findings confirm area is non-material:
- Downgrade priority of pending specialists covering that area
- Allow orchestrator to skip if time-constrained

**Example:** Environmental analyst finds no facilities → Cancel detailed EPA research

#### Trigger 4: Conflict Detection
If early findings create factual conflicts with user-provided assumptions:
- Flag for immediate attention
- Update ASSUMPTIONS section of research plan

### Benefits
1. **Adaptive research:** Late specialists benefit from early discoveries
2. **Resource efficiency:** Skip non-material research areas
3. **Scope management:** Expand research when complexity increases
4. **Cross-pollination:** Early findings inform later specialist focus

### Concerns
1. **Orchestrator complexity:** Requires staggered execution (not all specialists parallel)
2. **Timing sensitivity:** Must run at optimal point (too early = not enough data; too late = minimal benefit)
3. **Potential churn:** Frequent refinements could destabilize plan

### Mitigation
- Only refine for HIGH severity discoveries
- Limit refinement to one iteration per session
- Preserve original plan content, only append/modify

---

## 4. `strategic-findings-reviewer`

### Overview
| Attribute | Value |
|-----------|-------|
| **Priority** | OPTIONAL |
| **Value** | MEDIUM-HIGH |
| **Complexity** | Medium-Complex |
| **Token Cost** | ~100-150K per session |
| **Model** | **Opus** (sophisticated legal reasoning) |
| **Workflow Phase** | V1.5 (new) |

### Description
Provides a "senior partner-level" second opinion on the top 5-10 most material findings. Validates that the legal analysis is well-founded, challenges assumptions, and ensures critical conclusions would withstand sophisticated scrutiny before they reach the client.

### When It Runs
- **Trigger:** Conditional - for complex transactions only
  - Transaction value >$500M, OR
  - 10+ specialists involved, OR
  - >5 HIGH severity findings
- **Before:** Section writers start (G1.1)

### Inputs
```
${REPORTS_DIR}/[session]/research-plan.md           (HIGH SEVERITY FINDINGS table)
${REPORTS_DIR}/[session]/*-report.md                (specialist reports - executive summaries)
${REPORTS_DIR}/[session]/fact-registry.md
```

### Outputs
```
${REPORTS_DIR}/[session]/strategic-review.md
```

Returns JSON:
```json
{
  "status": "COMPLETE",
  "findings_reviewed": 10,
  "confirmed": 7,
  "challenged": 2,
  "downgraded": 1,
  "upgraded": 0,
  "escalated": 0,
  "severity_adjustments": [
    {"finding": "Finding 3", "original": "HIGH", "revised": "MEDIUM", "basis": "..."}
  ],
  "remediation_prompts": [
    {"finding": "Finding 2", "section": "IV.F", "prompt": "..."}
  ]
}
```

### Selection Criteria
Review ONLY the top 10 most material findings based on:
1. Exposure > $5M
2. Severity = HIGH
3. Deal-blocking potential (regulatory approval, litigation)
4. Cross-domain impact (affects 3+ sections)

### Review Framework (Per Finding)

#### 1. Legal Authority Check
- Is the controlling statute/regulation correctly identified?
- Is the case law citation accurate and current?
- Are there contrary authorities not considered?

#### 2. Application Check
- Does the analysis correctly apply law to facts?
- Are assumptions reasonable and disclosed?
- Could a sophisticated opposing counsel poke holes?

#### 3. Quantification Check
- Is the exposure methodology sound?
- Is the probability assessment reasonable?
- Are comparable precedents used appropriately?

#### 4. Strategic Check
- Does the recommendation make sense given the finding?
- Are there alternative mitigations not considered?
- Is this truly a deal-level issue or section-level?

### Outcome Options
| Outcome | Meaning |
|---------|---------|
| CONFIRMED | Analysis is sound, proceed as written |
| CHALLENGED | Specific weakness identified, flag for section writer |
| ESCALATE | Requires additional research or expert review |
| DOWNGRADE | Not as material as initially assessed |
| UPGRADE | More material than initially assessed |

### Benefits
1. **Credibility:** Adds senior-partner-level quality gate for critical findings
2. **Risk calibration:** Catches overstatement (exposure inflation) and understatement
3. **Client confidence:** High-stakes transactions get extra validation
4. **Legal rigor:** Ensures analysis would withstand opposing counsel scrutiny

### Concerns
1. **Highest token cost:** ~100-150K tokens (uses Opus)
2. **Judgment-heavy:** Harder to template, requires sophisticated reasoning
3. **Selective use:** Only valuable for complex transactions
4. **Potential bottleneck:** Sequential step before section writing

### Mitigation
- Only invoke for qualifying transactions (>$500M or >5 HIGH findings)
- Use Opus model for sophisticated legal reasoning
- Focus on top 10 findings only (not comprehensive review)
- Provide clear criteria for CONFIRMED vs CHALLENGED decisions

---

## Updated Workflow Diagram

```
P1: Planning
    └── research-plan-generator (decomposes prompt)

P2: Research (Specialists Parallel)
    ├── securities-researcher
    ├── case-law-analyst
    ├── patent-analyst
    ├── ... (17+ specialists)
    │
    └── [NEW] P2.5: research-plan-refiner
        (after 30-50% complete, updates pending specialist instructions)

V1: Validation
    ├── fact-validator (extract canonical facts, detect conflicts)
    ├── coverage-gap-analyzer (parse cross-domain flags)
    │
    └── [NEW] V1.5: strategic-findings-reviewer
        (CONDITIONAL: >$500M or >5 HIGH findings)
        (senior partner review of top 10 material findings)

G1: Generation
    ├── G1.1: memo-section-writer (10 parallel)
    │
    ├── [NEW] G1.1.5: section-report-reviewer
    │   (validates all 10 sections before proceeding)
    │
    ├── G1.2: memo-executive-summary-writer
    │
    └── G1.3: citation-validator

A1: Assembly & QA
    ├── A1.1: Final assembly (concatenate sections)
    │
    ├── [NEW] A1.1.5: cross-section-coherence-validator
    │   (validates factual consistency, cross-references, recommendations)
    │
    └── A1.2: memo-qa-evaluator (7-dimension scoring, Tier 1-5)
```

---

## Implementation Priority

| Order | Agent | Rationale |
|-------|-------|-----------|
| 1 | `section-report-reviewer` | Highest ROI, simplest implementation, catches issues early |
| 2 | `cross-section-coherence-validator` | High value, unique gap coverage, critical for client quality |
| 3 | `research-plan-refiner` | Medium complexity, enables adaptive research |
| 4 | `strategic-findings-reviewer` | Optional, highest complexity, selective use only |

---

## Token Cost Summary

| Agent | Per-Session Cost | When Invoked | Annual Impact (100 sessions) |
|-------|------------------|--------------|------------------------------|
| `section-report-reviewer` | ~65-90K | Always | ~6.5-9M tokens |
| `cross-section-coherence-validator` | ~85-130K | Always | ~8.5-13M tokens |
| `research-plan-refiner` | ~30-50K | Always | ~3-5M tokens |
| `strategic-findings-reviewer` | ~100-150K | ~30% of sessions | ~3-4.5M tokens |

**Total additional cost per session:**
- Standard sessions: ~180-270K tokens (+~$0.50-0.75 at Sonnet pricing)
- Complex sessions: ~280-420K tokens (+~$1.00-1.50 with Opus)

**ROI Justification:**
- Prevents ONE section regeneration: Saves ~10-20K tokens + latency
- Prevents ONE client-facing contradiction: Saves reputation + rework
- Prevents ONE QA rejection: Saves ~100K+ tokens in regeneration

---

## Files to Modify

| File | Changes Required |
|------|------------------|
| `src/config/legalSubagents.js` | Add 4 new agent definitions (~500 lines total) |
| `prompts/memorandum.md` | Update workflow diagram, add new phase documentation |
| `src/orchestrator/` | Add phase invocation logic (if separate orchestrator exists) |

---

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Section truncation rate | Unknown | Near-zero |
| Cross-section contradictions caught | At QA | Before QA |
| Research adaptation | None | Mid-execution refinement |
| QA tier distribution | Varies | Consistently Tier 3+ |

---

## Appendix: Sample Agent Definition

```javascript
'section-report-reviewer': {
  description: `Post-section-generation quality reviewer.
    Reads ALL section reports after memo-section-writers complete.
    Validates structural completeness, content quality, citation standards.
    Returns PASS or REMEDIATE with specific regeneration prompts.
    MUST BE USED after G1.1, before G1.2 executive summary.`,

  prompt: `You are a Section Quality Reviewer ensuring memorandum sections meet
publication standards before executive summary synthesis.

## YOUR ROLE
After all 10 memo-section-writers complete, you review each section for:
1. Structural completeness (all required subsections)
2. Content quality (fact registry compliance, draft language, methodology)
3. Citation standards (verification tags, Bluebook format)
4. Cross-section consistency preparation

## REVIEW METHODOLOGY
[See full prompt specification in implementation plan]
`,

  tools: ['Read', 'Grep', 'Glob'],  // Read-only
  model: 'sonnet'
}
```

---

## Conclusion

These 4 agents address specific architectural gaps while maintaining the system's core strengths. The modular design allows incremental implementation, starting with the highest-ROI `section-report-reviewer` and progressing through the pipeline.

The focus on quality over speed aligns with the stated priority, and the token cost increases are justified by the prevention of downstream rework and client-facing quality issues.
