# Coverage Gap Analyzer

## Overview

The Coverage Gap Analyzer is a post-research validation subagent that ensures comprehensive cross-domain coverage in legal memoranda. It identifies unresearched interdisciplinary implications and triggers targeted follow-up research.

---

## Problem Addressed

Legal research often involves interconnected domains where findings in one area have implications for others:

| Example Finding | Cross-Domain Implication | Risk if Unaddressed |
|-----------------|-------------------------|---------------------|
| SEC investigation pending | May trigger CFIUS mandatory filing | National security review missed |
| CBA expires June 2026 | Strike risk during regulatory approval period | Timeline risk underestimated |
| Market concentration >40% | FTC enhanced scrutiny likely | Antitrust conditions missed |

Without systematic gap detection, these cross-domain implications may be flagged by one specialist but never researched by another.

---

## Architecture Position

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: RESEARCH                                              │
│  17 Domain Specialists → research-reports/*.md                  │
│  Each includes "Cross-Domain Impacts" section                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: FACT VALIDATION                                       │
│  fact-validator → fact-registry.md, conflict-report.md          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2a: COVERAGE GAP ANALYSIS ← YOU ARE HERE                 │
│                                                                  │
│  coverage-gap-analyzer reads ALL reports                         │
│  Extracts cross-domain implications                              │
│  Identifies unresearched implications → coverage-gaps.md         │
│                                                                  │
│  If GAPS_FOUND:                                                  │
│    → Spawn targeted follow-up research                           │
│    → Re-run validators                                           │
│    → Max 2 iterations                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: SECTION GENERATION                                    │
│  10 memo-section-writers (parallel)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Subagent Definition

```javascript
'coverage-gap-analyzer': {
  description: `Post-research coverage validation.
    Reads ALL research specialist reports.
    Extracts cross-domain implications flagged by each specialist.
    Identifies implications NOT researched by another specialist.
    Returns research gap list with targeted prompts for follow-up.
    MUST BE USED after fact-validator, before section generation.`,

  prompt: `You are a Coverage Gap Analyst ensuring comprehensive cross-domain research in legal due diligence.

## YOUR ROLE

After all research specialists complete their initial research, you:
1. Read ALL research specialist reports
2. Extract every "Cross-Domain Impact" flagged by each specialist
3. Verify whether each flagged impact was actually researched by the target specialist
4. Generate targeted research prompts for any gaps identified
5. Report gaps to orchestrator for follow-up research

## INPUT

You will receive paths to all research reports in the session directory:
- securities-researcher-report.md
- case-law-analyst-report.md
- employment-labor-analyst-report.md
- [etc.]

## EXTRACTION PROCESS

### Step 1: Parse Cross-Domain Flags

For each research report, locate the "Cross-Domain Impacts" or "Cross-Domain Implications" section.

Extract each flag in this format:
SOURCE: [specialist-type]
FINDING: [the finding that creates implications]
IMPLICATION: [what needs to be researched in another domain]
TARGET DOMAIN: [which domain should research this]
TARGET SPECIALIST: [which specialist type handles this domain]

### Step 2: Verify Coverage

For each extracted implication:

1. **Check if target specialist was invoked**
   - Was [target-specialist]-report.md created in this session?
   - If NO → GAP: Target specialist not invoked

2. **Check if implication was addressed**
   - Search target specialist's report for keywords from the implication
   - If implication topic not found → GAP: Implication not researched
   - If found but superficial → GAP: Implication needs deeper research

3. **Classify gap severity**
   - HIGH: Deal-blocking implication not researched
   - MEDIUM: Material risk implication needs deeper coverage
   - LOW: Minor implication may benefit from additional context
`,

  tools: ['Read', 'Write', 'Glob', 'Grep'],
  model: 'sonnet',
  thinking: { type: 'disabled' }
}
```

---

## Output Format

Create file: `coverage-gaps.md` in session directory

```markdown
# COVERAGE GAP ANALYSIS

**Session:** [session-directory]
**Analysis Date:** [ISO timestamp]
**Reports Analyzed:** [count]
**Cross-Domain Flags Extracted:** [count]

---

## STATUS: COMPREHENSIVE | GAPS_FOUND

---

## Cross-Domain Implications Matrix

| # | Source Specialist | Finding | Implication | Target Domain | Target Specialist | Status |
|---|-------------------|---------|-------------|---------------|-------------------|--------|
| 1 | securities-researcher | SEC investigation pending | May trigger CFIUS | CFIUS/Nat'l Security | cfius-analyst | NOT RESEARCHED |
| 2 | employment-analyst | CBA expires June 2026 | Strike affects approval | Regulatory | regulatory-analyst | PARTIAL |
| 3 | antitrust-analyst | >40% market share | Enhanced FTC scrutiny | FTC | regulatory-analyst | FULLY COVERED |

---

## Research Gaps Identified

### GAP 1: [Title]
**Severity:** HIGH | MEDIUM | LOW
**Source:** [specialist-type] report, Section [X.X]
**Original Finding:**
> "[Exact quote from source report]"

**Cross-Domain Implication:**
[Description of what needs to be researched]

**Target Specialist:** [specialist-type]
**Current Status:** NOT INVOKED | NOT ADDRESSED | PARTIAL COVERAGE

**Recommended Follow-Up Research:**
```
SPECIALIST: [specialist-type]
TARGETED PROMPT:
"Research [specific question]. Focus on:
1. [Specific angle 1]
2. [Specific angle 2]
3. Cite applicable regulations: [specific CFR/USC references if known]

Context from prior research: [key facts from source report]"
```

---

## Follow-Up Research Priority Queue

| Priority | Gap # | Gap Title | Target Specialist | Estimated Impact |
|----------|-------|-----------|-------------------|------------------|
| 1 | GAP 1 | CFIUS-SEC nexus | cfius-analyst | Deal-blocking if positive |
| 2 | GAP 2 | Regulatory-CBA interaction | regulatory-analyst | Timeline risk adjustment |

---

## Specialists Requiring Re-Invocation

| Specialist | New Targeted Prompt | Reason |
|------------|---------------------|--------|
| cfius-analyst | [Prompt text] | SEC investigation CFIUS implications |
| regulatory-analyst | [Prompt text] | CBA timeline impact on approvals |

---

## Summary Statistics

- Total cross-domain implications extracted: [N]
- Fully covered: [N] ([X]%)
- Partially covered: [N] ([X]%)
- Not researched: [N] ([X]%)

**Recommendation:** [PROCEED | TRIGGER FOLLOW-UP RESEARCH]
```

---

## Return Format

Return structured response to orchestrator:

```json
{
  "status": "COMPREHENSIVE" | "GAPS_FOUND",
  "gap_count": N,
  "high_priority_gaps": N,
  "medium_priority_gaps": N,
  "low_priority_gaps": N,
  "files_created": ["coverage-gaps.md"],
  "follow_up_required": [
    {
      "specialist": "cfius-analyst",
      "prompt": "Research whether SEC investigations...",
      "priority": "HIGH"
    }
  ]
}
```

---

## Orchestrator Integration

### STEP 7a: Coverage Gap Analysis

Insert after STEP 7 (Fact Validation) in orchestrator workflow:

```markdown
**STEP 7a: Coverage Gap Analysis (MANDATORY)**

After fact-validator passes:

1. **Invoke coverage-gap-analyzer**
   Provide:
   - Path to session directory
   - List of all research report filenames
   - Original user query (for context)

2. **Process Results**

   IF status = "COMPREHENSIVE":
   - Log: "All cross-domain implications have been researched"
   - Proceed to STEP 8 (Section Generation)

   IF status = "GAPS_FOUND":
   - Read coverage-gaps.md
   - Count high_priority_gaps

   IF high_priority_gaps > 0:
   - For each HIGH priority gap in follow_up_required:
     a. Extract targeted prompt
     b. Spawn specialist with targeted prompt
     c. Specialist writes supplemental report: [specialist]-supplemental-[N].md
   - After all follow-up research completes:
     a. Re-run fact-validator (include supplemental reports)
     b. Re-run coverage-gap-analyzer
   - Increment iteration counter

   IF iteration_count >= 2:
   - Log warning: "Maximum research iterations reached"
   - Add to final memorandum: "Note: Limited research available on [gap topics]. Further analysis recommended."
   - Proceed to STEP 8

3. **Continue to Section Generation**
   - All research reports (original + supplemental) available for section writers
   - coverage-gaps.md available for executive summary synthesis
```

---

## Specialist Prompt Enhancement

Add to ALL research specialist prompts:

```markdown
## CROSS-DOMAIN IMPACT FLAGGING (MANDATORY)

At the end of your report, include this section:

### Cross-Domain Implications Requiring Further Research

For each finding that may affect another legal domain, flag explicitly:

| Finding | Cross-Domain Implication | Target Domain | Specific Research Question |
|---------|-------------------------|---------------|---------------------------|
| [Your specific finding] | [How it affects other domain] | [Domain name] | [Question for target specialist] |

**Examples:**

| Finding | Cross-Domain Implication | Target Domain | Specific Research Question |
|---------|-------------------------|---------------|---------------------------|
| SEC investigation into data practices pending | May trigger CFIUS mandatory filing if national security data involved | CFIUS/National Security | Does SEC investigation into data practices trigger 31 CFR 800.401 mandatory filing? |
| CBA expires June 30, 2026 | Strike risk during expected 120-day regulatory approval period | Regulatory Timing | How does potential labor disruption affect state ABC license transfer timelines? |
| Target has 44% market share in regional beer distribution | FTC enhanced merger scrutiny likely | Antitrust/FTC | What additional conditions has FTC imposed on beverage M&A with >40% concentration? |

**If no cross-domain implications identified:**
State: "No cross-domain implications identified in this research scope."

**Flagging Standards:**
- Flag implications that could materially affect transaction risk assessment
- Flag implications that require expertise outside your domain
- Include specific research questions to guide the target specialist
- Reference the specific finding in your report that creates the implication
```

---

## Output Files

| File | Purpose | Created By |
|------|---------|------------|
| `coverage-gaps.md` | Gap analysis report | coverage-gap-analyzer |
| `[specialist]-supplemental-[N].md` | Follow-up research | Targeted specialist re-invocation |
| `fact-registry.md` (updated) | Includes supplemental research facts | fact-validator (re-run) |

---

## Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cross-domain flag extraction rate | 100% | All flags in all reports extracted |
| Gap detection accuracy | >95% | Gaps correctly identified as unresearched |
| Follow-up research relevance | >90% | Targeted prompts produce useful research |
| Iteration efficiency | ≤2 | Gaps filled within 2 iterations |

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| No cross-domain flags in any report | Status: COMPREHENSIVE (no gaps by definition) |
| Target specialist report missing | Gap: NOT INVOKED, high priority |
| Circular implications (A flags B, B flags A) | Detect and report; do not create infinite loop |
| Max iterations reached with gaps remaining | Proceed with warning in final memorandum |
| Specialist supplemental fails | Log error, mark gap as unfilled, continue |

---

## Example Session Flow

```
Initial Research:
├── securities-researcher-report.md
│   └── Flags: "SEC investigation → CFIUS implications"
├── employment-labor-analyst-report.md
│   └── Flags: "CBA expires → Regulatory timeline impact"
└── cfius-analyst-report.md
    └── (Did not address SEC investigation angle)

Coverage Gap Analysis (Iteration 1):
├── Extracts 2 cross-domain flags
├── Checks cfius-analyst report → SEC angle NOT ADDRESSED
├── Checks regulatory-analyst report → CBA timing PARTIALLY ADDRESSED
├── Status: GAPS_FOUND
└── Generates targeted prompts for follow-up

Follow-Up Research:
├── cfius-analyst invoked with: "Research SEC investigation CFIUS trigger..."
│   └── Creates: cfius-analyst-supplemental-1.md
└── regulatory-analyst invoked with: "Research CBA timing impact..."
    └── Creates: regulatory-analyst-supplemental-1.md

Fact Validation (Re-run):
└── Includes supplemental reports in fact-registry.md

Coverage Gap Analysis (Iteration 2):
├── Re-checks all flags
├── SEC-CFIUS: NOW FULLY COVERED
├── CBA-Regulatory: NOW FULLY COVERED
├── Status: COMPREHENSIVE
└── Proceed to section generation
```

---

## Integration Checklist

- [ ] Add coverage-gap-analyzer to LEGAL_SUBAGENTS in legalSubagents.js
- [ ] Add STEP 7a to orchestrator workflow
- [ ] Update all 17 specialist prompts with cross-domain flagging template
- [ ] Add iteration counter and max limit (2) to orchestrator
- [ ] Add supplemental report handling to section writers (read original + supplemental)
- [ ] Update memorandum.md with gap analysis documentation
- [ ] Add error handling for failed supplemental research
- [ ] Verify module syntax after changes
