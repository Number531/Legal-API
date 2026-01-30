/**
 * Claude Agent SDK Hooks Implementation
 * Provides lifecycle hooks for subagent monitoring, report verification,
 * state file verification, and recovery context injection.
 *
 * Based on official Anthropic documentation (December 2025):
 * https://platform.claude.com/docs/en/agent-sdk/hooks
 *
 * Token Impact: Minimal - Core logging is console/file based.
 * additionalContext used only when critical:
 * - SessionStart: Injects warnings for unhealthy/blocked state files
 * - PreCompact: Injects recovery context to survive compaction
 * - PermissionRequest: Auto-approves trusted operations
 *
 * @module sdkHooks
 */

import { readFileSync, appendFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'fs';
import { join } from 'path';

// ============================================
// LARGE FILE DETECTION CONSTANTS
// ============================================
// Agent SDK Read tool tokenizes entire file before applying offset/limit
// Files > ~100KB typically exceed 25k token limit
const MAX_FILE_BYTES = 100000; // 100KB - conservative threshold
const ESTIMATED_CHARS_PER_TOKEN = 4; // Rough estimate for English text

// Session-level save tracking for observability
// Export for testing/monitoring
export const sessionSaveLog = new Map(); // session_id -> [{path, timestamp}]

// Track tool start times for duration calculation
const toolStartTimes = new Map(); // toolUseID -> timestamp

// ============================================
// REMEDIATION SCRIPT VALIDATION TRACKING
// ============================================
// Track remediation script executions for mandatory post-validation
const remediationScriptRegistry = new Map(); // scriptName -> { command, executedAt, toolResult, validationChecks }

/*
 * HYBRID WORKFLOW QUICK REFERENCE
 * ================================
 *
 * Wave 3 uses a hybrid script+agent approach:
 *
 * P1: CREAC Headers
 *   Script: apply-creac-headers.py → final-memorandum-creac.md
 *   Agent:  memo-remediation-writer (W3-001-VALIDATE)
 *   Validation: grep -c "### Conclusion" (31+), grep -c "### Rule" (31+)
 *
 * P2: Cross-References
 *   Script: analyze-xrefs.py → xref-matrix.json
 *   Agent:  xref-insertion-agent (per orphan)
 *   Validation: jq '.orphaned_findings | length'
 *
 * P3: Counter-Analysis
 *   Script: detect-counter-analysis.py → counter-analysis-locations.json + IV-*.json
 *   Agent:  memo-remediation-writer (W3-COUNTER per section)
 *   Validation: jq '.metadata.locations_to_move', ls counter-analysis-locations-IV-*.json
 *
 * State Tracking: qa-outputs/remediation-wave-state.json
 *
 * Detection Patterns (line ~500):
 *   - /apply-creac-headers\.py/
 *   - /analyze-xrefs\.py/
 *   - /detect-counter-analysis\.py/
 *
 * Validation Patterns (line ~555):
 *   - /jq\s+['".]/  (JSON queries)
 *   - /test\s+-f/    (file existence)
 *   - /ls.*counter-analysis-locations/  (per-section files)
 */

/**
 * Get expected validation checks for a specific detection/analysis script.
 * Used to inject validation reminders after script execution.
 *
 * NOTE: These scripts perform DETECTION and ANALYSIS only (except apply-creac-headers.py
 * which does partial insertion ~23%). Actual REMEDIATION is performed by agents.
 *
 * @param {string} scriptName - Name of the detection/analysis script
 * @returns {string} Validation guidance for the specific script
 */
function getValidationChecksForScript(scriptName) {
  const validationMap = {
    'execute-w4-001.sh': `
- grep "Under Nebraska Revised Statutes sections 44-6011" final-memorandum.md
- grep "Under general principles of corporate veil" final-memorandum.md
- Count: All 12 questions should have "Under.*does.*when" format`,
    'update_questions.py': `
- Verify Section II contains reformatted questions
- Count question numbers 1-12 present`,
    'apply-creac-headers.py': `
- grep -c "### Conclusion" final-memorandum.md (should be 31+)
- grep -c "### Rule" final-memorandum.md (should be 31+)
- grep -c "### Explanation" final-memorandum.md (should be 31+)
- grep -c "### Application" final-memorandum.md (should be 31+)
- grep -c "### Counter-Analysis" final-memorandum.md (should be present)`,
    'apply-wave3-headers.py': `
- grep -c "### Conclusion" final-memorandum.md | wc -l
- grep -c "### Rule" final-memorandum.md | wc -l
- grep -c "### Application" final-memorandum.md | wc -l`,
    'analyze-xrefs.py': `
- test -f xref-matrix.json (file should exist)
- jq '.orphaned_findings | length' xref-matrix.json (count orphaned findings)
- jq '.metadata.total_findings' xref-matrix.json (verify findings parsed)
- jq '.connection_suggestions | length' xref-matrix.json (suggestions count)`,
    'detect-counter-analysis.py': `
- test -f counter-analysis-locations.json (main file should exist)
- jq '.metadata.total_detections' counter-analysis-locations.json
- jq '.metadata.locations_to_move' counter-analysis-locations.json
- ls counter-analysis-locations-IV-*.json | wc -l (per-section files)`,
    'extract-citations.py': `
- test -f citation-registry.json (file should exist)
- jq '.statistics.total_citations' citation-registry.json (verify count)
- jq '.statistics.low_confidence_count' citation-registry.json (should be minimal)
- jq '.citations | length' citation-registry.json (verify array populated)
- Exit 1 indicates low-confidence citations detected - review recommended`,
    'scan-citation-tags.py': `
- test -f citation-tag-report.json (file should exist)
- jq '.coverage_percentage' citation-tag-report.json (should be >= 90%)
- jq '.high_severity_unverified | length' citation-tag-report.json (should be 0)
- jq '.triggers_hard_fail' citation-tag-report.json (should be false)
- Exit 1 indicates coverage gaps - remediation required before QA`,
    'extract-fact-registry.py': `
- test -f fact-registry.json (file should exist)
- jq '.statistics.total_facts' fact-registry.json (verify extraction)
- jq '.statistics.conflict_count' fact-registry.json (should be 0)
- jq '.conflicts | length' fact-registry.json (review any conflicts)
- Exit 1 indicates fact conflicts - apply tiebreaker rules`,
    'aggregate-risk-tables.py': `
- test -f risk-summary.json (file should exist)
- jq '.severity_distribution' risk-summary.json (verify counts)
- jq '.deal_blocking_risks | length' risk-summary.json (flag if > 0)
- jq '.incomplete_tables | length' risk-summary.json (should be 0)
- Exit 1 indicates incomplete tables or deal-blocking risks`
  };

  return validationMap[scriptName] || '- Verify expected changes present in target file\n- Check file integrity (no corruption)\n- Update remediation-wave-state.json with validation result';
}

/**
 * Provides guidance for processing split/per-section output files from scripts.
 * Helps agents iterate through multiple output files and handle orphaned findings.
 *
 * @param {string} scriptName - Name of the remediation script
 * @returns {string} Split file processing guidance
 */
function getSplitFileGuidance(scriptName) {
  const guidanceMap = {
    'analyze-xrefs.py': `
ORPHANED FINDINGS PROCESSING:
1. Read xref-matrix.json: jq '.orphaned_findings[]' xref-matrix.json
2. For EACH orphaned finding (section_id, title, severity):
   - Invoke xref-insertion-agent with: {"section_id": "<id>", "xref_matrix_path": "xref-matrix.json"}
   - Output: remediation-outputs/W3-XREF-<section_id>.md
3. Track each invocation in remediation-wave-state.json

CONNECTION SUGGESTIONS:
- Review: jq '.connection_suggestions[:5]' xref-matrix.json
- High confidence (>0.7) suggestions should be prioritized`,

    'detect-counter-analysis.py': `
PER-SECTION FILE PROCESSING:
1. List all per-section files: ls counter-analysis-locations-IV-*.json
2. For EACH section file (counter-analysis-locations-IV-A.json, etc.):
   - Read file: jq '.' counter-analysis-locations-IV-<X>.json
   - Check 'locations_to_move' count
   - If > 0: Invoke memo-remediation-writer with task W3-COUNTER
   - Input: {"section_file": "counter-analysis-locations-IV-<X>.json"}
   - Output: remediation-outputs/W3-COUNTER-<section>.md
3. Track each section's completion in remediation-wave-state.json

CONSOLIDATION ORDER:
- Process sections in order: A, B, C... (maintains document structure)
- High confidence detections (>0.8) first within each section`,

    'ASSEMBLY-001': `
WAVE 6 ASSEMBLY PROTOCOL (Agent-Driven):

**ARCHITECTURE**: Agent reads and applies edits semantically (NOT regex).

1. GATE CHECK (MANDATORY - BLOCK if fails):
   - Read remediation-wave-state.json
   - Check wave_status.wave_5.status == "completed"
   - Verify W5-001, W5-002, W5-003 all have validation_result.passed == true
   - If ANY check fails: STATUS = BLOCKED, report to orchestrator

2. BUILD EDIT REGISTRY:
   - Read ALL remediation-outputs/W*.md files
   - For each file, detect operation type:
     - Has ORIGINAL_START → REPLACE operation
     - Only EDITED_START → INSERT operation
   - Extract target section from file header/comments

3. PROCESS IN WAVE ORDER (W1 → W2 → W3 → W4 → W5):

   For INSERT operations (e.g., W2-RISK-*):
   a) Find target section header (e.g., "## IV.A.")
   b) Find anchor text (e.g., "### A. Legal Framework")
   c) Insert EDITED content BEFORE anchor
   d) Verify content now present

   For REPLACE operations:
   a) Find ORIGINAL content using semantic search
   b) Replace with EDITED content
   c) Verify replacement succeeded

4. VERIFY AFTER EACH EDIT:
   - Risk tables: grep "| Finding | Severity |" (expect 6)
   - Questions: grep "Under.*does.*when" (expect 12)
   - Provisions: grep "DRAFT CONTRACT PROVISION" (expect 3)

5. GENERATE REPORT:
   - Save to qa-outputs/assembly-report.md
   - List all tasks with MERGED/FAILED status
   - Include validation results

RISK TABLE INSERTION POINTS (verified line numbers):
- W2-RISK-001: After "## IV.A." (L694), before "### A. Legal Framework" (L703)
- W2-RISK-002: After "## IV.B." (L1327), before "### A. Legal Framework" (L1336)
- W2-RISK-003: After "## IV.C." (L2242), before "### A. Legal Framework" (L2249)
- W2-RISK-004: After "## IV.D." (L3292), before "### A. Legal Framework:" (L3294)
- W2-RISK-005: After "## IV.E." (L4206), before "### A. Executive Overview:" (L4215)
- W2-RISK-006: After "## IV.F." (L6454), before "### A. Integrated Findings" (L6463)

BACKWARD COMPATIBILITY (existing W2-RISK files):
CRITICAL: Only W2-RISK-001 has explicit ## INSERTION INSTRUCTIONS.
W2-RISK-002 through W2-RISK-006 embed location contextually.

FOR W2-RISK-* FILES: Use insertion points map as PRIMARY method:
1. Match task ID (W2-RISK-001 through W2-RISK-006)
2. Look up section header and anchor from map above
3. Insert EDITED content between header and anchor

FOR OTHER INSERT TASKS: Parse in priority order:
1. Check for ## TARGET section (new format)
2. Check for ## INSERTION INSTRUCTIONS with **Location**: field
3. Check for inline "Insert this table..." text
4. Fall back to insertion points map if available

FAILURE HANDLING:
- If edit fails: Log reason, attempt semantic fallback, continue
- If >3 tasks fail: Set STATUS = PARTIAL, escalate
- Never fail silently - always log and report`
  };

  return guidanceMap[scriptName] || '';
}

// ============================================
// STRUCTURED LOGGING HELPERS
// ============================================

/**
 * Structured log entry for consistent JSON output.
 * Outputs NDJSON (newline-delimited JSON) format for easy parsing.
 *
 * @param {string} event - Event type identifier
 * @param {Object} data - Additional data to include in log entry
 */
function logStructured(event, data) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...data
  };
  console.log(JSON.stringify(entry));
}

