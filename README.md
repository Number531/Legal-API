<p align="center">
  <h1 align="center">Super-Legal MCP Server</h1>
  <p align="center">
    <strong>AI-Powered Legal Research Infrastructure</strong>
  </p>
  <p align="center">
    Transform manual legal research into AI-orchestrated multi-agent workflows.<br/>
    Access 18+ legal databases through 51 specialized tools.
  </p>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node Version"></a>
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/tools-51-orange.svg" alt="Tools">
  <img src="https://img.shields.io/badge/APIs-18+-purple.svg" alt="APIs">
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#available-tools">Tools</a> •
  <a href="#api-keys">API Keys</a> •
  <a href="#documentation">Docs</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Why Super-Legal?

Legal research traditionally requires manually searching multiple databases, cross-referencing citations, and compiling findings—a process that can take hours or days. Super-Legal changes this by:

- **Unified Access**: Query 18+ legal databases through a single interface
- **AI Orchestration**: Claude Agent SDK automatically routes queries to appropriate tools
- **Instant Citations**: Returns structured, citable results ready for legal memoranda
- **Graceful Degradation**: Works with any combination of API keys—enable features as you add credentials

## Quick Start

### 1. Install

```bash
git clone https://github.com/Number531/Legal-API.git
cd Legal-API/super-legal-mcp-refactored
npm install
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env with your API credentials (most are optional)
```

