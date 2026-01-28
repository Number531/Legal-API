# Subagent Reports Dropdown UI for Claude Playground

## Task Summary

Add a dropdown/collapsible UI component to `claude-playground.html` that displays subagent reports from the `/reports/` directory, without altering the main agent output.

**Approach:** Saved Reports Only (per user preference)

---

## Research Findings: Subagent Visibility in Claude Agent SDK (December 12, 2025)

### Key Discovery: Subagent Thinking/Tool Calls Are NOT Independently Viewable

**GitHub Issue #2685** (Open, 16+ reactions) confirms this is a **known limitation**:

> "Where to view the execution thinking/tool calls/outputs of subagents whenever I ask it to spawn subagents?"

**Current SDK Behavior:**
- Subagents operate in **isolated context windows** separate from the main conversation
- The SDK does NOT expose subagent internal thinking or tool calls to the parent agent
- Only the **final text result** from a subagent is returned to the main agent

**Solution:** Super-Legal subagents save detailed reports to `/reports/` via `REPORT_SAVING_INSTRUCTIONS`. We'll display these saved reports in a dropdown.

---

## Implementation Plan

### Phase 1: Server-Side Reports API Endpoint

**File:** `src/server/claude-sdk-server.js`

Add endpoint to list and fetch saved reports:

```javascript
// Add after /api/subagents endpoint (~line 315):
import fs from 'fs';
import path from 'path';

// List available reports
app.get('/api/reports', (req, res) => {
  const reportsDir = path.join(process.cwd(), 'reports');

  try {
    if (!fs.existsSync(reportsDir)) {
      return res.json({ reports: [] });
    }

    const files = fs.readdirSync(reportsDir)
      .filter(f => f.endsWith('.md'))
      .map(filename => {
        const filepath = path.join(reportsDir, filename);
        const stats = fs.statSync(filepath);
        return {
          filename,
          modified: stats.mtime.toISOString(),
          size: stats.size
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified)); // Newest first

    res.json({ reports: files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific report content
app.get('/api/reports/:filename', (req, res) => {
  const reportsDir = path.join(process.cwd(), 'reports');
  const filename = req.params.filename;

  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const filepath = path.join(reportsDir, filename);

  try {
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const content = fs.readFileSync(filepath, 'utf8');
    res.json({
      filename,
      content,
      modified: fs.statSync(filepath).mtime.toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Phase 2: Frontend Dropdown UI

**File:** `test/claude-playground.html`

#### 2a. Add HTML Structure (after "Thinking & Tools" section, ~line 320)

Add new panel section in the right sidebar:

```html
<!-- Subagent Reports Section -->
<div style="border-top: 1px solid var(--muted); margin-top: 12px; padding-top: 8px;">
  <div class="section-title" style="display: flex; align-items: center; gap: 8px;">
    <span>Subagent Reports</span>
    <span id="reportCount" class="chip">0</span>
    <button class="btn ghost" id="btnRefreshReports" style="margin-left: auto; padding: 4px 8px; font-size: 11px;">Refresh</button>
  </div>
  <div class="scroll" style="max-height: 350px;">
    <div id="reportsDropdown" class="reports-dropdown">
      <div class="subtle" style="padding: 12px; text-align: center;">Click Refresh to load reports</div>
    </div>
  </div>
