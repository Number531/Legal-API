#!/usr/bin/env node

/**
 * Cutover monitor: polls metrics endpoints during Phase 4 and logs JSONL.
 * Usage:
 *   METRICS_URL=http://localhost:3002/metrics \
 *   DOMAINS_URL=http://localhost:3002/metrics/domains \
 *   INTERVAL_SEC=300 \
 *   node scripts/cutover-monitor.js
 */

import fs from 'fs';

const METRICS_URL = process.env.METRICS_URL || 'http://localhost:3002/metrics';
const DOMAINS_URL = process.env.DOMAINS_URL || 'http://localhost:3002/metrics/domains';
const INTERVAL_SEC = Number(process.env.INTERVAL_SEC || 300); // default 5 minutes
const OUT_PATH = process.env.OUT_PATH || 'cutover-metrics.jsonl';

function logLine(payload) {
  const line = JSON.stringify(payload);
  fs.appendFileSync(OUT_PATH, `${line}\n`, 'utf8');
}

async function pollOnce() {
  const timestamp = new Date().toISOString();
  try {
    const [metricsRes, domainRes] = await Promise.all([
      fetch(METRICS_URL),
      fetch(DOMAINS_URL)
    ]);

    const metrics = await metricsRes.json();
    const domains = await domainRes.json();

    logLine({ timestamp, metrics, domains });

    const parity = metrics?.avg_parity ?? 0;
    const errorRate = metrics?.sdk_failures || 0;
    if (parity < 0.95 || errorRate > (metrics?.legacy_failures || 0) * 2) {
      console.warn(`⚠️ Parity=${parity} error_rate=${errorRate} (see ${OUT_PATH})`);
    }
  } catch (error) {
    logLine({ timestamp, error: error?.message || String(error) });
    console.error('❌ Cutover monitor error:', error?.message || error);
  }
}

async function main() {
  console.log(`📡 Cutover monitor started. Polling every ${INTERVAL_SEC}s`);
  await pollOnce();
  setInterval(pollOnce, INTERVAL_SEC * 1000);
}

main().catch((err) => {
  console.error('Fatal monitor error:', err);
  process.exit(1);
});