/**
 * Append to session audit log file.
 * Creates directory if it doesn't exist.
 * Non-blocking, non-fatal on error.
 *
 * @param {string} sessionId - Session identifier (used as directory name)
 * @param {Object} entry - Log entry object to append
 */
function appendAuditLog(sessionId, entry) {
  if (!sessionId) return;

  // Extract date-based session directory if present
  // Session IDs may be UUIDs or date-prefixed directories
  const logDir = sessionId.includes('-') && sessionId.match(/^\d{4}-\d{2}-\d{2}/)
    ? join('reports', sessionId)
    : join('reports', 'sessions', sessionId);
  const logPath = join(logDir, 'session-audit.log');

  try {
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    appendFileSync(logPath, JSON.stringify(entry) + '\n');
  } catch (err) {
    // Non-fatal: just log warning and continue
    console.warn(`[Audit] Failed to write to ${logPath}: ${err.message}`);
  }
}

/**
 * Determine tool type for categorized logging.
 *
 * @param {string} toolName - Name of the tool
 * @returns {string} Tool type: 'mcp', 'code_execution', or 'standard'
 */
function getToolType(toolName) {
  if (toolName?.startsWith('mcp__')) return 'mcp';
  if (toolName?.includes('execute_financial_model')) return 'code_execution';
  return 'standard';
}

