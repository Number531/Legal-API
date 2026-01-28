#!/usr/bin/env python3
"""
Targeted Remediation: Section IV.A Line 213
Remove meta-commentary ("Wait—", "Let me") for professional tone.
"""

import shutil
from pathlib import Path

# File paths
FILE_PATH = Path("/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737900000/section-reports/section-IV-A-cms-regulatory-compliance.md")
BACKUP_PATH = FILE_PATH.with_suffix('.md.backup-line213')

# Find and replace
OLD_TEXT = "Wait—the fact registry shows 13 FTE CNAs [Fact #R.4]. Let me recalculate using the fact registry canonical value:"
NEW_TEXT = "The fact registry [Fact #R.4] specifies 13 FTE CNAs as the canonical value. Recalculating using this figure:"

def main():
    print(f"[INFO] Reading file: {FILE_PATH}")

    # Read original content
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Create backup
    print(f"[INFO] Creating backup: {BACKUP_PATH}")
    shutil.copy2(FILE_PATH, BACKUP_PATH)

    # Verify target text exists
    if OLD_TEXT not in content:
        print(f"[ERROR] Target text not found in file!")
        print(f"[ERROR] Expected: {OLD_TEXT[:50]}...")
        return 1

    # Count occurrences
    count = content.count(OLD_TEXT)
    print(f"[INFO] Found {count} occurrence(s) of target text")

    # Perform replacement
    new_content = content.replace(OLD_TEXT, NEW_TEXT)

    # Write updated content
    print(f"[INFO] Writing updated content to: {FILE_PATH}")
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # Verification
    print(f"\n[VERIFICATION] Checking for remaining meta-commentary...")
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        verify_content = f.read()

    # Check for conversational artifacts
    artifacts = []
    if "Wait—" in verify_content:
        artifacts.append("'Wait—'")
    if "Let me recalculate" in verify_content:
        artifacts.append("'Let me recalculate'")

    if artifacts:
        print(f"[WARNING] Still found conversational artifacts: {', '.join(artifacts)}")
        return 1
    else:
        print(f"[SUCCESS] No conversational artifacts ('Wait—', 'Let me') found in file")

    # Confirm new text is present
    if NEW_TEXT in verify_content:
        print(f"[SUCCESS] Replacement text confirmed in file")
    else:
        print(f"[ERROR] Replacement text NOT found in file!")
        return 1

    print(f"\n[COMPLETE] Remediation successful")
    print(f"[COMPLETE] Backup saved at: {BACKUP_PATH}")
    return 0

if __name__ == "__main__":
    exit(main())
