# WAVE 6 ASSEMBLY PROTOCOL

## TASK: ASSEMBLY-001 (Final Memorandum Integration)

**Context**: Wave 6 final assembly after all W2-W5 remediation tasks complete.
Your job is to merge ALL remediation outputs into final-memorandum-v2.md.

**CRITICAL**: This is the most failure-prone task in the remediation pipeline.
The 2026-01-25 session failed at 86% due to ASSEMBLY-001 pattern-matching failures.
Follow this protocol EXACTLY to prevent similar failures.

---

## Pre-Assembly Gate Check (MANDATORY)

Before ANY assembly work, verify prerequisites:

```bash
# 1. Verify Wave 5 complete
grep "wave_5.*completed" qa-outputs/remediation-wave-state.json

# 2. Verify all W5 tasks passed
for task in W5-001 W5-002 W5-003; do
  grep "$task.*passed.*true" qa-outputs/remediation-wave-state.json || echo "BLOCKED: $task not verified"
done

# 3. If blocked, DO NOT PROCEED - report to orchestrator
```

---

## Step 1: Build Task Manifest

Read remediation-dispatch.md and extract ALL task IDs:

```bash
# Extract task IDs from remediation-dispatch.md
grep -E "^\| W[0-9]+-" qa-outputs/remediation-dispatch.md | awk -F'|' '{print $2}' | tr -d ' ' > /tmp/task-manifest.txt

# Expected format: W2-001, W2-002, W3-001-VALIDATE, W3-PROV-IV-A, W4-001, W4-002, W5-001, W5-002, W5-003
```

---

## Step 2: Verify All Input Files Exist

```bash
# Check each task has output file
for task_id in $(cat /tmp/task-manifest.txt); do
  output_file="remediation-outputs/${task_id}*.md"
  if ! ls $output_file 2>/dev/null; then
    echo "MISSING: $task_id"
  fi
done

# If ANY file missing: STATUS = BLOCKED, report missing files
```

---

## Step 3: Validate Output File Format

Each remediation output MUST contain EDITED_START/EDITED_END markers:

```bash
for file in remediation-outputs/W*.md; do
  if ! grep -q "EDITED_START" "$file"; then
    echo "MALFORMED: $file missing EDITED_START marker"
  fi
  if ! grep -q "EDITED_END" "$file"; then
    echo "MALFORMED: $file missing EDITED_END marker"
  fi
done
```

If malformed files found: Report in output, attempt fallback extraction.

---

## Step 4: Extract EDITED Content from Each Task

For each remediation output file:

```bash
# Extract content between EDITED_START and EDITED_END
sed -n '/^## EDITED_START$/,/^## EDITED_END$/p' remediation-outputs/W2-001*.md | sed '1d;$d' > /tmp/W2-001-content.md
```

