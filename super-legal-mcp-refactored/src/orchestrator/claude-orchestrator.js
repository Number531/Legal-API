/**
 * Claude Sonnet-4 Enhanced Legal Research Orchestrator
 * Leverages Claude's superior reasoning for legal research planning
 */

class ClaudeEnhancedOrchestrator {
    constructor(options) {
      this.apiKey = options.apiKey;
      this.model = 'claude-sonnet-4-5-20250929'; // Latest Claude model
      this.mcpClient = options.mcpClient;
    }
  
    getEnhancedLegalPrompt() {
      return `# Expert Legal Research Strategist
  
  You are an elite legal research specialist with access to 60+ specialized legal databases through MCP tools. Your expertise spans:
  
  ## Core Capabilities
  - **Multi-jurisdictional Analysis**: Federal, state, and regulatory research
  - **Cross-Database Intelligence**: Entity resolution across 14 API modules  
  - **Strategic Tool Selection**: Optimal tool combinations for comprehensive coverage
  - **Pattern Recognition**: Historical precedent analysis and trend identification
  
  ## Research Strategy Framework
  
  ### PHASE 1: Query Analysis & Strategic Planning
  Analyze the legal query to identify:
  - Primary legal domains (bankruptcy, IP, corporate, regulatory, etc.)
  - Required jurisdictional coverage (federal vs state)
  - Entity types involved (companies, individuals, products)
  - Temporal scope (current law vs historical analysis)
  - Strategic research objectives
  
  ### PHASE 2: Tool Orchestration Strategy
  Plan your research approach:
  - **Primary Tools**: Core databases for main legal issues
  - **Cross-Reference Tools**: Entity validation and relationship mapping
  - **Validation Tools**: Citation verification and precedent confirmation
  - **Intelligence Tools**: Pattern analysis and comprehensive entity research
  
  ### PHASE 3: Intelligent Execution
  Execute tools with sophisticated reasoning:
  - Use thinking blocks to explain your research strategy
  - Adapt strategy based on intermediate results
  - Identify connections across different legal domains
  - Synthesize findings for actionable legal intelligence
  
  ## Tool Categories & Strategic Use
  
  ### Litigation Intelligence
  - search_cases + get_case_details + search_opinions (precedent research)
  - search_judges + search_financial_disclosures (judicial analysis)
  - search_audio + get_audio_details (oral argument analysis)
  
  ### Corporate Intelligence  
  - search_sec_filings + get_sec_company_facts (financial analysis)
  - comprehensive_legal_entity_analysis (complete entity profile)
  - search_patents + search_ptab_proceedings (IP portfolio)
  
  ### Regulatory Intelligence
  - search_federal_register + search_cfr (regulatory framework)
  - search_epa_facilities + search_fda_recalls (compliance history)
  - search_state_statute (state-specific requirements)
  
  ### Cross-Domain Analysis
  - Use entity identifiers to trace across databases
  - Correlate timeline events across jurisdictions
  - Identify regulatory-litigation intersections
  
  ## Advanced Reasoning Principles
  
  1. **Legal Domain Expertise**: Apply sophisticated legal reasoning to tool selection
  2. **Strategic Sequencing**: Order tool calls for maximum intelligence gathering
  3. **Adaptive Research**: Modify strategy based on intermediate findings
  4. **Synthesis Excellence**: Combine results into coherent legal analysis
  5. **Risk Assessment**: Identify legal risks and strategic considerations
  
  Think through your research strategy step-by-step, explaining your reasoning for tool selection and execution order.`;
    }
  
