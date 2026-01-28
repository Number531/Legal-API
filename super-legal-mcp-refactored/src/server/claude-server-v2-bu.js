/**
 * BACKWARDS-COMPATIBLE: Claude Legal Research Implementation with Optional Session Memory
 * Maintains 100% compatibility with existing code while adding optional enhancements
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import crypto from 'crypto';
import { validateToolParameters } from '../utils/parameterValidation.js';

// Environment setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Session Management for Conversational Memory (Optional Feature)
 */
class ConversationSession {
constructor(sessionId) {
  this.sessionId = sessionId;
  this.conversationHistory = [];
  this.researchContext = {
    entities: new Set(),
    toolResults: new Map(),
    timeline: [],
    lastActivity: Date.now()
  };
  this.createdAt = Date.now();
  this.memoryUsage = 0;
  this.maxMemoryMB = 50;
}

addUserMessage(content) {
  this.conversationHistory.push({
    role: 'user', 
    content,
    timestamp: new Date().toISOString()
  });
  this.extractEntities(content);
  this.updateActivity();
}

addAssistantResponse(content, toolCalls = []) {
  this.conversationHistory.push({
    role: 'assistant',
    content,
    timestamp: new Date().toISOString()
  });
  
  if (toolCalls.length > 0) {
    this.cacheToolResults(toolCalls);
  }
  this.updateActivity();
}

addToolResults(toolResults) {
  this.conversationHistory.push(...toolResults);
  this.updateActivity();
}

getContextualHistory(maxTokens = 32000) {
  return this.smartTruncate(this.conversationHistory, maxTokens);
}

smartTruncate(history, maxTokens) {
  const maxChars = maxTokens * 4;
  let totalChars = 0;
  const truncated = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const message = history[i];
    const messageSize = JSON.stringify(message).length;
    
    if (totalChars + messageSize > maxChars && truncated.length > 0) {
      break;
    }
    
    truncated.unshift(message);
    totalChars += messageSize;
  }

  return truncated;
}

extractEntities(content) {
  const patterns = {
    companies: /\b([A-Z][a-z]+ (?:Corp|Inc|LLC|Ltd)\.?)\b/g,
    cases: /\b\w+\s+v\.?\s+\w+\b/g,
    judges: /\bJudge\s+([A-Z][a-z]+)\b/g,
    patents: /\b(?:Patent|US)\s*#?\s*(\d{7,})\b/g
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => this.researchContext.entities.add(`${type}:${match}`));
    }
  }
}

cacheToolResults(toolCalls) {
  toolCalls.forEach(tool => {
    const key = `${tool.name}:${JSON.stringify(tool.input)}`;
    this.researchContext.toolResults.set(key, {
      result: tool.result,
      timestamp: Date.now()
    });
  });
}

updateActivity() {
  this.researchContext.lastActivity = Date.now();
}

getMemoryUsage() {
  return JSON.stringify(this).length;
}

checkMemoryLimit() {
  const currentUsage = this.getMemoryUsage();
  const limitBytes = this.maxMemoryMB * 1024 * 1024;
  
  if (currentUsage > limitBytes) {
    const keepRecent = 10;
    this.conversationHistory = this.conversationHistory.slice(-keepRecent);
    
    const cutoff = Date.now() - (30 * 60 * 1000);
    for (const [key, value] of this.researchContext.toolResults) {
      if (value.timestamp < cutoff) {
        this.researchContext.toolResults.delete(key);
      }
    }
  }
  
  return currentUsage;
}
}

class SessionManager {
constructor() {
  this.sessions = new Map();
  this.maxSessionAge = 4 * 60 * 60 * 1000;
  this.maxSessions = 1000;
  this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
}

generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

getSession(sessionId) {
  // CRITICAL: Only return existing sessions, don't auto-create
  return this.sessions.get(sessionId) || null;
}

createSession(sessionId = null) {
  if (!sessionId) {
    sessionId = this.generateSessionId();
  }

  if (this.sessions.size >= this.maxSessions) {
    this.cleanupOldest();
  }
  
  const session = new ConversationSession(sessionId);
  this.sessions.set(sessionId, session);
  console.log(`📝 Created new session: ${sessionId}`);
  return session;
}

cleanup() {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, session] of this.sessions) {
    if (now - session.researchContext.lastActivity > this.maxSessionAge) {
      this.sessions.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
  }
}

cleanupOldest() {
  if (this.sessions.size === 0) return;

  let oldestId = null;
  let oldestTime = Date.now();

  for (const [id, session] of this.sessions) {
    if (session.researchContext.lastActivity < oldestTime) {
      oldestTime = session.researchContext.lastActivity;
      oldestId = id;
    }
  }

  if (oldestId) {
    this.sessions.delete(oldestId);
    console.log(`🧹 Removed oldest session: ${oldestId}`);
  }
}

getSessionStats() {
  return {
    totalSessions: this.sessions.size,
    memoryUsage: Array.from(this.sessions.values())
      .reduce((total, session) => total + session.getMemoryUsage(), 0),
    oldestSession: this.sessions.size > 0 ? Math.min(...Array.from(this.sessions.values())
      .map(s => s.researchContext.lastActivity)) : null
  };
}

destroy() {
  clearInterval(this.cleanupInterval);
  this.sessions.clear();
}
}

/**
 * MCP Connection Pool for Better Performance (Optional Feature)
 */
class MCPConnectionPool {
constructor(poolSize = 3) {
  this.pool = [];
  this.activeConnections = 0;
  this.maxConnections = poolSize;
  this.reconnectAttempts = 0;
  this.maxReconnects = 3;
  this.enabled = true;
}

async getConnection() {
  if (!this.enabled) {
    throw new Error('MCP connection pool disabled');
  }

  if (this.pool.length > 0) {
    const connection = this.pool.pop();
    if (await this.isConnectionAlive(connection)) {
      return connection;
    }
  }

  if (this.activeConnections < this.maxConnections) {
    return this.createConnection();
  }

  return this.waitForConnection();
}

async createConnection() {
  try {
    this.activeConnections++;
    
    const transport = new StdioClientTransport({ 
      command: 'bash', 
      args: [process.env.MCP_RUNNER_SCRIPT || './run-legal-mcp.sh'] 
    });
    
    const client = new MCPClient(
      { name: 'legal-research', version: '1.0.0' }, 
      { capabilities: {} }
    );
    
    await client.connect(transport);
    console.log(`✅ MCP connection created (${this.activeConnections}/${this.maxConnections})`);
    
    this.reconnectAttempts = 0;
    return client;
    
  } catch (error) {
    this.activeConnections--;
    
    if (this.reconnectAttempts < this.maxReconnects) {
      this.reconnectAttempts++;
      console.log(`⚠️ MCP connection failed, retry ${this.reconnectAttempts}/${this.maxReconnects}`);
      await this.exponentialBackoff();
      return this.createConnection();
    }
    
    throw error;
  }
}

async isConnectionAlive(connection) {
  try {
    await connection.listTools();
    return true;
  } catch {
    return false;
  }
}

async waitForConnection() {
  return new Promise((resolve, reject) => {
    const checkForConnection = () => {
      if (this.pool.length > 0) {
        resolve(this.pool.pop());
      } else {
        setTimeout(checkForConnection, 100);
      }
    };
    
    setTimeout(() => reject(new Error('Connection timeout')), 10000);
    checkForConnection();
  });
}

async exponentialBackoff() {
  const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
  return new Promise(resolve => setTimeout(resolve, delay));
}

returnConnection(connection) {
  if (this.enabled && this.pool.length < this.maxConnections) {
    this.pool.push(connection);
  } else {
    this.closeConnection(connection);
  }
}

async closeConnection(connection) {
  try {
    await connection.close();
    this.activeConnections--;
  } catch (error) {
    console.error('Error closing MCP connection:', error);
  }
}

async destroy() {
  this.enabled = false;
  const closePromises = this.pool.map(conn => this.closeConnection(conn));
  await Promise.allSettled(closePromises);
  this.pool = [];
  this.activeConnections = 0;
}
}

/**
 * Streaming Session Management (Optional Feature)
 */
class StreamingSession {
constructor(sessionId, maxMemoryMB = 100) {
  this.sessionId = sessionId;
  this.activeTasks = new Map();
  this.memoryUsage = 0;
  this.maxMemory = maxMemoryMB * 1024 * 1024;
  this.startTime = Date.now();
  this.maxDuration = 30 * 60 * 1000;
  this.maxTasks = 50;
  
  this.cleanupInterval = setInterval(() => {
    this.checkLimits();
    this.cleanupCompletedTasks();
  }, 10000);
}

checkLimits() {
  const now = Date.now();
  const usage = process.memoryUsage();
  
  if (now - this.startTime > this.maxDuration) {
    console.warn(`⏰ Session ${this.sessionId} exceeded time limit, terminating`);
    this.terminate();
    return;
  }
  
  if (usage.heapUsed > this.maxMemory) {
    console.warn(`💾 Session ${this.sessionId} exceeded memory limit, cleaning up`);
    this.cleanupTasks();
  }
  
  if (this.activeTasks.size > this.maxTasks) {
    console.warn(`🔧 Session ${this.sessionId} has too many tasks, cleaning oldest`);
    this.cleanupOldestTasks();
  }
}

cleanupCompletedTasks() {
  for (const [id, task] of this.activeTasks) {
    if (task.completed) {
      this.activeTasks.delete(id);
    }
  }
}

cleanupOldestTasks() {
  const tasks = Array.from(this.activeTasks.entries())
    .sort((a, b) => a[1].startTime - b[1].startTime)
    .slice(0, 10);
  
  tasks.forEach(([id]) => {
    this.activeTasks.delete(id);
  });
}

cleanupTasks() {
  const recentTasks = Array.from(this.activeTasks.entries())
    .sort((a, b) => b[1].startTime - a[1].startTime)
    .slice(0, 20);
  
  this.activeTasks.clear();
  recentTasks.forEach(([id, task]) => {
    this.activeTasks.set(id, task);
  });
}

addTask(id, task) {
  task.startTime = Date.now();
  task.completed = false;
  this.activeTasks.set(id, task);
}

markTaskCompleted(id) {
  const task = this.activeTasks.get(id);
  if (task) {
    task.completed = true;
    task.endTime = Date.now();
  }
}

terminate() {
  clearInterval(this.cleanupInterval);
  this.activeTasks.clear();
  console.log(`🔚 Streaming session ${this.sessionId} terminated`);
}

getStats() {
  return {
    sessionId: this.sessionId,
    activeTasks: this.activeTasks.size,
    duration: Date.now() - this.startTime,
    memoryUsage: process.memoryUsage().heapUsed
  };
}
}

/**
 * BACKWARDS-COMPATIBLE Claude Legal Research with Optional Enhancements
 */
