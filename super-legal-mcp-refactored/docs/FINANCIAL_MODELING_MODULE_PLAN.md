# Financial Modeling Module Implementation Plan

**Date**: December 15, 2025
**Status**: Approved for Implementation
**Phase**: 5 - Code Execution Integration
**Documentation Verified**: December 15, 2025

---

## Documentation Verification (December 15, 2025)

**Official Sources Verified**:
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool
- https://www.anthropic.com/engineering/advanced-tool-use (Nov 24, 2025)
- https://docs.anthropic.com/en/docs/agent-sdk/overview

| Specification | Verified Value | Source |
|---------------|----------------|--------|
| Beta Header | `code-execution-2025-08-25` | Official docs |
| Tool Type | `code_execution_20250825` | Official docs |
| RAM | 5 GiB | Official docs |
| Disk | 5 GiB | Official docs |
| CPU | 1 core | Official docs |
| Network | Completely disabled | Official docs |
| Container Lifetime | 30 days | Official docs |
| Python Version | 3.11.12 | Official docs |

### New Features Discovered

| Feature | Beta Header | Description |
|---------|-------------|-------------|
| **Programmatic Tool Calling** | `advanced-tool-use-2025-11-20` | Code execution can call custom tools via `allowed_callers` |
| **Files API Integration** | `files-api-2025-04-14` | Upload/download files to/from container |
| **Container Reuse** | (built-in) | Reuse containers via `container` parameter |
| **Text Editor Operations** | (built-in) | `view`, `create`, `str_replace` commands |

### Pre-Installed Libraries (Verified)

**Data Science**: pandas, numpy, scipy, scikit-learn, statsmodels
**Visualization**: matplotlib, seaborn
**File Processing**: pyarrow, openpyxl, xlsxwriter, xlrd, pillow, python-pptx, python-docx, pypdf, pdfplumber, pypdfium2, pdf2image, pdfkit, tabula-py, reportlab[pycairo], img2pdf
**Math & Computing**: sympy, mpmath
**Utilities**: tqdm, python-dateutil, pytz, joblib, sqlite, ripgrep, fd

---

## Architecture Decisions

| Decision | Selection | Rationale |
|----------|-----------|-----------|
| **Sandbox Provider** | Anthropic Only | Simplicity; 5GiB RAM sufficient for most legal financial analyses |
| **Model Architecture** | Template Library | Pre-tested Python scripts reduce LLM errors, ensure consistency |
| **Data Acquisition** | Subagent WebSearch/MCP | Sandbox has no network; subagents pre-fetch all data |
| **Validation** | Full Loop | Execute, validate, retry with corrections (up to 3 attempts) |
| **Model Selection** | AI-Driven | Claude autonomously selects model based on legal context |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FINANCIAL MODELING WORKFLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SUBAGENT (securities-researcher or financial-model-analyst)        │   │
│  │                                                                      │   │
│  │  1. Analyze legal question → Select model type                       │   │
│  │  2. Use MCP tools (SEC EDGAR, etc.) → Extract financial data         │   │
│  │  3. Use WebSearch/WebFetch → Gather market data, benchmarks          │   │
│  │  4. POST /api/financial-model → Pass data + model type               │   │
│  │  5. Validate results → Retry if needed (up to 3x)                    │   │
│  │  6. Integrate into legal memorandum                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  /api/financial-model ENDPOINT                                       │   │
│  │  (financialModelEndpoint.js)                                         │   │
│  │                                                                      │   │
│  │  • Receives: { modelType, financialData, parameters }                │   │
│  │  • Loads model template from /src/models/financial/                  │   │
│  │  • Calls Anthropic API with code_execution_20250825 tool             │   │
│  │  • Returns: { results, charts, methodology, validation }             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ANTHROPIC CODE EXECUTION SANDBOX                                    │   │
│  │                                                                      │   │
│  │  Specifications (December 2025):                                     │   │
│  │  • RAM: 5 GiB                                                        │   │
│  │  • Disk: 5 GiB                                                       │   │
│  │  • CPU: 1 core                                                       │   │
│  │  • Network: DISABLED                                                 │   │
│  │  • Lifetime: 30 days                                                 │   │
│  │  • Beta: code-execution-2025-08-25                                   │   │
│  │  • Tool: code_execution_20250825                                     │   │
│  │                                                                      │   │
│  │  Pre-installed: pandas, numpy, scipy, statsmodels, matplotlib,       │   │
│  │                 seaborn, scikit-learn, sympy                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Model Template Library

