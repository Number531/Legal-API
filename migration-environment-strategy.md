# Migration Environment Strategy

**Date:** December 6, 2025  
**Purpose:** Isolate SDK migration work to prevent production breakage

---

## Executive Recommendation

**✅ YES - Create Isolated SDK Environment**

**Strategy:** Parallel environment approach with shared dependencies but isolated orchestration code

---

## 1. Environment Architecture Options

### Option A: Full Fork (RECOMMENDED)

**Structure:**
```
super-legal-mcp-refactored/          # Production (untouched)
├── src/
│   ├── server/claude-server-v2.js   # Current system
│   ├── api-clients/                 # 31 clients
│   └── tools/                       # Tool definitions

super-legal-mcp-sdk/                 # SDK Migration (isolated)
├── src/
│   ├── server/claude-sdk-server.js  # NEW: SDK implementation
│   ├── api-clients/                 # COPIED: With SDK handlers
│   └── tools/                       # COPIED: SDK format
├── .env.sdk                         # Separate API keys/config
└── package.json                     # SDK dependencies
```

**Benefits:**
- ✅ Zero risk to production
- ✅ Side-by-side comparison possible
- ✅ Independent deployment cycles
- ✅ Can run both simultaneously (different ports)

**Drawbacks:**
- ❌ Code duplication (temporary)
- ❌ Need to backport bug fixes to both
- ❌ 2x storage (~500MB)

**Cost:** ~$0 (just disk space)

---

### Option B: Monorepo with Feature Flags

**Structure:**
```
super-legal-mcp-refactored/
├── src/
│   ├── server/
│   │   ├── claude-server-v2.js       # Legacy (preserved)
│   │   └── claude-sdk-server.js      # SDK (new)
│   ├── api-clients/
│   │   ├── BaseClient.js             # Shared
│   │   ├── handlers/
│   │   │   ├── legacy/               # Current handlers
│   │   │   └── sdk/                  # SDK handlers
│   └── tools/
│       ├── legacy/                   # Current format
│       └── sdk/                      # SDK format
├── .env
├── .env.sdk
└── package.json                      # Both sets of dependencies
```

**Benefits:**
- ✅ Shared dependencies (less duplication)
- ✅ Easier to share bug fixes
- ✅ Single repository

**Drawbacks:**
- ⚠️ Risk of accidental imports
- ⚠️ Feature flags must be bulletproof
- ⚠️ Merge conflicts during development

**Cost:** $0

---

### Option C: Branch-Based Development (NOT RECOMMENDED)

**Structure:**
```
main branch:              super-legal-mcp-refactored/ (production)
sdk-migration branch:     super-legal-mcp-refactored/ (SDK work)
```

**Benefits:**
- ✅ Standard git workflow
- ✅ No duplication

**Drawbacks:**
- ❌ Can't run side-by-side comparison
- ❌ Difficult to backport fixes
- ❌ Risky merge at end
- ❌ No shadow mode testing

**Cost:** $0

**Verdict:** ❌ **Do NOT use** - too risky for this migration

---

## 2. RECOMMENDED: Option A (Full Fork) Implementation

### 2.1 Directory Structure