// ============================================
// STATE FILE HELPER FUNCTIONS
// ============================================

/**
 * Build warning message for unhealthy environment state.
 * Used by SessionStart hook when environment_healthy is false.
 *
 * @param {string} statePath - Path to the state file
 * @param {Object} stateContent - Parsed state file content
 * @returns {string} Formatted warning message
 */
function buildUnhealthyWarning(statePath, stateContent) {
  return [
    '## ⚠️ STATE FILE VERIFICATION WARNING',
    '',
    `**State File**: ${statePath}`,
    `**environment_healthy**: false`,
    '',
    '**REQUIRED ACTION**: Use file inspection fallback before proceeding.',
    '',
    '**Verification Steps**:',
    '1. List files in session directory',
    '2. Verify output files exist for claimed progress',
    '3. Check file sizes are reasonable',
    '4. Update state file with verified progress'
  ].join('\n');
}

/**
 * Build warning message for blocking issues.
 * Used by SessionStart hook when blocking_issue.resolution_status is UNRESOLVED.
 *
 * @param {string} statePath - Path to the state file
 * @param {Object} blockingIssue - The blocking_issue object from state
 * @returns {string} Formatted blocking warning message
 */
function buildBlockingWarning(statePath, blockingIssue) {
  return [
    '## 🚫 BLOCKING ISSUE DETECTED',
    '',
    `**Type**: ${blockingIssue.type}`,
    `**Description**: ${blockingIssue.description}`,
    `**Resolution Method**: ${blockingIssue.resolution_method}`,
    '',
    '**REQUIRED ACTION**: Resolve blocking issue before continuing.',
    '',
    `Read full state file: ${statePath}`
  ].join('\n');
}

/**
 * Build recovery context from state files for compaction.
 * Extracts compaction_summary, progress, and do_not_repeat arrays.
 *
 * @param {Array} stateFiles - Array of parsed state file objects
 * @returns {string} Formatted recovery context for additionalContext
 */
function buildRecoveryContext(stateFiles) {
  const lines = [
    '## COMPACTION RECOVERY CONTEXT',
    '',
    'The following state was preserved before compaction:',
    ''
  ];

  for (const sf of stateFiles) {
    lines.push(`### ${sf.file}`);
    lines.push(`- **Task**: ${sf.summary?.task || 'Unknown'}`);
    lines.push(`- **Progress**: ${sf.summary?.progress || 'Unknown'}`);
    lines.push(`- **Next Action**: ${sf.summary?.next_action || 'Read state file'}`);

    if (sf.progress?.items_complete?.length > 0) {
      lines.push(`- **Completed**: ${sf.progress.items_complete.join(', ')}`);
    }

    if (sf.do_not_repeat?.length > 0) {
      lines.push(`- **DO NOT REPEAT**: ${sf.do_not_repeat.join(', ')}`);
    }

    lines.push('');
  }

  lines.push('**CRITICAL**: Read the full state file(s) before continuing work.');

  return lines.join('\n');
}

// ============================================
// PRE-TOOL-USE HOOK
// ============================================
/**
 * Called before each tool invocation.
 * Provides structured audit logging with tool type detection.
 * Tracks start time for duration calculation.
 *
 * @param {PreToolUseHookInput} input - Hook input with tool details
 * @param {string|undefined} toolUseID - Unique ID for this tool invocation
 * @param {Object} options - Options including AbortSignal
 * @returns {Promise<HookJSONOutput>} Always returns { continue: true }
 */