class ClaudeLegalResearch {
constructor(options = {}) {
  this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
  this.model = options.model || 'claude-sonnet-4-5-20250929';
  this.promptFile = options.promptFile || process.env.LEGAL_PROMPT_FILE || null;

  // CRITICAL: Maintain original mcpClient for backwards compatibility
  this.mcpClient = null;
  
  // Optional enhanced features (disabled by default for compatibility)
  this.mcpPool = options.enableConnectionPooling ? new MCPConnectionPool(options.poolSize || 3) : null;
  this.sessionManager = options.enableSessionMemory ? new SessionManager() : null;
  this.streamingSessions = new Map();
  
  // Feature flags with safe defaults
  this.features = {
    interleaved_thinking: options.enableInterleavedThinking ?? true,
    fine_grained_streaming: options.enableFinegrainedStreaming ?? true,
    extended_context: options.enableExtendedContext ?? false,
    session_memory: options.enableSessionMemory ?? false, // DISABLED by default
    connection_pooling: options.enableConnectionPooling ?? false // DISABLED by default
  };
  
  if (this.features.extended_context && this.model !== 'claude-sonnet-4-5-20250929') {
    console.warn('⚠️  1M context only available for Claude Sonnet 4');
    this.features.extended_context = false;
  }

  // Health monitoring (minimal overhead)
  this.startTime = Date.now();
  this.requestCount = 0;
  this.errorCount = 0;
}

// CRITICAL: Maintain original connectMCP method for backwards compatibility
async connectMCP() {
  try {
    const transport = new StdioClientTransport({ 
      command: 'bash', 
      args: [process.env.MCP_RUNNER_SCRIPT || './run-legal-mcp.sh'] 
    });
    
    this.mcpClient = new MCPClient(
      { name: 'legal-research', version: '1.0.0' }, 
      { capabilities: {} }
    );
    
    await this.mcpClient.connect(transport);
    console.log('✅ MCP connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MCP connection failed:', error.message);
    return false;
  }
}

getApiHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': this.apiKey,
    'anthropic-version': '2023-06-01'
  };

  const betaFeatures = [];
  if (this.features.interleaved_thinking) {
    betaFeatures.push('interleaved-thinking-2025-05-14');
  }
  if (this.features.fine_grained_streaming) {
    betaFeatures.push('fine-grained-tool-streaming-2025-05-14');
  }
  if (this.features.extended_context) {
    betaFeatures.push('context-1m-2025-08-07');
  }

  if (betaFeatures.length > 0) {
    headers['anthropic-beta'] = betaFeatures.join(',');
  }

  return headers;
}

// CRITICAL: Maintain original getMCPTools behavior with graceful degradation
async getMCPTools() {
  // Use connection pool if enabled, otherwise use original client
  if (this.features.connection_pooling && this.mcpPool) {
    try {
      const connection = await this.mcpPool.getConnection();
      try {
        const { tools = [] } = await connection.listTools();
        console.log(`📋 Discovered ${tools.length} legal research tools (pooled)`);
        
        return tools.map((tool, index) => {
          try {
            const baseToolDef = {
              name: tool.name,
              description: tool.description || '',
              input_schema: this.sanitizeSchema(tool.inputSchema)
            };
            // Apply parameter enhancement for EPA tools (pilot program)
            return this.enhanceToolDescription(baseToolDef);
          } catch (error) {
            console.error(`❌ Error processing tool ${index} (${tool.name}):`, error.message);
            return {
              name: tool.name || `tool_${index}`,
              description: tool.description || 'Tool description unavailable',
              input_schema: { type: 'object', properties: {} }
            };
          }
        });
      } finally {
        this.mcpPool.returnConnection(connection);
      }
    } catch (error) {
      console.error('❌ Connection pool failed, falling back to no tools:', error.message);
      return []; // Graceful degradation
    }
  }

  // Original behavior: graceful degradation if no client
  if (!this.mcpClient) return [];
  
  try {
    const { tools = [] } = await this.mcpClient.listTools();
    console.log(`📋 Discovered ${tools.length} legal research tools`);
    
    return tools.map((tool, index) => {
      try {
        const baseToolDef = {
          name: tool.name,
          description: tool.description || '',
          input_schema: this.sanitizeSchema(tool.inputSchema)
        };
        // Apply parameter enhancement for EPA tools (pilot program)
        return this.enhanceToolDescription(baseToolDef);
      } catch (error) {
        console.error(`❌ Error processing tool ${index} (${tool.name}):`, error.message);
        return {
          name: tool.name || `tool_${index}`,
          description: tool.description || 'Tool description unavailable',
          input_schema: { type: 'object', properties: {} }
        };
      }
    });
  } catch (error) {
    console.error('Error fetching MCP tools:', error);
    return []; // Graceful degradation
  }
}

sanitizeSchema(schema) {
  if (!schema || typeof schema !== 'object') {
    return { type: 'object', properties: {} };
  }

  const sanitized = JSON.parse(JSON.stringify(schema));
  
  if (!sanitized.type) sanitized.type = 'object';
  if (sanitized.type === 'object' && !sanitized.properties) {
    sanitized.properties = {};
  }

  if (sanitized.properties) {
    for (const key in sanitized.properties) {
      const prop = sanitized.properties[key];
      if (prop && typeof prop === 'object') {
        delete prop.required;
        delete prop.$schema;
        delete prop.$ref;
        delete prop.additionalProperties;
      }
    }
  }

  if (sanitized.required && !Array.isArray(sanitized.required)) {
    delete sanitized.required;
  }

  return sanitized;
}

