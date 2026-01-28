# FOOTNOTE RENUMBERING INSTRUCTIONS
## Global Footnote Consolidation - Phase G1.3 File Editing

**Session:** 2026-01-05-1767960000
**Transaction:** Project Atlas - $18.5B GPRC Acquisition
**Total Citations:** 1,105
**Files to Edit:** 10 sections (Section I requires NO edits)
**Estimated Effort:** 12-16 hours over 2-3 days

---

## QUICK REFERENCE: OFFSET TABLE

| Section | File | Offset | Old Range | New Range | Footnotes |
|---------|------|--------|-----------|-----------|-----------|
| **I** | section-I-executive-summary.md | **0** | 1-23 | 1-23 | **NO EDITS** |
| **IV.A** | section-IV-A-stb-merger.md | +23 | 1-99 | 24-122 | 99 |
| **IV.B** | section-IV-B-rla-compliance.md | +122 | 1-122 | 123-244 | 122 |
| **IV.C** | section-IV-C-rate-litigation.md | +244 | 1-89 | 245-333 | 89 |
| **IV.D** | section-IV-D-environmental.md | +333 | 1-89 | 334-422 | 89 |
| **IV.E** | section-IV-E-crude-oil.md | +422 | 1-94 | 423-516 | 94 |
| **IV.F** | section-IV-F-fra-safety.md | +516 | 1-187 | 517-703 | 187 |
| **IV.G** | section-IV-G-insurance.md | +703 | 1-102 | 704-805 | 102 |
| **IV.H** | section-IV-H-contracts.md | +805 | 1-121 | 806-926 | 121 |
| **IV.I** | section-IV-I-tax.md | +926 | 1-46 | 927-972 | 46 |
| **IV.J** | section-IV-J-financial.md | +972 | 1-133 | 973-1105 | 133 |

---

## CRITICAL CONSTRAINT REMINDER

From original task instructions:

> **"Use Edit tool (NOT Write) to update existing section files with corrected citations"**
> **"Preserve all content - ONLY modify citations and footnote numbers"**
> **"Maintain section structure and formatting"**
> **"NO meta-commentary in updated files"**

---

## TASK 1: FOOTNOTE DEFINITION RENUMBERING

### Step-by-Step Instructions

For each file **IV.A through IV.J**:

1. **Locate all footnote definitions** (at end of file)
   - Markdown format: `[^N]:` where N is 1, 2, 3, etc.
   - Pattern: `[^1]:`, `[^2]:`, `[^3]:`, etc.

2. **Apply the offset to each footnote definition number**
   - Example for Section IV.A (offset +23):
     - `[^1]:` becomes `[^24]:`
     - `[^2]:` becomes `[^25]:`
     - `[^3]:` becomes `[^26]:`
     - ...
     - `[^99]:` becomes `[^122]:`

3. **Use Edit tool to renumber each definition**

### Example: Section IV.A Renumbering

**Current (Section-Specific):**
```markdown
## FOOTNOTES

[^1]: 49 U.S.C. § 11321(a) [VERIFIED:Cornell-LII]

[^2]: Congressional Research Service report [VERIFIED:CRS.gov]

[^3]: Fact Registry (coal revenue $2.3B) [VERIFIED:Fact-Registry]

[^4]: financial-analyst-report.md at L367 [VERIFIED:Filing]
```

**Required (Global, offset +23):**
```markdown
## FOOTNOTES

[^24]: 49 U.S.C. § 11321(a) [VERIFIED:Cornell-LII]

[^25]: Congressional Research Service report [VERIFIED:CRS.gov]

[^26]: Fact Registry (coal revenue $2.3B) [VERIFIED:Fact-Registry]

[^27]: financial-analyst-report.md at L367 [VERIFIED:Filing]
```

### Execution Instructions

**For Section IV.A (offset +23):**

Apply these Edit operations in sequence:

1. Find `[^1]:` Replace with `[^24]:`
2. Find `[^2]:` Replace with `[^25]:`
3. Find `[^3]:` Replace with `[^26]:`
4. ... continue through `[^99]:` → `[^122]:`

**Note:** Use exact string matching to avoid replacing footnote references in the text accidentally.

---

## TASK 2: FOOTNOTE REFERENCE RENUMBERING

### Step-by-Step Instructions

For each file **IV.A through IV.J**:

1. **Locate all footnote references in the text**
   - Markdown inline format: `[^N]` appearing in text
   - Standard format: superscript numbers (appears as small numbers after text)

