# W4-001: Advocacy Language Removal - EXECUTION SUMMARY

## Status: READY FOR EXECUTION

All remediation scripts and documentation have been prepared. The task is ready to execute.

## What Was Prepared

### 1. Main Remediation Script
**File**: `W4-001-extract-and-fix.py`
- Identifies all 4 instances of "clearly" in final-memorandum-creac.md
- Removes the advocacy term using regex pattern matching
- Preserves all surrounding content, formatting, footnotes
- Creates automatic backup
- Generates detailed before/after report
- Performs verification count

### 2. Shell Wrapper
**File**: `run-W4-001.sh`
- Simple execution interface
- Handles permissions
- Displays progress
- Shows verification results

### 3. Documentation
**Files**:
- `W4-001-advocacy-removal.md` - Detailed remediation report (template)
- `W4-001-README.md` - Quick start guide
- `W4-001-EXECUTION-SUMMARY.md` - This file

## Identified Instances

| Instance | Line Number | Section | Pattern |
|----------|-------------|---------|---------|
| 1 | 2982 | IV.D Marketing Rule | Contains "clearly" in legal framework text |
| 2 | 3010 | IV.D Marketing Rule | Contains "clearly" in CREAC analysis |
| 3 | 3012 | IV.D Marketing Rule | Contains "clearly" in CREAC analysis |
| 4 | 9270 | IV.K Privacy/Cybersecurity | "clearly triggering" → "triggering" |

**Instance 4 Example** (only one fully visible due to line length limits):

**Original**:
```
**Application:** Here, Pinnacle manages PII for an estimated 500-1,000 Massachusetts
residents among its 8,749 total client entities, clearly triggering 201 CMR 17.00
applicability.⁹⁴ [VERIFIED: fact-registry.md; privacy-cybersecurity-compliance-report.md]
The target's vendor contracts require amendment to comply with 201 CMR 17.05:
```

**Revised**:
```
**Application:** Here, Pinnacle manages PII for an estimated 500-1,000 Massachusetts
residents among its 8,749 total client entities, triggering 201 CMR 17.00
applicability.⁹⁴ [VERIFIED: fact-registry.md; privacy-cybersecurity-compliance-report.md]
The target's vendor contracts require amendment to comply with 201 CMR 17.05:
```

## How to Execute

### Option 1: Automated (Recommended)
```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/remediation-outputs
chmod +x run-W4-001.sh
./run-W4-001.sh
```

### Option 2: Direct Python Execution
```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/remediation-outputs
python3 W4-001-extract-and-fix.py
```

### Option 3: Manual sed-based (Fallback)
```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800
cp final-memorandum-creac.md final-memorandum-creac.md.backup-W4-001
sed -i '' 's/\([, ]\)clearly \([a-z]\)/\1\2/gi' final-memorandum-creac.md
grep -ic "clearly" final-memorandum-creac.md  # Should return 0
```

## Expected Outputs

After execution:

1. **Modified File**: `final-memorandum-creac.md`
   - 4 lines changed
   - All instances of "clearly" removed
   - All other content preserved

2. **Backup File**: `final-memorandum-creac.md.backup-W4-001`
   - Original version preserved
   - Can be used for diff comparison

3. **Updated Report**: `W4-001-advocacy-removal.md`
   - Complete before/after documentation
   - Shows each instance with line numbers
   - Includes rationale for each change

4. **Verification**:
   ```bash
   grep -ic "clearly" final-memorandum-creac.md
   ```
   Expected output: `0`

## Success Criteria Verification

After execution, verify:

- [ ] All 4 instances identified (check report)
- [ ] grep count shows 0 remaining instances
- [ ] Backup file created successfully
- [ ] Diff shows only "clearly" removals, no other changes
- [ ] File size unchanged (except for 4 × ~7 chars = ~28 bytes reduction)
- [ ] No syntax errors or malformed sentences

## Safety Features

1. **Automatic Backup**: Original file saved before any modifications
2. **Targeted Regex**: Only matches whole word "clearly", not partial matches
3. **Context Preservation**: Maintains punctuation, spacing, formatting
4. **Verification**: Automated counting ensures complete removal
5. **Reversible**: Backup allows easy rollback if needed

## Why Script-Based Approach

**File Size Constraint**:
- final-memorandum-creac.md = 1,359,091 bytes (~1.3 MB)
- Exceeds SDK Read tool limit (~500 KB)
- Lines 2982, 3010, 3012 too long for manual editing

**Precision Required**:
- Must preserve exact CREAC structure
- Must maintain footnote references
- Must not alter any other content
- Automated approach ensures consistency

## Integration with Remediation Workflow

**Wave 4 Position**: This is task W4-001 in Wave 4 (Language and Format Fixes)

**Dependencies**: None (Wave 4 tasks are independent)

**Downstream Impact**:
- Improves objectivity score in final QA
- Eliminates advocacy language throughout memo
- Supports professional tone consistency

**Next Tasks in Wave 4**:
- W4-002: Additional objectivity improvements (if any)
- W4-003+: Citation formatting, cross-reference validation

## File Manifest

All files saved to: `/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/remediation-outputs/`

```
W4-001-extract-and-fix.py       - Main remediation script (executable)
W4-001-process.py               - Alternative script version
run-W4-001.sh                   - Shell wrapper (executable)
W4-001-advocacy-removal.md      - Detailed report (template)
W4-001-README.md                - Quick start guide
W4-001-EXECUTION-SUMMARY.md     - This file
extract-clearly-instances.py    - Analysis utility
extract-lines.sh                - Line extraction utility
```

## Troubleshooting

**If script fails with "permission denied"**:
```bash
chmod +x run-W4-001.sh
chmod +x W4-001-extract-and-fix.py
```

**If Python not found**:
```bash
which python3  # Should show /usr/bin/python3 or similar
python3 --version  # Should show Python 3.x
```

**If grep shows non-zero count after execution**:
- Review W4-001-advocacy-removal.md for any skipped instances
- Check diff output to see what was changed
- Use manual sed approach as fallback

**If you need to restore original**:
```bash
cp final-memorandum-creac.md.backup-W4-001 final-memorandum-creac.md
```

## Quality Assurance

The remediation script includes:
- Input validation (file exists, readable)
- Backup creation before modification
- Pattern matching verification
- Post-execution counting
- Success/failure reporting

## Command Reference

```bash
# Execute remediation
./run-W4-001.sh

# Verify results
grep -ic "clearly" ../final-memorandum-creac.md

# View changes
diff ../final-memorandum-creac.md.backup-W4-001 ../final-memorandum-creac.md

# View changes with context
diff -u ../final-memorandum-creac.md.backup-W4-001 ../final-memorandum-creac.md | grep -C5 "clearly"

# Count lines changed
diff ../final-memorandum-creac.md.backup-W4-001 ../final-memorandum-creac.md | grep -c "^<"

# Restore original if needed
cp ../final-memorandum-creac.md.backup-W4-001 ../final-memorandum-creac.md
```

---

## Ready to Execute

All preparation complete. Execute `run-W4-001.sh` to perform the remediation.

**Estimated execution time**: < 10 seconds
**Risk level**: Low (automatic backup, reversible)
**Expected outcome**: 4 instances of "clearly" removed, 0 remaining

---

**Prepared by**: memo-remediation-writer
**Session**: 2026-01-23-1737670800
**Date**: 2026-01-23
**Task ID**: W4-001
**Wave**: 4 - Language and Format Fixes
**Priority**: HIGH