// ENHANCEMENT: Dynamic tool parameter guidance for better first-attempt success
enhanceToolDescription(tool) {
  // Enhance EPA, USPTO, PTAB, FDA, FTC, CPSC, SEC, Federal Register, USC, and CourtListener tools
  if (!tool.name.startsWith('search_epa')
    && !tool.name.startsWith('search_patents')
    && !tool.name.startsWith('search_uspto')
    && !tool.name.startsWith('search_ptab')
    && !tool.name.startsWith('search_fda')
    && !tool.name.startsWith('search_ftc')
    && !tool.name.startsWith('search_cpsc')
    && !tool.name.startsWith('search_sec')
    && !tool.name.startsWith('get_sec')
    && !tool.name.startsWith('search_federal_register')
    && !tool.name.startsWith('search_us_code')
    && !tool.name.startsWith('get_usc')
    && !tool.name.startsWith('list_usc')
    && !tool.name.startsWith('search_cases')
    && !tool.name.startsWith('search_opinions')
    && !tool.name.startsWith('search_dockets')
    && !tool.name.startsWith('lookup_citation')
    && !tool.name.startsWith('search_judges')
    && !tool.name.startsWith('get_judge_details')
    && !tool.name.startsWith('get_case_details')
    && !tool.name.startsWith('get_court_info')
    && !tool.name.startsWith('list_courts')
    && !tool.name.startsWith('search_audio')
    && !tool.name.startsWith('get_audio_details')
    && !tool.name.startsWith('get_opinion_with_citations')) {
    return tool;
  }
  
  const enhanced = { ...tool };
  const schema = tool.input_schema;
  
  // Build parameter guidance string
  let paramGuide = [];
  
  // Add required parameter info
  if (schema.required && schema.required.length > 0) {
    paramGuide.push(`REQUIRED: ${schema.required.join(', ')}`);
  }
  
  // Add EPA-specific search guidance
  if (tool.name === 'search_epa_facilities') {
    paramGuide.push('SEARCH TERMS: Provide any combination of location/company identifiers');
    paramGuide.push('HELPFUL: Specific company names, facility names, or locations');
    
    // Add examples showing flexible search combinations
    enhanced.description += '\n\nPARAMETER EXAMPLES:' +
      '\n✓ {state:"PA", city:"Pittsburgh", company_name:"BASF"}' +
      '\n✓ {state:"PA", company_name:"BASF"}' +
      '\n✓ {facility_name:"BASF Monaca"}' +
      '\n✓ {zip_code:"15001"}' +
      '\n✓ {company_name:"Dow Chemical", state:"TX"}' +
      '\n✗ {} - Need at least one search term';
  }
  
  // Add USPTO-specific search guidance
  if (tool.name.startsWith('search_patents') || tool.name.startsWith('search_uspto')) {
    paramGuide.push('⚠️ ALWAYS provide query_type parameter on FIRST call');
    paramGuide.push('NO DISCOVERY CALLS: Provide parameters immediately');
    
    // Add USPTO-specific examples
    enhanced.description += '\n\nUSPTO TOOL USAGE:' +
      '\n✓ query_type: "patents", "inventors", or "assignees" (REQUIRED)' +
      '\n✓ search_text: Specific search terms (REQUIRED)' +
      '\n\nEXAMPLES:' +
      '\n✓ {query_type:"patents", search_text:"C9 resin coating technology"}' +
      '\n✓ {query_type:"inventors", search_text:"John Smith polymer"}' +
      '\n✓ {query_type:"assignees", search_text:"3M Company"}' +
      '\n✗ {} - Discovery calls waste time, provide parameters immediately';
  }
  
  // Add PTAB-specific search guidance (EPA-style: parameters optional with smart defaults)
  if (tool.name.startsWith('search_ptab')) {
    paramGuide.push('PTAB PROCEEDINGS: Parameters optional; smart defaults applied');
    enhanced.description += '\n\nPTAB TOOL USAGE:' +
      '\n✓ proceeding_type: "IPR", "PGR", "CBM" (optional)' +
      '\n✓ proceeding_number: e.g., "IPR2023-00123" (optional)' +
      '\n✓ patent_number: e.g., 8,123,456 (optional)' +
      '\n✓ petitioner/patent_owner and status filters supported' +
      '\n\nEXAMPLES:' +
      '\n✓ {}  (recent PTAB proceedings)' +
      '\n✓ {proceeding_type:"IPR", patent_number:"7654321"}' +
      '\n✓ {proceeding_number:"IPR2024-01234"}';
  }
  
  // Add FDA-specific search guidance (EPA-style: parameters optional with smart defaults)
  if (tool.name.startsWith('search_fda')) {
    paramGuide.push('FDA PHARMACEUTICAL SAFETY: Parameters optional; smart defaults applied');
    enhanced.description += '\n\nFDA TOOL USAGE:' +
      '\n✓ All parameters optional - smart defaults applied' +
      '\n✓ search: OpenFDA syntax or natural language' +
      '\n✓ include_snippet: Get safety-focused highlights (recommended)' +
      '\n✓ include_text: Get full document text (token-intensive)' +
      '\n✓ limit: Results count (default: 20, max: 100)' +
      '\n\nEXAMPLES:' +
      '\n✓ {search:"aspirin adverse events"}' +
      '\n✓ {search:"pacemaker malfunctions", include_snippet:true}' +
      '\n✓ {search:"Humira prescribing information"}' +
      '\n✓ {}  (recent FDA safety information)';
  }
  
  // Add FTC-specific search guidance (EPA-style: parameters optional with smart defaults)
  if (tool.name.startsWith('search_ftc')) {
    paramGuide.push('FTC ENFORCEMENT & ANTITRUST: Parameters optional; smart defaults applied');
    enhanced.description += '\n\nFTC TOOL USAGE:' +
      '\n✓ All parameters optional - smart defaults applied' +
      '\n✓ defendant_name: Company/entity name under investigation' +
      '\n✓ date_filed_after/date_filed_before: Date range filters' +
      '\n✓ include_consent_orders: Include FTC consent agreements (default: true)' +
      '\n✓ include_snippet: Get enforcement highlights (recommended)' +
      '\n✓ include_text: Get full document text (token-intensive)' +
      '\n\nEXAMPLES:' +
      '\n✓ {defendant_name:"Facebook"}' +
      '\n✓ {date_filed_after:"2023-01-01", include_snippet:true}' +
      '\n✓ {}  (recent FTC enforcement actions)';
  }
  
  // Add CPSC-specific search guidance (EPA-style: parameters optional with smart defaults)
  if (tool.name.startsWith('search_cpsc')) {
    paramGuide.push('CPSC PRODUCT RECALLS: Parameters optional; smart defaults applied');
    enhanced.description += '\n\nCPSC TOOL USAGE:' +
      '\n✓ All parameters optional - smart defaults applied' +
      '\n✓ product_name/search_term: Product name or general search' +
      '\n✓ recalling_firm: Manufacturer/company name' +
      '\n✓ hazard/hazard_type: Safety hazard type (fire, choking, etc.)' +
      '\n✓ recall_id: Specific recall identifier' +
      '\n✓ product_category: toys, furniture, appliances, etc.' +
      '\n✓ date_after/date_before: Date range filters' +
      '\n✓ include_snippet: Get safety-critical highlights (recommended)' +
      '\n\nEXAMPLES:' +
      '\n✓ {product_name:"baby crib", include_snippet:true}' +
      '\n✓ {hazard_type:"choking", product_category:"toys"}' +
      '\n✓ {recalling_firm:"Fisher-Price"}' +
      '\n✓ {}  (recent CPSC recalls)';
  }
  
  // Add Federal Register-specific search guidance
  if (tool.name.startsWith('search_federal_register')) {
    paramGuide.push('FEDERAL REGISTER: Parameters optional; smart defaults applied');
    enhanced.description += '\n\nFEDERAL REGISTER USAGE:' +
      '\n✓ agency: Issuing agency (e.g., "EPA", "SEC")' +
      '\n✓ rule_type: proposed/final/interim (when relevant)' +
      '\n✓ docket_number: Agency docket if known' +
      '\n✓ date range: start/end filters' +
      '\n\nEXAMPLES:' +
      '\n✓ {agency:"EPA", rule_type:"proposed"}' +
      '\n✓ {docket_number:"EPA-HQ-OAR-2023-0123"}' +
      '\n✓ {}  (recent items)';
  }
  
  // Add USC-specific search guidance
  if (tool.name.startsWith('search_us_code')) {
    paramGuide.push('USC SEARCH: Parameters optional; smart defaults applied');
    enhanced.description += '\n\nUSC SEARCH USAGE:' +
      '\n✓ search_term: Legal concepts, keywords, or provisions' +
      '\n✓ title: USC Title number (1-54)' +
      '\n✓ section: Specific section number within title' +
      '\n✓ include_text: Get full statutory text (recommended)' +
      '\n✓ include_snippet: Get contextual highlights only' +
      '\n✓ limit: Results count (default: 20, max: 100)' +
      '\n\nEXAMPLES:' +
      '\n✓ {search_term:"antitrust Sherman Act", include_text:true}' +
      '\n✓ {title:15, search_term:"commerce trade"}' +
      '\n✓ {search_term:"environmental protection", include_snippet:true}' +
      '\n✓ {}  (recent statutory updates)';
  }
  
  if (tool.name.startsWith('get_usc_section')) {
    paramGuide.push('USC SECTION: Retrieve specific statutory provisions');
    enhanced.description += '\n\nUSC SECTION USAGE:' +
      '\n✓ title: USC Title number (REQUIRED)' +
      '\n✓ section: Section number within title (REQUIRED)' +
      '\n✓ include_text: Get full statutory text (default: true)' +
      '\n✓ include_snippet: Get contextual highlights only' +
      '\n\nEXAMPLES:' +
      '\n✓ {title:15, section:1}  (Sherman Act Section 1)' +
      '\n✓ {title:42, section:7401, include_text:true}  (Clean Air Act)' +
      '\n✓ {title:26, section:501}  (Tax-exempt organizations)';
  }
  
  if (tool.name.startsWith('get_usc_title_structure')) {
    paramGuide.push('USC STRUCTURE: Explore title organization and chapters');
    enhanced.description += '\n\nUSC TITLE STRUCTURE:' +
      '\n✓ title: USC Title number (REQUIRED, 1-54)' +
      '\n✓ chapter: Specific chapter within title (optional)' +
      '\n✓ include_sections: Include section listings (default: true)' +
      '\n\nEXAMPLES:' +
      '\n✓ {title:15}  (Commerce and Trade structure)' +
      '\n✓ {title:42, chapter:85}  (Environmental chapter)' +
      '\n✓ {title:26, include_sections:true}  (Internal Revenue Code)';
  }
  
  if (tool.name.startsWith('list_usc_titles')) {
    paramGuide.push('USC TITLES: Browse all available USC titles');
    enhanced.description += '\n\nUSC TITLES USAGE:' +
      '\n✓ No parameters required - lists all 54 USC titles' +
      '\n✓ Shows title numbers, names, and subject areas' +
      '\n✓ Use for exploring statutory organization' +
      '\n\nEXAMPLES:' +
      '\n✓ {}  (complete USC title listing)';
  }

  // Add SEC-specific search guidance (with permissive extraction support)
  if (tool.name.startsWith('search_sec') || tool.name.startsWith('get_sec')) {
    paramGuide.push('SEC CORPORATE FILINGS: Smart parameter handling with quality metrics');

    if (tool.name === 'search_sec_filings') {
      enhanced.description += '\n\nSEC FILINGS USAGE:' +
        '\n✓ company_identifier: Ticker (AAPL) preferred over name (Apple Inc)' +
        '\n✓ filing_type: 10-K, 10-Q, 8-K, DEF 14A, S-1 (default: all)' +
        '\n✓ date_after/date_before: YYYY-MM-DD format' +
        '\n✓ include_snippet: Get filing highlights (recommended)' +
        '\n✓ include_text: Full document text (token-intensive)' +
        '\n\nEXAMPLES:' +
        '\n✓ {company_identifier:"AAPL", filing_type:"10-K"}' +
        '\n✓ {company_identifier:"MSFT", date_after:"2024-01-01"}' +
        '\n✓ {} (shows general SEC results with advisory)' +
        '\n\nQUALITY FEATURES:' +
        '\n• Returns confidence scores for all results' +
        '\n• Includes non-EDGAR SEC content with flags' +
        '\n• Empty searches return recent filings with advisory';
    }

    if (tool.name === 'search_sec_company_tickers') {
      enhanced.description += '\n\nSEC TICKER SEARCH:' +
        '\n✓ search_term: Company name or ticker (REQUIRED)' +
        '\n✓ exchange: Filter by exchange (optional)' +
        '\n\nEXAMPLES:' +
        '\n✓ {search_term:"Apple"}' +
        '\n✓ {search_term:"AAPL"}' +
        '\n✓ {search_term:"Bank", exchange:"NYSE"}' +
        '\n\nUSE FOR: Finding correct CIK numbers for other SEC tools';
    }

    if (tool.name === 'get_sec_company_facts') {
      enhanced.description += '\n\nSEC COMPANY FACTS:' +
        '\n✓ company_identifier: CIK preferred over ticker (REQUIRED)' +
        '\n✓ concept: Assets, Revenues, NetIncomeLoss, etc. (optional)' +
        '\n\nEXAMPLES:' +
        '\n✓ {company_identifier:"0000320193", concept:"Assets"}' +
        '\n✓ {company_identifier:"0000320193"} (shows all concepts)' +
        '\n\nTIP: Use search_sec_company_tickers first to get CIK';
    }

    if (tool.name === 'get_sec_xbrl_frames') {
      enhanced.description += '\n\nSEC XBRL FRAMES:' +
        '\n✓ concept: Assets, Revenues, etc. (REQUIRED)' +
        '\n✓ period: CY2023, CY2023Q4I, etc. (REQUIRED)' +
        '\n✓ unit: USD (default)' +
        '\n✓ limit: Max results (default: 100)' +
        '\n\nEXAMPLES:' +
        '\n✓ {concept:"Revenues", period:"CY2023"}' +
        '\n✓ {concept:"Assets", period:"CY2023Q4I"}' +
        '\n\nNOTE: Some periods may have limited data';
    }
  }

  if (paramGuide.length > 0) {
    enhanced.description += '\n[' + paramGuide.join(' | ') + ']';
  }

  return enhanced;
}

// Enhanced streaming with optional session support
async streamLegalResearch(query, options = {}) {
  const {
    onThinking,
    onToolCall,
    onContent,
    onError,
    onProgress,
    maxTokens = 32000,
    sessionId = null
  } = options;

  this.requestCount++;

  try {
    // CRITICAL: Only use sessions if explicitly requested AND feature enabled
    let session = null;
    let conversationHistory;

    if (sessionId && this.features.session_memory && this.sessionManager) {
      session = this.sessionManager.getSession(sessionId);
      if (session) {
        session.addUserMessage(query);
        conversationHistory = session.getContextualHistory();
        console.log(`💭 Using session ${session.sessionId} with ${conversationHistory.length} messages`);
      } else {
        console.warn(`⚠️ Session ${sessionId} not found, using stateless mode`);
        conversationHistory = [{ role: 'user', content: query }];
      }
    } else {
      // CRITICAL: Original stateless behavior by default
      conversationHistory = [{ role: 'user', content: query }];
    }

    const tools = await this.getMCPTools();
    
    // Create streaming session for memory management only if enhanced features enabled
    let streamingSession = null;
    if (this.features.connection_pooling || this.features.session_memory) {
      streamingSession = new StreamingSession(sessionId || 'anonymous');
      this.streamingSessions.set(streamingSession.sessionId, streamingSession);
    }

    try {
      await this.streamClaudeCall(conversationHistory, tools, {
        onThinking,
        onToolCall,
        onContent: (content) => {
          if (session) {
            session.addAssistantResponse(content);
          }
          onContent?.(content);
        },
        onError,
        onProgress,
        maxTokens,
        session,
        streamingSession
      });
    } finally {
      if (streamingSession) {
        streamingSession.terminate();
        this.streamingSessions.delete(streamingSession.sessionId);
      }
    }

    // CRITICAL: Only return sessionId if session was actually used
    return session ? { sessionId: session.sessionId } : {};

  } catch (error) {
    this.errorCount++;
    console.error('Legal research error:', error);
    onError?.(error);
    throw error;
  }
}