```bash
/Users/ej/Google Grounding/
├── super-legal-mcp-refactored/          # PRODUCTION (freeze)
│   ├── src/                             # Current code (v2.0)
│   ├── package.json                     # Current deps
│   ├── .env                             # Prod API keys
│   └── PORT=3000                        # Prod port
│
├── super-legal-mcp-sdk/                 # SDK MIGRATION (active dev)
│   ├── src/
│   │   ├── server/
│   │   │   └── claude-sdk-server.js     # NEW: SDK implementation
│   │   ├── api-clients/
│   │   │   ├── BaseSDKClient.js         # NEW: SDK base class
│   │   │   ├── SECSDKClient.js          # Adapted with SDK handlers
│   │   │   └── ... (31 clients)
│   │   ├── tools/
│   │   │   ├── sdkToolDefinitions.js    # SDK format
│   │   │   └── sdkToolHandlers.js       # SDK handlers
│   │   └── utils/
│   │       ├── streamHandler.js         # NEW: SDK streaming
│   │       └── parameterCapping.js      # COPIED: Preserve logic
│   ├── test/
│   │   ├── sdk/                         # NEW: SDK-specific tests
│   │   └── parity/                      # NEW: Legacy vs SDK comparison
│   ├── .env.sdk                         # Separate keys (can be same)
│   ├── package.json                     # SDK dependencies (@anthropic-ai/sdk)
│   └── PORT=3001                        # Different port
│
├── migration-tools/                     # SHARED: Comparison scripts
│   ├── shadow-mode-proxy.js            # Routes traffic to both
│   ├── parity-calculator.js            # Compares outputs
│   └── metrics-aggregator.js           # Collects stats
```

### 2.2 Setup Commands

```bash
# 1. Create isolated environment
cd /Users/ej/Google\ Grounding/
cp -R super-legal-mcp-refactored super-legal-mcp-sdk

# 2. Clean SDK environment
cd super-legal-mcp-sdk
rm -rf node_modules/
rm package-lock.json

# 3. Update package.json for SDK
cat > package.json <<EOF
{
  "name": "super-legal-mcp-sdk",
  "version": "3.0.0-beta",
  "type": "module",
  "description": "Legal MCP Server - Claude Agent SDK Migration",
  "main": "src/server/claude-sdk-server.js",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "@modelcontextprotocol/sdk": "^1.0.4",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "zod": "^3.22.4"
  },
  "scripts": {
    "start": "node src/server/claude-sdk-server.js",
    "dev": "NODE_ENV=development node src/server/claude-sdk-server.js",
    "test": "node --test test/sdk/**/*.test.js",
    "test:parity": "node test/parity/compare-outputs.js"
  }
}
EOF

# 4. Install SDK dependencies
npm install

# 5. Create .env.sdk (copy from production)
cp ../super-legal-mcp-refactored/.env .env.sdk
echo "PORT=3001" >> .env.sdk
echo "ENVIRONMENT=sdk-migration" >> .env.sdk

# 6. Git tracking
git add super-legal-mcp-sdk/
git commit -m "feat: create isolated SDK migration environment"
```

### 2.3 Port Configuration

```javascript
// super-legal-mcp-refactored/.env (PRODUCTION)
PORT=3000
ENVIRONMENT=production

// super-legal-mcp-sdk/.env.sdk (MIGRATION)
PORT=3001
ENVIRONMENT=sdk-migration
LOG_LEVEL=debug  // More verbose for debugging
```

**Result:** Both servers can run simultaneously:
- Production: `http://localhost:3000`
- SDK Migration: `http://localhost:3001`

---

## 3. Development Workflow

### 3.1 Phase 0-1: Pure Isolation (Weeks 1-2)

**Production:**
- ✅ Continue normal operations
- ✅ Accept bug fixes
- ✅ Deploy as usual

**SDK Environment:**
- 🔨 Implement SDK streaming
- 🔨 Convert tool definitions
- 🔨 Write SDK-specific tests
- ❌ NO production traffic

**Synchronization:**
```bash
# Daily: Copy bug fixes from prod → SDK
cd super-legal-mcp-sdk
git cherry-pick <commit-from-prod>  # If needed
```

---

### 3.2 Phase 2-3: Shadow Mode (Weeks 3-5)

**Setup Shadow Mode Proxy:**

