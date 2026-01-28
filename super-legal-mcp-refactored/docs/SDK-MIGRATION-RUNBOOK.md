# SDK Migration Runbook (Phase 8)

## Scope
- SDK architecture: legacy `/api/claude/*` → SDK `/api/research`, `/api/stream`
- Feature flags: `SDK_TOOL_RUNNER`, `CANARY_PCT`, `STRUCTURED_OUTPUTS`, `SKILLS_ENABLED`
- Canary rollout: 5% → 25% → 100% with rollback flag retained
- Metrics/alerts: see `docs/OBSERVABILITY.md`

## Environment & Endpoints
- Health: `/health`
- Research: `/api/research`
- Stream: `/api/stream`
- Metrics: `/metrics`
- Skills dashboard: `/api/skills/dashboard`

## Feature Flag Quick Reference (`src/config/featureFlags.js`)
- `SDK_TOOL_RUNNER` (bool) — route to SDK Tool Runner
- `CANARY_PCT` (0–100) — traffic split
- `STRUCTURED_OUTPUTS` (bool) — enable JSON schema outputs
- `SKILLS_ENABLED` (bool) — managed + custom skills

## Canary Rollout Playbook
1) Set `CANARY_PCT=5` → deploy → observe 1h parity/latency
2) Raise to 25% → observe 4h domain metrics
3) Raise to 100% → observe 24h; keep rollback flag
4) If parity <95% or P95 latency regression >20% → rollback (see `ROLLBACK-PROCEDURES.md`)

## Observability (Phase 6.5)
- Metrics: `docs/OBSERVABILITY.md`, Prometheus `prometheus/alerts.yml`
- Dashboard: `grafana/claude-sdk-dashboard.json`
- Logging/tracing: `src/utils/sdkLogger.js`, `src/utils/sdkTracing.js`

## Operations Quick Commands
```bash
# Health
curl -s http://localhost:3001/health | jq

# Metrics sample
curl -s http://localhost:3001/metrics | head -40

# Research smoke
curl -s -X POST http://localhost:3001/api/research \
  -H "Content-Type: application/json" \
  -d '{"query":"Find 10-K filings for Tesla in 2023"}'
```

## Tooling References
- Tool permissions: `src/config/toolPermissions.js`
- Structured outputs: `src/config/structuredOutputSchemas.js`
- Error taxonomy: `src/utils/sdkErrorTaxonomy.js`
- Skills: `src/skills/managedSkillsConfig.js`, `src/skills/skillsRegistry.js`


