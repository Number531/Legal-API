# Universal Parameter Wrapper Implementation Guide

## Executive Summary
This document outlines the implementation of a universal parameter wrapper to enforce token usage limits across all 96 MCP tools without breaking existing infrastructure. The solution caps parameters at the tool implementation layer, preventing Claude from overriding our limits and causing token exhaustion.

## Current State Analysis

### The Problem
1. **Token Limit Exceeded**: Queries consistently hitting 200K+ token limit
2. **Incomplete Coverage**: Only ~15 of 96 tools have parameter caps applied
3. **Claude Override**: Claude explicitly sends `limit: 10`, `include_snippet: true` despite our defaults
4. **Pass-Through Pattern**: 60+ tools use direct pass-through: `(args) => client.method(args)`

### Current Implementation Patterns

#### Tools WITH Caps (Working - 15 tools)
```javascript
"search_cases": wrapWithConversation("search_cases", (args) => {
  return courtListenerWeb.searchOpinionsWeb({
    query: args.query || args.case_name || '',
    limit: Math.min(args.limit || 5, 5),  // ✅ Capped
    include_snippet: false,               // ✅ Forced false
    include_full_text: args.include_full_text || false
  });
})
```

#### Tools WITHOUT Caps (Problem - 60+ tools)
```javascript
"search_dockets": wrapWithConversation("search_dockets", (args) =>
  courtListenerWeb.searchDocketsWeb(args)  // ❌ No caps, passes Claude's params
),
"search_sec_filings": wrapWithConversation("search_sec_filings", (args) =>
  secWeb.searchSECFilingsWeb(args)  // ❌ No caps
)
```

## Proposed Universal Wrapper Solution

### Architecture Overview

```
Claude Request → MCP Server → Tool Implementation → Universal Wrapper → API Client
                                                          ↓
                                               Parameter Transformation
                                                    (caps applied)
```

### Implementation Strategy

#### Step 1: Enhanced wrapWithConversation Function

```javascript
// In toolImplementations.js

const PARAMETER_CAPS = {
  // Default caps for all tools
  default: {
    limit: 5,
    include_snippet: false,
    include_text: false,
    include_full_text: false
  },

  // Tool-specific overrides
  fullTextTools: {
    limit: 2  // When include_full_text is true
  },

  // Tools that should not be capped (e.g., specific lookups)
  noCap: [
    'get_case_details',
    'get_judge_details',
    'get_financial_disclosure_details',
    'get_usc_section',
    'nhtsa_decode_vin'
  ]
};

// Universal parameter capping function
function applyParameterCaps(toolName, args) {
  // Skip capping for detail/lookup tools that need specific IDs
  if (PARAMETER_CAPS.noCap.includes(toolName)) {
    return args;
  }

  // Create a copy to avoid mutating original args
  const cappedArgs = { ...args };

  // Apply smart limits based on content type
  if (cappedArgs.include_full_text === true) {
    // Full text requests get stricter limits
    cappedArgs.limit = Math.min(cappedArgs.limit || 2, 2);
  } else {
    // Regular searches get standard limit
    cappedArgs.limit = Math.min(cappedArgs.limit || 5, 5);
  }

  // Force snippet/text flags to false unless explicitly requested
  if (!args.hasOwnProperty('include_snippet')) {
    cappedArgs.include_snippet = false;
  }
  if (!args.hasOwnProperty('include_text')) {
    cappedArgs.include_text = false;
  }
  if (!args.hasOwnProperty('include_full_text')) {
    cappedArgs.include_full_text = false;
  }

  // Log transformations for debugging
  if (JSON.stringify(args) !== JSON.stringify(cappedArgs)) {
    console.log(`[PARAM_CAP] ${toolName}: Transformed`, {
      original: args,
      capped: cappedArgs
    });
  }

  return cappedArgs;
}

// Enhanced wrapper with both conversation logging and parameter capping
const wrapWithConversation = (toolName, toolFunction) => {
  return async (args) => {
    // Apply parameter caps BEFORE calling the tool
    const cappedArgs = applyParameterCaps(toolName, args);

    // Execute tool with capped parameters
    const result = await toolFunction(cappedArgs);

    // Log to conversation bridge if available
    if (conversationBridge && cappedArgs.conversation_id) {
      try {
        await conversationBridge.logToolCall(
          toolName,
          cappedArgs,
          result,
          cappedArgs.conversation_id
        );
      } catch (error) {
        console.warn(`Failed to log ${toolName} to conversation:`, error.message);
      }
    }

    return result;
  };
};
```

