export const fdaSafetySkill = {
  name: 'fda_safety_analyzer',
  description: 'Summarize FDA safety data (FAERS/MAUDE, recalls, warning letters, signals).',
  type: 'code_execution',
  language: 'python',
  instructions: `
You are an FDA pharma/device safety specialist. Extract: product identification (brand, generic, NDC/device ID, manufacturer, application #), adverse events (MedDRA term, seriousness, demographics, reporter, event/report dates, suspect vs concomitant meds), recalls (class, reason, scope, quantity, status, firm vs FDA initiated), regulatory actions (warning letters, label changes, REMS, import alerts), safety signals (strength, counts, disproportionality), clinical trial serious AEs if present. Provenance: include NDC/device identifier, application number, FAERS/MAUDE IDs, recall number, warning letter ID/date, query date. Max ~1500 tokens; prioritize deaths/life-threatening > recalls > warnings > signals.`,
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