### Directory Structure

```
src/models/financial/
├── index.js              # Model loader and registry
├── dcf.py                # Discounted Cash Flow
├── event_study.py        # Market efficiency / securities fraud
├── monte_carlo.py        # Probability-based damages
├── regression.py         # Causation analysis
├── time_series.py        # Price manipulation detection
└── damages.py            # General damages with prejudgment interest
```

### Model Specifications

#### 1. DCF (Discounted Cash Flow) - `dcf.py`

**Legal Use Cases**: M&A fairness opinions, shareholder litigation, asset valuation disputes

**Required Inputs**:
```python
{
    "revenue_projections": [float],      # 5-year revenue forecast
    "operating_margin": float,           # Operating margin %
    "capex_percent": float,              # CapEx as % of revenue
    "working_capital_percent": float,    # NWC as % of revenue
    "wacc": float,                       # Weighted avg cost of capital
    "terminal_growth": float,            # Terminal growth rate
    "shares_outstanding": int            # For per-share value
}
```

**Outputs**:
- Enterprise value
- Equity value per share
- Free cash flow projections (table)
- Sensitivity analysis (WACC vs terminal growth)
- Waterfall chart (PNG base64)

---

#### 2. Event Study - `event_study.py`

**Legal Use Cases**: Securities fraud damages, insider trading, market manipulation

**Required Inputs**:
```python
{
    "stock_prices": [{"date": str, "price": float}],    # Daily stock prices
    "market_prices": [{"date": str, "price": float}],   # Market index (S&P 500)
    "event_date": str,                                   # YYYY-MM-DD
    "estimation_window": int,                            # Days before event (default: 120)
    "event_window": [-int, +int]                         # Days around event (default: [-5, +5])
}
```

**Outputs**:
- Alpha (intercept)
- Beta (market sensitivity)
- Abnormal returns (AR) by day
- Cumulative abnormal return (CAR)
- T-statistic and p-value
- AR/CAR chart (PNG base64)

---

#### 3. Monte Carlo Simulation - `monte_carlo.py`

**Legal Use Cases**: Damages under uncertainty, risk quantification, settlement negotiations

**Required Inputs**:
```python
{
    "base_damages": float,                  # Central estimate
    "variables": [
        {
            "name": str,
            "distribution": "normal"|"uniform"|"triangular",
            "params": {...}                 # mean/std, min/max, or min/mode/max
        }
    ],
    "iterations": int,                      # Default: 10000
    "seed": int                             # For reproducibility
}
```

**Outputs**:
- Mean, median damages
- Percentiles (5th, 25th, 75th, 95th)
- Standard deviation
- Probability of exceeding threshold
- Distribution histogram (PNG base64)

---

#### 4. Regression Analysis - `regression.py`

**Legal Use Cases**: Causation (but-for scenarios), price impact analysis, discrimination cases

**Required Inputs**:
```python
{
    "dependent_variable": [float],          # Y values
    "independent_variables": {
        "var_name": [float]                 # X values (multiple allowed)
    },
    "dates": [str],                         # Time index (optional)
    "model_type": "ols"|"robust"|"panel"    # Default: OLS
}
```

**Outputs**:
- Coefficients with standard errors
- T-statistics and p-values
- R-squared and adjusted R-squared
- F-statistic
- Durbin-Watson (autocorrelation)
- Residual diagnostics
- Regression plot (PNG base64)

---

#### 5. Time Series Analysis - `time_series.py`

**Legal Use Cases**: Price manipulation detection, trend analysis, forecasting

**Required Inputs**:
```python
{
    "values": [float],                      # Time series data
    "dates": [str],                         # Date index
    "frequency": "D"|"W"|"M"|"Q"|"Y",       # Data frequency
    "forecast_periods": int                 # Periods to forecast (optional)
}
```

**Outputs**:
- Stationarity test (ADF)
- ARIMA parameters (p, d, q)
- Seasonality detection
- Trend decomposition
- Forecast with confidence intervals
- Time series chart (PNG base64)

---

#### 6. Damages Calculation - `damages.py`

**Legal Use Cases**: General damages quantification, prejudgment interest

**Required Inputs**:
```python
{
    "actual_performance": [{"date": str, "value": float}],
    "but_for_performance": [{"date": str, "value": float}],
    "prejudgment_rate": float,              # Annual rate (e.g., 0.05)
    "judgment_date": str,                   # YYYY-MM-DD
    "compounding": "simple"|"compound"      # Interest compounding
}
```

