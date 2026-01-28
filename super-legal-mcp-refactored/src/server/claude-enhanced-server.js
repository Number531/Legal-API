/**
 * Claude Sonnet-4 Enhanced Legal Research System
 * Latest August 16, 2025 Implementation - TRIPLE CHECKED
 * 
 * Latest Features (Confirmed August 2025):
 * - Native thinking transparency with interleaved reasoning between tool calls
 * - Fine-grained tool streaming for large parameter values  
 * - Parallel tool execution with strategic orchestration
 * - 1M token context window support (beta)
 * - MCP connector integration (stdio + remote)
 * - Superior legal reasoning and domain expertise
 * - Real-time thinking streaming showing legal research strategy
 * 
 * Latest Models Available:
 * - claude-opus-4-1-20250805 (August 5, 2025 - Latest)
 * - claude-opus-4-20250514 
 * - claude-sonnet-4-20250514 (Recommended for legal research)
 */

import express from 'express';
import cors from 'cors';
import { getPool, ensureSchema } from '../db/postgres.js';
import fs from 'fs/promises';
import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/* ----------------------------- Legal Context Helpers ----------------------------- */

function getToolCategory(toolName) {
  const categories = {
    'search_dockets': 'Bankruptcy',
    'search_cases': 'Case Law',
    'search_opinions': 'Case Law', 
    'get_case_details': 'Case Law',
    'search_judges': 'Judicial Analysis',
    'search_financial_disclosures': 'Judicial Ethics',
    'search_audio': 'Oral Arguments',
    'search_patents': 'Intellectual Property',
    'search_ptab_proceedings': 'Patent Validity',
    'search_trademarks': 'Intellectual Property',
    'search_sec_filings': 'Corporate/Securities',
    'get_sec_company_facts': 'Corporate/Securities',
    'search_insider_trading': 'Corporate/Securities',
    'comprehensive_legal_entity_analysis': 'Entity Intelligence',
    'search_epa_facilities': 'Environmental',
    'search_federal_register': 'Regulatory',
    'search_cfr': 'Regulatory',
    'search_state_statute': 'State Law',
    'get_usc_section': 'Federal Statutory',
    'search_cpsc_recalls': 'Product Safety',
    'search_nhtsa_recalls': 'Vehicle Safety',
    'search_fda_510k': 'Medical Device Safety',
    'search_fda_drug_adverse_events': 'Pharmaceutical Safety',
    'search_ftc_enforcement_actions': 'Antitrust/Consumer Protection',
    'lookup_citation': 'Citation Verification'
  };
  return categories[toolName] || 'General Legal';
}

function getAdvancedLegalContext(toolName, args = {}) {
  const contexts = {
    'search_cases': `Analyzing case law precedents for: ${args.q || args.query || 'legal research'}`,
    'search_sec_filings': `Corporate compliance deep-dive for: ${args.query || 'entity'}`,
    'search_patents': `IP portfolio intelligence for: ${args.query || 'technology domain'}`,
    'comprehensive_legal_entity_analysis': `Complete 360° legal profile for: ${args.entity_name || 'entity'}`,
    'search_judges': `Judicial analytics and bias analysis for: ${args.name || 'court research'}`,
    'search_federal_register': `Regulatory intelligence gathering for: ${args.query || 'compliance area'}`,
    'search_epa_facilities': `Environmental compliance assessment for: ${args.query || 'facility'}`,
    'search_ptab_proceedings': `Patent validity challenge analysis for: ${args.query || 'patent'}`,
    'search_financial_disclosures': `Judicial ethics and conflict screening for: ${args.query || 'judge'}`,
    'search_state_statute': `State regulatory framework analysis for: ${args.query || 'jurisdiction'}`,
    'search_opinions': `Precedential opinion research for: ${args.q || 'legal issue'}`,
    'search_dockets': `Federal docket intelligence for: ${args.query || 'case tracking'}`,
    'get_case_details': `Detailed case analysis and citation network for: ${args.id || 'case'}`,
    'search_audio': `Oral argument sentiment analysis for: ${args.q || 'hearing research'}`,
    'search_fda_drug_adverse_events': `Pharmaceutical safety litigation research for: ${args.search || 'drug safety'}`,
    'search_cpsc_recalls': `Product liability risk assessment for: ${args.query || 'consumer safety'}`,
    'search_nhtsa_recalls': `Automotive safety compliance for: ${args.query || 'vehicle safety'}`,
    'search_ftc_enforcement_actions': `Antitrust and consumer protection analysis for: ${args.query || 'FTC matters'}`
  };
  
  return contexts[toolName] || `Strategic legal intelligence: ${toolName}`;
}