```javascript
// migration-tools/shadow-mode-proxy.js
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.post('/api/research', async (req, res) => {
  const startTime = Date.now();
  
  // Send to BOTH servers in parallel
  const [prodResponse, sdkResponse] = await Promise.allSettled([
    fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    }),
    fetch('http://localhost:3001/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    })
  ]);
  
  // Return production result (safe)
  const prodData = await prodResponse.value.json();
  res.json(prodData);
  
  // Log comparison (async, doesn't block response)
  setImmediate(async () => {
    try {
      const sdkData = await sdkResponse.value.json();
      const parity = calculateParity(prodData, sdkData);
      
      logComparison({
        request_id: req.body.request_id,
        latency_prod: Date.now() - startTime,
        latency_sdk: sdkResponse.value.headers.get('x-response-time'),
        parity_score: parity,
        prod_tools: prodData.tools_used,
        sdk_tools: sdkData.tools_used,
        diff: parity < 0.95 ? deepDiff(prodData, sdkData) : null
      });
    } catch (error) {
      console.error('Shadow mode comparison error:', error);
    }
  });
});

app.listen(3002, () => {
  console.log('Shadow mode proxy running on port 3002');
});
```

**Usage:**
```bash
# Terminal 1: Production
cd super-legal-mcp-refactored && npm start

# Terminal 2: SDK
cd super-legal-mcp-sdk && npm start

# Terminal 3: Shadow Proxy
node migration-tools/shadow-mode-proxy.js

# Terminal 4: Send test traffic
curl -X POST http://localhost:3002/api/research \
  -H "Content-Type: application/json" \
  -d '{"query": "Find Tesla 10-K from 2023"}'
```

**Benefits:**
- ✅ Real traffic comparison
- ✅ Zero risk to users (always returns prod)
- ✅ Builds confidence in SDK implementation

---

### 3.3 Phase 4-5: Canary Deployment (Weeks 6-8)

**Option 1: Route % Traffic to SDK (LoadBalancer)**

```javascript
// In production environment (if using Option B later)
async function routeRequest(req, res) {
  const canaryPercentage = parseInt(process.env.CANARY_PCT || '0', 10);
  const useSDK = Math.random() * 100 < canaryPercentage;
  
  if (useSDK && process.env.SDK_SERVER_AVAILABLE === 'true') {
    return await forwardToSDK(req, res);  // Port 3001
  } else {
    return await handleLegacy(req, res);  // Current code
  }
}
```

**Option 2: External Canary (Nginx/AWS ALB)**

```nginx
# nginx.conf
upstream production {
    server localhost:3000 weight=95;  # 95% traffic
}

upstream sdk_canary {
    server localhost:3001 weight=5;   # 5% traffic
}

server {
    location /api/ {
        proxy_pass http://production;
        # Canary routing based on header
        if ($http_x_canary = "sdk") {
            proxy_pass http://sdk_canary;
        }
    }
}
```

---

## 4. Cutover Strategy

### 4.1 Gradual Replacement (Week 8+)

Once SDK is proven (parity >98%, latency ≤baseline, 1 week stable):

```bash
# Option 1: Swap directories (instant cutover)
cd /Users/ej/Google\ Grounding/
mv super-legal-mcp-refactored super-legal-mcp-refactored-legacy-backup
mv super-legal-mcp-sdk super-legal-mcp-refactored
# Update PORT=3000 in .env
# Restart service
pm2 restart legal-mcp

# Rollback if needed (5 seconds):
mv super-legal-mcp-refactored super-legal-mcp-sdk
mv super-legal-mcp-refactored-legacy-backup super-legal-mcp-refactored
pm2 restart legal-mcp
```

**OR**

```bash
# Option 2: Merge SDK code into production (with feature flag)
cd super-legal-mcp-refactored
git checkout -b sdk-merge
cp -R ../super-legal-mcp-sdk/src/server/claude-sdk-server.js src/server/
# Update routing logic to use feature flag
git commit -m "feat: merge SDK implementation with feature flag"
git checkout main
git merge sdk-merge

# Rollback: just disable feature flag
export USE_SDK_SERVER=false
pm2 restart legal-mcp
```

### 4.2 Cleanup (Week 10)

After 2 weeks of stable SDK operation:

