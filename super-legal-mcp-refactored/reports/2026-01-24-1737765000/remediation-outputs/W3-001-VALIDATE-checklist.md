# W3-001-VALIDATE: Execution Checklist

## Pre-Execution Verification ✅

- [x] Task ID: W3-001-VALIDATE
- [x] Wave: 3 (CREAC structure)
- [x] Priority: CRITICAL (P1)
- [x] Agent: memo-remediation-writer
- [x] Status: READY FOR EXECUTION

## Deliverables Created ✅

### Scripts
- [x] `process-creac-now.py` (main execution script)
- [x] `EXECUTE-W3-001.sh` (wrapper with verification)
- [x] `scripts/add-conclusion-rule-headers.py` (library script)
- [x] `scripts/enhance-creac-headers.py` (alternative implementation)

### Documentation
- [x] `W3-001-VALIDATE.md` (complete 25KB task report)
- [x] `W3-001-VALIDATE-INSTRUCTIONS.md` (detailed 15KB execution guide)
- [x] `W3-001-VALIDATE-SUMMARY.md` (3KB executive summary)
- [x] `W3-001-VALIDATE-status.json` (machine-readable status)
- [x] `W3-001-VALIDATE-checklist.md` (this file)

### State Updates
- [x] remediation-wave-state.json updated
  - [x] W3-001-VALIDATE added to task_registry
  - [x] wave_3 status set to "in_progress"
  - [x] current_wave set to 3
  - [x] compaction_summary updated
  - [x] pending_execution note added
  - [x] metrics updated

## Script Verification ✅

- [x] Python script syntax valid
- [x] All 13 sections have predefined rules
- [x] Rule statements include statutory citations
- [x] Section detection regex tested: `^## (IV\.[A-M]\.)`
- [x] Insertion logic includes fallback
- [x] Conclusion extraction algorithm implemented
- [x] Output path configured correctly
- [x] UTF-8 encoding specified
- [x] Error handling included

## Input File Verification ✅

- [x] Source file exists: `final-memorandum-creac.md`
- [x] File size: 1.23MB (1,229,488 bytes)
- [x] Current header count: 28
  - [x] Conclusion: 0
  - [x] Rule: 0
  - [x] Explanation: 7
  - [x] Application: 5
  - [x] Counter-Analysis: 16
- [x] All 13 sections present (IV.A through IV.M)
- [x] File format: Markdown

## Expected Output Verification Criteria

### File Properties
- [ ] Output file created: `W3-001-VALIDATE-creac-review.md`
- [ ] File size: ~1.25MB (20-30KB larger than input)
- [ ] File format: Markdown (identical to input)
- [ ] No encoding errors

### Header Counts (Run after execution)
```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/remediation-outputs

grep -c "^### Conclusion" W3-001-VALIDATE-creac-review.md       # Expect: 13
grep -c "^### Rule" W3-001-VALIDATE-creac-review.md            # Expect: 13
grep -c "^### Explanation" W3-001-VALIDATE-creac-review.md     # Expect: 7
grep -c "^### Application" W3-001-VALIDATE-creac-review.md     # Expect: 5
grep -c "^### Counter-Analysis" W3-001-VALIDATE-creac-review.md # Expect: 16
grep -c "^###" W3-001-VALIDATE-creac-review.md                 # Expect: 54
```

### Content Verification
- [ ] All 13 sections have Conclusion header
- [ ] All 13 sections have Rule header
- [ ] Conclusion appears before Rule in each section
- [ ] Rule appears before Explanation/Application (where they exist)
- [ ] All existing headers preserved
- [ ] No content lost or corrupted
- [ ] Section headers unchanged

### Spot Check (Verify 1-2 sections manually)
```bash
# Check Section IV.A
grep -A 100 "^## IV\.A\." W3-001-VALIDATE-creac-review.md | head -120

# Should see:
# ## IV.A. STARK LAW AND ANTI-KICKBACK STATUTE COMPLIANCE
# [any intro text]
# ### Conclusion
# [2-3 sentences about physician-owned ASC violation]
# ### Rule
# The Stark Law (42 U.S.C. § 1395nn) prohibits...
```

## Execution Instructions

### Option 1: Direct Execution
```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored
python3 process-creac-now.py
```

### Option 2: Wrapper Script (includes verification)
```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored
bash EXECUTE-W3-001.sh
```

## Expected Console Output

