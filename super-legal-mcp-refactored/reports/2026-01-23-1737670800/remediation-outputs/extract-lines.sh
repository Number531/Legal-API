#!/bin/bash
# Extract specific lines containing "clearly" from final-memorandum-creac.md

FILE="/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/final-memorandum-creac.md"
OUTPUT="/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/remediation-outputs/clearly-lines.txt"

echo "=== Line 2982 ===" > "$OUTPUT"
sed -n '2982p' "$FILE" >> "$OUTPUT"

echo "" >> "$OUTPUT"
echo "=== Line 3010 ===" >> "$OUTPUT"
sed -n '3010p' "$FILE" >> "$OUTPUT"

echo "" >> "$OUTPUT"
echo "=== Line 3012 ===" >> "$OUTPUT"
sed -n '3012p' "$FILE" >> "$OUTPUT"

echo "" >> "$OUTPUT"
echo "=== Line 9270 ===" >> "$OUTPUT"
sed -n '9270p' "$FILE" >> "$OUTPUT"

cat "$OUTPUT"
