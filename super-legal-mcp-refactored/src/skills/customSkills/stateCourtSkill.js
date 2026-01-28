export const stateCourtSkill = {
  name: 'state_court_analyzer',
  description: 'Extract holdings and procedural details for state court opinions/rules.',
  type: 'code_execution',
  language: 'python',
  instructions: `
You are a state court research specialist. Extract: case name, citation, docket, court, date, judge; procedural posture; issues; holding/judgment; key facts; reasoning; precedent applied/distinguished; separate opinions; local practice rules if applicable. Provenance: include docket, court identifier, official citation, decision date, query date. Max ~1500 tokens; prioritize holding > issues > reasoning > facts > precedent.`,
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

