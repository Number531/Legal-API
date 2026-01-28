export const productSafetySkill = {
  name: 'product_safety_analyzer',
  description: 'Summarize CPSC/NHTSA recalls, hazards, remedies, and casualty counts.',
  type: 'code_execution',
  language: 'python',
  instructions: `
You are a product safety specialist. Extract: product/brand, manufacturer, model numbers, UPCs, manufacture date range, country of origin, units affected; hazards (type, description), incidents, injuries, deaths (flag prominently); recall details (CPSC/NHTSA campaign #, date, type, remedy and availability); vehicle specifics (make/model/year, VIN range, component, consequence); consumer actions and contacts; investigation status; compliance/standards; penalties benchmarks. Provenance: include recall/campaign number, recall date, manufacturer, model numbers, VIN ranges (if vehicle), ODI investigation #, query date. Max ~1200 tokens; prioritize deaths/injuries > hazard > remedy > affected products.`,
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

