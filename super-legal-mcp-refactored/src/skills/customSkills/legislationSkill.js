export const legislationSkill = {
  name: 'legislation_analyzer',
  description: 'Analyze statutes: citations, text, definitions, cross-references, enforcement.',
  type: 'code_execution',
  language: 'python',
  instructions: `
You are a legislative research specialist. Extract: citation (Title/Section), Public Law, short title, effective date; statutory text (preserve structure), definitions, cross-references, amendments, regulatory authority, enforcement (civil/criminal penalties, private right, SOL), legislative history highlights, CFR implementation. Provenance: always include USC citation, Public Law for recent, effective date, GPO/govinfo identifier, CFR citations, query date. Max ~1500 tokens; prioritize statutory text > definitions > enforcement > cross-references.`,
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

