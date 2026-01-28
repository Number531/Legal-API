// Minimal, modular wiring for existing endpoints
// Endpoints: /health, /api/claude/stream (SSE), /api/claude/research, /api/sessions

let es = null;
let processing = false;
let sessionId = null;
let startTime = null;
let toolsUsed = 0;
let tokensUsed = 0;
let currentAssistantDiv = null;
let currentAssistantText = '';
let bufferOnly = false; // final-only toggle

const qs = (s) => document.querySelector(s);
const qsa = (s) => document.querySelectorAll(s);

const chat = qs('#chat');
const input = qs('#input');
const send = qs('#send');
const endpointSelect = qs('#endpointSelect');
const maxTokens = qs('#maxTokens');
const finalOnly = qs('#finalOnly');
const healthDot = qs('#healthDot');
const modelSub = qs('#modelSub');
const progressBar = qs('#progressBar');
// session controls removed for stateless testing
const toolsMeta = qs('#toolsMeta');
const tokensMeta = qs('#tokensMeta');
const timeMeta = qs('#timeMeta');

// Insights
const insights = qs('#insights');
const insightsToggle = qs('#insightsToggle');
const closeInsights = qs('#closeInsights');
const tabs = qsa('.tab');
const panels = qsa('[data-panel]');
const thinking = qs('#thinking');
const tools = qs('#tools');
const mTools = qs('#mTools');
const mTokens = qs('#mTokens');
const mTime = qs('#mTime');

// Markdown
if (window.marked) {
  marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false });
}
const hl = window.hljs;

init();

function init() {
  wireUI();
  checkHealth();
  setInterval(checkHealth, 30000);
  restorePrefs();
  if (finalOnly) {
    finalOnly.addEventListener('change', () => {
      bufferOnly = !!finalOnly.checked;
      try { localStorage.setItem('finalOnly', String(bufferOnly)); } catch {}
    });
  }
}

function wireUI() {
  send.addEventListener('click', onSend);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  });

  insightsToggle.addEventListener('click', () => insights.classList.add('open'));
  closeInsights.addEventListener('click', () => {
    insights.classList.remove('open');
    qs('#insightsToggle')?.setAttribute('aria-expanded', 'false');
    insights.setAttribute('aria-hidden', 'true');
  });
  insightsToggle.addEventListener('click', () => {
    const open = insights.classList.contains('open');
    if (!open) {
      insights.classList.add('open');
      insights.setAttribute('aria-hidden', 'false');
      insightsToggle.setAttribute('aria-expanded', 'true');
    }
  });

  // Accessibility shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && insights.classList.contains('open')) {
      insights.classList.remove('open');
      insights.setAttribute('aria-hidden', 'true');
      insightsToggle.setAttribute('aria-expanded', 'false');
    }
  });

  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.getAttribute('data-tab');
    panels.forEach(p => {
      p.style.display = p.getAttribute('data-panel') === target ? '' : 'none';
    });
  }));

  // session handling removed
}

async function checkHealth() {
  try {
    const res = await fetch('http://localhost:8090/health');
    const data = await res.json();
    if (data.ok) {
      healthDot.style.background = 'var(--success)';
      modelSub.textContent = `${data.models?.current || 'claude-sonnet-4-5-20250929'} • healthy`;
    } else {
      healthDot.style.background = 'var(--danger)';
      modelSub.textContent = 'Unhealthy';
    }
  } catch (e) {
    healthDot.style.background = 'var(--danger)';
    modelSub.textContent = 'Disconnected';
  }
}

function onSend() {
  const text = input.value.trim();
  if (!text || processing) return;

  resetRunMetrics();
  addUser(text);
  input.value = '';
  input.style.height = 'auto';

  setProcessing(true);
  const endpoint = endpointSelect.value;
  const tokens = parseInt(maxTokens.value, 10);
  persistPrefs();
  // Clear main output if buffering only; thinking continues in sidebar
  if (bufferOnly && currentAssistantDiv) {
    currentAssistantDiv.innerHTML = '';
  }

  if (endpoint === 'stream') {
    startStream(text, tokens);
  } else {
    postResearch(text, tokens);
  }
}

