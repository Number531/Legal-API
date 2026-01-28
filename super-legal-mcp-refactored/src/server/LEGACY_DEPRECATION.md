# Legacy Deprecation Plan (Post-Cutover)

Per migration-spec.md Appendix B: keep legacy code for 1 month post-cutover, then archive.

## Scope to Archive/Remove
- `src/server/claude-server-v2.js` (legacy server)
- `src/orchestrator/ClaudeOrchestrator.legacy.js`
- Manual SSE parsing helpers (legacy streaming)
- Grace period logic remnants (2s/500ms delays)
- Any `*.backup-*` legacy server variants kept only for reference

## Timeline
- T0: Full cutover (CANARY_PCT=100, SDK_TOOL_RUNNER=true)
- T0 + 1 week: Evaluate stability; keep rollback flag available
- T0 + 1 month: Archive legacy code (git tag + branch), remove from deployables

## Steps to Archive
1) Create git tag: `legacy-cutover-<date>`
2) Create branch: `archive/legacy-orchestrator`
3) Remove files from main branch:
   - `src/server/claude-server-v2.js`
   - `src/orchestrator/ClaudeOrchestrator.legacy.js`
   - Legacy SSE/grace-period helpers
4) Retain rollback flags (`SDK_TOOL_RUNNER`, `CANARY_PCT`) for emergency toggle

## Verification Before Removal
- Parity ≥ 0.98 sustained for 1 week at 100% traffic
- No circuit breaker regression vs baseline
- Error rate within historical bounds
- No Sev1/Sev2 incidents attributed to SDK path


