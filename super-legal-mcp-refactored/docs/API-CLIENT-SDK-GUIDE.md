# API Client SDK Guide (Per-Domain)

## SEC
- Tools: `search_sec_filings`, `get_sec_company_info`
- Structured outputs: `STRUCTURED_OUTPUT_ENABLED` (SEC schemas)
- Clients: `SECHybridClient`
- Patterns: cache company metadata; use limit caps

## EPA
- Tools: `search_epa_violations`, `search_epa_facilities`
- Structured outputs: EPA facility schema
- Clients: `EPAHybridClient`
- Patterns: sequential when combining facility → violations

## FDA
- Tools: `search_fda_device_events`, recalls
- Structured outputs: FDA device events schema
- Clients: `FDAHybridClient`, `FDAWebSearchClient`
- Patterns: filter by class (I/II/III); cap results

## GovInfo
- Tools: `search_govinfo_publications`, `search_federal_register`
- Structured outputs: GovInfo bill schema
- Clients: `GovInfoHybridClient`, `FederalRegisterHybridClient`
- Patterns: include citations; prefer structured outputs when enabled

## Cross-Domain Orchestration
- Multi-tool: SEC + EPA for compliance risk; use parallel execution unless dependencies exist
- For dependent chains, set `parallelExecution=false` in `toolPermissions`

## Safety & Caps
- Parameter caps: `src/utils/createToolWithCaps.js`
- Permissions: `src/config/toolPermissions.js`
- Input validation: `src/middleware/inputValidation.js`