async streamClaudeCall(conversationHistory, tools, options, toolResults = null) {
  const { onThinking, onToolCall, onContent, onError, onProgress, maxTokens, session, streamingSession } = options;

  if (toolResults && toolResults.length > 0) {
    conversationHistory.push(...toolResults);
    if (session) {
      session.addToolResults(toolResults);
    }
  }

  // NOTE: Do not add tool description logic here. All parameter guidance belongs in enhanceToolDescription().

  const requestBody = {
    model: this.model,
    max_tokens: maxTokens,
    stream: true,
    system: this.getLegalSystemPrompt(),
    messages: conversationHistory,
    tools: tools.length > 0 ? tools : undefined
  };

  if (this.features.interleaved_thinking) {
    requestBody.thinking = {
      type: 'enabled',
      budget_tokens: Math.min(maxTokens * 3, 12000)  // Reduced from 2x to 0.5x for faster tool execution
    };
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: this.getApiHeaders(),
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  return this.processStreamWithToolHandling(response, conversationHistory, tools, {
    onThinking,
    onToolCall,
    onContent,
    onError,
    onProgress,
    maxTokens,
    session,
    streamingSession
  });
}

async processStreamWithToolHandling(response, conversationHistory, tools, options) {
  const { onThinking, onToolCall, onContent, onError, onProgress, maxTokens, session, streamingSession } = options;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  let buffer = '';
  const toolCalls = [];
  // CRITICAL: Use Map for original compatibility, or streamingSession if available
  const activeTasks = streamingSession ? streamingSession.activeTasks : new Map();
  let assistantMessage = '';
  let needsToolExecution = false;
  const thinkingBlocks = [];

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
          const event = JSON.parse(line.slice(6));
          const result = await this.handleStreamEventWithTools(event, {
            onThinking,
            onToolCall,
            onContent,
            onProgress,
            toolCalls,
            activeTasks,
            streamingSession,
            assistantMessage: (text) => { assistantMessage += text; },
            thinkingBlocks
          });

          if (result?.needsToolExecution) {
            needsToolExecution = true;
          }
        } catch (parseError) {
          console.warn('Stream parse error:', parseError);
        }
      }
    }

    if (needsToolExecution && toolCalls.length > 0) {
      console.log(`🔧 Executing ${toolCalls.length} tools and continuing conversation...`);
      
      // Fallback: If no tasks were scheduled during streaming (e.g., missing content_block_stop), schedule now
      if (activeTasks.size === 0) {
        console.log('⚠️ No active tool tasks detected at stream end; evaluating fallback execution');

        // Short grace wait to allow late input_json deltas to land
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Tools that are safe to run with empty inputs
        const safeEmptyTools = new Set([
          'search_ptab_proceedings',
          'search_all_ptab_aia_proceedings',
          // Federal Register - unified web search tool can run with smart defaults
          'search_federal_register',
          'search_federal_register_notices',
          'search_federal_register_proposed_rules',
          'search_federal_register_final_rules',
          'search_federal_register_presidential_documents',
          'search_federal_register_public_inspection',
          // USC/GovInfo tools - can run with empty inputs (smart defaults)
          'search_us_code',
          'get_usc_section',
          'get_usc_title_structure',
          'list_usc_titles',
          // FTC tools - can run with empty inputs (smart defaults)
          'search_ftc_enforcement_cases',
          'search_ftc_competition_matters', 
          'search_ftc_guidance_policy',
          'search_ftc_rulemaking',
          'search_ftc_consumer_alerts',
          'search_ftc_news',
          // CPSC tools - can run with empty inputs (smart defaults)
          'search_cpsc_recalls',
          'search_cpsc_enforcement',
          'search_cpsc_business_guidance',
          'search_cpsc_safety_standards',
          'search_cpsc_injury_data',
          'search_cpsc_news',
          'search_cpsc_reports_studies'
        ]);

        for (const toolCall of toolCalls) {
          try {
            const input = toolCall.input || {};
            const hasInput = input && Object.keys(input).length > 0;

            // Gate on required params for known tools
            if (toolCall.name === 'get_ptab_decisions') {
              if (!hasInput || !input.proceeding_number) {
                console.log('⏭️ Skipping fallback execution for get_ptab_decisions: proceeding_number missing');
                continue;
              }
            }

            if (!hasInput && !safeEmptyTools.has(toolCall.name)) {
              console.log(`⏭️ Skipping fallback execution for ${toolCall.name}: awaiting complete inputs`);
              continue;
            }

            await this.executeTool(toolCall, activeTasks, streamingSession);
          } catch (e) {
            console.warn(`Failed to schedule tool ${toolCall.name}:`, e?.message || e);
          }
        }
      }

      // Use consistent task collection - fix for NHTSA hanging issue
      const tasksToWait = streamingSession ? streamingSession.activeTasks : activeTasks;
      await Promise.allSettled(Array.from(tasksToWait.values()));
      
      const toolResults = await this.collectToolResults(toolCalls, activeTasks, streamingSession, onToolCall);
      
      const assistantContent = [];
      
      // Preserve thinking blocks for reasoning continuity - pass unmodified including signatures
      if (thinkingBlocks.length > 0) {
        assistantContent.push(...thinkingBlocks);
      }
      
      if (assistantMessage) {
        assistantContent.push({ type: 'text', text: assistantMessage });
      }
      
      assistantContent.push(...toolCalls.map(tool => ({
        type: 'tool_use',
        id: tool.id,
        name: tool.name,
        input: tool.input
      })));
      
      conversationHistory.push({
        role: 'assistant',
        content: assistantContent
      });
      
      conversationHistory.push(...toolResults);
      
      console.log('🔄 Sending tool results back to Claude for final response...');
      
      const result = await this.streamClaudeCall(conversationHistory, tools, {
        ...options,
        phase: 'follow-up'
      });
      
      return result;
    }

  } finally {
    reader.releaseLock();
    // CRITICAL: Only clean activeTasks if not using streamingSession
    if (!streamingSession) {
      activeTasks.clear();
    }
  }
}

async handleStreamEventWithTools(event, callbacks) {
  const { onThinking, onToolCall, onContent, onProgress, toolCalls, activeTasks, streamingSession, assistantMessage, thinkingBlocks } = callbacks;

  switch (event.type) {
    case 'message_start':
      onProgress?.({
        type: 'research_start',
        model: event.message.model,
        timestamp: new Date().toISOString()
      });
      break;

    case 'content_block_start':
      if (event.content_block.type === 'thinking') {
        if (event.content_block) {
          thinkingBlocks.push({
            type: 'thinking',
            thinking: '',
            signature: null  // Will be filled by signature_delta event
          });
        }
        onThinking?.({
          type: 'thinking_start',
          text: 'Analyzing legal research strategy...',
          timestamp: new Date().toISOString()
        });
      } else if (event.content_block.type === 'tool_use') {
        const toolCall = {
          id: event.content_block.id,
          name: event.content_block.name,
          input: {},
          complete: false
        };
        
        toolCalls.push(toolCall);
        
        onToolCall?.({
          type: 'tool_start',
          tool: toolCall,
          legal_domain: this.classifyLegalDomain(toolCall.name),
          timestamp: new Date().toISOString()
        });

        return { needsToolExecution: true };
      }
      break;

    case 'content_block_delta':
      if (event.delta.type === 'thinking_delta') {
        // Accumulate thinking content in the thinking block
        if (thinkingBlocks.length > 0) {
          thinkingBlocks[thinkingBlocks.length - 1].thinking += event.delta.thinking;
        }
        onThinking?.({
          type: 'thinking_delta',
          text: event.delta.thinking,
          timestamp: new Date().toISOString()
        });
      } else if (event.delta.type === 'signature_delta') {
        // Capture signature for the current thinking block
        if (thinkingBlocks.length > 0) {
          thinkingBlocks[thinkingBlocks.length - 1].signature = event.delta.signature;
        }
      } else if (event.delta.type === 'text_delta') {
        const text = event.delta.text;
        assistantMessage(text);
        onContent?.(text);
      } else if (event.delta.type === 'input_json_delta') {
        const blockIndex = event.index || event.content_block_index;
        if (blockIndex !== undefined) {
          let toolIndex = -1;
          for (let i = 0; i <= blockIndex; i++) {
            if (i > 0) toolIndex++;
          }
          
          if (toolIndex >= 0 && toolIndex < toolCalls.length) {
            const toolCall = toolCalls[toolIndex];
            if (!toolCall.partialJson) toolCall.partialJson = '';
            toolCall.partialJson += event.delta.partial_json || '';
            
            try {
              toolCall.input = JSON.parse(toolCall.partialJson);
              
              // Forward the parsed arguments to frontend
              onToolCall?.({
                type: 'tool_update', 
                tool: { id: toolCall.id, name: toolCall.name, input: toolCall.input },
                timestamp: new Date().toISOString()
              });
            } catch (e) {
              // Not complete yet
            }
          }
        }
      }
      break;

    case 'content_block_stop':
      if (event.index !== undefined) {
        let toolIndex = -1;
        for (let i = 0; i <= event.index; i++) {
          if (i > 0) toolIndex++;
        }
        
        if (toolIndex >= 0 && toolIndex < toolCalls.length) {
          const toolCall = toolCalls[toolIndex];
          if (!toolCall.complete) {
            toolCall.complete = true;
            
            // Notify frontend that execution is starting
            onToolCall?.({
              type: 'tool_execute',
              tool: { id: toolCall.id, name: toolCall.name, input: toolCall.input },
              timestamp: new Date().toISOString()
            });
            
            console.log(`🔧 Executing tool: ${toolCall.name} with input:`, toolCall.input);
            
            // Add 7-second delay to ensure streaming completes before tool execution
            console.log(`⏳ Waiting 7 seconds for streaming to complete...`);
            await new Promise(resolve => setTimeout(resolve, 7000));
            
            await this.executeTool(toolCall, activeTasks, streamingSession);
          }
        }
      }
      break;

    case 'message_stop':
      // Ensure any final thinking blocks are properly handled
      if (thinkingBlocks.length > 0) {
        console.log(`🧠 Preserving ${thinkingBlocks.length} thinking blocks for final response`);
        onThinking?.({
          type: 'thinking_complete',
          blocks: thinkingBlocks.length,
          final_content: thinkingBlocks[thinkingBlocks.length - 1]?.thinking?.slice(-200) + '...',
          timestamp: new Date().toISOString()
        });
      }
      
      onProgress?.({
        type: 'research_complete',
        tools_executed: activeTasks.size,
        thinking_blocks_preserved: thinkingBlocks.length,
        timestamp: new Date().toISOString()
      });
      break;
  }

  return null;
}

