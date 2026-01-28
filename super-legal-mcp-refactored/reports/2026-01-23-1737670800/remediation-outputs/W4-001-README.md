# W4-001: Advocacy Language Removal - Execution Guide

## Quick Start

```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/remediation-outputs
chmod +x run-W4-001.sh
./run-W4-001.sh
```

## What This Does

Removes all 4 instances of the advocacy term "clearly" from final-memorandum-creac.md to ensure objective legal analysis tone.

## Files Created

1. **W4-001-extract-and-fix.py** - Python script that performs the remediation
2. **run-W4-001.sh** - Shell wrapper for easy execution
3. **W4-001-advocacy-removal.md** - Detailed remediation report
4. **W4-001-README.md** - This file

## Instance Locations

| Instance | Line | Section | Context |
|----------|------|---------|---------|
| 1 | 2982 | IV.D (Marketing) | Legal Framework |
| 2 | 3010 | IV.D (Marketing) | B.1 Testimonial Violations |
| 3 | 3012 | IV.D (Marketing) | B.1 Testimonial Violations |
| 4 | 9270 | IV.K (Privacy) | B.3 Massachusetts 201 CMR 17.00 |

## Example Fix

**Before:**
> Pinnacle manages PII for an estimated 500-1,000 Massachusetts residents among its 8,749 total client entities, **clearly** triggering 201 CMR 17.00 applicability.

**After:**
> Pinnacle manages PII for an estimated 500-1,000 Massachusetts residents among its 8,749 total client entities, triggering 201 CMR 17.00 applicability.

**Why**: The term "clearly" is advocacy language that characterizes the obviousness of a conclusion. Objective legal analysis should present facts and let them speak for themselves.

## Verification

After running the script, verify success:

```bash
# Should return 0
grep -ic "clearly" /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/final-memorandum-creac.md

# View changes
diff final-memorandum-creac.md.backup-W4-001 final-memorandum-creac.md | grep -C2 "clearly"
```

## Outputs

- **Modified file**: final-memorandum-creac.md (4 lines changed)
- **Backup**: final-memorandum-creac.md.backup-W4-001
- **Report**: W4-001-advocacy-removal.md (with before/after comparisons)

## Safety

- Automatic backup created before any changes
- Only removes "clearly" - no other text affected
- Preserves formatting, footnotes, and structure
- Regex-based replacement ensures precision

## Troubleshooting

**If Python script fails:**
```bash
# Manual sed-based approach
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800

# Backup first
cp final-memorandum-creac.md final-memorandum-creac.md.backup-W4-001

# Remove "clearly" in-place (macOS sed syntax)
sed -i '' 's/\([, ]\)clearly \([a-z]\)/\1\2/gi' final-memorandum-creac.md

# Verify
grep -ic "clearly" final-memorandum-creac.md
```

## Next Steps

After successful execution:
1. Review W4-001-advocacy-removal.md for complete before/after documentation
2. Confirm grep verification shows 0 instances
3. Proceed to next Wave 4 task (W4-002)

---

**Wave**: 4 - Language and Format Fixes
**Priority**: HIGH
**Estimated time**: < 1 minute
**Status**: Ready for execution
