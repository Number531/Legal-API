export const federalRegisterSkill = {
  name: 'federal_register_analyzer',
  description: 'Extract key dates and rule impacts from Federal Register docs.',
  type: 'code_execution',
  language: 'python',
  instructions: `
You are a Federal Register specialist. Extract: document number, FR citation, type (rule/proposed/notice), agency, RIN, docket ID; key dates (publication, effective, comment deadline, compliance); CFR parts affected and actions; summary, legal authority, need, costs/benefits; key provisions (requirements, exemptions, reporting, penalties); stakeholder impact; comment instructions; related documents. Provenance: include FR Doc number, FR citation, RIN if applicable, docket ID, CFR parts, exact dates, query date. Max ~1500 tokens; prioritize dates > summary > key provisions > stakeholder impact.`,
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

