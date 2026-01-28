# Legal AI Research Platform — QA Evaluation Framework

## Overview

The `memo-qa-evaluator` subagent provides Managing Partner-level quality assessment for final memoranda. It runs as STEP 13 in the memorandum generation workflow, after structural verification, and produces a separate `qa-assessment.md` file without modifying the original memorandum.

---

## Quality Tier Framework (85-98%)

### TIER 1: 85-88% (Competent Associate Draft)
- Correct legal framework identification
- Relevant statutes and regulations cited
- Basic risk categories identified
- Some quantification attempted
- **Gap**: Missing cross-references, shallow precedent, generic recommendations

### TIER 2: 88-92% (Strong Associate Work Product)
- Sophisticated legal analysis (circuit splits, defense availability)
- Real database provenance (verifiable facility IDs, docket numbers)
- Cross-reference architecture (findings connect across sections)
- Quantified exposure with methodology
- Current case law (within 18 months)
- **Gap**: No precedent transaction benchmarks, no draft contract language

### TIER 3: 92-95% (Senior Associate / Junior Partner Quality)
- Precedent transaction analysis ("what's market?" with data)
- Draft contract language provided
- Economic scenario modeling (probability distributions)
- Counter-party response anticipation
- Board-ready presentation structure
- **Gap**: Missing client calibration, institutional knowledge

### TIER 4: 95-98% (Partner-Ready with Firm Integration)
- Client risk appetite calibration
- Institutional precedent (prior firm representations)
- Negotiation strategy with counter-party counsel analysis
- Confidence scoring with assumption sensitivity
- **Requires**: Firm proprietary data integration

### TIER 5: 98-100% (Irreducible Human Judgment)
- Relationship context, board dynamics, strategic intuition
- Cannot be automated

---

## Evaluation Criteria (7 Dimensions)

### 1. BLUF Quality (Bottom Line Up Front)
| Requirement | Test |
|-------------|------|
| Clear recommendation (PROCEED / CONDITIONAL / DO NOT PROCEED) | Can board member understand in 60 seconds? |
| Quantified aggregate exposure range | |
| Key conditions listed | |
| Risk summary table present | |

### 2. Legal Sophistication
| Requirement | Test |
|-------------|------|
| Correct controlling statutes | Would this survive partner Socratic questioning? |
| Current case law with accurate holdings | |
| Circuit splits or jurisdictional variations noted | |
| Defenses and exceptions analyzed | |
| Timing requirements identified | |

### 3. Database Provenance (CRITICAL DIFFERENTIATOR)
| Requirement | Test |
|-------------|------|
| Specific facility/entity IDs cited (EPA ECHO, SEC CIK, USPTO) | Can I verify independently in 30 seconds? |
| Live links to verifiable public records | |
| Proxy data limitations acknowledged | |

### 4. Quantification Methodology
| Requirement | Test |
|-------------|------|
| Exposure ranges with basis (comparable consent decrees) | Would CFO accept "where did these numbers come from?" |
| Probability assessments with methodology | |
| Aggregate calculations shown | |
| Assumption sensitivity acknowledged | |

### 5. Cross-Reference Architecture
| Requirement | Test |
|-------------|------|
| Findings traced to multiple implications | Does changing one finding ripple coherently? |
| Inter-section references explicit | |
| Document operates as integrated analysis | |

### 6. Actionable Recommendations
| Requirement | Test |
|-------------|------|
| Specific actions with owners and timelines | Can deal team execute Monday morning? |
| Prioritization (immediate / short-term / pre-closing) | |
| Cost estimates for recommended actions | |

### 7. Limitations Transparency
| Requirement | Test |
|-------------|------|
| What could not be verified stated | Am I protected if this is wrong? |
| Proxy data disclosed | |
| Assumptions listed | |

---

## Red Flags (Automatic Deductions)

### Hallucination Indicators (-10% immediately)
- Case citations that don't exist
- Facility IDs that don't resolve
- Statistics without source
- Holdings that misstate the case

### Structural Failures (-5%)
- No BLUF / buried recommendation
- Sections that don't connect
- Recommendations without quantification
- Missing risk summary table

### Legal Errors (-5% per error)
- Wrong statute cited
- Misapplication of legal standard
- Missing controlling precedent

### Formatting Issues (-2%)
- Markdown artifacts
- Inconsistent heading hierarchy
- Broken tables

---

## QA Workflow

