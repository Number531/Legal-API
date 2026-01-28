# W4-001 MANUAL IMPLEMENTATION INSTRUCTIONS

**Task**: Replace Questions Presented in final-memorandum.md Section II
**Status**: AUTOMATED SCRIPT CREATED - Manual execution required

---

## ISSUE

The final-memorandum.md file (1.1MB, ~289K tokens) exceeds Read tool limits, preventing direct Edit tool usage.

## SOLUTION OPTIONS

### OPTION 1: Execute Python Script (RECOMMENDED)

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/remediation-outputs
python3 update_questions.py
```

The script `/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/remediation-outputs/update_questions.py` has been created and will:
1. Read final-memorandum.md
2. Use regex to find Section II (Questions Presented)
3. Replace entire section with reformatted questions
4. Write updated content back to file
5. Verify success

**Expected Output**:
```
✅ SUCCESS: Questions Presented section updated
✓ File: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/final-memorandum.md
✓ All 12 questions reformatted to Under/Does/When format
✓ Substantive issues preserved
✓ Section III (Brief Answers) remains compatible
```

---

### OPTION 2: Manual Find-and-Replace in Text Editor

Open final-memorandum.md in a text editor and replace the entire Section II from:

```
## II. QUESTIONS PRESENTED
```

through:

```
---

## III. BRIEF ANSWERS
```

With the new content from: `/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/remediation-outputs/W4-001-questions-presented-rewrite.md`

Copy lines 30-151 from W4-001-questions-presented-rewrite.md (the reformatted questions section).

---

### OPTION 3: sed Command (One-Liner)

Due to the complexity of multiline replacement and long lines in sed, this is NOT RECOMMENDED. Use Option 1 (Python script) instead.

---

## VERIFICATION AFTER EXECUTION

After running the Python script or manual replacement, verify:

```bash
# Check that new format is present
grep -A 2 "Under Nebraska Revised Statutes sections 44-6011" /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/final-memorandum.md

# Should return:
# Under Nebraska Revised Statutes sections 44-6011 through 44-6014 establishing Risk-Based Capital thresholds for life insurance companies, does Liberty Life Insurance Company's current RBC ratio of 188%...

# Count questions (should be 12)
grep -c "^\*\*[0-9]\+\." /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/final-memorandum.md | head -1
```

---

## FILES CREATED

1. **W4-001-questions-presented-rewrite.md** - Documentation of reformatted questions
2. **update_questions.py** - Automated replacement script
3. **W4-001-manual-instructions.md** - This file

---

## NEXT STEPS

1. Execute Python script OR perform manual replacement
2. Verify changes using grep commands above
3. Mark W4-001 as COMPLETE in remediation tracker
4. Proceed to next remediation task

---

**Created**: 2026-01-22
**Agent**: research-plan-refiner (INITIAL mode - Questions Presented generation)
