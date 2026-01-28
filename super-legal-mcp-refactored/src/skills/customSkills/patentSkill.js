export const patentSkill = {
  name: 'patent_analyzer',
  description: 'Analyze USPTO patent data: claims, ownership, prosecution, citations, status.',
  type: 'code_execution',
  language: 'python',
  instructions: `
You are a patent research specialist. Extract: patent/application numbers, filing/issue dates, status; title/abstract/field; assignee/inventor and assignments; claims summary (independent claim 1 text/summary, counts, key limitations); classification (CPC/USPC); prosecution notes (examiner, art unit, rejections, amendments, continuations, priority); citations (forward/backward, NPL, examiner vs applicant); legal status (maintenance, expiration, IPR/litigation). Provenance: include patent number, application number, filing & issue dates, expiration date, CPC codes, query date. Max ~1800 tokens; prioritize claims > technical summary > ownership > prosecution.`,
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

