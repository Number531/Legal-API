# Subagent MCP Tool Access Bug

## Issue Summary

Research subagents are unable to access MCP tools (`mcp__super-legal-tools__*`) and default to native Anthropic WebSearch/WebFetch for all research queries, resulting in:
- Higher token usage
- Less structured data retrieval
- Bypassing specialized legal/regulatory databases (SEC, FDA, EPA, USPTO, CourtListener, etc.)

---

## Root Cause

### The `tools` Field Blocks MCP Inheritance

Per **Claude Agent SDK Documentation (December 2025)**:

> **Tool restrictions**
> | Field | Type | Required | Description |
> | tools | string[] | No | Array of allowed tool names. **If omitted, inherits all tools** |
>
> - **Omit the field**: agent inherits all available tools (default)
> - **Specify tools**: agent can only use listed tools

### Current Code (Problematic)

**File:** `src/config/legalSubagents.js`

```javascript
// Line 57-64
const STANDARD_TOOLS = {
  readOnly: ['Read', 'Grep', 'Glob'],
  withBash: ['Read', 'Grep', 'Glob', 'Bash'],
  withWeb: ['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch'],
  withWrite: ['Read', 'Grep', 'Glob', 'Write', 'Edit'],
  withWriteAndWeb: ['Read', 'Grep', 'Glob', 'Write', 'Edit', 'WebFetch', 'WebSearch']
};

// Line ~1879 (example: securities-research-specialist)
{
  name: 'securities-research-specialist',
  description: '...',
  tools: STANDARD_TOOLS.withWriteAndWeb,  // <-- BLOCKS MCP INHERITANCE
  model: 'sonnet',
  instructions: '...'
}
```

### Impact

| Current Behavior | Expected Behavior |
|------------------|-------------------|
| `tools: STANDARD_TOOLS.withWriteAndWeb` explicitly set | `tools` field omitted |
| Subagent can ONLY use: Read, Grep, Glob, Write, Edit, WebFetch, WebSearch | Subagent inherits ALL tools including MCP |
| MCP tools NOT accessible | MCP tools accessible via `mcp__super-legal-tools__*` |
| All research goes through WebSearch | Research uses structured MCP databases first |

---

## Available MCP Tools (90 Implemented)

When the `tools` field is removed, subagents gain access to all MCP tools below.
All tools are prefixed with `mcp__super-legal-tools__` when accessed by subagents.

---

### CourtListener (Case Law) - 12 Tools
| Tool Name | Description |
|-----------|-------------|
| `search_cases` | Search federal/state court opinions - binding precedent, judicial reasoning |
| `get_case_details` | Get detailed case information by cluster ID |
| `lookup_citation` | Look up legal citations (e.g., '410 U.S. 113') |
| `search_judges` | Search for judges by name, court, appointer |
| `get_judge_details` | Get judge details by ID |
| `get_court_info` | Get court information by abbreviation |
| `list_courts` | List courts by jurisdiction |
| `search_opinions` | Search legal opinions by type, status |
| `search_audio` | Search oral argument audio recordings |
| `get_audio_details` | Get audio details by ID |
| `get_opinion_with_citations` | Get opinion with citation analysis |
| `search_dockets` | Search federal court dockets |

### Financial Disclosure - 9 Tools
| Tool Name | Description |
|-----------|-------------|
| `search_financial_disclosures` | Search judicial financial disclosure documents |
| `get_financial_disclosure_details` | Get disclosure details by ID |
| `search_judge_investments` | Search judicial investments by company/ticker |
| `get_judge_gifts` | Get gifts received by judges |
| `get_judge_positions` | Get positions held by judges (directorships, etc.) |
| `search_judge_spouse_income` | Search spouse income disclosures |
| `search_judge_reimbursements` | Search reimbursements received |
| `search_judge_debts` | Search debts disclosed by judges |
| `get_disclosure_positions` | Get positions from financial disclosures |

