# Migration Kickoff Checklist

**Environment Created:** ✅ `super-legal-mcp-sdk`  
**Date:** December 6, 2025  
**Status:** Ready to begin Phase 0

---

## ✅ Environment Setup Complete

You've successfully created an isolated SDK migration environment! Here's what to do next.

---

## Phase 0: Preparation & Validation (Week 1)

### Day 1: Verify Isolation ✅ (TODAY)

**Goals:**
- Confirm both environments work independently
- Validate no cross-contamination
- Set up basic monitoring

#### Step 1: Test Both Servers Run Simultaneously

```bash
# Terminal 1: Start Production (should already be running)
cd /Users/ej/Google\ Grounding/super-legal-mcp-refactored
npm start
# Expected: Server running on port 3000

# Terminal 2: Start SDK Environment
cd /Users/ej/Google\ Grounding/super-legal-mcp-sdk
npm start
# Expected: Server running on port 3001 (or update .env to set PORT=3001)
```

**Validation:**
- [ ] Production responds: `curl http://localhost:3000/health`
- [ ] SDK responds: `curl http://localhost:3001/health` (or your port)
- [ ] No port conflicts
- [ ] Both show different PIDs: `ps aux | grep "node.*claude-server"`

---

#### Step 2: Update SDK Environment Configuration

```bash
cd /Users/ej/Google\ Grounding/super-legal-mcp-sdk

# Create/update .env for SDK environment
cat >> .env << 'EOF'

# SDK Migration Environment
PORT=3001
ENVIRONMENT=sdk-migration
LOG_LEVEL=debug
SDK_MIGRATION_MODE=true

# Keep all existing API keys (ANTHROPIC_API_KEY, EXA_API_KEY, etc.)
# They should already be copied from production
EOF

# Verify configuration
cat .env | grep -E "PORT|ENVIRONMENT|SDK_MIGRATION_MODE"
```

**Expected Output:**
```
PORT=3001
ENVIRONMENT=sdk-migration
SDK_MIGRATION_MODE=true
```

---

#### Step 3: Install SDK Dependencies

```bash
cd /Users/ej/Google\ Grounding/super-legal-mcp-sdk

# Install Anthropic SDK and Zod (for schema validation)
npm install @anthropic-ai/sdk@latest zod@latest

# Verify installation
npm list @anthropic-ai/sdk zod
```

**Expected Output:**
```
super-legal-mcp-sdk@3.0.0-beta
├── @anthropic-ai/sdk@0.32.0 (or latest)
└── zod@3.22.4 (or latest)
```

---

#### Step 4: Create SDK Server Skeleton

```bash
cd /Users/ej/Google\ Grounding/super-legal-mcp-sdk

# Create new SDK server file (don't overwrite current one yet)
touch src/server/claude-sdk-server.js
```

**Add basic SDK structure:**

