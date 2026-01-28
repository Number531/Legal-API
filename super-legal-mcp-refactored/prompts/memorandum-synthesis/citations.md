# CITATION REQUIREMENTS

> **Integration Note:** This document defines citation standards for the legal research system.
> The `citation-validator` agent in legalSubagents.js should enforce these requirements.
> Cross-reference: [state-file-schemas.md](state-file-schemas.md#33-citation-validator-statejson) for citation-validator state file.

---

## VERIFICATION TAGS (CANONICAL DEFINITION)

Every citation MUST include exactly ONE verification tag. Use this authoritative list:

| Tag | When to Use | Format | Example |
|-----|------------|--------|---------|
| `[VERIFIED:url]` | Citation confirmed via online legal database | `[VERIFIED:{database}-{id}]` | `[VERIFIED:Westlaw-2024-WL-123456]` |
| `[VERIFIED:filing]` | Citation confirmed via SEC/court filing | `[VERIFIED:{system}-{filing-id}]` | `[VERIFIED:EDGAR-000123456-24-000789]` |
| `[INFERRED:precedent]` | Applied from similar precedent (no direct cite) | `[INFERRED:precedent-{basis}]` | `[INFERRED:precedent-analogous-fact-pattern]` |
| `[ASSUMED:industry]` | Industry standard practice (no cite available) | `[ASSUMED:industry]` | `[ASSUMED:industry]` |
| `[ASSUMED:legislative-intent]` | Based on legislative history interpretation | `[ASSUMED:legislative-intent]` | `[ASSUMED:legislative-intent]` |
| `[UNVERIFIED:needs-research]` | Citation exists but verification pending | `[UNVERIFIED:needs-research]` | `[UNVERIFIED:needs-research]` |

### Tag Selection Decision Tree

1. Can you confirm via Westlaw/PACER/EDGAR? → `[VERIFIED:url]` or `[VERIFIED:filing]`
2. Is this applying established precedent to new facts? → `[INFERRED:precedent]`
3. Is this industry standard practice? → `[ASSUMED:industry]`
4. Is this interpreting legislative intent? → `[ASSUMED:legislative-intent]`
5. Citation exists but unconfirmed? → `[UNVERIFIED:needs-research]`

**CRITICAL**: citation-validator will flag any citation without a tag. Every footnote needs exactly one tag.

---

## VERIFICATION CONFIRMATION STANDARDS

Each verification tag MUST meet minimum confirmation criteria:

### [VERIFIED:url] Confirmation Requirements

| Criterion | Standard | Evidence Required |
|-----------|----------|-------------------|
| Database access | Must have accessed the database | Include database identifier (e.g., `Westlaw-`) |
| Record match | Citation matches database record | Database-assigned ID (e.g., `2024-WL-123456`) |
| Content verification | Key quote/holding confirmed | Pincite matches database pagination |
| Currency | Record is current (not overruled) | Check negative citator if case law |

**Minimum Evidence**: `[VERIFIED:Westlaw-2024-WL-123456]` includes database name + unique record ID.

**Insufficient**: `[VERIFIED:Westlaw]` (missing specific record ID)

### [VERIFIED:filing] Confirmation Requirements

| Criterion | Standard | Evidence Required |
|-----------|----------|-------------------|
| Filing system | Must identify source system | EDGAR, PACER, state court, etc. |
| Filing identifier | Must include unique ID | CIK + accession number, docket number |
| Document location | Must be locatable | Item number, exhibit, page reference |

**Minimum Evidence**: `[VERIFIED:EDGAR-0001234567-24-000123]` for SEC filings.

**Minimum Evidence**: `[VERIFIED:PACER-SDNY-1:24-cv-01234-Doc-45]` for federal court.

### [INFERRED:precedent] Confirmation Requirements

| Criterion | Standard | Evidence Required |
|-----------|----------|-------------------|
| Source precedent | Must cite actual case/authority | Base case must be verifiable |
| Analogous facts | Must explain factual analogy | "Analogous fact pattern" descriptor |
| Logical extension | Inference must be reasonable | Not contradicted by controlling authority |

**Minimum Evidence**: `[INFERRED:precedent-analogous-corporate-veil-piercing]`

**Must Include**: Parenthetical explaining the inference basis.

### [ASSUMED:industry] Confirmation Requirements

| Criterion | Standard | Evidence Required |
|-----------|----------|-------------------|
| Industry identification | Must specify which industry | M&A, securities, environmental, etc. |
| Standard practice | Must be genuinely widespread | Not unique to one firm/deal |
| No contrary authority | Must not contradict case law | Industry practice cannot override law |

**Minimum Evidence**: `[ASSUMED:industry]` with parenthetical like "(standard M&A practice for environmental escrows)"

### [ASSUMED:legislative-intent] Confirmation Requirements

| Criterion | Standard | Evidence Required |
|-----------|----------|-------------------|
| Legislative history | Must reference actual history | Committee reports, floor debates, etc. |
| Textual basis | Must connect to statutory text | Show how interpretation derives from text |
| Not binding | Must acknowledge assumption status | Cannot state as definitive holding |

**Minimum Evidence**: `[ASSUMED:legislative-intent]` with parenthetical like "(based on Senate Report 94-1310)"

### [UNVERIFIED:needs-research] Requirements

| Criterion | Standard | Evidence Required |
|-----------|----------|-------------------|
| Citation form | Must be complete Bluebook format | Full citation provided |
| Research note | Must explain why unverified | Time constraint, database unavailable, etc. |
| Priority flag | Must indicate if HIGH severity | If supporting HIGH risk finding, flag for priority |

**Minimum Evidence**: `[UNVERIFIED:needs-research]` with note like "(Westlaw access pending; verify before filing)"

---

## VERIFICATION TAG QA SCORING

| Issue | QA Deduction | Criterion Cap | Remediation Required? |
|-------|--------------|---------------|----------------------|
| Missing tag entirely | -0.5% per citation | **-3%** (Verification criterion) | YES (HARD_FAIL_UNVERIFIED if >10%) |
| Tag without proper evidence | -0.25% per citation | **-1%** (Evidence quality) | YES |
| UNVERIFIED on HIGH severity | -1% per citation | **-2%** (Priority research) | YES (priority research) |
| >5% ASSUMED tags | -1% total | N/A (one-time) | NO (but flagged) |
| >10% UNVERIFIED tags | Triggers HARD_FAIL | N/A | YES |

> **Issue-Type Caps Note:** Per memorandum-qa.md, each issue type has a maximum deduction cap
> based on its criterion weight. This prevents a single issue type from wiping out credit
> earned for other citation criteria. See AUTHORITATIVE QA SCORING METHODOLOGY in memorandum-qa.md.

**citation-validator scoring**: Total citation quality score = 100% - (sum of deductions)

Untagged citations will be flagged by citation-validator for remediation.

---

## Citation Validation Scripts

### Automated Extraction
The `extract-citations.py` script extracts all citations and normalizes them to Bluebook 22nd edition format:

```bash
python3 scripts/extract-citations.py final-memorandum.md
```

**Output:** `citation-registry.json` containing:
- All citations with line numbers and types
- Normalized Bluebook format
- Sequential renumbering map
- Low-confidence citations flagged for review

### Automated Tag Scanning
The `scan-citation-tags.py` script validates verification tag coverage:

```bash
python3 scripts/scan-citation-tags.py final-memorandum.md
```

**Output:** `citation-tag-report.json` containing:
- Coverage percentage by tag type
- Missing tags list
- HIGH-severity citations with UNVERIFIED status
- QA deduction calculations

### Exit Codes
| Script | Exit 0 | Exit 1 |
|--------|--------|--------|
| `extract-citations.py` | All citations processed | Low-confidence detected |
| `scan-citation-tags.py` | Coverage ≥90%, no HIGH unverified | Gaps or blocking issues |

---

## Bluebook 22nd Edition Compliance (Gold Standard)

All citations must comply with the Bluebook (22nd ed.) standards expected by Columbia Law-level review.

### Pincite Requirements (MANDATORY)

ALL citations MUST include page/paragraph references:

| Citation Type | Correct Format | Incorrect Format | Deduction |
|---------------|----------------|------------------|-----------|
| Case | *Bestfoods*, 524 U.S. at 66-67 | *Bestfoods*, 524 U.S. 51 | -1% |
| Statute | 42 U.S.C. S 9607(a)(2) | 42 U.S.C. S 9607 (general) | -1% |
| SEC Filing | Form 10-K at 23 | Form 10-K (general) | -1% |
| Regulation | 17 C.F.R. S 240.10b-5(b) | 17 C.F.R. S 240.10b-5 | -1% |

> **QA Scoring Note:** Per memorandum-qa.md, missing pincite deductions are **capped at -2% total**
> (the Pincites criterion weight). No matter how many pincites are missing, the maximum deduction
> for this issue type is -2%, preserving credit for other citation quality criteria.

### Signal Requirements (Bluebook Table 1)

| Signal | Use Case | Example |
|--------|----------|---------|
| (no signal) | Citation directly supports proposition | [Statement]. *Case*, 524 U.S. at 66. |
| *See* | Citation supports proposition, inference required | *See* *Case*, 524 U.S. at 66. |
| *See also* | Additional support beyond primary authority | *See also* *Case*, 524 U.S. at 66. |
| *Cf.* | Analogous support by comparison | *Cf.* *Case*, 524 U.S. at 66. |
| *But see* | Contrary authority (REQUIRED for objectivity) | *But see* *Case*, 524 U.S. at 66. |
| *Compare...with* | Illustrate comparison between authorities | *Compare* [A] *with* [B]. |

### Full vs. Short Form Citations

| Situation | Format | Example |
|-----------|--------|---------|
| First citation | Full form | *United States v. Bestfoods*, 524 U.S. 51, 66-67 (1998) |
| Same case, same footnote | *Id.* | *Id.* at 68. |
| Same case, different footnote | Short form | *Bestfoods*, 524 U.S. at 70. |
| Cross-reference | *Supra* | *See supra* note 12. |

### Parenthetical Requirements

| When Required | Format | Example |
|---------------|--------|---------|
| Case relevance not obvious | Explanatory | (holding that successor liability applies to CERCLA claims) |
| Quoting language | Quote + page | ("[A]ctual control of polluting activity" at 67) |
| Weight of authority | Descriptive | (en banc); (per curiam); (plurality opinion) |
| Adverse authority | Required | *But see* [Case] (rejecting successor liability in asset sales) |

---

## Citation Scope (CRITICAL - PREVENTS OVER-CITATION)

Footnotes cite **external authorities and sources**, NOT internal analysis.

### CITE (Requires Bluebook Footnote):
| Content Type | Example | Why Cite |
|-------------|---------|----------|
| Legal authority | *Akorn v. Fresenius* (Del. Ch. 2018) | External precedent |
| Statute/regulation | 49 U.S.C. S 10101 | External law |
| Agency record | FMCSA BASIC score 72% (SMS Query 12/15/2025) | External data |
| Filing/document | Continental 10-K FY2024, Item 1A | External disclosure |
| Research finding | "USPS contract permits termination for convenience" | External source |

### DO NOT CITE (Self-Evident or Derived):
| Content Type | Example | Why No Cite |
|-------------|---------|-------------|
| Internal calculation | "$910M = 90 days x $10.1M daily revenue" | Math from cited inputs |
| Cross-reference | "See Section IV.F" | Internal reference |
| Summary statement | "The risks discussed above" | Already cited material |
