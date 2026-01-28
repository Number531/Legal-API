# GPT‑5 Orchestrator Testing Guide (No Database)

This guide walks you through end‑to‑end testing of the GPT‑5 intelligence layer that drives your existing MCP server, without requiring any database. It uses your Claude Desktop MCP env to seed `.env`, and exercises both non‑streaming and streaming (SSE) flows.

## What you’ll run
- A small Express server (the “orchestrator”) that:
  - Bridges OpenAI GPT‑5 to your local MCP server via stdio
  - Exposes HTTP endpoints your frontend can call
  - Supports streaming and iterative tool use

Key endpoints (already implemented):
- POST `/api/gpt5/research?mode=chat`
- GET `/api/gpt5/stream?mode=chat&query=...` (SSE)
- POST `/api/gpt5/iterative`

> Note: `mode=chat` uses a robust chat‑completions bridge to your local MCP server. This is the recommended path for local testing.

---

## 1) Prerequisites
- macOS with Terminal, curl, and python3
- Node.js 18+ (you have v24+)
- jq (if missing: `brew install jq`)
- An OpenAI API key with GPT‑5 access (exported to your shell)

---

## 2) Prepare environment
From your project root:

```bash
cd "/Users/ej/Google Grounding/super-legal-mcp-refactored"

# Seed .env for the MCP server from Claude Desktop config (CourtListener, USPTO, etc.)
jq -r '.mcpServers["super-legal-refactored"].env | to_entries[] | "\(.key)=\(.value)"' claude_desktop_config.json > .env

# Export your OpenAI key for this shell session (do NOT commit this)
export OPENAI_API_KEY='sk-proj-REPLACE_WITH_YOUR_KEY'

# Ensure dependencies are installed
npm install
```

Why this matters:
- The `.env` file feeds the MCP server process launched via stdio.
- The `OPENAI_API_KEY` is only for this shell and is not written to disk.

---

## 3) Start orchestrator and verify
```bash
# Stop any previous instance on 8089 (harmless if none)
lsof -ti:8089 | xargs -I {} kill {} || true

# Start orchestrator in background and check health
npm run orchestrator >/tmp/gpt5-orchestrator.log 2>&1 &
sleep 1 && curl -s http://localhost:8089/health | cat
```
Expected: `{ "ok": true }`

If not:
- Inspect logs: `tail -n +1 /tmp/gpt5-orchestrator.log | sed -n '1,200p'`
- Re‑export `OPENAI_API_KEY`, then restart (`lsof -ti:8089 | xargs -I {} kill {} || true` and start again)

---

## 4) Basic non‑stream smoke test (chat‑bridge path)
```bash
curl -s -X POST 'http://localhost:8089/api/gpt5/research?mode=chat' \
  -H 'content-type: application/json' \
  -d '{"query":"Quick smoke test: say hello."}' | cat
```
Expected: A short greeting in JSON: `{ "text": "Hello! ..." }`

---

## 5) Tool‑using (constrained) non‑stream test
Constrain the query so upstream APIs return quickly.

```bash
curl -s -X POST 'http://localhost:8089/api/gpt5/research?mode=chat' \
  -H 'content-type: application/json' \
  -d '{"query":"Call search_cases limited to Pennsylvania bankruptcy since 2019, limit 3, find DIP + IP rights; then summarize with citation."}' | cat
```
Tips:
- Add jurisdiction/date/limit to avoid long CourtListener calls.
- The bridge applies per‑tool timeouts and safe defaults to reduce stalls.

---

## 6) Streaming (SSE) test (chat‑bridge mode)
This streams incremental text while logging tool events.

```bash
curl -N "http://localhost:8089/api/gpt5/stream?mode=chat&query=$(python3 -c 'import urllib.parse; print(urllib.parse.quote("Find 1 Chapter 11 bankruptcy case in Pennsylvania since 2019 involving Debtor in Possession and IP rights; include citation."))')"
```
Expect to see:
- One `data: {"type":"tool", ...}` line (model chose a tool)
- Many `data: {"type":"delta", "text":"..."}` lines (partial text chunks)
- Final `data: {"type":"final"}` (stream finished)

If you see schema errors (e.g., function schema invalid):
- The server sanitizes MCP tool schemas on the fly; restart and retry if needed.

---

## 7) Iterative planner + structured memo (no DB required)
Runs iterative tool use to gather evidence, then asks GPT‑5 to produce a structured memo as JSON.

```bash
curl -s -X POST http://localhost:8089/api/gpt5/iterative \
  -H 'content-type: application/json' \
  -d '{"query":"Chemical manufacturing bankruptcies in Pennsylvania; DIP and IP retention issues."}' | jq
```
Notes:
- Without a DB, results are returned in the response only (not persisted).
- The memo format is defined at `src/schemas/BankruptcyResearchMemo.json`.

---

## 8) Troubleshooting
- Orchestrator not responding:
  - `tail -n +1 /tmp/gpt5-orchestrator.log | sed -n '1,200p'`
  - Ensure `OPENAI_API_KEY` is exported in the same shell before `npm run orchestrator`.
- Long stalls on tool calls:
  - Constrain queries (date range, jurisdiction, limit ≤ 3).
  - The bridge applies a 45s per‑call timeout. Re‑run with narrower filters if needed.
- `EPIPE` in logs after cancellation:
  - Harmless; indicates the stdio MCP child was terminated mid‑write.
- 424 “Failed Dependency” on tool list:
  - Use `mode=chat` paths; Responses MCP server_url is more sensitive in local shells.

---

## 9) Stop orchestrator
```bash
lsof -ti:8089 | xargs -I {} kill {}
```

---

## Security notes
- Never commit `.env` or any keys.
- Keep `OPENAI_API_KEY` exported only in your shell session.
- The orchestrator does not modify your MCP server code; Claude Desktop usage is unaffected.

---

## What’s next
- Add HTTP client timeouts in `src/utils/apiHelpers.js` for each upstream to further reduce stalls.
- Enable strict JSON deliverables in your frontend by calling `/api/gpt5/research` with `jsonSchema` when needed.
