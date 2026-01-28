# COMPLETION REQUIREMENTS

## Section Writer Completion Mandate

### PROHIBITED BEHAVIORS:
- DO NOT say "I've reached my practical limit"
- DO NOT truncate mid-section
- DO NOT omit the footnotes block
- DO NOT skip the risk assessment table
- DO NOT create multiple files for one section

### REQUIRED BEHAVIOR:
- Generate COMPLETE section (4,000-6,000 words)
- Include ALL subsections (A through F)
- Include risk assessment table with quantified exposure
- Include ALL footnotes with verification tags
- Use Edit tool to append if approaching output limits

---

## FORBIDDEN OUTPUT FILES (NEVER CREATE)

These file patterns indicate documentation-over-execution failure:

| Forbidden Pattern | Why It's Wrong | Correct Action |
|-------------------|----------------|----------------|
| `*-integrated.md` | Intermediate working file | Append directly to final-memorandum.md |
| `*-pending.md` | Deferred execution | Execute immediately |
| `*-status.json` | Progress tracking (except designated state files) | Update only authorized state file |
| `*-progress.md` | Documentation of intent | Execute the work instead |
| `ASSEMBLY_*.txt` | Instructions for human | Execute commands directly |
| `SYNTHESIS_*.md` | Status reports | Update state file only |
| `assemble-*.sh` | Scripts for later execution | Execute Bash commands now |
| `*-working.md` | Temporary files | Use final output path |
| `*-complete.md` variants | Multiple outputs | Use single final-memorandum.md |

### Self-Check Before Creating Any File

Before using Write tool, verify:
1. Is this file in the forbidden list? → STOP, use different approach
2. Is this a deliverable or intermediate? → If intermediate, don't create it
3. Would Bash append accomplish the same thing? → If yes, use Bash

**If you find yourself creating a forbidden file, STOP and reconsider your approach.**

---

## Final Output Completion Requirements (ABSOLUTE MANDATE)

**KEEP GENERATING UNTIL THE DOCUMENT IS COMPLETE.**

A truncated memorandum is an incomplete work product. Continue until done.

### Completion Checklist

For Section Writers:
- [ ] All 6 subsections (A-F) present
- [ ] Word count >= 4,000
- [ ] Risk assessment table complete
- [ ] All footnotes have verification tags
- [ ] No placeholder text

For memo-final-synthesis:
- [ ] Executive summary included
- [ ] All assigned sections assembled
- [ ] Appendix B (Consolidated Footnotes) present
- [ ] Document footer "END OF MEMORANDUM" present
- [ ] synthesis-state.json updated

---

## VERIFICATION CHECKLIST (MANDATORY BEFORE CLAIMING COMPLETE)

### For Section Writers (memo-section-writer)

Before returning status `COMPLETE`:
```bash
# ALL checks must pass
FILE_EXISTS=$(test -f section-IV-{X}.md && echo "PASS" || echo "FAIL")
WORD_COUNT=$(wc -w < section-IV-{X}.md)
SUBSECTION_COUNT=$(grep -c "^### [A-F]\." section-IV-{X}.md || echo "0")
HAS_FOOTNOTES=$(grep -q "## F. Section Footnotes" section-IV-{X}.md && echo "PASS" || echo "FAIL")

# Thresholds
# WORD_COUNT >= 4000
# SUBSECTION_COUNT >= 6
# HAS_FOOTNOTES = PASS
```

### For Final Synthesis (memo-final-synthesis)

Before returning status `COMPLETE`:
```bash
FILE_EXISTS=$(test -f final-memorandum.md && echo "PASS" || echo "FAIL")
WORD_COUNT=$(wc -w < final-memorandum.md)
SECTION_COUNT=$(grep -c "^## IV\." final-memorandum.md || echo "0")
HAS_EXEC_SUMMARY=$(grep -q "## I. EXECUTIVE SUMMARY" final-memorandum.md && echo "PASS" || echo "FAIL")
HAS_FOOTER=$(grep -q "END OF MEMORANDUM" final-memorandum.md && echo "PASS" || echo "FAIL")

# Thresholds
# WORD_COUNT >= 50000 (minimum), 55000-80000 (target)
# SECTION_COUNT >= 10
# HAS_EXEC_SUMMARY = PASS
# HAS_FOOTER = PASS
```

