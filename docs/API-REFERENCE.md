# Super-Legal API Reference

Complete reference for all 51 tools available in the Super-Legal MCP Server.

---

## Table of Contents

- [CourtListener Tools](#courtlistener-tools)
- [SEC EDGAR Tools](#sec-edgar-tools)
- [Federal Register Tools](#federal-register-tools)
- [USPTO Patent Tools](#uspto-patent-tools)
- [PTAB Tools](#ptab-tools)
- [US Code Tools](#us-code-tools)
- [FTC Tools](#ftc-tools)
- [EPA Tools](#epa-tools)
- [FDA Tools](#fda-tools)
- [CPSC Tools](#cpsc-tools)
- [NHTSA Tools](#nhtsa-tools)
- [Court Rules Tools](#court-rules-tools)
- [State Law Tools](#state-law-tools)
- [Analysis Tools](#analysis-tools)

---

## CourtListener Tools

### search_cases
Search federal and state court opinions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search terms, phrases, party names |
| court | string | No | Court code (e.g., 'scotus', 'ca9') |
| limit | number | No | Results limit (max 5) |
| date_filed_after | string | No | YYYY-MM-DD format |
| date_filed_before | string | No | YYYY-MM-DD format |
| include_snippet | boolean | No | 500-char preview (default: true) |
| include_full_text | boolean | No | Complete document (default: false) |

### get_case_details
Get detailed case information by ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| case_id | number | Yes | CourtListener case cluster ID |

### lookup_citation
Look up cases by legal citation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| citation | string | Yes | Citation (e.g., '410 U.S. 113') |
| limit | number | No | Results limit (max 5) |
| include_snippet | boolean | No | Include preview |
| include_full_text | boolean | No | Include full opinion |

### search_judges
Search for judges by name or attributes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Judge's name |
| court | string | No | Court code |
| appointer | string | No | Appointing authority |
| selection_method | string | No | Selection method code |
| political_affiliation | string | No | Political affiliation |

### search_opinions
Search legal opinions with filters.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| type | string | No | Opinion type (lead, dissent, etc.) |
| status | string | No | Published, Unpublished, etc. |
| per_curiam | boolean | No | Per curiam filter |

### search_dockets
Search court dockets.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| court | string | No | Court code |
| date_filed_after | string | No | Date filter |

### search_audio
Search oral argument audio recordings.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | No | Case name or topic |
| court | string | No | Court code |
| judge_name | string | No | Judge filter |
| has_transcript | boolean | No | Transcript available |

---

## SEC EDGAR Tools

### search_sec_filings
Search SEC filings with filters.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| form_type | string | No | Form type (10-K, 10-Q, 8-K, etc.) |
| cik | string | No | Company CIK number |
| date_from | string | No | Start date |
| date_to | string | No | End date |
| include_snippet | boolean | No | Preview text |
| include_full_text | boolean | No | Complete filing |

### get_sec_company_facts
Get structured XBRL facts for a company.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cik | string | Yes | Company CIK number |

### get_sec_xbrl_frames
Get XBRL data across companies.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| taxonomy | string | Yes | Taxonomy (us-gaap, dei, etc.) |
| tag | string | Yes | Concept tag |
| unit | string | Yes | Unit of measure |
| period | string | Yes | Period (CY2023, CY2023Q1) |

### search_sec_company_tickers
Search for company tickers and CIKs.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Company name or ticker |

---

## Federal Register Tools

### search_federal_register
Search Federal Register documents.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| agencies | array | No | Agency filter |
| type | string | No | Document type |
| date_from | string | No | Start date |
| date_to | string | No | End date |

### search_federal_register_notices
Search agency notices.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |

### search_federal_register_proposed_rules
Search proposed rules (NPRMs).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |

### search_federal_register_final_rules
Search final rules.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |

### search_federal_register_presidential_documents
Search executive orders and proclamations.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |

---

## USPTO Patent Tools

### search_patents
Search USPTO patent database.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| patent_number | string | No | Specific patent number |
| application_number | string | No | Application number |
| assignee | string | No | Patent assignee |
| inventor | string | No | Inventor name |
| date_from | string | No | Start date |
| date_to | string | No | End date |

### search_cpc_classifications
Search Cooperative Patent Classifications.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Technology description |

### search_uspc_classifications
Search US Patent Classifications.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Technology description |

### search_wipo_classifications
Search WIPO international classifications.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Technology description |

---

## PTAB Tools

### search_ptab_proceedings
Search all PTAB proceedings.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| patent_number | string | No | Patent number |
| proceeding_type | string | No | IPR, PGR, CBM |
| status | string | No | Proceeding status |

### get_ptab_decisions
Get PTAB decisions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| proceeding_number | string | Yes | Proceeding number |

### search_ptab_ipr_proceedings
Search Inter Partes Reviews.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| patent_number | string | No | Patent number |

### search_ptab_pgr_proceedings
Search Post-Grant Reviews.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| patent_number | string | No | Patent number |

### search_ptab_cbm_proceedings
Search Covered Business Method reviews.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| patent_number | string | No | Patent number |

---

## US Code Tools

### search_us_code
Search United States Code.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| title | number | No | USC title number |

### get_usc_section
Get specific USC section.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | number | Yes | Title number |
| section | string | Yes | Section number |

### get_usc_title_structure
Get structure of a USC title.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | number | Yes | Title number |

### list_usc_titles
List all USC titles.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | - | - | No parameters required |

---

## FTC Tools

### search_ftc_enforcement_cases
Search FTC enforcement actions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |

### search_ftc_competition_matters
Search FTC competition matters.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |

### search_ftc_guidance_policy
Search FTC guidance and policy.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |

### search_ftc_rulemaking
Search FTC rulemaking activities.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |

### search_ftc_consumer_alerts
Search FTC consumer alerts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |

---

## EPA Tools

### search_epa_facilities
Search EPA-regulated facilities.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Facility name or location |
| state | string | No | State code |

### search_epa_violations
Search EPA violations.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| facility_id | string | No | Facility ID |

### get_epa_facility_compliance_report
Get facility compliance report.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| facility_id | string | Yes | EPA facility ID |

---

## FDA Tools

### search_fda_drug_adverse_events
Search drug adverse event reports.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Drug name or event |

### search_fda_device_events
Search medical device adverse events.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Device or event |

### search_fda_drug_labels
Search drug labeling information.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Drug name |

### search_fda_recalls
Search FDA recalls.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Product or company |
| classification | string | No | Class I, II, III |

### search_fda_warning_letters
Search FDA warning letters.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Company or subject |

### search_fda_510k
Search 510(k) clearances.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Device or applicant |

### search_fda_pma_approvals
Search PMA approvals.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Device or applicant |

### search_fda_orange_book
Search Orange Book (drugs).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Drug name |

### search_fda_purple_book
Search Purple Book (biologics).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Biologic name |

---

## CPSC Tools

### search_cpsc_recalls
Search CPSC product recalls.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Product or company |
| recall_date_from | string | No | Start date |

### search_cpsc_enforcement
Search CPSC enforcement actions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Company or product |

### search_cpsc_safety_standards
Search CPSC safety standards.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Product category |

### search_cpsc_injury_data
Search CPSC injury statistics.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Product or injury type |

---

## NHTSA Tools

### nhtsa_decode_vin
Decode vehicle VIN.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| vin | string | Yes | Vehicle VIN |

### nhtsa_recalls_by_vin
Get recalls for a VIN.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| vin | string | Yes | Vehicle VIN |

### nhtsa_recalls_by_make_model_year
Get recalls by vehicle info.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| make | string | Yes | Vehicle make |
| model | string | Yes | Vehicle model |
| year | number | Yes | Model year |

### nhtsa_search_complaints
Search safety complaints.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| make | string | No | Vehicle make |
| model | string | No | Vehicle model |

### nhtsa_safety_ratings
Get vehicle safety ratings.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| make | string | Yes | Vehicle make |
| model | string | Yes | Vehicle model |
| year | number | Yes | Model year |

---

## Court Rules Tools

### search_court_rules
Search court rules and procedures.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Rule topic |
| court | string | No | Specific court |

### get_formatting_requirements
Get document formatting requirements.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| court | string | Yes | Court identifier |

### get_electronic_filing_rules
Get e-filing requirements.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| court | string | Yes | Court identifier |

### search_local_rules
Search local court rules.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Rule topic |
| court | string | No | Court identifier |

### get_discovery_rules
Get discovery procedures.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| court | string | Yes | Court identifier |

### get_appellate_requirements
Get appellate filing requirements.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| court | string | Yes | Court identifier |

---

## State Law Tools

### search_state_statute
Search state statutes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| state | string | Yes | State code (e.g., 'CA', 'NY') |

---

## Analysis Tools

### comprehensive_legal_entity_analysis
Comprehensive analysis of a legal entity.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| entity_name | string | Yes | Company or entity name |
| analysis_type | string | No | Type of analysis |
| include_litigation | boolean | No | Include litigation history |
| include_regulatory | boolean | No | Include regulatory filings |
| include_patents | boolean | No | Include patent portfolio |

### draft_legal_filing
Generate draft legal filing.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| filing_type | string | Yes | Type of filing |
| court | string | Yes | Target court |
| parties | object | Yes | Party information |
| facts | string | Yes | Key facts |
| legal_issues | array | Yes | Legal issues |

---

## Rate Limits

All tools implement rate limiting to respect API constraints:

| API Source | Rate Limit |
|------------|------------|
| CourtListener | 5,000/day |
| SEC EDGAR | 10 req/sec |
| USPTO | 1,000/day |
| Federal Register | 1,000/hour |
| FDA OpenFDA | 240/min |
| EPA ECHO | 1,000/day |

## Error Handling

All tools return errors in a consistent format:

```json
{
  "error": true,
  "message": "Description of the error",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common error codes:
- `RATE_LIMITED` - API rate limit exceeded
- `AUTH_REQUIRED` - API key missing or invalid
- `NOT_FOUND` - Resource not found
- `INVALID_PARAMS` - Invalid parameters
- `API_ERROR` - Upstream API error