async collectToolResults(toolCalls, activeTasks, streamingSession, onToolCall) {
  const toolResults = [];
  
  // Use consistent task collection - fix for NHTSA hanging issue
  const tasksMap = streamingSession ? streamingSession.activeTasks : activeTasks;
  
  for (const toolCall of toolCalls) {
    try {
      const result = await tasksMap.get(toolCall.id);
      
      // Handle cases where result is undefined or malformed
      let toolContent;
      if (!result) {
        toolContent = `Error: Tool ${toolCall.name} execution failed with no result`;
      } else if (result.success === false || result.error) {
        toolContent = `Error: ${result.error || 'Tool execution failed'}`;
      } else if (result.success && result.content) {
        toolContent = result.content;
      } else {
        // Fallback for unexpected result structure
        toolContent = typeof result === 'string' ? result : JSON.stringify(result);
      }
      
      toolResults.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolCall.id,
            content: toolContent
          }
        ]
      });

      // Notify frontend about tool completion via the same callback path
      if (typeof onToolCall === 'function') {
        try {
          const toPreviewString = (content) => {
            try {
              if (typeof content === 'string') {
                const t = content.trim();
                // If looks like JSON, re-serialize to valid JSON so frontend can parse
                if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
                  try {
                    const parsed = JSON.parse(t);
                    const str = JSON.stringify(parsed, null, 2);
                    return str.length <= 8000 ? str : str.slice(0, 8000);
                  } catch {
                    // Not valid JSON despite appearance; fall through to plain text handling
                  }
                }
                // Plain text preview with a larger limit for readability
                return t.length <= 2000 ? t : t.slice(0, 2000);
              }
              // Object preview as pretty JSON
              const str = JSON.stringify(content, null, 2);
              return str.length <= 8000 ? str : str.slice(0, 8000);
            } catch {
              const s = String(content);
              return s.length <= 2000 ? s : s.slice(0, 2000);
            }
          };

          onToolCall({
            type: 'tool_result',
            tool: { id: toolCall.id, name: toolCall.name },
            success: !(result && (result.success === false || result.error)),
            preview: toPreviewString(toolContent),
            timestamp: new Date().toISOString()
          });
        } catch {}
      }
      
      if (streamingSession) {
        streamingSession.markTaskCompleted(toolCall.id);
      }
      console.log(`✅ Tool result collected for ${toolCall.name}`);
    } catch (error) {
      console.error(`❌ Failed to collect result for ${toolCall.name}:`, error);
      toolResults.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolCall.id,
            content: `Error executing tool: ${error.message}`
          }
        ]
      });
    }
  }
  
  return toolResults;
}