### Content Quality Gates (MANDATORY)

Structure verification is necessary but NOT sufficient. Also check content quality:

#### For Section Writers (memo-section-writer)

```bash
# CONTENT QUALITY CHECKS (all must pass)
# 1. CREAC structure present
HAS_CONCLUSION=$(grep -qi "conclusion\|likely\|probably\|will\|must" section-IV-{X}.md && echo "PASS" || echo "FAIL")
HAS_RULE=$(grep -c "U\.S\.C\.\|C\.F\.R\.\|U\.S\. [0-9]" section-IV-{X}.md)
HAS_APPLICATION=$(grep -qi "here,\|in this case\|the transaction\|target" section-IV-{X}.md && echo "PASS" || echo "FAIL")
HAS_COUNTER=$(grep -qi "however\|but see\|target may argue\|alternatively" section-IV-{X}.md && echo "PASS" || echo "FAIL")

# 2. Risk quantification present
RISK_TABLE_ROWS=$(grep -c "| HIGH\|| MEDIUM\|| LOW" section-IV-{X}.md || echo "0")
HAS_DOLLAR_AMOUNTS=$(grep -c "\$[0-9]" section-IV-{X}.md)
HAS_PERCENTAGES=$(grep -c "[0-9]%" section-IV-{X}.md)

# 3. Citation quality
CITATIONS_WITH_TAGS=$(grep -c "\[VERIFIED\|\[INFERRED\|\[ASSUMED\|\[UNVERIFIED" section-IV-{X}.md || echo "0")
CITATIONS_TOTAL=$(grep -c "^[0-9]\+\." section-IV-{X}.md || echo "0")

# Thresholds
# HAS_COUNTER = PASS (counter-analysis required for objectivity)
# RISK_TABLE_ROWS >= 3 (minimum risk items)
# HAS_DOLLAR_AMOUNTS >= 2 (quantified exposure required)
# CITATIONS_WITH_TAGS / CITATIONS_TOTAL >= 0.9 (90% tagged)
```

#### For Final Synthesis (memo-final-synthesis)

```bash
# CONTENT QUALITY CHECKS
# 1. Executive summary integration
EXEC_SUMMARY_WORDS=$(grep -A200 "## I. EXECUTIVE" final-memorandum.md | wc -w)
HAS_RECOMMENDATION=$(grep -qi "PROCEED\|CAUTION\|DEFER\|DO NOT" final-memorandum.md && echo "PASS" || echo "FAIL")

# 2. Cross-references resolved
UNRESOLVED_XREFS=$(grep -c "\[XREF\|\[TBD\|See Section \[" final-memorandum.md || echo "0")

# 3. Footnotes consolidated
TOTAL_FOOTNOTES=$(grep -c "^\[[0-9]\+\]" final-memorandum.md || echo "0")
FOOTNOTES_WITH_TAGS=$(grep -c "\[VERIFIED\|\[INFERRED\|\[ASSUMED" final-memorandum.md || echo "0")

# 4. Deal-blocking warnings documented
WARNINGS_PRESENT=$(grep -qi "DEAL-BLOCKING\|CRITICAL WARNING\|TIMELINE INFEASIBLE" final-memorandum.md && echo "PRESENT" || echo "ABSENT")

# Thresholds
# EXEC_SUMMARY_WORDS >= 2000 (meaningful summary)
# HAS_RECOMMENDATION = PASS (decision guidance required)
# UNRESOLVED_XREFS = 0 (no placeholders)
# TOTAL_FOOTNOTES >= 200 (comprehensive citations)
# If deal has warnings: WARNINGS_PRESENT = PRESENT
```

### Quality Gate Decision Matrix

