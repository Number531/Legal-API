# WAVE STATE MANAGEMENT

## State File Location

`{session_directory}/qa-outputs/remediation-wave-state.json`

---

## Schema: remediation-wave-state.json

```json
{
  "agent": "memo-remediation-writer",
  "schema_version": "1.0",
  "session_directory": "<path>",
  "status": "in_progress|completed|blocked",
  "started_at": "<ISO timestamp>",
  "last_updated": "<ISO timestamp>",

  "compaction_summary": {
    "task": "Execute 6-wave remediation for final memorandum",
    "progress": "Wave 3, 5/8 tasks complete",
    "next_action": "Complete W3-006: Apply CREAC headers to Section IV.F",
    "critical_context": ["12 questions need reformatting", "31 CREAC headers required"]
  },

  "environment_checks": {
    "on_resume": [
      "Read remediation-wave-state.json",
      "Verify remediation-dispatch.md exists",
      "Check final-memorandum.md file size",
      "Verify no incomplete script executions"
    ],
    "last_verified": "<ISO timestamp>",
    "environment_healthy": true
  },

  "blocking_issue": {
    "type": "FILE_SIZE_LIMIT | SCRIPT_FAILURE | VALIDATION_FAILED | null",
    "task_id": "<task that caused block>",
    "description": "<what went wrong>",
    "resolution_status": "UNRESOLVED | RESOLVED | null",
    "resolution_method": "<how to fix>",
    "workaround_applied": false
  },

  "wave_status": {
    "wave_1": { "status": "pending|in_progress|completed|blocked", "tasks": [], "completed_at": null },
    "wave_2": { "status": "pending|in_progress|completed|blocked", "tasks": [], "completed_at": null },
    "wave_3": { "status": "pending|in_progress|completed|blocked", "tasks": [], "completed_at": null },
    "wave_4": { "status": "pending|in_progress|completed|blocked", "tasks": [], "completed_at": null },
    "wave_5": { "status": "pending|in_progress|completed|blocked", "tasks": [], "completed_at": null },
    "wave_6": { "status": "pending|in_progress|completed|blocked", "tasks": [], "completed_at": null }
  },

  "task_registry": {
    "<task_id>": {
      "wave": 1,
      "priority": "CRITICAL|HIGH|MEDIUM|LOW",
      "status": "pending|in_progress|completed|failed|verified",
      "description": "<task description from dispatch>",
      "target_section": "<section reference>",

      "is_script_task": false,
      "script_path": "<path to execution script if applicable>",
      "script_command": "<full command line executed>",
      "script_exit_code": null,
      "script_output_files": [],
      "script_executed_at": null,

      "validation_result": {
        "passed": true,
        "checks": [
          { "command": "grep ...", "expected": "...", "actual": "...", "passed": true }
        ],
        "errors": []
      },
      "started_at": "<ISO timestamp>",
      "completed_at": "<ISO timestamp>"
    }
  },

  "wave_dependencies": {
    "wave_2": ["wave_1"],
    "wave_3": ["wave_2"],
    "wave_4": ["wave_3"],
    "wave_5": ["wave_4"],
    "wave_6": ["wave_4", "wave_5"]
  },

  "recovery_instructions": {
    "on_compaction": "Read remediation-wave-state.json FIRST. Check wave_status for current wave. Resume from first task with status 'pending' in current wave.",
    "do_not_repeat": ["W1-001", "W1-002", "W2-001"],
    "verified_tasks": ["W1-001", "W1-002"]
  },

  "metrics": {
    "total_tasks": 0,
    "tasks_completed": 0,
    "tasks_verified": 0,
    "tasks_failed": 0,
    "waves_completed": 0,
    "current_wave": 1,
    "scripts_executed": 0,
    "validation_checks_run": 0,
    "last_checkpoint": "<ISO timestamp>"
  },

  "errors": []
}
```

---

## Script Task Examples

```json
{
  "W3-000-PRECHECK": {
    "wave": 3,
    "priority": "CRITICAL",
    "status": "completed",
    "description": "Pre-QA validation check",
    "is_script_task": true,
    "script_path": "scripts/pre-qa-validate.py",
    "script_command": "python3 scripts/pre-qa-validate.py final-memorandum.md",
    "script_exit_code": 0,
    "script_output_files": [],
    "script_executed_at": "2026-01-24T12:00:00Z",
    "validation_result": { "passed": true, "checks": [] }
  },
  "W3-PROVISION-SCAN": {
    "wave": 3,
    "priority": "CRITICAL",
    "status": "completed",
    "description": "Identify HIGH/CRITICAL findings missing provisions",
    "is_script_task": true,
    "script_path": "scripts/validate-provisions.py",
    "script_command": "python3 scripts/validate-provisions.py final-memorandum.md",
    "script_exit_code": 1,
    "script_output_files": ["provision-gaps.json"],
    "script_executed_at": "2026-01-24T12:05:00Z",
    "validation_result": { "passed": false, "coverage_percentage": 85.7 }
  }
}
```

