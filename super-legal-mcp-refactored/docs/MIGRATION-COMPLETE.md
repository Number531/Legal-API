# Migration Complete Checklist (Section 17)

Final verification of Claude Agent SDK migration. All deliverables mapped to files and status.

## 17.1 Code Deliverables
- [x] SDK Tool Runner integration — `src/server/claude-sdk-server.js`
- [x] Streaming event handler — `src/utils/sdkStreamHandler.js`
- [x] Structured output wrapper — `src/utils/structuredOutputValidator.js`
- [x] Skills configuration — `src/utils/skillsRequestBuilder.js`, `src/skills/*`
- [x] MCP connector setup — `src/mcp/mcpConnector.js`
- [x] Feature flag configuration — `src/config/featureFlags.js`
- [x] Tool definition migration — `src/utils/sdkToolAdapter.js`, `src/tools/toolDefinitions.js`
- [x] Parameter capping middleware — `src/utils/createToolWithCaps.js`
- [x] Error handling wrappers — `src/utils/sdkErrorTaxonomy.js`
- [x] Rate limiter and circuit breaker — `src/utils/rateLimiter.js`, `src/utils/circuitBreaker.js`
- [x] Prompt caching utilities — `src/utils/promptCaching.js`

## 17.2 Observability Deliverables
- [x] Metrics collection (Prometheus) — `src/utils/sdkMetrics.js`
- [x] Structured logging JSON shape — `src/utils/sdkLogger.js`
- [x] Distributed tracing — `src/utils/sdkTracing.js`
- [x] Grafana dashboards — `grafana/claude-sdk-dashboard.json`
- [x] Alerting rules — `prometheus/alerts.yml`
- [x] Log aggregation config — `src/config/logAggregation.js`, `docs/LOG-AGGREGATION.md`

## 17.3 Documentation Deliverables
- [x] Migration runbook — `docs/SDK-MIGRATION-RUNBOOK.md`
- [x] API client migration guide — `docs/API-CLIENT-SDK-GUIDE.md`
- [x] Rollback procedures — `docs/ROLLBACK-PROCEDURES.md`
- [x] Incident response playbook — `docs/INCIDENT-RESPONSE.md`
- [x] Model selection guide — `docs/MODEL-SELECTION.md`
- [x] Tool permission reference — `docs/TOOL-PERMISSIONS.md`
- [x] Beta header usage guide — `docs/BETA-HEADERS.md`
- [x] Cost optimization guide — `docs/COST-OPTIMIZATION.md`
- [x] Final migration summary — `docs/MIGRATION-COMPLETE.md`

## 17.4 Testing Deliverables
- [x] Golden prompt suite — `test/parity/golden-prompts.test.js`
- [x] Structured output validation tests — `test/sdk/structured-outputs.test.js`
- [x] Load and latency tests — `test/sdk/load-latency.test.js`
- [x] Failure injection tests — `test/sdk/failure-injection.test.js`
- [x] Security tests — `test/sdk/safety.test.js`
- [x] Parity gates — `test/parity/parity-report.test.js`
- [x] Prompt caching tests — `test/sdk/prompt-caching.test.js`
- [x] MCP connector tests — `test/sdk/mcp-connector.test.js`

## 17.5 Deployment Deliverables
- [x] Canary configuration — `src/config/canaryConfig.js`
- [x] Feature flag rollout plan — `docs/ROLLOUT-PLAN.md`
- [x] Rollback automation — `scripts/rollback.sh`
- [x] Health checks — `src/server/claude-sdk-server.js` (`/health`)
- [x] Smoke tests — `scripts/smoke-test.sh`
- [x] Cutover verification — `scripts/cutover-verify.sh`

## Sign-off Criteria
- Parity: ≥98% structural match on golden prompts
- Latency: No P95 regression vs legacy
- Structured outputs: ≥98% valid for enabled tools
- Circuit breaker: No increase in trips
- Security: Prompt injection, secrets masking, and tool allowlists enforced
- Observability: Metrics, logs, traces, dashboards, alerts verified in target environment

## Post-Migration Monitoring
- Watch `claude_request_duration_ms`, `claude_tool_invocations_total`, `claude_cache_read_tokens_total`, `claude_cache_creation_tokens_total`
- Alert on error rate, latency regression, structured output failures, circuit breaker trips
- Review skills quota breaches and tool error patterns weekly for the first month

