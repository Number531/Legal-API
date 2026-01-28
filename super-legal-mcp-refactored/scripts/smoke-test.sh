#!/bin/bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"

echo "=== Health Check ==="
curl -s "${BASE_URL}/health" | jq .

echo ""
echo "=== Feature Flags (from env) ==="
echo "SDK_TOOL_RUNNER=${SDK_TOOL_RUNNER:-not set}"
echo "CANARY_PCT=${CANARY_PCT:-not set}"
echo "STRUCTURED_OUTPUTS=${STRUCTURED_OUTPUTS:-not set}"
echo "SKILLS_ENABLED=${SKILLS_ENABLED:-not set}"

echo ""
echo "=== Metrics (head) ==="
curl -s "${BASE_URL}/metrics" | head -40

echo ""
echo "=== Skills Dashboard ==="
curl -s "${BASE_URL}/api/skills/dashboard" | jq . || echo "(skills endpoint not available)"

echo ""
echo "=== Research Endpoint Probe ==="
curl -s -X POST "${BASE_URL}/api/research" \
  -H "Content-Type: application/json" \
  -d '{"query":"Find 10-K filings for Tesla in 2023"}' | jq . || echo "(research endpoint error)"

echo ""
echo "=== Smoke tests complete ==="


