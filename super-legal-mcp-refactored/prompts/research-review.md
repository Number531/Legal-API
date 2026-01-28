# ORCHESTRATOR REVIEW PHASE PROTOCOL

> **Implementation:** This protocol is implemented as the `research-review-analyst` subagent in `legalSubagents.js`.
> The orchestrator invokes this subagent in STEP 5 (Quality Assurance Review) after all specialists complete.

## Purpose

This protocol triggers after all specialist subagent reports are complete, but BEFORE final memorandum synthesis. The `research-review-analyst` subagent reviews output quality, identifies gaps, updates the research plan, and spawns additional subagents if needed.

---

## STEP 6: Orchestrator Review Phase (AFTER All Reports Complete)

Before synthesizing the final memorandum, perform quality/structure review:

### 6.1 Report Completeness Check

For each specialist report in the session directory:

| Check | Action |
|-------|--------|
| All assigned tasks addressed | Compare report sections against research-plan.md task list |
| Missing precedents | Flag if key jurisdictions or time periods not covered |
| Incomplete analysis | Flag if conclusions lack supporting authority |
| Gaps requiring additional research | Document specific research needs |

**Verification Command:**
```
Glob: reports/[session-dir]/*.md
```

**Tool Guidance (GREP-FIRST):** For large specialist reports (>20K tokens), use Grep to extract sections rather than Read:
- `Grep("## I. EXECUTIVE SUMMARY", path, -A: 200)` for executive summaries
- `Grep("Cross-Domain Impacts", path, -A: 50)` for cross-domain flags
- See `legalSubagents.js` lines 1514-1556 for complete GREP-FIRST protocol

For each report, verify:
- Executive Summary present with risk ratings
- Key findings have Bluebook citations
- Recommendations are actionable

### 6.2 Citation Analysis

Scan all reports for citation patterns:

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| Unique authorities per report | 30-50 | Normal |
| Duplicate citations across reports | <20% | Consolidate in final memorandum |
| Per-sentence citations | Avoid | Flag for paragraph-level consolidation |

**Citation Efficiency Strategies:**
1. **Consolidate duplicates** - Same case cited in 3+ reports = single footnote with "See also" references
2. **Use Bluebook short forms** - After first full citation: "Id.", "Id. at [page]", "supra note X"
3. **Paragraph-level citations** - One footnote per substantive paragraph, not per sentence
4. **Cross-reference existing** - "See supra note X" instead of creating duplicates

### 6.3 Research Plan Update

After review, append findings to `research-plan.md`:

```markdown
---

## ORCHESTRATOR REVIEW (Post-Subagent)

**Review Date:** [ISO timestamp]
**Reports Analyzed:** [count]
**Total Unique Authorities:** [count across all reports]

### Report Status
| Report | Status | Gaps Identified |
|--------|--------|-----------------|
| securities-analysis.md | Complete | None |
| patent-landscape.md | Complete | Missing PTAB proceedings for 2024 |
| antitrust-analysis.md | Incomplete | No FTC precedent for vertical integration |

### Gaps Requiring Remediation
| Gap | Severity | Remediation |
|-----|----------|-------------|
| Missing PTAB 2024 proceedings | Low | Can proceed, note limitation |
| No FTC vertical integration precedent | High | Spawn antitrust-competition-analyst |
| Incomplete state regulatory analysis | Moderate | Spawn regulatory-rulemaking-analyst |

### Citation Optimization Notes
- Duplicate citations to consolidate: [list authority names]
- Reports with per-sentence citations: [list report names]
- Recommended footnote target for memorandum: [X] (based on unique authorities)

### Additional Subagents Required
- [ ] antitrust-competition-analyst: Research FTC vertical integration enforcement 2020-2025
- [ ] regulatory-rulemaking-analyst: State-level telecommunications regulations for [states]

### Plan Status
| ID | Task | Original Status | Updated Status |
|----|------|-----------------|----------------|
| T1 | Securities research | Complete | Complete |
| T2 | Patent landscape | Complete | Complete (with noted limitation) |
| T3 | Antitrust analysis | Complete | Needs supplemental research |
| T7 | [NEW] FTC vertical integration | - | Pending |
```

### 6.4 Execute Remediation

If gaps identified with severity HIGH or CRITICAL:

1. **Spawn additional subagents** per plan update
   - Include session directory in prompt
   - Reference specific gaps to address

2. **Wait for completion**
   - Verify new reports saved to session directory

3. **Re-run review** (Steps 6.1-6.3)
   - Update research-plan.md with new status

4. **Proceed to synthesis** only when:
   - All HIGH/CRITICAL gaps resolved OR
   - Documented as acceptable limitations

---

## Integration Points

### Continuation Prompt Trigger

The continuation prompt in `claude-sdk-server.js` should check:

```
IF all specialist reports complete (Glob shows expected count)
AND final memorandum NOT started
THEN execute STEP 6 (this protocol)
BEFORE proceeding to memorandum synthesis
```

### Research Plan Coordination

This protocol updates `research-plan.md` with:
- ORCHESTRATOR REVIEW section (appended)
- Task status updates (modified in-place)
- Additional subagent tasks (appended to TASKS table)

### Citation Budget Guidance

Based on citation analysis, provide guidance to memorandum generation:
- If unique authorities > 400: Emphasize consolidation
- If duplicate rate > 30%: Mandatory supra references
- Target footnote range based on actual unique authorities discovered

---

## Quality Gates

| Gate | Criteria | Proceed If |
|------|----------|------------|
| Completeness | All tasks show Complete or Documented Limitation | Yes |
| Citation Efficiency | Duplicate rate < 30% | Yes |
| Gap Severity | No unresolved HIGH/CRITICAL gaps | Yes |
| Plan Updated | ORCHESTRATOR REVIEW section appended | Yes |

**All gates must pass before memorandum synthesis begins.**