**Outputs**:
- Period-by-period damages
- Total nominal damages
- Prejudgment interest
- Present value of damages
- Damages timeline chart (PNG base64)

---

## API Endpoint Specification

### POST /api/financial-model

**Request**:
```json
{
    "modelType": "dcf|event_study|monte_carlo|regression|time_series|damages",
    "financialData": { ... },
    "parameters": { ... }
}
```

**Response (Success)**:
```json
{
    "success": true,
    "modelType": "dcf",
    "results": {
        "enterprise_value": 1500000000,
        "equity_value_per_share": 45.67,
        "fcf_projections": [...],
        "sensitivity_table": [...]
    },
    "charts": [
        {
            "name": "dcf_waterfall",
            "type": "image/png",
            "data": "base64..."
        }
    ],
    "methodology": "Discounted Cash Flow using WACC of 8.5% and terminal growth of 2.5%...",
    "validation": {
        "status": "passed",
        "attempts": 1,
        "checks": {
            "range_check": true,
            "completeness": true,
            "format": true
        }
    }
}
```

**Response (Error)**:
```json
{
    "success": false,
    "error": "Execution failed after 3 attempts",
    "lastError": "ValueError: Negative cash flows not supported for DCF",
    "attempts": 3,
    "suggestion": "Verify revenue projections are positive"
}
```

---

## Implementation Files

| File | Action | Description |
|------|--------|-------------|
| `src/models/financial/index.js` | CREATE | Model loader and template registry |
| `src/models/financial/dcf.py` | CREATE | DCF valuation template |
| `src/models/financial/event_study.py` | CREATE | Event study template |
| `src/models/financial/monte_carlo.py` | CREATE | Monte Carlo template |
| `src/models/financial/regression.py` | CREATE | Regression analysis template |
| `src/models/financial/time_series.py` | CREATE | Time series template |
| `src/models/financial/damages.py` | CREATE | Damages calculation template |
| `src/server/financialModelEndpoint.js` | CREATE | Express endpoint for code execution |
| `src/server/claude-sdk-server.js` | MODIFY | Add route registration |
| `src/config/legalSubagents.js` | MODIFY | Add financial modeling instructions |

---

## Subagent Integration

### Data Acquisition Pattern

Subagents use their existing tools to gather data BEFORE calling the financial model endpoint:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SUBAGENT DATA ACQUISITION (Network-Enabled)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. MCP Tools (SEC EDGAR)                                               │
│     └── sec_edgar_search → 10-K, 10-Q filings                          │
│     └── sec_financial_data → Revenue, expenses, cash flows             │
│                                                                         │
│  2. WebSearch                                                           │
│     └── "AAPL stock price history 2024" → Historical prices            │
│     └── "S&P 500 index 2024" → Market benchmark                        │
│     └── "WACC technology sector 2024" → Cost of capital estimates      │
│                                                                         │
│  3. WebFetch                                                            │
│     └── Yahoo Finance API → Real-time quotes                           │
│     └── Treasury.gov → Risk-free rate                                  │
│     └── Industry reports → Comparable multiples                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SANDBOX EXECUTION (Network-Disabled)                                   │
│  Receives pre-fetched data, performs computation, returns results       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Instructions Addition to Subagent

Add to `securities-researcher` (or create `financial-model-analyst`):

```javascript
const FINANCIAL_MODELING_INSTRUCTIONS = `
## FINANCIAL MODELING CAPABILITY

When legal analysis requires quantitative financial modeling, you can execute
computational models in a secure Python sandbox.

### Available Models

| Model | Use Case | When to Select |
|-------|----------|----------------|
| dcf | Discounted Cash Flow | M&A fairness, shareholder litigation, asset disputes |
| event_study | Market Efficiency | Securities fraud, insider trading, price manipulation |
| monte_carlo | Monte Carlo Simulation | Damages uncertainty, probability distributions |
| regression | Regression Analysis | Causation, but-for scenarios, discrimination |
| time_series | Time Series Analysis | Price manipulation, trend detection, forecasting |
| damages | Damages Calculation | Nominal damages, prejudgment interest |

### Workflow

