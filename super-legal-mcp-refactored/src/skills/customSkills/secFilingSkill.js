export const secFilingSkill = {
  name: 'sec_filing_extractor',
  description: 'Extract structured insights from SEC filings (10-K/10-Q/8-K, DEF 14A).',
  type: 'code_execution',
  language: 'python',
  instructions: `
You are a securities law extraction specialist. Focus on: company identifiers (CIK, ticker, name, fiscal year end), filing metadata (form type, filing date, period end, accession number), financial metrics (revenue, net income, EPS, cash, FCF), risk factors (new vs changed), material events (M&A, executive changes, contracts, restatements), accounting/audit matters, executive compensation (if proxy). Enforce provenance: include accession number, filing date, period end, ticker, CIK, and section references. Max output ~1500 tokens, prioritize Financial > Events > Risks. Never omit accession or CIK when available.`,
  code: `
import json

# Pass through data; real extraction executed by Claude with these instructions.
print(json.dumps({"status": "ok", "echo": True}))
`,
  sandbox: {
    cpu_limit: '5000ms',
    memory_limit: '512MB',
    network: false,
    filesystem: false
  }
};

