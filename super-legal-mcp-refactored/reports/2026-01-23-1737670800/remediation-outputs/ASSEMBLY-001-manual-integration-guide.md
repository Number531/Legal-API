# ASSEMBLY-001: Manual Integration Guide

## STATUS: READY FOR EXECUTION

## Overview

This guide provides step-by-step instructions for integrating all Wave 1-5 remediation outputs into final-memorandum-v2.md when automated script execution is not available.

**Estimated Time**: 2-3 hours (manual integration)
**Alternative**: Execute assemble-final-memo-v2.py (30 minutes automated)

---

## OPTION 1: Automated Integration (Recommended)

If Python execution is available:

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/remediation-outputs
python3 assemble-final-memo-v2.py
```

This will:
- Read final-memorandum-creac.md
- Insert all counter-analysis subsections (Wave 2)
- Insert all contract provisions (Wave 3)
- Apply Wave 4 fixes
- Apply Wave 5 enhancements
- Write final-memorandum-v2.md
- Generate integration report

**If automated integration completes successfully, SKIP to Step 7 (Verification).**

---

## OPTION 2: Manual Integration

### Prerequisites

1. Working directory: `/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800`
2. Base document: `final-memorandum-creac.md` (1.3MB, ~10,500 lines)
3. All remediation outputs present in `remediation-outputs/` directory

### File Size Warning

⚠️ **CRITICAL**: final-memorandum-creac.md exceeds SDK tool limits (~1.3MB).
- DO NOT use Read tool on full file
- Use section extraction with sed/head/tail
- Use Python script for bulk operations
- Use targeted Edit operations on extracted sections only

---

## STEP 1: Counter-Analysis Integration (Wave 2)

### Objective
Insert 3 new subsections titled "### E. Counter-Analysis and Adverse Authority" in sections IV.B, IV.E, and IV.J.

### Integration Points

#### 1.1: Section IV.B (Regulatory/Compliance)

**Location**: After subsection D (Risk Assessment), before subsection F (Draft Contract Provisions)
**Source File**: `remediation-outputs/W2-001-counter-analysis-IV-B.md`
**Extraction**: Content between `## EDITED_START` and `## EDITED_END`

**Instructions**:
1. Extract Section IV.B from final-memorandum-creac.md:
   ```bash
   sed -n '/^## IV\.B\. /,/^## IV\.C\. /p' final-memorandum-creac.md > section-IV-B.md
   ```

2. Extract W2-001 content:
   ```bash
   sed -n '/## EDITED_START/,/## EDITED_END/p' remediation-outputs/W2-001-counter-analysis-IV-B.md | \
     sed '1d;$d' > w2-001-content.txt
   ```

3. Find insertion point in section-IV-B.md (after "### D. Risk Assessment" subsection, before "### E." or "### F.")

4. Insert w2-001-content.txt with header:
   ```markdown
   ### E. Counter-Analysis and Adverse Authority

   [w2-001-content.txt contents]
   ```

5. Replace Section IV.B in final-memorandum-creac.md with modified section-IV-B.md

#### 1.2: Section IV.E (Tax/Carried Interest)

**Location**: After subsection D, before subsection F
**Source File**: `remediation-outputs/W2-002-counter-analysis-IV-E.md`

Follow same procedure as 1.1, replacing section identifier with IV.E.

#### 1.3: Section IV.J (Commercial Contracts)

**Location**: After subsection D, before subsection F
**Source File**: `remediation-outputs/W2-003-counter-analysis-IV-J.md`

Follow same procedure as 1.1, replacing section identifier with IV.J.

---

## STEP 2: Contract Provisions Integration (Wave 3)

### Objective
Insert draft contract provisions into "### F. Draft Contract Provisions" subsections across 10 sections.

### Section-to-Provision Mapping

