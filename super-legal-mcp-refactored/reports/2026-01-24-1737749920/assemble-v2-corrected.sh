#!/bin/bash

# Wave 6 Assembly Script - CORRECTED
# Properly integrate Questions Presented and Brief Answers

set -e

echo "=== WAVE 6: FINAL ASSEMBLY (CORRECTED) ==="
echo ""

# Step 1: Extract pieces from original
echo "Step 1: Extracting document pieces..."

# Get title page and TOC (lines 1-17, before first ## header)
head -17 final-memorandum-creac.md > part-00-header.txt

# Step 2: Create Questions Presented section (with proper ## I. header)
echo "Step 2: Creating Questions Presented section..."
echo "## I. QUESTIONS PRESENTED" > part-01-questions.txt
echo "" >> part-01-questions.txt
# Get content from W1-001, skip the first # QUESTIONS PRESENTED header line
tail -n +2 remediation-outputs/W1-001-questions-presented.md >> part-01-questions.txt
echo "" >> part-01-questions.txt

# Step 3: Create Brief Answers section
echo "Step 3: Creating Brief Answers section..."
echo "## II. BRIEF ANSWERS" > part-02-answers.txt
echo "" >> part-02-answers.txt
# Get content from W1-002, skip the first # BRIEF ANSWERS header
tail -n +2 remediation-outputs/W1-002-brief-answers.md >> part-02-answers.txt
echo "" >> part-02-answers.txt

# Step 4: Extract Executive Summary from CREAC version and replace with trimmed
echo "Step 4: Preparing Executive Summary..."
# Find the Executive Summary section in final-memorandum-creac.md
START_LINE=$(grep -n "^## I. EXECUTIVE SUMMARY" final-memorandum-creac.md | head -1 | cut -d: -f1)
END_LINE=$(tail -n +$START_LINE final-memorandum-creac.md | grep -n "^## II\." | head -1 | cut -d: -f1)
END_LINE=$((START_LINE + END_LINE - 1))

echo "## III. EXECUTIVE SUMMARY" > part-03-exec.txt
echo "" >> part-03-exec.txt
cat remediation-outputs/W3-001-executive-summary-trimmed.md >> part-03-exec.txt
echo "" >> part-03-exec.txt

# Step 5: Extract remaining sections and renumber
echo "Step 5: Extracting and renumbering remaining sections..."
# Get everything after Executive Summary
tail -n +$END_LINE final-memorandum-creac.md | \
    sed -e 's/^## VII\./## IX./g' \
        -e 's/^## VI\./## VIII./g' \
        -e 's/^## V\./## VII./g' \
        -e 's/^## IV\./## VI./g' \
        -e 's/^## III\./## V./g' \
        -e 's/^## II\./## IV./g' > part-04-body.txt

# Step 6: Assemble all parts
echo "Step 6: Assembling final document..."
cat part-00-header.txt \
    part-01-questions.txt \
    part-02-answers.txt \
    part-03-exec.txt \
    part-04-body.txt > final-memorandum-v2.md

# Cleanup
rm -f part-*.txt

echo ""
echo "=== ASSEMBLY COMPLETE ==="
echo ""
ls -lh final-memorandum-v2.md
echo ""
wc -l final-memorandum-v2.md
wc -w final-memorandum-v2.md

