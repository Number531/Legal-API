import OpenAI from 'openai';
import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ENHANCED_LEGAL_RESEARCH_PROMPT } from './enhancedPrompt.js';

function sanitizeMcpSchema(schema) {
  try {
    const clone = JSON.parse(JSON.stringify(schema || { type: 'object' }));
    if (clone && clone.properties && typeof clone.properties === 'object') {
      for (const key of Object.keys(clone.properties)) {
        const prop = clone.properties[key];
        if (prop && typeof prop === 'object') {
          if (Object.prototype.hasOwnProperty.call(prop, 'required') && typeof prop.required !== 'object') {
            delete prop.required;
          }
        }
      }
    }
    if (!clone.type) clone.type = 'object';
    if (clone.required && !Array.isArray(clone.required)) delete clone.required;
    return clone;
  } catch {
    return { type: 'object' };
  }
}

function toOpenAIFunctions(mcpTools) {
  return mcpTools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description || '',
      parameters: sanitizeMcpSchema(t.inputSchema)
    }
  }));
}

export class Gpt5Bridge {
  constructor({ apiKey, runnerPath, model = 'gpt-5' } = {}) {
    if (!apiKey) throw new Error('OPENAI_API_KEY required');
    if (!runnerPath) throw new Error('runnerPath required (absolute path to run-legal-mcp.sh)');
    this.client = new OpenAI({ apiKey });
    this.runnerPath = runnerPath;
    this.model = model;
  }

  async connectMCP() {
    const transport = new StdioClientTransport({ command: 'bash', args: [this.runnerPath] });
    const mcp = new MCPClient({ name: 'gpt5-bridge', version: '1.0.0' }, { capabilities: {} });
    await mcp.connect(transport);
    return mcp;
  }

  withTimeout(promise, ms, label) {
    let to;
    const timeout = new Promise((_, rej) => {
      to = setTimeout(() => rej(new Error(`timeout after ${ms}ms: ${label}`)), ms);
    });
    return Promise.race([promise.finally(() => clearTimeout(to)), timeout]);
  }

  applySafeDefaults(name, args) {
    const a = { ...(args || {}) };
    // Constrain broad searches to max 15 results
    if (/^search_/.test(name) || name.includes('list')) {
      const lim = Number(a.limit || a.page_size || 0);
      const safe = Math.max(1, Math.min(lim || 15, 15));
      if ('limit' in a) a.limit = safe; else a.limit = safe;
      if ('page_size' in a) a.page_size = safe;
    }
    return a;
  }

  async runResearch(query) {
    const mcp = await this.connectMCP();
    const tools = await mcp.listTools();
    const functions = toOpenAIFunctions(tools.tools);

    const messages = [
      { role: 'system', content: ENHANCED_LEGAL_RESEARCH_PROMPT + '\n\nCRITICAL: You MUST NOT make more than 3-5 tool calls total. Combine search terms using OR operators instead of separate searches.' },
      { role: 'user', content: query }
    ];

    const first = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: functions,
      tool_choice: 'auto'
    });

    const tcalls = first.choices?.[0]?.message?.tool_calls || [];
    if (tcalls.length === 0) {
      return { text: first.choices?.[0]?.message?.content || '' };
    }

    messages.push(first.choices[0].message);
    
    // Execute all tool calls in parallel
    const toolPromises = tcalls.map(async (tc) => {
      const name = tc.function.name;
      let args = {};
      try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
      args = this.applySafeDefaults(name, args);
      
      try {
        const result = await this.withTimeout(mcp.callTool({ name, arguments: args }), 45000, `tools/call ${name}`);
        const text = result.content?.[0]?.text || '';
        return { id: tc.id, content: text };
      } catch (error) {
        console.error(`Tool call failed: ${name}`, error.message);
        return { id: tc.id, content: `Error: ${error.message}` };
      }
    });
    
    // Wait for all tool calls to complete
    const results = await Promise.all(toolPromises);
    
    // Add results to messages
    for (const result of results) {
      messages.push({ role: 'tool', tool_call_id: result.id, content: result.content });
    }

    const final = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: functions,
      tool_choice: 'none'
    });
    return { text: final.choices?.[0]?.message?.content || '' };
  }
}


