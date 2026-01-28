export const caseLawSkill = {
  name: 'case_law_extractor',
  description: 'Extract holdings, issues, reasoning, precedent from court opinions.',
  type: 'code_execution',
  language: 'python',
  instructions: `
You are a court opinion specialist. Extract: case name, official citation, docket, court, decision date, judges; procedural posture; issues presented; holding and judgment; key facts; reasoning; precedent applied/distinguished/overruled; separate opinions (concurring/dissenting); citation pin cites. Provenance: include CourtListener case_id/cluster_id, docket number, court identifier, official citation, decision date, query date. Max ~2000 tokens; prioritize Holding > Issues > Reasoning > Facts > Precedent.`,
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