#### Step 2: Minimal Changes to Existing Tools

No changes needed to the 60+ pass-through tools! The wrapper automatically applies caps:

```javascript
// These tools automatically get caps without any code changes:
"search_dockets": wrapWithConversation("search_dockets", (args) =>
  courtListenerWeb.searchDocketsWeb(args)  // Now automatically capped!
),
"search_sec_filings": wrapWithConversation("search_sec_filings", (args) =>
  secWeb.searchSECFilingsWeb(args)  // Now automatically capped!
)
```

#### Step 3: Clean Up Redundant Manual Caps

For the 15 tools with manual caps, we can simplify them:

```javascript
// BEFORE (manual caps)
"search_cases": wrapWithConversation("search_cases", (args) => {
  return courtListenerWeb.searchOpinionsWeb({
    query: args.query || args.case_name || '',
    limit: Math.min(args.limit || 5, 5),  // Manual cap
    include_snippet: false,
    include_full_text: args.include_full_text || false
  });
})

// AFTER (automatic caps via wrapper)
"search_cases": wrapWithConversation("search_cases", (args) => {
  return courtListenerWeb.searchOpinionsWeb({
    ...args,
    query: args.query || args.case_name || ''  // Only keep business logic
  });
})
```

## Advanced Features

### Tool Category Configuration

```javascript
const TOOL_CATEGORIES = {
  // High-volume search tools - strict limits
  searchTools: {
    pattern: /^search_/,
    limits: {
      default: 5,
      withFullText: 2
    }
  },

  // Detail/lookup tools - no limits
  detailTools: {
    pattern: /^get_.*_details?$/,
    limits: null  // No capping
  },

  // List tools - moderate limits
  listTools: {
    pattern: /^list_/,
    limits: {
      default: 10,
      withFullText: 5
    }
  },

  // Analysis tools - very strict limits
  analysisTools: {
    names: ['comprehensive_legal_entity_analysis'],
    limits: {
      default: 3,
      withFullText: 1
    }
  }
};

function getToolCategory(toolName) {
  for (const [category, config] of Object.entries(TOOL_CATEGORIES)) {
    if (config.pattern && config.pattern.test(toolName)) {
      return config;
    }
    if (config.names && config.names.includes(toolName)) {
      return config;
    }
  }
  return TOOL_CATEGORIES.searchTools;  // Default to search limits
}
```

### Dynamic Limit Adjustment

```javascript
// Adjust limits based on remaining token budget
function getDynamicLimit(toolName, requestedLimit, tokenBudget) {
  const baseLimit = 5;
  const minLimit = 1;

  // If we're running low on tokens, reduce limits
  if (tokenBudget < 50000) {
    return Math.max(minLimit, Math.floor(baseLimit * 0.4));  // 40% of base
  } else if (tokenBudget < 100000) {
    return Math.max(minLimit, Math.floor(baseLimit * 0.6));  // 60% of base
  }

  // Normal operation
  return Math.min(requestedLimit || baseLimit, baseLimit);
}
```

## Implementation Checklist

### Phase 1: Core Implementation (Immediate)
- [ ] Back up current `toolImplementations.js`
- [ ] Implement `applyParameterCaps` function
- [ ] Update `wrapWithConversation` to include parameter capping
- [ ] Add `PARAMETER_CAPS` configuration object
- [ ] Test with a few problematic tools

### Phase 2: Testing (Same Day)
- [ ] Test complex multi-tool queries
- [ ] Verify token usage stays under 200K
- [ ] Check that detail/lookup tools still work
- [ ] Ensure no tools are broken by caps

### Phase 3: Optimization (Next Day)
- [ ] Clean up redundant manual caps in the 15 tools
- [ ] Implement tool category configuration
- [ ] Add dynamic limit adjustment based on token budget
- [ ] Create monitoring dashboard for parameter transformations