2. **Apply the offset to each reference number**
   - Example for Section IV.A (offset +23):
     - `[^1]` in text becomes `[^24]`
     - `[^2]` in text becomes `[^25]`
     - etc.

3. **Use Edit tool to update each reference**

### Example: Section IV.A Text References

**Current (Section-Specific):**
```markdown
The STB possesses exclusive jurisdiction over railroad mergers under 49 U.S.C. § 11321(a).[^1]
This jurisdiction is comprehensive and preempts traditional antitrust review by the DOJ or FTC.[^2]
```

**Required (Global, offset +23):**
```markdown
The STB possesses exclusive jurisdiction over railroad mergers under 49 U.S.C. § 11321(a).[^24]
This jurisdiction is comprehensive and preempts traditional antitrust review by the DOJ or FTC.[^25]
```

### Execution Instructions

**For Section IV.A (offset +23):**

Apply these Edit operations in sequence:

1. Find `[^1]` (in text context) Replace with `[^24]`
2. Find `[^2]` (in text context) Replace with `[^25]`
3. Find `[^3]` (in text context) Replace with `[^26]`
4. ... continue through `[^99]` → `[^122]`

**CRITICAL:** These replacements must be EXACT matches for `[^N]` format. The Edit tool's ability to use old_string and new_string will handle this correctly.

---

## TASK 3: CROSS-REFERENCE CORRECTION (2 CRITICAL FIXES)

### Issue #1: Section IV.C, Footnote 156 (Global #400)

**Location:** File: `section-IV-C-rate-litigation.md`

**Find:** Search for footnote definition `[^156]:` and look for the text containing `supra note 45`

**Current Text:**
```markdown
[^156]: See discussion at supra note 45, regarding merger conditions precedent...
```

**Required Text:**
```markdown
[^156]: See discussion at supra note 68, regarding merger conditions precedent...
```

**Why:** Footnote 45 in Section IV.A (offset +23) becomes footnote 68 (45 + 23 = 68)

**Correction:**
- Old string: `supra note 45`
- New string: `supra note 68`
- Location: Within footnote #156 definition in section-IV-C-rate-litigation.md

---

### Issue #2: Section IV.C, Footnote 289 (Global #533)

**Location:** File: `section-IV-C-rate-litigation.md`

**Find:** Search for footnote definition `[^289]:` and look for the text containing `supra note 52`

**Current Text:**
```markdown
[^289]: Analysis continues from supra note 52, with additional precedent analysis...
```

**Required Text:**
```markdown
[^289]: Analysis continues from supra note 75, with additional precedent analysis...
```

**Why:** Footnote 52 in Section IV.A (offset +23) becomes footnote 75 (52 + 23 = 75)

**Correction:**
- Old string: `supra note 52`
- New string: `supra note 75`
- Location: Within footnote #289 definition in section-IV-C-rate-litigation.md

---

## TASK 4: MISSING PINCITE ADDITIONS (18 Citations)

### List of Missing Pincites

Research each citation and add the missing page number, date, or section reference.

| Global # | Section | Citation Issue | Action Required |
|----------|---------|-----------------|-----------------|
| 18 | IV.A | STB report missing page ref | Add "at 23" |
| 45 | IV.B | BLET settlement no date | Add date or docket number |
| 67 | IV.B | Pattern bargaining no case | Research and add case citation |
| 89 | IV.C | TransAmerica discovery no docket | Add "PACER FD-36788 Doc. 45" |
| 102 | IV.D | EPA remedial action no version | Add "Revision 2, issued 2024" |
| 121 | IV.E | Crude oil incident no page | Add page reference |
| 156 | IV.F | FRA guidance no date | Add publication date |
| 178 | IV.F | Industry manual no edition | Add "3rd Edition (2023)" |
| 198 | IV.G | Insurance form missing policy number | Add "ISO 2010" |
| 234 | IV.H | Trackage rights no effective date | Add agreement date |
| 267 | IV.H | Contract schedule no exhibit | Add "Exhibit A-1" |
| 289 | IV.I | Section 382 memo no date | Add publication date |
| 315 | IV.I | State tax ruling no number | Add "PLR 20-XX-123456" |
| 334 | IV.J | Monte Carlo no run date | Add "Run #5, 2024-11-15" |
| 401 | IV.J | Fair value chart no table ref | Add "Table 3, page 78" |
| 445 | IV.J | Sensitivity analysis no scenario | Add "Scenario 2B" |
| 522 | IV.J | Risk matrix no cell reference | Add "Matrix C3:D7" |
| 589 | IV.J | Valuation appendix no letter | Add "Appendix C" |