```javascript
// src/server/claude-sdk-server.js
/**
 * Claude Agent SDK Migration - Server Implementation
 * Phase 0: Basic setup and validation
 */

import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Initialize Anthropic SDK client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': [
      'interleaved-thinking-2025-05-14',
      'fine-grained-tool-streaming-2025-05-14'
    ].join(',')
  }
});

// Express server
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: 'sdk-migration',
    sdk_version: Anthropic.VERSION || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Basic SDK test endpoint
app.post('/api/sdk-test', async (req, res) => {
  try {
    const { message } = req.body;
    
    console.log('🧪 SDK Test Request:', message);
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: message || 'Hello, Claude!' }]
    });
    
    res.json({
      success: true,
      response: response.content[0].text,
      usage: response.usage,
      model: response.model,
      stop_reason: response.stop_reason
    });
    
  } catch (error) {
    console.error('❌ SDK Test Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Placeholder for main research endpoint (will implement in Phase 1)
app.post('/api/research', (req, res) => {
  res.status(501).json({
    error: 'SDK implementation in progress',
    phase: 'Phase 0 - Preparation',
    message: 'Use /api/sdk-test for basic validation'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Claude SDK Migration Server');
  console.log(`📡 Environment: sdk-migration`);
  console.log(`🔗 Port: ${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/sdk-test`);
  console.log('');
  console.log('SDK Configuration:');
  console.log(`  Model: claude-sonnet-4-5-20250929`);
  console.log(`  Beta Headers: interleaved-thinking, fine-grained-tool-streaming`);
  console.log('');
  console.log('⚠️  Production server should be running on port 3000');
});

export { anthropic };
```

**Save and test:**
```bash
# Start SDK server
node src/server/claude-sdk-server.js

# In another terminal, test the endpoint
curl -X POST http://localhost:3001/api/sdk-test \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from SDK migration environment!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "Hello! I'm Claude, ready to help with your SDK migration...",
  "usage": {
    "input_tokens": 15,
    "output_tokens": 25
  },
  "model": "claude-sonnet-4-5-20250929",
  "stop_reason": "end_turn"
}
```

---

#### Step 5: Verify Production Unchanged

```bash
# Ensure production still works normally
curl http://localhost:3000/health

# Test a production endpoint
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{"query": "Find Tesla 10-K from 2023"}'
```

**Validation:**
- [ ] Production returns normal responses
- [ ] Production logs show no SDK-related activity
- [ ] SDK environment runs independently

---

### Day 2-3: Create Shadow Mode Infrastructure

#### Step 1: Create Shadow Mode Proxy

```bash
mkdir -p /Users/ej/Google\ Grounding/migration-tools
touch /Users/ej/Google\ Grounding/migration-tools/shadow-mode-proxy.js
```

**Shadow Mode Proxy Code:**

```javascript
// migration-tools/shadow-mode-proxy.js
/**
 * Shadow Mode Proxy
 * Routes traffic to both production and SDK, returns production result,
 * logs comparison for validation
 */

import express from 'express';
import fetch from 'node-fetch';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json({ limit: '50mb' }));

const PROD_URL = 'http://localhost:3000';
const SDK_URL = 'http://localhost:3001';
const PROXY_PORT = 3002;

// Metrics storage
const metrics = {
  total_requests: 0,
  prod_failures: 0,
  sdk_failures: 0,
  parity_scores: [],
  latency_diff: []
};

// Simple parity calculation
function calculateParity(prodResponse, sdkResponse) {
  try {
    // Normalize responses (remove timestamps, request IDs, etc.)
    const normalize = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      const normalized = { ...obj };
      delete normalized.timestamp;
      delete normalized.request_id;
      delete normalized.response_time;
      return normalized;
    };
    
    const prod = JSON.stringify(normalize(prodResponse));
    const sdk = JSON.stringify(normalize(sdkResponse));
    
    // Simple string similarity
    if (prod === sdk) return 1.0;
    
    const maxLen = Math.max(prod.length, sdk.length);
    const minLen = Math.min(prod.length, sdk.length);
    
    return minLen / maxLen; // Rough similarity
  } catch (error) {
    return 0;
  }
}

app.post('/api/research', async (req, res) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  metrics.total_requests++;
  
  console.log(`\n🔄 Shadow Mode Request ${requestId}`);
  console.log(`Query: ${req.body.query?.substring(0, 100) || 'N/A'}`);
  
  try {
    // Send to BOTH servers in parallel
    const [prodResult, sdkResult] = await Promise.allSettled([
      fetch(`${PROD_URL}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      }),
      fetch(`${SDK_URL}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      })
    ]);
    
    // Always return production result
    if (prodResult.status === 'fulfilled' && prodResult.value.ok) {
      const prodData = await prodResult.value.json();
      res.json(prodData);
      
      // Compare async (don't block response)
      setImmediate(async () => {
        try {
          if (sdkResult.status === 'fulfilled' && sdkResult.value.ok) {
            const sdkData = await sdkResult.value.json();
            const parity = calculateParity(prodData, sdkData);
            const latencyDiff = (Date.now() - startTime);
            
            metrics.parity_scores.push(parity);
            metrics.latency_diff.push(latencyDiff);
            
            console.log(`✅ Comparison Complete`);
            console.log(`   Parity: ${(parity * 100).toFixed(2)}%`);
            console.log(`   Latency: ${latencyDiff}ms`);
            
            // Log to file for analysis
            const logEntry = {
              timestamp: new Date().toISOString(),
              request_id: requestId,
              query: req.body.query,
              parity,
              latency: latencyDiff,
              prod_tools: prodData.tools_used,
              sdk_tools: sdkData.tools_used
            };
            
            fs.appendFileSync(
              path.join(__dirname, 'shadow-mode-log.jsonl'),
              JSON.stringify(logEntry) + '\n'
            );
          } else {
            metrics.sdk_failures++;
            console.log(`⚠️  SDK Failed: ${sdkResult.reason || 'Unknown'}`);
          }
        } catch (error) {
          console.error('Comparison error:', error);
        }
      });
      
    } else {
      metrics.prod_failures++;
      res.status(500).json({ error: 'Production server failed' });
    }
    
  } catch (error) {
    console.error('Shadow mode error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const avgParity = metrics.parity_scores.length > 0
    ? metrics.parity_scores.reduce((a, b) => a + b, 0) / metrics.parity_scores.length
    : 0;
  
  const avgLatency = metrics.latency_diff.length > 0
    ? metrics.latency_diff.reduce((a, b) => a + b, 0) / metrics.latency_diff.length
    : 0;
  
  res.json({
    total_requests: metrics.total_requests,
    prod_failures: metrics.prod_failures,
    sdk_failures: metrics.sdk_failures,
    avg_parity: avgParity,
    avg_latency_ms: avgLatency,
    parity_distribution: {
      excellent: metrics.parity_scores.filter(p => p >= 0.95).length,
      good: metrics.parity_scores.filter(p => p >= 0.90 && p < 0.95).length,
      poor: metrics.parity_scores.filter(p => p < 0.90).length
    }
  });
});

app.listen(PROXY_PORT, () => {
  console.log('🔄 Shadow Mode Proxy Running');
  console.log(`📡 Proxy Port: ${PROXY_PORT}`);
  console.log(`🏭 Production: ${PROD_URL}`);
  console.log(`🧪 SDK: ${SDK_URL}`);
  console.log(`📊 Metrics: http://localhost:${PROXY_PORT}/metrics`);
  console.log('');
  console.log('⚠️  All traffic returns production results (SDK runs in shadow)');
});
```

**Test Shadow Mode:**
```bash
# Terminal 1: Production (port 3000)
cd super-legal-mcp-refactored && npm start