```bash
# Archive legacy code
cd /Users/ej/Google\ Grounding/
tar -czf super-legal-mcp-refactored-legacy-$(date +%Y%m%d).tar.gz \
    super-legal-mcp-refactored-legacy-backup/

# Move to archive directory
mkdir -p archives/
mv super-legal-mcp-refactored-legacy-*.tar.gz archives/

# Remove legacy backup (ONLY after confirming archive)
rm -rf super-legal-mcp-refactored-legacy-backup/

# Keep migration environment for future reference
mv super-legal-mcp-sdk archives/super-legal-mcp-sdk-reference/
```

---

## 5. Risk Mitigation with Isolation

### 5.1 What Isolation Prevents

| Risk | Without Isolation | With Isolation |
|------|------------------|----------------|
| **Accidental Import** | ❌ SDK code breaks prod | ✅ Separate node_modules |
| **Dependency Conflict** | ❌ SDK deps break legacy | ✅ Separate package.json |
| **Deploy Mistake** | ❌ Deploy SDK to prod | ✅ Different deploy targets |
| **Rollback Complexity** | ❌ Git revert chaos | ✅ Directory swap (5 sec) |
| **Testing Impact** | ❌ Tests break prod CI | ✅ Separate test suites |
| **Port Conflicts** | ❌ Can't run both | ✅ 3000 vs 3001 |

### 5.2 Critical Protection: .gitignore

```bash
# super-legal-mcp-sdk/.gitignore
node_modules/
.env.sdk
*.log
.DS_Store

# Don't ignore:
# src/  (we want SDK code tracked)
# test/ (we want SDK tests tracked)
# package.json (we want SDK deps tracked)
```

### 5.3 Monitoring Separation

```javascript
// Production metrics (port 3000)
const prodMetrics = {
  namespace: 'legal-mcp.production',
  tags: { environment: 'production', version: 'v2.0' }
};

// SDK metrics (port 3001)
const sdkMetrics = {
  namespace: 'legal-mcp.sdk-migration',
  tags: { environment: 'sdk-migration', version: 'v3.0-beta' }
};
```

**Dashboard:** Create separate Grafana dashboards:
- Production: `legal-mcp-production`
- SDK Migration: `legal-mcp-sdk-migration`
- Comparison: `legal-mcp-parity-comparison`

---

## 6. Synchronization Strategy

### 6.1 Bug Fixes During Migration

**Scenario:** Critical bug found in production during SDK migration

**Process:**

```bash
# 1. Fix in production first
cd super-legal-mcp-refactored
git checkout -b hotfix/critical-bug
# ... make fix ...
git commit -m "fix: critical bug in EPA client"
git push
# Deploy to production

# 2. Apply same fix to SDK environment
cd ../super-legal-mcp-sdk
git cherry-pick <commit-hash>
# Or manually apply if conflicts
git commit -m "fix: cherry-pick critical bug fix from production"

# 3. Test SDK with fix
npm test
```

**Automation:**

```bash
# migration-tools/sync-bug-fixes.sh
#!/bin/bash

PROD_DIR="../super-legal-mcp-refactored"
SDK_DIR="../super-legal-mcp-sdk"

# Get commits from prod since last sync
cd $PROD_DIR
LAST_SYNC=$(cat .last-sync-commit 2>/dev/null || echo "HEAD~10")
COMMITS=$(git log --oneline $LAST_SYNC..HEAD | grep "^fix:")

# Cherry-pick fix commits to SDK
cd $SDK_DIR
for commit in $COMMITS; do
  HASH=$(echo $commit | cut -d' ' -f1)
  echo "Syncing fix: $commit"
  git cherry-pick $HASH || {
    echo "Conflict on $HASH - manual resolution required"
    exit 1
  }
done

# Update sync marker
cd $PROD_DIR
git rev-parse HEAD > .last-sync-commit
```

### 6.2 Dependency Updates

**Strategy:** Keep dependencies in sync (security patches)

