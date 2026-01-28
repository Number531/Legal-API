#!/bin/bash

set -e
cd "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-22-1737576000"

echo "=== Comprehensive Section Renumbering Fix ==="

# Work from the current state
cp final-memorandum-v2.md /tmp/current.md

# The sections within OLD Section III (now Section V) need to be demoted to subsections
# Lines 719-1066 contain: IV. CROSS-DOMAIN, V. NEGOTIATION, VI. TIMELINE, VII. ACTIONS, VIII. DECISION, IX. DIRECTORY
# These should be subsections A-F within Section V

awk '
BEGIN {line_num=0; in_section_v=0}
{
  line_num++
  
  # Start of Section V: Critical Issues Matrix
  if (line_num == 689 && /^## V\. CRITICAL ISSUES MATRIX/) {
    in_section_v=1
    print $0
    next
  }
  
  # End of Section V content (when we hit Section VI Detailed Legal Analysis)
  if (line_num == 1067 && /^## VI\. DETAILED LEGAL ANALYSIS/) {
    in_section_v=0
    print $0
    next
  }
  
  # Within Section V, convert top-level ## sections to ### subsections
  if (in_section_v == 1) {
    if (/^## IV\. CROSS-DOMAIN IMPACT ANALYSIS/) {
      print "### A. CROSS-DOMAIN IMPACT ANALYSIS"
      next
    }
    if (/^## V\. NEGOTIATION POSITION SUMMARY/) {
      print "### B. NEGOTIATION POSITION SUMMARY"
      next
    }
    if (/^## VI\. TIMELINE & CRITICAL PATH/) {
      print "### C. TIMELINE & CRITICAL PATH"
      next
    }
    if (/^## VII\. PRIORITIZED RECOMMENDED ACTIONS/) {
      print "### D. PRIORITIZED RECOMMENDED ACTIONS"
      next
    }
    if (/^## VIII\. DECISION REQUIRED/) {
      print "### E. DECISION REQUIRED"
      next
    }
    if (/^## IX\. DETAILED SECTION DIRECTORY/) {
      print "### F. DETAILED SECTION DIRECTORY"
      next
    }
  }
  
  print $0
}
' /tmp/current.md > final-memorandum-v2.md

echo ""
echo "=== VERIFICATION ==="
wc -lw final-memorandum-v2.md
echo ""
echo "Top-level sections (should be I, II, III, IV, V, VI only):"
grep -n "^## [IVX]*\." final-memorandum-v2.md | head -20
echo ""
echo "Complete!"

