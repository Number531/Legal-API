#!/bin/bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
SHADOW_METRICS_URL="${SHADOW_METRICS_URL:-http://localhost:3002/metrics}"

echo "=== Cutover Verification ==="
echo "Base URL: ${BASE_URL}"
echo "Shadow metrics: ${SHADOW_METRICS_URL}"
echo ""

fail() {
  echo "FAIL: $1"
  exit 1
}

warn() {
  echo "WARN: $1"
}

check_health() {
  echo "--- Health ---"
  local health
  if ! health=$(curl -s "${BASE_URL}/health"); then
    fail "Health endpoint unreachable"
  fi
  echo "${health}" | jq .
  local status
  status=$(echo "${health}" | jq -r '.status // empty')
  [[ "${status}" == "healthy" || "${status}" == "degraded" ]] || fail "Unexpected health status: ${status}"
}

check_metrics() {
  echo "--- Metrics (Prometheus head) ---"
  if ! curl -s "${BASE_URL}/metrics" | head -20; then
    fail "Metrics endpoint unreachable"
  fi
}

check_parity_gates() {
  echo "--- Parity Gates (shadow proxy) ---"
  if ! command -v jq >/dev/null 2>&1; then
    warn "jq not installed; skipping parity gate checks"
    return
  fi
  local payload
  if ! payload=$(curl -s "${SHADOW_METRICS_URL}"); then
    warn "Shadow metrics unavailable; skip parity checks"
    return
  fi
  local parity avg_latency sdk_failures legacy_failures
  parity=$(echo "${payload}" | jq -r '.avg_parity // 0')
  avg_latency=$(echo "${payload}" | jq -r '.avg_latency_ms // 0')
  sdk_failures=$(echo "${payload}" | jq -r '.sdk_failures // 0')
  legacy_failures=$(echo "${payload}" | jq -r '.legacy_failures // 0')

  echo "avg_parity=${parity} avg_latency_ms=${avg_latency} sdk_failures=${sdk_failures} legacy_failures=${legacy_failures}"

  awk -v p="${parity}" 'BEGIN { if (p < 0.98) exit 1 }' || fail "Parity below 0.98"
  awk -v sf="${sdk_failures}" -v lf="${legacy_failures:-0}" 'BEGIN { if (lf*2 < sf) exit 1 }' || warn "SDK failures exceed baseline"
}

check_golden_prompts() {
  echo "--- Golden Prompts (SEC, EPA, FDA, GovInfo) ---"
  
  echo "[SEC] Find 10-K filings for Tesla in 2023"
  curl -s -X POST "${BASE_URL}/api/research" \
    -H "Content-Type: application/json" \
    -d '{"query":"Find 10-K filings for Tesla in 2023"}' | head -100 || warn "SEC golden prompt failed"
  
  echo ""
  echo "[EPA] Show EPA violations for ExxonMobil facilities in Texas"
  curl -s -X POST "${BASE_URL}/api/research" \
    -H "Content-Type: application/json" \
    -d '{"query":"Show EPA violations for ExxonMobil facilities in Texas"}' | head -100 || warn "EPA golden prompt failed"
  
  echo ""
  echo "[FDA] Search FDA device recalls for pacemakers in 2024"
  curl -s -X POST "${BASE_URL}/api/research" \
    -H "Content-Type: application/json" \
    -d '{"query":"Search FDA device recalls for pacemakers in 2024"}' | head -100 || warn "FDA golden prompt failed"
  
  echo ""
  echo "[GovInfo] Find recent Congressional bills about climate change"
  curl -s -X POST "${BASE_URL}/api/research" \
    -H "Content-Type: application/json" \
    -d '{"query":"Find recent Congressional bills about climate change"}' | head -100 || warn "GovInfo golden prompt failed"
}

check_canary_pct() {
  echo "--- Canary Percentage ---"
  if ! command -v jq >/dev/null 2>&1; then
    warn "jq not installed; skipping canary pct check"
    return
  fi
  local health canary
  health=$(curl -s "${BASE_URL}/health") || fail "Health endpoint unreachable for canary check"
  canary=$(echo "${health}" | jq -r '.feature_flags.CANARY_PCT // empty')
  echo "CANARY_PCT=${canary}"
}

check_health
check_metrics
check_canary_pct
check_parity_gates
check_golden_prompts

echo "=== Cutover verification completed ==="