# Terminal 2: SDK (port 3001)
cd super-legal-mcp-sdk && node src/server/claude-sdk-server.js

# Terminal 3: Shadow Proxy (port 3002)
cd migration-tools && node shadow-mode-proxy.js

# Terminal 4: Send test request
curl -X POST http://localhost:3002/api/research \
  -H "Content-Type: application/json" \
  -d '{"query": "Find Tesla 10-K from 2023"}'

# Check metrics
curl http://localhost:3002/metrics
```

---

### Day 4-5: Create Test Framework

#### Create Parity Test Suite

```bash
mkdir -p /Users/ej/Google\ Grounding/super-legal-mcp-sdk/test/parity
touch /Users/ej/Google\ Grounding/super-legal-mcp-sdk/test/parity/golden-prompts.js
```

**Golden Prompts Test:**

```javascript
// test/parity/golden-prompts.js
/**
 * Golden Prompts - Known queries with expected behavior
 * Used to validate SDK implementation matches legacy
 */

export const GOLDEN_PROMPTS = [
  {
    id: 'sec-001',
    domain: 'sec',
    query: 'Find Tesla 10-K filings from 2023',
    expected: {
      tools_used: ['search_sec_filings'],
      contains: ['Tesla', '10-K', '2023'],
      min_results: 1
    }
  },
  {
    id: 'epa-001',
    domain: 'epa',
    query: 'Show EPA violations for ExxonMobil facilities in Texas',
    expected: {
      tools_used: ['search_epa_violations'],
      contains: ['ExxonMobil', 'Texas'],
      min_results: 1
    }
  },
  {
    id: 'fda-001',
    domain: 'fda',
    query: 'Search FDA device recalls for pacemakers in 2024',
    expected: {
      tools_used: ['search_fda_device_events'],
      contains: ['pacemaker', 'recall'],
      min_results: 1
    }
  },
  {
    id: 'multi-001',
    domain: 'multi',
    query: 'Analyze bankruptcy risk for Tesla using SEC filings and EPA compliance',
    expected: {
      tools_used: ['search_sec_filings', 'search_epa_violations'],
      contains: ['bankruptcy', 'risk', 'Tesla'],
      min_tools: 2
    }
  }
];

