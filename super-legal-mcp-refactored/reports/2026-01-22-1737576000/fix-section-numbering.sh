#!/bin/bash

set -e
cd "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-22-1737576000"

echo "Fixing section numbering conflicts in final-memorandum-v2.md..."

# The issue: Lines 1117-1465 contain sections numbered II-IX that should be subsections of Section I
# Fix: Convert "## II." through "## IX." within exec summary to "### "

# Create a corrected version
awk '
BEGIN {in_exec_summary=0; line_num=0}
{
  line_num++
  
  # Start of exec summary area (after Section I header)
  if (line_num == 176 && /^## I\. EXECUTIVE SUMMARY/) {
    in_exec_summary=1
    print $0
    next
  }
  
  # End of exec summary area (when we hit Section II Questions Presented)
  if (line_num == 641 && /^## II\. QUESTIONS PRESENTED/) {
    in_exec_summary=0
    print $0
    next
  }
  
  # Within exec summary, convert ## II. through ## IX. to ### subsections
  if (in_exec_summary == 1) {
    if (/^## II\. /) {
      sub(/^## II\. /, "### ")
      print $0
      next
    }
    if (/^## III\. /) {
      sub(/^## III\. /, "### ")
      print $0
      next
    }
    if (/^## IV\. /) {
      sub(/^## IV\. /, "### ")
      print $0
      next
    }
    if (/^## V\. /) {
      sub(/^## V\. /, "### ")
      print $0
      next
    }
    if (/^## VI\. /) {
      sub(/^## VI\. /, "### ")
      print $0
      next
    }
    if (/^## VII\. /) {
      sub(/^## VII\. /, "### ")
      print $0
      next
    }
    if (/^## VIII\. /) {
      sub(/^## VIII\. /, "### ")
      print $0
      next
    }
    if (/^## IX\. /) {
      sub(/^## IX\. /, "### ")
      print $0
      next
    }
  }
  
  print $0
}
' final-memorandum-v2.md > final-memorandum-v2-fixed.md

# Replace original
mv final-memorandum-v2-fixed.md final-memorandum-v2.md

echo "Section numbering fixed!"
echo ""
echo "Verification:"
grep -n "^## [IV]*\." final-memorandum-v2.md | head -15

