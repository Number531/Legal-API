# Enhanced Legal MCP Server - Refactored

A comprehensive legal research MCP (Model Context Protocol) server with modular architecture, providing access to multiple legal databases and APIs.

## 🏗️ Architecture Overview

This refactored version transforms the original monolithic 5000+ line server into a clean, modular architecture:

```
super-legal-mcp-refactored/
├── index.js                           # Main entry point
├── package.json                       # Project configuration
├── src/
│   ├── config/
│   │   └── apiConfig.js               # API configurations and rate limiters
│   ├── utils/
│   │   ├── validation.js              # Input validation helpers
│   │   ├── cache.js                   # Cache management utilities
│   │   └── apiHelpers.js              # Generic API request utilities
│   ├── api-clients/
│   │   ├── CourtListenerClient.js     # CourtListener API client
│   │   ├── FinancialDisclosureClient.js # Financial disclosure client
│   │   ├── SecEdgarClient.js          # SEC EDGAR API client
│   │   ├── FederalRegisterClient.js   # Federal Register API client
│   │   ├── UsptoClient.js             # USPTO Patents API client
│   │   ├── GovInfoClient.js           # GovInfo USC API client
│   │   ├── ExaClient.js               # Exa state statutes client
│   │   └── ComprehensiveAnalysisClient.js # Cross-API analysis
│   ├── tools/
│   │   ├── toolDefinitions.js         # MCP tool schemas
│   │   └── toolImplementations.js     # Tool-to-method mappings
│   └── server/
│       └── EnhancedLegalMcpServer.js  # Core MCP server class
└── config/
    └── all-states-statute-urls.json   # State statute URL configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. **Clone or copy the refactored directory:**
   ```bash
   cd super-legal-mcp-refactored
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```bash
   # Required for CourtListener functionality
   COURTLISTENER_API_TOKEN=your_courtlistener_token_here
   
   # Optional API keys (features will be disabled if not provided)
   USPTO_API_KEY=your_uspto_api_key_here
   GOVINFO_API_KEY=your_govinfo_api_key_here
   EXA_API_KEY=your_exa_api_key_here
   ```

4. **Copy the state configuration file:**
   ```bash
   # Copy from the original directory if available
   cp ../super-legal-mcp/config/all-states-statute-urls.json ./config/
   ```

### Running the Server

```bash
# Standard run
npm start

# Development mode with debugging
npm run dev

# Direct execution
node index.js
```

## 🔧 Configuration

### Phase 4 SDK Cutover (Production)
- Default feature flags now route 100% traffic to the SDK Tool Runner (`SDK_TOOL_RUNNER=true`, `CANARY_PCT=100`, `STRUCTURED_OUTPUTS=true`).
- For staged rollout, adjust `CANARY_PCT` (50 → 75 → 100) and monitor parity/latency before advancing.
- Runbook: see `RUNBOOK.md` for rollback, rate limit handling, and monitoring.
- Monitoring helper: `node scripts/cutover-monitor.js` (configure `METRICS_URL`, `DOMAINS_URL`, `INTERVAL_SEC`, `OUT_PATH`).

### Phase 5 Managed Skills (Document Processing)
- Toggle with `SKILLS_ENABLED=true` (default is `false`).
- Managed skills available: `pdf`, `xlsx`, `docx` (default enabled), `pptx` (default disabled).
- Beta headers required: `code-execution-2025-08-25, skills-2025-10-02`.
- When enabled, the SDK server adds `container.skills` to requests; code execution runs in Anthropic-managed sandbox.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `COURTLISTENER_API_TOKEN` | ⚠️ Recommended | CourtListener API token for full case search functionality |
| `USPTO_API_KEY` | ❌ Optional | USPTO PatentsView API key for patent searches |
| `GOVINFO_API_KEY` | ❌ Optional | GovInfo API key for US Code searches |
| `EXA_API_KEY` | ❌ Optional | Exa API key for state statute searches |

### API Rate Limits

The server automatically handles rate limiting for all APIs:

- **SEC EDGAR**: 9 requests/second (conservative under 10/sec limit)
- **Federal Register**: 5 requests/second
- **USPTO Patents**: 40 requests/minute (conservative under 45/min limit)
- **GovInfo**: 9 requests/second (conservative under 10/sec limit)
- **Exa**: 5 requests/second