</div>
```

#### 2b. Add CSS Styles (add to `<style>` section, ~line 237)

```css
/* Subagent Reports Dropdown Styles */
.reports-dropdown {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-card {
  background: #0c131b;
  border: 1px solid #1b2533;
  border-radius: 10px;
  overflow: hidden;
}

.report-header {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0e141c;
  transition: background 0.15s ease;
}

.report-header:hover {
  background: #111925;
}

.report-expand {
  color: var(--subtle);
  font-size: 10px;
  width: 12px;
}

.report-info {
  flex: 1;
  min-width: 0;
}

.report-name {
  font-weight: 600;
  color: #e6eef7;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-meta {
  font-size: 11px;
  color: var(--subtle);
  margin-top: 2px;
}

.report-content {
  display: none;
  padding: 12px;
  border-top: 1px solid #1b2533;
  background: #0a0f14;
  max-height: 500px;
  overflow-y: auto;
}

.report-card.expanded .report-content {
  display: block;
}

.report-body {
  white-space: pre-wrap;
  font-size: 13px;
  color: #d4e2f0;
  line-height: 1.6;
}

.report-body h1, .report-body h2, .report-body h3 {
  color: #e8f0f7;
  margin: 16px 0 8px;
}

.report-body h1 { font-size: 18px; border-bottom: 1px solid #2a3a4f; padding-bottom: 6px; }
.report-body h2 { font-size: 16px; }
.report-body h3 { font-size: 14px; }

.report-loading {
  color: var(--subtle);
  font-style: italic;
  padding: 8px;
  text-align: center;
}
```

#### 2c. Add JavaScript Logic (add after line ~1420)

```javascript
// Subagent Reports Management
let loadedReports = {}; // Cache: { filename: content }

async function loadReportsList() {
  const dropdown = document.getElementById('reportsDropdown');
  const countBadge = document.getElementById('reportCount');

  dropdown.innerHTML = '<div class="report-loading">Loading reports...</div>';

  try {
    const res = await fetch(`${FIXED_SERVER}/api/reports`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const reports = data.reports || [];

    countBadge.textContent = reports.length;

    if (reports.length === 0) {
      dropdown.innerHTML = '<div class="subtle" style="padding: 12px; text-align: center;">No reports saved yet</div>';
      return;
    }

    dropdown.innerHTML = reports.map((report, idx) => {
      const date = new Date(report.modified);
      const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sizeStr = report.size > 1024 ? `${(report.size / 1024).toFixed(1)} KB` : `${report.size} B`;

      // Extract subagent name from filename pattern: YYYY-MM-DD-<subagent>-<hash>.md
      const nameParts = report.filename.replace('.md', '').split('-');
      const subagentName = nameParts.length > 3 ? nameParts.slice(3, -1).join('-') : report.filename;

      return `
        <div class="report-card" data-filename="${escapeHtml(report.filename)}" data-idx="${idx}">
          <div class="report-header" onclick="toggleReport('${escapeHtml(report.filename)}')">
            <span class="report-expand">▶</span>
            <div class="report-info">
              <div class="report-name">${escapeHtml(subagentName)}</div>
              <div class="report-meta">${escapeHtml(timeStr)} • ${escapeHtml(sizeStr)}</div>
            </div>
          </div>
          <div class="report-content">
            <div class="report-body" id="report-body-${idx}">
              <div class="report-loading">Click to load content...</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    dropdown.innerHTML = `<div class="subtle" style="padding: 12px; text-align: center; color: var(--danger);">Error: ${escapeHtml(err.message)}</div>`;
  }
}

async function toggleReport(filename) {
  const card = document.querySelector(`.report-card[data-filename="${filename}"]`);
  if (!card) return;

  const wasExpanded = card.classList.contains('expanded');
  const expand = card.querySelector('.report-expand');
  const bodyEl = card.querySelector('.report-body');

  // Toggle expand state
  card.classList.toggle('expanded');
  expand.textContent = card.classList.contains('expanded') ? '▼' : '▶';

  // Load content if expanding and not cached
  if (!wasExpanded && !loadedReports[filename]) {
    bodyEl.innerHTML = '<div class="report-loading">Loading...</div>';

    try {
      const res = await fetch(`${FIXED_SERVER}/api/reports/${encodeURIComponent(filename)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      loadedReports[filename] = data.content;
      bodyEl.innerHTML = `<div class="md">${renderMarkdown(data.content)}</div>`;
    } catch (err) {
      bodyEl.innerHTML = `<div class="subtle" style="color: var(--danger);">Error loading: ${escapeHtml(err.message)}</div>`;
    }
  } else if (!wasExpanded && loadedReports[filename]) {
    // Use cached content
    bodyEl.innerHTML = `<div class="md">${renderMarkdown(loadedReports[filename])}</div>`;
  }
}

// Wire up refresh button
document.getElementById('btnRefreshReports').addEventListener('click', () => {
  loadedReports = {}; // Clear cache
  loadReportsList();
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/server/claude-sdk-server.js` | Add `/api/reports` and `/api/reports/:filename` endpoints (~50 lines) |
| `test/claude-playground.html` | Add HTML (~15 lines), CSS (~80 lines), JS (~100 lines) |

---

## Key Benefits of This Approach

1. **Complete Output** - Shows full subagent reports including all research findings
2. **Persisted** - Reports remain available even after session ends
3. **Simpler Implementation** - No need for SDK hooks or streaming complexity
4. **Works with Existing System** - Leverages existing `REPORT_SAVING_INSTRUCTIONS`

---

## Verification

After implementation, run:
```bash
SUBAGENTS_ENABLED=true npm run sdk-server
```

Then:
1. Query: "Research SEC filings for Apple 2024"
2. Wait for subagent to complete and save report
3. Click "Refresh" in Subagent Reports section
4. Verify report appears with expandable content
5. Confirm main transcript feed is unchanged

---

## Security Considerations

- Filename validation prevents directory traversal attacks
- Reports are read-only (no write/delete endpoints)
- Only `.md` files from the specific `/reports/` directory are accessible