    async streamResearchWithClaude(options) {
      const {
        prompt,
        onThinking,
        onToolCall,
        onContent,
        maxTokens = 8000
      } = options;
  
      try {
        // Claude's native streaming with thinking
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: maxTokens,
            messages: [
              { role: "user", content: prompt }
            ],
            system: this.getEnhancedLegalPrompt(),
            tools: await this.getMcpTools(),
            stream: true
          })
        });
  
        const reader = response.body.getReader();
        let toolCalls = [];
        let currentToolCall = null;
  
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
  
          const lines = new TextDecoder().decode(value).split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              
              // Handle thinking blocks
              if (data.type === 'content_block_start' && data.content_block.type === 'thinking') {
                onThinking?.({ 
                  text: 'Analyzing legal research strategy...', 
                  timestamp: new Date().toISOString() 
                });
              }
              
              if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
                if (data.content_block_index === 0) { // Thinking block
                  onThinking?.({ 
                    text: data.delta.text, 
                    timestamp: new Date().toISOString() 
                  });
                } else { // Regular content
                  onContent?.(data.delta.text);
                }
              }
  
              // Handle tool calls with Claude's superior planning
              if (data.type === 'tool_use') {
                currentToolCall = {
                  id: data.id,
                  name: data.name,
                  input: data.input
                };
                
                // Claude provides better context for tool usage
                const legalContext = this.getAdvancedLegalContext(data.name, data.input);
                onToolCall?.({
                  name: data.name,
                  arguments: data.input,
                  context: legalContext,
                  reasoning: "Strategic legal research based on domain analysis"
                });
  
                // Execute MCP tool
                const result = await this.executeMcpTool(data.name, data.input);
                toolCalls.push({
                  tool_use_id: data.id,
                  content: result
                });
              }
            }
          }
        }
  
        return { toolCalls };
  
      } catch (error) {
        console.error('Claude Enhanced Research Error:', error);
        throw error;
      }
    }
  
    getAdvancedLegalContext(toolName, args) {
      const contexts = {
        'search_cases': `Analyzing case law precedents for: ${args.q || 'legal query'}`,
        'search_sec_filings': `Corporate compliance analysis for: ${args.query || 'entity'}`,
        'search_patents': `IP portfolio analysis for: ${args.query || 'technology'}`,
        'comprehensive_legal_entity_analysis': `Complete legal profile for: ${args.entity_name}`,
        'search_judges': `Judicial background research for: ${args.name || 'court analysis'}`,
        'search_federal_register': `Regulatory framework analysis for: ${args.query}`,
        // ... enhanced contexts for all 60+ tools
      };
      
      return contexts[toolName] || `Strategic legal research: ${toolName}`;
    }
  
    async getMcpTools() {
      // Convert MCP tools to Claude's function format
      const mcpTools = await this.mcpClient.listTools();
      
      return mcpTools.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: this.sanitizeSchemaForClaude(tool.inputSchema)
      }));
    }
  
    sanitizeSchemaForClaude(schema) {
      // Claude has more flexible schema handling than OpenAI
      const cleaned = JSON.parse(JSON.stringify(schema || {}));
      
      // Claude handles complex schemas better
      if (!cleaned.type) cleaned.type = "object";
      if (!cleaned.properties) cleaned.properties = {};
      
      return cleaned;
    }
  
    async executeMcpTool(name, input) {
      try {
        const result = await this.mcpClient.callTool({ name, arguments: input });
        return result?.content?.[0]?.text || '';
      } catch (error) {
        return `Error executing ${name}: ${error.message}`;
      }
    }
  }
  
  // Enhanced streaming endpoint for Claude
  app.get('/api/claude/stream', async (req, res) => {
    const query = String(req.query.query || '');
    if (!query) return res.status(400).end('query required');
  
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
  
    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
    
    try {
      const orchestrator = new ClaudeEnhancedOrchestrator({
        apiKey: process.env.ANTHROPIC_API_KEY,
        mcpClient: mcpClient // Your existing MCP client
      });
  
      await orchestrator.streamResearchWithClaude({
        prompt: query,
        onThinking: (thinking) => {
          send({ 
            type: 'enhanced_thinking', 
            text: thinking.text,
            timestamp: thinking.timestamp,
            reasoning_type: 'legal_strategy'
          });
        },
        onToolCall: (toolCall) => {
          send({ 
            type: 'enhanced_tool_call',
            tool: toolCall,
            legal_context: toolCall.context,
            strategic_reasoning: toolCall.reasoning
          });
        },
        onContent: (content) => {
          send({ type: 'delta', text: content });
        }
      });
  
      send({ type: 'final', completed: new Date().toISOString() });
      
    } catch (error) {
      send({ type: 'error', error: error.message });
    } finally {
      res.end();
    }
  });
  
  export { ClaudeEnhancedOrchestrator };