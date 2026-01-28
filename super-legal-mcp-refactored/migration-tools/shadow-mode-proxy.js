/**
 * Shadow Mode Proxy (Phase 0)
 * Sends requests to both legacy and SDK servers in parallel, returns legacy response,
 * logs parity/latency metrics to JSONL for analysis. Safe for zero user impact.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env for proxy defaults (non-fatal if missing)
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(express.json({ limit: '25mb' }));

const LEGACY_URL = process.env.LEGACY_URL || 'http://localhost:3000/api/research';
const SDK_URL = process.env.SDK_URL || 'http://localhost:3001/api/research';
const PROXY_PORT = process.env.PROXY_PORT || 3002;
const LOG_PATH = path.join(__dirname, 'shadow-mode-log.jsonl');
const LOG_SAMPLE_PCT = Number(process.env.SHADOW_LOG_SAMPLE_PCT || 0); // 0-1

const metrics = {
  total_requests: 0,
  legacy_failures: 0,
  sdk_failures: 0,
  parity_scores: [],
  latency_deltas_ms: [],
  domain_parity: {
    sec: [],
    epa: [],
    fda: [],
    govinfo: [],
    court: [],
    other: []
  }
};

const DOMAIN_BY_TOOL = {
  // SEC
  search_sec_filings: 'sec',
  get_sec_company_facts: 'sec',
  get_sec_xbrl_frames: 'sec',
  search_sec_company_tickers: 'sec',
  // EPA
  search_epa_facilities: 'epa',
  search_epa_violations: 'epa',
  get_epa_facility_compliance_report: 'epa',
  // FDA
  search_fda_device_events: 'fda',
  search_fda_recalls: 'fda',
  search_fda_drug_labels: 'fda',
  // GovInfo
  search_federal_register: 'govinfo',
  search_federal_register_notices: 'govinfo',
  search_federal_register_proposed_rules: 'govinfo',
  search_federal_register_final_rules: 'govinfo',
  search_us_code: 'govinfo',
  // Court
  search_cases: 'court',
  search_opinions: 'court',
  lookup_citation: 'court'
};

function getDomainFromRequest(body = {}) {
  const tool = body.tool || body.tool_name || body.schema_tool;
  if (tool && DOMAIN_BY_TOOL[tool]) return DOMAIN_BY_TOOL[tool];
  return 'other';
}

function safeJsonlWrite(entry) {
  try {
    fs.appendFileSync(LOG_PATH, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (err) {
    console.warn('⚠️ Failed to write shadow log:', err?.message || err);
  }
}

function maybeSamplePayload(label, payload) {
  if (!LOG_SAMPLE_PCT || LOG_SAMPLE_PCT <= 0) return;
  if (Math.random() > LOG_SAMPLE_PCT) return;
  const json = JSON.stringify(payload);
  const truncated = json.length > 4000 ? `${json.slice(0, 4000)}...<truncated>` : json;
  safeJsonlWrite({
    timestamp: new Date().toISOString(),
    sample: label,
    data: truncated
  });
}

function calculateParity(a, b) {
  try {
    const normalize = (obj) => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      const copy = { ...obj };
      delete copy.timestamp;
      delete copy.request_id;
      delete copy.response_time;
      return copy;
    };
    const aStr = JSON.stringify(normalize(a));
    const bStr = JSON.stringify(normalize(b));
    if (aStr === bStr) return 1.0;
    const maxLen = Math.max(aStr.length, bStr.length);
    const minLen = Math.min(aStr.length, bStr.length);
    return maxLen === 0 ? 1.0 : minLen / maxLen;
  } catch {
    return 0;
  }
}

app.post('/api/research', async (req, res) => {
  metrics.total_requests += 1;
  const requestId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
  const start = Date.now();
  const domain = getDomainFromRequest(req.body || {});

  const payload = JSON.stringify(req.body || {});
  const headers = { 'Content-Type': 'application/json' };

  // Dispatch in parallel
  const [legacyResult, sdkResult] = await Promise.allSettled([
    fetch(LEGACY_URL, { method: 'POST', headers, body: payload }),
    fetch(SDK_URL, { method: 'POST', headers, body: payload })
  ]);

  // Handle legacy response for user
  if (legacyResult.status !== 'fulfilled' || !legacyResult.value.ok) {
    metrics.legacy_failures += 1;
    const status = legacyResult.status === 'fulfilled' ? legacyResult.value.status : 502;
    const message = legacyResult.status === 'fulfilled'
      ? `Legacy server error: ${legacyResult.value.statusText}`
      : `Legacy request failed: ${legacyResult.reason}`;
    res.status(status || 502).json({ error: message });
  } else {
    const legacyData = await legacyResult.value.json().catch(() => ({}));
    maybeSamplePayload('legacy_response', legacyData);
    res.json(legacyData);

    // Compare with SDK async
    setImmediate(async () => {
      try {
        if (sdkResult.status !== 'fulfilled' || !sdkResult.value.ok) {
          metrics.sdk_failures += 1;
          return;
        }
        const sdkData = await sdkResult.value.json().catch(() => ({}));
        maybeSamplePayload('sdk_response', sdkData);
        const parity = calculateParity(legacyData, sdkData);
        const latencyDelta = Date.now() - start;
        metrics.parity_scores.push(parity);
        metrics.latency_deltas_ms.push(latencyDelta);
        if (domain && metrics.domain_parity[domain]) {
          metrics.domain_parity[domain].push(parity);
        }

        safeJsonlWrite({
          timestamp: new Date().toISOString(),
          request_id: requestId,
          parity,
          latency_ms: latencyDelta,
          legacy_status: legacyResult.value.status,
          sdk_status: sdkResult.value.status
        });
      } catch (err) {
        safeJsonlWrite({
          timestamp: new Date().toISOString(),
          request_id: requestId,
          error: err?.message || String(err)
        });
      }
    });
  }
});

app.get('/metrics', (req, res) => {
  const avgParity = metrics.parity_scores.length
    ? metrics.parity_scores.reduce((a, b) => a + b, 0) / metrics.parity_scores.length
    : 0;
  const avgLatency = metrics.latency_deltas_ms.length
    ? metrics.latency_deltas_ms.reduce((a, b) => a + b, 0) / metrics.latency_deltas_ms.length
    : 0;

  res.json({
    total_requests: metrics.total_requests,
    legacy_failures: metrics.legacy_failures,
    sdk_failures: metrics.sdk_failures,
    avg_parity: Number(avgParity.toFixed(4)),
    avg_latency_ms: Math.round(avgLatency),
    parity_distribution: {
      excellent: metrics.parity_scores.filter((p) => p >= 0.95).length,
      good: metrics.parity_scores.filter((p) => p >= 0.9 && p < 0.95).length,
      poor: metrics.parity_scores.filter((p) => p < 0.9).length
    }
  });
});

app.get('/metrics/domains', (req, res) => {
  const domainMetrics = {};
  for (const [domain, scores] of Object.entries(metrics.domain_parity)) {
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    domainMetrics[domain] = {
      count: scores.length,
      avg_parity: Number(avg.toFixed(4)),
      excellent: scores.filter((p) => p >= 0.95).length,
      good: scores.filter((p) => p >= 0.9 && p < 0.95).length,
      poor: scores.filter((p) => p < 0.9).length
    };
  }
  res.json(domainMetrics);
});

app.listen(PROXY_PORT, () => {
  console.log('🔄 Shadow Mode Proxy Running');
  console.log(`🏭 Legacy: ${LEGACY_URL}`);
  console.log(`🧪 SDK:    ${SDK_URL}`);
  console.log(`📡 Proxy Port: ${PROXY_PORT}`);
  console.log(`📊 Metrics: http://localhost:${PROXY_PORT}/metrics`);
});