```bash
# Update production
cd super-legal-mcp-refactored
npm update express cors dotenv
npm audit fix

# Mirror to SDK
cd ../super-legal-mcp-sdk
npm update express cors dotenv
npm audit fix

# Test both
cd ../super-legal-mcp-refactored && npm test
cd ../super-legal-mcp-sdk && npm test
```

---

## 7. Cost-Benefit of Isolation

### 7.1 Costs

| Cost | Amount | One-Time / Recurring |
|------|--------|---------------------|
| **Disk Space** | 500MB | One-time |
| **Developer Context Switching** | 2 hours/week | Recurring (8 weeks) |
| **Sync Overhead** | 1 hour/week | Recurring (8 weeks) |
| **Total** | ~$3,000 | (20 hours × $150/hr) |

### 7.2 Benefits

| Benefit | Value | Risk Reduction |
|---------|-------|----------------|
| **Prevent Production Outage** | $50,000 | 90% → 5% |
| **Faster Rollback** | 5 sec vs 30 min | 100% |
| **Parallel Development** | +30% velocity | N/A |
| **Shadow Mode Testing** | Confidence++ | 85% → 95% |
| **Total Value** | **$50,000+** | **Risk ÷ 18** |

**ROI:** $50,000 / $3,000 = **16.7x return**

---

## 8. Decision Matrix

| Factor | Isolated Env | Monorepo | Branch |
|--------|-------------|----------|--------|
| **Production Safety** | ✅✅✅ | ✅✅ | ✅ |
| **Side-by-Side Testing** | ✅✅✅ | ✅✅ | ❌ |
| **Rollback Speed** | ✅✅✅ | ✅✅ | ❌ |
| **Code Duplication** | ❌ | ✅✅ | ✅✅✅ |
| **Sync Complexity** | ⚠️ | ✅✅ | ✅✅✅ |
| **Deploy Separation** | ✅✅✅ | ✅ | ❌ |
| **Overall Score** | **9/10** | **7/10** | **3/10** |

---

## 9. FINAL RECOMMENDATION

### ✅ Create Isolated Environment (Option A)

**Immediate Action:**

```bash
# 1. Create isolated environment
cd /Users/ej/Google\ Grounding/
cp -R super-legal-mcp-refactored super-legal-mcp-sdk

# 2. Update configuration
cd super-legal-mcp-sdk
echo "PORT=3001" >> .env
echo "ENVIRONMENT=sdk-migration" >> .env

# 3. Install SDK dependencies
npm install @anthropic-ai/sdk zod

# 4. Start development
npm run dev
```

**Why This is Critical:**

1. **Zero Risk to Production** - Complete isolation
2. **Shadow Mode Capability** - Run both simultaneously for comparison
3. **Instant Rollback** - Directory swap takes 5 seconds
4. **Independent Deployment** - No feature flag complexity
5. **Peace of Mind** - Sleep well knowing prod is untouched

**Timeline:**
- **Setup:** 1 hour (copy + configure)
- **Development:** 6-8 weeks (as planned)
- **Cutover:** 5 seconds (directory swap)
- **Cleanup:** Week 10 (archive legacy)

---

## 10. Setup Checklist

- [ ] Copy production directory to `super-legal-mcp-sdk`
- [ ] Update `package.json` with SDK dependencies
- [ ] Create `.env.sdk` with `PORT=3001`
- [ ] Install dependencies (`npm install`)
- [ ] Verify both servers can run simultaneously
- [ ] Set up shadow mode proxy (`migration-tools/shadow-mode-proxy.js`)
- [ ] Create separate monitoring dashboards
- [ ] Document rollback procedure
- [ ] Test directory swap on staging environment
- [ ] Add sync script for bug fixes (`migration-tools/sync-bug-fixes.sh`)

---

**Conclusion:** The $3,000 cost of isolation prevents a potential $50,000 production outage. This is a **no-brainer investment** for a migration of this complexity.
