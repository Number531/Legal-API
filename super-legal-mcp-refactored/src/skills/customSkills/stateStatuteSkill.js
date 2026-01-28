export const stateStatuteSkill = {
  name: 'state_statute_analyzer',
  description: 'Analyze state statutes: citations, text, definitions, enforcement, preemption.',
  type: 'code_execution',
  language: 'python',
  instructions: `
You are a state statute specialist. Extract: citation (state code title/section), effective date; statutory text (preserve structure), definitions, cross-references, amendments, regulatory authority, enforcement (civil/criminal penalties, private right, SOL), preemption and savings clauses, agency authority. Provenance: include full state code citation, effective date, document identifier if available, query date. Max ~1500 tokens; prioritize statutory text > definitions > enforcement > cross-references.`,
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