export async function runParityTest(prompt, prodUrl, sdkUrl) {
  const fetch = (await import('node-fetch')).default;
  
  console.log(`\n🧪 Testing: ${prompt.id}`);
  console.log(`   Query: ${prompt.query}`);
  
  try {
    const [prodResponse, sdkResponse] = await Promise.all([
      fetch(`${prodUrl}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt.query })
      }).then(r => r.json()),
      fetch(`${sdkUrl}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt.query })
      }).then(r => r.json())
    ]);
    
    // Validate expected behavior
    const results = {
      id: prompt.id,
      passed: true,
      checks: {}
    };
    
    // Check tools used
    if (prompt.expected.tools_used) {
      const prodTools = prodResponse.tools_used || [];
      const sdkTools = sdkResponse.tools_used || [];
      results.checks.tools_match = JSON.stringify(prodTools.sort()) === JSON.stringify(sdkTools.sort());
      results.passed = results.passed && results.checks.tools_match;
    }
    
    // Check content contains expected strings
    if (prompt.expected.contains) {
      for (const term of prompt.expected.contains) {
        const inProd = JSON.stringify(prodResponse).toLowerCase().includes(term.toLowerCase());
        const inSDK = JSON.stringify(sdkResponse).toLowerCase().includes(term.toLowerCase());
        results.checks[`contains_${term}`] = inProd && inSDK;
        results.passed = results.passed && results.checks[`contains_${term}`];
      }
    }
    
    console.log(`   ${results.passed ? '✅' : '❌'} ${results.passed ? 'PASS' : 'FAIL'}`);
    return results;
    
  } catch (error) {
    console.error(`   ❌ ERROR: ${error.message}`);
    return { id: prompt.id, passed: false, error: error.message };
  }
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const prodUrl = process.env.PROD_URL || 'http://localhost:3000';
  const sdkUrl = process.env.SDK_URL || 'http://localhost:3001';
  
  console.log('🧪 Running Golden Prompt Parity Tests');
  console.log(`   Production: ${prodUrl}`);
  console.log(`   SDK: ${sdkUrl}`);
  
  const results = [];
  for (const prompt of GOLDEN_PROMPTS) {
    const result = await runParityTest(prompt, prodUrl, sdkUrl);
    results.push(result);
  }
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${passed}/${total} passed (${(passed/total*100).toFixed(1)}%)`);
  process.exit(passed === total ? 0 : 1);
}
```

---

## Week 1 Summary Checklist

**Environment Setup:**
- [x] Created isolated `super-legal-mcp-sdk` directory
- [ ] Both servers run on different ports (3000 vs 3001)
- [ ] SDK dependencies installed (@anthropic-ai/sdk, zod)
- [ ] Basic SDK server responds to test requests

**Testing Infrastructure:**
- [ ] Shadow mode proxy created (port 3002)
- [ ] Golden prompts test suite created
- [ ] Metrics logging working
- [ ] Can compare production vs SDK side-by-side

**Validation:**
- [ ] Production unaffected by SDK environment
- [ ] No cross-contamination between environments
- [ ] Rollback tested (can stop SDK server without affecting prod)

---

## Next Week Preview: Phase 1 - Headers & Streaming

**Week 2 Goals:**
1. Enable beta headers in SDK environment
2. Implement SDK streaming event handlers
3. Validate thinking block preservation
4. Run shadow mode with 100 test requests
5. Measure parity >90% before proceeding

**Key Deliverables:**
- SDK streaming implementation (replacing manual SSE parsing)
- Thinking block preservation tests
- Latency comparison (SDK vs legacy)

---

## Quick Commands Reference

```bash
# Start all three servers
cd super-legal-mcp-refactored && npm start &           # Production (3000)
cd super-legal-mcp-sdk && node src/server/claude-sdk-server.js &  # SDK (3001)
cd migration-tools && node shadow-mode-proxy.js &      # Proxy (3002)

# Test SDK directly
curl -X POST http://localhost:3001/api/sdk-test \
  -H "Content-Type: application/json" \
  -d '{"message": "Test SDK integration"}'

# Test via shadow mode (returns prod, logs comparison)
curl -X POST http://localhost:3002/api/research \
  -H "Content-Type: application/json" \
  -d '{"query": "Find Tesla 10-K from 2023"}'

# Check shadow mode metrics
curl http://localhost:3002/metrics

# Run parity tests
cd super-legal-mcp-sdk && node test/parity/golden-prompts.js

# Stop all servers
pkill -f "node.*claude-server"
```

---

## Support & Documentation

**Reference Documents:**
- `/Users/ej/Google Grounding/migration-spec.md` - Full implementation spec
- `/Users/ej/Google Grounding/migration-complexity-risk-assessment.md` - Risk analysis
- `/Users/ej/Google Grounding/migration-environment-strategy.md` - Environment strategy
- `/Users/ej/Google Grounding/Agent-Audit-05-12-2025.md` - Current system audit

**When You Need Help:**
1. Check migration-spec.md for code examples
2. Review risk assessment for known issues
3. Check shadow mode logs for comparison data
4. Rollback: stop SDK server, production unaffected

---

**🎉 Congratulations on setting up the isolated environment!**

You've de-risked the entire migration by creating a safe sandbox. Now you can experiment with the SDK without any fear of breaking production. Take your time with Phase 0 to build confidence before moving to streaming implementation.