### SEC/EDGAR - 4 Tools
| Tool Name | Description |
|-----------|-------------|
| `search_sec_filings` | Search 10-K, 10-Q, 8-K, DEF 14A, S-1 filings |
| `get_sec_company_facts` | Get comprehensive XBRL financial data |
| `get_sec_xbrl_frames` | Get aggregated concept values across companies |
| `search_sec_company_tickers` | Search companies by name/ticker for CIK |

### Federal Register - 6 Tools
| Tool Name | Description |
|-----------|-------------|
| `search_federal_register` | Search agency rules, notices, regulations |
| `search_federal_register_notices` | Search Federal Register notices |
| `search_federal_register_proposed_rules` | Search proposed rules |
| `search_federal_register_final_rules` | Search final rules and regulations |
| `search_federal_register_presidential_documents` | Search executive orders, proclamations |
| `search_federal_register_public_inspection` | Search pre-publication documents |

### USPTO/Patents - 6 Tools
| Tool Name | Description |
|-----------|-------------|
| `search_patents` | Search patents, inventors, assignees |
| `search_patent_locations` | Search patents by geographic location |
| `search_cpc_classifications` | Search Cooperative Patent Classification |
| `search_cpc_groups` | Search CPC groups (detailed) |
| `search_uspc_classifications` | Search US Patent Classification |
| `search_wipo_classifications` | Search WIPO technology fields |

### PTAB (Patent Trial & Appeal Board) - 6 Tools
| Tool Name | Description |
|-----------|-------------|
| `search_ptab_proceedings` | Search IPR, PGR, CBM, Appeals |
| `get_ptab_decisions` | Get institution/final decisions |
| `search_ptab_ipr_proceedings` | Search Inter Partes Review proceedings |
| `search_ptab_pgr_proceedings` | Search Post-Grant Review proceedings |
| `search_ptab_cbm_proceedings` | Search Covered Business Method proceedings |
| `search_all_ptab_aia_proceedings` | Search all AIA proceedings |

### GovInfo (US Code) - 4 Tools
| Tool Name | Description |
|-----------|-------------|
| `search_us_code` | Natural language search of USC |
| `get_usc_section` | Get specific USC section text |
| `get_usc_title_structure` | Get title chapter/section structure |
| `list_usc_titles` | List all USC titles with descriptions |

### FDA - 12 Tools
| Tool Name | Description |
|-----------|-------------|
| `search_fda_drug_adverse_events` | Search FAERS database for drug adverse events |
| `search_fda_device_events` | Search MAUDE database for device events |
| `search_fda_drug_labels` | Search drug labels/prescribing information |
| `search_fda_recalls` | Search drug, device, food recalls |
| `search_fda_warning_letters` | Search FDA warning letters |
| `search_fda_drug_safety_communications` | Search drug safety communications |
| `search_fda_device_safety_communications` | Search device safety communications |
| `search_fda_drug_shortages` | Search current/resolved drug shortages |
| `search_fda_510k` | Search 510(k) premarket notifications |
| `search_fda_pma_approvals` | Search PMA approvals (high-risk devices) |
| `search_fda_orange_book` | Search drug patents and exclusivities |
| `search_fda_purple_book` | Search biologics and biosimilars |

### EPA - 3 Tools
| Tool Name | Description |
|-----------|-------------|
| `search_epa_facilities` | Search EPA-regulated facilities (ECHO) |
| `search_epa_violations` | Search facility violations |
| `get_epa_facility_compliance_report` | Get detailed compliance report |

### FTC - 6 Tools
| Tool Name | Description |
|-----------|-------------|
| `search_ftc_enforcement_cases` | Search enforcement actions, consent orders |
| `search_ftc_competition_matters` | Search antitrust, mergers, HSR filings |
| `search_ftc_guidance_policy` | Search guidance, advisory opinions |
| `search_ftc_rulemaking` | Search proposed and final rules |
| `search_ftc_consumer_alerts` | Search consumer fraud warnings |
| `search_ftc_news` | Search press releases, announcements |