### Phase 4: Documentation (Within Week)
- [ ] Update tool documentation with limit behavior
- [ ] Create troubleshooting guide
- [ ] Document parameter override options
- [ ] Add examples of complex queries that now work

## Testing Strategy

### Test Cases

#### 1. Complex Multi-Tool Query
```javascript
// Should not exceed token limits
"Find all manufacturing companies in Pennsylvania that have EPA violations and recent bankruptcy filings"

Expected behavior:
- All tools return max 5 results
- No snippets included
- Total tokens < 200K
```

#### 2. Full Text Request
```javascript
// Should return only 2 results when full text requested
"Get the full text of recent Supreme Court decisions on patents"

Expected behavior:
- Returns max 2 results with full text
- Other tools still capped at 5
```

#### 3. Specific Lookup
```javascript
// Should not be capped (detail tool)
"Get details for case ID 12345"

Expected behavior:
- Returns complete details without limits
- Not affected by caps
```

### Monitoring

Add logging to track effectiveness:

```javascript
const METRICS = {
  totalCalls: 0,
  cappedCalls: 0,
  tokensSaved: 0,

  log(toolName, original, capped) {
    this.totalCalls++;
    if (original.limit !== capped.limit) {
      this.cappedCalls++;
      const saved = (original.limit || 10) - capped.limit;
      this.tokensSaved += saved * 1000;  // Rough estimate
    }
  },

  report() {
    console.log(`
      Parameter Capping Report:
      - Total calls: ${this.totalCalls}
      - Capped calls: ${this.cappedCalls}
      - Cap rate: ${(this.cappedCalls/this.totalCalls*100).toFixed(1)}%
      - Est. tokens saved: ${this.tokensSaved.toLocaleString()}
    `);
  }
};
```

## Rollback Plan

If issues arise:

1. **Quick Rollback**:
   ```bash
   cp toolImplementations.js.backup toolImplementations.js
   npm restart
   ```

2. **Partial Rollback**:
   - Set `PARAMETER_CAPS.noCap` to include all tool names
   - This disables capping while keeping the wrapper

3. **Gradual Rollout**:
   - Start with a few tools in pilot mode
   - Monitor for 24 hours
   - Roll out to all tools if successful

## Expected Outcomes

### Success Metrics
- **Token Usage**: Reduce from 200K+ to <100K for complex queries
- **Error Rate**: 0% "token limit exceeded" errors
- **Performance**: No noticeable slowdown
- **Functionality**: All tools continue working correctly

### Risk Mitigation
- **Risk**: Some tools may require higher limits
  - **Mitigation**: Tool-specific overrides in configuration

- **Risk**: Claude may retry with different parameters
  - **Mitigation**: Caps are enforced regardless of retries

- **Risk**: Breaking existing workflows
  - **Mitigation**: Extensive testing before full rollout

## Conclusion

The universal wrapper solution provides:
1. **Complete Coverage**: All 96 tools get parameter caps
2. **Minimal Changes**: No need to modify 60+ pass-through tools
3. **Flexible Configuration**: Easy to adjust limits per tool or category
4. **Future-Proof**: New tools automatically get caps
5. **Non-Breaking**: Preserves existing functionality while adding controls

This approach solves the token exhaustion problem while maintaining system stability and requiring minimal code changes.

## Appendix: Quick Implementation Script

```javascript
// Quick test to verify wrapper is working
async function testParameterCapping() {
  const testCases = [
    { tool: 'search_cases', args: { query: 'test', limit: 20 }, expected: 5 },
    { tool: 'search_cases', args: { query: 'test', limit: 20, include_full_text: true }, expected: 2 },
    { tool: 'get_case_details', args: { case_id: 123 }, expected: undefined },  // No cap
  ];

  for (const test of testCases) {
    const capped = applyParameterCaps(test.tool, test.args);
    console.log(`${test.tool}: ${capped.limit === test.expected ? '✅' : '❌'}`);
  }
}
```

## Next Steps

1. Review this implementation plan with the team
2. Create backup of current implementation
3. Implement the universal wrapper in `toolImplementations.js`
4. Test with the failing complex query
5. Monitor token usage and adjust limits as needed
6. Document any tool-specific requirements discovered during testing