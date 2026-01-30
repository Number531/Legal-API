#!/usr/bin/env python3
"""
Apply W4-OBJ-001 advocacy language neutralization edits to final-memorandum.md
Replaces directive advocacy language with objective advisory language.
"""

import sys
import os

def apply_edits(file_path):
    """Apply all 10 advocacy language neutralization edits."""

    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    edits_applied = []

    # Edit 1: Line 197 - DIP financing/stalking horse APA
    old_1 = "2. **Going-Concern Sale Structure Required** — DIP financing must prohibit standalone IP auctions; stalking horse APA must require bundled IP transfer. See **Section IV.D** for IP value preservation requirements."
    new_1 = "2. **Going-Concern Sale Structure Required** — DIP financing should prohibit standalone IP auctions; stalking horse APA should require bundled IP transfer. See **Section IV.D** for IP value preservation requirements."
    if old_1 in content:
        content = content.replace(old_1, new_1)
        edits_applied.append("Edit 1: Line 197 - must prohibit/must require → should prohibit/should require")

    # Edit 2: Line 312 - Ongoing NPDES/CAA Compliance
    old_2 = "- **Ongoing NPDES/CAA Compliance**: $400K-$2M annually, must be funded or facilities shut down"
    new_2 = "- **Ongoing NPDES/CAA Compliance**: $400K-$2M annually, requires funding or facilities will shut down"
    if old_2 in content:
        content = content.replace(old_2, new_2)
        edits_applied.append("Edit 2: Line 312 - must be funded → requires funding")

    # Edit 3: Line 316 - Reorganization plans
    old_3 = "**Impact**: Reorganization plans must budget 100% of non-dischargeable costs in feasibility analysis (11 U.S.C. § 1129(a)(11)); underestimation results in plan confirmation denial."
    new_3 = "**Impact**: Reorganization plans should budget 100% of non-dischargeable costs in feasibility analysis (11 U.S.C. § 1129(a)(11)); underestimation results in plan confirmation denial."
    if old_3 in content:
        content = content.replace(old_3, new_3)
        edits_applied.append("Edit 3: Line 316 - must budget → should budget")

    # Edit 4: Line 573 - Immediacy of harm
    old_4 = "1. **Immediacy of harm**: Contamination must pose imminent (not speculative) threat"
    new_4 = "1. **Immediacy of harm**: Contamination should pose imminent (not speculative) threat"
    if old_4 in content:
        content = content.replace(old_4, new_4)
        edits_applied.append("Edit 4: Line 573 - must pose → should pose")

    # Edit 5: Line 574 - Public health/safety nexus
    old_5 = "2. **Public health/safety nexus**: Harm must affect public, not just environmental degradation"
    new_5 = "2. **Public health/safety nexus**: Harm should affect public, not just environmental degradation"
    if old_5 in content:
        content = content.replace(old_5, new_5)
        edits_applied.append("Edit 5: Line 574 - must affect → should affect")

    # Edit 6: Line 575 - Harm identifiability
    old_6 = "3. **Harm identifiability**: Specific injury must be demonstrable, not generalized environmental concerns"
    new_6 = "3. **Harm identifiability**: Specific injury should be demonstrable, not generalized environmental concerns"
    if old_6 in content:
        content = content.replace(old_6, new_6)
        edits_applied.append("Edit 6: Line 575 - must be demonstrable → should be demonstrable")

    # Edit 7: Line 739 - Binary outcome distinction
    old_7 = "This distinction creates a binary outcome with enormous financial consequences: CERCLA response costs incurred pre-petition and reduced to monetary judgments are dischargeable as general unsecured claims (typically recovering 5-25%), while injunctive orders requiring the debtor or property owner to perform future cleanup survive discharge and must be satisfied in full.[18]"
    new_7 = "This distinction creates a binary outcome with enormous financial consequences: CERCLA response costs incurred pre-petition and reduced to monetary judgments are dischargeable as general unsecured claims (typically recovering 5-25%), while injunctive orders requiring the debtor or property owner to perform future cleanup survive discharge and require full satisfaction.[18]"
    if old_7 in content:
        content = content.replace(old_7, new_7)
        edits_applied.append("Edit 7: Line 739 - must be satisfied in full → require full satisfaction")

    # Edit 8: Line 4136 - Non-dischargeable obligations
    old_8 = "The following environmental obligations **cannot** be offset through bankruptcy and must be satisfied in full:"
    new_8 = "The following environmental obligations **cannot** be offset through bankruptcy and require full satisfaction:"
    if old_8 in content:
        content = content.replace(old_8, new_8)
        edits_applied.append("Edit 8: Line 4136 - must be satisfied in full → require full satisfaction")

    # Edit 9: Line 6513 - Legal Framework
    old_9 = "**Legal Framework:** Plan must satisfy § 1129(a) confirmation requirements including feasibility (§ 1129(a)(11)), best interests of creditors test (§ 1129(a)(7)), and absolute priority rule (§ 1129(b)) if non-consensual."
    new_9 = "**Legal Framework:** Plan should satisfy § 1129(a) confirmation requirements including feasibility (§ 1129(a)(11)), best interests of creditors test (§ 1129(a)(7)), and absolute priority rule (§ 1129(b)) if non-consensual."
    if old_9 in content:
        content = content.replace(old_9, new_9)
        edits_applied.append("Edit 9: Line 6513 - must satisfy → should satisfy")

    # Edit 10: Line 6566 - Voting and Consensus
    old_10 = "3. **Voting and Consensus Requirements:** Plan must be accepted by at least one impaired class (§ 1129(a)(10)), and each class must accept (§ 1126: majority in number, 2/3 in amount) or be crammed down under § 1129(b)."
    new_10 = "3. **Voting and Consensus Requirements:** Plan should be accepted by at least one impaired class (§ 1129(a)(10)), and each class should accept (§ 1126: majority in number, 2/3 in amount) or be crammed down under § 1129(b)."
    if old_10 in content:
        content = content.replace(old_10, new_10)
        edits_applied.append("Edit 10: Line 6566 - must be accepted/must accept → should be accepted/should accept")

    # Check if any edits were applied
    if content == original_content:
        print("WARNING: No edits were applied. Content may have already been modified.")
        return False

    # Write the modified content back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    # Report results
    print(f"✅ Successfully applied {len(edits_applied)} edits to {file_path}")
    print("\nEdits applied:")
    for edit in edits_applied:
        print(f"  - {edit}")

    return True

if __name__ == "__main__":
    file_path = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293/final-memorandum.md"

    if not os.path.exists(file_path):
        print(f"ERROR: File not found: {file_path}")
        sys.exit(1)

    # Create backup
    backup_path = file_path.replace('.md', '-backup-before-W4-OBJ-001.md')
    with open(file_path, 'r', encoding='utf-8') as f:
        backup_content = f.read()
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(backup_content)
    print(f"📋 Backup created: {backup_path}")

    # Apply edits
    success = apply_edits(file_path)

    if success:
        print("\n✅ W4-OBJ-001 advocacy language neutralization complete!")
        print(f"   Output: {file_path}")
        print(f"   Backup: {backup_path}")
        sys.exit(0)
    else:
        print("\n⚠️  No changes made - content may already be neutralized")
        sys.exit(0)
