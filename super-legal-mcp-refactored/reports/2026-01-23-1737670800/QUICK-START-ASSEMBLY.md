# QUICK START: Final Memorandum Assembly

## Execute Integration NOW

### One Command (Recommended)

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/remediation-outputs && python3 assemble-final-memo-v2.py
```

**Time**: 30 minutes
**Output**: `../final-memorandum-v2.md`

---

## Verify Success

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800

# Quick checks (all should pass)
test -f final-memorandum-v2.md && echo "✓ File created"
[ $(grep -c "^## IV\.[A-L]\." final-memorandum-v2.md) -eq 12 ] && echo "✓ 12 sections"
[ $(grep -c "### E\. Counter-Analysis" final-memorandum-v2.md) -eq 3 ] && echo "✓ 3 counter-analysis"
[ $(grep -c "### F\. Draft Contract Provisions" final-memorandum-v2.md) -ge 10 ] && echo "✓ ≥10 provision sections"
[ $(grep -ic "clearly" final-memorandum-v2.md) -eq 0 ] && echo "✓ No advocacy language"

# View report
cat remediation-outputs/ASSEMBLY-001-integration-report.md
```

---

## What Integration Does

1. **Inserts 3 counter-analysis subsections** (IV.B, IV.E, IV.J)
2. **Inserts 17 contract provisions** (across 10 sections)
3. **Compresses Executive Summary** (3,487 words)
4. **Removes advocacy language** (verifies "clearly" = 0)
5. **Adds methodology legend** (87-word NPV/EV/DCF explanation)
6. **Rephrases Question 5** (removes embedded conclusion)
7. **Verifies citation tags** (VERIFIED/INFERRED/METHODOLOGY)

---

## Next Step: QA Diagnostic

After integration completes:

```bash
# Invoke memo-qa-diagnostic (command depends on your orchestration setup)
memo-qa-diagnostic final-memorandum-v2.md
```

**Expected**: Score improves from 77.5% → 88-95%

**Certification**:
- Score ≥93% → CERTIFY (ready for delivery)
- Score 88-92% → CERTIFY WITH LIMITATIONS (ready with disclosures)
- Score <88% → Additional remediation required

---

## Manual Alternative

If Python execution fails:

```bash
cat /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/remediation-outputs/ASSEMBLY-001-manual-integration-guide.md
```

Follow step-by-step instructions (2-3 hours).

---

## Help & Documentation

- **Execution Summary**: `ASSEMBLY-001-EXECUTION-SUMMARY.md` (this directory)
- **Detailed Report**: `remediation-outputs/ASSEMBLY-001-integration-report.md`
- **Manual Guide**: `remediation-outputs/ASSEMBLY-001-manual-integration-guide.md`
- **Integration Script**: `remediation-outputs/assemble-final-memo-v2.py`

---

**Ready to Execute** | Wave 6 | ASSEMBLY-001 | Session 2026-01-23-1737670800
