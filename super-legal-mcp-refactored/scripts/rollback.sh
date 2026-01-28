#!/bin/bash
set -euo pipefail

# Rollback Script for SDK Migration
# Usage: ./scripts/rollback.sh
# This script sets rollback flags and verifies the system state.

BASE_URL="${BASE_URL:-http://localhost:3001}"

echo "=== SDK Migration Rollback ==="
echo ""

echo "Step 1: Setting rollback flags..."
export SDK_TOOL_RUNNER=false
export CANARY_PCT=0
export STRUCTURED_OUTPUTS=false
echo "  SDK_TOOL_RUNNER=false"
echo "  CANARY_PCT=0"
echo "  STRUCTURED_OUTPUTS=false"

echo ""
echo "Step 2: Verifying health endpoint..."
HEALTH=$(curl -s "${BASE_URL}/health" 2>/dev/null || echo '{"status":"unreachable"}')
echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"

echo ""
echo "Step 3: Checking error metrics..."
curl -s "${BASE_URL}/metrics" 2>/dev/null | grep -E "claude_errors_total|claude_circuit_breaker" | head -10 || echo "(metrics not available)"

echo ""
echo "Step 4: Checking latency metrics..."
curl -s "${BASE_URL}/metrics" 2>/dev/null | grep "claude_request_duration" | head -5 || echo "(latency metrics not available)"

echo ""
echo "=== Rollback Verification Checklist ==="
echo "[ ] Legacy responses being served (check /api/claude/* routes)"
echo "[ ] Error rate stabilizing (watch claude_errors_total)"
echo "[ ] Circuit breaker not tripping (watch claude_circuit_breaker_trips_total)"
echo "[ ] P95 latency within baseline"

echo ""
echo "=== IMPORTANT ==="
echo "Redeploy/restart the service to apply environment variable changes."
echo "Monitor for 15 minutes before confirming rollback success."
echo ""
echo "See docs/ROLLBACK-PROCEDURES.md for full procedure."