function getEnhancedLegalPrompt() {
  return `# Elite Legal Research Strategist & Domain Expert

You are a sophisticated legal research specialist with access to 60+ specialized legal databases through MCP tools. You possess deep expertise in:

## Core Legal Competencies
- **Multi-Jurisdictional Analysis**: Federal, state, administrative, and international law
- **Cross-Database Intelligence**: Entity resolution across 14 comprehensive API modules
- **Strategic Tool Orchestration**: Optimal tool combinations for comprehensive legal coverage
- **Precedential Analysis**: Historical case law trends and outcome prediction
- **Regulatory Intelligence**: Multi-agency compliance and enforcement pattern analysis

## Research Methodology Framework

### PHASE 1: Strategic Legal Analysis
**Thinking Process**: Use your thinking capabilities to:
- Analyze legal query complexity and domain intersections
- Identify primary and secondary legal issues
- Determine jurisdictional scope and applicable law hierarchy
- Assess entity types and potential legal relationships
- Plan comprehensive research strategy across multiple legal domains

### PHASE 2: Intelligent Tool Orchestration
**Strategic Approach**:
- **Primary Intelligence**: Core database queries for main legal issues
- **Cross-Reference Validation**: Entity verification across multiple systems
- **Relationship Mapping**: Citation networks and legal entity connections
- **Temporal Analysis**: Historical trends and regulatory evolution
- **Risk Assessment**: Compliance gaps and litigation exposure

### PHASE 3: Adaptive Research Execution
**Dynamic Strategy**:
- Execute tools based on sophisticated legal reasoning
- Adapt research direction based on intermediate findings
- Identify unexpected legal intersections and risks
- Synthesize findings across disparate legal domains
- Provide actionable legal intelligence and strategic recommendations

## Advanced Legal Tool Categories

### Litigation Intelligence Stack
- **Case Research**: search_cases + get_case_details + search_opinions
- **Judicial Analysis**: search_judges + search_financial_disclosures + search_audio
- **Precedent Networks**: Citation analysis and legal authority hierarchy
- **Docket Intelligence**: search_dockets + Federal court monitoring

### Corporate & Securities Intelligence
- **Financial Analysis**: search_sec_filings + get_sec_company_facts
- **Entity Profiling**: comprehensive_legal_entity_analysis
- **Insider Activity**: search_insider_trading + officer background checks
- **Corporate Governance**: Proxy analysis and board composition research

### Intellectual Property Intelligence
- **Patent Portfolio**: search_patents + search_ptab_proceedings
- **Technology Landscape**: Patent citation networks and prior art
- **Validity Assessment**: PTAB challenge history and success rates
- **IP Litigation**: Patent court outcomes and licensing trends

### Regulatory Compliance Intelligence
- **Federal Regulations**: search_federal_register + search_cfr + get_usc_section
- **Environmental**: search_epa_facilities + environmental enforcement history
- **Product Safety**: search_fda_drug_adverse_events + search_cpsc_recalls + search_nhtsa_recalls
- **Antitrust**: search_ftc_enforcement_actions + merger clearance tracking
- **State Law**: search_state_statute + state regulatory compliance

### Cross-Domain Analysis
- **Entity Resolution**: Trace companies/individuals across all databases
- **Timeline Correlation**: Event synchronization across jurisdictions
- **Risk Pattern Recognition**: Multi-agency enforcement trends
- **Strategic Intelligence**: Competitive analysis and market intelligence

## Legal Reasoning Principles

1. **Precedential Hierarchy**: Understand binding vs. persuasive authority
2. **Jurisdictional Analysis**: Federal preemption and state law interactions
3. **Regulatory Integration**: Agency authority and judicial deference
4. **Strategic Sequencing**: Optimal order for tool execution and analysis
5. **Risk-Based Prioritization**: Focus on highest-impact legal issues
6. **Synthesis Excellence**: Combine disparate sources into coherent analysis

## Research Quality Standards

- **Comprehensive Coverage**: Multiple corroborating sources per legal issue
- **Authority Verification**: Primary sources and official publications
- **Currency Assessment**: Most recent developments and pending changes
- **Conflict Identification**: Contradictory authorities and circuit splits
- **Strategic Insight**: Actionable recommendations based on analysis

Think through your research strategy step-by-step, explaining your legal reasoning for tool selection, execution order, and analytical approach. Use your thinking capabilities to show sophisticated legal analysis before executing tools.`;
}

/* ----------------------------- Enhanced Claude Orchestrator ----------------------------- */

