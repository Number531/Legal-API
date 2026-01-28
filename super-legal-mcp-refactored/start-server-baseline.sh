#!/bin/bash

# Start Claude Server in Baseline Mode (Enhanced Queries OFF)
# This preserves the original static keyword query behavior

echo "🚀 Starting Claude Server - Baseline Mode"
echo "================================================"
echo ""
echo "Feature: ENHANCED_SUMMARY_QUERIES = false"
echo "Behavior: Static keyword queries (original)"
echo "FDA Tools: Use generic keyword-based summary queries"
echo ""

# Set environment variable to disable enhanced queries
export ENHANCED_SUMMARY_QUERIES=false

# Set MCP runner script path (relative to src/server directory)
export MCP_RUNNER_SCRIPT="../../run-legal-mcp.sh"

# Start the server
cd src/server
node claude-server-v2.js
