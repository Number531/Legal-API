export const ptabSkill = {
  name: 'ptab_analyzer',
  description: 'Summarize PTAB proceedings (IPR/PGR/CBM) outcomes and grounds.',
  type: 'code_execution',
  language: 'python',
  instructions: `
You are a PTAB specialist. Extract: proceeding number/type, petition/institution/final decision dates, status; patent at issue (number, owner), claims challenged and outcomes; parties and real parties in interest; grounds (§102/§103) with prior art; institution decision (claims instituted/denied, key art); final written decision (claims unpatentable/upheld, claim-by-claim analysis); claim construction; procedural history (motions, oral hearing, Fed. Cir. appeal); estoppel implications. Provenance: include PTAB proceeding number, patent number, petition/institution/decision dates, claim numbers, prior art refs, query date. Max ~1800 tokens; prioritize outcome > grounds > prior art > claim construction.`,
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

