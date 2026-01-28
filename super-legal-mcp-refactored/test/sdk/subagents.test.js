import { describe, test, expect } from '@jest/globals';
import {
  getLegalSubagents,
  getSubagent,
  listSubagentNames,
  getSubagentsByModel,
  getAllMcpToolsUsed,
  MCP_PREFIX,
  STANDARD_TOOLS,
  DOMAIN_TOOLS
} from '../../src/config/legalSubagents.js';

describe('Legal Subagents Configuration', () => {

  test('should return all 10 legal subagents', () => {
    const subagents = getLegalSubagents();
    expect(Object.keys(subagents).length).toBe(10);
  });

  test('should include all expected subagent names', () => {
    const names = listSubagentNames();
    expect(names).toContain('securities-researcher');
    expect(names).toContain('case-law-analyst');
    expect(names).toContain('pharma-regulatory-analyst');
    expect(names).toContain('environmental-compliance-analyst');
    expect(names).toContain('patent-analyst');
    expect(names).toContain('regulatory-rulemaking-analyst');
    expect(names).toContain('product-safety-analyst');
    expect(names).toContain('antitrust-competition-analyst');
    expect(names).toContain('statutory-law-analyst');
    expect(names).toContain('legal-research-coordinator');
  });

  test('each subagent should have required fields', () => {
    const subagents = getLegalSubagents();

    for (const [name, def] of Object.entries(subagents)) {
      // Description is required and should be substantial
      expect(def.description).toBeDefined();
      expect(def.description.length).toBeGreaterThan(50);

      // Prompt is required and should be substantial
      expect(def.prompt).toBeDefined();
      expect(def.prompt.length).toBeGreaterThan(100);

      // Tools should be defined as an array
      expect(def.tools).toBeDefined();
      expect(Array.isArray(def.tools)).toBe(true);

      // Model should be valid if specified
      expect(['sonnet', 'opus', 'haiku', undefined]).toContain(def.model);
    }
  });

  test('securities-researcher should have correct SEC MCP tools', () => {
    const agent = getSubagent('securities-researcher');
    expect(agent).not.toBeNull();
    expect(agent.tools.some(t => t.includes('search_sec_filings'))).toBe(true);
    expect(agent.tools.some(t => t.includes('get_sec_company_facts'))).toBe(true);
    expect(agent.model).toBe('sonnet');
  });

  test('case-law-analyst should have correct court MCP tools', () => {
    const agent = getSubagent('case-law-analyst');
    expect(agent).not.toBeNull();
    expect(agent.tools.some(t => t.includes('search_cases'))).toBe(true);
    expect(agent.tools.some(t => t.includes('get_case_details'))).toBe(true);
    expect(agent.model).toBe('sonnet');
  });

  test('pharma-regulatory-analyst should have correct FDA MCP tools', () => {
    const agent = getSubagent('pharma-regulatory-analyst');
    expect(agent).not.toBeNull();
    expect(agent.tools.some(t => t.includes('search_fda_recalls'))).toBe(true);
    expect(agent.tools.some(t => t.includes('search_fda_drug_labels'))).toBe(true);
    expect(agent.model).toBe('sonnet');
  });

  test('antitrust-competition-analyst should have correct FTC MCP tools', () => {
    const agent = getSubagent('antitrust-competition-analyst');
    expect(agent).not.toBeNull();
    expect(agent.tools.some(t => t.includes('search_ftc_enforcement_cases'))).toBe(true);
    expect(agent.tools.some(t => t.includes('search_ftc_competition_matters'))).toBe(true);
    expect(agent.model).toBe('sonnet');
  });

  test('statutory-law-analyst should have correct US Code MCP tools', () => {
    const agent = getSubagent('statutory-law-analyst');
    expect(agent).not.toBeNull();
    expect(agent.tools.some(t => t.includes('search_us_code'))).toBe(true);
    expect(agent.tools.some(t => t.includes('get_usc_section'))).toBe(true);
    expect(agent.model).toBe('sonnet');
  });

  test('MCP tools should use correct naming convention', () => {
    const mcpTools = getAllMcpToolsUsed();
    expect(mcpTools.length).toBeGreaterThan(0);
    for (const tool of mcpTools) {
      expect(tool).toMatch(/^mcp__super-legal-tools__/);
    }
  });

  test('descriptions should contain trigger keywords', () => {
    const securities = getSubagent('securities-researcher');
    expect(securities.description).toMatch(/PROACTIVELY|MUST BE USED/);
    expect(securities.description.toLowerCase()).toMatch(/sec|10-k|filings/);

    const antitrust = getSubagent('antitrust-competition-analyst');
    expect(antitrust.description).toMatch(/PROACTIVELY|MUST BE USED/);
    expect(antitrust.description.toLowerCase()).toMatch(/ftc|antitrust|merger/);

    const statutory = getSubagent('statutory-law-analyst');
    expect(statutory.description).toMatch(/PROACTIVELY|MUST BE USED/);
    expect(statutory.description.toLowerCase()).toMatch(/us code|usc|statute/);
  });

  test('product-safety-analyst should use haiku model for faster lookups', () => {
    const agent = getSubagent('product-safety-analyst');
    expect(agent.model).toBe('haiku');
  });

  test('legal-research-coordinator should use haiku model for routing', () => {
    const agent = getSubagent('legal-research-coordinator');
    expect(agent.model).toBe('haiku');
    // Coordinator should only have read-only tools
    expect(agent.tools).toEqual(STANDARD_TOOLS.readOnly);
  });

  test('getSubagentsByModel should filter correctly', () => {
    const sonnetAgents = getSubagentsByModel('sonnet');
    const haikuAgents = getSubagentsByModel('haiku');

    // Most agents should be sonnet
    expect(Object.keys(sonnetAgents).length).toBeGreaterThanOrEqual(7);

    // Only 2 agents should be haiku
    expect(Object.keys(haikuAgents).length).toBe(2);
    expect(haikuAgents['product-safety-analyst']).toBeDefined();
    expect(haikuAgents['legal-research-coordinator']).toBeDefined();
  });

  test('getSubagent returns null for unknown agent', () => {
    const result = getSubagent('nonexistent-agent');
    expect(result).toBeNull();
  });
});