### CPSC (Consumer Product Safety) - 7 Tools
| Tool Name | Description |
|-----------|-------------|
| `search_cpsc_recalls` | Search product recalls by hazard, product |
| `search_cpsc_enforcement` | Search violations, penalties |
| `search_cpsc_business_guidance` | Search manufacturing guidance |
| `search_cpsc_safety_standards` | Search mandatory/voluntary standards |
| `search_cpsc_injury_data` | Search NEISS injury data |
| `search_cpsc_news` | Search press releases |
| `search_cpsc_reports_studies` | Search research and reports |

### NHTSA (Vehicle Safety) - 6 Tools
| Tool Name | Description |
|-----------|-------------|
| `nhtsa_decode_vin` | Decode VIN for vehicle information |
| `nhtsa_models_for_make` | Get models for manufacturer |
| `nhtsa_recalls_by_vin` | Find recalls by VIN |
| `nhtsa_recalls_by_make_model_year` | Find recalls by make/model/year |
| `nhtsa_search_complaints` | Search consumer complaints |
| `nhtsa_safety_ratings` | Get NCAP 5-star safety ratings |

### State Court Rules - 12 Tools
| Tool Name | Description |
|-----------|-------------|
| `search_court_rules` | Search state court rules |
| `get_formatting_requirements` | Get document formatting requirements |
| `get_electronic_filing_rules` | Get e-filing technical requirements |
| `search_local_rules` | Search county/district local rules |
| `get_court_specific_procedures` | Get court-specific procedures |
| `check_rule_updates` | Check for recent rule changes |
| `get_document_templates` | Get state-specific templates |
| `validate_document_compliance` | Check document compliance |
| `get_citation_requirements` | Get citation format requirements |
| `get_discovery_rules` | Get discovery rules |
| `get_appellate_requirements` | Get appellate brief requirements |
| `get_emergency_procedures` | Get TRO/injunction procedures |

### State Statutes - 1 Tool
| Tool Name | Description |
|-----------|-------------|
| `search_state_statute` | Search state statutes (all 50 states + DC) |

### Comprehensive Analysis - 1 Tool
| Tool Name | Description |
|-----------|-------------|
| `comprehensive_legal_entity_analysis` | Cross-database analysis for entities |

### Filing Draft - 1 Tool
| Tool Name | Description |
|-----------|-------------|
| `draft_legal_filing` | Generate structured legal filing drafts |

### Utility - 1 Tool
| Tool Name | Description |
|-----------|-------------|
| `think` | Pause and reason through complex problems |

---

## Implementation Fix

### Part 1: Update MCP_FALLBACK_INSTRUCTIONS (~65 lines)

**File:** `src/config/legalSubagents.js`
**Location:** After line 651 (end of current MCP_FALLBACK_INSTRUCTIONS)

Add the following sections to the `MCP_FALLBACK_INSTRUCTIONS` template string:

```javascript
const MCP_FALLBACK_INSTRUCTIONS = `
## MCP TOOL FALLBACK PROTOCOL (CRITICAL)

When using domain-specific MCP tools (SEC, FDA, EPA, USPTO, CourtListener, etc.):

### If MCP Tool Fails or Returns No Results:
1. **Do NOT give up** - Immediately fall back to WebSearch/WebFetch
2. **Use WebSearch extensively** to find the same information from authoritative sources
3. **Use WebFetch** to retrieve content from official government websites directly

### Fallback Search Strategies by Domain:
- **SEC/EDGAR failures** → WebSearch: "[company name] SEC filing [form type] site:sec.gov"
- **FDA/FAERS failures** → WebSearch: "[drug name] FDA approval site:fda.gov" OR WebFetch: accessdata.fda.gov
- **EPA/ECHO failures** → WebSearch: "[facility name] EPA enforcement site:epa.gov"
- **USPTO failures** → WebSearch: "[patent number] OR [inventor] site:patents.google.com"
- **CourtListener failures** → WebSearch: "[case name] court opinion site:courtlistener.com OR site:law.justia.com"
- **Federal Register failures** → WebSearch: "[rule topic] Federal Register site:federalregister.gov"

