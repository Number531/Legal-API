import OpenAI from 'openai';

// Orchestrator for GPT-5 Responses API with native MCP integration.
// August 15, 2025: Aligns with OpenAI Responses MCP support and streamed mcp_tool_call events.

export class Gpt5Orchestrator {
  constructor({ apiKey, serverUrl, serverLabel = 'legal_research', allowedTools = null, requireApproval = 'never', model = 'gpt-5' } = {}) {
    if (!apiKey) throw new Error('OPENAI_API_KEY required');
    if (!serverUrl) throw new Error('serverUrl required (e.g., stdio://bash?args=/abs/path/run-legal-mcp.sh)');
    this.client = new OpenAI({ apiKey });
    this.serverUrl = serverUrl;
    this.serverLabel = serverLabel;
    this.allowedTools = allowedTools; // array or null
    this.requireApproval = requireApproval; // 'never' | 'always'
    this.model = model;
  }

  buildToolsBlock() {
    const block = {
      type: 'mcp',
      server_label: this.serverLabel,
      server_url: this.serverUrl,
      require_approval: this.requireApproval
    };
    if (Array.isArray(this.allowedTools) && this.allowedTools.length > 0) {
      block.allowed_tools = this.allowedTools;
    }
    return [block];
  }

  async streamResearch({ prompt, reasoningEffort = 'medium', verbosity = 'medium', showReasoning = true, onContent, onToolCall, onThinking } = {}) {
    const stream = await this.client.responses.create({
      model: this.model,
      stream: true,
      tools: this.buildToolsBlock(),
      reasoning: { 
        effort: reasoningEffort,
        summary: showReasoning ? "auto" : null  // Enable reasoning visibility
      },
      text: { 
        format: { type: "text" },
        verbosity: verbosity
      },
      input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }]}]
    });

    const toolCalls = [];
    let output = '';
    let reasoning = '';

    for await (const chunk of stream) {
      const item = chunk.output?.[0];
      if (!item) continue;

      // Handle thinking/reasoning events
      if (item.type === 'thinking' || item.type === 'reasoning') {
        reasoning += item.text || '';
        if (typeof onThinking === 'function') {
          try { onThinking({ text: item.text, timestamp: new Date().toISOString() }); } catch {}
        }
        continue;
      }

      if (item.type === 'mcp_tool_call') {
        toolCalls.push({ name: item.name, arguments: item.arguments, at: new Date().toISOString() });
        if (typeof onToolCall === 'function') {
          try { onToolCall({ name: item.name, arguments: item.arguments }); } catch {}
        }
        continue;
      }

      if (item.content) {
        output += item.content;
        if (typeof onContent === 'function') {
          try { onContent(item.content); } catch {}
        }
      }
    }

    return { text: output, toolCalls, reasoning };
  }

  async runResearch({ prompt, reasoningEffort = 'medium', verbosity = 'medium', responseFormat = null }) {
    const req = {
      model: this.model,
      tools: this.buildToolsBlock(),
      reasoning: { effort: reasoningEffort },
      verbosity: verbosity,
      input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }]}]
    };
    if (responseFormat) {
      req.text = {
        format: responseFormat
      };
    }

    const resp = await this.client.responses.create(req);
    return {
      text: resp.output_text,
      usage: resp.usage,
      id: resp.id
    };
  }
}


