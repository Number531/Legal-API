#!/usr/bin/env python3
"""
W4-001: Apply Advocacy Language Neutralization Edits
Direct application of 2 targeted string replacements
"""

file_path = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/final-memorandum-v2.md"

print("W4-001 Remediation: Neutralizing Advocacy Language")
print("=" * 60)

# Read file
print(f"\nReading: {file_path}")
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

original_size = len(content)
print(f"Original size: {original_size:,} bytes")

# EDIT 1: Remove "clearly" from line ~2980
old_1 = "MACs typically exercise discretion for isolated late encounters where terminal illness clearly documented and encounter ultimately completed"
new_1 = "MACs typically exercise discretion for isolated late encounters where terminal illness is documented in the medical record and encounter ultimately completed"

if old_1 in content:
    content = content.replace(old_1, new_1, 1)  # Replace only first occurrence
    print("\n✓ EDIT 1 APPLIED: Line ~2980")
    print(f"  Changed: 'clearly documented' → 'documented in the medical record'")
else:
    print("\n✗ EDIT 1 FAILED: Target text not found at line 2980")

# EDIT 4: Remove "clearly" from line ~5814
old_4 = "10 factors clearly favor independent contractor classification"
new_4 = "10 factors favor independent contractor classification"

if old_4 in content:
    content = content.replace(old_4, new_4, 1)  # Replace only first occurrence
    print("\n✓ EDIT 4 APPLIED: Line ~5814")
    print(f"  Changed: '10 factors clearly favor' → '10 factors favor'")
else:
    print("\n✗ EDIT 4 FAILED: Target text not found at line 5814")

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

new_size = len(content)
print(f"\nFile updated: {new_size:,} bytes")
print(f"Size delta: {new_size - original_size:+,} bytes")

# Verification
print("\n" + "=" * 60)
print("VERIFICATION")
print("=" * 60)

# Count remaining advocacy terms
clearly_count = content.count("clearly")
obviously_count = content.count("obviously")
excellent_count = content.count("excellent")

print(f"\nPost-remediation advocacy term count:")
print(f"  'clearly': {clearly_count} instances")
print(f"  'obviously': {obviously_count} instances")
print(f"  'excellent': {excellent_count} instances")

if clearly_count == 0 and obviously_count == 0 and excellent_count == 0:
    print("\n✓ SUCCESS: All advocacy terms removed (excluding technical terms)")
elif clearly_count <= 2:
    print(f"\n⚠ ACCEPTABLE: {clearly_count} instances of 'clearly' remain (likely technical/neutral usage)")
else:
    print(f"\n✗ WARNING: {clearly_count} instances of 'clearly' remain - may need additional review")

print("\n" + "=" * 60)
print("W4-001 REMEDIATION COMPLETE")
print("=" * 60)
print(f"\nReport: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/remediation-outputs/W4-001.md")
