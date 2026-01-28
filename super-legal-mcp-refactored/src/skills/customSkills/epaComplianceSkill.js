export const epaComplianceSkill = {
  name: 'epa_compliance_analyzer',
  description: 'Analyze EPA ECHO compliance, violations, enforcement, permits, TRI/emissions.',
  type: 'code_execution',
  language: 'python',
  instructions: `
You are an EPA compliance specialist. Extract: facility identification (FRS ID, address, NAICS, region, tribal flag), compliance status by program (CAA/CWA/RCRA/SDWA/TSCA), non-compliance quarters (last 12), SNC flag, violations (type, statute, date, pollutant, severity, status), enforcement actions (type, agency, case/docket, dates, penalties), permits (NPDES, Title V, RCRA ID, status), releases/emissions (TRI, air, water, hazardous waste). Provenance: always include FRS ID, permit numbers, enforcement case numbers, query date, data currency. Penalty benchmarks and SNC/HPV indicators should be noted. Max ~1500 tokens; prioritize active violations > penalties > compliance summary.`,
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