```
1. Initial Scan (structure check)
   ├── Executive summary with recommendation?
   ├── Risk summary table present?
   ├── All 10 sections + executive summary present?
   └── Footnotes section complete?

2. Database Provenance Spot-Check (verify 5-10 references)
   ├── EPA ECHO facility IDs → do they reference real facilities?
   ├── SEC CIK numbers → correct companies?
   ├── Patent numbers → correct USPTO records?
   └── Case citations → real cases with correct holdings?

3. Cross-Reference Validation
   ├── Are [XREF] placeholders resolved?
   ├── Do inter-section references make sense?
   └── Is Cross-Reference Matrix complete?

4. Quantification Review
   ├── Do exposure ranges have disclosed methodology?
   ├── Are probabilities reasonable?
   └── Do calculations add up?

5. Recommendation Review
   ├── Specific (not generic)?
   ├── Has owners and timelines?
   └── Has cost estimates?

6. Calculate Score & Map to Tier
```

---

## Output Format

The QA evaluator produces `qa-assessment.md` with this structure:

```markdown
# QUALITY ASSESSMENT

**Overall Score**: [X]% — [Tier Name]

**Tier Justification**: [2-3 sentences explaining tier placement]

---

## Strengths (What Would Impress Partners)

1. **[Strength Title]**: [Specific example from document with location]
2. **[Strength Title]**: [Specific example with location]
3. **[Strength Title]**: [Specific example with location]

---

## Issues Requiring Attention

| Issue | Severity | Location | Impact |
|-------|----------|----------|--------|
| [Issue description] | Critical/Major/Minor | [Section/Line] | [What it affects] |

---

## Demo-Ready Checklist

- [ ] Verifiable database provenance present
- [ ] BLUF would survive board presentation
- [ ] Legal analysis would survive partner review
- [ ] Recommendations are actionable
- [ ] Limitations appropriately disclosed

**Demo Recommendation**: [READY / READY WITH CAVEATS / NEEDS REVISION]

---

## Path to Next Tier

To move from [X]% to [X+5]%:

1. **[Specific enhancement]**: [What to add/change]
2. **[Specific enhancement]**: [What to add/change]
3. **[Specific enhancement]**: [What to add/change]

---

## Killer Demo Moments

1. **[Moment Title]**: [Specific element that would impress skeptical partners]
2. **[Moment Title]**: [Another impressive element]

---

## Objection Handling

**Anticipated objection**: "[Likely partner pushback]"
**Response**: "[How to address using document evidence]"
```

---

## Integration Point

**Position in Workflow**: STEP 13 (after STEP 12 structural verification)

```
STEP 11: Assemble final-memorandum.md
    ↓
STEP 12: Structural Verification (file counts, line counts)
    ↓
STEP 13: Quality Assessment (content-level QA)
    ↓
    memo-qa-evaluator reads final-memorandum.md
    ↓
    Produces: reports/[session]/qa-assessment.md
    ↓
Return to user with memo + QA score
```

---

## User-Facing Output

After memorandum generation, users see:

```
✅ MEMORANDUM COMPLETE

📄 Final Document: reports/[session]/final-memorandum.md
📊 Quality Score: 91% (Tier 2 - Strong Associate Work Product)
🎯 Demo Status: READY WITH CAVEATS

**Strengths**:
1. EPA ECHO facility IDs verifiable (click-through tested)
2. HHI calculations shown with methodology
3. Cross-reference architecture connects environmental to MAE

**Issues** (2 Minor):
1. Section 4 (IP) missing patent validity probability
2. Executive summary BLUF could be more concise

Full assessment: reports/[session]/qa-assessment.md
```

---

## Design Principles

### Non-Disruptive Integration
- QA runs AFTER memorandum is complete — no interference with generation
- Produces SEPARATE file (`qa-assessment.md`) — no memo modification
- Score/tier returned with memo — user sees quality alongside output
- Optional iteration — user can request refinement based on QA findings

### Practitioner Standards
Evaluates whether memorandum would survive scrutiny from:
- A Wachtell/Cravath/S&C partner reviewing associate work
- A sophisticated board reviewing acquisition recommendations
- Opposing counsel looking for weaknesses
- Regulators assessing adequacy of due diligence

### Model Selection
Uses **Opus** model for nuanced quality assessment requiring sophisticated judgment.

---

## Session Directory Structure

```
reports/[YYYY-MM-DD]-[timestamp]/
├── research-plan.md
├── [specialist reports].md
├── financial-impact-analysis.md    ← From STEP 6.5 (if findings > $1M)
├── sections/
│   ├── section-01-cfius.md
│   ├── section-02-privacy.md
│   ├── ...
│   └── executive-summary.md
├── cross-references.md
├── final-memorandum.md
└── qa-assessment.md                 ← From STEP 13
```

---

## Implementation Reference

**Subagent**: `memo-qa-evaluator`
**Location**: `src/config/legalSubagents.js` (line ~3450)
**STEP 13 Protocol**: `src/config/legalSubagents.js` (line ~1086)

---

*Last Updated: December 23, 2025*
