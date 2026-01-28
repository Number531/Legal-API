Modern Frontend for Claude Legal Research

This is a sleek, dark, minimalist chat interface that consumes existing backend endpoints without modifying server behavior. It is non-destructive; the legacy testing UI remains available.

Features
- Streaming SSE with /api/claude/stream
- Non-streaming POST with /api/claude/research
- Health check via /health
- Optional sessions via /api/sessions
- Thinking and tool calls in an Insights drawer
- Lightweight metrics (tools, tokens when available, elapsed time)

Files
- index.html — markup/layout
- assets/style.css — theme and components
- assets/app.js — wiring, SSE handling, UI logic

How to use
1) Start the server on http://localhost:8090 (see claude-server-v2.js)
2) Open index.html in a browser
3) Select Streaming or Non‑streaming and optionally start a Session
4) Ask a question; open Insights to view thinking and tool calls

Notes
- All URLs point to http://localhost:8090 to match current server defaults
- No build tooling required; static files only