export async function preToolUseHandler(input, toolUseID, { signal }) {
  const { tool_name, tool_input, session_id, hook_event_name } = input;
  const toolType = getToolType(tool_name);
  const isHighFrequency = ['Read', 'Grep', 'Glob'].includes(tool_name);

  // Track start time for duration calculation in postToolUseHandler
  if (toolUseID) {
    toolStartTimes.set(toolUseID, Date.now());
  }

  // ============================================
  // LARGE FILE DETECTION - Redirect Read to Grep
  // ============================================
  // Agent SDK Read tool tokenizes entire file BEFORE applying offset/limit
  // This causes 25k token errors even with chunking parameters
  // Solution: Detect large files and guide Claude to use Grep instead
  if (tool_name === 'Read' && tool_input?.file_path) {
    try {
      const filePath = tool_input.file_path;
      if (existsSync(filePath)) {
        const stats = statSync(filePath);
        const fileSizeBytes = stats.size;
        const estimatedTokens = Math.ceil(fileSizeBytes / ESTIMATED_CHARS_PER_TOKEN);

        if (fileSizeBytes > MAX_FILE_BYTES) {
          // Log the interception
          logStructured('large_file_intercepted', {
            timestamp: new Date().toISOString(),
            event: 'large_file_intercepted',
            tool: tool_name,
            file_path: filePath,
            file_size_bytes: fileSizeBytes,
            estimated_tokens: estimatedTokens,
            session_id,
            tool_use_id: toolUseID || null
          });

          // Return deny with Grep guidance
          return {
            continue: true,
            hookSpecificOutput: {
              hookEventName: hook_event_name,
              permissionDecision: 'deny',
              permissionDecisionReason: `File too large (${fileSizeBytes.toLocaleString()} bytes, ~${estimatedTokens.toLocaleString()} tokens). Agent SDK Read tool tokenizes entire file before chunking, causing 25k token limit errors.

USE GREP TO EXTRACT SECTIONS:
- Executive Summary: Grep("## I. EXECUTIVE SUMMARY", "${filePath}", -A: 200)
- Risk Factors: Grep("## V. RISK", "${filePath}", -A: 150)
- Conclusions: Grep("## VI. CONCLUSION", "${filePath}", -A: 100)
- Specific findings: Grep("HIGH.*severity|\\$[0-9]+.*million", "${filePath}", -A: 10)

ALTERNATIVE - Read specific line ranges if you know the structure:
- First 500 lines: Read("${filePath}", offset: 0, limit: 500) - may still fail if dense
- Use Grep to locate line numbers first, then targeted Read`
            }
          };
        }
      }
    } catch (err) {
      // Non-fatal: log warning and allow Read to proceed
      console.warn(`[PreToolUse] File size check failed for ${tool_input.file_path}: ${err.message}`);
    }
  }

  // ============================================
  // AGENT OUTPUT TOOL ENFORCEMENT
  // ============================================
  // SDK enforces max wait_up_to of 300 seconds (5 minutes)
  // Block polling patterns (block: false) which waste turns
  // See: prompts/memorandum-orchestrator.md "Long-Running Agent Pattern"
  const SDK_MAX_WAIT_UP_TO = 300; // seconds

  if (tool_name === 'AgentOutputTool') {
    const { agentId, block, wait_up_to } = tool_input || {};

    // BLOCK POLLING: Deny block: false calls
    if (block === false) {
      logStructured('agent_output_polling_blocked', {
        timestamp: new Date().toISOString(),
        event: 'agent_output_polling_blocked',
        tool: tool_name,
        agent_id: agentId,
        session_id,
        tool_use_id: toolUseID || null,
        reason: 'Polling with block: false is prohibited'
      });

      return {
        continue: true,
        hookSpecificOutput: {
          hookEventName: hook_event_name,
          permissionDecision: 'deny',
          permissionDecisionReason: `POLLING PROHIBITED: AgentOutputTool with block: false wastes 100-700+ turns.

USE BLOCKING CALLS ONLY:
✅ AgentOutputTool({ agentId: "${agentId}", block: true, wait_up_to: 300 })

LONG-RUNNING AGENT PATTERN (Re-check Strategy):
1. First call: wait_up_to: 300 (5 min max)
2. On timeout: Re-invoke same agent with wait_up_to: 300
3. Repeat 2-6x for research specialists (expected 10-30 min)
4. After 2 consecutive timeouts with no progress, mark FAILED

See: prompts/memorandum-orchestrator.md "Long-Running Agent Pattern"`
        }
      };
    }

    // ENFORCE MAX TIMEOUT: Cap wait_up_to at 300 seconds
    if (wait_up_to && wait_up_to > SDK_MAX_WAIT_UP_TO) {
      logStructured('agent_output_timeout_exceeded', {
        timestamp: new Date().toISOString(),
        event: 'agent_output_timeout_exceeded',
        tool: tool_name,
        agent_id: agentId,
        requested_wait_up_to: wait_up_to,
        max_allowed: SDK_MAX_WAIT_UP_TO,
        session_id,
        tool_use_id: toolUseID || null
      });

      return {
        continue: true,
        hookSpecificOutput: {
          hookEventName: hook_event_name,
          permissionDecision: 'deny',
          permissionDecisionReason: `TIMEOUT EXCEEDED: wait_up_to: ${wait_up_to} exceeds SDK maximum of ${SDK_MAX_WAIT_UP_TO} seconds (5 minutes).

USE SDK-COMPLIANT TIMEOUT:
✅ AgentOutputTool({ agentId: "${agentId}", block: true, wait_up_to: 300 })

LONG-RUNNING AGENT PATTERN (Re-check Strategy):
For agents expected to run longer than 5 minutes:
1. First call: wait_up_to: 300 (5 min max)
2. On timeout: Re-invoke with wait_up_to: 300
3. Repeat as needed based on expectedDuration metadata
4. After 2 consecutive timeouts with no progress, mark FAILED

See: prompts/memorandum-orchestrator.md "Long-Running Agent Pattern"`
        }
      };
    }
  }

  // ============================================
  // SECTION HEADER FORMAT ENFORCEMENT
  // ============================================
  // Prevent section files from being written with wrong header level (H1/H3 instead of H2)
  // This catches the issue at source, before it propagates to QA detection failures
  if (tool_name === 'Write' && tool_input?.file_path?.includes('section-IV-')) {
    const content = tool_input.content || '';
    const firstLine = content.split('\n')[0] || '';

    // Check for H1 header (wrong) - should be H2
    if (/^# IV\.[A-Z]/.test(firstLine)) {
      logStructured('section_header_violation', {
        timestamp: new Date().toISOString(),
        event: 'section_header_h1_blocked',
        tool: tool_name,
        file_path: tool_input.file_path,
        found_header: firstLine.substring(0, 60),
        session_id,
        tool_use_id: toolUseID || null
      });

      return {
        continue: true,
        hookSpecificOutput: {
          hookEventName: hook_event_name,
          permissionDecision: 'deny',
          permissionDecisionReason: `BLOCKED: Section header uses H1 ('#') instead of required H2 ('##').

FOUND: ${firstLine.substring(0, 60)}
REQUIRED FORMAT: ## IV.[X]. [SECTION TITLE]

The QA diagnostic searches for sections using pattern "^## IV\\.[A-Z]\\.".
Using H1 makes your section INVISIBLE to QA detection, causing false "missing section" errors.

FIX: Change the first line from:
  # IV.E. EMPLOYMENT & LABOR RELATIONS
to:
  ## IV.E. EMPLOYMENT & LABOR RELATIONS

Then retry the Write operation.`
        }
      };
    }

    // Check for H3 header (wrong) - should be H2
    if (/^### IV\.[A-Z]/.test(firstLine)) {
      logStructured('section_header_violation', {
        timestamp: new Date().toISOString(),
        event: 'section_header_h3_blocked',
        tool: tool_name,
        file_path: tool_input.file_path,
        found_header: firstLine.substring(0, 60),
        session_id,
        tool_use_id: toolUseID || null
      });

      return {
        continue: true,
        hookSpecificOutput: {
          hookEventName: hook_event_name,
          permissionDecision: 'deny',
          permissionDecisionReason: `BLOCKED: Section header uses H3 ('###') instead of required H2 ('##').

FOUND: ${firstLine.substring(0, 60)}
REQUIRED FORMAT: ## IV.[X]. [SECTION TITLE]

FIX: Change the first line from:
  ### IV.E. EMPLOYMENT & LABOR RELATIONS
to:
  ## IV.E. EMPLOYMENT & LABOR RELATIONS

Then retry the Write operation.`
        }
      };
    }

    // Check for missing period after section letter (e.g., "## IV.A CMS" instead of "## IV.A. CMS")
    if (/^## IV\.[A-Z][^.]/.test(firstLine)) {
      logStructured('section_header_violation', {
        timestamp: new Date().toISOString(),
        event: 'section_header_missing_period_blocked',
        tool: tool_name,
        file_path: tool_input.file_path,
        found_header: firstLine.substring(0, 60),
        session_id,
        tool_use_id: toolUseID || null
      });

      return {
        continue: true,
        hookSpecificOutput: {
          hookEventName: hook_event_name,
          permissionDecision: 'deny',
          permissionDecisionReason: `BLOCKED: Section header missing period after section letter.

FOUND: ${firstLine.substring(0, 60)}
REQUIRED FORMAT: ## IV.[X]. [SECTION TITLE] (note the period after the letter)

FIX: Add a period after the section letter. Change from:
  ## IV.A CMS REGULATORY COMPLIANCE
to:
  ## IV.A. CMS REGULATORY COMPLIANCE

Then retry the Write operation.`
        }
      };
    }
  }

  const entry = {
    timestamp: new Date().toISOString(),
    event: 'pre_tool_use',
    tool: tool_name,
    tool_type: toolType,
    session_id,
    tool_use_id: toolUseID || null
  };

  // Add tool-specific metadata
  if (toolType === 'code_execution') {
    entry.model_type = tool_input?.modelType || null;
    logStructured('code_execution_start', entry);
  } else if (toolType === 'mcp') {
    // Extract MCP server and action from tool name
    const mcpParts = tool_name?.split('__') || [];
    entry.mcp_server = mcpParts[1] || null;
    entry.mcp_action = mcpParts[2] || null;
    logStructured('mcp_tool_call', entry);
  } else if (!isHighFrequency) {
    // Log standard tools (except high-frequency read operations)
    logStructured('tool_call', entry);
  }

  // File-based audit trail for all tools
  appendAuditLog(session_id, entry);

  return { continue: true };
}

