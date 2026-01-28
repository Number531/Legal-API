# FINAL MEMORANDUM ASSEMBLY - EXECUTION INSTRUCTIONS

## CRITICAL ISSUE IDENTIFIED

The Agent SDK Read tool has a **25,000 token limit** that prevents direct reading of large section files:
- `section-IV-B-captive-reinsurance.md`: 110KB (~27,485 tokens)
- `section-IV-C-variable-products.md`: 110KB (~27,391 tokens)

This limitation blocks programmatic assembly using Write/Edit tools within the agent environment.

---

## SOLUTION: SHELL SCRIPT ASSEMBLY

A verified assembly script has been created:
**Location:** `/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-18-1737247891/assemble-memorandum.sh`

### Execution Steps

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-18-1737247891

# Make script executable
chmod +x assemble-memorandum.sh

# Execute assembly with verification
./assemble-memorandum.sh
```

### What the Script Does

1. **Creates header** with document metadata and table of contents
2. **Appends Executive Summary** (3,200 words)
3. **Adds section separator** for detailed analysis
4. **Appends all 11 sections** in order:
   - IV.A: RBC Capital (from section-reports/)
   - IV.B: Captive Reinsurance (from section-reports/, 110KB)
   - IV.C: Variable Products (from section-reports/, 110KB)
   - IV.D through IV.K: From integrated files in root
5. **Appends consolidated footnotes** (654 citations)
6. **Adds document footer** with disclaimer and END OF MEMORANDUM marker

### Built-in Verification

The script automatically verifies:
- ✓ File exists
- ✓ File size >275KB
- ✓ Section count = 11/11
- ✓ Footnotes section present
- ✓ END OF MEMORANDUM marker present
- ✓ Line count >8,000
- ⚠ Word count >55,000 (warning if below)

---

## Expected Output

**File:** `final-memorandum-complete-v2.md`
**Location:** Same directory as script
**Expected Metrics:**
- Size: 700-900 KB
- Lines: 10,000-12,000
- Words: 60,000-75,000
- Sections: 11 (IV.A through IV.K)
- Footnotes: 654

---

## Verification Commands (Post-Execution)

After running the script, verify assembly success:

```bash
# Check file size
ls -lh final-memorandum-complete-v2.md

# Count sections
grep -c "^# SECTION IV\.[A-K]" final-memorandum-complete-v2.md
# Expected: 11

# Verify all section headers present
grep "^# SECTION IV\." final-memorandum-complete-v2.md

# Count words
wc -w final-memorandum-complete-v2.md
# Expected: >55,000

# Verify document ending
tail -20 final-memorandum-complete-v2.md | grep "END OF MEMORANDUM"
# Expected: Should find marker
```

---

## Troubleshooting

### If Script Fails

The script will exit with error message indicating which step failed. Common issues:

1. **File not found**: Missing source file
   - Check: `ls -l section-reports/` and `ls -l section-IV-*.md`
   - Solution: Verify all source files present before re-running

2. **Section count != 11**: Missing section file
   - Script will list which sections are present
   - Solution: Identify missing section and verify file exists

3. **File size <275KB**: Incomplete concatenation
   - Check: `ls -lh final-memorandum-complete-v2.md`
   - Solution: Review script output to find truncation point

### Script is Idempotent

Safe to re-run multiple times. Each execution overwrites the output file.

---

## Alternative: Manual Verification

If script cannot be executed, manual concatenation:

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-18-1737247891

# Manual concatenation (in order)
cat \
  <(echo "HEADER...") \
  executive-summary.md \
  <(echo "SEPARATOR...") \
  section-reports/section-IV-A-rbc-capital.md \
  section-reports/section-IV-B-captive-reinsurance.md \
  section-reports/section-IV-C-variable-products.md \
  section-IV-D-integrated.md \
  section-IV-E-integrated.md \
  section-IV-F-integrated.md \
  section-IV-G-integrated.md \
  section-IV-H-integrated.md \
  section-IV-I-integrated.md \
  section-IV-J-integrated.md \
  section-IV-K-integrated.md \
  consolidated-footnotes.md \
  <(echo "FOOTER...") \
  > final-memorandum-complete-v2.md
```

---

## Success Criteria Checklist

✅ All verified before reporting complete:

| Criterion | Target | Verification Method |
|-----------|--------|---------------------|
| File size | >275 KB | `ls -lh` |
| Word count | 55,000-80,000 | `wc -w` |
| Section count | 11 (IV.A-IV.K) | `grep -c "^# SECTION IV\."` |
| Footnotes | 654 | Present in document |
| No truncation | Complete ending | `tail -20 | grep "END OF MEMORANDUM"` |

---

## Next Step After Successful Assembly

Once `final-memorandum-complete-v2.md` passes all verification checks:

**Re-run QA diagnostic:**
```
Agent: memo-qa-diagnostic
Input: final-memorandum-complete-v2.md
Expected: Score >88% (vs. 1.2% for truncated version)
```

---

## Status

- [✓] Assembly script created
- [✓] Verification logic built-in
- [✓] Instructions documented
- [ ] **PENDING: Execute script**
- [ ] **PENDING: Verify output**
- [ ] **PENDING: Re-run QA diagnostic**

**Ready for execution.**
