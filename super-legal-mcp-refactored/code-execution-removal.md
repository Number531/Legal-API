# Code Execution Guidance Reversion Plan

## Problem

Verbose code execution documentation (~3,000 tokens) is included in every request context, increasing costs 3-4x for minimal enhancement.

---

## Files to Modify

| File | Location | Action |
|------|----------|--------|
| `src/config/legalSubagents.js` | Lines 764-818 | **DELETE** main "Financial Model Execution" section |
| `src/config/legalSubagents.js` | Lines 1269-1297 | **DELETE** securities-researcher "Data Gathering for Financial Models" |
| `src/config/legalSubagents.js` | Lines 1412-1426 | **DELETE** case-law-analyst "Quantitative Analysis Capability" |
| `src/config/legalSubagents.js` | Similar blocks in 6 other specialists | **DELETE** |
| `prompts/memorandum.md` | Lines 528-624 | **DELETE** entire "CODE EXECUTION SANDBOX" section |

---

# ARCHIVED CONTENT FOR RESTORATION

## Archive 1: legalSubagents.js Main Section (lines 764-818)

```markdown
### Financial Model Execution (Code Execution Sandbox)

When quantitative financial analysis is required, use the two-phase workflow:

**CRITICAL: The code execution sandbox has NO NETWORK ACCESS.** Financial data must be gathered FIRST using MCP tools, then passed to the model for processing.

#### Phase 1 - Evidence Gathering (Use MCP Tools):
- Use \`search_sec_filings\` to get revenue, EBITDA, financial statements from 10-K/10-Q
- Use \`search_cases\` to get historical stock prices from litigation exhibits
- Extract numerical data and structure as JSON for the model

#### Phase 2 - Execute Model:
Use \`execute_financial_model\` with appropriate modelType:

| Legal Context | Model | Required financialData |
|---------------|-------|------------------------|
| Securities fraud damages | \`event_study\` | daily_prices[], market_prices[], event_date |
| M&A fairness opinions | \`dcf\`, \`comps\`, \`precedent\` | revenue, ebitda, comparable_companies[] |
| Fraud detection | \`benford\`, \`beneish\` | numbers[], financial_ratios{} |
| Shareholder litigation | \`damages\` | principal, rate, periods, judgment_date |
| PE acquisition disputes | \`lbo\` | ebitda, entry_multiple, debt_schedule |
| Biotech milestones | \`cvr\` | milestone_probabilities[], timeline |
| Startup valuation | \`vc_method\` | investment, pre_money, exit_revenue |
| Spin-off analysis | \`spinoff\` | segment_data[], allocation_method |
| M&A accretion/dilution | \`accretion_dilution\` | acquirer_data, target_data, deal_terms |

#### Available Models (18 total):
- **Valuation**: dcf, comps, precedent, sotp, lbo, vc_method, val_409a
- **Event Analysis**: event_study, regression
- **Fraud Detection**: benford, beneish
- **Damages**: damages, monte_carlo
- **M&A**: accretion_dilution, apv, spinoff, earnout, cvr

#### Example Two-Phase Workflow:
\`\`\`
User Query: "Calculate securities fraud damages for XYZ Corp's 2024 disclosure fraud"

Phase 1 - Gather Evidence (securities-researcher):
→ search_sec_filings: Get 8-K disclosure dates
→ Extract stock prices for event window
→ Get S&P 500 index prices for same period

Phase 2 - Execute Model:
→ execute_financial_model({
    modelType: "event_study",
    financialData: {
      daily_prices: [gathered stock prices],
      market_prices: [gathered S&P 500 prices],
      event_date: "2024-03-15"
    },
    parameters: { estimation_window: 120, event_window: 10 }
  })

→ Returns: Abnormal returns, CAR, statistical significance, damages estimate
\`\`\`
```

---

## Archive 2: securities-researcher Integration (lines 1269-1297)