| Check Category | Pass Threshold | Fail Action |
|----------------|----------------|-------------|
| Structure (word count, sections) | All checks pass | Return INCOMPLETE |
| Content Quality (CREAC, quantification) | 80%+ checks pass | Return INCOMPLETE with deficiencies |
| Citation Quality | 90%+ tagged | Return INCOMPLETE, flag for citation-validator |
| Cross-references | 0 unresolved | Return INCOMPLETE, list unresolved |
| Deal-blocking warnings | All documented | Return INCOMPLETE, list missing warnings |

### Cross-Reference Validation Protocol

#### During Final Synthesis (memo-final-synthesis)

**Step 1: Build Section Index**
```bash
# Extract all section headers from final-memorandum.md
grep "^## IV\." final-memorandum.md | sed 's/## //' > /tmp/section-index.txt
# Example output:
# IV.A. CFIUS and National Security
# IV.B. Privacy and Data Protection
# ...
```

**Step 2: Extract All Cross-References**
```bash
# Find all "See Section IV-X" patterns
grep -oE "See Section IV[-.]?[A-Z]" final-memorandum.md | sort | uniq > /tmp/xrefs.txt
```

**Step 3: Validate Each Reference**
```bash
for ref in $(cat /tmp/xrefs.txt); do
  section=$(echo $ref | grep -oE "IV[-.]?[A-Z]")
  if ! grep -q "$section" /tmp/section-index.txt; then
    echo "INVALID: $ref points to non-existent section"
  fi
done
```

**Step 4: Handle Invalid References**
| Scenario | Action |
|----------|--------|
| Reference to non-existent section | Replace with domain reference or remove |
| Reference to wrong section number | Correct to actual section containing topic |
| Paragraph reference (§2.1) invalid | Remove paragraph reference, keep section |

#### Ownership: Who Fixes Cross-References?

