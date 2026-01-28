/**
 * Unit tests for Tool Definitions module
 * Tests the structure and content of all MCP tool schemas
 */

import { describe, test, expect } from '@jest/globals';
import {
  courtListenerTools,
  financialDisclosureTools,
  secEdgarTools,
  federalRegisterTools,
  usptoTools,
  govInfoTools,
  exaTools,
  comprehensiveAnalysisTools,
  allTools
} from '../../../src/tools/toolDefinitions.js';

describe('Tool Definitions', () => {
  const validateToolSchema = (tool) => {
    expect(tool).toHaveProperty('name');
    expect(typeof tool.name).toBe('string');
    expect(tool).toHaveProperty('description');
    expect(typeof tool.description).toBe('string');
    expect(tool).toHaveProperty('inputSchema');
    expect(typeof tool.inputSchema).toBe('object');
    expect(tool.inputSchema).toHaveProperty('type');
    expect(tool.inputSchema.type).toBe('object');
    expect(tool.inputSchema).toHaveProperty('properties');
    expect(typeof tool.inputSchema.properties).toBe('object');

    // Check properties for basic structure
    for (const propName in tool.inputSchema.properties) {
      const prop = tool.inputSchema.properties[propName];
      expect(prop).toHaveProperty('type');
      expect(prop).toHaveProperty('description');
    }
  };

  test('courtListenerTools should be an array of valid tool schemas', () => {
    expect(Array.isArray(courtListenerTools)).toBe(true);
    expect(courtListenerTools.length).toBeGreaterThan(0);
    courtListenerTools.forEach(validateToolSchema);
  });

  test('financialDisclosureTools should be an array of valid tool schemas', () => {
    expect(Array.isArray(financialDisclosureTools)).toBe(true);
    expect(financialDisclosureTools.length).toBeGreaterThan(0);
    financialDisclosureTools.forEach(validateToolSchema);
  });

  test('secEdgarTools should be an array of valid tool schemas', () => {
    expect(Array.isArray(secEdgarTools)).toBe(true);
    expect(secEdgarTools.length).toBeGreaterThan(0);
    secEdgarTools.forEach(validateToolSchema);
  });

  test('federalRegisterTools should be an array of valid tool schemas', () => {
    expect(Array.isArray(federalRegisterTools)).toBe(true);
    expect(federalRegisterTools.length).toBeGreaterThan(0);
    federalRegisterTools.forEach(validateToolSchema);
  });

  test('usptoTools should be an array of valid tool schemas', () => {
    expect(Array.isArray(usptoTools)).toBe(true);
    expect(usptoTools.length).toBeGreaterThan(0);
    usptoTools.forEach(validateToolSchema);
  });

  test('govInfoTools should be an array of valid tool schemas', () => {
    expect(Array.isArray(govInfoTools)).toBe(true);
    expect(govInfoTools.length).toBeGreaterThan(0);
    govInfoTools.forEach(validateToolSchema);
  });

  test('exaTools should be an array of valid tool schemas', () => {
    expect(Array.isArray(exaTools)).toBe(true);
    expect(exaTools.length).toBeGreaterThan(0);
    exaTools.forEach(validateToolSchema);
  });

  test('comprehensiveAnalysisTools should be an array of valid tool schemas', () => {
    expect(Array.isArray(comprehensiveAnalysisTools)).toBe(true);
    expect(comprehensiveAnalysisTools.length).toBeGreaterThan(0);
    comprehensiveAnalysisTools.forEach(validateToolSchema);
  });

  test('allTools should combine all individual tool arrays', () => {
    const expectedTotalTools =
      courtListenerTools.length +
      financialDisclosureTools.length +
      secEdgarTools.length +
      federalRegisterTools.length +
      usptoTools.length +
      govInfoTools.length +
      exaTools.length +
      comprehensiveAnalysisTools.length;

    expect(Array.isArray(allTools)).toBe(true);
    expect(allTools).toHaveLength(expectedTotalTools);

    // Ensure no duplicate tool names
    const toolNames = new Set();
    allTools.forEach(tool => {
      expect(toolNames.has(tool.name)).toBe(false);
      toolNames.add(tool.name);
    });
  
    describe('Tool Discovery for Intelligence Layer', () => {
      test('all tools have unique, descriptive names', () => {
        const toolNames = new Set();
        allTools.forEach(tool => {
          expect(toolNames.has(tool.name)).toBe(false); // Ensure no duplicate names
          toolNames.add(tool.name);
          expect(tool.name).toMatch(/^[a-z_]+$/); // Ensure valid naming convention
          expect(tool.name.length).toBeGreaterThan(3); // Ensure names are not too short
        });
      });
      
      test('all tools have comprehensive descriptions', () => {
        allTools.forEach(tool => {
          expect(tool.description).toBeDefined();
          expect(typeof tool.description).toBe('string');
          expect(tool.description.length).toBeGreaterThan(20); // Ensure descriptions are substantial
          expect(tool.description).not.toContain('TODO'); // No placeholder descriptions
        });
      });
      
      test('all parameters have clear descriptions', () => {
        allTools.forEach(tool => {
          for (const propName in tool.inputSchema.properties) {
            const prop = tool.inputSchema.properties[propName];
            expect(prop.description).toBeDefined();
            expect(typeof prop.description).toBe('string');
            expect(prop.description.length).toBeGreaterThan(10); // Ensure parameter descriptions are substantial
            expect(prop.description).not.toContain('TODO'); // No placeholder descriptions
          }
        });
      });
      
      test('complex tools have examples (conceptual test)', () => {
        // This is a conceptual test as 'examples' are not explicitly part of the current schema.
        // In a real-world scenario, this would involve checking for an 'examples' property
        // or a separate documentation file linked to the tool.
        // For now, we ensure that complex tools have sufficiently detailed descriptions.
        const complexTools = allTools.filter(tool =>
          tool.name === 'comprehensive_legal_entity_analysis' ||
          tool.name === 'search_cases' ||
          tool.name === 'search_patents'
        );
  
        complexTools.forEach(tool => {
          expect(tool.description.length).toBeGreaterThan(50); // Expect more detailed descriptions for complex tools
          // Further checks could involve looking for specific keywords like "example", "usage", etc.
        });
      });
    });
  });

  // Specific schema validation tests
  test('search_cases tool should have required properties and correct types', () => {
    const tool = courtListenerTools.find(t => t.name === 'search_cases');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.required).toEqual(['query']);
    expect(tool.inputSchema.properties.limit.type).toBe('number');
    expect(tool.inputSchema.properties.limit.maximum).toBe(100);
    expect(tool.inputSchema.properties.date_filed_after.type).toBe('string');
  });

  test('get_case_details tool should require case_id', () => {
    const tool = courtListenerTools.find(t => t.name === 'get_case_details');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.required).toEqual(['case_id']);
    expect(tool.inputSchema.properties.case_id.type).toBe('number');
  });

  test('search_judges tool should have enum for selection_method and political_affiliation', () => {
    const tool = courtListenerTools.find(t => t.name === 'search_judges');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.properties.selection_method.enum).toBeDefined();
    expect(tool.inputSchema.properties.political_affiliation.enum).toBeDefined();
  });

  test('search_sec_filings tool should have enum for filing_type', () => {
    const tool = secEdgarTools.find(t => t.name === 'search_sec_filings');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.properties.filing_type.enum).toBeDefined();
  });

  test('search_patents tool should require query_type and have enum', () => {
    const tool = usptoTools.find(t => t.name === 'search_patents');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.required).toEqual(['query_type']);
    expect(tool.inputSchema.properties.query_type.enum).toEqual(["patents", "inventors", "assignees"]);
  });

  test('search_state_statute tool should require state and query, and have state enum', () => {
    const tool = exaTools.find(t => t.name === 'search_state_statute');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.required).toEqual(['state', 'query']);
    expect(tool.inputSchema.properties.state.enum).toBeDefined();
    expect(tool.inputSchema.properties.num_results.minimum).toBe(1);
    expect(tool.inputSchema.properties.num_results.maximum).toBe(10);
  });

  test('comprehensive_legal_entity_analysis tool should have correct enums and defaults', () => {
    const tool = comprehensiveAnalysisTools.find(t => t.name === 'comprehensive_legal_entity_analysis');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.required).toEqual(['entity_name', 'entity_type']);
    expect(tool.inputSchema.properties.entity_type.enum).toBeDefined();
    expect(tool.inputSchema.properties.analysis_scope.items.enum).toBeDefined();
    expect(tool.inputSchema.properties.analysis_scope.default).toEqual(["all"]);
    expect(tool.inputSchema.properties.date_range_years.default).toBe(5);
    expect(tool.inputSchema.properties.date_range_years.maximum).toBe(20);
  });
});