---

## State Transitions

| From | To | Trigger |
|------|----|---------|
| pending | in_progress | Task/wave starts execution |
| in_progress | completed | All success criteria met |
| in_progress | failed | Unrecoverable error |
| in_progress | blocked | Blocking issue encountered |
| failed | in_progress | Retry initiated |
| blocked | in_progress | Blocking issue resolved |

---

## State Update Protocol

After completing each task:
1. Update `task_registry[task_id].status = "completed"`
2. Update `task_registry[task_id].completed_at = <timestamp>`

After validating each task:
1. Update `task_registry[task_id].validation_result`
2. If passed, update `task_registry[task_id].status = "verified"`
3. Add task_id to `recovery_instructions.do_not_repeat`

After all tasks in wave verified:
1. Update `wave_status[wave_N].status = "completed"`
2. Update `wave_status[wave_N].completed_at = <timestamp>`
3. Increment `metrics.waves_completed`
4. Update `metrics.current_wave` to next wave

Write state file after EVERY status change (atomic updates).

---

## When to Write State File

| Event | Action |
|-------|--------|
| Session start | Write initial state with all tasks from remediation-dispatch.md |
| Wave start | Update `wave_status[wave_N].status = "in_progress"` |
| Task start | Update `task_registry[task_id].status = "in_progress"`, `started_at` |
| Task complete | Update `task_registry[task_id].status = "completed"`, `completed_at` |
| Validation run | Update `task_registry[task_id].validation_result` |
| Task verified | Update `task_registry[task_id].status = "verified"`, add to `do_not_repeat` |
| Wave complete | Update `wave_status[wave_N].status = "completed"`, `completed_at` |
| Any error | Add to `errors` array with timestamp and context |
| Blocking issue | Update `blocking_issue` object with details |

**CRITICAL**: Always update `last_updated` and `compaction_summary.next_action` on every write.

---

## Compaction Recovery Protocol

On context compaction or agent resume:

### Step 1: Read State File FIRST (MANDATORY)
```
Read: {session_directory}/qa-outputs/remediation-wave-state.json
```

### Step 2: Identify What NOT to Repeat
- Check `recovery_instructions.do_not_repeat` - Skip completed tasks
- Check `wave_status` - Skip completed waves
- Check `task_registry[task_id].status` - Skip tasks with status "verified"

### Step 3: Resume from Correct Position
- Use `compaction_summary.next_action` for immediate guidance
- Use `metrics.current_wave` to identify active wave
- Continue from first task with status "pending" in current wave

### Step 4: Verify Environment Before Resume
- Check `environment_checks.environment_healthy`
- If false, use file inspection fallback
- If `blocking_issue.resolution_status = "UNRESOLVED"`, resolve before continuing

### Step 5: State File Not Found Recovery

If remediation-wave-state.json does NOT exist, use file inspection:
```bash
# Get task list
Read: qa-outputs/remediation-dispatch.md

# Count completed tasks
Glob: remediation-outputs/*.md

# Identify verified tasks
Grep: "STATUS: SUCCESS" remediation-outputs/
```

Then create remediation-wave-state.json from discovered state before proceeding.

---

## File Size Awareness (Large File Handling)

Before attempting to Read or Edit any file:

1. **Check file size**: `ls -la <filepath>` or `wc -c < <filepath>`
2. **If > 500KB**: DO NOT use Read/Edit tools directly
   - Use section extraction (sed) for targeted reads
   - Use Python scripts for modifications
   - See LARGE FILE PROCESSING PROTOCOL in memorandum-orchestrator.md

3. **For final-memorandum.md specifically**:
   - ALWAYS assume it exceeds tool limits (~1.1-1.2MB typical)
   - ALWAYS use script-based or section-extraction approach
   - NEVER attempt full-file Read/Edit

4. **Validation after chunked processing**:
   - grep for expected content
   - wc -l to verify line counts
   - diff if backup exists

### Large File Processing Strategies

**Section Extraction** (preferred for markdown):
```bash
# Extract specific section by header
sed -n '/^## IV\.A\. /,/^## IV\.B\. /p' final-memorandum.md > section-IV-A.md

# Process extracted section with Edit tool
# Then merge back using sed replacement
```

**Line-Range Extraction**:
```bash
# Get specific line range
sed -n '500,700p' final-memorandum.md > chunk-500-700.md

# Edit chunk, then replace in original
sed -i '' '500,700d' final-memorandum.md  # Delete old
sed -i '' '499r chunk-500-700.md' final-memorandum.md  # Insert new
```

**Script-Based Modification** (for complex changes):
- Create Python script that reads/modifies/writes directly
- Bypass SDK tool limits entirely
- Execute via Bash tool
- Validate with grep checks
