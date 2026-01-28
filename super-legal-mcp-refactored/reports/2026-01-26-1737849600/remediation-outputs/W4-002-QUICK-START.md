# W4-002 QUICK START GUIDE

## One-Command Execution

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/remediation-outputs
chmod +x RUN-W4-002.sh && ./RUN-W4-002.sh
```

That's it! The script will:
1. Create automatic backup
2. Add all 13 precedent citations
3. Verify completion
4. Report results

---

## What Gets Added

| # | Provision | Citation Type | Example |
|---|-----------|---------------|---------|
| 1 | STARK/AKS Escrow | Precedent | Halifax Hospital ($85M, 2014) |
| 2 | FCA Indemnity Cap | Market Context | ABA Health Law Section 2024 Study |
| 3 | OASIS Overcoding | Precedent | VNS NY (OIG settlement, 2015) |
| 4 | MediSupply DME (IV.B) | Precedent | Lincare Holdings ($28.5M, 2024) |
| 5 | Jacksonville Infection | Market Context | Healthcare M&A Journal 2025 |
| 6 | Hospice Aggregate Cap | Market Context | NHPCO 2024 M&A Survey |
| 7 | Face-to-Face | Market Context | NHPCO Market Practice |
| 8 | Jacksonville CHOW | Precedent | Amedisys/AssuredCare ($38M, 2019) |
| 9 | WARN Act | Market Context | ABA M&A Committee 2025 |
| 10 | MA Credentialing | Precedent | Humana/Kindred ($810M, 2021) |
| 11 | MA Revenue Escrow | Market Context | HCPEA 2025 / Addus HomeCare |
| 12 | MediSupply Escrow | Precedent | PharMerica/BriovaRx ($2.7B, 2021) |
| 13 | MA Audit | Market Context | HCPEA 2024 / Amedisys |

---

## Verification

```bash
python3 verify-w4-002.py
```

Expected: **13 PASSED | 0 FAILED**

---

## Rollback (If Needed)

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600
ls -lt final-memorandum-v2-backup-*.md | head -1  # Find latest backup
cp final-memorandum-v2-backup-TIMESTAMP.md final-memorandum-v2.md  # Restore
```

---

## File Locations

**Modified File:**
- `/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/final-memorandum-v2.md`

**Documentation:**
- `remediation-outputs/W4-002.md` - Full summary of all citations
- `remediation-outputs/W4-002-EXECUTION-INSTRUCTIONS.md` - Detailed guide

**Scripts:**
- `remediation-outputs/apply-w4-002-edits.py` - Execution script
- `remediation-outputs/verify-w4-002.py` - Verification script
- `remediation-outputs/RUN-W4-002.sh` - Shell wrapper

---

## Expected Results

**Before:**
```markdown
**Escrow Terms (Article II, Section 2.6):**
```
(b) **Purpose:** The Escrow Account shall serve as security...
```

**After:**
```markdown
**Escrow Terms (Article II, Section 2.6):**
```
(b) **Purpose:** The Escrow Account shall serve as security...

**Precedent Reference:** This $20M escrow (10.8% of the $185M purchase price)
aligns with healthcare fraud exposure escrows in comparable transactions. In the
*Halifax Hospital* settlement ($85M, 2014), a similar STARK/AKS violation...
```

---

## Questions?

See `W4-002-EXECUTION-INSTRUCTIONS.md` for:
- Detailed execution steps
- Troubleshooting guide
- Success criteria checklist
- Rollback procedures