describe('Domain Tools Configuration', () => {

  test('MCP_PREFIX should be correct', () => {
    expect(MCP_PREFIX).toBe('mcp__super-legal-tools__');
  });

  test('DOMAIN_TOOLS should have all expected domains', () => {
    expect(DOMAIN_TOOLS.securities).toBeDefined();
    expect(DOMAIN_TOOLS.caseLaw).toBeDefined();
    expect(DOMAIN_TOOLS.pharmaceutical).toBeDefined();
    expect(DOMAIN_TOOLS.environmental).toBeDefined();
    expect(DOMAIN_TOOLS.patent).toBeDefined();
    expect(DOMAIN_TOOLS.federalRegister).toBeDefined();
    expect(DOMAIN_TOOLS.productSafety).toBeDefined();
    expect(DOMAIN_TOOLS.antitrust).toBeDefined();
    expect(DOMAIN_TOOLS.usCode).toBeDefined();
  });

  test('DOMAIN_TOOLS should contain correct tool names', () => {
    // SEC tools
    expect(DOMAIN_TOOLS.securities).toContain(`${MCP_PREFIX}search_sec_filings`);
    expect(DOMAIN_TOOLS.securities).toContain(`${MCP_PREFIX}get_sec_company_facts`);

    // Case law tools
    expect(DOMAIN_TOOLS.caseLaw).toContain(`${MCP_PREFIX}search_cases`);
    expect(DOMAIN_TOOLS.caseLaw).toContain(`${MCP_PREFIX}get_case_details`);

    // FTC/Antitrust tools
    expect(DOMAIN_TOOLS.antitrust).toContain(`${MCP_PREFIX}search_ftc_enforcement_cases`);
    expect(DOMAIN_TOOLS.antitrust).toContain(`${MCP_PREFIX}search_ftc_competition_matters`);

    // US Code tools
    expect(DOMAIN_TOOLS.usCode).toContain(`${MCP_PREFIX}search_us_code`);
    expect(DOMAIN_TOOLS.usCode).toContain(`${MCP_PREFIX}get_usc_section`);
  });

  test('STANDARD_TOOLS should have correct structure', () => {
    expect(STANDARD_TOOLS.readOnly).toEqual(['Read', 'Grep', 'Glob']);
    expect(STANDARD_TOOLS.withBash).toContain('Bash');
    expect(STANDARD_TOOLS.withWeb).toContain('WebFetch');
    expect(STANDARD_TOOLS.withWeb).toContain('WebSearch');
  });
});
