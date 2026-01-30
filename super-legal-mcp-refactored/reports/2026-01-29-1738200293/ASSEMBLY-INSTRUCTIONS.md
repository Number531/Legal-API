# ASSEMBLY INSTRUCTIONS - Manual Approach Required

## Problem Identified

The remediation output files (W1-W5) are too large (>100KB each) to read with the Agent SDK Read tool, which has a 25k token limit and tokenizes entire files before chunking.

## Available Remediation Files

Based on Glob results, we have:
- **Wave 1 (CREAC)**: W1-CREAC-001.md, W1-CREAC-002.md, W1-CREAC-004.md, W1-CREAC-005.md, W1-CREAC-006.md
- **Wave 2 (Content)**: W2-QP-001.md, W2-QP-002.md, W2-RISK-001 through W2-RISK-006.md, W2-PROV-001/002/003.md
- **Wave 3 (Citations)**: W3-TAG-001.md, W3-PINCITE-001.md, W3-PAREN-001.md (appear to be analysis only, no edits)
- **Wave 4 (Quality)**: W4-XREF-001.md, W4-FMT-001.md, W4-PROV-004/005.md, W4-BRIEF-001.md, W4-OBJ-001.md, W4-QUANT-001.md
- **Wave 5 (Polish)**: W5-TOC-001.md, W5-FOOT-001.md, W5-SCENARIO-001.md, W5-CITE-001/002.md

## Recommended Solution

### Option 1: Use Python Script Directly (Recommended)

The `assemble-memorandum.py` script has been created and should be able to handle this task by:
1. Reading files using native Python file operations (not Agent SDK Read)
2. Applying edits systematically
3. Generating assembly report

**To execute:**
```bash
cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293
python3 assemble-memorandum.py
```

### Option 2: Agent-Based Chunked Approach

If the Python script fails, an agent would need to:
1. Use Grep to extract specific sections from remediation files
2. Use Edit tool to apply changes one at a time to final-memorandum-v2.md
3. Process in order: W1 → W2 → W3 → W4 → W5

## Key Challenge

The original `final-memorandum.md` is 858,920 bytes (~215k tokens when tokenized), which exceeds the Read tool's capacity. This means:
- Cannot read the full file for analysis
- Must use Edit tool for targeted replacements
- Must copy file first, then apply edits incrementally

## Next Steps

Since I (revision-agent) cannot execute Python scripts directly and cannot read the large files with available tools, I recommend:

1. **USER ACTION REQUIRED**: Execute the Python script manually:
   ```bash
   python3 /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293/assemble-memorandum.py
   ```

2. **Alternative**: Request a different agent with Bash execution capabilities to run the script

3. **Manual Alternative**: If automated approach fails, provide specific section-by-section assembly instructions

## Assembly Script Features

The `assemble-memorandum.py` script includes:
- Automatic detection of edit formats (EDITED_START/EDITED_END vs ## EDIT blocks)
- Wave-by-wave processing with progress saves
- Comprehensive verification (CREAC structures, risk tables, provisions, citations, etc.)
- Detailed assembly report generation
- Error handling and logging

## Expected Outputs

When successfully executed:
1. **final-memorandum-v2.md** - Assembled memorandum with all remediations applied
2. **assembly-report.md** - Detailed report with statistics, verification results, and any failures