1. **Analyze Question** → Determine which model fits the legal analysis
2. **Gather Data** → Use MCP tools, WebSearch, WebFetch to collect:
   - Financial statements (SEC EDGAR)
   - Stock prices (WebSearch/WebFetch)
   - Market indices (WebSearch/WebFetch)
   - Industry benchmarks (WebSearch)
3. **Structure Data** → Format according to model requirements
4. **Call Endpoint** → POST /api/financial-model with modelType and data
5. **Validate Results** → Check for errors, reasonable ranges
6. **Integrate** → Include results and charts in legal memorandum

### Example: Securities Fraud Damages

User asks: "Calculate damages from Apple's Jan 2024 disclosure"

1. Select model: \`event_study\` (market efficiency analysis)
2. Gather data:
   - WebSearch: "AAPL stock price January 2024"
   - WebSearch: "S&P 500 January 2024"
   - Identify event date from legal filings
3. Call endpoint:
   \`\`\`json
   POST /api/financial-model
   {
     "modelType": "event_study",
     "financialData": {
       "stock_prices": [...],
       "market_prices": [...],
       "event_date": "2024-01-15"
     },
     "parameters": {
       "estimation_window": 120,
       "event_window": [-5, 5]
     }
   }
   \`\`\`
4. Validate: Check CAR is within reasonable range, t-stat significant
5. Integrate: Include CAR, statistical significance, chart in memorandum

### Important Notes

- The sandbox has NO network access - all data must be gathered beforehand
- Results include methodology notes for legal documentation
- Charts are returned as base64 PNG for embedding in reports
- Maximum 3 retry attempts on validation failure
`;
```

---

## Validation Logic

### Result Validation Checks

| Model | Range Check | Completeness Check |
|-------|-------------|-------------------|
| DCF | Enterprise value > 0, within 10x industry median | FCF projections, sensitivity table, chart |
| Event Study | CAR between -100% and +100%, t-stat calculated | Alpha, beta, AR, CAR, p-value, chart |
| Monte Carlo | Mean > 0 (for damages), percentiles ordered | Mean, median, percentiles, histogram |
| Regression | R² between 0 and 1, coefficients finite | Coefficients, t-stats, R², chart |
| Time Series | Forecast values finite | Stationarity, ARIMA params, forecast, chart |
| Damages | Total damages >= 0 | Period damages, interest, present value, chart |

### Retry Strategy

```
Attempt 1: Execute model with original data
  ↓ (if validation fails)
Attempt 2: Analyze error, adjust parameters
  ↓ (if validation fails)
Attempt 3: Simplify model or use fallback
  ↓ (if validation fails)