## 📚 Available Tools

### CourtListener Tools (13 tools)
- `search_cases` - Search legal cases
- `get_case_details` - Get detailed case information
- `lookup_citation` - Look up cases by citation
- `search_judges` - Search for judges
- `get_judge_details` - Get detailed judge information
- `get_court_info` - Get court information
- `list_courts` - List available courts
- `search_opinions` - Search court opinions
- `search_audio` - Search oral argument audio
- `get_audio_details` - Get audio details with transcripts
- `get_opinion_with_citations` - Get opinions with citation analysis
- `search_dockets` - Search federal court dockets

### Financial Disclosure Tools (9 tools)
- `search_financial_disclosures` - Search judicial financial disclosures
- `get_financial_disclosure_details` - Get detailed disclosure information
- `search_judge_investments` - Search judicial investments
- `get_judge_gifts` - Get gifts received by judges
- `get_judge_positions` - Get positions held by judges
- `search_judge_spouse_income` - Search spouse income disclosures
- `search_judge_reimbursements` - Search judge reimbursements
- `search_judge_debts` - Search judge debt disclosures
- `get_disclosure_positions` - Get positions from disclosures

### SEC EDGAR Tools (4 tools)
- `search_sec_filings` - Search SEC corporate filings
- `get_sec_company_facts` - Get XBRL financial data
- `get_sec_xbrl_frames` - Get aggregated XBRL data
- `search_sec_company_tickers` - Search companies by ticker/name

### Federal Register Tools (1 tool)
- `search_federal_register` - Search federal regulations and notices

### USPTO Patent Tools (6 tools)
- `search_patents` - Search patents, inventors, and assignees
- `search_patent_locations` - Search patent geographic data
- `search_cpc_classifications` - Search CPC patent classifications
- `search_cpc_groups` - Search CPC groups
- `search_uspc_classifications` - Search USPC classifications
- `search_wipo_classifications` - Search WIPO technology fields

### GovInfo USC Tools (4 tools)
- `search_us_code` - Search United States Code
- `get_usc_section` - Get specific USC sections
- `get_usc_title_structure` - Get USC title structure
- `list_usc_titles` - List all USC titles

### State Statute Tools (1 tool)
- `search_state_statute` - Search state statutory law (via Exa)