function startStream(query, tokens) {
  safeClose();
  currentAssistantDiv = addAssistant('');
  currentAssistantText = '';

  const url = new URL('http://localhost:8090/api/claude/stream');
  url.searchParams.set('query', query);
  // no sessionId for stateless testing

  es = new EventSource(url.toString());
  startProgress();

  es.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      handleEvent(data);
    } catch (e) {
      console.error('SSE parse error', e);
    }
  };

  es.onerror = (err) => {
    console.error('SSE error', err);
    finishRun();
  };
}

async function postResearch(query, tokens) {
  try {
    const res = await fetch('http://localhost:8090/api/claude/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    if (data.text) {
      addAssistant(data.text, true);
    } else if (data.error) {
      addAssistant(`Error: ${data.error}`);
    }
    if (data.usage?.total_tokens) tokensUsed = data.usage.total_tokens;
    updateMetrics();
  } catch (e) {
    addAssistant(`Error: ${e.message}`);
  } finally {
    finishRun();
  }
}

function handleEvent(data) {
  switch (data.type) {
    case 'system_info':
      addSystem(data.message || 'System info');
      if (data.model) modelSub.textContent = `${data.model} • streaming`;
      break;
    case 'thinking':
      if (data.text) appendThinking(data.text);
      break;
    case 'tool_call':
      toolsUsed += 1; updateMetrics();
      addTool(data.tool || data);
      break;
    case 'delta':
      if (data.text) {
        if (bufferOnly) {
          currentAssistantText += data.text;
          // do not render yet
        } else {
          appendAssistantDelta(data.text);
        }
      }
      break;
    case 'progress':
      nudgeProgress();
      break;
    case 'final':
      if (data.sessionId) {
        sessionId = data.sessionId;
        sessionMeta.textContent = `Session: ${sessionId.slice(0,8)}…`;
        sessionBtn.textContent = 'End Session';
      }
      if (bufferOnly) {
        // Render accumulated content once
        if (!currentAssistantDiv) currentAssistantDiv = addAssistant('');
        currentAssistantDiv.innerHTML = window.marked ? marked.parse(currentAssistantText) : currentAssistantText;
        enhanceCodeBlocks(currentAssistantDiv);
      }
      finishRun();
      break;
    case 'error':
      addAssistant(`Error: ${data.message || data.error || 'unknown error'}`);
      finishRun();
      break;
  }
}

// UI helpers
function addUser(text) {
  const bubble = document.createElement('div');
  bubble.className = 'bubble user';
  bubble.textContent = text;
  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
}

function addAssistant(markdown, finalize = false) {
  const bubble = document.createElement('div');
  bubble.className = 'bubble assistant';
  const md = document.createElement('div');
  md.className = 'markdown';
  md.innerHTML = finalize ? (window.marked ? marked.parse(markdown) : markdown) : '';
  enhanceCodeBlocks(md);
  bubble.appendChild(md);
  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
  return md;
}

function appendAssistantDelta(text) {
  currentAssistantText += text;
  if (!currentAssistantDiv) currentAssistantDiv = addAssistant('');
  currentAssistantDiv.innerHTML = window.marked ? marked.parse(currentAssistantText) : currentAssistantText;
  enhanceCodeBlocks(currentAssistantDiv);
  chat.scrollTop = chat.scrollHeight;
}

function addSystem(text) {
  const bubble = document.createElement('div');
  bubble.className = 'bubble system';
  bubble.textContent = text;
  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
}

function appendThinking(text) {
  thinking.textContent += text;
  thinking.parentElement.scrollTop = thinking.parentElement.scrollHeight;
}