Return error with detailed diagnostics
```

---

## Security Considerations

| Risk | Mitigation |
|------|------------|
| Code injection | Sandbox has no network; isolated environment |
| Data exfiltration | Network disabled; results validated |
| Resource exhaustion | 5GiB RAM/disk limit; 1 CPU cap |
| Persistent attacks | 30-day container lifetime; fresh state |

---

## Testing Plan

1. **Unit Tests**: Each model template with known inputs/outputs
2. **Integration Tests**: End-to-end subagent → endpoint → sandbox flow
3. **Validation Tests**: Verify retry logic on intentionally bad inputs
4. **Legal Accuracy Tests**: Compare outputs to known case valuations

---

## Rollback Plan

If issues arise:
1. Remove `/api/financial-model` route from server
2. Remove `FINANCIAL_MODELING_INSTRUCTIONS` from subagent
3. Delete `src/models/financial/` directory
4. Delete `src/server/financialModelEndpoint.js`

Core legal research functionality remains unaffected.

---

## Implementation Order

1. **Create model templates** (`src/models/financial/*.py`)
2. **Create endpoint** (`src/server/financialModelEndpoint.js`)
3. **Register route** (`src/server/claude-sdk-server.js`)
4. **Update subagent** (`src/config/legalSubagents.js`)
5. **Test end-to-end**
6. **Update documentation**

---

## Verified API Implementation Pattern (December 2025)

### Python SDK Pattern (Official)

```python
import anthropic

client = anthropic.Anthropic()

response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    betas=["code-execution-2025-08-25"],
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "Calculate the mean and standard deviation of [1, 2, 3, 4, 5]"
    }],
    tools=[{
        "type": "code_execution_20250825",
        "name": "code_execution"
    }]
)
```

### TypeScript/JavaScript Pattern (Official)

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const response = await client.beta.messages.create({
    model: "claude-sonnet-4-5",
    betas: ["code-execution-2025-08-25"],
    max_tokens: 4096,
    messages: [{
        role: "user",
        content: "Calculate the mean and standard deviation of [1, 2, 3, 4, 5]"
    }],
    tools: [{
        type: "code_execution_20250825",
        name: "code_execution"
    }]
});
```

### Response Types

**Bash Execution Result**:
```json
{
    "type": "bash_code_execution_tool_result",
    "tool_use_id": "srvtoolu_...",
    "content": {
        "type": "bash_code_execution_result",
        "stdout": "output here",
        "stderr": "",
        "return_code": 0
    }
}
```

**Text Editor Result**:
```json
{
    "type": "text_editor_code_execution_tool_result",
    "tool_use_id": "srvtoolu_...",
    "content": {
        "type": "text_editor_code_execution_result",
        "file_type": "text",
        "content": "file content here"
    }
}
```

### Container Reuse Pattern

```python
# First request
response1 = client.beta.messages.create(
    model="claude-sonnet-4-5",
    betas=["code-execution-2025-08-25"],
    # ... first analysis
)

# Extract container ID
container_id = response1.container.id

# Second request - reuse container
response2 = client.beta.messages.create(
    container=container_id,  # Reuse same container
    model="claude-sonnet-4-5",
    betas=["code-execution-2025-08-25"],
    # ... follow-up analysis
)
```

### Error Codes

| Error Code | Description |
|-----------|-------------|
| `unavailable` | Tool temporarily unavailable |
| `execution_time_exceeded` | Execution exceeded time limit |
| `container_expired` | Container expired (30-day limit) |
| `invalid_tool_input` | Invalid parameters |
| `too_many_requests` | Rate limit exceeded |
| `file_not_found` | File doesn't exist (text_editor) |
| `string_not_found` | old_str not found (str_replace) |

---

## ✅ ADOPTED: Programmatic Tool Calling (Streamlined Architecture)

**User Insight (December 15, 2025)**: Why have a two-step process when Programmatic Tool Calling allows the sandbox to directly invoke data-fetching tools?

The `advanced-tool-use-2025-11-20` beta enables code execution to call custom tools programmatically. This is now the **PRIMARY ARCHITECTURE**.

### Streamlined Workflow

```
OLD (Two-Step):
Subagent → Fetch data (MCP/WebSearch) → Call endpoint → Sandbox executes
         ↑                            ↑
         Point of failure #1          Point of failure #2

NEW (Streamlined):
Subagent → Call endpoint → Sandbox fetches data AND executes model
                          ↑
                          Single point - sandbox is self-sufficient
```

### Implementation

```javascript
const response = await client.beta.messages.create({
    model: "claude-sonnet-4-5",
    betas: ["advanced-tool-use-2025-11-20"],  // Enables allowed_callers
    max_tokens: 16000,
    tools: [
        {
            type: "code_execution_20250825",
            name: "code_execution"
        },
        {
            name: "get_stock_price",
            description: "Get historical stock prices for a ticker",
            input_schema: {
                type: "object",
                properties: {
                    ticker: { type: "string" },
                    start_date: { type: "string" },
                    end_date: { type: "string" }
                },
                required: ["ticker"]
            },
            allowed_callers: ["code_execution_20250825"]  // Sandbox can call this
        },
        {
            name: "get_sec_financial_data",
            description: "Get financial data from SEC filings",
            input_schema: {...},
            allowed_callers: ["code_execution_20250825"]
        },
        {
            name: "get_market_index",
            description: "Get market index data",
            input_schema: {...},
            allowed_callers: ["code_execution_20250825"]
        },
        {
            name: "get_treasury_rate",
            description: "Get risk-free rate",
            input_schema: {...},
            allowed_callers: ["code_execution_20250825"]
        }
    ],
    messages: [{
        role: "user",
        content: prompt
    }]
});
```

### Benefits

1. **Reduced Points of Failure**: One handoff instead of two
2. **Lower Context Usage**: Data doesn't pass through subagent
3. **Simpler Subagent**: Just selects model and calls endpoint
4. **Dynamic Data Fetching**: Sandbox requests exactly what it needs

### Updated Files to Create

| File | Purpose |
|------|---------|
| `src/server/financialModelEndpoint.js` | Endpoint with Programmatic Tool Calling |
| `src/server/financialDataTools.js` | Tool handlers (`get_stock_price`, etc.) |
| `src/models/financial/*.py` | Python model templates |