### When to Use WebSearch vs WebFetch:
- **WebSearch**: When you need to discover documents or don't know exact URLs
- **WebFetch**: When you know the specific URL or need to extract content from a known page

### Documentation Requirements:
- Log which MCP tools failed and why in the Source Verification Log
- Note "Fallback: WebSearch" or "Fallback: WebFetch" in the access method column
- Include the search queries or URLs used as fallback

### NEVER report "unable to retrieve" without attempting WebSearch fallback first.

## MCP TOOL REFERENCE (Use These First)

**Legal/Case Law:**
- mcp__super-legal-tools__search_cases - CourtListener case law
- mcp__super-legal-tools__lookup_citation - Citation lookup
- mcp__super-legal-tools__search_opinions - Court opinions
- mcp__super-legal-tools__search_dockets - Docket search

**SEC/Financial:**
- mcp__super-legal-tools__search_sec_filings - SEC EDGAR filings
- mcp__super-legal-tools__get_sec_company_facts - Company XBRL facts
- mcp__super-legal-tools__search_financial_disclosures - Financial disclosures

**Federal Regulatory:**
- mcp__super-legal-tools__search_federal_register - Federal Register
- mcp__super-legal-tools__search_federal_register_notices - FR notices
- mcp__super-legal-tools__search_federal_register_proposed_rules - Proposed rules
- mcp__super-legal-tools__search_federal_register_final_rules - Final rules

**FDA:**
- mcp__super-legal-tools__search_fda_drug_adverse_events - FDA FAERS
- mcp__super-legal-tools__search_fda_device_events - Device events
- mcp__super-legal-tools__search_fda_drug_labels - Drug labels
- mcp__super-legal-tools__search_fda_recalls - FDA recalls
- mcp__super-legal-tools__search_fda_warning_letters - Warning letters

**EPA:**
- mcp__super-legal-tools__search_epa_facilities - EPA facilities
- mcp__super-legal-tools__search_epa_violations - EPA violations

**FTC:**
- mcp__super-legal-tools__search_ftc_enforcement_cases - FTC enforcement
- mcp__super-legal-tools__search_ftc_competition_matters - Competition matters

**USPTO/Patents:**
- mcp__super-legal-tools__search_patents - Patent search
- mcp__super-legal-tools__search_ptab_proceedings - PTAB proceedings

**Product Safety:**
- mcp__super-legal-tools__search_cpsc_recalls - CPSC recalls
- mcp__super-legal-tools__nhtsa_recalls_by_vin - NHTSA recalls

**State Law:**
- mcp__super-legal-tools__search_state_statute - State statutes
- mcp__super-legal-tools__search_court_rules - Court rules

## ENRICHMENT PROTOCOL (After MCP Success)

After retrieving structured data from MCP tools, use WebSearch/WebFetch to enrich findings:

### 1. News & Recent Developments
- WebSearch: "[company/entity] news [topic] 2024 2025"
- Captures events not yet in regulatory databases

### 2. Analyst Commentary & Market Context
- WebSearch: "[company] analyst report [issue]"
- Provides market perspective on findings

### 3. Company Statements & Press Releases
- WebFetch: Company investor relations pages, press releases
- Captures management's public position

### 4. Related Litigation & Enforcement
- WebSearch: "[company] lawsuit [topic]" OR "[company] enforcement action"
- Finds cases not yet indexed in CourtListener

### Documentation
- Cite enrichment sources separately from MCP database sources
- Mark as "Enrichment: WebSearch" or "Enrichment: WebFetch" in source log

CRITICAL: MCP tools provide structured, authoritative data. WebSearch/WebFetch provide context and recency.
`;
```

### Part 2: Comment Out `tools` Field from Research Specialists (17 lines)

**File:** `src/config/legalSubagents.js`

For each of the 17 research specialists, comment out or remove the `tools:` line:

