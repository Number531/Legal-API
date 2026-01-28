# W4-001: Advocacy Language Removal

## STATUS: READY FOR EXECUTION

## Task Overview

**Wave**: 4 (Language and Format Fixes)
**Priority**: HIGH
**Target**: Remove all 4 instances of advocacy language ("clearly") from final-memorandum-creac.md

## Execution Instructions

To complete this remediation, execute:

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/remediation-outputs
chmod +x run-W4-001.sh
./run-W4-001.sh
```

The script will:
1. Identify all 4 instances of "clearly" (lines 2982, 3010, 3012, 9270)
2. Remove the advocacy term while preserving surrounding context
3. Create backup: final-memorandum-creac.md.backup-W4-001
4. Generate this report with before/after comparisons
5. Verify 0 instances remain after remediation

## Identified Instances

### Instance 1: Line 2982
**Section**: IV.D (Marketing Rule Compliance) - Legal Framework
**Pattern**: Line contains "clearly" in context of testimonial requirements
**Fix**: Remove "clearly" while maintaining sentence structure

### Instance 2: Line 3010
**Section**: IV.D (Marketing Rule Compliance) - B.1 Testimonial Violations
**Pattern**: Line contains "clearly" in CREAC analysis
**Fix**: Remove "clearly" while maintaining sentence structure

### Instance 3: Line 3012
**Section**: IV.D (Marketing Rule Compliance) - B.1 Testimonial Violations
**Pattern**: Line contains "clearly" in CREAC analysis (same subsection as Instance 2)
**Fix**: Remove "clearly" while maintaining sentence structure

### Instance 4: Line 9270
**Section**: IV.K (Privacy and Cybersecurity Compliance) - B.3 Massachusetts 201 CMR 17.00
**Original Sentence**:
```
**Application:** Here, Pinnacle manages PII for an estimated 500-1,000 Massachusetts residents among its 8,749 total client entities, clearly triggering 201 CMR 17.00 applicability.⁹⁴ [VERIFIED: fact-registry.md; privacy-cybersecurity-compliance-report.md] The target's vendor contracts require amendment to comply with 201 CMR 17.05:
```

**Revised Sentence**:
```
**Application:** Here, Pinnacle manages PII for an estimated 500-1,000 Massachusetts residents among its 8,749 total client entities, triggering 201 CMR 17.00 applicability.⁹⁴ [VERIFIED: fact-registry.md; privacy-cybersecurity-compliance-report.md] The target's vendor contracts require amendment to comply with 201 CMR 17.05:
```

**Rationale**: The term "clearly" is advocacy language that characterizes the strength or obviousness of a legal conclusion. In objective legal analysis, the facts should speak for themselves. The phrase "triggering 201 CMR 17.00 applicability" is sufficiently clear without the adverb "clearly" to emphasize it. Removing this term maintains professional objectivity while preserving the substantive analysis.

## Replacement Strategy

**Pattern Matching**:
- `clearly triggering` → `triggering`
- `clearly demonstrates` → `demonstrates`
- `clearly indicates` → `indicates`
- `, clearly,` → `,`
- `clearly [verb]` → `[verb]`

**Preservation Requirements**:
- Maintain all surrounding punctuation
- Preserve footnote references
- Keep sentence structure intact
- Do not alter any other content on the line

## Success Criteria

- [PENDING] All 4 instances of "clearly" identified and extracted
- [PENDING] Objective language substituted (simple removal of adverb)
- [PENDING] No new advocacy terms introduced during editing
- [PENDING] Surrounding context preserved (punctuation, formatting, footnotes)
- [PENDING] Verification: `grep -i "clearly" final-memorandum-creac.md` returns 0 results

## Verification Commands

After execution, run:
```bash
# Should return 0
grep -ic "clearly" /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/final-memorandum-creac.md

# Compare backup to modified file
diff /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/final-memorandum-creac.md.backup-W4-001 \
     /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/final-memorandum-creac.md | grep "clearly"
```

## Implementation Notes

**Why Script-Based Approach**:
- File size: 1,359,091 bytes (~339,773 tokens) exceeds SDK Read tool limits
- Line lengths: Lines 2982, 3010, 3012 exceed display limits (truncated in grep output)
- Precision required: Must preserve exact formatting, footnotes, and CREAC structure
- Verification needed: Automated counting ensures all instances removed

**Alternative Manual Approach** (if script fails):
```bash
# Extract lines with sed
sed -n '2982p' final-memorandum-creac.md > line-2982.txt
sed -n '3010p' final-memorandum-creac.md > line-3010.txt
sed -n '3012p' final-memorandum-creac.md > line-3012.txt
sed -n '9270p' final-memorandum-creac.md > line-9270.txt

# Edit each file to remove "clearly"
# Then replace in original:
sed -i.backup '2982d' final-memorandum-creac.md
sed -i '' '2981r line-2982.txt' final-memorandum-creac.md
# Repeat for other lines
```

## Related Tasks

- **W4-002**: Additional language objectivity review
- **W5-001**: Citation format verification (ensure footnotes preserved)
- **W6-001**: Final verification checklist (confirm no advocacy language)

## Files Created

1. **W4-001-extract-and-fix.py** - Main remediation script
2. **run-W4-001.sh** - Shell wrapper for execution
3. **W4-001-advocacy-removal.md** - This report (updated after execution)
4. **final-memorandum-creac.md.backup-W4-001** - Backup (created during execution)

## Next Steps

1. Execute run-W4-001.sh to perform remediation
2. Review generated report to confirm all 4 instances documented
3. Verify grep count returns 0
4. Update remediation-wave-state.json:
   - task_registry["W4-001"].status = "completed"
   - Add verification_result with grep check
5. Proceed to W4-002 (next task in Wave 4)

---

**Agent**: memo-remediation-writer
**Session**: 2026-01-23-1737670800
**Created**: 2026-01-23
**Status**: Awaiting execution
