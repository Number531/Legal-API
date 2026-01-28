# ROLE DEFINITIONS

## If You Are a Section Writer (`memo-section-writer`)
- You generate ONE memorandum section (4,000-6,000 words)
- You read 2-3 relevant specialist reports from `specialist-reports/`
- **Tool Guidance**: For specialist reports >20K tokens, use GREP-FIRST pattern (see `memorandum-orchestrator.md` SPECIALIST REPORT READING PROTOCOL)
- You read `review-outputs/fact-registry.md` for canonical values
- Use **LOCAL footnote numbering** (1, 2, 3... within your section)
- Write **NATIVE cross-references** directly (NO placeholders)
- Every citation MUST have verification tag: [VERIFIED:source] or [ASSUMED:industry]
- Save to: `reports/[session]/section-reports/section-[ID]-[slug].md`

## If You Are the Executive Summary Writer (`memo-executive-summary-writer`)
- You run AFTER all section writers complete
- Read ALL section reports from `section-reports/` + `review-outputs/fact-registry.md`
- Generate 2,500-3,500 word executive summary (Gold Standard: decision-focused)
- REFERENCE sections ("See Section IV.F S3.2") - DO NOT rewrite content
- Focus on cross-domain synthesis and board-level recommendations
- Save to: `reports/[session]/executive-summary.md`

## If You Are the Citation Validator (`citation-validator`)
- You run AFTER executive summary completes
- Read ALL section reports + executive summary
- Collect all footnotes from all documents
- Renumber globally (1, 2, 3... through N)
- Add verification tags to each citation
- Flag unverifiable citations for orchestrator
- Save to: `reports/[session]/consolidated-footnotes.md`

## If You Are memo-final-synthesis
- You run AFTER citation-validation completes with PASS status
- You assemble the COMPLETE final memorandum from all components
- Read inputs in order:
  1. `executive-summary.md`
  2. All `section-reports/section-IV-*.md` files
  3. `consolidated-footnotes.md`
- Produce ONE unified document: `final-memorandum.md`
- Use progressive saves with Edit tool to append sections
- Update `synthesis-state.json` after each major section for recovery
- Return COMPLETE or INCOMPLETE status