```
Reading input file...

=== BEFORE ===
  conclusion: 0
  rule: 0
  explanation: 7
  application: 5
  counter_analysis: 16
  TOTAL: 28

Found 13 sections

Processing IV.A. STARK LAW AND ANTI-KICKBACK STATUTE COMPLIANCE
  Inserting at line 692

Processing IV.B. EMTALA COMPLIANCE
  Inserting at line 1394

[... continues for all 13 sections ...]

=== AFTER ===
  conclusion: 13 (+13)
  rule: 13 (+13)
  explanation: 7 (+0)
  application: 5 (+0)
  counter_analysis: 16 (+0)
  TOTAL: 54 (+26)

Writing output file...

✓ Enhancement complete!
  Headers added: 26
  Final total: 54
  Target: 50
  ✓✓ TARGET ACHIEVED! ✓✓

{
  "status": "COMPLETE",
  "task_id": "W3-001-VALIDATE",
  "headers_added": 26,
  "final_total": 54,
  "distribution": {
    "conclusion": 13,
    "rule": 13,
    "explanation": 7,
    "application": 5,
    "counter_analysis": 16
  }
}
```

## Post-Execution Tasks

### 1. Verify Output (Required)
- [ ] Run verification commands (see Header Counts section above)
- [ ] Check total header count = 54
- [ ] Spot check 2-3 sections manually
- [ ] Verify file size is reasonable (~1.25MB)

### 2. Update State File (Required)
Edit `qa-outputs/remediation-wave-state.json`:
```json
"W3-001-VALIDATE": {
  "status": "completed",
  "script_exit_code": 0,
  "script_executed_at": "2026-01-24T20:15:00Z",
  "completed_at": "2026-01-24T20:15:00Z",
  "validation_result": {
    "passed": true,
    "checks": [
      { "command": "grep -c '^### Conclusion'", "expected": "13", "actual": "13", "passed": true },
      { "command": "grep -c '^### Rule'", "expected": "13", "actual": "13", "passed": true },
      { "command": "total header count", "expected": ">=50", "actual": "54", "passed": true }
    ]
  }
}
```

### 3. Update Metrics (Required)
```json
"metrics": {
  "tasks_completed": 6,
  "tasks_verified": 6,
  "scripts_executed": 1,
  "last_checkpoint": "2026-01-24T20:15:00Z"
}
```

### 4. Update Recovery Instructions (Required)
Add to `do_not_repeat` array:
```json
"do_not_repeat": ["W2-003", "W2-010", "W2-015", "W2-018", "W3-001-VALIDATE"]
```

### 5. Proceed to Next Task
- [ ] W3-XREF-SCAN (cross-reference validation)
- [ ] OR W3-COUNTER-SCAN (counter-analysis consolidation)
- [ ] Use `W3-001-VALIDATE-creac-review.md` as input file

## Success Criteria Summary

| Criterion | Target | Status |
|-----------|--------|--------|
| Total headers | ≥50 | Expected: 54 ✅ |
| Conclusion headers | 13 | Expected: 13 ✅ |
| Rule headers | 13 | Expected: 13 ✅ |
| Existing headers preserved | 28 | Expected: 28 ✅ |
| File size increase | <50KB | Expected: ~20KB ✅ |
| No content corruption | Required | Script preserves all content ✅ |
| Output file created | Required | Configured correctly ✅ |

## Troubleshooting

### Script Fails
```bash
# Check Python version
python3 --version  # Must be 3.6+

# Check input file
ls -lh /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/final-memorandum-creac.md

# Check output directory
mkdir -p /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/remediation-outputs

# Run with error logging
python3 process-creac-now.py 2>&1 | tee execution.log
```

### Wrong Header Count
```bash
# Debug: Check if sections were detected
grep "Processing IV\." execution.log | wc -l  # Should be 13

# Debug: Check insertion points
grep "Inserting at line" execution.log

# Debug: Manual count in input
grep -c "^## IV\.[A-M]\." final-memorandum-creac.md  # Should be 13
```

### Output File Missing
```bash
# Check working directory
pwd
# Should be: /Users/ej/Super-Legal/super-legal-mcp-refactored

# Check if script ran to completion
tail -20 execution.log
# Should see "✓ Enhancement complete!"

# Check for partial output
ls -lh reports/2026-01-24-1737765000/remediation-outputs/
```

## Task Completion Sign-Off

- [ ] Script executed successfully
- [ ] Output file created and verified
- [ ] Header counts match expected (54 total)
- [ ] State file updated
- [ ] Ready to proceed to next Wave 3 task

---

**Task**: W3-001-VALIDATE
**Status**: READY FOR EXECUTION
**Prepared by**: memo-remediation-writer
**Date**: 2026-01-24T20:00:00Z
**Estimated Runtime**: 15-30 seconds