| Section | Provisions | Count |
|---------|-----------|-------|
| IV.B | W3-P13, W3-P17 | 2 |
| IV.C | W3-P09 | 1 |
| IV.D | W3-P16 | 1 |
| IV.E | W3-P04, W3-P08 | 2 |
| IV.F | W3-P11 | 1 |
| IV.G | W3-P05 | 1 |
| IV.H | W3-P01, W3-P02, W3-P14, W3-P15 | 4 |
| IV.I | W3-P07 | 1 |
| IV.J | W3-P12 | 1 |
| IV.K | W3-P03, W3-P06, W3-P10 | 3 |
| **TOTAL** | | **17** |

### Integration Template

For EACH section:

1. Extract section from final-memorandum-creac.md
2. Check if "### F. Draft Contract Provisions" already exists
   - If YES: Append provisions after existing content
   - If NO: Create new subsection after D or E

3. Extract provision content from remediation-outputs/W3-PXX.md:
   ```bash
   sed -n '/## EDITED_START/,/## EDITED_END/p' remediation-outputs/W3-PXX.md | sed '1d;$d'
   ```

4. Insert with numbering:
   ```markdown
   ### F. Draft Contract Provisions

   [Provision 1 content from W3-PXX]

   ---

   [Provision 2 content from W3-PYY]

   ---
   ```

5. Replace section in base document

### Example: Section IV.B (2 provisions)

```bash
# Extract section
sed -n '/^## IV\.B\. /,/^## IV\.C\. /p' final-memorandum-creac.md > section-IV-B.md

# Extract provisions
sed -n '/## EDITED_START/,/## EDITED_END/p' remediation-outputs/W3-P13-12b1-disclosure-amendment.md | \
  sed '1d;$d' > w3-p13-content.txt

sed -n '/## EDITED_START/,/## EDITED_END/p' remediation-outputs/W3-P17-independent-director-appointment.md | \
  sed '1d;$d' > w3-p17-content.txt

# Manually insert into section-IV-B.md at appropriate location
# Then replace in base document
```

---

## STEP 3: Wave 4 Language/Format Fixes

### 3.1: W4-001 - Advocacy Language Removal

**Task**: Remove 4 instances of "clearly"
**Status**: Already applied to final-memorandum-creac.md (base document includes this fix)

**Verification**:
```bash
grep -ic "clearly" final-memorandum-creac.md
# Should return 0
```

If count > 0, remove manually:
```bash
sed -i.backup 's/\bclearly triggering\b/triggering/g' final-memorandum-creac.md
sed -i '' 's/\bclearly demonstrates\b/demonstrates/g' final-memorandum-creac.md
sed -i '' 's/\bclearly indicates\b/indicates/g' final-memorandum-creac.md
sed -i '' 's/,clearly,/,/g' final-memorandum-creac.md
```

### 3.2: W4-002 - Executive Summary Compression

**Task**: Replace entire Executive Summary section with compressed version
**Source**: `remediation-outputs/W4-002-executive-summary-compression.md`
**Target Word Count**: 3,487 words (down from 3,800)

**Instructions**:
1. Extract compressed summary from W4-002:
   ```bash
   sed -n '/## Compressed Executive Summary/,$p' remediation-outputs/W4-002-executive-summary-compression.md | \
     sed '1,2d' > compressed-exec-summary.md
   ```

2. Extract current Executive Summary from base:
   ```bash
   sed -n '/^# EXECUTIVE SUMMARY/,/^# [A-Z]/p' final-memorandum-creac.md > original-exec-summary.md
   ```

3. Replace in base document:
   ```bash
   # Find line numbers
   START=$(grep -n "^# EXECUTIVE SUMMARY" final-memorandum-creac.md | cut -d: -f1)
   END=$(sed -n "${START},\$p" final-memorandum-creac.md | grep -n "^# [A-Z]" | head -1 | cut -d: -f1)
   END=$((START + END - 1))

   # Delete old section
   sed -i.backup "${START},${END}d" final-memorandum-creac.md

   # Insert new section
   sed -i "" "${START}r compressed-exec-summary.md" final-memorandum-creac.md
   ```

### 3.3: W4-003 - Risk Table Standardization

**Decision**: DEFERRED - Keep existing 9-column format
**Rationale**: All 12 sections consistently use 9-column format. Changing would reduce analytical detail without improving readability.

**Action**: SKIP (no changes required)

