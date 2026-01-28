# SECTION STRUCTURE REQUIREMENTS

## SECTION WRITER OUTPUT FORMAT

```markdown
## IV.[X]. [SECTION TITLE]

### A. Legal Framework
[Legal framework overview - statutes, regulations, common law]

### B. Application to Transaction (CREAC Structure Required)
[Apply law to facts using CREAC]

### C. Risk Assessment
| Risk | Severity | Probability | Exposure | Mitigation |
|------|----------|-------------|----------|------------|

### D. Cross-Domain Implications
[References to other sections]

### E. Recommendations
[Actionable recommendations]

### F. Section Footnotes
[All footnotes for this section]
```

---

## SECTION HEADER FORMAT ENFORCEMENT (CRITICAL - BLOCKING)

### Canonical Header Format

ALL section headers MUST use exactly **H2** (`##`) with this exact pattern:

```
## IV.[A-Z]. [SECTION TITLE IN CAPS]
```

| Status | Example | Issue |
|--------|---------|-------|
| ✅ Correct | `## IV.A. CMS REGULATORY COMPLIANCE` | H2 with period after letter |
| ❌ Wrong | `# IV.A. CMS REGULATORY COMPLIANCE` | H1 breaks QA section detection |
| ❌ Wrong | `### IV.A. CMS REGULATORY COMPLIANCE` | H3 breaks TOC generation |
| ❌ Wrong | `## IV.A CMS REGULATORY COMPLIANCE` | Missing period breaks regex parsing |

### Why This Matters

The QA diagnostic searches for sections using pattern `^## IV\.[A-Z]\.`. If you use H1 (`#`) instead of H2 (`##`), your section will be **invisible to QA** and flagged as "missing" even though it exists.

### Self-Check Command (MANDATORY before returning COMPLETE)

```bash
# Verify header format - must match correct H2 format
# Replace {X} with your section letter (e.g., A, B, C, etc.)
grep -E "^## IV\.[A-Z]\. [A-Z]" section-IV-{X}-*.md > /dev/null && echo "PASS" || echo "FAIL: Fix header format"

# Alternative: Check specific file
head -1 section-IV-A-cms-regulatory.md | grep -E "^## IV\.[A-Z]\. [A-Z]" && echo "PASS" || echo "FAIL"
```

If this check returns FAIL, fix the header before returning COMPLETE.

---

## CREAC STRUCTURE REQUIREMENTS (Gold Standard)

| Element | Content | Example |
|---------|---------|---------|
| **C**onclusion | State the legal conclusion first | "The transaction likely triggers CFIUS mandatory filing." |
| **R**ule | Cite governing legal authority | "Under 31 CFR S 800.401, mandatory filing is required when..." |
| **E**xplanation | Explain how rule applies generally | "Courts have interpreted this to require filing when..." |
| **A**pplication | Apply rule to specific facts | "Here, the 32% foreign ownership stake exceeds the 25% threshold..." |
| **C**ounter-Analysis | Address opposing arguments | "Target may argue that the passive investment exception applies, however..." |

**Why CREAC over IRAC:** Conclusion-first structure enables busy readers to get the answer immediately. Counter-analysis ensures objectivity and anticipates target's response.

---

## SECTION COMPLETENESS REQUIREMENTS

Each section MUST include:
1. **Legal Framework** (A) - Governing law overview
2. **CREAC Application** (B) - Analysis using CREAC structure
3. **Risk Assessment Table** (C) - Quantified risks with exposure amounts
4. **Cross-Domain References** (D) - Native references to related sections
5. **Recommendations** (E) - Actionable items
6. **Section Footnotes** (F) - All citations for this section

### Word Count Requirements (AUTHORITATIVE)

| Section Type | Minimum | Target | Maximum | When to Use |
|--------------|---------|--------|---------|-------------|
| Standard section | 4,000 | 5,000 | 6,000 | Default for most sections |
| Complex section | 5,000 | 6,000 | 8,000 | See complexity criteria below |

**Complex Section Criteria** (ANY of the following):
- Section involves 3+ regulatory frameworks (e.g., IV-A: CFIUS + export controls + sanctions)
- Section covers multi-jurisdiction analysis (federal + multiple states)
- Section has 5+ HIGH severity risk items
- Section requires counter-party analysis for multiple adverse positions
- Orchestrator explicitly designates as "complex" in invocation

**Default Assumption**: If not designated as complex, use standard word count (4,000-6,000).

### Truncation Detection
| Word Count | Status | QA Action |
|------------|--------|-----------|
| <3,000 | CRITICAL truncation | Automatic REMEDIATE, -5% QA score |
| 3,000-3,999 | WARNING | Flag for review, -2% QA score |
| 4,000-6,000 | ACCEPTABLE (standard) | No penalty |
| 5,000-8,000 | ACCEPTABLE (complex) | No penalty if designated complex |
| 6,001-8,000 | WARNING (if standard) | Review for split, -1% QA score |
| >8,000 | EXCESSIVE | Must split into subsections, -3% QA score |

**IMPORTANT**: Word counts are checked by memo-qa-diagnostic. Section writers should target the middle of their range.
