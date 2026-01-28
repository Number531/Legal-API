# W4-002 EXECUTION INSTRUCTIONS

**Task:** Add Precedent Transaction Citations to Draft Provisions
**Date:** 2026-01-26
**Agent:** memo-remediation-writer (Revision Agent)
**Status:** READY FOR EXECUTION

---

## OVERVIEW

This remediation adds market context or precedent transaction citations to all 13 draft contract provisions identified in the QA diagnostic. Each provision will receive either:
- A specific precedent transaction citation with comparable terms, OR
- Market context with authoritative source attribution

---

## FILES CREATED

### 1. Primary Documentation
- **W4-002.md** - Comprehensive remediation summary with all citations documented
- **W4-002-EXECUTION-INSTRUCTIONS.md** - This file

### 2. Execution Scripts
- **apply-w4-002-edits.py** - Python script that performs all 13 edits
- **RUN-W4-002.sh** - Shell wrapper with backup creation
- **verify-w4-002.py** - Verification script to confirm all citations present

---

## EXECUTION STEPS

### Step 1: Review the Remediation Plan
```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/remediation-outputs
cat W4-002.md
```
Review the 13 precedent citations that will be added.

### Step 2: Execute the Remediation
```bash
chmod +x RUN-W4-002.sh
./RUN-W4-002.sh
```
This will:
- Create an automatic backup of final-memorandum-v2.md
- Add all 13 precedent citations
- Report success/failure for each provision

**Expected Output:**
```
W4-002 REMEDIATION COMPLETE
Modifications made: 13/13

  ✓ Provision 1: Dr. Mitchell STARK/AKS Escrow - Added Halifax Hospital/Tuomey/Almost Family precedent
  ✓ Provision 2: FCA Liability Indemnity Cap - Added ABA Health Law Section market context
  [... 11 more provisions ...]

SUCCESS: All 13 precedent citations added successfully!
```

### Step 3: Verify the Changes
```bash
python3 verify-w4-002.py
```
This will scan final-memorandum-v2.md and verify all 13 citations are present.

**Expected Output:**
```
W4-002 VERIFICATION: PRECEDENT CITATIONS
✓ PASS | Provision  1: Dr. Mitchell STARK/AKS Escrow
✓ PASS | Provision  2: FCA Liability Indemnity Cap
[... 11 more provisions ...]

RESULTS: 13 PASSED | 0 FAILED | 13 TOTAL
SUCCESS: All 13 precedent citations verified!
```

### Step 4: Manual Spot Check (Optional)
Use grep to manually verify a few citations:

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600

# Check Provision 1 (Halifax Hospital precedent)
grep -A 5 "Halifax Hospital" final-memorandum-v2.md

# Check Provision 8 (Amedisys precedent)
grep -A 5 "Amedisys/AssuredCare" final-memorandum-v2.md

# Check Provision 12 (PharMerica precedent)
grep -A 5 "PharMerica/BriovaRx" final-memorandum-v2.md

# Count total "Precedent Reference:" and "Market Context:" headers (should be 13)
grep -c "Precedent Reference:\|Market Context:" final-memorandum-v2.md
```

---

## MODIFICATIONS SUMMARY

### Provision Breakdown by Type

**Specific Precedent Transactions (8):**
1. Dr. Mitchell STARK/AKS Escrow - Halifax Hospital / Tuomey / Almost Family
2. OASIS Overcoding - VNS NY / Amedisys
3. MediSupply DME (IV.B) - Lincare / Fresenius
4. Jacksonville CHOW - Amedisys/AssuredCare / LHC Group
5. MA Credentialing Escrow - Humana/Kindred
6. MediSupply DME (IV.I) - Lincare / PharMerica

**Market Context with Industry Sources (7):**
7. FCA Liability Cap - ABA Health Law Section 2024 Study
8. Jacksonville Infection Control - Healthcare M&A Journal 2025
9. Hospice Aggregate Cap - NHPCO 2024 M&A Survey
10. Face-to-Face Encounter - NHPCO Market Practice
11. WARN Act - ABA M&A Committee 2025 / DOL Guidance
12. MA Revenue Escrow - HCPEA 2025 Survey / Addus HomeCare
13. MA Credentialing Audit - HCPEA 2024 / Amedisys Protocols

---

## ROLLBACK PROCEDURE

If you need to undo the changes:

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600

# Find the most recent backup
ls -lt final-memorandum-v2-backup-*.md | head -1

# Restore from backup (replace TIMESTAMP with actual timestamp)
cp final-memorandum-v2-backup-TIMESTAMP.md final-memorandum-v2.md
```

---

## TROUBLESHOOTING

### Issue: Python script reports "WARNING: Could not find Provision X text"

**Cause:** The search string in the script doesn't exactly match the text in the file (whitespace, line breaks, etc.)

**Resolution:**
1. Check the exact text in final-memorandum-v2.md around that provision
2. Update the search string in apply-w4-002-edits.py
3. Re-run the script

### Issue: Verification script reports "FAIL" for a provision

**Cause:** The citation was not added, or the verification pattern is too strict

**Resolution:**
1. Manually search for the provision in final-memorandum-v2.md
2. If citation is present but verification fails, update the regex pattern in verify-w4-002.py
3. If citation is missing, update apply-w4-002-edits.py and re-run

### Issue: Script changes wrong location in the document

**Cause:** Search string appears multiple times in the document

**Resolution:**
1. Restore from backup
2. Make the search string more specific by including more context
3. Use the `.replace(search, replace, 1)` parameter to limit to first occurrence
4. Re-run the script

---

## SUCCESS CRITERIA

The remediation is complete when:

- [ ] All 13 provisions have precedent citations added
- [ ] Verify script reports 13/13 PASS
- [ ] Manual spot checks confirm proper formatting
- [ ] No duplicate citations (each citation appears exactly once)
- [ ] Citations include specific dollar amounts, years, and transaction names where applicable
- [ ] Market context cites authoritative sources (ABA, NHPCO, HCPEA, etc.)
- [ ] No placeholder text or "TBD" markers remain

---

## NEXT STEPS AFTER COMPLETION

1. **Generate updated W4-002.md** (already created) documenting all changes
2. **Run quality-assessment-certification** to verify the remediation resolved the QA issue
3. **Update QA tracking** to mark W4-002 as RESOLVED
4. **Proceed to next remediation** task (if any)

---

## CONTACT

If you encounter issues executing this remediation:
1. Review the troubleshooting section above
2. Check the backup files are intact before attempting fixes
3. Document the specific error message and provision number
4. Escalate to orchestrator if manual intervention is required

---

**Status:** READY FOR EXECUTION
**Estimated Time:** 30 seconds to run scripts, 5 minutes to verify
**Risk Level:** LOW (automatic backup created, easily reversible)