**Fallback if markers not found:**
1. Look for alternate markers (EDITED_START/END without ##)
2. Look for code blocks containing edited content
3. Extract first substantial markdown section after "CHANGE_SUMMARY"

---

## Step 5: Apply Edits in Merge Order

**MERGE ORDER** (CRITICAL - process in this exact sequence):
1. W2-* (Content additions - Questions Presented, Brief Answers)
2. W3-* (CREAC, provisions, counter-analysis)
3. W4-* (Language/format fixes - objectivity, questions format)
4. W5-* (Citation cleanup, appendices)

For each task, use chunked processing:

```bash
# 1. Extract target section from memorandum
TARGET_SECTION="III"  # Example for Brief Answers
sed -n '/^## $TARGET_SECTION\./,/^## [IVX]/p' final-memorandum.md > /tmp/section.md

# 2. Apply the edit (pattern matching)
# Use grep to find the ORIGINAL content location
# Use sed to replace with EDITED content

# 3. Merge back into memorandum
# Use Python script for >500KB files
```

---

## Step 6: Per-Task Verification (MANDATORY)

After EACH task merge, verify success:

| Task | Verification Command | Expected |
|------|----------------------|----------|
| W2-001 | `grep -c "^## III.*BRIEF" final-memorandum-v2.md` | >= 1 |
| W2-002 | `grep -c "Probably.*because" final-memorandum-v2.md` | >= 12 |
| W4-002 | `grep -c "Under.*Does.*When" final-memorandum-v2.md` | 12 |
| W5-003 | `grep -c "APPENDIX C" final-memorandum-v2.md` | 1 |

**If verification fails:**
1. Log: `"task_id": "<id>", "status": "NOT_MERGED", "reason": "<why>"`
2. Attempt flexible pattern matching (partial match, fuzzy match)
3. If still fails: Continue to next task, mark as NEEDS_MANUAL_REVIEW

---

## Step 7: Final Validation

```bash
# 1. Zero placeholders remaining
grep -c "\[Omitted long context line\]" final-memorandum-v2.md  # MUST be 0
grep -c "\[INSERT" final-memorandum-v2.md                        # MUST be 0

# 2. Word count check
wc -w < final-memorandum-v2.md  # MUST be >= 125,000

# 3. Section integrity
for section in I II III IV V VI VII; do
  grep -c "^## $section\." final-memorandum-v2.md
done
```

---

## Step 8: Generate Assembly Report

**Output** (save to `remediation-outputs/ASSEMBLY-001-report.md`):

```markdown
# ASSEMBLY-001: Final Memorandum Integration Report

## STATUS: SUCCESS | PARTIAL | BLOCKED

## Summary
- Total tasks in manifest: X
- Tasks successfully merged: X
- Tasks failed to merge: X
- Tasks skipped (no output file): X

## Assembly Results

| Task ID | Status | Verification | Notes |
|---------|--------|--------------|-------|
| W2-001  | MERGED | PASS         |       |
| W4-002  | NOT_MERGED | FAIL    | Pattern not found |

## Validation Results
- Placeholders remaining: 0 (checkmark)
- Word count: 132,456 (checkmark)
- All sections present: Yes (checkmark)

## Files Created
- final-memorandum-v2.md (XXX KB)
- ASSEMBLY-001-report.md

## Blocking Issues
[List any issues that prevented full assembly]

## Manual Review Required
[List tasks that need human intervention]
```

---

## Failure Handling

**If >2 tasks fail to merge:**
1. Set STATUS: PARTIAL
2. Create final-memorandum-v2.md with successful merges
3. Document ALL failures in assembly report
4. Set blocking_issue in remediation-wave-state.json:
   ```json
   {
     "blocking_issue": {
       "type": "ASSEMBLY_FAILURE",
       "task_id": "ASSEMBLY-001",
       "description": "X tasks failed to merge",
       "resolution_method": "MANUAL_REVIEW_REQUIRED",
       "failed_tasks": ["W4-002", "W2-001"]
     }
   }
   ```

---

## Pattern Matching Fallbacks

When exact matching fails, try these fallbacks in order:

1. **Exact match fails**: Try removing leading/trailing whitespace
2. **Section not found**: Try case-insensitive match
3. **Placeholders mismatch**: Count actual vs expected placeholders
4. **Large block fails**: Split into smaller chunks and merge iteratively

---

## Known Failure Modes (2026-01-25 Session)

| Failure | Root Cause | Prevention |
|---------|------------|------------|
| Missing task handler | W4-002 had no handler | Build manifest from remediation-dispatch.md (not hardcoded) |
| Pattern mismatch | W2-001 expected placeholders, found content | Verify each task merged before proceeding |
| Silent failures | Warnings instead of blocking errors | Block on >2 merge failures |

---

## Recovery from Partial Assembly

If ASSEMBLY-001 fails partway through:

1. Check remediation-wave-state.json for assembly_results array
2. Identify which tasks already merged successfully
3. Resume from first un-merged task in manifest order
4. Do NOT re-apply already-merged tasks (would cause duplicates)

```bash
# Verify which tasks already merged
for task in W2-001 W2-002 W3-001 W4-001; do
  if grep -q "$task.*MERGED" remediation-wave-state.json; then
    echo "SKIP: $task already merged"
  else
    echo "MERGE: $task"
  fi
done
```
