# Reversion to Section Subagents: Modular Architecture with Dual-Review Pipeline

## Problem Statement

The single-pass `memo-generator` architecture (introduced for 70% token reduction) has critical reliability issues:

1. **Context exhaustion**: 85K-word memo + 400 footnotes exceeds practical generation limits
2. **Missing footnotes**: CONSOLIDATED FOOTNOTES section never generated (1,500+ dangling markers)
3. **Factual inconsistencies**: No cross-validation between subagent outputs (3 CBA dates, 110% revenue)
4. **Zero verification tags**: Citation workflow not enforced

**Root cause**: Transition from section-writer subagents to single memo-generator removed the modular generation that worked reliably.

## Solution: Modular Architecture with Dual-Review

Restore section generators + add dual-review validators + use executive summary for synthesis.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ORCHESTRATOR                                    │
│         (controls flow, spawns agents, handles remediation)                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: RESEARCH (Existing - No Changes)                                  │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │securities│ │case-law  │ │employment│ │   tax    │ │regulatory│  ...     │
│  │ analyst  │ │ analyst  │ │ analyst  │ │ analyst  │ │ analyst  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       └─────────────┴───────────┴─────────────┴───────────┘                 │
│                                 ↓                                            │
│                    research-reports/*.md (17 specialists)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: FACT VALIDATION (NEW)                                             │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │                    fact-validator                               │         │
│  │  • Reads ALL research reports                                   │         │
│  │  • Extracts key facts into canonical table                      │         │
│  │  • Detects conflicts (3 CBA dates, 110% revenue, etc.)         │         │
│  │  • Returns: fact-registry.md + conflict-report.md               │         │
│  └────────────────────────────────────────────────────────────────┘         │
│                                 ↓                                            │
│                    ┌─────────────────────────┐                              │
│                    │    CONFLICTS FOUND?     │                              │
│                    └─────────────────────────┘                              │
│                         │              │                                     │
│                        YES             NO                                    │
│                         │              │                                     │
│                         ▼              ▼                                     │
│  ┌─────────────────────────┐    ┌─────────────────────────┐                 │
│  │ ORCHESTRATOR REMEDIATION│    │ Continue to Phase 3     │                 │
│  │ • Spawn targeted research│    │                         │                 │
│  │ • Query source documents │    │                         │                 │
│  │ • Update registry        │    │                         │                 │
│  │ • Re-validate            │    │                         │                 │
│  └───────────┬─────────────┘    └────────────┬────────────┘                 │
│              └───────────────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: SECTION GENERATION (RESTORED)                                     │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ section  │ │ section  │ │ section  │ │ section  │ │ section  │          │
│  │ writer   │ │ writer   │ │ writer   │ │ writer   │ │ writer   │  ...     │
│  │ (CFIUS)  │ │ (Privacy)│ │ (IP)     │ │ (Labor)  │ │ (Tax)    │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │            │            │            │            │                  │
│       │  Each writer:                                                        │
│       │  • Reads 2-3 relevant specialist reports                            │
│       │  • Reads fact-registry.md for canonical values                      │
│       │  • Generates 4,000-6,000 word section                               │
│       │  • Uses LOCAL footnote numbering (1, 2, 3...)                       │
│       │  • Writes NATIVE cross-references (not placeholders)                │
│       │                                                                      │
│       └─────────────┴───────────┴─────────────┴───────────┘                 │
│                                 ↓                                            │
│                    section-reports/*.md (10 sections)                        │
│                    (PRESERVED AS FINAL - no rewriting)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: EXECUTIVE SUMMARY SYNTHESIS (NEW ROLE)                            │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │              executive-summary-writer                           │         │
│  │  • Reads ALL section reports                                    │         │
│  │  • Reads fact-registry.md                                       │         │
│  │  • Generates 8,000-10,000 word executive summary:               │         │
│  │    - Board Briefing (recommendation + rationale)                │         │
│  │    - Critical Issues Matrix (top 20 findings)                   │         │
│  │    - Cross-Domain Impact Analysis (synthesis)                   │         │
│  │    - Negotiation Position Summary                               │         │
│  │  • References sections: "See Labor Analysis §3.2"               │         │
│  │  • Does NOT rewrite section content                             │         │
│  │  • Returns: executive-summary.md                                │         │
│  └────────────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 5: CITATION VALIDATION (NEW)                                         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │                   citation-validator                            │         │
│  │  • Reads ALL section reports                                    │         │
│  │  • Reads executive-summary.md                                   │         │
│  │  • Collects all footnote markers from all documents             │         │
│  │  • Generates CONSOLIDATED footnote definitions                  │         │
│  │  • Renumbers footnotes globally (1, 2, 3... through N)         │         │
│  │  • Adds [VERIFIED:source] tags to each citation                │         │
│  │  • Flags unverifiable citations for orchestrator                │         │
│  │  • Returns: consolidated-footnotes.md + citation-issues.md      │         │
│  └────────────────────────────────────────────────────────────────┘         │
│                                 ↓                                            │
│                    ┌─────────────────────────┐                              │
│                    │  UNVERIFIABLE CITES?    │                              │
│                    └─────────────────────────┘                              │
│                         │              │                                     │
│                        YES             NO                                    │
│                         │              │                                     │
│                         ▼              ▼                                     │
│  ┌─────────────────────────┐    ┌─────────────────────────┐                 │
│  │ ORCHESTRATOR REMEDIATION│    │ Continue to Phase 6     │                 │
│  │ • Spawn research to find│    │                         │                 │
│  │   missing sources       │    │                         │                 │
│  │ • Mark as [ASSUMED] if  │    │                         │                 │
│  │   appropriate           │    │                         │                 │
│  │ • Re-validate           │    │                         │                 │
│  └───────────┬─────────────┘    └────────────┬────────────┘                 │
│              └───────────────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 6: ASSEMBLY & QA                                                      │
│                                                                              │
│  Orchestrator assembles final deliverable:                                   │
│                                                                              │
│  reports/[session]/                                                          │
│  ├── final-memorandum.md (assembled document)                               │
│  │   ├── Title + TOC                                                         │
│  │   ├── Executive Summary (from executive-summary.md)                      │
│  │   ├── Section IV.A-J (from section-reports/*.md - PRESERVED)             │
│  │   ├── Cross-Reference Matrix                                              │
│  │   └── Consolidated Footnotes (from consolidated-footnotes.md)            │
│  │                                                                           │
│  ├── section-reports/           ← PRESERVED for reference                   │
│  │   ├── cfius-analysis.md                                                   │
│  │   ├── privacy-analysis.md                                                 │
│  │   ├── employment-analysis.md                                              │
│  │   └── [other sections...]                                                 │
│  │                                                                           │
│  ├── fact-registry.md           ← Canonical values                          │
│  ├── qa-assessment.md           ← QA evaluator output                       │
│  └── citation-issues.md         ← Any unresolved citations                  │
│                                                                              │
│  Then invoke: memo-qa-evaluator (existing)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## New Subagent Definitions

### 1. fact-validator (NEW)

```javascript
'fact-validator': {
  description: `Post-research fact validation agent.
    Reads ALL research specialist reports.
    Extracts key facts into canonical registry.
    Detects and reports factual conflicts.
    MUST BE USED after all research specialists complete, before section generation.`,

  prompt: `You are a Fact Validation Analyst responsible for ensuring factual consistency across all research outputs.

## YOUR ROLE
After all research specialists complete, you read ALL their reports and:
1. Extract key facts into a canonical fact registry
2. Detect conflicts between reports (different dates, numbers, percentages)
3. Report conflicts to orchestrator for remediation

## FACT REGISTRY OUTPUT FORMAT

Create: ${REPORTS_DIR}/[session]/fact-registry.md

| Fact Category | Canonical Value | Source Report | Line | Confidence |
|---------------|-----------------|---------------|------|------------|
| CBA Expiration | YYYY-MM-DD | [report-name.md] | [line#] | HIGH/MEDIUM |
| Fleet Size | [Number] | [report-name.md] | [line#] | HIGH/MEDIUM |
| Revenue by Segment | [$ with %] | [report-name.md] | [line#] | HIGH/MEDIUM |

## VALIDATION RULES
1. Date Consistency: All references to same event must use same date
2. Percentage Sums: Revenue/market share percentages must sum ≤ 100%
3. Count Consistency: Asset/employee/fleet counts must match across reports
4. Entity Names: Same entity must use consistent naming

## RETURN FORMAT
- STATUS: PASS | CONFLICTS_FOUND
- conflict_count: [N]
- files_created: [fact-registry.md, conflict-report.md]
`,
  tools: STANDARD_TOOLS.withWrite,
  model: 'sonnet',
  thinking: { type: 'disabled' }
}
```

### 2. memo-section-writer (RESTORED)

```javascript
'memo-section-writer': {
  description: `Legal memorandum section writer.
    Invoked by orchestrator with specific section assignment.
    Reads relevant specialist reports + fact-registry.md.
    Writes one complete section with local footnotes.
    MUST BE USED for parallel section generation after fact validation.`,

  prompt: `You are a Legal Memorandum Section Writer producing publication-quality legal analysis.

## YOUR ROLE
You write ONE memorandum section (4,000-6,000 words) based on:
1. Assigned specialist reports (2-3 reports provided by orchestrator)
2. Fact registry (canonical values - USE THESE, not your own research)
3. Section assignment from orchestrator

## CRITICAL RULES
1. Use Fact Registry Values: For dates, counts, percentages - use values from fact-registry.md
2. Local Footnote Numbering: Number 1, 2, 3... within this section (renumbered globally later)
3. Native Cross-References: Write "See Section IV.Y" directly (NO [XREF:...] placeholders)
4. Verification Tags: Every citation must have [VERIFIED:source] or [ASSUMED:industry] tag
5. Complete Section: Do not truncate - write full 4,000-6,000 words

## RETURN FORMAT
- STATUS: COMPLETE | INCOMPLETE
- word_count: [N]
- footnote_count: [N]
- file_path: [path to section file]
`,
  tools: STANDARD_TOOLS.withWrite,
  model: 'sonnet',
  thinking: { type: 'disabled' }
}
```

### 3. executive-summary-writer (ENHANCED ROLE)

```javascript
'executive-summary-writer': {
  description: `Executive summary synthesizer for board-level briefing.
    Reads ALL section reports and fact registry.
    Generates synthesis document that REFERENCES sections (not rewrites them).
    MUST BE USED after all section writers complete.`,

  prompt: `You are an Executive Summary Writer creating board-level synthesis.

## YOUR ROLE
You synthesize all section reports into an executive summary that:
1. Provides board-level recommendation and rationale
2. Highlights critical issues with cross-domain connections
3. REFERENCES sections for detail (does not rewrite them)

## CRITICAL RULES
1. Reference, Don't Rewrite: Point to sections ("See Section IV.F §3.2") instead of copying content
2. Use Fact Registry: All dates/numbers from fact-registry.md
3. Synthesis Focus: Identify cross-domain connections not obvious in individual sections
4. Board Audience: Write for executives, not legal technicians
5. Quantified Impacts: Every issue should have dollar exposure where possible

## RETURN FORMAT
- STATUS: COMPLETE
- word_count: [N]
- file_path: [path to executive-summary.md]
`,
  tools: STANDARD_TOOLS.withWrite,
  model: 'sonnet',
  thinking: { type: 'disabled' }
}
```

### 4. citation-validator (NEW)

```javascript
'citation-validator': {
  description: `Post-generation citation validation and footnote consolidation.
    Reads ALL section reports and executive summary.
    Generates consolidated footnotes with global numbering.
    Adds verification tags to all citations.
    MUST BE USED after executive summary completes.`,

  prompt: `You are a Citation Validator responsible for footnote consolidation and verification.

## YOUR ROLE
After all sections and executive summary are complete:
1. Collect all footnotes from all section reports
2. Renumber globally (1, 2, 3... through N)
3. Add verification tags to each citation
4. Flag unverifiable citations for orchestrator

## VERIFICATION TAG DEFINITIONS
| Tag | Meaning | When to Use |
|-----|---------|-------------|
| [VERIFIED:url] | Confirmed from authoritative database | Direct lookup returned match |
| [VERIFIED:filing] | Confirmed from SEC/court filing | Found in EDGAR, PACER |
| [INFERRED:precedent] | Derived from analogous case | Similar facts applied |
| [ASSUMED:industry] | Based on standard practices | Industry norm, no specific cite |
| [UNVERIFIABLE] | Cannot confirm source | Created for demonstration |

## RETURN FORMAT
- STATUS: PASS | ISSUES_FOUND
- total_footnotes: [N]
- verified_count: [N]
- unverifiable_count: [N]
- files_created: [consolidated-footnotes.md, citation-issues.md]
`,
  tools: STANDARD_TOOLS.withWrite,
  model: 'sonnet',
  thinking: { type: 'disabled' }
}
```

---

## Orchestrator Workflow Updates

Replace STEP 7-12 in orchestrator prompt:

### STEP 7: Fact Validation (NEW - MANDATORY)

After all research specialists complete:

1. Invoke `fact-validator` with:
   - research_reports_path: ${REPORTS_DIR}/[session]/
   - All specialist report filenames

2. Wait for fact-validator to return:
   - If STATUS = PASS → Continue to STEP 8
   - If STATUS = CONFLICTS_FOUND:
     a. Read conflict-report.md
     b. For each conflict, spawn targeted research to resolve
     c. Update fact-registry.md with resolved values
     d. Re-invoke fact-validator to confirm resolution

### STEP 8: Section Generation (RESTORED - PARALLEL)

After fact validation passes:

1. Create sections directory: ${REPORTS_DIR}/[session]/section-reports/

2. Invoke 10 `memo-section-writer` agents IN PARALLEL:

   | Section ID | Section Name | Input Reports |
   |------------|--------------|---------------|
   | IV.A | CFIUS/National Security | cfius-analyst, regulatory-analyst |
   | IV.B | Data Privacy/Cybersecurity | privacy-analyst, cybersecurity-analyst |
   | IV.C | Government Contracts | gov-contracts-analyst |
   | IV.D | Intellectual Property | patent-analyst, case-law-analyst |
   | IV.E | AI/ML Governance | ai-governance-analyst |
   | IV.F | Employment/Labor | employment-labor-analyst |
   | IV.G | Commercial Contracts | commercial-contracts-analyst |
   | IV.H | Antitrust/Competition | antitrust-analyst |
   | IV.I | Tax/Structure | tax-structure-analyst |
   | IV.J | Environmental/Regulatory | environmental-analyst, regulatory-analyst |

3. Each section writer receives:
   - section_id, section_name
   - input_reports: [relevant specialist report paths]
   - fact_registry_path: ${REPORTS_DIR}/[session]/fact-registry.md

4. Wait for all section writers to complete

### STEP 9: Executive Summary Synthesis (ENHANCED)

After all section writers complete:

1. Invoke `executive-summary-writer` with:
   - section_reports_path: ${REPORTS_DIR}/[session]/section-reports/
   - fact_registry_path: ${REPORTS_DIR}/[session]/fact-registry.md

2. Wait for executive summary to complete

### STEP 10: Citation Validation (NEW - MANDATORY)

After executive summary completes:

1. Invoke `citation-validator` with:
   - section_reports_path: ${REPORTS_DIR}/[session]/section-reports/
   - executive_summary_path: ${REPORTS_DIR}/[session]/executive-summary.md

2. Wait for citation-validator to return:
   - If STATUS = PASS → Continue to STEP 11
   - If STATUS = ISSUES_FOUND:
     a. Read citation-issues.md
     b. For significant issues (>5% unverifiable):
        - Spawn targeted research to find sources
        - OR mark as [ASSUMED:industry] if appropriate
     c. Re-invoke citation-validator if sources found

### STEP 11: Final Assembly (Orchestrator Direct)

Assemble final-memorandum.md by reading and concatenating:

1. Title Page & TOC (generate)
2. Executive Summary (from executive-summary.md)
3. Section IV.A-J (from section-reports/*.md in order)
4. Cross-Reference Matrix (from executive summary cross-domain analysis)
5. Consolidated Footnotes (from consolidated-footnotes.md)

Note: Section content is COPIED VERBATIM, not rewritten.

### STEP 12: Quality Assessment (Existing)

Invoke `memo-qa-evaluator` as before.

---

## Files to Modify

| File | Change | Lines |
|------|--------|-------|
| `src/config/legalSubagents.js` | Add `fact-validator` subagent | After line ~4227 |
| `src/config/legalSubagents.js` | Restore `memo-section-writer` (uncomment + update) | Lines 4229-4378 |
| `src/config/legalSubagents.js` | Update `executive-summary-writer` with enhanced role | Lines ~4595+ |
| `src/config/legalSubagents.js` | Add `citation-validator` subagent | After executive-summary-writer |
| `src/config/legalSubagents.js` | Replace STEP 7-10 in orchestrator prompt | Lines ~1366-1456 |
| `src/config/legalSubagents.js` | Deprecate `memo-generator` (keep but don't use) | Lines 4043-4227 |
| `prompts/memorandum.md` | Update architecture description | Lines 1-250 |
| `prompts/memorandum.md` | Update section structure guidance | Throughout |

---

## Implementation Sequence

```
1. Add fact-validator subagent definition
2. Restore memo-section-writer (uncomment, update for fact-registry)
3. Update executive-summary-writer with synthesis role
4. Add citation-validator subagent definition
5. Update orchestrator STEP 7-11 workflow
6. Update memorandum.md architecture description
7. Add subagents to LEGAL_SUBAGENTS export
8. Verify module syntax: node -e "require('./src/config/legalSubagents.js')"
9. Test with sample query
```

---

## Expected Outcomes

| Issue | Current State | After Implementation |
|-------|---------------|---------------------|
| Missing footnotes | 1,500+ dangling markers | All footnotes defined in consolidated-footnotes.md |
| Factual inconsistencies | 3 CBA dates, 110% revenue | Single canonical value from fact-registry.md |
| Zero verification tags | 0/1,500 tagged | 100% tagged with verification status |
| Context exhaustion | 85K-word single-pass fails | 10 parallel 6K-word sections succeed |
| Rewriting overhead | Specialist content rewritten | Section content preserved verbatim |
| Cross-domain synthesis | Embedded in 85K words | Concentrated in 10K-word executive summary |

---

## Token Cost Comparison

| Architecture | Subagent Invocations | Estimated Tokens |
|--------------|---------------------|------------------|
| Old (deprecated multi-stage) | 14-19 | ~944K-1.1M |
| Current (single-pass) | 2-3 | ~270K (but incomplete output) |
| **New (modular + dual-review)** | 15-18 | ~450K-600K |

The new architecture costs more than single-pass but **actually completes the output** with verified citations and consistent facts.

---

## Output Directory Structure

```
reports/[session]/
├── research-reports/
│   ├── securities-researcher-report.md
│   ├── case-law-analyst-report.md
│   └── [other specialist reports...]
├── fact-registry.md                  ← Canonical facts from fact-validator
├── conflict-report.md                ← If conflicts detected
├── section-reports/
│   ├── section-IV-A-cfius.md
│   ├── section-IV-B-privacy.md
│   ├── section-IV-C-govcon.md
│   ├── section-IV-D-ip.md
│   ├── section-IV-E-ai.md
│   ├── section-IV-F-employment.md
│   ├── section-IV-G-commercial.md
│   ├── section-IV-H-antitrust.md
│   ├── section-IV-I-tax.md
│   └── section-IV-J-environmental.md
├── executive-summary.md              ← Board briefing + synthesis
├── consolidated-footnotes.md         ← All citations with verification tags
├── citation-issues.md                ← If unverifiable citations flagged
├── final-memorandum.md               ← Assembled final document
└── qa-assessment.md                  ← QA evaluator output
```

---

## Citation Verification Tags (MANDATORY)

Every citation MUST include a verification tag:

| Tag | Meaning | Example |
|-----|---------|---------|
| `[VERIFIED:url]` | Confirmed from database | `[VERIFIED:Westlaw-2024-WL-123456]` |
| `[VERIFIED:filing]` | Confirmed from SEC/court | `[VERIFIED:EDGAR-CIK-0000973016]` |
| `[INFERRED:precedent]` | Applied from similar case | `[INFERRED:Akorn-v-Fresenius]` |
| `[ASSUMED:industry]` | Industry standard practice | `[ASSUMED:industry-maintenance-reserves]` |

Untagged citations will be flagged by citation-validator for remediation.

---

## Fact Registry Usage (MANDATORY FOR ALL SECTION WRITERS)

All section writers MUST read `fact-registry.md` and use canonical values:

```markdown
## Key Dates (USE THESE VALUES)
| Fact | Canonical Value | Source |
|------|-----------------|--------|
| CBA Expiration | 2026-06-30 | employment-labor-analyst:L47 |
| Contract Term End | 2027-12-31 | commercial-contracts-analyst:L89 |

## Quantitative Facts (USE THESE VALUES)
| Fact | Canonical Value | Source |
|------|-----------------|--------|
| Fleet Size | 515 | securities-researcher:L156 |
| Revenue: United | 44% | securities-researcher:L201 |
| Revenue: Delta | 23% | securities-researcher:L202 |
```

**CRITICAL**: If you find a value in specialist reports that conflicts with fact-registry.md, USE THE FACT REGISTRY VALUE. The fact-validator has already resolved conflicts.
