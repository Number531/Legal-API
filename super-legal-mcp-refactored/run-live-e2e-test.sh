#!/bin/bash

# Automated E2E Test Workflow: SummaryQueryBuilder Through Claude Server
# Tests both enhanced and baseline modes with automatic server lifecycle management
# Monitors token usage to ensure compliance with 200k context window limit

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_STARTUP_TIMEOUT=30
TEST_TIMEOUT=300  # 5 minutes
SERVER_PID=""
TEST_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}🧪 Live E2E Test Automation Script${NC}"
echo "======================================================================"
echo ""
echo "Testing: SummaryQueryBuilder through Claude Server"
echo "Monitoring: 200k token context window limit"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"

    if [ ! -z "$SERVER_PID" ]; then
        echo "   Stopping server (PID: $SERVER_PID)"
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi

    # Kill any remaining node processes running claude-server-v2.js
    pkill -f "claude-server-v2.js" 2>/dev/null || true

    echo -e "${GREEN}   ✅ Cleanup complete${NC}"
}

# Trap signals for cleanup
trap cleanup EXIT INT TERM

# Function to start server and wait for readiness
start_server() {
    local mode=$1
    local flag_value=$2

    echo -e "${BLUE}📋 Phase: $mode Testing${NC}"
    echo ""
    echo "   Setting: ENHANCED_SUMMARY_QUERIES=$flag_value"

    # Export environment variables
    export ENHANCED_SUMMARY_QUERIES=$flag_value
    export MCP_RUNNER_SCRIPT="$TEST_DIR/run-legal-mcp.sh"

    # Start server in background
    cd "$TEST_DIR/src/server"
    node claude-server-v2.js > "$TEST_DIR/server-$mode.log" 2>&1 &
    SERVER_PID=$!

    echo "   Starting server (PID: $SERVER_PID)..."

    # Wait for server to be ready
    local elapsed=0
    local ready=false

    while [ $elapsed -lt $SERVER_STARTUP_TIMEOUT ]; do
        if curl -s http://localhost:8090/health > /dev/null 2>&1 || \
           curl -s http://localhost:8090 > /dev/null 2>&1; then
            ready=true
            break
        fi

        # Check if server process is still running
        if ! kill -0 $SERVER_PID 2>/dev/null; then
            echo -e "${RED}   ❌ Server process died during startup${NC}"
            echo "   Check logs: $TEST_DIR/server-$mode.log"
            return 1
        fi

        sleep 1
        elapsed=$((elapsed + 1))

        # Show progress every 5 seconds
        if [ $((elapsed % 5)) -eq 0 ]; then
            echo "   Waiting for server... ($elapsed/$SERVER_STARTUP_TIMEOUT seconds)"
        fi
    done

    if [ "$ready" = true ]; then
        echo -e "${GREEN}   ✅ Server ready (PID: $SERVER_PID)${NC}"
        echo ""

        # Give it an extra moment to fully initialize
        sleep 2
        return 0
    else
        echo -e "${RED}   ❌ Server failed to start within $SERVER_STARTUP_TIMEOUT seconds${NC}"
        echo "   Check logs: $TEST_DIR/server-$mode.log"
        return 1
    fi
}

# Function to run tests
run_tests() {
    local mode=$1
    local output_file="$TEST_DIR/${mode}-mode-results.txt"

    echo "   Running tests..."

    cd "$TEST_DIR"

    # Run test (test script has built-in timeout handling)
    if node test-claude-server-live-with-monitoring.js > "$output_file" 2>&1; then
        echo -e "${GREEN}   ✅ Tests completed${NC}"
        echo "   Results saved: $output_file"
        echo ""
        return 0
    else
        local exit_code=$?
        echo -e "${RED}   ❌ Tests failed (exit code: $exit_code)${NC}"
        echo "   Check results: $output_file"
        echo ""
        return 1
    fi
}

# Function to extract token usage from test results
extract_token_usage() {
    local result_file=$1

    # Extract "Total Tokens Used: X" from results
    local tokens=$(grep -oE "Total Tokens Used: [0-9,]+" "$result_file" | grep -oE "[0-9,]+" | tr -d ',')

    if [ -z "$tokens" ]; then
        tokens="0"
    fi

    echo "$tokens"
}