function addTool(tool) {
  const id = tool.id || `${tool.name}-${Date.now()}`;
  const item = document.createElement('div');
  item.className = 'tool';
  item.id = `tool-${id}`;
  const args = tool.input || tool.arguments;
  item.innerHTML = `
    <div class="tool-head">
      <div>
        <div class="tool-name">${escapeHtml(tool.name || 'tool')}</div>
        <div class="tool-meta">${tool.legal_domain ? escapeHtml(tool.legal_domain) + ' • ' : ''}${new Date().toLocaleTimeString()}</div>
      </div>
      <div class="tool-status">started</div>
    </div>
    ${args ? `<pre style="margin:8px 0 0"><code>${escapeHtml(JSON.stringify(args, null, 2))}</code></pre>` : ''}
  `;
  tools.prepend(item);
  enhanceCodeBlocks(item);
  toolsMeta.textContent = `Tools: ${toolsUsed}`;
  mTools.textContent = String(toolsUsed);
}

// Progress / run state
function setProcessing(v) {
  processing = v;
  send.disabled = v;
  if (v) {
    startTime = Date.now();
    const t = setInterval(() => {
      if (!processing) return clearInterval(t);
      updateMetrics();
    }, 1000);
  }
}
function startProgress() { progressBar.style.width = '12%'; }
function nudgeProgress() {
  const cur = parseFloat(progressBar.style.width) || 12;
  const next = Math.min(cur + Math.random() * 12 + 4, 88);
  progressBar.style.width = next + '%';
}
function stopProgress() { progressBar.style.width = '0%'; }
function finishRun() { setProcessing(false); stopProgress(); safeClose(); updateMetrics(); }
function safeClose() { try { es && es.close(); } catch {} es = null; }

function resetRunMetrics() {
  toolsUsed = 0; tokensUsed = 0; currentAssistantText = ''; currentAssistantDiv = null;
  thinking.textContent = ''; tools.innerHTML = '';
  mTools.textContent = '0'; mTokens.textContent = '0'; mTime.textContent = '0s';
  toolsMeta.textContent = 'Tools: 0'; tokensMeta.textContent = 'Tokens: 0'; timeMeta.textContent = 'Time: 0s';
}

function updateMetrics() {
  if (startTime) {
    const sec = Math.round((Date.now() - startTime) / 1000);
    timeMeta.textContent = `Time: ${sec}s`;
    mTime.textContent = `${sec}s`;
  }
  tokensMeta.textContent = `Tokens: ${tokensUsed}`;
  mTokens.textContent = String(tokensUsed);
  toolsMeta.textContent = `Tools: ${toolsUsed}`;
  mTools.textContent = String(toolsUsed);
}

function escapeHtml(str) {
  try { return String(str).replace(/[&<>\"]|\"/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); } catch { return String(str); }
}

// Enhancements: syntax highlight + copy
function enhanceCodeBlocks(root) {
  try {
    const blocks = root.querySelectorAll('pre code');
    blocks.forEach((code) => {
      if (hl && typeof hl.highlightElement === 'function') {
        try { hl.highlightElement(code); } catch {}
      }
      const pre = code.closest('pre');
      if (!pre) return;
      if (!pre.previousElementSibling || !pre.previousElementSibling.classList.contains('code-actions')) {
        const actions = document.createElement('div');
        actions.className = 'code-actions';
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.type = 'button';
        btn.textContent = 'Copy';
        btn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(code.textContent || '');
            btn.textContent = 'Copied';
            setTimeout(() => (btn.textContent = 'Copy'), 1200);
          } catch {}
        });
        actions.appendChild(btn);
        pre.parentElement.insertBefore(actions, pre);
      }
    });
  } catch {}
}

// Persistence
function persistPrefs() {
  try {
    localStorage.setItem('endpoint', endpointSelect.value);
    localStorage.setItem('maxTokens', String(maxTokens.value));
    if (sessionId) localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('finalOnly', String(!!finalOnly?.checked));
  } catch {}
}
function restorePrefs() {
  try {
    const ep = localStorage.getItem('endpoint');
    const mt = localStorage.getItem('maxTokens');
    // ignore stored sessionId for stateless testing
    const sid = null;
    const fo = localStorage.getItem('finalOnly');
    if (ep) endpointSelect.value = ep;
    if (mt) maxTokens.value = mt;
    // session intentionally unused
    if (fo != null && finalOnly) {
      finalOnly.checked = fo === 'true';
      bufferOnly = finalOnly.checked;
    }
  } catch {}
}