```markdown
## Data Gathering for Financial Models

When gathering data for quantitative financial analysis, structure outputs for \`execute_financial_model\`:

### For DCF Models (modelType: 'dcf'):
Extract from 10-K annual reports:
- Revenue (trailing 5 years): Item 6 or Item 8
- EBITDA margins: Calculate from Item 8 financial statements
- CapEx and working capital changes: Cash flow statement
- Analyst growth estimates: MD&A forward-looking statements
- WACC inputs: Debt/equity from balance sheet, interest rates from notes

### For Event Studies (modelType: 'event_study'):
Extract from 8-K and market data:
- Event announcement date: 8-K filing date (Item 8.01 or specific item)
- Stock prices: Daily closing prices for 250 days before/after event
- Market index: S&P 500 prices for same period
- Structure as: { daily_prices: [], market_prices: [], event_date: "YYYY-MM-DD" }

### For Comparable Analysis (modelType: 'comps', 'precedent'):
Extract from proxy statements and 10-K:
- Peer company financial metrics: Revenue, EBITDA, net income
- Trading multiples: EV/Revenue, EV/EBITDA, P/E at analysis date
- Transaction multiples: From merger proxies (DEFM14A)
- Structure as: { comparable_companies: [{name, revenue, ebitda, ev_revenue_multiple}] }

### For Fraud Detection (modelType: 'benford', 'beneish'):
Extract from financial statements:
- All numeric values from income statement (benford)
```

---

## Archive 3: case-law-analyst Integration (lines 1412-1426)

```markdown
## Quantitative Analysis Capability

When your research identifies damages amounts, settlements, or penalty precedents, you can quantify exposure using \`execute_financial_model\`:

| Finding Type | Model | Data to Extract |
|--------------|-------|-----------------|
| Damages precedent | \`damages\` | principal, interest_rate, judgment_date, compounding |
| Statistical causation | \`regression\` | independent_vars[], dependent_var, observations |
| Settlement patterns | \`monte_carlo\` | base_amount, low_range, high_range, distribution |

**Two-Phase Workflow (MANDATORY):**
1. Extract quantitative data from case findings (damages awarded, settlement amounts, penalty calculations)
2. Structure as JSON and invoke \`execute_financial_model\` with appropriate modelType

**Note:** The sandbox has NO NETWORK ACCESS - all data must come from your research findings.
```

---

## Archive 4: memorandum.md Section (lines 528-624)