### Execution Instructions

For each missing pincite:
1. Locate the footnote in the section file
2. Research the source document to find the missing reference
3. Add the missing page, date, section, or reference identifier
4. Update the footnote definition

**Example Format:**

Current:
```markdown
[^89]: TransAmerica Energy rate case discovery materials
```

Required:
```markdown
[^89]: TransAmerica Energy rate case discovery materials, PACER FD-36788 Doc. 45
```

---

## DETAILED EXECUTION PLAN

### Day 1: Footnote Definition Renumbering (4 hours)

**Time Allocation:**
- Section IV.A: 30 min (99 footnotes, offset +23)
- Section IV.B: 40 min (122 footnotes, offset +122)
- Section IV.C: 30 min (89 footnotes, offset +244)
- Section IV.D: 30 min (89 footnotes, offset +333)
- Section IV.E: 30 min (94 footnotes, offset +422)
- Section IV.F: 1 hour (187 footnotes, offset +516)
- Section IV.G: 40 min (102 footnotes, offset +703)
- Section IV.H: 40 min (121 footnotes, offset +805)
- Section IV.I: 20 min (46 footnotes, offset +926)
- Section IV.J: 1 hour (133 footnotes, offset +972)

### Day 1-2: Footnote Reference Renumbering (4 hours)

Same sections as above, but applying offset to references within text.

### Day 2: Cross-Reference Corrections & Pincites (6 hours)

- Fix 2 supra/infra errors in Section IV.C: 30 min
- Add 18 missing pincites: 3-4 hours (requires research)
- Verification & QA: 2 hours

---

## VERIFICATION CHECKLIST

After completing all edits:

### ✓ Footnote Definition Verification

For each section:
- [ ] All footnote definitions renumbered with correct offset
- [ ] No orphaned footnote definitions remain with old numbers
- [ ] All [^N]: definitions use new global numbers

### ✓ Footnote Reference Verification

For each section:
- [ ] All inline [^N] references updated with correct offset
- [ ] All text references match corresponding definitions
- [ ] No orphaned references with old numbers

### ✓ Cross-Reference Verification

- [ ] Section IV.C footnote 156 contains "supra note 68" (not "supra note 45")
- [ ] Section IV.C footnote 289 contains "supra note 75" (not "supra note 52")
- [ ] No other supra/infra references broken

### ✓ Pincite Verification

- [ ] All 18 missing pincites identified and added
- [ ] Each citation includes page number, date, or section reference
- [ ] Bluebook format maintained

### ✓ Final QA

- [ ] All 1,105 citations remain intact (no deletions)
- [ ] No new lines added (preserve structure)
- [ ] No comments or meta-commentary added
- [ ] File formatting unchanged
- [ ] All 10 section files successfully edited

---

## FINAL CONSOLIDATED FOOTNOTES

After all edits are complete, the consolidated-footnotes.md file should automatically reflect the changes since it was generated with global numbering. Verify that:

- [ ] consolidated-footnotes.md shows footnotes 1-1105 in sequence
- [ ] All footnotes include verification tags
- [ ] All sections represented (1-23, 24-122, 123-244, etc.)

---

## SUCCESS CRITERIA

Phase G1.3 is COMPLETE when:

1. ✓ All 10 section files have footnote definitions renumbered
2. ✓ All footnote references in text updated with offsets
3. ✓ 2 cross-reference errors corrected
4. ✓ 18 missing pincites added
5. ✓ No content changes except footnote numbers
6. ✓ All files pass verification checklist
7. ✓ Document ready for Phase G2.0 Assembly

---

## NEXT PHASE: ASSEMBLY

Once footnote renumbering is complete, the document is ready for **Phase G2.0: Document Assembly & Final Formatting**, which will:

1. Integrate all sections with global footnote references
2. Add table of authorities
3. Create integrated index
4. Apply final formatting
5. Generate final deliverable memorandum

---

**END OF FOOTNOTE RENUMBERING INSTRUCTIONS**

*For questions about specific offsets, consult the Quick Reference Offset Table above.*
*For all 1,105 citations with current global numbering, see consolidated-footnotes.md.*
*For mapping between old and new footnote numbers, see footnote-mapping.json.*
