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
