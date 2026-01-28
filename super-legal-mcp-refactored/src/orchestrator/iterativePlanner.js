import OpenAI from 'openai';

// Iterative planner that asks GPT-5 to output a JSON plan of tool steps, executes via MCP (through Responses MCP),
// then repeats until coverage thresholds or iteration/time budgets are met.

export class IterativePlanner {
  constructor({ apiKey, serverUrl, model = 'gpt-5', allowlist = [] } = {}) {
    if (!apiKey) throw new Error('OPENAI_API_KEY required');
    if (!serverUrl) throw new Error('serverUrl required');
    this.client = new OpenAI({ apiKey });
    this.serverUrl = serverUrl;
    this.model = model;
    this.allow = new Set(allowlist);
    this.state = {
      steps: [],
      found: [],
      seen: new Set(),
      rationale: ''
    };
  }

  toolsBlock() {
    return [{ type: 'mcp', server_label: 'legal_research', server_url: this.serverUrl, require_approval: 'never' }];
  }

  async planNext(goal) {
    const resp = await this.client.responses.create({
      model: this.model,
      tools: this.toolsBlock(),
      reasoning: { effort: 'medium' },
      verbosity: 'low',
      text: {
        format: {
          type: 'json_schema',
          json_schema: {
            name: 'iter_step',
            schema: {
              type: 'object',
              required: ['steps', 'rationale'],
              properties: {
                rationale: { type: 'string' },
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['tool', 'arguments'],
                    properties: {
                      tool: { type: 'string' },
                      arguments: { type: 'object' }
                    }
                  }
                }
              }
            },
            strict: true
          }
        }
      },
      input: [{ role: 'user', content: [{ type: 'input_text', text: `Goal: ${goal}
State: ${JSON.stringify({ found: this.state.found.slice(0,3) })}
Plan next 1-3 tool steps (concise).` }] }]
    });
    const plan = JSON.parse(resp.output_text || '{}');
    this.state.rationale = plan.rationale || '';
    return Array.isArray(plan.steps) ? plan.steps : [];
  }

  normalizeDocs(payload) {
    const keys = ['results','opinions','cases','audio_files','dockets','courts'];
    for (const k of keys) {
      const arr = payload?.[k];
      if (Array.isArray(arr)) {
        return arr.map((raw) => ({
          id: raw.id || raw.sha1 || raw.cik || raw.granule_id || raw.url,
          title: raw.title || raw.case_name || raw.section_title,
          url: raw.url || raw.absolute_url || raw.package_link || raw.download_url,
          source: raw.source || k,
          snippet: raw.snippet || ''
        }));
      }
    }
    return [];
  }

  async run(goal, { maxIterations = 6, targetDocs = 8 } = {}) {
    this.state.iterations = 0;
    this.state.toolsUsed = [];
    
    for (let i = 0; i < maxIterations; i++) {
      this.state.iterations = i + 1;
      const steps = await this.planNext(goal);
      
      for (const step of steps) {
        if (this.allow.size && !this.allow.has(step.tool)) continue;
        
        // Track tool usage
        if (!this.state.toolsUsed.includes(step.tool)) {
          this.state.toolsUsed.push(step.tool);
        }
        
        // Ask model to call the tool by emitting a JSON request with MCP tool metadata.
        // In Responses API MCP mode, GPT-5 will directly invoke the tool as needed during planning;
        // Here we ask it to produce a single tool call explicitly.
        const call = await this.client.responses.create({
          model: this.model,
          tools: this.toolsBlock(),
          reasoning: { effort: 'minimal' },
          verbosity: 'low',
          input: [{ role: 'user', content: [{ type: 'input_text', text: `Execute tool ${step.tool} with arguments: ${JSON.stringify(step.arguments || {})}. Return only raw JSON.` }] }]
        });
        let payload = {};
        try { payload = JSON.parse(call.output_text || '{}'); } catch {}
        const docs = this.normalizeDocs(payload);
        for (const d of docs) {
          if (!d.id || this.state.seen.has(d.id)) continue;
          this.state.seen.add(d.id);
          this.state.found.push(d);
        }
        if (this.state.found.length >= targetDocs) return this.state;
      }
    }
    return this.state;
  }
}