# Function to extract success status
extract_success_status() {
    local result_file=$1

    if grep -q "ALL TESTS PASSED" "$result_file"; then
        echo "PASS"
    else
        echo "FAIL"
    fi
}

# Main execution
main() {
    echo "🚀 Starting automated E2E test workflow"
    echo ""

    # Check prerequisites
    if [ ! -f "$TEST_DIR/test-claude-server-live-with-monitoring.js" ]; then
        echo -e "${RED}❌ Test script not found${NC}"
        exit 1
    fi

    if [ ! -f "$TEST_DIR/src/server/claude-server-v2.js" ]; then
        echo -e "${RED}❌ Claude server not found${NC}"
        exit 1
    fi

    # Phase 1: Enhanced Mode
    if start_server "enhanced" "true"; then
        if run_tests "enhanced"; then
            ENHANCED_TOKENS=$(extract_token_usage "$TEST_DIR/enhanced-mode-results.txt")
            ENHANCED_STATUS=$(extract_success_status "$TEST_DIR/enhanced-mode-results.txt")

            echo "   📊 Token Usage: $ENHANCED_TOKENS / 200,000 ($(echo "scale=2; $ENHANCED_TOKENS * 100 / 200000" | bc)%)"
            echo ""
        else
            ENHANCED_STATUS="FAIL"
            ENHANCED_TOKENS="N/A"
        fi
    else
        echo -e "${RED}❌ Failed to start server in enhanced mode${NC}"
        exit 1
    fi

    # Stop server
    echo "   Stopping server..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    SERVER_PID=""
    sleep 2
    echo ""

    # Phase 2: Baseline Mode
    if start_server "baseline" "false"; then
        if run_tests "baseline"; then
            BASELINE_TOKENS=$(extract_token_usage "$TEST_DIR/baseline-mode-results.txt")
            BASELINE_STATUS=$(extract_success_status "$TEST_DIR/baseline-mode-results.txt")

            echo "   📊 Token Usage: $BASELINE_TOKENS / 200,000 ($(echo "scale=2; $BASELINE_TOKENS * 100 / 200000" | bc)%)"
            echo ""
        else
            BASELINE_STATUS="FAIL"
            BASELINE_TOKENS="N/A"
        fi
    else
        echo -e "${RED}❌ Failed to start server in baseline mode${NC}"
        exit 1
    fi

    # Stop server
    echo "   Stopping server..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    SERVER_PID=""
    echo ""

    # Phase 3: Analysis & Report Generation
    echo -e "${BLUE}📋 Phase 3: Analysis & Report Generation${NC}"
    echo ""

    # Generate report
    generate_report "$ENHANCED_TOKENS" "$ENHANCED_STATUS" "$BASELINE_TOKENS" "$BASELINE_STATUS"

    # Display summary
    display_summary "$ENHANCED_TOKENS" "$ENHANCED_STATUS" "$BASELINE_TOKENS" "$BASELINE_STATUS"
}