### 3.4: W4-004 - Methodology Legend Addition

**Task**: Insert methodology legend after Methodology Summary table
**Source**: `remediation-outputs/W4-004-methodology-legend.md`
**Location**: After line with `| **TOTAL** | **18** | $318.1M | $85.4M | |`

**Instructions**:
1. Extract legend blockquote from W4-004:
   ```bash
   sed -n '/^> \*\*Exposure Quantification Methodology\*\*/,/^###/p' remediation-outputs/W4-004-methodology-legend.md | \
     sed '$d' > methodology-legend.txt
   ```

2. Find insertion point:
   ```bash
   LINE=$(grep -n "| \*\*TOTAL\*\* | \*\*18\*\* | \$318.1M | \$85.4M | |" final-memorandum-creac.md | cut -d: -f1)
   ```

3. Insert after table:
   ```bash
   sed -i.backup "${LINE}a\\
   \\
   $(cat methodology-legend.txt)
   " final-memorandum-creac.md
   ```

### 3.5: W4-005 - Question 5 Rephrase

**Task**: Replace Question 5 to remove embedded conclusion
**Source**: `remediation-outputs/W4-005-question-5-rephrase.md`

**Instructions**:
1. Extract revised Q5 from W4-005:
   ```bash
   sed -n '/## EDITED_START/,/## EDITED_END/p' remediation-outputs/W4-005-question-5-rephrase.md | \
     sed '1d;$d' > revised-q5.txt
   ```

2. Find and replace Q5 in base document (manual edit recommended due to multiline match)

---

## STEP 4: Wave 5 Citation Enhancements

### Status Check

**Assumption**: final-memorandum-creac.md already includes Wave 5 enhancements if remediation was executed sequentially.

**Verification**:
```bash
# Count verification tags
grep -c "\[VERIFIED:" final-memorandum-creac.md
grep -c "\[INFERRED:" final-memorandum-creac.md
grep -c "\[METHODOLOGY:" final-memorandum-creac.md
```

If counts are:
- VERIFIED: >50 → Wave 5 likely complete
- VERIFIED: 0-10 → Wave 5 NOT applied, requires integration

### Integration Required (if counts low)

**Source Files**:
- W5-001-verification-tags.md
- W5-002-tag-enhancement.md
- W5-003-benchmark-tags.md

**Scope**: Updates to Consolidated Footnotes section (lines 10460+)

**Approach**: Due to complexity and line-specific nature, use Python script or manual footnote-by-footnote review.

**Manual Process**:
1. Extract Consolidated Footnotes section
2. For each footnote in W5-001/002/003 reports, locate in extracted section
3. Add/enhance verification tags per specifications
4. Replace Consolidated Footnotes in base document

**Automated Alternative**:
Use Python script with tag insertion logic (see assemble-final-memo-v2.py for reference).

---

## STEP 5: Write Output File

Once all integrations complete:

```bash
cp final-memorandum-creac.md final-memorandum-v2.md
```

Or if working on copy:
```bash
mv final-memorandum-working.md final-memorandum-v2.md
```

---

## STEP 6: Quality Verification

### Checklist

Run these commands to verify integration success:

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800

# 1. All 12 sections present
grep -c "^## IV\.[A-L]\." final-memorandum-v2.md
# Expected: 12

# 2. CREAC headers count
grep -cE "^#{4,5}\s+(Conclusion|Rule|Explanation|Application|Counter-Analysis)" final-memorandum-v2.md
# Expected: ≥50

# 3. Contract provisions count
grep -c "### F\. Draft Contract Provisions" final-memorandum-v2.md
# Expected: ≥10 (sections with provisions)

# 4. Counter-analysis subsections
grep -c "### E\. Counter-Analysis and Adverse Authority" final-memorandum-v2.md
# Expected: 3 (sections IV.B, IV.E, IV.J)

# 5. Placeholders (should be 0)
grep -cE "\[TBD\]|\[XREF\]|\[continue\]|\[to be continued\]" final-memorandum-v2.md
# Expected: 0

# 6. Advocacy language removed
grep -ic "clearly" final-memorandum-v2.md
# Expected: 0