### EPA Environmental Tools (4 tools)
- `search_epa_facilities` - Search EPA-regulated facilities ⚠️ **[See Important Requirements](#epa-search-requirements)**
- `get_epa_facility_compliance_report` - Get detailed facility compliance history
- `search_epa_violations` - Search specific violations for a facility
- `get_epa_enforcement_actions` - Get enforcement actions for a facility

### FDA Safety Tools (3 tools)
- `search_fda_drug_adverse_events` - Search drug adverse event reports
- `search_fda_device_events` - Search medical device adverse events
- `search_fda_food_recalls` - Search food recall notices

### Consumer Safety Tools (2 tools)
- `search_cpsc_recalls` - Search consumer product recalls
- `search_nhtsa_recalls` - Search vehicle/equipment recalls

### FTC Enforcement Tools (2 tools)
- `search_ftc_enforcement_actions` - Search FTC enforcement actions
- `search_insider_trading` - Search insider trading transactions

### Comprehensive Analysis Tools (1 tool)
- `comprehensive_legal_entity_analysis` - Cross-API entity analysis

**Total: 51 tools across 11 major legal and regulatory databases**

## ⚠️ EPA Search Requirements

### Important: Specific Location Criteria Required

The EPA ECHO API requires specific search criteria to prevent overwhelming result sets. The `search_epa_facilities` tool enforces these requirements:

#### ✅ Valid Search Patterns
- **City-based**: `state + city + company_name`
  ```javascript
  search_epa_facilities({ state: 'PA', city: 'Pittsburgh', company_name: 'steel' })
  ```
- **ZIP-based**: `state + zip_code + company_name`
  ```javascript
  search_epa_facilities({ state: 'PA', zip_code: '15219', company_name: 'chemical' })
  ```
- **Facility-specific**: `facility_name` (with or without state)
  ```javascript
  search_epa_facilities({ facility_name: 'BASF', state: 'PA' })
  ```

#### ❌ Invalid Search Patterns (Will Be Rejected)
- **State-only**: `search_epa_facilities({ state: 'PA' })` - Too broad
- **Generic company**: `search_epa_facilities({ state: 'PA', company_name: 'chemical' })` - Too broad
- **Vague terms**: Company names like "chemical", "manufacturing", "industrial" are too generic

#### Error Handling
If you receive: `"EPA search too broad. Please provide: 1) More specific company name, 2) City name, or 3) ZIP code"`
- Add a city or ZIP code to narrow the search
- Use a more specific company name (minimum 5 characters, not generic terms)
- Consider using facility_name for targeted searches

#### Performance Notes
- Maximum 25 results per query (reduced from 100 to prevent token overflow)
- Searches are limited to essential data columns for efficiency
- Broad queries that would return 100,000+ results are blocked before API call

## 🔄 Migration from Original

The refactored version maintains 100% API compatibility with the original monolithic server while providing:

### ✅ Benefits
- **Modular Architecture**: Easy to maintain and extend
- **Separation of Concerns**: Each API client is independent
- **Better Error Handling**: Isolated error handling per module
- **Improved Testing**: Each module can be tested independently
- **Enhanced Readability**: Code is organized by functionality
- **Easier Deployment**: Clear dependency management

### 🔧 Key Changes
- **File Structure**: Organized into logical modules
- **Rate Limiting**: Centralized configuration
- **Caching**: Enhanced cache management utilities
- **Validation**: Comprehensive input validation
- **Error Handling**: Improved error messages and handling
- **Documentation**: Better code documentation and structure

### 🚀 Performance Improvements
- **Lazy Loading**: API clients are only initialized when needed
- **Memory Management**: Better cache cleanup and management
- **Request Optimization**: Improved API request handling
- **Rate Limit Efficiency**: More intelligent rate limiting

## 🛠️ Development

### Project Structure

Each module has a specific responsibility:

- **`src/config/`**: Configuration and settings
- **`src/utils/`**: Shared utilities and helpers
- **`src/api-clients/`**: Individual API client implementations
- **`src/tools/`**: MCP tool definitions and mappings
- **`src/server/`**: Core MCP server implementation

### Adding New APIs

1. Create a new client in `src/api-clients/`
2. Add tool definitions in `src/tools/toolDefinitions.js`
3. Map tools in `src/tools/toolImplementations.js`
4. Update the server initialization in `src/server/EnhancedLegalMcpServer.js`

### Testing

```bash
# Run the server in development mode
npm run dev

# Test with Claude Desktop or other MCP clients
# The server will output debug information to stderr
```

## 📝 License

MIT License - See the original project for full license details.

## 🤝 Contributing

This refactored version maintains the same functionality as the original while providing a much more maintainable codebase. Contributions are welcome to further improve the modular architecture.

## 📞 Support

For issues related to:
- **Architecture/Refactoring**: Check the module-specific files
- **API Issues**: Check the individual client implementations
- **Configuration**: Review the `src/config/apiConfig.js` file
- **Tool Definitions**: Check `src/tools/toolDefinitions.js`

The refactored architecture makes debugging and maintenance significantly easier than the original monolithic approach.

---

## 🌐 GPT‑5 Orchestrator (August 15, 2025)

This repo includes a backend orchestrator to run the MCP server via OpenAI GPT‑5 (Responses API) with native MCP tools, streaming, and structured outputs.

### Prerequisites
- `OPENAI_API_KEY` (required)
- Optional downstream keys consumed by the MCP server: `COURTLISTENER_API_TOKEN`, `USPTO_API_KEY`, `GOVINFO_API_KEY`, `EXA_API_KEY`

### Run
```bash
npm install
npm run orchestrator
```

Health check:
```bash
curl http://localhost:8089/health | cat
```

Non‑streamed research:
```bash
curl -s -X POST http://localhost:8089/api/gpt5/research \
  -H 'content-type: application/json' \
  -d '{"query":"Find Chapter 11 bankruptcies for chemical manufacturers in Pennsylvania; include DIP/IP retention."}' | cat
```

Notes (OpenAI docs, Aug 15, 2025):
- Use Responses API with `tools: [{ type: "mcp", server_url: "stdio://bash?args=/abs/path/run-legal-mcp.sh" }]`.
- Streaming requires verified organization; fall back to non‑streaming if unavailable.
- For strict deliverables, set `response_format` to `json_schema`.