### 3. Add to Claude Desktop

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "super-legal": {
      "command": "node",
      "args": ["/absolute/path/to/super-legal-mcp-refactored/index.js"],
      "env": {
        "COURTLISTENER_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

### 4. Restart Claude Desktop

The server is now available. Try asking:
> "Search for Supreme Court cases about patent eligibility"

---

## Features

| Feature | Description |
|---------|-------------|
| **51 Specialized Tools** | Purpose-built tools across 11 legal domains |
| **18+ Legal Databases** | CourtListener, SEC EDGAR, USPTO, Federal Register, and more |
| **Multi-Agent Orchestration** | Claude Agent SDK with domain-specific specialists |
| **Hybrid Search** | Native APIs + neural-ranked web search via Exa |
| **Production Observability** | Prometheus metrics, Grafana dashboards, OpenTelemetry |
| **Automatic Rate Limiting** | Token bucket algorithm prevents API throttling |
| **Graceful Degradation** | Features enable/disable based on available API keys |

---

## Featured Example: Project Asclepius

A real-world demonstration of Super-Legal's capabilities—transforming a **100KB complex legal query** into a complete **$425M M&A legal due diligence memorandum**.

### The Challenge

Legal due diligence for major acquisitions traditionally requires:
- Teams of attorneys across multiple practice groups
- Weeks of document review and analysis
- Coordination across regulatory, litigation, employment, tax, and insurance domains
- Manual cross-referencing of findings across domains

### The Solution

Super-Legal processes complex queries like this and produces comprehensive, actionable legal analysis:

<details>
<summary><strong>View Input Query Complexity</strong></summary>

The input query ([Example-prompt.md](Example-prompt.md)) contains:

| Metric | Value |
|--------|-------|
| **Query Size** | ~100KB (885 lines) |
| **Transaction Value** | $425,000,000 |
| **Facilities Analyzed** | 12 skilled nursing facilities across 3 states |
| **Risk Items Specified** | 50+ specific legal issues requiring analysis |
| **Legal Domains** | CMS Regulatory, False Claims Act, Employment, Insurance, Commercial, Tax, Privacy |
| **Regulatory Frameworks** | 42 CFR Part 483, 42 USC § 1395nn (STARK), 42 USC § 1320a-7b (AKS), HIPAA |

**Sample Query Complexity:**
```
Transaction: Silver Oak Healthcare acquisition of Sunset Senior Living Group
- 12 SNFs (6 Arizona, 3 Nevada, 3 California)
- 1,650 licensed beds, 1,485 residents (90% occupancy)
- $285M revenue, $52M EBITDA
- Payer mix: Medicare 28%, Medicaid 58%, Private 14%
- 1,850 employees (980 nursing staff)

Critical Issues Requiring Analysis:
- Orange County SFF candidate status (Medicare termination risk)
- Martinez qui tam FCA litigation ($58.7M-$77.2M exposure)
- CMS proposed staffing minimums compliance
- DPNA revenue loss ($1.53M FY2024)
- Medical director FMV/Anti-Kickback analysis
- Insurance coverage gaps
- State license CHOW approvals
- [40+ additional risk items...]
```

</details>

<details>
<summary><strong>View Output Report Details</strong></summary>

### Transaction Overview

| Parameter | Value |
|-----------|-------|
| **Transaction** | Silver Oak Healthcare acquisition of Sunset Senior Living Group |
| **Purchase Price** | $425,000,000 |
| **Target** | 12 skilled nursing facilities (AZ/NV/CA), 1,650 beds, $285M revenue |
| **Report Duration** | ~6 hours end-to-end |

### Generated Deliverables

| Deliverable | Size | Description |
|-------------|------|-------------|
| Final Memorandum | 910KB | 120,929 words (~241 pages) with full legal analysis |
| Executive Summary | 50KB | Board-level briefing with risk matrices |
| 7 Specialist Reports | 64-195KB each | CMS Regulatory, FCA Litigation, Commercial Contracts, Insurance, Employment, Privacy/HIPAA, Tax Structure |
| Cross-Reference Matrix | 3.8MB | 257 findings with 5,200 interconnections |
| Consolidated Footnotes | 557 citations | Bluebook-formatted legal citations |

### Workflow Phases

```
1. Research Planning     → 7 legal domains, 24 critical issues identified
2. Specialist Research   → 7 agents deployed in parallel
3. Validation Gates      → Fact registry, coverage gaps, risk aggregation
4. Section Generation    → CREAC structure, draft contract provisions
5. QA Remediation        → Quality score: 72 → 83/100 (+15%)
6. Final Synthesis       → Complete memorandum assembly
```

### Key Findings

| Metric | Value |
|--------|-------|
| **Probability-Weighted Exposure** | $95M-$114M (22-27% of purchase price) |
| **Material Findings** | 23 across 7 domains |
| **Critical Issues** | Orange County SFF termination risk ($24.6M), FCA settlement ($8-15M) |
| **Recommendation** | PROCEED WITH CONDITIONS |

### Sample Output Structure

```
I.   Executive Summary / Board Briefing
II.  Questions Presented (12 questions in Under/Does/When format)
III. Brief Answers (definitive conclusions with quantified outcomes)
IV.  Detailed Legal Analysis
     A. CMS Regulatory Compliance
     B. False Claims Act Litigation
     C. Commercial Contracts & Change of Ownership
     D. Insurance Coverage & Risk Transfer
     E. Employment & Labor Relations
     F. Data Privacy & HIPAA Compliance
     G. Tax Structure & Optimization
V.   Cross-Reference Matrix
VI.  Consolidated Footnotes (557 citations)
VII. Limitations and Assumptions
```

### Report Location

```
reports/2026-01-26-1737900000/
├── final-memorandum-v2.md           # Complete 241-page memorandum
├── executive-summary.md             # Board briefing
├── research-plan.md                 # Research methodology
├── specialist-reports/              # 7 domain-specific analyses
│   ├── cms-regulatory-compliance-report.md
│   ├── false-claims-act-litigation-report.md
│   ├── commercial-contracts-analysis-report.md
│   ├── insurance-coverage-analysis-report.md
│   ├── employment-labor-analysis-report.md
│   ├── privacy-data-protection-report.md
│   └── tax-structure-analysis-report.md
├── section-reports/                 # Individual memo sections
├── qa-outputs/                      # Quality assurance results
├── remediation-outputs/             # Fixes applied during QA
├── consolidated-footnotes.md        # 557 Bluebook citations
└── xref-matrix.json                 # Cross-domain dependency graph
```

</details>

### Actionable Output

The system doesn't just summarize—it provides **actionable intelligence**:

| Output Type | Example |
|-------------|---------|
| **Risk Quantification** | "Probability-weighted exposure: $95M-$114M (22-27% of purchase price)" |
| **Deal Recommendations** | "PROCEED WITH CONDITIONS: $20M-$28M price reduction + $25M escrow" |
| **Draft Contract Language** | Indemnification clauses, escrow provisions, closing conditions |
| **Cross-Domain Connections** | "Orange County SFF status creates cascading risk across 4 domains" |
| **Specific Actions** | "Verify D&O policy inception date within 48 hours of data room access" |

### Time Comparison

| Approach | Duration | Output Quality |
|----------|----------|----------------|
| **Traditional** (attorney teams) | 2-4 weeks | Varies by team |
| **Super-Legal** (AI-orchestrated) | ~6 hours | 241 pages, 557 citations, QA-verified |

---

## How It Works: Multi-Agent Legal Review

Super-Legal replicates the methodical review process of a top-tier law firm, with specialized AI agents filling the roles of domain experts, reviewers, and quality assurance teams.

<details>
<summary><strong>View Multi-Agent Architecture</strong></summary>

### Phase 1: Research Planning
The orchestrator analyzes the query and creates a research plan, identifying:
- Legal domains requiring analysis
- Critical issues to address
- Cross-domain dependencies
- Specialist assignments

### Phase 2: Parallel Specialist Research

**17 Domain Specialist Agents** work in parallel, each with deep expertise:

| Specialist | Domain | Example Focus Areas |
|------------|--------|---------------------|
| `securities-researcher` | SEC/EDGAR | 10-K filings, risk factors, executive compensation |
| `case-law-analyst` | Litigation | Court opinions, judicial history, case precedent |
| `regulatory-rulemaking-analyst` | Federal Register | Agency rules, CFR, regulatory guidance |
| `employment-labor-analyst` | Employment | WARN Act, NLRA, ERISA, non-competes |
| `tax-structure-analyst` | M&A Tax | Section 338/368, NOLs, state tax |
| `insurance-coverage-analyst` | Coverage | D&O, CGL, E&O, policy interpretation |
| `environmental-compliance-analyst` | EPA | ECHO facilities, permits, violations |
| `privacy-data-protection-analyst` | Privacy | HIPAA, CCPA, GDPR, breach notification |
| `commercial-contracts-analyst` | Contracts | Material contracts, change of control |
| + 8 more specialists | Various | Patents, FDA, CFIUS, cybersecurity, AI governance |

Each specialist produces a **80-120KB research report** with:
- Executive summary (2,000-5,000 words)
- Detailed findings with verification tags
- Risk quantification with methodology disclosure
- Cross-domain impact flags

### Phase 3: Validation Gates

Four sequential validation agents ensure completeness:

```
┌─────────────────────┐
│ V1: Research Review │ → Checks coverage, triggers additional research if gaps found
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ V2: Fact Validator  │ → Creates canonical fact registry, resolves conflicts
└──────────┬──────────┘
           ↓
┌─────────────────────────────────────────┐
│ V3: Coverage Gap    │ V4: Risk          │ → Run in parallel after V2
│     Analyzer        │     Aggregator    │
└─────────────────────────────────────────┘
```

### Phase 4: Section Generation

**Section Writer Agents** generate memorandum sections using CREAC structure:

| Element | Purpose | Example |
|---------|---------|---------|
| **C**onclusion | Answer first | "The transaction likely triggers CFIUS mandatory filing." |
| **R**ule | Legal authority | "Under 31 CFR § 800.401, mandatory filing is required when..." |
| **E**xplanation | How rule applies | "Courts have interpreted this to require filing when..." |
| **A**pplication | Apply to facts | "Here, the 32% foreign ownership stake exceeds the threshold..." |
| **C**ounter-Analysis | Opposing view | "Target may argue the passive investment exception applies, however..." |

Each section: 4,000-6,000 words with local footnotes and verification tags.

### Phase 5: Quality Assurance

**QA Diagnostic Agent** scores the memorandum across dimensions:
- Structural completeness
- CREAC compliance
- Citation verification rate
- Cross-reference density
- Counter-analysis presence

### Phase 6: Remediation (6-Wave Process)

If QA score < 80%, automated remediation executes:

| Wave | Focus | Actions |
|------|-------|---------|
| **Wave 1** | Initialization | Set up state tracking, verify prerequisites |
| **Wave 2** | Executive Summary | Generate Questions Presented (Under/Does/When format), Brief Answers |
| **Wave 3** | Structure | Insert CREAC headers, draft missing provisions, consolidate counter-analysis |
| **Wave 4** | Language | Neutralize advocacy language, add pincites |
| **Wave 5** | Citations | Validate all citations, add verification tags, generate appendices |
| **Wave 6** | Assembly | Merge all outputs into final memorandum |

### Phase 7: Final Synthesis

**Citation Validator** consolidates all footnotes with global numbering (557 citations in Project Asclepius).

**Final Synthesis Agent** assembles the complete memorandum:
- Executive Summary
- Questions Presented & Brief Answers
- 7 detailed analysis sections
- Cross-reference matrix
- Consolidated footnotes

### Quality Standards

| Standard | Implementation |
|----------|----------------|
| **Verification Tags** | Every citation marked `[VERIFIED:source]` or `[ASSUMED:industry]` |
| **Probability Methodology** | All percentages cite derivation (industry data, expert judgment, statutory certainty) |
| **Database Provenance** | Every regulatory ID includes verification status |
| **Cross-Domain Flags** | Findings affecting other domains explicitly flagged |
| **Progressive Saves** | Work saved incrementally to prevent data loss |

</details>

### Why This Matters

This architecture ensures:
- **No gaps**: Validation gates catch missing analysis
- **Consistency**: Fact registry prevents contradictory statements
- **Traceability**: Every claim linked to verified source
- **Objectivity**: Counter-analysis required for all conclusions
- **Quality**: Automated QA with remediation for deficiencies

---

## Zero-Hallucination Citation System

Legal AI must be trustworthy. Super-Legal implements a rigorous citation verification system that ensures **every claim is traceable to a verified source**—eliminating the hallucination problem that plagues general-purpose AI.

<details>
<summary><strong>View Citation Verification Architecture</strong></summary>

### The Problem with Legal AI

General-purpose AI models can "hallucinate"—generating plausible-sounding but fabricated case names, statutes, or holdings. In legal practice, a single fabricated citation can:
- Destroy attorney credibility
- Result in sanctions or malpractice claims
- Cause clients to make decisions based on non-existent law

### Super-Legal's Solution: Mandatory Verification Tags

**Every citation MUST include exactly ONE verification tag:**

| Tag | Meaning | Evidence Required |
|-----|---------|-------------------|
| `[VERIFIED:database-id]` | Confirmed via authoritative database | Database name + unique record ID |
| `[VERIFIED:filing-id]` | Confirmed via SEC/court filing | System + filing identifier |
| `[INFERRED:precedent]` | Applied from verified precedent | Base case must be verifiable |
| `[ASSUMED:industry]` | Industry standard practice | Must not contradict case law |
| `[UNVERIFIED:needs-research]` | Exists but confirmation pending | Flagged for priority review |

### Verification Standards by Source Type

| Source | Required Evidence | Example |
|--------|-------------------|---------|
| **Westlaw/Lexis** | Database + record ID | `[VERIFIED:Westlaw-2024-WL-123456]` |
| **SEC EDGAR** | CIK + accession number | `[VERIFIED:EDGAR-0001234567-24-000789]` |
| **Federal Court** | PACER district + docket | `[VERIFIED:PACER-SDNY-1:24-cv-01234-Doc-45]` |
| **EPA ECHO** | Facility ID | `[VERIFIED:ECHO-OR0001234567]` |
| **USPTO** | Patent/application number | `[VERIFIED:USPTO-10123456]` |

### Database Provenance Requirements

Every regulatory reference includes verifiable identifiers:

```
✅ CORRECT:
"Portland Distillery, TTB ID DSP-OR-20145 [VERIFIED via TTB Public Registry, accessed Jan 26, 2026]"

❌ INCORRECT:
"Portland Distillery holds a valid TTB permit" (no ID, no verification)
```

### Automated Citation Validation

**Scripts enforce compliance:**

```bash
# Extract all citations, normalize to Bluebook format
python3 scripts/extract-citations.py final-memorandum.md
→ Output: citation-registry.json

# Validate verification tag coverage
python3 scripts/scan-citation-tags.py final-memorandum.md
→ Output: citation-tag-report.json
```

**QA Scoring Deductions:**

| Issue | Deduction | Threshold |
|-------|-----------|-----------|
| Missing verification tag | -0.5% per citation | Max -3% |
| Tag without proper evidence | -0.25% per citation | Max -1% |
| UNVERIFIED on HIGH severity finding | -1% per citation | Max -2% |
| >10% UNVERIFIED tags | **HARD FAIL** | Blocks approval |

### Bluebook 22nd Edition Compliance

All citations follow law review standards:

| Requirement | Format | Example |
|-------------|--------|---------|
| **Pincites** | Page/paragraph reference required | *Bestfoods*, 524 U.S. at 66-67 |
| **Signals** | Bluebook Table 1 compliance | *See*, *See also*, *But see*, *Cf.* |
| **Short form** | After first full citation | *Bestfoods*, 524 U.S. at 70 |
| **Parentheticals** | Explain relevance | (holding that successor liability applies) |

### Real Example: Project Asclepius

The $425M healthcare acquisition memorandum contains:

| Metric | Value |
|--------|-------|
| **Total footnotes** | 557 |
| **Verification rate** | 87.1% `[VERIFIED]` |
| **Bluebook compliance** | Full 22nd edition format |
| **Unverified citations** | Flagged for priority research |

### What Gets Cited vs. What Doesn't

**CITE (Requires Bluebook Footnote):**
- Legal authority: *Akorn v. Fresenius* (Del. Ch. 2018)
- Statutes: 42 U.S.C. § 1395nn
- Agency records: CMS SFF List (accessed Jan 26, 2026)
- Filings: Form 10-K FY2024, Item 1A

**DO NOT CITE (Self-Evident):**
- Internal calculations: "$95M = probability × exposure"
- Cross-references: "See Section IV.F"
- Summaries: "The risks discussed above"

### Statistical Claims Require Attribution

Every percentage or quantitative claim must cite a specific source:

```
✅ CORRECT:
"52% of SNFs experience staffing deficiencies (CMS Nursing Home Compare, Q4 2025 data)"

❌ INCORRECT:
"Approximately half of nursing homes have staffing issues" (no source)
```

**If no authoritative source available:**
- State basis explicitly: `[METHODOLOGY: Expert Judgment based on (1) factor, (2) factor]`
- Or: `[METHODOLOGY: Comparable Analysis of N transactions]`

### Probability Methodology Disclosure

Every probability range discloses its derivation:

| Method | Required Format |
|--------|-----------------|
| **Industry precedent** | "15% (based on CMS enforcement data 2020-2025: 47 of 312 similar facilities)" |
| **Regulatory history** | "85% (TTB data: 42 of 50 permit applications approved within 90 days)" |
| **Expert judgment** | "40% `[METHODOLOGY: Expert Judgment based on: (1) no prior violations, (2) remediation plan filed]`" |
| **Statutory certainty** | "100% (mandatory under 42 CFR § 483.80)" |

</details>

### The Result: Trustworthy Legal AI

| Traditional AI | Super-Legal |
|----------------|-------------|
| May fabricate case names | Every case verified via CourtListener/PACER |
| Invents plausible statutes | Every statute traced to GovInfo/eCFR |
| No source traceability | 557 footnotes with database IDs |
| "Sounds right" confidence | Verification tags with audit trail |

**Bottom line:** If Super-Legal can't verify it, it tells you. No fabricated citations. No hallucinated holdings. Every claim traceable to source.

---

## Fact Registry: Single Source of Truth

When multiple specialists analyze the same transaction, conflicting values can emerge. Super-Legal's Fact Registry ensures consistency across the entire memorandum.

<details>
<summary><strong>View Fact Registry Architecture</strong></summary>

### The Problem: Conflicting Data

In complex transactions, different specialists may report different values:
- Securities researcher: "Purchase price: $425M"
- Tax analyst: "Deal value: $430M (including earnout)"
- Employment analyst: "Transaction size: $415M"

Which value should the memorandum use?

### The Solution: Canonical Fact Registry

The **fact-validator agent (V2)** creates `fact-registry.md`—the authoritative source for all quantified values:

```markdown
## CANONICAL FACTS

| Fact ID | Field | Value | Source | Confidence |
|---------|-------|-------|--------|------------|
| F-001 | purchase_price | $425,000,000 | SPA Section 2.1 | HIGH |
| F-002 | employee_count | 1,850 | HR Data Room Doc 4.2.1 | HIGH |
| F-003 | Medicare_revenue_pct | 72% | Management Presentation p.14 | MEDIUM |
```

### Enforcement Rules

| Scenario | Action |
|----------|--------|
| Fact in registry | **Must use registry value exactly** |
| Fact not in registry | Extract from specialist report, note as unverified |
| Conflicting values | **Registry value wins**, note conflict exists |
| CONFLICTED status | Document both values, explain uncertainty |

### Conflict Resolution Hierarchy

When no registry exists and multiple reports conflict:

1. **Most recent iteration wins** (iteration 2 > iteration 1)
2. **Higher confidence wins** (HIGH > MEDIUM > LOW)
3. **Primary source wins** (EDGAR filing > expert opinion > industry estimate)
4. If still tied: Document BOTH values with `[CONFLICTED]` status

### Loop Prevention

If QA flags the same conflict through multiple remediation cycles:

| Cycle | Action |
|-------|--------|
| Cycle 1 | Attempt resolution via section writer |
| Cycle 2 | If same conflict → Mark as `UNRESOLVABLE` |
| Cycle 3+ | **Stop remediation** for this conflict |

Unresolvable conflicts use registry value with notation:
```
[CONFLICT UNRESOLVED - REGISTRY VALUE USED]
```

### Verification Statement

Every section includes:
```
**Fact Registry Verification**: All quantified values in this section verified
against fact-registry.md as of 2026-01-26T14:30:00Z. Values used: purchase_price
($425M), employee_count (1,850), Medicare_revenue_pct (72%).
```

</details>

---

## Actionable Output: Draft Contract Language

Super-Legal doesn't just identify risks—it provides **ready-to-negotiate contract provisions** for every HIGH severity finding.

<details>
<summary><strong>View Draft Contract Language Standards</strong></summary>

### Required Elements for HIGH Severity Findings

| Element | Description | Example |
|---------|-------------|---------|
| **Provision Title** | Descriptive name | "Environmental Indemnification Provision" |
| **Full Legal Text** | Complete contract language | [Actual provision text] |
| **Trigger Condition** | When provision activates | "Upon discovery of undisclosed contamination" |
| **Cap/Basket** | Limitation amounts | "$25M cap, $500K basket" |
| **Survival Period** | Duration post-closing | "60 months from Closing Date" |

### Example Output

```markdown
**DRAFT CONTRACT PROVISION - Medicare Certification Indemnification**

> Seller shall indemnify and hold harmless Buyer from and against any and all
> Losses arising from or related to (i) any termination, suspension, or
> exclusion of any Target Company from participation in Medicare or Medicaid
> programs resulting from events occurring prior to the Closing Date, (ii) any
> civil monetary penalty imposed under 42 U.S.C. § 1320a-7a for conduct
> occurring prior to Closing...

*Trigger*: Medicare/Medicaid adverse action based on pre-closing conduct
*Cap*: $50,000,000 (negotiating position: $75M opening, $50M target, $35M walk-away)
*Basket*: $1,000,000 (mini-basket $100,000)
*Survival*: 72 months from Closing Date (longer than standard due to 5-year FCA lookback)
```

### Negotiation Context

Each provision includes:
- **Opening position**: Where to start negotiations
- **Target**: Realistic outcome
- **Walk-away**: Minimum acceptable terms
- **Rationale**: Why these numbers make sense

### Counter-Party Analysis

Every material finding addresses opposing positions:

```markdown
**Counter-Party Analysis - SFF Designation**

*Target Position*: Target will argue SFF candidate status is temporary and
poses no material risk, citing successful remediation of prior deficiencies.

*Supporting Authority*: CMS SFF graduation statistics show 65% of facilities
exit SFF within 18 months. *See* CMS SFF Program Update (Oct. 2025).

*Acquirer Rebuttal*: Orange County facility has been SFF candidate for 24
months with no improvement trajectory. March 2025 survey approaching with
repeat IJ citations likely. *See* State Survey Report dated Sept. 2024.

*Negotiation Implication*: Seek specific indemnity for Medicare termination
plus escrow equal to facility's annual Medicare revenue ($24.6M).
```

</details>

---

## Intelligent Filtering: Gemini 2.5 Flash Integration

Raw API responses can contain thousands of pages. Super-Legal uses **Gemini 2.5 Flash's 1M context window** to extract only relevant findings before Claude analysis.

<details>
<summary><strong>View Intelligent Filtering Architecture</strong></summary>

### The Problem: Information Overload

A single SEC 10-K filing can be 200+ pages. EPA ECHO returns facility data across dozens of programs. Searching CourtListener may return hundreds of cases.

Sending raw data to Claude:
- Wastes tokens (cost)
- Dilutes relevant findings
- Risks hitting context limits

### The Solution: Domain-Specific Extraction

**GeminiFilterModule** processes raw API data through Gemini's 1M context window:

```
Raw API Response (500KB) → Gemini Filter → Relevant Findings (5KB) → Claude Analysis
```

### 13 Domain-Specific Filter Prompts

| Domain | Filter Focus |
|--------|--------------|
| `securities.js` | Risk factors, material contracts, executive compensation |
| `caseLaw.js` | Holdings, procedural posture, distinguishing facts |
| `environmental.js` | Violations, compliance status, enforcement history |
| `pharmaceutical.js` | FDA actions, adverse events, approval status |
| `patent.js` | Claims, prosecution history, invalidity risks |
| `antitrust.js` | Market concentration, HSR requirements, consent decrees |
| `federalRegister.js` | Proposed rules, effective dates, comment periods |
| `legislation.js` | Bill status, amendments, legislative history |
| `productSafety.js` | Recalls, defect investigations, injury reports |
| `stateCourts.js` | State-specific procedural rules, local precedent |
| `stateStatutes.js` | State law variations, preemption issues |
| `patentAppeals.js` | PTAB decisions, claim construction, IPR outcomes |

### Reliability Features

| Feature | Implementation |
|---------|----------------|
| **Rate Limiting** | Sliding window, 10 req/min |
| **Circuit Breaker** | 3 failures = open, 30s reset |
| **Fallback Mode** | Limited preview when Gemini unavailable |
| **Exponential Backoff** | For rate limit errors |
| **Content Preprocessing** | Strips XBRL, HTML, limits size |

### Example: SEC Filing Processing

```
Input: Apple 10-K (180 pages, 850KB)
Query: "Environmental litigation and compliance risks"

Gemini Filter Output:
- Item 1A Risk Factors: Environmental regulation paragraph (p. 23)
- Item 3 Legal Proceedings: EPA matter (p. 45)
- Item 8 Note 12: Environmental accrual $45M (p. 112)

Tokens saved: ~95% (850KB → 40KB relevant excerpts)
```

</details>

---

## Enterprise Observability

Super-Legal includes production-grade monitoring for enterprise deployments.

<details>
<summary><strong>View Observability Stack</strong></summary>

### Prometheus Metrics

Exported at `/metrics` endpoint:

| Metric | Type | Purpose |
|--------|------|---------|
| `claude_request_duration_ms` | Histogram | Request latency by model/status |
| `claude_tool_duration_ms` | Histogram | Tool execution time |
| `claude_tool_invocations_total` | Counter | Tool usage tracking |
| `claude_tokens_input_total` | Counter | Input token consumption |
| `claude_tokens_output_total` | Counter | Output token consumption |
| `claude_tokens_cached_total` | Counter | Prompt cache hits |
| `claude_circuit_breaker_trips_total` | Counter | Fault tolerance events |
| `claude_errors_total` | Counter | Error tracking by code |
| `claude_structured_output_success_total` | Counter | Schema validation success |

### Alerting Rules

Pre-configured alerts in `prometheus/alerts.yml`:

| Alert | Condition | Severity |
|-------|-----------|----------|
| Tool Error Rate | >5% over 5 minutes | Warning |
| Request Latency P95 | >10 seconds over 10 minutes | Warning |
| Structured Output Failures | >2% over 5 minutes | Critical |
| Circuit Breaker Trips | >3 in 15 minutes | Critical |
| Rate Limit Errors | >10/min over 5 minutes | Warning |

### Grafana Dashboard

Import `grafana/claude-sdk-dashboard.json` for:

- Request latency percentiles (P50/P95/P99)
- Tool error rate by tool name
- Structured output success rate
- Token usage trends
- Circuit breaker status
- Thinking blocks rate

### Structured Logging

JSON logs with automatic secret masking:

```json
{
  "timestamp": "2026-01-26T14:30:00.000Z",
  "request_id": "req_abc123",
  "level": "info",
  "message": "Request completed",
  "latency_ms": 2340,
  "model": "claude-sonnet-4-20250514",
  "tools_called": ["search_sec_filings", "get_case_details"],
  "tokens": {"input": 15420, "output": 3200, "cached": 12000}
}
```

**Masked automatically:** API keys, bearer tokens, SSNs, credit card numbers.

### OpenTelemetry Tracing

Distributed tracing via `@opentelemetry/api`:
- Spans for each request and tool call
- Correlation IDs propagated across services
- Compatible with Jaeger, Zipkin, or cloud providers

</details>

---

## Cost Optimization

Legal research at scale requires cost discipline. Super-Legal implements multiple optimization strategies.

<details>
<summary><strong>View Cost Optimization Strategies</strong></summary>

### Prompt Caching

System prompts and tool definitions are cached:

| Operation | Cost Multiplier |
|-----------|-----------------|
| Cache write | 1.25x input tokens |
| Cache read | **0.1x input tokens** |

**Savings calculation:**
- Baseline: 50,000 input tokens
- With 80% cache hit rate: 50,000 × (0.2 × 1.25 + 0.8 × 0.1) = **16,500 effective tokens**
- **67% cost reduction**

### Model Selection

| Task Type | Model | Rationale |
|-----------|-------|-----------|
| Simple tool calls | Haiku | Fast, cheap, sufficient |
| Standard analysis | Sonnet | Balanced cost/quality |
| Complex reasoning | Opus | Only when necessary |

### Token Discipline

- **Parameter caps**: Enforced limits on search results, page counts
- **Structured outputs**: Reduce retries from parse errors
- **Progressive saves**: Prevent lost work from context exhaustion

### Specialist Report Token Efficiency

| Output Type | Token Budget | Rationale |
|-------------|--------------|-----------|
| Full report | 80-120KB | Saved to file, not returned |
| Return JSON | ~200 tokens | Status only, file path reference |

**17 specialists × 200 tokens = 3,400 tokens** vs **17 × 5,000 = 85,000 tokens** (96% reduction)

### Metrics to Watch

```yaml
# High-value metrics for cost control
claude_tokens_input_total
claude_tokens_output_total
claude_tokens_cached_total
claude_cache_read_tokens_total
claude_cache_creation_tokens_total
```

</details>

---

## Available Tools

<details>
<summary><strong>CourtListener</strong> (13 tools) — Federal court cases, opinions, judges</summary>

| Tool | Description |
|------|-------------|
| `search_cases` | Full-text legal case search with neural ranking |
| `get_case_details` | Detailed case metadata retrieval |
| `lookup_citation` | Citation-based case lookup (e.g., "410 U.S. 113") |
| `search_judges` | Judge biographical and career information |
| `get_judge_details` | Detailed judge appointment and career data |
| `get_court_info` | Court jurisdiction and operational information |
| `list_courts` | Browse available courts |
| `search_opinions` | Full-text court opinion search |
| `search_audio` | Oral argument audio search |
| `get_audio_details` | Audio transcripts and metadata |
| `get_opinion_with_citations` | Opinion citation analysis |
| `search_dockets` | Federal court docket searches |

</details>

<details>
<summary><strong>Financial Disclosures</strong> (9 tools) — Judicial financial records</summary>

| Tool | Description |
|------|-------------|
| `search_financial_disclosures` | Judicial financial disclosure search |
| `get_financial_disclosure_details` | Detailed disclosure documents |
| `search_judge_investments` | Stock and investment holdings |
| `get_judge_gifts` | Gifts received and sources |
| `get_judge_positions` | Outside positions and board memberships |
| `search_judge_spouse_income` | Spouse income disclosures |
| `search_judge_reimbursements` | Travel and expense reimbursements |
| `search_judge_debts` | Debt disclosures |
| `get_disclosure_positions` | Position details |

</details>

<details>
<summary><strong>SEC EDGAR</strong> (4 tools) — Corporate filings and financial data</summary>

| Tool | Description |
|------|-------------|
| `search_sec_filings` | Corporate filing search (10-K, 8-K, proxy statements) |
| `get_sec_company_facts` | XBRL financial data extraction |
| `get_sec_xbrl_frames` | Aggregated XBRL time-series data |
| `search_sec_company_tickers` | Company identifier resolution |

</details>

<details>
<summary><strong>USPTO Patents</strong> (6 tools) — Patent search and classifications</summary>

| Tool | Description |
|------|-------------|
| `search_patents` | Patent search with inventor/assignee filtering |
| `search_patent_locations` | Geographic patent data |
| `search_cpc_classifications` | CPC patent classification hierarchy |
| `search_cpc_groups` | CPC group organization |
| `search_uspc_classifications` | USPC classification search |
| `search_wipo_classifications` | WIPO technology field search |

</details>

<details>
<summary><strong>GovInfo US Code</strong> (4 tools) — United States Code access</summary>

| Tool | Description |
|------|-------------|
| `search_us_code` | US Code search |
| `get_usc_section` | Specific USC section retrieval |
| `get_usc_title_structure` | Title organization and hierarchy |
| `list_usc_titles` | Browse all USC titles |

</details>

<details>
<summary><strong>State Statutes</strong> (1 tool) — All 50 states</summary>

| Tool | Description |
|------|-------------|
| `search_state_statute` | State statute search via neural search |

</details>

<details>
<summary><strong>EPA Environmental</strong> (4 tools) — Compliance and enforcement</summary>

| Tool | Description |
|------|-------------|
| `search_epa_facilities` | EPA ECHO facility search |
| `get_epa_facility_compliance_report` | Compliance history and violations |
| `search_epa_violations` | Facility-specific violations |
| `get_epa_enforcement_actions` | Enforcement and penalty history |

</details>

<details>
<summary><strong>FDA Safety</strong> (3 tools) — Drug, device, and food safety</summary>

| Tool | Description |
|------|-------------|
| `search_fda_drug_adverse_events` | Drug adverse event reports (FAERS) |
| `search_fda_device_events` | Medical device adverse events (MAUDE) |
| `search_fda_food_recalls` | Food recall notices |

</details>

<details>
<summary><strong>Consumer Safety</strong> (2 tools) — Product and vehicle recalls</summary>

| Tool | Description |
|------|-------------|
| `search_cpsc_recalls` | Consumer product safety recalls |
| `search_nhtsa_recalls` | Vehicle and equipment recalls |

</details>

<details>
<summary><strong>FTC Enforcement</strong> (2 tools) — Federal Trade Commission</summary>

| Tool | Description |
|------|-------------|
| `search_ftc_enforcement_actions` | FTC cases and settlements |
| `search_insider_trading` | Insider trading transaction search |

</details>

<details>
<summary><strong>Federal Register</strong> (1 tool) — Regulations and notices</summary>

| Tool | Description |
|------|-------------|
| `search_federal_register` | Federal regulation search |

</details>

<details>
<summary><strong>Cross-Domain Analysis</strong> (1 tool)</summary>

| Tool | Description |
|------|-------------|
| `comprehensive_legal_entity_analysis` | Multi-database entity research |

</details>

---

## API Keys

### Authentication Overview

| API | Key Required | Free Tier | Get Key |
|-----|:------------:|:---------:|---------|
| CourtListener | Recommended | Yes | [courtlistener.com/api](https://www.courtlistener.com/api/) |
| USPTO Patents | Optional | Yes | [patentsview.org](https://patentsview.org/apis/keyrequest) |
| GovInfo | Optional | Yes | [api.govinfo.gov](https://api.govinfo.gov/docs/) |
| Exa | Optional | Limited | [exa.ai](https://exa.ai/) |
| FDA | Optional | Yes | [api.data.gov](https://api.data.gov/signup/) |
| SEC EDGAR | None | — | — |
| Federal Register | None | — | — |
| NHTSA | None | — | — |
| CPSC | None | — | — |

### Environment Variables

```bash
# Required (Highly Recommended)
COURTLISTENER_API_TOKEN=your_token_here

# Optional - Features enable when present
USPTO_API_KEY=your_key_here
GOVINFO_API_KEY=your_key_here
EXA_API_KEY=your_key_here
FDA_API_KEY=your_key_here
```

---

## Project Structure

```
Legal-API/
├── README.md                          # This file
├── CHANGELOG.md                       # Version history
├── .gitignore                         # Git ignore rules
│
└── super-legal-mcp-refactored/        # Main application
    ├── index.js                       # Entry point
    ├── package.json                   # Dependencies
    ├── .env.example                   # Environment template
    │
    ├── src/
    │   ├── api-clients/               # 44 API client implementations
    │   │   ├── CourtListenerClient.js
    │   │   ├── SecEdgarClient.js
    │   │   ├── UsptoClient.js
    │   │   ├── FederalRegisterClient.js
    │   │   ├── GovInfoClient.js
    │   │   ├── ExaClient.js
    │   │   ├── EPAComplianceClient.js
    │   │   ├── FDAWebSearchClient.js
    │   │   └── ...
    │   │
    │   ├── tools/
    │   │   ├── toolDefinitions.js     # MCP tool schemas (51 tools)
    │   │   └── toolImplementations.js # Tool-to-client mappings
    │   │
    │   ├── config/
    │   │   ├── apiConfig.js           # Rate limits, base URLs
    │   │   ├── legalSubagents.js      # Agent definitions
    │   │   └── featureFlags.js        # Feature toggles
    │   │
    │   ├── utils/                     # Utilities
    │   │   ├── rateLimiter.js         # Token bucket rate limiting
    │   │   ├── cache.js               # Request caching
    │   │   ├── circuitBreaker.js      # Fault tolerance
    │   │   └── sdkLogger.js           # Structured logging
    │   │
    │   └── server/
    │       └── EnhancedLegalMcpServer.js
    │
    ├── prompts/                       # Agent prompt templates
    │   ├── memorandum.md
    │   └── memorandum-synthesis/      # Split prompt modules
    │
    ├── docs/                          # 30+ documentation files
    │   ├── ARCHITECTURE_WHITEPAPER.md
    │   ├── DEPLOYMENT.md
    │   ├── OBSERVABILITY.md
    │   └── ...
    │
    ├── scripts/                       # Operational scripts
    ├── tests/                         # Test suites
    ├── prometheus/                    # Alert rules
    └── grafana/                       # Dashboard templates
```

---

## Running the Server

| Command | Description |
|---------|-------------|
| `npm start` | Production mode |
| `npm run dev` | Development with auto-reload |
| `npm run orchestrator` | GPT-5 orchestrator mode |
| `npm run sdk-server` | Claude SDK server mode |
| `npm test` | Run test suite |
| `npm run test:coverage` | Test with coverage report |

---

## Observability

### Prometheus Metrics

Metrics exported at `/metrics`:
- Tool invocation counts and latency
- API error rates by endpoint
- Rate limit hits
- Cache hit/miss ratios

### Grafana Dashboard

Import `grafana/claude-sdk-dashboard.json` for pre-built visualizations.

### Logging

Structured JSON logging with automatic secret masking:

```bash
DEBUG=* npm start
```

---

## Rate Limiting

Automatic rate limiting prevents API throttling:

| API | Limit |
|-----|-------|
| SEC EDGAR | 9 req/sec |
| Federal Register | 5 req/sec |
| USPTO Patents | 40 req/min |
| GovInfo | 9 req/sec |
| Exa | 5 req/sec |
| EPA ECHO | 100 req/min |
| FDA | 240 req/hr (1000 with key) |

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE_WHITEPAPER.md](super-legal-mcp-refactored/docs/ARCHITECTURE_WHITEPAPER.md) | Comprehensive technical design |
| [DEPLOYMENT.md](super-legal-mcp-refactored/docs/DEPLOYMENT.md) | Installation and deployment guide |
| [OBSERVABILITY.md](super-legal-mcp-refactored/docs/OBSERVABILITY.md) | Monitoring and alerting setup |
| [RUNBOOK.md](super-legal-mcp-refactored/RUNBOOK.md) | Operational procedures |
| [COST-OPTIMIZATION.md](super-legal-mcp-refactored/docs/COST-OPTIMIZATION.md) | Token usage and cost analysis |

---

## Troubleshooting

<details>
<summary><strong>Server won't start</strong></summary>

1. Verify Node.js version: `node --version` (must be 18+)
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check for port conflicts
4. Verify `.env` file exists and is properly formatted

</details>

<details>
<summary><strong>Tool returns no results</strong></summary>

1. Verify the required API key is configured
2. Check if the API is experiencing downtime
3. Review rate limit status in logs
4. Try a broader search query

</details>

<details>
<summary><strong>Rate limit errors</strong></summary>

The server handles rate limiting automatically. If you see errors:
1. Wait for the rate limit window to reset
2. Reduce query frequency
3. Check if an API key would increase your limits (e.g., FDA)

</details>

<details>
<summary><strong>Claude Desktop doesn't see the server</strong></summary>

1. Verify the path in `claude_desktop_config.json` is absolute
2. Check JSON syntax (no trailing commas)
3. Restart Claude Desktop completely
4. Check server logs for startup errors

</details>

---

## Contributing

Contributions are welcome! Please see our:

- [Issue Templates](.github/ISSUE_TEMPLATE/) — Report bugs or request features
- [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) — PR guidelines

Before contributing:
1. Read the [Architecture Whitepaper](super-legal-mcp-refactored/docs/ARCHITECTURE_WHITEPAPER.md)
2. Review existing issues and PRs
3. Follow the code style of the project

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [CourtListener](https://www.courtlistener.com/) — Free Law Project
- [SEC EDGAR](https://www.sec.gov/edgar/) — U.S. Securities and Exchange Commission
- [USPTO PatentsView](https://patentsview.org/) — United States Patent and Trademark Office
- [GovInfo](https://www.govinfo.gov/) — U.S. Government Publishing Office
- [Federal Register](https://www.federalregister.gov/) — National Archives
- [Exa](https://exa.ai/) — Neural search
- [Anthropic](https://www.anthropic.com/) — Claude and MCP SDK

---

<p align="center">
  <sub>Built with the <a href="https://modelcontextprotocol.io/">Model Context Protocol</a></sub>
</p>