| Agent | Responsibility |
|-------|----------------|
| memo-section-writer | Use domain references for unknown sections |
| memo-final-synthesis | Convert domain refs to section numbers, validate |
| citation-validator | Flag remaining [XREF] placeholders as HARD_FAIL |
| memo-qa-diagnostic | Score cross-reference quality (dimension #5) |

#### QA Validation Enhancement

Current check (insufficient):
```bash
UNRESOLVED_XREFS=$(grep -c "\[XREF\|\[TBD\|See Section \[" final-memorandum.md)
```

Enhanced check (validates existence):
```bash
# Check for placeholders (existing)
PLACEHOLDERS=$(grep -c "\[XREF\|\[TBD\|See Section \[" final-memorandum.md || echo "0")

# Check for invalid section references (NEW)
INVALID_REFS=0
for ref in $(grep -oE "See Section IV[-.]?[A-Z]" final-memorandum.md | sort | uniq); do
  section=$(echo $ref | grep -oE "IV[-.]?[A-Z]")
  if ! grep -q "^## $section" final-memorandum.md; then
    INVALID_REFS=$((INVALID_REFS + 1))
  fi
done

# Both must be 0 for PASS
if [ "$PLACEHOLDERS" -gt 0 ] || [ "$INVALID_REFS" -gt 0 ]; then
  echo "FAIL: $PLACEHOLDERS placeholders, $INVALID_REFS invalid refs"
fi
```

### Verification Failure Protocol

If ANY check fails:
1. DO NOT return `COMPLETE`
2. Return `INCOMPLETE` with specific failures:
   ```json
   {
     "status": "INCOMPLETE",
     "verification_failures": [
       {"check": "WORD_COUNT", "expected": ">=50000", "actual": 35000},
       {"check": "SECTION_COUNT", "expected": ">=10", "actual": 7},
       {"check": "CONTENT_QUALITY", "expected": "counter-analysis present", "actual": "missing in IV-C, IV-F"},
       {"check": "CITATION_TAGS", "expected": ">=90%", "actual": "78% (156/200)"}
     ],
     "next_action": "Add counter-analysis to IV-C and IV-F, tag remaining citations"
   }
   ```
3. If blocking issue prevents completion: Return `BLOCKED` with specific blocker
4. **Content quality failures**: Prioritize CREAC structure and counter-analysis gaps

---

## Mandatory Deliverables (NEVER SKIP)

These components MUST be generated regardless of document length:

| Component | Phase | Agent | Skip Allowed? |
|-----------|-------|-------|---------------|
| Executive Summary | G3 | memo-executive-summary-writer | **NEVER** |
| All Section Reports | G1.1-G1.10 | memo-section-writer | **NEVER** |
| Consolidated Footnotes | G4 | citation-validator | **NEVER** |
| Final Memorandum | A1 | memo-final-synthesis | **NEVER** |
| QA Assessment | A2 | memo-qa-diagnostic | **NEVER** |

### PROHIBITED THINKING PATTERNS:
- "Skip Phase X because limits exceeded" - **WRONG**
- "Omit executive summary to save words" - **WRONG**
- "Move to completion without [mandatory phase]" - **WRONG**
- "Document is too long, skip remaining deliverables" - **WRONG**

### CORRECT APPROACH:
1. Generate ALL mandatory deliverables at full quality
2. Exceeding word/footnote targets is ACCEPTABLE
3. Completeness takes priority over arbitrary limits
4. Never sacrifice required deliverables for targets

---

## Output Targets (GUIDELINES, NOT HARD LIMITS)

| Target | Value | Flexibility |
|--------|-------|-------------|
| Footnotes | ~400 | Exceeding acceptable if content requires |
| Total words | ~100,000 | Exceeding acceptable for thoroughness |
| Section length | 4,000-6,000 | Complex sections may exceed |
| Exec summary | 2,500-3,500 | 5,000 max with justification |

**COMPLETENESS > arbitrary limits**

---

## Token Limits (January 2026)

| Limit | Value | Impact |
|-------|-------|--------|
| **Output tokens** | 64,000 | Maximum tokens per response |
| **Read tool** | 25,000 | Files >100KB cannot be loaded into Edit context |
| **Context window** | 1,000,000 | With `context-1m-2025-08-07` beta header |

**Workaround for large files (>25K tokens):**

**For READING large files (extraction):**
1. Use `Grep("## SECTION_NAME", path, -A: 200)` - extract specific sections
2. Use `Read(path, offset: X, limit: Y)` - read specific line ranges

**For WRITING to large files (assembly) - USE BASH:**
1. Use `Bash: cat source.md >> final-memorandum.md` - append sections directly
2. Use `Bash: wc -w final-memorandum.md` - verify after each append
3. Do NOT use Edit tool when file exceeds 100KB

**CRITICAL:** Grep/Read are for extraction. Bash cat >> is for assembly. These are different operations with different tool choices.

---

## Progressive Save Pattern

To prevent loss from truncation:

1. After each major section:
   - Use Edit tool to append to existing file
   - Update synthesis-state.json with progress

2. synthesis-state.json format (v2.2 - Anthropic Best Practices Aligned):

> **Canonical Reference:** For ALL state file schemas in the system, see [state-file-schemas.md](state-file-schemas.md).

Based on Anthropic "Effective harnesses for long-running agents" (Nov 2025).

```json
{
  "schema_version": "3.0",
  "agent_type": "memo-final-synthesis",
  "session_id": "[YYYY-MM-DD]-[timestamp]",
  "status": "in_progress",

  "compaction_summary": {
    "task": "Synthesize M&A memorandum for [Target]",
    "progress": "45,000/70,000 words, 5/10 sections",
    "next_action": "Generate Section IV-C",
    "critical_context": ["Key finding 1", "Key finding 2"]
  },

  "environment_checks": {
    "on_resume": [
      "Read synthesis-state.json",
      "Verify final-memorandum.md exists",
      "Grep section count",
      "Check for broken state before continuing"
    ],
    "last_verified": "[ISO timestamp]",
    "environment_healthy": true
  },

  "blocking_issue": {
    "type": "FILE_SIZE_LIMIT | TOOL_ERROR | MISSING_INPUT | null",
    "file": "final-memorandum.md",
    "size_bytes": 242285,
    "size_tokens_estimated": 60572,
    "sdk_limit_tokens": 25000,
    "description": "Agent SDK Read tool cannot load file before Edit operation due to 25k token limit",
    "resolution_status": "UNRESOLVED_BLOCKING | null",
    "resolution_method": "Must use Bash cat >> to append directly to final-memorandum.md - NO separate pending files",
    "sections_appended_via_bash": [],
    "verification_command": "wc -w final-memorandum.md && grep -c '## IV\\.' final-memorandum.md"
  },

  "input_files_verified": {
    "fact_registry": true,
    "risk_summary": true,
    "executive_summary": true,
    "consolidated_footnotes": true,
    "section_reports": 10,
    "missing_files": []
  },

  "verification_status": {
    "word_count_check": { "target": 55000, "actual": 45000, "passed": false },
    "placeholder_check": { "target": 0, "actual": 0, "passed": true },
    "cross_ref_check": { "target": 20, "actual": 12, "passed": false },
    "sections_check": { "target": 10, "actual": 5, "passed": false }
  },

  "sections_complete": ["IV-A", "IV-B"],
  "sections_pending": ["IV-C", "IV-D"],
  "current_section": "IV-C",
  "last_checkpoint": "[ISO timestamp]",

  "section_summary": {
    "IV-A_corporate_structure": {
      "aggregate_exposure": "$45M expected value",
      "key_findings": ["Finding 1 summary", "Finding 2 summary"],
      "critical_recommendations": ["Recommendation 1", "Recommendation 2"],
      "cross_domain_impacts": ["Links to Section IV-B", "Affects covenant calculations"],
      "confidence": "HIGH (8/10)"
    }
  },

  "decisions_made": [
    {"decision": "Used Bash append for large file", "reason": "118KB exceeded 25K Read limit", "timestamp": "[ISO]"}
  ],

  "metrics": {
    "word_count": 45000,
    "footnote_count": 187,
    "output_token_limit": 64000,
    "read_tool_token_limit": 25000
  },

  "recovery_instructions": {
    "on_compaction": "Read this file. Run environment_checks.on_resume. Use compaction_summary.next_action",
    "do_not_repeat": ["IV-A", "IV-B"]
  }
}
```

3. On resume (compaction recovery):
   - Read synthesis-state.json FIRST
   - Run `environment_checks.on_resume` steps to verify state
   - Check `compaction_summary.next_action` for immediate guidance
   - Verify `do_not_repeat` sections to avoid duplication
   - Check `verification_status` to see what quality gates remain
   - Continue from last incomplete section
   - Append to existing final-memorandum.md

---

## STATE FILE WRITE ORDER (CRITICAL)

### Write-Before-Return Protocol

When completing work, agents MUST follow this exact sequence:

1. **WRITE** all output files (section content, analysis, etc.)
2. **WRITE** state file with `status: "COMPLETE"`
3. **VERIFY** state file was written (Read it back)
4. **THEN** return status to orchestrator

### Incorrect (Race Condition)
```
return { status: "COMPLETE" }  // Orchestrator sees this
// State file write happens after return (or never)
```

### Correct (Write-First)
```
Write state file: { status: "COMPLETE", timestamp: "..." }
Read state file to verify
return { status: "COMPLETE" }  // Orchestrator sees this AFTER state is persisted
```

### Why This Matters
- Context compaction may occur immediately after agent returns
- Orchestrator loses in-memory status but can read state files
- If state file wasn't written, orchestrator thinks phase is incomplete
- Results in re-invocation loop

### Verification Step (MANDATORY)

After writing state file, ALWAYS verify:
```bash
# Verify state file exists and has correct status
grep -q '"status": "COMPLETE"' {state-file}.json && echo "VERIFIED" || echo "FAILED"
```

If verification fails, re-write state file before returning.

---

## Return Status Codes

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `COMPLETE` | Document fully generated | Proceed to QA |
| `INCOMPLETE` | Truncation detected | Orchestrator triggers continuation |
| `MISSING_COMPONENTS` | Input files not found | Return to previous phase |
