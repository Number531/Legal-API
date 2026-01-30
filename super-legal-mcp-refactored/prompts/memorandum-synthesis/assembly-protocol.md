# WAVE 6 ASSEMBLY PROTOCOL (Agent-Driven)

## TASK: ASSEMBLY-001 (Final Memorandum Integration)

**Context**: Wave 6 final assembly after all W1-W5 remediation tasks complete.
Your job is to merge ALL remediation outputs into final-memorandum-v2.md.

**CRITICAL ARCHITECTURE (2026-01-29)**:
This protocol uses **agent-driven semantic assembly** - the agent reads each remediation
output file, understands its intent, and applies it intelligently. NO regex/sed.

---

## Pre-Assembly Gate Check (MANDATORY)

Before ANY assembly work, verify prerequisites:

1. Read qa-outputs/remediation-wave-state.json
2. Verify wave_status.wave_5.status == "completed"
3. Verify W5-001, W5-002, W5-003 all have validation_result.passed == true
4. If ANY check fails: STATUS = BLOCKED, report to orchestrator

---

## Phase 1: DISCOVER (Build Edit Registry)

Read ALL remediation output files and build an edit registry:

FOR EACH file in remediation-outputs/W*.md:
1. Read file contents
2. Detect operation type:
   - If file contains `## ORIGINAL_START` → REPLACE operation
   - If file only has `## EDITED_START` → INSERT operation
