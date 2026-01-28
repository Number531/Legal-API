export const antitrustSkill = {
  name: 'antitrust_analyzer',
  description: 'Summarize FTC antitrust matters: allegations, market, remedies, HSR data.',
  type: 'code_execution',
  language: 'python',
  instructions: `
You are an antitrust specialist. Extract: case name, docket, case type (merger/non-merger/consumer protection), filing date, status; parties, parent cos, industry/market, market definition; allegations (statutes: Sherman §§1/2, Clayton §7, FTC Act §5), conduct, harm; merger details (value, HSR date, Second Request, HHI changes, competitive concerns, efficiencies); consent/order terms (divestitures, conduct remedies, duration, penalties, prior approval); litigation details (court, rulings, outcome, appeals); related actions (DOJ, states, private, international). Provenance: include FTC docket/matter number, filing date, HSR date for mergers, consent/order ID, query date, market definition. Max ~1500 tokens; prioritize allegations > remedy terms > market analysis.`,
  code: `
import json
print(json.dumps({"status": "ok", "echo": True}))
`,
  sandbox: {
    cpu_limit: '5000ms',
    memory_limit: '512MB',
    network: false,
    filesystem: false
  }
};