# 7. Executive Summary word count
sed -n '/^# EXECUTIVE SUMMARY/,/^# [A-Z]/p' final-memorandum-v2.md | wc -w
# Expected: 3,200-3,500

# 8. Verification tags present
grep -c "\[VERIFIED:" final-memorandum-v2.md
# Expected: >50

# 9. File size
ls -lh final-memorandum-v2.md
# Expected: ~1.3-1.5MB

# 10. Line count
wc -l final-memorandum-v2.md
# Expected: ~10,500-11,500 lines
```

### Visual Inspection

Open final-memorandum-v2.md in Markdown viewer and check:
- [ ] Table of contents renders correctly
- [ ] All section headings present (I-VII)
- [ ] Risk tables render correctly
- [ ] Footnotes render correctly
- [ ] No broken Markdown formatting
- [ ] Code blocks and blockquotes render correctly

---

## STEP 7: Generate Integration Report

Create `remediation-outputs/ASSEMBLY-001-integration-report.md` documenting:

```markdown
# REMEDIATION COMPLETE: ASSEMBLY-001

## STATUS: SUCCESS

## Integration Steps Completed

### Step 1: Base Document Loaded
✓ final-memorandum-creac.md loaded

### Step 2: Counter-Analysis Inserted
✓ IV.B: W2-001
✓ IV.E: W2-002
✓ IV.J: W2-003

### Step 3: Contract Provisions Inserted
[List all 17 provisions and their sections]

### Step 4: Wave 4 Fixes Applied
✓ W4-001: Advocacy language removed
✓ W4-002: Executive Summary compressed
✓ W4-003: Risk tables (decision: keep 9-column)
✓ W4-004: Methodology legend inserted
✓ W4-005: Question 5 rephrased

### Step 5: Wave 5 Enhancements Applied
[Document verification tag counts]

## Quality Verification Results
[Paste results from Step 6 verification commands]

## Issues Encountered
[Document any issues or manual workarounds]

## Risk Table Format Decision
KEEP EXISTING 9-COLUMN FORMAT
Rationale: Consistent across all sections, superior analytical detail

## Next Steps
1. Invoke memo-qa-diagnostic on final-memorandum-v2.md
2. Based on score, invoke memo-qa-certifier
```

---

## STEP 8: Post-Integration Actions

### Invoke QA Diagnostic

```bash
# Command to invoke diagnostic (adjust for your environment)
memo-qa-diagnostic final-memorandum-v2.md
```

**Expected Outcome**:
- **Optimistic**: Score 93-95% → CERTIFY
- **Base Case**: Score 88-92% → CERTIFY WITH LIMITATIONS
- **Conservative**: Score 85-87% → Cycle 2 remediation
- **Failure**: Score <85% → Escalate or cycle 2

### Certification Decision

Based on post-remediation score:
- Score ≥93%: Invoke memo-qa-certifier → CERTIFY
- Score 88-92%: Invoke memo-qa-certifier → CERTIFY WITH LIMITATIONS
- Score <88% and cycle 1: Begin remediation cycle 2
- Score <88% and cycle ≥2: ESCALATE to HUMAN_REVIEW

---

## Troubleshooting

### Issue: File too large for SDK tools

**Solution**: Use sed/awk for section extraction, never read full file

### Issue: Insertion point not found

**Solution**: Manually locate subsection headers with grep -n, use line numbers for sed operations

### Issue: Provision content malformed

**Solution**: Verify EDITED_START/END markers present, check file encoding (UTF-8)

### Issue: Verification counts incorrect

**Solution**: Review integration steps, check if sections were accidentally deleted or duplicated

---

## Files Created

1. `final-memorandum-v2.md` - Final integrated memorandum
2. `remediation-outputs/ASSEMBLY-001-integration-report.md` - Integration report
3. `*.backup` - Backup files from sed operations (safe to delete after verification)

---

**Agent**: memo-remediation-writer
**Task**: ASSEMBLY-001
**Wave**: 6 (Final Integration)
**Priority**: CRITICAL
**Created**: 2026-01-23
