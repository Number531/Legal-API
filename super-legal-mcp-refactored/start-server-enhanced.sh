#!/bin/bash

# Start Claude Server in Enhanced Mode (Enhanced Queries ON)
# This enables context-aware natural language query generation

echo "🚀 Starting Claude Server - Enhanced Mode"
echo "================================================"
echo ""
echo "Feature: ENHANCED_SUMMARY_QUERIES = true"
echo "Behavior: Context-aware natural language queries"
echo "FDA Tools: Include user search terms in Gemini prompts"
echo ""
echo "Benefits:"
echo "  ✅ User intent propagated to Gemini extraction"
echo "  ✅ More relevant extraction results"
echo "  ✅ Natural language format (Exa recommended)"
echo "  ✅ Schema-guided extraction when available"
echo ""

# Set environment variable to enable enhanced queries
export ENHANCED_SUMMARY_QUERIES=true

# Set MCP runner script path (relative to src/server directory)
export MCP_RUNNER_SCRIPT="../../run-legal-mcp.sh"

# Start the server
cd src/server
node claude-server-v2.js