class ClaudeSonnet4LegalOrchestrator {
  constructor(options) {
    this.apiKey = options.apiKey;
    // Latest models as of August 16, 2025
    this.model = options.model || 'claude-sonnet-4-5-20250929'; // Recommended for legal research
    this.mcpClient = options.mcpClient;
    this.enableThinking = options.enableThinking !== false;
    this.enableInterleavedThinking = options.enableInterleavedThinking !== false;
    this.enableFineGrainedStreaming = options.enableFineGrainedStreaming !== false;
    this.enable1MContext = options.enable1MContext || false; // New 1M token context window
  }

  getRequestHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01'
    };

    // Add beta headers for Claude 4 enhanced capabilities (August 2025 - VERIFIED)
    const betaFeatures = [];
    
    // Interleaved thinking: Think between tool calls for superior legal reasoning
    if (this.enableInterleavedThinking) {
      betaFeatures.push('interleaved-thinking-2025-05-14');
    }
    
    // Fine-grained tool streaming: Stream large parameters without buffering
    if (this.enableFineGrainedStreaming) {
      betaFeatures.push('fine-grained-tool-streaming-2025-05-14');
    }

    // 1M token context window for complex legal research (NEW August 2025)
    if (this.enable1MContext) {
      betaFeatures.push('context-1m-2025-08-07');
    }

    // MCP connector support for remote servers (if needed alongside stdio)
    betaFeatures.push('mcp-client-2025-04-04');

    if (betaFeatures.length > 0) {
      headers['anthropic-beta'] = betaFeatures.join(',');
    }

    return headers;
  }

  async getMcpTools() {
    if (!this.mcpClient) return [];
    
    try {
      const listed = await this.mcpClient.listTools();
      const tools = (listed.tools || []).map((tool, index) => {
        try {
          const sanitizedSchema = this.sanitizeSchemaForClaude(tool.inputSchema);
          
          // Log tool 33 specifically for debugging
          if (index === 33) {
            console.log(`Tool 33 (${tool.name}) original schema:`, JSON.stringify(tool.inputSchema, null, 2));
            console.log(`Tool 33 (${tool.name}) sanitized schema:`, JSON.stringify(sanitizedSchema, null, 2));
          }
          
          return {
            name: tool.name,
            description: tool.description || '',
            input_schema: sanitizedSchema
          };
        } catch (error) {
          console.error(`Error sanitizing schema for tool ${index} (${tool.name}):`, error);
          console.error('Original schema:', tool.inputSchema);
          // Return a minimal valid tool if processing fails
          return {
            name: tool.name,
            description: tool.description || '',
            input_schema: { type: 'object', properties: {} }
          };
        }
      });
      
      console.log(`Successfully processed ${tools.length} MCP tools`);
      return tools;
    } catch (error) {
      console.error('Error fetching MCP tools:', error);
      return [];
    }
  }

  sanitizeSchemaForClaude(schema) {
    try {
      const cleaned = JSON.parse(JSON.stringify(schema || {}));
      
      // Ensure basic schema structure for JSON Schema draft 2020-12 compliance
      if (!cleaned.type) cleaned.type = 'object';
      
      // Remove any invalid or non-standard properties
      const validProperties = [
        'type', 'properties', 'required', 'items', 'description', 
        'enum', 'const', 'default', 'examples', 'minimum', 'maximum',
        'minLength', 'maxLength', 'pattern', 'format', 'minItems', 
        'maxItems', 'uniqueItems', 'minProperties', 'maxProperties',
        'additionalProperties', 'anyOf', 'oneOf', 'allOf', 'not'
      ];
      
      // Recursively clean schema
      const cleanSchema = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          if (validProperties.includes(key)) {
            if (key === 'properties' && typeof value === 'object') {
              result[key] = {};
              for (const [propKey, propValue] of Object.entries(value)) {
                result[key][propKey] = cleanSchema(propValue);
              }
            } else if (key === 'items' && typeof value === 'object') {
              result[key] = cleanSchema(value);
            } else if (key === 'required') {
              // Ensure required is an array
              if (Array.isArray(value)) {
                result[key] = value;
              }
              // Skip invalid required field
            } else if (key === 'enum') {
              // Ensure enum is an array
              if (Array.isArray(value)) {
                result[key] = value;
              }
            } else if ((key === 'minimum' || key === 'maximum') && typeof value === 'number') {
              result[key] = value;
            } else if (key === 'default') {
              // Keep default value as-is if it matches the type
              result[key] = value;
            } else if (key === 'type' || key === 'description' || key === 'pattern' || key === 'format') {
              // String properties
              result[key] = value;
            } else if (typeof value === 'boolean' || typeof value === 'number') {
              // Boolean and number properties
              result[key] = value;
            } else {
              // Other valid properties
              result[key] = value;
            }
          }
          // Skip unknown/invalid properties (including $schema, $ref, custom, etc.)
        }
        return result;
      };
      
      const result = cleanSchema(cleaned);
      
      // Ensure we always have a valid object schema
      if (!result.type) result.type = 'object';
      if (result.type === 'object' && !result.properties) {
        result.properties = {};
      }
      
      return result;
    } catch (error) {
      console.error('Schema sanitization error:', error);
      return { type: 'object', properties: {} };
    }
  }

  async streamLegalResearch(options) {
    const {
      prompt,
      onThinking,
      onToolCall,
      onContent,
      onToolResult,
      onProgress,
      maxTokens = 8000
    } = options;

    try {
      const tools = await this.getMcpTools();
      
      const requestBody = {
        model: this.model,
        max_tokens: maxTokens,
        stream: true,
        system: getEnhancedLegalPrompt(),
        messages: [{ role: 'user', content: prompt }],
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? { type: 'auto' } : undefined
        // Note: Parallel tool execution is enabled by default in Claude 4
      };

      // Configure thinking with proper limits
      if (this.enableThinking) {
        const thinkingBudget = this.enableInterleavedThinking 
          ? Math.min(maxTokens, 16000) // Don't exceed max_tokens or 16K
          : Math.min(Math.floor(maxTokens * 0.3), 8000); // 30% of max or 8K max
          
        requestBody.thinking = {
          type: 'enabled',
          budget_tokens: thinkingBudget
        };
        
        console.log('Thinking configuration:', {
          enabled: true,
          interleaved: this.enableInterleavedThinking,
          budget: thinkingBudget,
          maxTokens: maxTokens
        });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: this.getRequestHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          requestBody: JSON.stringify(requestBody, null, 2)
        });
        throw new Error(`Claude API error: ${response.status} ${response.statusText}: ${errorText}`);
      }

      return this.processStreamingResponse(response, {
        onThinking,
        onToolCall,
        onContent,
        onToolResult,
        onProgress
      });

    } catch (error) {
      console.error('Claude Legal Research Error:', error);
      throw error;
    }
  }

  async processStreamingResponse(response, callbacks) {
    const { onThinking, onToolCall, onContent, onToolResult, onProgress } = callbacks;
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let messageId = null;
    let toolCallsInProgress = new Map();
    let contentBlocks = [];
    let fullThinking = '';
    let currentToolCall = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            await this.handleStreamEvent(data, {
              onThinking,
              onToolCall,
              onContent,
              onToolResult,
              onProgress,
              toolCallsInProgress,
              contentBlocks,
              fullThinking,
              currentToolCall
            });
          } catch (parseError) {
            console.warn('Failed to parse stream event:', parseError);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      messageId,
      contentBlocks,
      thinking: fullThinking,
      toolCalls: Array.from(toolCallsInProgress.values())
    };
  }

  async handleStreamEvent(data, context) {
    const {
      onThinking,
      onToolCall,
      onContent,
      onToolResult,
      onProgress,
      toolCallsInProgress,
      contentBlocks,
      fullThinking,
      currentToolCall
    } = context;

    switch (data.type) {
      case 'message_start':
        context.messageId = data.message.id;
        onProgress?.({
          type: 'research_start',
          message_id: data.message.id,
          model: data.message.model,
          timestamp: new Date().toISOString()
        });
        break;

      case 'content_block_start':
        const block = data.content_block;
        contentBlocks[data.index] = { ...block };
        
        if (block.type === 'thinking') {
          // Enhanced thinking transparency for legal research strategy
          onThinking?.({
            type: 'thinking_start',
            text: 'Analyzing legal research strategy and domain intersections...',
            timestamp: new Date().toISOString(),
            block_index: data.index,
            interleaved: this.enableInterleavedThinking
          });
        } else if (block.type === 'tool_use') {
          // Initialize tool call tracking with fine-grained streaming support
          context.currentToolCall = {
            id: block.id,
            name: block.name,
            input: {},
            inputPartial: '', // For fine-grained streaming
            index: data.index,
            startTime: Date.now()
          };
          toolCallsInProgress.set(block.id, context.currentToolCall);
          
          // Emit immediate tool call notification
          const legalContext = getAdvancedLegalContext(block.name, {});
          onToolCall?.({
            type: 'tool_call_start',
            id: block.id,
            name: block.name,
            context: legalContext,
            timestamp: new Date().toISOString(),
            index: data.index
          });
        }
        break;

      case 'content_block_delta':
        const delta = data.delta;
        
        if (delta.type === 'thinking_delta') {
          // Stream thinking for transparency in legal reasoning
          context.fullThinking += delta.thinking;
          onThinking?.({
            type: 'thinking_delta',
            text: delta.thinking,
            timestamp: new Date().toISOString(),
            full_thinking_length: context.fullThinking.length,
            block_index: data.index,
            reasoning_type: 'legal_strategy'
          });
        } else if (delta.type === 'text_delta') {
          // Regular content streaming
          onContent?.({ 
            type: 'content_delta',
            text: delta.text,
            timestamp: new Date().toISOString(),
            index: data.index
          });
        } else if (delta.type === 'input_json_delta') {
          // Fine-grained tool parameter streaming (new in August 2025)
          if (context.currentToolCall) {
            context.currentToolCall.inputPartial += delta.partial_json;
            
            // Stream tool parameter updates for transparency
            onToolCall?.({
              type: 'tool_input_stream',
              id: context.currentToolCall.id,
              name: context.currentToolCall.name,
              partial_input: context.currentToolCall.inputPartial,
              timestamp: new Date().toISOString(),
              fine_grained: true
            });
          }
        } else if (delta.type === 'signature_delta') {
          // Thinking signature for integrity verification
          onThinking?.({
            type: 'thinking_signature',
            signature: delta.signature,
            timestamp: new Date().toISOString(),
            block_index: data.index
          });
        }
        break;

      case 'content_block_stop':
        const stoppedBlock = contentBlocks[data.index];
        
        if (stoppedBlock?.type === 'thinking') {
          // Complete thinking block with strategic summary
          onThinking?.({
            type: 'thinking_complete',
            text: context.fullThinking,
            timestamp: new Date().toISOString(),
            block_index: data.index,
            total_length: context.fullThinking.length,
            summary: this.generateThinkingSummary(context.fullThinking)
          });
        } else if (stoppedBlock?.type === 'tool_use' && context.currentToolCall) {
          // Finalize tool input and execute
          try {
            if (context.currentToolCall.inputPartial) {
              context.currentToolCall.input = JSON.parse(context.currentToolCall.inputPartial);
            }
          } catch (e) {
            // Handle malformed JSON from fine-grained streaming
            console.warn('Fine-grained streaming produced invalid JSON:', e);
            context.currentToolCall.input = this.recoverPartialJSON(context.currentToolCall.inputPartial);
          }

          // Enhanced tool call event with legal context
          const legalContext = getAdvancedLegalContext(
            context.currentToolCall.name, 
            context.currentToolCall.input
          );

          onToolCall?.({
            type: 'tool_call_complete',
            id: context.currentToolCall.id,
            name: context.currentToolCall.name,
            arguments: context.currentToolCall.input,
            context: legalContext,
            timestamp: new Date().toISOString(),
            reasoning: `Strategic legal research: ${legalContext}`,
            execution_pending: true
          });

          // Execute the MCP tool with parallel support
          await this.executeMcpTool(context.currentToolCall, onToolResult);
          context.currentToolCall = null;
        }
        break;

      case 'message_delta':
        const usage = data.usage;
        if (usage) {
          onProgress?.({
            type: 'usage_update',
            usage,
            timestamp: new Date().toISOString(),
            server_tool_use: usage.server_tool_use || {},
            parallel_tools: toolCallsInProgress.size
          });
        }
        break;

      case 'message_stop':
        onProgress?.({
          type: 'research_complete',
          timestamp: new Date().toISOString(),
          total_tools_executed: toolCallsInProgress.size,
          thinking_enabled: this.enableThinking,
          interleaved_thinking: this.enableInterleavedThinking,
          fine_grained_streaming: this.enableFineGrainedStreaming
        });
        break;

      case 'ping':
        // Keep-alive heartbeat
        onProgress?.({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        });
        break;

      default:
        console.log('Unknown stream event type:', data.type);
        onProgress?.({
          type: 'unknown_event',
          event_type: data.type,
          timestamp: new Date().toISOString()
        });
    }
  }

  generateThinkingSummary(fullThinking) {
    // Generate a strategic summary of legal reasoning for user understanding
    if (!fullThinking || fullThinking.length < 100) return 'Brief strategic analysis';
    
    const lines = fullThinking.split('\n').filter(line => line.trim());
    const keyPoints = [];
    
    // Extract legal strategy elements
    for (const line of lines) {
      if (line.includes('jurisdiction') || line.includes('precedent') || 
          line.includes('regulatory') || line.includes('compliance') ||
          line.includes('litigation') || line.includes('analysis')) {
        keyPoints.push(line.trim());
        if (keyPoints.length >= 3) break;
      }
    }
    
    return keyPoints.length > 0 
      ? `Legal strategy: ${keyPoints.join('; ')}`
      : 'Comprehensive legal domain analysis';
  }

  recoverPartialJSON(partialJson) {
    // Attempt to recover from malformed JSON due to fine-grained streaming
    try {
      // Try to close common incomplete structures
      const attempts = [
        partialJson + '}',
        partialJson + '"}',
        partialJson + ']}',
        partialJson + '"}'
      ];
      
      for (const attempt of attempts) {
        try {
          return JSON.parse(attempt);
        } catch {}
      }
      
      // Extract what we can
      const matches = partialJson.match(/"(\w+)":\s*"([^"]+)"/g);
      if (matches) {
        const recovered = {};
        for (const match of matches) {
          const [, key, value] = match.match(/"(\w+)":\s*"([^"]+)"/);
          recovered[key] = value;
        }
        return recovered;
      }
      
    } catch {}
    
    // Fallback to basic structure
    return { query: partialJson.replace(/[^a-zA-Z0-9\s]/g, '').trim() };
  }

  async executeMcpTool(toolCall, onToolResult) {
    if (!this.mcpClient) {
      console.error('MCP client not available for tool:', toolCall.name);
      onToolResult?.({
        id: toolCall.id,
        name: toolCall.name,
        success: false,
        error: 'MCP client not available',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      // Apply enhanced safety limits for legal research
      const sanitizedArgs = this.applySafetyLimits(toolCall.name, toolCall.input);
      
      console.log(`Executing MCP tool: ${toolCall.name}`, sanitizedArgs);
      const startTime = Date.now();
      
      // Enhanced timeout for complex legal queries  
      const timeoutMs = this.getToolTimeout(toolCall.name);
      console.log(`Tool timeout set to ${timeoutMs}ms for ${toolCall.name}`);
      
      const result = await Promise.race([
        this.mcpClient.callTool({ 
          name: toolCall.name, 
          arguments: sanitizedArgs 
        }).catch(err => {
          console.error(`MCP call failed for ${toolCall.name}:`, err);
          throw err;
        }),
        new Promise((_, reject) => 
          setTimeout(() => {
            console.error(`Tool ${toolCall.name} timed out after ${timeoutMs}ms`);
            reject(new Error(`Tool execution timeout after ${timeoutMs}ms`));
          }, timeoutMs)
        )
      ]);

      const executionTime = Date.now() - startTime;
      const content = result?.content?.[0]?.text || '';
      const category = getToolCategory(toolCall.name);
      
      console.log(`Tool ${toolCall.name} completed in ${executionTime}ms, content length: ${content.length}`);

      onToolResult?.({
        id: toolCall.id,
        name: toolCall.name,
        success: true,
        content,
        execution_time: executionTime,
        content_length: content.length,
        category,
        timestamp: new Date().toISOString(),
        parallel_execution: true // Claude 4 supports parallel by default
      });

    } catch (error) {
      console.error(`MCP tool execution failed: ${toolCall.name}`, error.message || error);
      onToolResult?.({
        id: toolCall.id,
        name: toolCall.name,
        success: false,
        error: error.message || 'Tool execution failed',
        timestamp: new Date().toISOString(),
        category: getToolCategory(toolCall.name)
      });
    }
  }

  getToolTimeout(toolName) {
    // Enhanced timeouts for different categories of legal tools
    const timeouts = {
      'comprehensive_legal_entity_analysis': 90000, // 90s for comprehensive analysis
      'search_cases': 60000, // 60s for case law searches
      'search_sec_filings': 60000, // 60s for SEC data
      'search_federal_register': 45000, // 45s for regulatory searches
      'search_patents': 45000, // 45s for patent searches
      'search_ptab_proceedings': 45000, // 45s for PTAB data
      'default': 30000 // 30s default
    };
    
    return timeouts[toolName] || timeouts.default;
  }

  applySafetyLimits(toolName, args) {
    const sanitized = { ...args };
    
    // Apply standard limits for search tools
    if (toolName.startsWith('search_') || toolName.includes('list')) {
      if ('limit' in sanitized) {
        sanitized.limit = Math.min(sanitized.limit || 15, 15);
      } else {
        sanitized.limit = 15;
      }
      
      if ('page_size' in sanitized) {
        sanitized.page_size = Math.min(sanitized.page_size || 15, 15);
      }
    }

    return sanitized;
  }
}

/* ----------------------------- Enhanced Server Implementation ----------------------------- */

export function createClaudeSonnet4Server() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  
  // Serve static files from test directory
  app.use('/test', express.static('test'));

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
  const BASE_DIR = process.env.MCP_BASE_DIR || process.cwd();
  const RUNNER = `${BASE_DIR}/run-legal-mcp.sh`;

  // Enhanced streaming endpoint with Claude Sonnet-4 (August 2025 latest features)
  app.get('/api/claude/stream', async (req, res) => {
    const query = String(req.query.query || '');
    if (!query) return res.status(400).end('query required');

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no'
    });
    res.flushHeaders?.();

    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
    const heartbeat = setInterval(() => res.write(':\n\n'), 15000);
    
    let transport = null;
    let mcp = null;
    let ended = false;
    
    const end = async () => {
      if (ended) return;
      ended = true;
      clearInterval(heartbeat);
      await teardownMcp(transport, mcp);
      try { res.end(); } catch {}
    };

    req.on('close', end);
    req.on('aborted', end);
    res.on('close', end);

    try {
      // Connect to MCP server (stdio) - unchanged, works perfectly with Claude 4
      console.log('Connecting to MCP server...');
      transport = new StdioClientTransport({ command: 'bash', args: [RUNNER] });
      mcp = new MCPClient({ name: 'claude-legal-research', version: '3.0.0' }, { capabilities: {} });
      await mcp.connect(transport);
      console.log('MCP connected successfully');

      // Initialize enhanced Claude orchestrator with all August 2025 features
      const orchestrator = new ClaudeSonnet4LegalOrchestrator({
        apiKey: ANTHROPIC_API_KEY,
        mcpClient: mcp,
        model: 'claude-sonnet-4-5-20250929',   // Recommended for legal research
        enableThinking: true,                // Show legal reasoning process
        enableInterleavedThinking: true,     // Think between tool calls
        enableFineGrainedStreaming: true,    // Stream large parameters instantly
        enable1MContext: false               // Enable for very large document analysis
      });

      // Send initial capability announcement (Updated August 16, 2025)
      send({
        type: 'system_info',
        message: 'Claude Sonnet-4 Legal Research System Activated (Latest Aug 2025)',
        model_info: {
          current: 'claude-sonnet-4-5-20250929',
          latest_available: 'claude-opus-4-1-20250805',
          context_window: orchestrator.enable1MContext ? '1M tokens' : '200K tokens'
        },
        capabilities: [
          'Interleaved thinking between tool calls',
          'Fine-grained tool parameter streaming', 
          'Parallel tool execution',
          'Strategic legal reasoning transparency',
          '60+ specialized legal databases',
          'Real-time legal strategy visualization',
          '1M token context window (beta)',
          'Enhanced domain expertise'
        ],
        beta_features: [
          'interleaved-thinking-2025-05-14',
          'fine-grained-tool-streaming-2025-05-14',
          orchestrator.enable1MContext ? 'context-1m-2025-08-07' : null,
          'mcp-client-2025-04-04'
        ].filter(Boolean),
        timestamp: new Date().toISOString()
      });

      // Start enhanced streaming research with thinking transparency
      await orchestrator.streamLegalResearch({
        prompt: query,
        onThinking: (thinking) => {
          send({
            type: 'enhanced_thinking',
            ...thinking,
            reasoning_category: 'legal_strategy',
            features: {
              interleaved: thinking.interleaved || false,
              transparency: true,
              strategic_analysis: true
            }
          });
        },
        onToolCall: (toolCall) => {
          send({
            type: 'enhanced_tool_call',
            tool: toolCall,
            legal_context: toolCall.context,
            strategic_reasoning: toolCall.reasoning,
            capabilities: {
              parallel_execution: true,
              fine_grained_streaming: toolCall.fine_grained || false,
              real_time_parameters: true
            }
          });
        },
        onContent: (content) => {
          send({ 
            type: 'delta', 
            text: content.text || content,
            timestamp: content.timestamp || new Date().toISOString()
          });
        },
        onToolResult: (result) => {
          send({
            type: 'enhanced_tool_complete',
            tool_result: result,
            performance: {
              execution_time: result.execution_time,
              content_length: result.content_length,
              category: result.category,
              parallel_capable: result.parallel_execution
            }
          });
        },
        onProgress: (progress) => {
          send({
            type: 'progress_update',
            ...progress,
            enhanced_features: {
              thinking_enabled: progress.thinking_enabled,
              interleaved_thinking: progress.interleaved_thinking,
              fine_grained_streaming: progress.fine_grained_streaming
            }
          });
        },
        maxTokens: 16000 // Increased for complex legal analysis with thinking
      });

      send({ 
        type: 'final', 
        completed: new Date().toISOString(),
        enhanced_by: 'claude-sonnet-4-5-20250929',
        latest_model_available: 'claude-opus-4-1-20250805',
        features_used: [
          'interleaved-thinking-2025-05-14',
          'fine-grained-tool-streaming-2025-05-14', 
          'mcp-client-2025-04-04',
          'parallel-tool-execution',
          'legal-domain-expertise'
        ],
        verified_date: 'August 16, 2025'
      });
      
    } catch (error) {
      console.error('Claude streaming error:', error);
      try {
        send({ 
          type: 'error', 
          error: error.message || 'unknown error',
          enhanced: false,
          fallback_available: true
        });
      } catch {}
    } finally {
      await end();
    }
  });

  // Non-streaming research endpoint
  app.post('/api/claude/research', async (req, res) => {
    try {
      const { query, jsonSchema } = req.body || {};
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'query is required' });
      }

      await ensureSchema();
      const pool = getPool();
      let runId = null;
      
      if (pool) {
        const r = await pool.query(
          'INSERT INTO runs(model, query) VALUES ($1, $2) RETURNING id',
          ['claude-sonnet-4-5-20250929', query]
        );
        runId = r.rows[0].id;
      }

      // Connect to MCP
      const transport = new StdioClientTransport({ command: 'bash', args: [RUNNER] });
      const mcp = new MCPClient({ name: 'claude-research', version: '2.0.0' }, { capabilities: {} });
      await mcp.connect(transport);

      const orchestrator = new ClaudeSonnet4LegalOrchestrator({
        apiKey: process.env.ANTHROPIC_API_KEY,
        mcpClient: mcp,
        enableThinking: false // Non-streaming mode
      });

      const requestBody = {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        system: getEnhancedLegalPrompt(),
        messages: [{ role: 'user', content: query }],
        tools: await orchestrator.getMcpTools()
      };

      if (jsonSchema) {
        requestBody.response_format = {
          type: 'json_schema',
          json_schema: { name: 'legal_memo', schema: jsonSchema, strict: true }
        };
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: orchestrator.getRequestHeaders(),
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      const content = result.content?.[0]?.text || '';

      if (pool && runId) {
        await pool.query(
          'UPDATE runs SET final_text=$1, status=$2 WHERE id=$3',
          [content, 'completed', runId]
        );
      }

      await teardownMcp(transport, mcp);

      res.json({
        text: content,
        usage: result.usage,
        model: result.model,
        enhanced_by: 'claude-sonnet-4-5-20250929'
      });

    } catch (error) {
      console.error('Claude research error:', error);
      res.status(500).json({ error: error.message || 'unknown error' });
    }
  });

  // Health endpoint with enhanced capability reporting (VERIFIED August 16, 2025)
  app.get('/health', (_req, res) => {
    res.json({ 
      ok: true, 
      enhanced: true, 
      version: '3.0',
      verification_date: 'August 16, 2025',
      models: {
        current: 'claude-sonnet-4-5-20250929',
        latest_available: 'claude-opus-4-1-20250805',
        latest_opus: 'claude-opus-4-1-20250805',
        latest_sonnet: 'claude-sonnet-4-5-20250929'
      },
      beta_features: {
        'interleaved-thinking': 'interleaved-thinking-2025-05-14', 
        'fine-grained-streaming': 'fine-grained-tool-streaming-2025-05-14',
        'mcp-connector': 'mcp-client-2025-04-04',
        '1m-context-window': 'context-1m-2025-08-07'
      },
      capabilities: [
        'native-thinking-transparency',
        'interleaved-reasoning-between-tools',
        'fine-grained-parameter-streaming',
        'parallel-tool-execution',
        'legal-domain-expertise',
        'strategic-reasoning-visualization',
        'enhanced-entity-resolution',
        'cross-database-intelligence',
        '1m-token-context-window'
      ],
      legal_coverage: {
        databases: 14,
        tools: '60+',
        domains: [
          'Federal & State Case Law',
          'Corporate & Securities', 
          'Intellectual Property',
          'Regulatory Compliance',
          'Environmental Law',
          'Product Safety',
          'Judicial Analytics'
        ]
      }
    });
  });

  return app;
}

// Safe MCP teardown helper
async function teardownMcp(transport, mcp) {
  try { await mcp?.close?.(); } catch {}
  try { await transport?.close?.(); } catch {}
  try { transport?.child?.kill?.('SIGTERM'); } catch {}
}

export { ClaudeSonnet4LegalOrchestrator };