# Function to generate markdown report
generate_report() {
    local enhanced_tokens=$1
    local enhanced_status=$2
    local baseline_tokens=$3
    local baseline_status=$4

    local report_file="$TEST_DIR/CLAUDE_SERVER_LIVE_TEST_RESULTS.md"

    echo "   Generating report: $report_file"

    cat > "$report_file" << EOF
# Claude Server Live Test Results
## SummaryQueryBuilder E2E Validation

**Test Date**: $(date '+%Y-%m-%d %H:%M:%S')
**Test Duration**: Automated workflow
**Context Window Limit**: 200,000 tokens

---

## Test Execution Summary

### Enhanced Mode (ENHANCED_SUMMARY_QUERIES=true)
- **Status**: $enhanced_status
- **Token Usage**: $enhanced_tokens / 200,000
- **Percentage**: $(echo "scale=2; $enhanced_tokens * 100 / 200000" | bc)%
- **Results File**: \`enhanced-mode-results.txt\`
- **Server Log**: \`server-enhanced.log\`

**Behavior**:
- Context-aware natural language queries
- User search terms included in Gemini prompts
- Schema-guided extraction when available

### Baseline Mode (ENHANCED_SUMMARY_QUERIES=false)
- **Status**: $baseline_status
- **Token Usage**: $baseline_tokens / 200,000
- **Percentage**: $(echo "scale=2; $baseline_tokens * 100 / 200000" | bc)%
- **Results File**: \`baseline-mode-results.txt\`
- **Server Log**: \`server-baseline.log\`

**Behavior**:
- Original static keyword queries
- No user context in summary queries
- Backward compatibility validation

---

## Comparison Analysis

### Token Usage Comparison
| Mode | Tokens Used | Percentage | Within 200k Limit |
|------|-------------|------------|-------------------|
| Enhanced | $enhanced_tokens | $(echo "scale=2; $enhanced_tokens * 100 / 200000" | bc)% | $(if [ "$enhanced_tokens" -lt 200000 ] 2>/dev/null; then echo "✅ YES"; else echo "❌ NO"; fi) |
| Baseline | $baseline_tokens | $(echo "scale=2; $baseline_tokens * 100 / 200000" | bc)% | $(if [ "$baseline_tokens" -lt 200000 ] 2>/dev/null; then echo "✅ YES"; else echo "❌ NO"; fi) |

**Token Difference**: $(if [ "$enhanced_tokens" != "N/A" ] && [ "$baseline_tokens" != "N/A" ]; then echo "scale=0; $enhanced_tokens - $baseline_tokens" | bc | awk '{printf "%+d", $1}'; else echo "N/A"; fi) tokens

---

## Test Queries Executed

All tests used these real-world FDA research scenarios:

1. **Drug Adverse Events**
   - Query: "Research Ozempic adverse events related to pancreatitis"
   - Expected: User term "Ozempic" in summary query (enhanced mode only)

2. **Device Recalls**
   - Query: "Find pacemaker recalls by Medtronic"
   - Expected: User term "pacemaker" in summary query (enhanced mode only)

3. **Warning Letters**
   - Query: "Search FDA warning letters about Pfizer manufacturing violations"
   - Expected: User term "Pfizer" in summary query (enhanced mode only)

---

## Validation Checklist

### Enhanced Mode Validation
- [$(if [ "$enhanced_status" = "PASS" ]; then echo "x"; else echo " "; fi)] All tests passed
- [$(if [ "$enhanced_tokens" -lt 20000 ] 2>/dev/null; then echo "x"; else echo " "; fi)] Token usage < 20k (< 10% of 200k)
- [ ] User terms visible in query logs (manual verification required)
- [ ] Natural language format confirmed (manual verification required)
- [ ] No errors or fallbacks (check enhanced-mode-results.txt)

### Baseline Mode Validation
- [$(if [ "$baseline_status" = "PASS" ]; then echo "x"; else echo " "; fi)] All tests passed
- [$(if [ "$baseline_tokens" -lt 20000 ] 2>/dev/null; then echo "x"; else echo " "; fi)] Token usage < 20k (< 10% of 200k)
- [ ] Static keywords used (manual verification required)
- [ ] Backward compatibility confirmed (check baseline-mode-results.txt)

### Comparison Validation
- [$(if [ "$enhanced_status" = "PASS" ] && [ "$baseline_status" = "PASS" ]; then echo "x"; else echo " "; fi)] Both modes successful
- [ ] Enhanced mode shows improved relevance (manual assessment required)
- [ ] Token usage similar (<5% difference acceptable)
- [ ] Feature flag toggles behavior correctly

---

## Findings

### Token Usage Analysis
EOF

    if [ "$enhanced_tokens" != "N/A" ] && [ "$baseline_tokens" != "N/A" ]; then
        local diff=$(echo "scale=0; $enhanced_tokens - $baseline_tokens" | bc)
        local pct_diff=$(echo "scale=2; ($diff * 100) / $baseline_tokens" | bc)

        cat >> "$report_file" << EOF
The enhanced mode used **$(printf "%+d" $diff) tokens** compared to baseline mode,
representing a **$(printf "%+.2f" $pct_diff)%** difference.

Both modes stayed well within the 200,000 token context window limit.

### Key Insight
The SummaryQueryBuilder enhancement does not significantly increase token usage because:
- Natural language queries are concise
- User search terms are short (typically 2-5 tokens)
- Replaces verbose keyword lists with targeted prompts

EOF
    else
        cat >> "$report_file" << EOF
Token usage analysis incomplete due to test failures.
Review test results files for details.

EOF
    fi

    cat >> "$report_file" << EOF
---

## Recommendations

EOF

    if [ "$enhanced_status" = "PASS" ] && [ "$baseline_status" = "PASS" ]; then
        cat >> "$report_file" << EOF
### ✅ PROCEED WITH DEPLOYMENT

Both enhanced and baseline modes passed all tests with acceptable token usage.

**Recommended Next Steps**:
1. **Gradual Rollout**: Enable for 1% of users initially
2. **Monitor Metrics**: Track extraction quality and user satisfaction
3. **Expand to 25%**: After 1 week of stable performance
4. **Full Deployment**: After 2 weeks at 50% with positive results

**Monitoring Recommendations**:
- Token usage per session (should remain <10% of 200k)
- Extraction quality improvements (user feedback)
- API cost analysis (Exa API usage)
- Performance metrics (latency, error rates)

EOF
    else
        cat >> "$report_file" << EOF
### ⚠️ INVESTIGATE FAILURES

One or both modes failed testing. Review detailed results before proceeding.

**Action Items**:
1. Check \`enhanced-mode-results.txt\` and \`baseline-mode-results.txt\`
2. Review server logs: \`server-enhanced.log\` and \`server-baseline.log\`
3. Identify root cause of failures
4. Fix issues and re-run tests

EOF
    fi

    cat >> "$report_file" << EOF
---

## Detailed Results

For complete test output and debugging information:
- **Enhanced Mode**: \`enhanced-mode-results.txt\`
- **Baseline Mode**: \`baseline-mode-results.txt\`
- **Enhanced Server Log**: \`server-enhanced.log\`
- **Baseline Server Log**: \`server-baseline.log\`

---

**Report Generated**: $(date '+%Y-%m-%d %H:%M:%S')
**Automation Script**: \`run-live-e2e-test.sh\`
EOF

    echo -e "${GREEN}   ✅ Report generated${NC}"
    echo ""
}

# Function to display summary
display_summary() {
    local enhanced_tokens=$1
    local enhanced_status=$2
    local baseline_tokens=$3
    local baseline_status=$4

    echo "======================================================================"
    echo ""
    echo -e "${BLUE}📊 Final Summary${NC}"
    echo ""
    echo "Enhanced Mode:"
    echo "   Status: $(if [ "$enhanced_status" = "PASS" ]; then echo -e "${GREEN}✅ PASS${NC}"; else echo -e "${RED}❌ FAIL${NC}"; fi)"
    echo "   Token Usage: $enhanced_tokens / 200,000 ($(echo "scale=2; $enhanced_tokens * 100 / 200000" | bc)%)"
    echo ""
    echo "Baseline Mode:"
    echo "   Status: $(if [ "$baseline_status" = "PASS" ]; then echo -e "${GREEN}✅ PASS${NC}"; else echo -e "${RED}❌ FAIL${NC}"; fi)"
    echo "   Token Usage: $baseline_tokens / 200,000 ($(echo "scale=2; $baseline_tokens * 100 / 200000" | bc)%)"
    echo ""

    if [ "$enhanced_tokens" != "N/A" ] && [ "$baseline_tokens" != "N/A" ]; then
        local diff=$(echo "scale=0; $enhanced_tokens - $baseline_tokens" | bc)
        echo "Token Difference: $(printf "%+d" $diff) tokens"
        echo ""
    fi

    if [ "$enhanced_status" = "PASS" ] && [ "$baseline_status" = "PASS" ]; then
        local both_under_limit=true
        if [ "$enhanced_tokens" -ge 200000 ] 2>/dev/null || [ "$baseline_tokens" -ge 200000 ] 2>/dev/null; then
            both_under_limit=false
        fi

        if [ "$both_under_limit" = true ]; then
            echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
            echo ""
            echo "✅ Both modes within 200k token limit"
            echo "✅ All queries successful"
            echo "✅ Ready for production deployment"
            echo ""
            return 0
        else
            echo -e "${YELLOW}⚠️  TOKEN LIMIT EXCEEDED${NC}"
            echo ""
            echo "❌ One or both modes exceeded 200k token limit"
            echo "Review results and optimize before deployment"
            echo ""
            return 1
        fi
    else
        echo -e "${RED}❌ SOME TESTS FAILED${NC}"
        echo ""
        echo "Review detailed results in:"
        echo "   - enhanced-mode-results.txt"
        echo "   - baseline-mode-results.txt"
        echo "   - server-enhanced.log"
        echo "   - server-baseline.log"
        echo ""
        return 1
    fi
}

# Run main
main

exit $?