#### Before (Current - Broken):
```javascript
{
  name: 'securities-research-specialist',
  description: 'Securities law research specialist for M&A due diligence',
  tools: STANDARD_TOOLS.withWriteAndWeb,  // <-- REMOVE THIS LINE
  model: 'sonnet',
  instructions: `...`
}
```

#### After (Fixed):
```javascript
{
  name: 'securities-research-specialist',
  description: 'Securities law research specialist for M&A due diligence',
  // tools field omitted - inherits all tools including MCP
  model: 'sonnet',
  instructions: `...`
}
```

### Research Specialists to Modify

| Agent Name | Approximate Line |
|------------|------------------|
| securities-research-specialist | ~1879 |
| case-law-research-specialist | ~2050 |
| patent-research-specialist | ~2220 |
| pharma-research-specialist | ~2390 |
| environmental-research-specialist | ~2560 |
| antitrust-research-specialist | ~2730 |
| tax-research-specialist | ~2900 |
| employment-research-specialist | ~3070 |
| real-estate-research-specialist | ~3240 |
| bankruptcy-research-specialist | ~3410 |
| government-contracts-specialist | ~3580 |
| insurance-research-specialist | ~3750 |
| product-liability-specialist | ~3920 |
| data-privacy-specialist | ~4090 |
| international-trade-specialist | ~4260 |
| healthcare-research-specialist | ~4430 |
| financial-services-specialist | ~4600 |

---

## Expected Behavior After Fix

### Research Flow

```
Research Request
    │
    ▼
┌─────────────────────────────────────┐
│ 1. Try MCP Tool (Primary)           │
│    e.g., search_sec_filings         │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 2. MCP Returns Results?             │
│    YES → Use structured data        │
│    NO  → Fall back to WebSearch     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 3. Enrichment (Optional)            │
│    WebSearch for news, commentary   │
│    WebFetch for specific URLs       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 4. Compile Research Report          │
│    MCP data + Enrichment sources    │
└─────────────────────────────────────┘
```

### Before vs After

| Metric | Before (Broken) | After (Fixed) |
|--------|-----------------|---------------|
| MCP tool access | Blocked | Enabled |
| Primary research method | WebSearch only | MCP tools first |
| Structured data retrieval | None | Full database access |
| Token usage | Higher (WebSearch verbose) | Lower (MCP structured) |
| Cross-domain research | Limited | Full 90-tool access |

---

## Verification Steps

### 1. Test MCP Access
After implementing the fix, verify that a research specialist can access MCP tools:

```javascript
// Test query to securities-research-specialist
// Should see tool calls to: mcp__super-legal-tools__search_sec_filings
// Instead of: WebSearch calls to "site:sec.gov"
```

### 2. Monitor Tool Usage
Check logs for:
- `mcp__super-legal-tools__*` tool invocations (should increase)
- `WebSearch` calls (should decrease for primary research)
- `WebFetch` calls (should be used for enrichment)

### 3. Token Usage Comparison
Compare token usage before/after for similar research queries:
- Expect 20-40% reduction in tokens for structured data queries
- WebSearch tokens should shift from primary to enrichment use

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Agents misuse Bash | Low | Prompts are research-focused, no Bash instructions |
| Tool selection confusion (90 tools) | Low | MCP_FALLBACK_INSTRUCTIONS guides prioritization |
| Breaking existing behavior | Low | Adding capabilities, not removing |
| Prompt too long | Low | ~65 lines added to shared instructions |

---

## Rollback Procedure

If issues arise, restore the `tools` field to affected agents:

```javascript
// Rollback: Re-add tools restriction
{
  name: 'securities-research-specialist',
  tools: STANDARD_TOOLS.withWriteAndWeb,  // Restore this line
  model: 'sonnet',
  ...
}
```

---

## References

- Claude Agent SDK Documentation (December 2025): Tool restrictions and inheritance
- `src/config/legalSubagents.js`: Agent definitions and STANDARD_TOOLS
- `src/tools/toolDefinitions.js`: Full list of 90 MCP tool definitions
- `src/utils/agentSdkToolAdapter.js`: MCP tool naming convention (`mcp__super-legal-tools__*`)