3. Extract metadata:
   - Task ID (from filename)
   - Target section (from file header or ## TARGET section)
   - Insertion point (for INSERT ops) - check multiple formats:
     a. `## TARGET` section (new format)
     b. `## INSERTION INSTRUCTIONS` section with `**Location**:` (existing W2-RISK format)
     c. Inline "Insert this table immediately after..." text
4. Add to edit_registry[]

**NOTE**: Existing W2-RISK files use `## INSERTION INSTRUCTIONS` format with:
- `**Location**: Insert immediately after Section IV.A introduction...`
- `**Context**: ...`
The assembly agent must parse BOTH the new `## TARGET` format AND this existing format.

---

## Phase 2: ANALYZE (Plan Merge Strategy)

### For INSERT Operations (W2-RISK-*, W2-PROV-*, new appendices):

1. Parse insertion instructions (check formats in order):
   a. **New format**: `## TARGET` section with **Section**, **Insertion Point**, **Anchor Text**
   b. **Existing W2-RISK format**: `## INSERTION INSTRUCTIONS` with `**Location**:` field
   c. **Inline format**: "Insert this table immediately after [X], before [Y]"

2. Extract from parsed instructions:
   - **Section**: Target section ID (e.g., "IV.A")
   - **Insertion Point**: Where to insert (e.g., "After introduction, before ### A.")
   - **Anchor Text**: Text to search for as anchor

3. Locate insertion point in final-memorandum.md:
   - Find section header (e.g., `## IV.A.`)
   - Find anchor (e.g., first `### A.` subsection or "### A. Legal Framework")
   - Calculate insertion line (between section header and first subsection)

### For REPLACE Operations (W2-001, W4-*, most W3-*):

1. Parse ORIGINAL_START/END content
2. Search for ORIGINAL content in memorandum using semantic matching:
   - First 100 characters match
   - Section proximity verification
   - Context verification
3. Record match location

---

## Phase 3: APPLY (Execute Merges)

Process edits in strict wave order: W1 → W2 → W3 → W4 → W5

### Merge Order:

**Wave 1**: W1-CREAC-001 through W1-CREAC-006
**Wave 2**: W2-QP-001, W2-QP-002, W2-RISK-001 through W2-RISK-006, W2-PROV-001 through W2-PROV-003
**Wave 3**: W3-TAG-001, W3-PINCITE-001, W3-PAREN-001
**Wave 4**: W4-BRIEF-001, W4-FMT-001, W4-OBJ-001, W4-QUANT-001, W4-XREF-001
**Wave 5**: W5-TOC-001, W5-CITE-001, W5-CITE-002, W5-FOOT-001, W5-SCENARIO-001

### For Each Edit:

1. Read current memorandum content
2. IF operation == "INSERT":
   a. Find section header line
   b. Find anchor line (first ### subsection)
   c. Insert EDITED content between them
   d. Verify content now present
3. IF operation == "REPLACE":
   a. Find ORIGINAL content using semantic search
   b. Replace with EDITED content
   c. Verify replacement succeeded
4. Update edit_registry[task_id].status
5. Write updated memorandum

---

## Phase 4: VALIDATE (Post-Assembly Checks)

### Per-Task Verification:

| Task Pattern | Verification | Expected |
|--------------|--------------|----------|
| W2-RISK-* | grep "\\| Finding \\| Severity \\|" | 6 (one per section) |
| W2-QP-* | grep -cE "Under .* does .* when" | 12 |
| W2-PROV-* | grep "DRAFT CONTRACT PROVISION" | 3 |
| W4-BRIEF-* | grep "Probably.*because" | ≥12 |

### Global Validation:

1. Zero placeholders: grep "[INSERT]" returns 0
2. Word count: wc -w >= 125,000
3. All sections present: grep "^## [IVX]" returns 7+
4. Risk tables: grep "| Finding | Severity |" returns 6

---

## Phase 5: REPORT (Generate Assembly Report)

Save to qa-outputs/assembly-report.md:

```markdown
# ASSEMBLY-001: Final Memorandum Integration Report

## STATUS: [SUCCESS|PARTIAL|BLOCKED]

## Summary
- Total tasks discovered: X
- INSERT operations: X
- REPLACE operations: X
- Successfully merged: X
- Failed to merge: X

## Edit Registry Results
| Task ID | Operation | Target | Status | Verification |
|---------|-----------|--------|--------|--------------|

## Validation Results
- Risk tables: X/6
- Questions format: X/12
- Word count: X
```

---

## Risk Table Insertion Points (W2-RISK-001 through W2-RISK-006)

**VERIFIED against actual final-memorandum-v2.md structure:**

| Task | Section Header (Line) | Anchor (Insert Before) |
|------|----------------------|------------------------|
| W2-RISK-001 | `## IV.A. CASE IDENTIFICATION AND BANKRUPTCY FILING PATTERNS` (L694) | `### A. Legal Framework` (L703) |
| W2-RISK-002 | `## IV.B. ENVIRONMENTAL VIOLATIONS AND EPA COMPLIANCE` (L1327) | `### A. Legal Framework` (L1336) |
| W2-RISK-003 | `## IV.C. Remediation Requirements and Cost Analysis` (L2242) | `### A. Legal Framework` (L2249) |
| W2-RISK-004 | `## IV.D. Intellectual Property Retention in Restructuring` (L3292) | `### A. Legal Framework: Section 365(n)...` (L3294) |
| W2-RISK-005 | `## IV.E. ENVIRONMENTAL OFFSET ANALYSIS...` (L4206) | `### A. Executive Overview: Direct Answer...` (L4215) |
| W2-RISK-006 | `## IV.F. STRATEGIC RECOMMENDATIONS AND DEAL STRUCTURE` (L6454) | `### A. Integrated Findings Summary` (L6463) |

**NOTE**: Sections IV.E and IV.F have different anchor text than IV.A-D. The assembly agent must use the correct anchor for each section.

---

## Failure Handling

### If Task Merge Fails:
1. Log detailed failure reason in edit_registry
2. Attempt semantic fallback (broader search, partial match)
3. If still fails: Mark as NEEDS_MANUAL_REVIEW, continue to next task

### If >3 Tasks Fail:
1. Set STATUS: PARTIAL
2. Set blocking_issue in remediation-wave-state.json
3. Complete successful merges
4. Generate detailed failure report

---

## Key Principle: Agent-Driven, Not Regex

The assembly agent should:
1. **Understand intent** - Know what each edit is trying to accomplish
2. **Verify continuously** - Check each merge succeeded before proceeding
3. **Handle ambiguity** - When uncertain, log for human review rather than guess
4. **Preserve formatting** - Maintain markdown structure, especially tables
5. **Update state** - Write to remediation-wave-state.json after each success

---

## Backward Compatibility (Existing W2-RISK Files)

**CRITICAL**: The existing W2-RISK-001 through W2-RISK-006 files use a DIFFERENT format than the new `## TARGET` format. The assembly agent MUST handle BOTH:

### Existing Format (W2-RISK files):
```markdown
## EDITED_START
[content with inline: "Insert this table immediately after Section IV.A introduction..."]
## EDITED_END

## INSERTION INSTRUCTIONS
**Location**: Insert immediately after Section IV.A introduction (after "## IV.A..." and before "### A. Legal Framework")
**Context**: ...
```

### New Format (future INSERT tasks):
```markdown
## OPERATION: INSERT

## TARGET
- **Section**: IV.A
- **Insertion Point**: After section introduction, before '### A. Legal Framework'
- **Anchor Text**: ## IV.A. BANKRUPTCY

## EDITED_START
[content]
## EDITED_END
```

**Resolution**: The assembly agent parses in priority order:
1. Check for `## TARGET` section (new format)
2. Check for `## INSERTION INSTRUCTIONS` section with `**Location**:` field
3. Check for inline "Insert this table immediately after..." text in EDITED content
4. **PRIMARY FALLBACK**: Use risk table insertion point map (Section above) - this is the most reliable method

**CRITICAL NOTE (2026-01-30 Analysis)**: Of the 6 existing W2-RISK files:
- Only W2-RISK-001 has explicit `## INSERTION INSTRUCTIONS` section
- W2-RISK-002 through W2-RISK-006 embed location contextually or lack explicit instructions
- **The insertion point map is the MOST RELIABLE method for W2-RISK files**
- When processing W2-RISK-*, ALWAYS use the insertion point map as primary lookup

---

## Recovery from Partial Assembly

If ASSEMBLY-001 fails partway through:

1. Check remediation-wave-state.json for assembly_results array
2. Identify which tasks already merged successfully
3. Resume from first un-merged task in manifest order
4. Do NOT re-apply already-merged tasks (would cause duplicates)

```bash
# Verify which tasks already merged
for task in W2-001 W2-002 W2-RISK-001 W3-001 W4-001; do
  if grep -q "$task.*MERGED" remediation-wave-state.json; then
    echo "SKIP: $task already merged"
  else
    echo "MERGE: $task"
  fi
done
```
