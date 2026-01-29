# Tutorial 2: Legal Research Workflows

This tutorial covers common legal research patterns using Super-Legal's 51 tools.

---

## Case Law Research

### Finding Relevant Precedent

**Scenario:** Research binding precedent for a breach of fiduciary duty claim in Delaware.

```
Search for Delaware Court of Chancery cases from 2019-2024
involving breach of fiduciary duty by corporate directors.
Focus on cases applying the entire fairness standard.
```

The system will:
1. Use `search_cases` with Delaware court filter
2. Apply date range filtering
3. Return cases with snippets for quick review
4. Retrieve full text for most relevant cases

### Citation Chain Analysis

**Scenario:** Trace how a key case has been cited.

```
Find all federal appellate cases that cite Chevron v. NRDC
(467 U.S. 837) from 2020 to present. Focus on cases that
question or limit Chevron deference.
```

The system uses:
- `lookup_citation` to verify the original case
- `get_opinion_with_citations` for citing references
- `search_cases` with citation filter

### Judge Research

**Scenario:** Understand a judge's track record before oral argument.

```
Research Judge [Name] of the [Court]. Find:
1. Recent opinions on patent cases
2. Reversal rate on appeal
3. Background and judicial philosophy
```

Tools used:
- `search_judges` for biographical data
- `search_cases` filtered by judge
- `search_opinions` for written decisions

---

## Statutory Research

### Federal Code Analysis

**Scenario:** Analyze a federal statute and its implementing regulations.

```
Provide a comprehensive analysis of 15 USC 78j(b) (Securities
Exchange Act Section 10(b)) including:
1. Full statutory text
2. Key SEC regulations (Rule 10b-5)
3. Recent enforcement actions
4. Leading case law interpretations
```

Workflow:
1. `get_usc_section` - Retrieve statute text
2. `search_federal_register` - Find regulations
3. `search_sec_filings` - Enforcement actions
4. `search_cases` - Judicial interpretations

### State Statute Comparison

**Scenario:** Compare state laws on a specific topic.

```
Compare the statutes of limitations for breach of contract
in New York, California, and Texas. Include:
1. Citation to each statute
2. Limitation period
3. Accrual rules
4. Tolling provisions
```

Uses `search_state_statute` for each jurisdiction.

---

## Regulatory Research

### Federal Register Tracking

**Scenario:** Track proposed rulemaking in a specific area.

```
Find all EPA proposed rules from the past 6 months
related to PFAS contamination. For each rule, provide:
1. Federal Register citation
2. Comment deadline
3. Key proposed requirements
4. Industries affected
```

Tools:
- `search_federal_register_proposed_rules`
- `search_federal_register_notices`
- `search_epa_violations` for context

### Multi-Agency Research

**Scenario:** Comprehensive regulatory landscape analysis.

```
Research the regulatory framework for cryptocurrency exchanges:
1. SEC requirements (securities)
2. CFTC jurisdiction (commodities)
3. FinCEN AML requirements
4. State money transmitter licenses
```

Uses parallel queries across:
- `search_sec_filings` (SEC enforcement)
- `search_federal_register` (CFTC rules)
- `search_ftc_enforcement_cases` (consumer protection)
- `search_state_statute` (state requirements)

---

## Patent Research

### Prior Art Search

**Scenario:** Comprehensive prior art search for patent prosecution.

```
Search for patents related to machine learning-based
image recognition for medical diagnosis, filed 2015-2020.
Include CPC classifications and key claims.
```

Workflow:
1. `search_cpc_classifications` - Find relevant classes
2. `search_patents` - Patent search
3. `search_ptab_proceedings` - Check validity challenges

### Patent Landscape Analysis

**Scenario:** Competitive intelligence for a technology area.

```
Create a patent landscape analysis for autonomous vehicle
LiDAR technology:
1. Major patent holders
2. Key patent families
3. Recent PTAB challenges
4. Licensing trends
```

Tools:
- `search_patents` with assignee analysis
- `search_ptab_ipr_proceedings`
- `search_patent_locations` for geographic trends

---

## Corporate Research

### SEC Filing Analysis

**Scenario:** Due diligence on a public company.

```
Analyze [Company]'s SEC filings for the past 3 years:
1. Material risk factors (10-K)
2. Related party transactions
3. Executive compensation
4. Pending litigation disclosures
```

Uses:
- `search_sec_company_tickers` - Get CIK
- `search_sec_filings` with form type filters
- `get_sec_company_facts` - XBRL data

### Litigation History

**Scenario:** Assess litigation exposure.

```
Research [Company]'s litigation history:
1. Federal court cases as defendant
2. Regulatory enforcement actions
3. Class action lawsuits
4. Settlement amounts
```

Parallel queries:
- `search_cases` (party name filter)
- `search_dockets` (federal cases)
- `search_sec_filings` (8-K litigation disclosures)

---

## Product Safety Research

### FDA Product Analysis

**Scenario:** Due diligence on pharmaceutical product.

```
Research the regulatory status of [Drug Name]:
1. FDA approval history
2. Warning letters
3. Adverse event reports
4. Label changes
```

Tools:
- `search_fda_drug_labels`
- `search_fda_warning_letters`
- `search_fda_drug_adverse_events`
- `search_fda_drug_safety_communications`

### Consumer Product Safety

**Scenario:** Product recall risk assessment.

```
Research product safety issues for [Product Category]:
1. CPSC recalls (past 5 years)
2. NHTSA complaints (if vehicle-related)
3. Injury statistics
4. Regulatory standards
```

Uses:
- `search_cpsc_recalls`
- `search_cpsc_injury_data`
- `nhtsa_search_complaints`
- `search_cpsc_safety_standards`

---

## Best Practices

### 1. Start Broad, Then Narrow

```
# First: Broad search
Search for antitrust cases in the technology sector

# Then: Narrow based on results
Search for Ninth Circuit cases from 2022-2024
involving tying arrangements in software licensing
```

### 2. Use Multiple Sources

For comprehensive research, combine:
- Primary sources (cases, statutes)
- Secondary sources (regulations, guidance)
- Administrative materials (agency decisions)

### 3. Verify Citations

Always verify key citations:
```
Verify that [citation] is still good law.
Check for subsequent history and negative treatment.
```

### 4. Document Your Research

Request structured output:
```
Create a research memo documenting:
1. Search queries used
2. Sources reviewed
3. Key findings
4. Gaps in research
```

---

## Next Steps

- [Tutorial 3: M&A Due Diligence](03-ma-due-diligence.md)
- [Tutorial 4: Memorandum Generation](04-memorandum-generation.md)
- [API Reference](../API-REFERENCE.md)