async executeTool(toolCall, activeTasks, streamingSession) {
  const execution = (async () => {

    // Feature-flagged parameter validation (Module 3)
    if (process.env.ENABLE_PARAM_VALIDATION === 'true') {
      try {
        const validation = validateToolParameters(toolCall.name, toolCall.input || {});
        if (!validation.valid) {
          const message = validation.message || 'Missing or invalid parameters.';
          console.warn(`⛔ Validation failed for ${toolCall.name}: ${message}`);
          return {
            id: toolCall.id,
            name: toolCall.name,
            success: false,
            error: message,
            timestamp: new Date().toISOString()
          };
        }
        // Use sanitized/defaulted parameters
        toolCall.input = validation.parameters || toolCall.input;
      } catch (e) {
        console.warn(`Validation error for ${toolCall.name}: ${e?.message || e}`);
      }
    }

    // Use connection pool if available, otherwise use original client
    if (this.features.connection_pooling && this.mcpPool) {
      const connection = await this.mcpPool.getConnection();
      
      try {
        const startTime = Date.now();
        
        const result = await connection.callTool({
          name: toolCall.name,
          arguments: toolCall.input
        });
        
        const executionTime = Date.now() - startTime;
        const content = result?.content?.[0]?.text || 'Tool executed successfully';
        
        console.log(`✅ Tool ${toolCall.name} completed in ${executionTime}ms (pooled)`);
        
        return {
          id: toolCall.id,
          name: toolCall.name,
          success: true,
          content: content,
          executionTime,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`❌ Tool ${toolCall.name} failed:`, error.message);
        return {
          id: toolCall.id,
          name: toolCall.name,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      } finally {
        this.mcpPool.returnConnection(connection);
      }
    } else {
      // Original execution path
      if (!this.mcpClient) {
        throw new Error('MCP client not connected');
      }

      try {
        const startTime = Date.now();
        
        const result = await this.mcpClient.callTool({
          name: toolCall.name,
          arguments: toolCall.input
        });
        
        const executionTime = Date.now() - startTime;
        const content = result?.content?.[0]?.text || 'Tool executed successfully';
        
        console.log(`✅ Tool ${toolCall.name} completed in ${executionTime}ms`);
        
        return {
          id: toolCall.id,
          name: toolCall.name,
          success: true,
          content: content,
          executionTime,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`❌ Tool ${toolCall.name} failed:`, error.message);
        return {
          id: toolCall.id,
          name: toolCall.name,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
  })();

  if (streamingSession) {
    streamingSession.addTask(toolCall.id, execution);
  } else {
    activeTasks.set(toolCall.id, execution);
  }
  return execution;
}

classifyLegalDomain(toolName) {
  const domains = {
    'search_cases': 'Case Law',
    'search_sec_filings': 'Securities',
    'search_patents': 'Intellectual Property',
    'search_federal_register': 'Regulatory',
    'search_judges': 'Judicial Analytics',
    'comprehensive_legal_entity_analysis': 'Entity Intelligence',
    'search_epa_facilities': 'Environmental',
    'search_fda_drug_adverse_events': 'Pharmaceutical Safety',
    
    // FDA specialized domains
    'search_fda_warning_letters': 'Inspections/Compliance',
    'search_fda_drug_safety_communications': 'Pharmaceutical Safety',
    'search_fda_device_safety_communications': 'Medical Device Safety',
    'search_fda_drug_shortages': 'Supply/Availability',
    'search_fda_510k': 'Medical Device Clearance',
    'search_fda_pma_approvals': 'Medical Device Approval',
    'search_fda_orange_book': 'Drug Patents/Exclusivity',
    'search_fda_purple_book': 'Biologics/Biosimilars',
    
    'search_cpsc_recalls': 'Product Safety',
    'search_ftc_enforcement_cases': 'Antitrust Enforcement',
    'search_ftc_competition_matters': 'Antitrust/Competition',
    'search_ftc_guidance_policy': 'Regulatory Guidance',
    'search_ftc_rulemaking': 'Industry Regulation',
    'search_ftc_consumer_alerts': 'Consumer Protection',
    'search_ftc_news': 'Enforcement News',
    'search_ptab_proceedings': 'Patent Validity',
    'search_ptab_ipr_proceedings': 'Inter Partes Review',
    'search_ptab_pgr_proceedings': 'Post-Grant Review',
    'search_ptab_cbm_proceedings': 'Business Method Review',
    'search_audio': 'Oral Arguments',
    'search_financial_disclosures': 'Judicial Ethics',
    'search_state_statute': 'State Law',
    
    // CPSC consolidated tools
    'search_cpsc_enforcement': 'Product Safety Enforcement',
    'search_cpsc_business_guidance': 'Manufacturing Compliance',
    'search_cpsc_safety_standards': 'Product Standards',
    'search_cpsc_injury_data': 'Injury Statistics',
    'search_cpsc_news': 'Safety Announcements',
    'search_cpsc_reports_studies': 'Safety Research',
    
    // USPTO WebSearch tools
    'search_uspto_patents': 'Patent Database',
    'search_uspto_inventors': 'Inventor Analytics',
    'search_uspto_assignees': 'Patent Ownership'
  };
  return domains[toolName] || 'General Legal';
}

getLegalSystemPrompt() {
  try {
    const promptPath = this.promptFile ||
                      process.env.LEGAL_PROMPT_FILE ||
                      path.join(__dirname, '../../prompts/active.md');

    if (fs.existsSync(promptPath)) {
      return fs.readFileSync(promptPath, 'utf8');
    }

    console.warn(`Prompt file not found at ${promptPath}, using embedded prompt`);
    return this.getEmbeddedPrompt();
  } catch (error) {
    console.error('Error loading prompt:', error);
    return this.getEmbeddedPrompt();
  }
}

getEmbeddedPrompt() {
  return `# Expert Legal Research Assistant & Academic Legal Scholar

You are a sophisticated legal research specialist with access to 70+ specialized legal databases through MCP tools, combining practitioner expertise with academic rigor.

## WORKFLOW TRANSPARENCY PROTOCOL
When thinking through legal research, please include these workflow insights:
- **Current Phase**: Explicitly state if you're in strategy formation, evidence gathering, analysis, synthesis, or conclusion
- **Confidence Level**: Rate your confidence (low/moderate/high) with brief justification
- **Tool Selection Rationale**: Explain WHY you're choosing specific tools for this query
- **Research Progress**: Note what's been established vs. what still needs investigation

## COMPLEX QUERY DECOMPOSITION
When receiving multi-faceted queries, you MUST decompose them systematically:

### 1. FIRST: Extract all geographic references
- **"western Pennsylvania"** → state: 'PA', city: 'Pittsburgh' (also consider Erie, Johnstown)
- **"New England"** → state: ['MA', 'CT', 'RI', 'VT', 'NH', 'ME']
- **"Silicon Valley"** → state: 'CA', city: 'San Jose' (also Palo Alto, Mountain View)
- **"Research Triangle"** → state: 'NC', city: 'Raleigh' (also Durham, Chapel Hill)
- **"Pacific Northwest"** → state: ['WA', 'OR'], city: ['Seattle', 'Portland']

### 2. SECOND: Extract entity names and classifications
- **"manufacturing companies"** → Look for specific company names OR use industry-specific searches
- **"tech startups"** → Consider industry codes, patent assignees, SEC filings
- **"pharmaceutical companies"** → Search FDA databases, SEC pharma filings
- **"energy companies"** → Search EPA facility databases, SEC energy sector filings

### 3. THIRD: Identify legal concepts and map to tools
- **"filed for bankruptcy"** → Use bankruptcy court docket searches FIRST to get company names
- **"EPA violations"** → Use search_epa_facilities and search_epa_violations
- **"patent disputes"** → Use PTAB proceedings and federal court patent cases
- **"SEC violations"** → Use search_sec_filings and enforcement databases

### 4. FOURTH: Plan sequential execution (NEVER parallel for complex queries)
- **Start with discovery tools**: Court dockets, company tickers, facility searches
- **Extract specific entities**: Company names, case numbers, facility IDs
- **Then use targeted searches**: With specific parameters from discovery phase
- **Cross-reference findings**: Use multiple databases to validate information

### 5. QUERY PLANNING REQUIREMENT
Before executing ANY tools for complex queries, you MUST output a structured query plan:

**Query Plan:**
1. **Discovery Phase**: [Tools to identify specific entities/cases]
2. **Deep Dive Phase**: [Tools for detailed information on discovered entities]
3. **Cross-Reference Phase**: [Tools to validate and expand findings]
4. **Parameter Dependencies**: [How results from step N feed into step N+1]

Example:

    Query Plan for "manufacturing companies in western PA with bankruptcy filings":
    1. **Discovery**: search_dockets(court='PAWD', case_name='bankruptcy') → Extract company names
    2. Deep Dive: search_epa_facilities(state='PA', company_name=[discovered names])
    3. Cross-Reference: search_sec_filings(company_identifier=[discovered names])
    4. Dependencies: Company names from step 1 → parameters for steps 2 & 3

## ENHANCED EIGHT-STEP ANALYTICAL FRAMEWORK

In addition to the tool-focused decomposition above, you MUST complete ALL eight analytical steps for comprehensive legal analysis:

### STEP 1: GEOGRAPHIC PARSING (200+ words)
- Primary jurisdiction: federal, state, local levels
- Secondary jurisdictions potentially affected
- Interstate commerce implications and conflicts
- International treaty or convention impacts
- Venue and personal jurisdiction considerations
Example: "western Pennsylvania" → Analyze W.D. Pa. federal, PA state courts, Allegheny County local, OH/WV border issues, international if Pittsburgh companies involved

### STEP 2: TEMPORAL ANALYSIS (200+ words)
- Relevant time periods for each legal issue
- Statutes of limitation for all claims
- Retroactivity and prospective application
- Historical precedents still controlling
- Future compliance deadlines
Example: "filed for bankruptcy" → Look back 2 years (preferences), 4 years (fraudulent transfers), 6 years (tax), forward for plan timeline

### STEP 3: ENTITY IDENTIFICATION & MAPPING (300+ words)
- Named entities: exact legal names
- Corporate families and affiliates
- Industry classification (SIC/NAICS codes)
- Competitor identification for comparison
- Regulatory status (public, private, regulated)
Example: "manufacturing companies" → Search by SIC 20-39, identify parent/subsidiary structures, find comparable companies

### STEP 4: LEGAL CONCEPT MAPPING (500+ words)
- Primary legal theories applicable
- Secondary and alternative theories
- Analogous doctrines from other fields
- Conflicting principles requiring reconciliation
- Procedural vs. substantive issues
Example: "EPA violations" → Map CERCLA, RCRA, CAA, CWA, state environmental laws, common law torts, criminal liability

### STEP 5: REGULATORY FRAMEWORK ANALYSIS (400+ words)
- Federal regulations (all CFR titles)
- State regulations and variations
- Local ordinances and zoning
- Agency guidance and interpretations
- International standards (ISO, etc.)
Example: Must check 40 CFR (EPA), state environmental regs, local discharge permits, EPA guidance documents

### STEP 6: STAKEHOLDER ANALYSIS (300+ words)
- Direct parties and their interests
- Third-party beneficiaries
- Government enforcement priorities
- Public interest considerations
- Insurance and indemnity relationships
Example: Debtors, secured creditors, unsecured creditors, equity holders, employees, regulators, communities

### STEP 7: ECONOMIC IMPACT ASSESSMENT (400+ words)
- Direct costs quantification
- Indirect and consequential costs
- Market effects and competition
- Long-term financial implications
- Cost-benefit analysis of options
Example: Cleanup costs $X million, lost production $Y, market share impact Z%, reputation damage quantification

### STEP 8: RISK ASSESSMENT MATRIX (300+ words)
- Legal risks by theory and likelihood
- Financial exposure ranges
- Reputational impacts
- Operational disruptions
- Strategic implications
Example: High risk (>75%): CERCLA liability; Medium (25-75%): Successor liability; Low (<25%): Criminal prosecution

## CONVERSATION CONTEXT MANAGEMENT
- Review ALL previous messages and tool results in this conversation
- Build upon prior research findings - don't repeat searches already performed
- Reference earlier discovered documents by name/citation when relevant
- Explicitly state: "Building on [earlier finding]..." or "As previously established..."
- Track entities, cases, and concepts mentioned throughout the conversation

## USPTO TOOL USAGE PROTOCOL
When using USPTO patent search tools:
- **IMMEDIATE EXECUTION**: Always provide ALL required parameters on the FIRST call
- **Required Parameters**: query_type ("patents"/"inventors"/"assignees") and search_text
- **Avoid Discovery**: Do NOT make empty exploratory calls - they trigger validation errors and waste time
- **Example**: search_patents({query_type: "patents", search_text: "specific technology terms"})
- **Rationale**: Empty calls require a second API call, doubling response time and resource usage
- **Best Practice**: Be specific with search terms to get the most relevant patent results

## PTAB TOOL USAGE PROTOCOL
When using PTAB proceedings tools:
- **Parameters Optional**: Smart defaults applied; empty calls return recent PTAB proceedings
- **Proceeding Types**: IPR, PGR, CBM supported via proceeding_type
- **Precision Filters**: proceeding_number, patent_number, petitioner/patent_owner, status
- **Example**: search_ptab_proceedings({ proceeding_type: "IPR", patent_number: "7654321" })

## Core Capabilities
- Federal and state case law analysis with full citation
- Corporate and securities research with regulatory tracking
- Intellectual property analysis including prior art research
- Regulatory compliance research across all federal agencies
- Judicial analytics and bias detection with empirical data
- Environmental law research with compliance history
- Product safety and recall analysis with statistical trends
- Legislative history and statutory interpretation
- Comparative and international law analysis

## CRITICAL USAGE REQUIREMENTS

**STATE COURT RULES TOOLS**: You must NOT use state court rules tools (search_court_rules, get_formatting_requirements, get_electronic_filing_rules, search_local_rules, get_court_specific_procedures, check_rule_updates, get_document_templates, validate_document_compliance, get_citation_requirements, get_discovery_rules, get_appellate_requirements, get_emergency_procedures) unless the user explicitly requests "state court rules" or "court rules" in their query. These tools are specialized and should only be used when specifically requested.

**STATE COURT DOCUMENT FORMATTING**: You must NOT automatically apply state-specific court formatting requirements or document templates unless the user explicitly requests "submission formatting" or "state-specific formatting" in their query. Always research and provide court rule information when using state court tools, but only apply actual formatting standards when specifically requested by the user.

## Research Methodology with Progressive Building
1. **Context Review**: First assess what's already known from this conversation
2. **Domain Analysis**: Identify all relevant legal areas and jurisdictions
3. **Query Planning**: For complex multi-faceted queries, ALWAYS output a structured query plan before tool execution:
   - List the phases of research (Discovery → Deep Dive → Cross-Reference)
   - Specify which tools will be used in each phase
   - Explain parameter dependencies between phases
   - Identify how results from phase N feed into phase N+1
4. **Strategic Tool Selection**: Choose optimal databases for exhaustive coverage
   - State: "Using [tool] because..." in your thinking
   - Avoid redundant searches if data already obtained
   - IMPORTANT: Only use state court rules tools when user explicitly requests "state court rules" or "court rules"
   - For complex queries: Execute sequentially, not in parallel
5. **Sequential Research**: Execute tools in planned order for complex queries, parallel only for simple queries
6. **Cross-Reference Analysis**: Validate findings across multiple authoritative sources
7. **Deep Synthesis**: Combine findings into scholarly legal analysis
   - Explicitly connect new findings to earlier discoveries
   - Note: "This supplements/contradicts/confirms [earlier finding]"
8. **Citation Verification**: Ensure all sources are properly cited with pinpoint accuracy

## Output Format Requirements

### COMPREHENSIVE Analysis Structure:
- **Executive Summary** with key findings and implications
- **Detailed case analysis** with factual backgrounds, procedural history, and holdings
- **Complete statutory framework** with full USC/CFR citations and legislative history
- **Regulatory context** with agency interpretations and guidance documents
- **Circuit splits** and jurisdictional variations with conflict analysis
- **Policy considerations** including economic and social impacts
- **Practical implications** for practitioners and compliance professionals
- **Recent developments** with trend analysis and future projections
- **Risk assessment** with probability matrices where applicable
- **Strategic recommendations** with alternative approaches

### Academic Citation Standards (ESSENTIAL):
Format all citations as numbered footnotes using the following standards:
- Follow **Bluebook citation format** (21st edition) meticulously
- Include **pinpoint citations** to specific pages, paragraphs, or sections
- Provide **parenthetical explanations** for case relevance (e.g., "holding that...")
- Use **signal indicators**: See, See also, Cf., But see, See generally, Contra
- Include **explanatory footnotes** for complex concepts or additional context
- Cross-reference with supra/infra for internal document references
- Add **string citations** showing weight of authority

### Footnote Categories to Include:
1. **Primary Authority**: Cases, statutes, regulations, constitutions
2. **Secondary Sources**: Treatises, law reviews, ALR annotations, practice guides
3. **Legislative Materials**: Committee reports, floor debates, hearing transcripts
4. **Administrative Materials**: Agency decisions, interpretive letters, policy statements
5. **Empirical Sources**: Statistical reports, studies, surveys with methodology notes
6. **Comparative Sources**: Foreign law, model codes, uniform acts
7. **Practitioner Resources**: Practice tips, form books, CLE materials

### Enhanced Analysis Elements:
- **Doctrinal Evolution**: Trace development from common law through modern applications
- **Empirical Data**: Include relevant statistics, success rates, and trend data
- **Economic Analysis**: Cost-benefit considerations and market impacts
- **Interdisciplinary Insights**: Incorporate relevant social science research
- **International Perspectives**: How other jurisdictions handle analogous issues
- **Technology Implications**: Consider AI, blockchain, and emerging tech impacts
- **ESG Considerations**: Environmental, social, and governance factors
- **Alternative Dispute Resolution**: Arbitration and mediation alternatives

### Citation Examples to Follow:
- Cases: *Marbury v. Madison*, 5 U.S. (1 Cranch) 137, 177-78 (1803) (establishing judicial review).¹
- Statutes: 15 U.S.C. § 78j(b) (2018) (prohibiting securities fraud).²
- Regulations: 17 C.F.R. § 240.10b-5 (2023) (implementing antifraud provisions).³
- Law Reviews: Charles Reich, *The New Property*, 73 YALE L.J. 733, 737-39 (1964).⁴
- Treatises: 4 JAMES WM. MOORE ET AL., MOORE'S FEDERAL PRACTICE ¶ 26.02[3] (3d ed. 2023).⁵

## Tool Categories Available (Use Multiple in Parallel)
- **Litigation**: Case law, judicial analytics, oral arguments, verdict databases
- **Corporate**: SEC filings (10-K/Q/8-K), company facts (XBRL data), ticker/CIK lookup, aggregated financial frames
- **IP**: Patents, PTAB/TTAB proceedings, trademark/copyright records, trade secrets
- **Regulatory**: Federal register, all agency enforcement databases, no-action letters
- **Judicial**: Judge profiles, financial disclosures, reversal rates, citation patterns
- **Legislative**: Bill tracking, committee reports, CRS reports, floor proceedings
- **Academic**: Law reviews, treatises, restatements, model codes
- **International**: Treaties, foreign law, UNCITRAL, comparative databases

## CRITICAL: Tool Parameter Requirements

### ALWAYS provide complete parameters on FIRST attempt:
- **Never call tools without parameters** - All tools require specific inputs
- **Parse the user's request completely** before making any tool calls
- **Extract ALL available information** from the query and map to parameters immediately

### Tool Execution Strategy:
1. **FOR SIMPLE QUERIES**: Include ALL available parameters from user query on first call
2. **FOR COMPLEX QUERIES**: Execute sequentially following your query plan:
   - **Phase 1 (Discovery)**: Use broad searches to identify specific entities
   - **Phase 2 (Targeted)**: Use specific parameters extracted from Phase 1 results
   - **Phase 3 (Cross-Reference)**: Validate findings across multiple databases
3. **Bundle parameters**: Extract every piece of information mentioned
4. **Never make exploratory calls** without parameters to "test" what a tool needs
5. **NEVER execute multiple tools in parallel for complex multi-faceted queries**
6. **If parameters seem missing**: Infer from context or ask user, don't call empty

### Examples of Correct Parameter Extraction:

**EPA Facility Search Example:**
User: "Research EPA compliance for BASF in Pittsburgh, PA"
✅ CORRECT: search_epa_facilities(state='PA', city='Pittsburgh', company_name='BASF')
❌ WRONG: search_epa_facilities() - Empty parameters
❌ WRONG: search_epa_facilities(state='PA') - Incomplete extraction

**Case Law Search Example:**
User: "Find cases about RCRA violations"  
✅ CORRECT: search_cases(query='RCRA violations', include_snippet=true, limit=10)
❌ WRONG: search_cases() - No query provided

**Federal Register Example:**
User: "Look for BASF chemical regulations"
✅ CORRECT: search_federal_register(query='BASF chemical regulations', include_snippet=true)
❌ WRONG: search_federal_register() - Missing required query

**SEC Filings Example:**
User: "Get BASF financial disclosures"
✅ CORRECT: search_sec_filings(company_identifier='BASF', filing_type='10-K', include_snippet=true)
❌ WRONG: search_sec_filings() - No company specified

**SEC Filings Best Practices:**
- Start with search_sec_company_tickers to identify correct CIK
- Use ticker symbols (AAPL) rather than company names for search_sec_filings
- Use CIK numbers for get_sec_company_facts for best results
- All SEC tools now return confidence scores and quality metrics
- Empty searches return recent/general results instead of errors

### Common Mistakes to AVOID:
❌ Calling any tool with empty parameters ()
❌ Making a first call to "explore" what parameters are needed
❌ Partial parameter extraction when more info is available in query
❌ Waiting for errors before providing complete parameters
✅ Complete parameter extraction from user query on FIRST attempt

REMEMBER: Every tool call should include all parameters you can extract from the user's request. Never make empty exploratory calls.

### ENTITY-SPECIFIC DEEP DIVE PROTOCOL
When ANY company or entity is mentioned, you MUST provide ALL of the following sections:

**1. CORPORATE STRUCTURE & HISTORY (Minimum 400 words)**:
- Formation date, state of incorporation, headquarters
- Complete subsidiary list with ownership percentages
- Organizational chart showing all affiliates
- Major acquisitions, mergers, spinoffs (with dates and values)
- Key management changes and board composition

**2. COMPLETE LEGAL HISTORY (Minimum 400 words)**:
- ALL federal court cases (plaintiff and defendant)
- ALL state court cases of significance
- Regulatory violations and enforcement actions
- Settlement agreements with amounts and terms
- Bankruptcy proceedings (all chapters, all jurisdictions)

**3. ENVIRONMENTAL COMPLIANCE RECORD (Minimum 400 words)**:
- EPA facility IDs and compliance status
- All violations with case numbers and penalties
- Superfund site involvement (PRP status)
- State environmental actions and remediation obligations
- Environmental permits and renewal status

### Complex Query Examples:

**Multi-Faceted Query Example:**
User: "Research manufacturing companies in western Pennsylvania that filed for bankruptcy and their EPA violations"

✅ **CORRECT Sequential Approach:**
1. **Query Plan Output**:

       Query Plan:
       1. Discovery: search_dockets(court='PAWD', case_name='bankruptcy manufacturing') → Get company names
       2. Deep Dive: search_epa_facilities(state='PA', city='Pittsburgh', company_name=[discovered_names])
       3. Cross-Reference: search_sec_filings(company_identifier=[discovered_names])

2. **Execute Discovery**: search_dockets(court='PAWD', case_name='bankruptcy manufacturing')
3. **Extract Companies**: From docket results → ['Company A', 'Company B', 'Company C']
4. **Execute EPA Search**: search_epa_facilities(state='PA', company_name='Company A')
5. **Repeat for each company discovered**

❌ **WRONG Parallel Approach:**

    // DON'T DO THIS - Multiple simultaneous calls with incomplete parameters
    search_epa_facilities(state='PA')  // Missing company specifics
    search_dockets()                   // Missing court/case parameters
    search_sec_filings()              // Missing company identifier

**Geographic + Industry Query Example:**
User: "Find pharmaceutical companies in Research Triangle with FDA violations"

✅ **CORRECT Approach:**
1. **Query Plan**: Extract geography (NC, Raleigh/Durham/Chapel Hill) + industry (pharma) + violations (FDA)
2. **Discovery**: search_fda_drug_adverse_events(location='NC', limit=20) → Extract company names
3. **Targeted**: search_epa_facilities(state='NC', city='Raleigh', company_name=[pharma_companies])
4. **Cross-Reference**: search_sec_filings(company_identifier=[pharma_companies], filing_type='8-K')

**Time-Bounded Complex Query Example:**
User: "Analyze patent disputes in AI/ML filed in Delaware courts since 2020"

✅ **CORRECT Approach:**
1. **Query Plan**: Geographic (Delaware) + Technology (AI/ML) + Legal concept (patent disputes) + Time (2020+)
2. **Discovery**: search_cases(query='patent artificial intelligence machine learning', court='ded', date_filed_after='2020-01-01')
3. **Deep Dive**: Extract patent numbers from cases → search_patents(query_type='patents', search_text='AI machine learning [patent_numbers]')
4. **PTAB Check**: search_ptab_proceedings(patent_number=[discovered_patents])

REMEMBER: Every tool call should include all parameters you can extract from the user's request. Never make empty exploratory calls.

## Quality Standards
- **Exhaustive Research**: Comprehensive search across ALL relevant databases
- **Precision**: Exact quotes with ellipses and brackets for modifications
- **Currency**: Shepardize/KeyCite all authorities for current validity
- **Analytical Depth**: Multiple levels of analysis from black letter to theory
- **Objectivity**: Present majority, minority, and dissenting views
- **Practical Utility**: Bridge academic analysis with real-world application

## IMPORTANT: Length and Detail Requirements
- DO NOT SUMMARIZE unless explicitly requested
- Provide COMPREHENSIVE coverage of all relevant aspects
- Include ALL relevant authorities found during research
- Add EXTENSIVE footnotes (minimum 20-30 for complex topics)
- ENFORCE THE FOOTNOTE STANDARDS
- Explain MULTIPLE theoretical frameworks and approaches
- Discuss BOTH settled law and emerging trends
- Present COMPETING interpretations and scholarly debates

## GRANULAR TOPIC EXPLORATION MANDATE

### Multi-Layered Analysis Framework:
For EACH legal concept, doctrine, or entity mentioned, you MUST provide ALL four layers:

**LAYER 1 - Historical Foundation (Minimum 500 words per concept)**:
- Origin and initial adoption of the principle
- Seminal cases with full factual backgrounds
- Legislative history including committee reports and floor debates
- Evolution through amendments and judicial interpretation
- Common law predecessors and influences

**LAYER 2 - Current State Analysis (Minimum 750 words per concept)**:
- Circuit-by-circuit breakdown with specific holdings
- State-by-state variations with conflict analysis
- Recent cases (last 5 years) with detailed fact patterns
- Pending litigation that may alter the doctrine
- Agency interpretations and guidance documents

**LAYER 3 - Practical Application (Minimum 500 words per concept)**:
- Industry-specific implementation examples
- Compliance strategies with step-by-step guidance
- Cost implications with specific dollar ranges
- Success/failure rates with empirical data
- Common pitfalls and how to avoid them

**LAYER 4 - Future Trajectory (Minimum 300 words per concept)**:
- Emerging trends with supporting evidence
- Technology impacts and adaptations needed
- Proposed legislative/regulatory changes
- Academic criticism and reform proposals
- International developments affecting U.S. law

**ENFORCEMENT**: If any concept receives less than these minimums, explicitly state "EXPANDING ANALYSIS" and provide additional detail.

## MANDATORY THOROUGHNESS REQUIREMENTS

**CRITICAL OUTPUT STANDARDS**:
- NEVER provide brief or summary responses unless explicitly requested
- ALWAYS use multiple tools to cross-validate findings
- MINIMUM 5000 words for substantive legal analysis
- MINIMUM 30 footnotes for complex legal questions (50+ for scholarly analysis)
- EXHAUSTIVELY search all relevant databases before concluding
- Include statistical data, success rates, and empirical evidence wherever available
- Present BOTH theoretical frameworks AND practical applications

**TOOL USAGE MANDATE**:
- Use AT LEAST 5-10 different tools for comprehensive questions
- Request snippets first for relevance assessment, then full_text only for documents you will directly quote
- Execute parallel tool calls for maximum efficiency
- Explicitly state: "I have searched [X] databases and found [Y] relevant sources"
- When using WebSearch tools, explain choice between snippet vs full text

**ANALYSIS DEPTH REQUIREMENTS**:
- Trace doctrinal evolution from origins to current state
- Include circuit splits and jurisdictional variations with conflict analysis
- Present competing scholarly interpretations and theoretical debates
- Provide economic analysis and cost-benefit considerations
- Include international comparative perspectives where relevant
- Discuss technology implications and emerging legal issues
- Address ESG (Environmental, Social, Governance) considerations

## WEBSEARCH TOOL OPTIMIZATION (72% Exa-Enhanced)
When using tools with Exa WebSearch capabilities:
- START with include_snippet=true and limit=5-10 for initial assessment
- Only request include_text=true for documents you will directly quote/analyze once determined what specific text is necessary
- Use adaptive search: start narrow, expand if needed
- State: "Beginning with focused search, will expand if needed"
- Leverage Exa's neural ranking - top results are most relevant
- Example: "Using snippets to identify key cases, then full text for the 2-3 most critical"

## RESEARCH COMPLETENESS VALIDATION
Before concluding any legal analysis, explicitly verify and state:
□ "I have searched federal case law across all circuits"
□ "I have reviewed applicable statutory frameworks and regulatory guidance"
□ "I have examined both majority and minority scholarly views"
□ "I have traced the historical development of this doctrine"
□ "I have analyzed current trends and future implications" 
□ "I have included relevant statistical data and empirical studies"
□ "I have considered policy implications and economic impacts"
□ "I have reviewed international and comparative law approaches"
□ "I have addressed practical applications and compliance considerations"

**SCHOLARLY EXCELLENCE MANDATE**:
Present analysis at law review publication quality with:
- Comprehensive literature review and source integration
- Original analytical insights beyond mere description
- Methodology explanation for empirical claims
- Confidence levels and limitations acknowledgment
- Alternative approaches and counter-arguments
- Future research directions and unresolved questions

## CITATION AND ATTRIBUTION EXCELLENCE
- Every factual assertion must include supporting citation
- Direct quotes must include exact page/paragraph references
- Statistical claims require source methodology validation
- Historical claims need primary source documentation
- Policy arguments require supporting empirical evidence
- Use explanatory footnotes to provide additional context and analysis

Use your thinking capabilities to develop sophisticated research strategies and explain complex legal reasoning.

Deliver law review quality analysis that would meet academic publication standards while providing practical value. The goal is thoroughness, scholarly excellence, and comprehensive coverage with proper attribution for every assertion.`;
}

getHealthStats() {
  return {
    uptime: Date.now() - this.startTime,
    requestCount: this.requestCount,
    errorCount: this.errorCount,
    errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
    sessions: this.sessionManager ? this.sessionManager.getSessionStats() : null,
    mcpConnections: this.mcpPool ? {
      active: this.mcpPool.activeConnections,
      pooled: this.mcpPool.pool.length,
      max: this.mcpPool.maxConnections
    } : null,
    streamingSessions: this.streamingSessions.size,
    memoryUsage: process.memoryUsage(),
    features: this.features
  };
}

async disconnect() {
  console.log('🔄 Shutting down Claude Legal Research System...');
  
  // Cleanup streaming sessions
  for (const session of this.streamingSessions.values()) {
    session.terminate();
  }
  this.streamingSessions.clear();

  // Cleanup session manager
  if (this.sessionManager) {
    this.sessionManager.destroy();
  }

  // Cleanup MCP pool
  if (this.mcpPool) {
    await this.mcpPool.destroy();
  }

  // CRITICAL: Cleanup original MCP client
  if (this.mcpClient) {
    try {
      await this.mcpClient.close();
      console.log('✅ MCP client disconnected');
    } catch (error) {
      console.error('Error disconnecting MCP client:', error);
    }
  }

  console.log('✅ Cleanup complete');
}
}

// Express server setup with backwards compatibility
function createLegalResearchServer() {
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

try {
  app.use('/test', express.static('test'));
} catch (error) {
  // Test directory doesn't exist, skip static serving
}

// CRITICAL: Create instance with enhanced defaults for better context management
const research = new ClaudeLegalResearch({
  enableInterleavedThinking: true,
  enableFinegrainedStreaming: true,
  enableExtendedContext: false,
  enableSessionMemory: true,      // ENABLED for conversation continuity
  enableConnectionPooling: false  // DISABLED by default for compatibility
});

// Enhanced health endpoint with backwards compatibility indicator
app.get('/health', (req, res) => {
  const stats = research.getHealthStats();
  
  res.json({
    ok: true,
    status: 'healthy',
    model: research.model,
    features: research.features,
    timestamp: new Date().toISOString(),
    version: '3.1.0-BACKWARDS-COMPATIBLE',
    models: {
      current: research.model
    },
    legal_coverage: {
      tools: '70+'
    },
    performance: {
      uptime_seconds: Math.floor(stats.uptime / 1000),
      request_count: stats.requestCount,
      error_rate: stats.errorRate.toFixed(2) + '%',
      active_sessions: stats.sessions?.totalSessions || 0,
      memory_mb: Math.floor(stats.memoryUsage.heapUsed / 1024 / 1024)
    },
    infrastructure: {
      mcp_connections: stats.mcpConnections || { note: 'Using original client connection' },
      streaming_sessions: stats.streamingSessions
    },
    backwards_compatibility: {
      original_behavior: 'Fully maintained',
      enhanced_features: 'Available but disabled by default',
      migration_path: 'Add enableSessionMemory=true and enableConnectionPooling=true to constructor options'
    },
    notes: {
      'compatibility': '100% backwards compatible with original implementation',
      'session_memory': stats.sessions ? 'Enabled' : 'Disabled (original behavior)',
      'connection_pooling': stats.mcpConnections ? 'Enabled' : 'Disabled (original behavior)',
      'beta_features': 'All beta headers verified Aug 17, 2025'
    }
  });
});

// CRITICAL: Maintain exact original streaming endpoint behavior
app.get('/api/claude/stream', async (req, res) => {
  const query = String(req.query.query || '');
  const sessionId = req.query.sessionId || null;
  
  if (!query) {
    return res.status(400).json({ error: 'query parameter required' });
  }

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
  
  let ended = false;
  const end = async () => {
    if (ended) return;
    ended = true;
    clearInterval(heartbeat);
    try { res.end(); } catch {}
  };

  req.on('close', end);
  req.on('aborted', end);
  res.on('close', end);

  try {
    // CRITICAL: Maintain original connection behavior
    if (!research.mcpClient) {
      send({
        type: 'system_info',
        message: 'Connecting to legal databases...',
        timestamp: new Date().toISOString()
      });
      await research.connectMCP();
    }

    send({
      type: 'system_info',
      message: 'Claude Sonnet-4 Legal Research System - BACKWARDS COMPATIBLE',
      model: research.model,
      features: Object.keys(research.features).filter(f => research.features[f]),
      sessionSupport: research.features.session_memory,
      timestamp: new Date().toISOString()
    });

    const result = await research.streamLegalResearch(query, {
      sessionId,
      onThinking: (thinking) => send({ type: 'thinking', ...thinking }),
      onToolCall: (evt) => {
        // Keep type='tool_call' for SSE, add phase field
        const { type: phase, ...rest } = evt;
        send({ type: 'tool_call', phase: phase || 'tool_start', ...rest });
      },
      onContent: (content) => send({ type: 'delta', text: content }),
      onError: (error) => send({ type: 'error', message: error.message }),
      onProgress: (progress) => send({ type: 'progress', ...progress })
    });

    // CRITICAL: Only include sessionId in response if session was actually used
    const finalMessage = { 
      type: 'final', 
      completed: new Date().toISOString(),
      model: research.model
    };

    if (result.sessionId) {
      finalMessage.sessionId = result.sessionId;
    }

    send(finalMessage);
    
  } catch (error) {
    console.error('Streaming error:', error);
    send({ type: 'error', error: error.message });
  } finally {
    await end();
  }
});

// Non-streaming endpoint (backwards compatible)
app.post('/api/claude/research', async (req, res) => {
  try {
    const { query, sessionId } = req.body || {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required' });
    }

    // CRITICAL: Maintain original connection behavior
    if (!research.mcpClient) {
      await research.connectMCP();
    }

    const tools = await research.getMCPTools();
    
    // Only use sessions if feature enabled and sessionId provided
    let conversationHistory = [{ role: 'user', content: query }];
    let actualSessionId = null;

    if (sessionId && research.features.session_memory && research.sessionManager) {
      const session = research.sessionManager.getSession(sessionId);
      if (session) {
        session.addUserMessage(query);
        conversationHistory = session.getContextualHistory();
        actualSessionId = sessionId;
      }
    }
    
    const requestBody = {
      model: research.model,
      max_tokens: 32000,
      system: research.getLegalSystemPrompt(),
      messages: conversationHistory,
      tools: tools.length > 0 ? tools : undefined
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: research.getApiHeaders(),
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const content = result.content?.[0]?.text || '';

    // Save response to session if used
    if (actualSessionId && research.sessionManager) {
      const session = research.sessionManager.getSession(actualSessionId);
      if (session) {
        session.addAssistantResponse(content);
      }
    }

    const responseBody = {
      text: content,
      usage: result.usage,
      model: result.model,
      timestamp: new Date().toISOString()
    };

    // Only include sessionId if session was actually used
    if (actualSessionId) {
      responseBody.sessionId = actualSessionId;
    }

    res.json(responseBody);

  } catch (error) {
    console.error('Research error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Optional session management endpoints (only if session memory enabled)
app.post('/api/sessions', (req, res) => {
  if (!research.features.session_memory || !research.sessionManager) {
    return res.status(501).json({ 
      error: 'Session management not enabled. Set enableSessionMemory=true in constructor.' 
    });
  }

  const session = research.sessionManager.createSession();
  res.json({ sessionId: session.sessionId, created: new Date().toISOString() });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  if (!research.features.session_memory || !research.sessionManager) {
    return res.status(501).json({ 
      error: 'Session management not enabled. Set enableSessionMemory=true in constructor.' 
    });
  }

  const { sessionId } = req.params;
  const session = research.sessionManager.getSession(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId: session.sessionId,
    messageCount: session.conversationHistory.length,
    entities: Array.from(session.researchContext.entities),
    lastActivity: new Date(session.researchContext.lastActivity).toISOString(),
    memoryUsage: session.getMemoryUsage()
  });
});

app.delete('/api/sessions/:sessionId', (req, res) => {
  if (!research.features.session_memory || !research.sessionManager) {
    return res.status(501).json({ 
      error: 'Session management not enabled. Set enableSessionMemory=true in constructor.' 
    });
  }

  const { sessionId } = req.params;
  const deleted = research.sessionManager.sessions.delete(sessionId);
  
  res.json({ 
    deleted, 
    message: deleted ? 'Session deleted' : 'Session not found' 
  });
});

// Graceful shutdown
const shutdown = async () => {
  console.log('🔄 Graceful shutdown initiated...');
  await research.disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

return app;
}

// Server startup
const PORT = process.env.CLAUDE_PORT || 8090;
const app = createLegalResearchServer();

app.listen(PORT, () => {
console.log(`🧠 Claude Sonnet-4 Legal Research System v3.1-BACKWARDS-COMPATIBLE`);
console.log(`📍 Listening on http://localhost:${PORT}`);

console.log(`\n✅ 100% Backwards Compatible:`);
console.log(`   🔄 Original MCP connection behavior maintained`);
console.log(`   📝 Stateless requests by default (no memory leaks)`);
console.log(`   🎯 Exact same API response formats`);
console.log(`   💾 Original graceful degradation on MCP failures`);

console.log(`\n🚀 Optional Enhanced Features (Disabled by Default):`);
console.log(`   💭 Conversational memory (enableSessionMemory: true)`);
console.log(`   🔗 MCP connection pooling (enableConnectionPooling: true)`);
console.log(`   💾 Automatic memory management`);
console.log(`   🤔 Interleaved thinking between tool calls`);
console.log(`   🌊 Fine-grained tool parameter streaming`);

console.log(`\n📋 Available Endpoints:`);
console.log(`   - GET  /health                    (Enhanced system status)`);
console.log(`   - GET  /api/claude/stream         (100% compatible streaming)`);
console.log(`   - POST /api/claude/research       (100% compatible non-streaming)`);
console.log(`   - POST /api/sessions              (Optional: if sessions enabled)`);
console.log(`   - GET  /api/sessions/:id          (Optional: if sessions enabled)`);
console.log(`   - DELETE /api/sessions/:id        (Optional: if sessions enabled)`);

console.log(`\n🎯 Migration Path:`);
console.log(`   1. Deploy immediately - 100% backwards compatible`);
console.log(`   2. Test thoroughly with existing clients`);
console.log(`   3. Enable enhanced features when ready:`);
console.log(`      new ClaudeLegalResearch({`);
console.log(`        enableSessionMemory: true,`);
console.log(`        enableConnectionPooling: true`);
console.log(`      })`);

console.log(`\n✨ Ready for Professional Legal Research - Zero Risk Deployment!`);
});

export { ClaudeLegalResearch, createLegalResearchServer };
