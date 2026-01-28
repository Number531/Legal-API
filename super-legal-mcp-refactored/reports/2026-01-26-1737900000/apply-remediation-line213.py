#!/usr/bin/env python3
"""
Targeted Remediation: Section IV.A Line 213
Remove meta-commentary ("Wait—", "Let me") for professional tone.
"""

import shutil
from pathlib import Path
import sys

# File paths
FILE_PATH = Path("/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737900000/section-reports/section-IV-A-cms-regulatory-compliance.md")
BACKUP_PATH = FILE_PATH.with_suffix('.md.backup-line213')

# Find and replace
OLD_TEXT = "Wait—the fact registry shows 13 FTE CNAs [Fact #R.4]. Let me recalculate using the fact registry canonical value:"
NEW_TEXT = "The fact registry [Fact #R.4] specifies 13 FTE CNAs as the canonical value. Recalculating using this figure:"

def main():
    print(f"[INFO] Starting remediation for Section IV.A Line 213")
    print(f"[INFO] Target file: {FILE_PATH}")

    # Verify file exists
    if not FILE_PATH.exists():
        print(f"[ERROR] File not found: {FILE_PATH}")
        return 1

    # Read original content
    print(f"[INFO] Reading file...")
    try:
        with open(FILE_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"[ERROR] Failed to read file: {e}")
        return 1

    print(f"[INFO] File size: {len(content)} characters")

    # Verify target text exists
    if OLD_TEXT not in content:
        print(f"[ERROR] Target text not found in file!")
        print(f"[ERROR] Expected: '{OLD_TEXT[:80]}...'")
        return 1

    # Count occurrences
    count = content.count(OLD_TEXT)
    print(f"[INFO] Found {count} occurrence(s) of target text")

    # Create backup
    print(f"[INFO] Creating backup: {BACKUP_PATH}")
    try:
        shutil.copy2(FILE_PATH, BACKUP_PATH)
        print(f"[SUCCESS] Backup created successfully")
    except Exception as e:
        print(f"[ERROR] Failed to create backup: {e}")
        return 1

    # Perform replacement
    print(f"[INFO] Applying replacement...")
    new_content = content.replace(OLD_TEXT, NEW_TEXT)

    # Verify replacement occurred
    if new_content == content:
        print(f"[ERROR] Replacement failed - content unchanged")
        return 1

    # Write updated content
    print(f"[INFO] Writing updated content...")
    try:
        with open(FILE_PATH, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"[SUCCESS] File updated successfully")
    except Exception as e:
        print(f"[ERROR] Failed to write file: {e}")
        print(f"[INFO] Restoring from backup...")
        shutil.copy2(BACKUP_PATH, FILE_PATH)
        return 1

    # Verification
    print(f"\n[VERIFICATION] Checking for remaining meta-commentary...")

    # Check for conversational artifacts
    artifacts_found = []
    if "Wait—" in new_content:
        count_wait = new_content.count("Wait—")
        artifacts_found.append(f"'Wait—' ({count_wait} occurrences)")
    if "Let me recalculate" in new_content:
        count_let = new_content.count("Let me recalculate")
        artifacts_found.append(f"'Let me recalculate' ({count_let} occurrences)")

    if artifacts_found:
        print(f"[WARNING] Still found conversational artifacts: {', '.join(artifacts_found)}")
        print(f"[WARNING] Additional remediation may be required")
        return 1
    else:
        print(f"[SUCCESS] No conversational artifacts ('Wait—', 'Let me') found in file")

    # Confirm new text is present
    if NEW_TEXT in new_content:
        print(f"[SUCCESS] Replacement text confirmed in file")
        print(f"[SUCCESS] New text: '{NEW_TEXT[:80]}...'")
    else:
        print(f"[ERROR] Replacement text NOT found in file!")
        return 1

    print(f"\n" + "="*70)
    print(f"[COMPLETE] Remediation successful")
    print(f"[COMPLETE] Changes applied: {count} replacement(s)")
    print(f"[COMPLETE] Backup saved at: {BACKUP_PATH}")
    print(f"[COMPLETE] Updated file: {FILE_PATH}")
    print("="*70)
    return 0

if __name__ == "__main__":
    sys.exit(main())
