# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Repository documentation (README.md, CHANGELOG.md)
- GitHub issue and PR templates
- .gitignore for environment files and dependencies

### Security
- Removed committed .env file from tracking
- Removed node_modules from tracking

## [2.0.0] - 2025-01-28

### Added

#### Core Features
- **51 specialized legal research tools** across 11 domains
- **18+ integrated legal databases** including CourtListener, SEC EDGAR, USPTO, Federal Register, GovInfo, EPA, FDA, CPSC, NHTSA, FTC
- **Multi-agent orchestration** via Claude Agent SDK with domain-specific specialists
- **Hybrid search architecture** combining native APIs with neural-ranked web search (Exa)

#### API Clients (44 implementations)
- CourtListener client with web search and hybrid variants
- SEC EDGAR client for corporate filings and XBRL data
- USPTO PatentsView client for patent research
- Federal Register client with hybrid search
- GovInfo client for US Code access
- EPA ECHO client for environmental compliance
- FDA client for drug, device, and food safety data
- CPSC and NHTSA clients for consumer/vehicle recalls
- FTC enforcement actions client
- Comprehensive cross-database analysis client

#### Tools by Domain
- **CourtListener (13 tools)**: Case search, citations, judges, courts, opinions, audio, dockets
- **Financial Disclosures (9 tools)**: Judicial disclosures, investments, gifts, positions, debts
- **SEC EDGAR (4 tools)**: Filings, company facts, XBRL frames, ticker search
- **USPTO Patents (6 tools)**: Patent search, locations, CPC/USPC/WIPO classifications
- **GovInfo USC (4 tools)**: US Code search, sections, title structure
- **State Statutes (1 tool)**: All 50 states via Exa neural search
- **EPA Environmental (4 tools)**: Facilities, compliance, violations, enforcement
- **FDA Safety (3 tools)**: Drug adverse events, device events, food recalls
- **Consumer Safety (2 tools)**: CPSC and NHTSA recalls
- **FTC (2 tools)**: Enforcement actions, insider trading
- **Federal Register (1 tool)**: Regulation search
- **Cross-Domain (1 tool)**: Comprehensive entity analysis

#### Infrastructure
- **Observability stack**: Prometheus metrics, Grafana dashboards, OpenTelemetry tracing
- **Rate limiting**: Token bucket algorithm with per-API configuration
- **Caching**: Request caching with configurable TTL
- **Circuit breaker**: Fault tolerance for failing services
- **Structured logging**: JSON logs with automatic secret masking

#### Claude Agent SDK Integration (Phase 4)
- SDK tool adapter for Claude Agent SDK compatibility
- Structured outputs with Zod schema validation
- Extended thinking capability (thinkTool)
- Managed skills support (PDF, Excel, Docs processing)
- Legal subagent definitions for domain specialists

#### Prompt Architecture (v3.0)
- Split prompt system reducing tokens from 52KB to 19.5KB (81% reduction)
- Modular prompt components (roles, structure, citations, formatting)
- Memorandum orchestrator and synthesis agents
- QA verification and remediation agents

#### Documentation
- Architecture whitepaper (111KB comprehensive design)
- Deployment guide for Claude Desktop, Docker, systemd
- Observability setup guide
- SDK migration runbook
- Cost optimization analysis
- 30+ documentation files

### Changed
- Refactored from monolithic to modular architecture
- Upgraded to ES modules (type: "module")
- Migrated to Claude Agent SDK from legacy implementation

### Technical Details
- Node.js 18+ required
- MCP SDK v0.5.0
- Claude Agent SDK v0.1.61
- Anthropic SDK v0.39.0
- Google Generative AI v0.21.0 (Gemini filtering)

## [1.0.0] - 2024-12-01

### Added
- Initial release
- Basic CourtListener integration
- MCP server implementation

---

[Unreleased]: https://github.com/Number531/Legal-API/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/Number531/Legal-API/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/Number531/Legal-API/releases/tag/v1.0.0