```markdown
## CODE EXECUTION SANDBOX (execute_financial_model)

When quantitative financial analysis would strengthen the memorandum, you can use the `execute_financial_model` tool. This executes Python code in Anthropic's managed sandbox environment.

**Container Environment:**
- Python 3.11.12, 5GiB RAM, 5GiB disk
- Pre-installed: pandas, numpy, scipy, scikit-learn, statsmodels, matplotlib, seaborn, sympy, mpmath

### CRITICAL CONSTRAINT: NO NETWORK ACCESS

**The sandbox has NO NETWORK ACCESS.** All financial data must be gathered FIRST using MCP tools, then passed to the model for computation.

### Two-Phase Workflow (MANDATORY)

**Phase 1 - Evidence Gathering (Use MCP Tools):**
- Use `search_sec_filings` to get revenue, EBITDA, financial statements from 10-K/10-Q filings
- Use `search_cases` to extract historical stock prices from litigation exhibits
- Use other domain-specific tools to gather all required numerical data
- Structure all extracted data as clean JSON objects

**Phase 2 - Execute Model:**
Use `execute_financial_model` with appropriate modelType and structured data:

| Legal Context | Model | Required financialData |
|---------------|-------|------------------------|
| Securities fraud damages | `event_study` | daily_prices[], market_prices[], event_date |
| M&A fairness opinions | `dcf`, `comps`, `precedent` | revenue, ebitda, comparable_companies[] |
| Fraud detection | `benford`, `beneish` | transaction_amounts[], financial_ratios |
| Startup valuation | `vc_method` | investment_amount, exit_revenue, target_irr |
| Monte Carlo simulation | `monte_carlo` | base_damages, volatility, iterations |
| LBO analysis | `lbo` | purchase_price, debt_tranches[], exit_year |
| Sum-of-parts | `sotp` | segment_revenues[], segment_multiples[] |

### Available Models (18 total)

**Valuation Models:**
- `dcf` - Discounted Cash Flow with WACC sensitivity
- `comps` - Comparable company analysis
- `precedent` - Precedent transaction multiples
- `sotp` - Sum-of-the-parts valuation
- `lbo` - Leveraged buyout returns
- `vc_method` - Venture capital method (backward from exit)
- `val_409a` - 409A safe harbor valuation
- `apv` - Adjusted Present Value

**Event Analysis:**
- `event_study` - Securities fraud damages via market model
- `regression` - Statistical regression analysis

**Fraud Detection:**
- `benford` - Benford's Law digit analysis
- `beneish` - M-Score manipulation detection

**Damages & Risk:**
- `damages` - General damages calculation
- `monte_carlo` - Monte Carlo simulation with distributions

**M&A Models:**
- `accretion_dilution` - EPS impact analysis
- `spinoff` - Tax-free spinoff valuation
- `earnout` - Contingent consideration modeling
- `cvr` - Contingent value rights

### Example Invocation

```json
{
  "modelType": "event_study",
  "financialData": {
    "daily_prices": [45.20, 44.80, 43.50, 38.20, 36.10],
    "market_prices": [4520, 4515, 4510, 4505, 4500],
    "event_date": "2024-03-15"
  },
  "parameters": {
    "estimation_window": 120,
    "event_window": [-5, 5]
  }
}
```

### When to Delegate to financial-analyst Subagent

For complex quantitative analysis requiring:
- Multiple models in sequence
- Iterative calculations with parameter tuning
- Comprehensive fraud detection battery
- Multi-scenario sensitivity analysis

Delegate to the `financial-analyst` subagent rather than executing directly.

### Output Includes

All model executions return:
- Computed results as structured JSON
- Base64-encoded charts (PNG format) for visualization
- Methodology notes for expert witness testimony
```

---

## Other Specialist Integrations (Pattern)

The following specialists have similar blocks (~15 lines each) following this pattern:

```markdown
## Quantitative Analysis Capability

When your research identifies [domain-specific findings], you can [quantify/model] using \`execute_financial_model\`:

| Finding Type | Model | Data to Extract |
|--------------|-------|-----------------|
| [Type 1] | \`model_name\` | [required fields] |
| [Type 2] | \`model_name\` | [required fields] |

**Two-Phase Workflow (MANDATORY):**
1. Extract quantitative data from [domain] findings
2. Structure as JSON and invoke \`execute_financial_model\` with appropriate modelType

**Note:** The sandbox has NO NETWORK ACCESS - all data must come from your research findings.
```

**Specialists with this pattern:**
- product-safety-analyst (~line 1506)
- environmental-compliance-analyst (~line 1632)
- patent-analyst (~line 1753)
- regulatory-rulemaking-analyst (~line 1868)
- product-safety-analyst (~line 1977)
- antitrust-competition-analyst (~line 2112)

---

## What Remains After Removal (Capability Preserved)

| Component | Location | Status |
|-----------|----------|--------|
| `execute_financial_model` tool | `src/tools/financialModelHandler.js` | **Kept** - fully functional |
| `financial-analyst` subagent | `legalSubagents.js` line ~2835 | **Kept** - core definition intact |
| Delegation rule | `legalSubagents.js` line 732 | **Kept** - one-line reference |

---

## Restoration Instructions

To restore this functionality:

1. Copy Archive 1 content → Insert after line 763 in `legalSubagents.js`
2. Copy Archive 2 content → Insert into securities-researcher prompt
3. Copy Archive 3 content → Insert into case-law-analyst prompt
4. Copy Archive 4 content → Insert after line 527 in `memorandum.md`
5. Replicate the pattern for other specialists as needed

---

*Created: December 23, 2025*