// ============================================
// POST-TOOL-USE HOOK
// ============================================
/**
 * Called after each tool completes execution.
 * Tracks Write tool calls to reports/ directory.
 * Calculates execution duration.
 *
 * @param {PostToolUseHookInput} input - Hook input with tool result
 * @param {string|undefined} toolUseID - Unique ID for this tool invocation
 * @param {Object} options - Options including AbortSignal
 * @returns {Promise<HookJSONOutput>} Always returns { continue: true }
 */
export async function postToolUseHandler(input, toolUseID, { signal }) {
  const { tool_name, tool_input, tool_response, session_id } = input;
  const toolType = getToolType(tool_name);
  const isHighFrequency = ['Read', 'Grep', 'Glob'].includes(tool_name);

  // Calculate duration if we tracked the start time
  const startTime = toolStartTimes.get(toolUseID);
  const duration_ms = startTime ? Date.now() - startTime : null;
  if (toolUseID) {
    toolStartTimes.delete(toolUseID); // Clean up
  }

  const entry = {
    timestamp: new Date().toISOString(),
    event: 'post_tool_use',
    tool: tool_name,
    tool_type: toolType,
    session_id,
    tool_use_id: toolUseID || null,
    duration_ms,
    success: !tool_response?.isError
  };

  // ============================================
  // REMEDIATION SCRIPT VALIDATION TRACKING
  // ============================================
  if (tool_name === 'Bash' && tool_input?.command) {
    const command = tool_input.command;

    // Detect remediation script execution
    const remediationScriptPatterns = [
      /execute-w\d+-\d+\.sh/,           // Wave task scripts
      /update_questions\.py/,            // Question reformatting
      /apply-creac-headers\.py/,         // CREAC header application
      /apply-wave\d+-.*\.py/,            // Wave-specific Python scripts
      /analyze-xrefs\.py/,               // Cross-reference matrix builder
      /detect-counter-analysis\.py/,     // Counter-analysis locator
      /extract-citations\.py/,           // P5-1: Citation extraction
      /scan-citation-tags\.py/,          // P5-2: Citation tag coverage
      /extract-fact-registry\.py/,       // P6-1: Fact registry extraction
      /aggregate-risk-tables\.py/,       // P6-2: Risk table aggregation
      /remediation-outputs.*\.(sh|py)$/  // Any script in remediation-outputs
    ];

    const isRemediationScript = remediationScriptPatterns.some(p => p.test(command));

    if (isRemediationScript) {
      const scriptMatch = command.match(/[\w\-]+\.(sh|py)/);
      const scriptName = scriptMatch ? scriptMatch[0] : 'unknown-script';

      // Store execution context for validation
      remediationScriptRegistry.set(scriptName, {
        command: command,
        executedAt: new Date().toISOString(),
        toolResult: tool_response,
        requiresValidation: true,
        validationChecks: []
      });

      logStructured('remediation_script_executed', {
        ...entry,
        event: 'remediation_script_executed',
        script_name: scriptName,
        requires_validation: true
      });

      // Return with validation reminder context
      const splitFileGuidance = getSplitFileGuidance(scriptName);
      return {
        continue: true,
        additionalContext: `
⚠️ REMEDIATION SCRIPT EXECUTED: ${scriptName}

MANDATORY NEXT STEPS:
1. Run validation grep/check to confirm changes applied
2. Update remediation-wave-state.json with validation_result
3. Do NOT proceed to next task until validation passes

Expected validation checks for this script:
${getValidationChecksForScript(scriptName)}
${splitFileGuidance ? `\n${splitFileGuidance}` : ''}
`
      };
    }

    // Check if this is a validation check following a remediation script
    const isValidationCheck = /grep.*final-memorandum\.md/.test(command) ||
                              /grep.*remediation/.test(command) ||
                              /wc -l/.test(command) ||
                              /wc -w/.test(command) ||
                              /jq\s+['".]/.test(command) ||       // jq validation for JSON outputs
                              /test\s+-f/.test(command) ||        // File existence checks
                              /ls.*counter-analysis-locations/.test(command);  // Per-section file listing

    // Record validation checks if they follow a remediation script execution
    if (isValidationCheck && remediationScriptRegistry.size > 0) {
      const lastScript = Array.from(remediationScriptRegistry.keys()).pop();
      const scriptEntry = remediationScriptRegistry.get(lastScript);

      if (scriptEntry?.requiresValidation) {
        scriptEntry.validationChecks = scriptEntry.validationChecks || [];
        scriptEntry.validationChecks.push({
          command: command,
          result: tool_response?.content?.substring(0, 500) || 'no result',
          timestamp: new Date().toISOString()
        });

        logStructured('remediation_validation_check', {
          ...entry,
          event: 'remediation_validation_check',
          script_name: lastScript,
          check_count: scriptEntry.validationChecks.length
        });

        return {
          continue: true,
          additionalContext: `
✓ Validation check recorded for ${lastScript}
Checks completed: ${scriptEntry.validationChecks.length}

Remember to update remediation-wave-state.json:
- task_registry[task_id].validation_result.passed = true/false
- task_registry[task_id].validation_result.checks = [list of checks]
`
        };
      }
    }
  }

  // Code execution specific logging
  if (toolType === 'code_execution') {
    entry.model_type = tool_input?.modelType || null;
    entry.has_result = !!tool_response;
    logStructured('code_execution_complete', entry);
  } else if (tool_name === 'Write' && tool_input?.file_path?.includes('/reports/')) {
    // Report save tracking
    const saves = sessionSaveLog.get(session_id) || [];
    saves.push({ path: tool_input.file_path, timestamp: entry.timestamp });
    sessionSaveLog.set(session_id, saves);

    entry.file_path = tool_input.file_path;
    entry.event = 'report_saved';
    entry.save_count = saves.length;
    logStructured('report_saved', entry);
  } else if (!isHighFrequency) {
    // Log completion for non-high-frequency tools
    logStructured('tool_complete', entry);
  }

  // File-based audit trail for all tools
  appendAuditLog(session_id, entry);

  return { continue: true };
}

// ============================================
// SUBAGENT START HOOK
// ============================================
/**
 * Called when a subagent is spawned.
 * Logs subagent lifecycle start for observability.
 *
 * @param {SubagentStartHookInput} input - Hook input with agent details
 * @param {string|undefined} toolUseID - Tool use ID that spawned this subagent
 * @param {Object} options - Options including AbortSignal
 * @returns {Promise<HookJSONOutput>} Always returns { continue: true }
 */
export async function subagentStartHandler(input, toolUseID, { signal }) {
  const { agent_id, agent_type, session_id } = input;

  const entry = {
    timestamp: new Date().toISOString(),
    event: 'subagent_start',
    agent_type: agent_type || null,
    agent_id,
    session_id,
    tool_use_id: toolUseID || null
  };

  // Categorize agent type for memorandum progress tracking
  if (agent_type?.includes('memo-section-writer')) {
    entry.memo_phase = 'section_generation';
  } else if (agent_type?.includes('memo-executive-summary')) {
    entry.memo_phase = 'executive_summary';
  } else if (agent_type?.includes('memo-synthesis') || agent_type?.includes('memo-integration')) {
    entry.memo_phase = 'synthesis';
  } else if (agent_type?.includes('researcher') || agent_type?.includes('specialist')) {
    entry.memo_phase = 'research';
  }

  logStructured('subagent_start', entry);
  appendAuditLog(session_id, entry);

  return { continue: true };
}

// ============================================
// SUBAGENT STOP HOOK
// ============================================
/**
 * Called when a subagent completes execution.
 * Verifies that the subagent saved a report to the reports/ directory.
 * Tracks memorandum generation progress.
 *
 * @param {SubagentStopHookInput} input - Hook input with transcript path
 * @param {string|undefined} toolUseID - Tool use ID for this subagent
 * @param {Object} options - Options including AbortSignal
 * @returns {Promise<HookJSONOutput>} Always returns { continue: true }
 */
export async function subagentStopHandler(input, toolUseID, { signal }) {
  const { agent_id, agent_transcript_path, agent_type, session_id } = input;

  const entry = {
    timestamp: new Date().toISOString(),
    event: 'subagent_stop',
    agent_type: agent_type || agent_id,
    agent_id,
    session_id,
    transcript_path: agent_transcript_path || null,
    tool_use_id: toolUseID || null
  };

  // Track memorandum section progress
  if (agent_type?.includes('memo-section-writer')) {
    entry.event = 'memo_section_complete';
    entry.memo_phase = 'section_generation';
    logStructured('memo_section_complete', entry);
  } else if (agent_type?.includes('memo-executive-summary')) {
    entry.event = 'memo_exec_summary_complete';
    entry.memo_phase = 'executive_summary';
    logStructured('memo_exec_summary_complete', entry);
  } else if (agent_type?.includes('memo-synthesis') || agent_type?.includes('memo-integration')) {
    entry.event = 'memo_synthesis_complete';
    entry.memo_phase = 'synthesis';
    logStructured('memo_synthesis_complete', entry);
  } else {
    logStructured('subagent_stop', entry);
  }

  // Verify report was saved by parsing transcript
  let reportVerified = false;
  try {
    if (agent_transcript_path) {
      const transcript = readFileSync(agent_transcript_path, 'utf-8');

      // Check if Write tool was called with a path containing 'reports/'
      const hasReportSave = transcript.includes('reports/') &&
                            (transcript.includes('"name":"Write"') ||
                             transcript.includes('"name": "Write"'));

      reportVerified = hasReportSave;
      entry.report_verified = hasReportSave;

      if (!hasReportSave) {
        entry.warning = 'No report saved';
        logStructured('subagent_warning', {
          ...entry,
          event: 'subagent_warning',
          message: `No report saved by ${agent_type || agent_id}`
        });
      }
    }
  } catch (err) {
    entry.verification_error = err.message;
  }

  appendAuditLog(session_id, entry);

  return { continue: true };
}

// ============================================
// POST-TOOL-USE-FAILURE HOOK
// ============================================
/**
 * Called when a tool execution fails.
 * Logs errors for debugging and monitoring.
 *
 * @param {PostToolUseFailureHookInput} input - Hook input with error details
 * @param {string|undefined} toolUseID - Unique ID for the failed tool invocation
 * @param {Object} options - Options including AbortSignal
 * @returns {Promise<HookJSONOutput>} Always returns { continue: true }
 */
export async function postToolUseFailureHandler(input, toolUseID, { signal }) {
  const { tool_name, tool_input, tool_use_id, error, is_interrupt, session_id } = input;
  const toolType = getToolType(tool_name);

  const entry = {
    timestamp: new Date().toISOString(),
    event: 'tool_failure',
    tool: tool_name,
    tool_type: toolType,
    session_id,
    tool_use_id: toolUseID || tool_use_id || null,
    error: error || 'Unknown error',
    is_interrupt: is_interrupt || false
  };

  // Include truncated input for debugging
  const inputStr = JSON.stringify(tool_input || {});
  entry.input_preview = inputStr.length > 300 ? inputStr.slice(0, 300) + '...' : inputStr;

  logStructured('tool_failure', entry);
  appendAuditLog(session_id, entry);

  return { continue: true };
}

// ============================================
// SESSION START HOOK
// ============================================
/**
 * Called when a session starts or resumes.
 * On resume/compact, verifies state files and injects warnings if unhealthy.
 * Aligns with documented protocol in memorandum-orchestrator.md Lines 298-302.
 *
 * @param {SessionStartHookInput} input - Hook input with session details
 * @param {string|undefined} toolUseID - Always undefined for SessionStart
 * @param {Object} options - Options including AbortSignal
 * @returns {Promise<HookJSONOutput>} Returns { continue: true, additionalContext?: string }
 */
export async function sessionStartHandler(input, toolUseID, { signal }) {
  const { session_id, transcript_path, source, cwd } = input;

  const entry = {
    timestamp: new Date().toISOString(),
    event: 'session_start',
    session_id,
    source, // 'startup' | 'resume' | 'clear' | 'compact'
    transcript_path: transcript_path || null,
    cwd: cwd || null
  };

  let additionalContext = null;

  // STATE FILE VERIFICATION ON RESUME/COMPACT
  if (source === 'resume' || source === 'compact') {
    entry.verification_attempted = true;

    try {
      const sessionDir = session_id?.match(/^\d{4}-\d{2}-\d{2}/)
        ? join('reports', session_id)
        : null;

      if (sessionDir) {
        const stateFilePaths = [
          join(sessionDir, 'synthesis-state.json'),
          join(sessionDir, 'orchestrator-state.json'),
          join(sessionDir, 'qa-outputs', 'remediation-wave-state.json')  // Hybrid workflow state tracking
        ];

        for (const statePath of stateFilePaths) {
          if (existsSync(statePath)) {
            const stateContent = JSON.parse(readFileSync(statePath, 'utf-8'));

            entry.state_file_found = statePath;
            entry.schema_version = stateContent.schema_version;
            entry.status = stateContent.status;

            const envHealthy = stateContent.environment_checks?.environment_healthy;
            entry.environment_healthy = envHealthy;

            if (envHealthy === false) {
              entry.verification_status = 'UNHEALTHY';
              additionalContext = buildUnhealthyWarning(statePath, stateContent);
              logStructured('session_start_unhealthy', { ...entry, event: 'session_start_unhealthy' });
            } else if (stateContent.blocking_issue?.resolution_status === 'UNRESOLVED') {
              entry.verification_status = 'BLOCKED';
              entry.blocking_type = stateContent.blocking_issue.type;
              additionalContext = buildBlockingWarning(statePath, stateContent.blocking_issue);
              logStructured('session_start_blocked', { ...entry, event: 'session_start_blocked' });
            } else {
              entry.verification_status = 'HEALTHY';
              if (stateContent.progress) {
                entry.items_complete = stateContent.progress.items_complete?.length || 0;
                entry.items_pending = stateContent.progress.items_pending?.length || 0;
                entry.current_item = stateContent.progress.current_item;
              }

              // Wave 6 prerequisite check - prevent ASSEMBLY-001 if Wave 5 incomplete
              if (stateContent.wave_status && stateContent.metrics?.current_wave === 6) {
                const wave5Status = stateContent.wave_status.wave_5?.status;
                const wave5Tasks = ['W5-001', 'W5-002', 'W5-003'];

                const unverifiedTasks = wave5Tasks.filter(taskId => {
                  const task = stateContent.task_registry?.[taskId];
                  return !task || task.validation_result?.passed !== true;
                });

                if (wave5Status !== 'completed' || unverifiedTasks.length > 0) {
                  entry.verification_status = 'WAVE6_BLOCKED';
                  entry.wave5_status = wave5Status || 'unknown';
                  entry.unverified_tasks = unverifiedTasks;

                  additionalContext = [
                    '## ⚠️ WAVE 6 BLOCKED: Prerequisites not met',
                    '',
                    `**Wave 5 Status**: ${wave5Status || 'unknown'}`,
                    `**Unverified Tasks**: ${unverifiedTasks.join(', ') || 'none'}`,
                    '',
                    '**DO NOT proceed with ASSEMBLY-001** until:',
                    '1. Wave 5 status == "completed"',
                    '2. W5-001, W5-002, W5-003 all have validation_result.passed == true',
                    '',
                    '**Action Required**: Complete remaining Wave 5 tasks before assembly.',
                    '',
                    `Read full state: ${statePath}`
                  ].join('\n');

                  logStructured('session_start_wave6_blocked', { ...entry, event: 'session_start_wave6_blocked' });
                }
              }
            }
            break;
          }
        }

        if (!entry.state_file_found) {
          entry.verification_status = 'NO_STATE_FILE';
        }
      }
    } catch (err) {
      entry.verification_error = err.message;
      entry.verification_status = 'ERROR';
    }
  }

  logStructured('session_start', entry);
  appendAuditLog(session_id, entry);

  if (additionalContext) {
    return { continue: true, additionalContext };
  }
  return { continue: true };
}

// ============================================
// SESSION END HOOK
// ============================================
/**
 * Called when a session ends (different from Stop).
 * Logs session cleanup and final metrics.
 *
 * @param {SessionEndHookInput} input - Hook input with session details
 * @param {string|undefined} toolUseID - Always undefined for SessionEnd
 * @param {Object} options - Options including AbortSignal
 * @returns {Promise<HookJSONOutput>} Always returns { continue: true }
 */
export async function sessionEndHandler(input, toolUseID, { signal }) {
  const { session_id, reason } = input;

  // Get session metrics
  const saves = sessionSaveLog.get(session_id) || [];

  const entry = {
    timestamp: new Date().toISOString(),
    event: 'session_end',
    session_id,
    reason, // 'clear' | 'logout' | 'prompt_input_exit' | 'other'
    total_reports_saved: saves.length
  };

  logStructured('session_end', entry);
  appendAuditLog(session_id, entry);

  // Clean up session tracking
  sessionSaveLog.delete(session_id);

  return { continue: true };
}

// ============================================
// PRE-COMPACT HOOK
// ============================================
/**
 * Called before context compaction occurs.
 * Reads state files and injects recovery context via additionalContext.
 * This ensures recovery instructions survive compaction (not paraphrased in summary).
 *
 * @param {PreCompactHookInput} input - Hook input with compaction details
 * @param {string|undefined} toolUseID - Always undefined for PreCompact
 * @param {Object} options - Options including AbortSignal
 * @returns {Promise<HookJSONOutput>} Returns { continue: true, additionalContext?: string }
 */
export async function preCompactHandler(input, toolUseID, { signal }) {
  const { session_id, trigger, custom_instructions } = input;

  const entry = {
    timestamp: new Date().toISOString(),
    event: 'pre_compact',
    session_id,
    trigger, // 'manual' | 'auto'
    has_custom_instructions: !!custom_instructions
  };

  let recoveryContext = null;

  // STATE FILE RECOVERY CONTEXT INJECTION
  try {
    const sessionDir = session_id?.match(/^\d{4}-\d{2}-\d{2}/)
      ? join('reports', session_id)
      : null;

    if (sessionDir && existsSync(sessionDir)) {
      const stateFiles = [];

      // Find state files in session directory
      const files = readdirSync(sessionDir).filter(f => f.endsWith('-state.json'));

      for (const file of files.slice(0, 3)) { // Limit to 3 most relevant
        try {
          const statePath = join(sessionDir, file);
          const stateContent = JSON.parse(readFileSync(statePath, 'utf-8'));

          if (stateContent.compaction_summary || stateContent.progress) {
            stateFiles.push({
              file,
              summary: stateContent.compaction_summary,
              progress: stateContent.progress,
              do_not_repeat: stateContent.recovery_instructions?.do_not_repeat
            });
          }
        } catch (err) {
          // Skip unreadable state files
        }
      }

      if (stateFiles.length > 0) {
        recoveryContext = buildRecoveryContext(stateFiles);
        entry.recovery_context_injected = true;
        entry.state_files_found = stateFiles.length;
      }
    }
  } catch (err) {
    entry.recovery_context_error = err.message;
  }

  logStructured('pre_compact', entry);
  appendAuditLog(session_id, entry);

  if (recoveryContext) {
    return { continue: true, additionalContext: recoveryContext };
  }
  return { continue: true };
}

// ============================================
// STOP HOOK (Agent Stop)
// ============================================
/**
 * Called when the agent stops execution.
 * Logs completion for observability.
 *
 * @param {StopHookInput} input - Hook input with session details
 * @param {string|undefined} toolUseID - Always undefined for Stop hook
 * @param {Object} options - Options including AbortSignal
 * @returns {Promise<HookJSONOutput>} Always returns { continue: true }
 */
export async function stopHandler(input, toolUseID, { signal }) {
  const { session_id, stop_hook_active } = input;

  const entry = {
    timestamp: new Date().toISOString(),
    event: 'agent_stop',
    session_id,
    stop_hook_active: stop_hook_active || false
  };

  logStructured('agent_stop', entry);
  appendAuditLog(session_id, entry);

  return { continue: true };
}

// ============================================
// USER PROMPT SUBMIT HOOK
// ============================================
/**
 * Called when a user submits a prompt.
 * Logs the query for audit trail - captures what initiated each session.
 *
 * @param {UserPromptSubmitHookInput} input - Hook input with prompt details
 * @param {string|undefined} toolUseID - Always undefined for UserPromptSubmit
 * @param {Object} options - Options including AbortSignal
 * @returns {Promise<HookJSONOutput>} Always returns { continue: true }
 */
export async function userPromptSubmitHandler(input, toolUseID, { signal }) {
  const { prompt, session_id } = input;

  const entry = {
    timestamp: new Date().toISOString(),
    event: 'user_prompt',
    session_id,
    prompt_length: prompt?.length || 0,
    // Store first 500 chars for audit (avoid logging huge prompts)
    prompt_preview: prompt?.slice(0, 500) || '',
    prompt_truncated: (prompt?.length || 0) > 500
  };

  logStructured('user_prompt', entry);
  appendAuditLog(session_id, entry);

  return { continue: true };
}

// ============================================
// NOTIFICATION HOOK
// ============================================
/**
 * Called when the agent emits status notifications.
 * Logs agent status updates for external monitoring.
 *
 * @param {NotificationHookInput} input - Hook input with notification details
 * @param {string|undefined} toolUseID - Always undefined for Notification
 * @param {Object} options - Options including AbortSignal
 * @returns {Promise<HookJSONOutput>} Always returns { continue: true }
 */
export async function notificationHandler(input, toolUseID, { signal }) {
  const { message, title, session_id, notification_type } = input;

  const entry = {
    timestamp: new Date().toISOString(),
    event: 'notification',
    session_id,
    notification_type: notification_type || 'status',
    title: title || 'Agent Status',
    message: message || ''
  };

  logStructured('notification', entry);
  appendAuditLog(session_id, entry);

  return { continue: true };
}

// ============================================
// PERMISSION REQUEST HOOK
// ============================================
/**
 * Called when a permission dialog would be displayed.
 * Enables programmatic permission handling for trusted operations.
 * Auto-approves writes to reports/ directory and trusted MCP servers.
 *
 * @param {PermissionRequestHookInput} input - Hook input with permission details
 * @param {string|undefined} toolUseID - Tool use ID requesting permission
 * @param {Object} options - Options including AbortSignal
 * @returns {Promise<HookJSONOutput>} Permission decision or continue
 */
export async function permissionRequestHandler(input, toolUseID, { signal }) {
  const { tool_name, tool_input, session_id, permission_suggestions, hook_event_name } = input;

  const entry = {
    timestamp: new Date().toISOString(),
    event: 'permission_request',
    tool: tool_name,
    session_id,
    tool_use_id: toolUseID || null
  };

  // Auto-allow writes to session's reports directory
  if (tool_name === 'Write' && tool_input?.file_path?.includes('/reports/')) {
    entry.decision = 'auto_allow';
    entry.reason = 'Trusted reports directory';
    logStructured('permission_auto_allow', entry);
    appendAuditLog(session_id, entry);

    return {
      hookSpecificOutput: {
        hookEventName: hook_event_name,
        permissionDecision: 'allow',
        permissionDecisionReason: 'Auto-approved: writes to reports/ directory'
      }
    };
  }

  // Auto-allow MCP tools from trusted servers
  if (tool_name?.startsWith('mcp__exa__') || tool_name?.startsWith('mcp__context7__')) {
    entry.decision = 'auto_allow';
    entry.reason = 'Trusted MCP server';
    logStructured('permission_auto_allow', entry);
    appendAuditLog(session_id, entry);

    return {
      hookSpecificOutput: {
        hookEventName: hook_event_name,
        permissionDecision: 'allow',
        permissionDecisionReason: 'Auto-approved: trusted MCP server'
      }
    };
  }

  // Defer to SDK for other permission requests
  entry.decision = 'defer_to_sdk';
  logStructured('permission_request', entry);
  appendAuditLog(session_id, entry);

  return { continue: true };
}

// ============================================
// HOOKS CONFIGURATION OBJECT
// ============================================
/**
 * Pre-built hooks configuration for use in agentQuery() options.
 * This follows the official HookCallbackMatcher[] structure.
 *
 * Usage:
 *   import { sdkHooksConfig } from '../hooks/sdkHooks.js';
 *   agentQuery({ prompt, options: { ...otherOptions, hooks: sdkHooksConfig } });
 *
 * Token-efficient approach:
 * - Console logging via logStructured() for real-time observability
 * - File-based audit trail via appendAuditLog() for persistence
 * - additionalContext used only when critical (state verification warnings, recovery context)
 * - PermissionRequest provides programmatic approval for trusted operations
 */
export const sdkHooksConfig = {
  // Tool lifecycle hooks
  PreToolUse: [{
    hooks: [preToolUseHandler]
  }],
  PostToolUse: [{
    hooks: [postToolUseHandler]
  }],
  PostToolUseFailure: [{
    hooks: [postToolUseFailureHandler]
  }],

  // Subagent lifecycle hooks
  SubagentStart: [{
    hooks: [subagentStartHandler]
  }],
  SubagentStop: [{
    hooks: [subagentStopHandler]
  }],

  // Session lifecycle hooks
  SessionStart: [{
    hooks: [sessionStartHandler]
  }],
  SessionEnd: [{
    hooks: [sessionEndHandler]
  }],
  Stop: [{
    hooks: [stopHandler]
  }],

  // Context management hooks
  PreCompact: [{
    hooks: [preCompactHandler]
  }],

  // User interaction hooks
  UserPromptSubmit: [{
    hooks: [userPromptSubmitHandler]
  }],

  // Status notification hooks
  Notification: [{
    hooks: [notificationHandler]
  }],

  // Permission handling hooks
  PermissionRequest: [{
    hooks: [permissionRequestHandler]
  }]
};
