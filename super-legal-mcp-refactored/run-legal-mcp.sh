#!/usr/bin/env bash
set -euo pipefail

# Wrapper to launch the MCP server with environment loaded and stable pathing.
# Designed for use with OpenAI GPT-5 Responses MCP server_url=stdio://bash?args=...

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env if present
if [[ -f "$BASE_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$BASE_DIR/.env"
  set +a
fi

# Helpful warnings for missing downstream API keys (server degrades gracefully)
warn() { echo "[$(date +%T)] WARN: $*" >&2; }
[[ -z "${COURTLISTENER_API_TOKEN:-}" ]] && warn "COURTLISTENER_API_TOKEN not set; some CourtListener features may be limited."
[[ -z "${USPTO_API_KEY:-}" ]] && warn "USPTO_API_KEY not set; USPTO tools may fail."
[[ -z "${GOVINFO_API_KEY:-}" ]] && warn "GOVINFO_API_KEY not set; USC tools may fail."
[[ -z "${EXA_API_KEY:-}" ]] && warn "EXA_API_KEY not set; state statute search may fail."

exec node "$BASE_DIR/index.js"


