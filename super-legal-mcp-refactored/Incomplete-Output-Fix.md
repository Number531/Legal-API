# Incomplete Output Issue - Research & Solutions

**Date:** December 12, 2025
**Project:** Super-Legal MCP Server
**Issue:** Model often does NOT fully output the complete legal memorandum until the user explicitly requests continuation after the first generation.

---

## Problem Statement

Users report that the Claude model frequently stops generating output before completing the full legal memorandum. The user must then explicitly request "continue" or "finish the document" to receive the remaining content.

This is problematic for legal research workflows where:
1. Incomplete memoranda are unusable
2. Manual continuation disrupts workflow
3. Continuations may have formatting inconsistencies
4. Users may not realize output is incomplete

---

## Research Methodology

Used Exa MCP to search official Anthropic documentation (December 2025):
- Claude API handling stop reasons
- Agent SDK truncation handling
- Prompt engineering for long-form output
- Best practices for complete responses

---

## Root Causes Identified (From Anthropic Documentation)

### 1. `max_tokens` Truncation

**What it is:** Claude stopped because it hit the `max_tokens` limit specified in the request.

**Current Configuration:**
```javascript
// claude-sdk-server.js:8
process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = '64000';

// claude-sdk-server.js:134
const MAX_TOKENS = Number(process.env.SDK_MAX_TOKENS || 64000);
```

**Detection:**
```json
{
  "stop_reason": "max_tokens",
  "usage": {
    "output_tokens": 64000
  }
}
```

**Why it happens:** Even with 64,000 tokens, a comprehensive legal memorandum with 150+ footnotes, 10 sections, and detailed analysis can exceed this limit.

---

### 2. `model_context_window_exceeded`

**What it is:** Claude stopped because it reached the model's context window limit. The context window includes BOTH input tokens AND output tokens.

**Detection:**
```json
{
  "stop_reason": "model_context_window_exceeded"
}
```

**Why it happens:** Large input (system prompt + tool results + conversation history) combined with large expected output can exceed the context window.

**Note:** This stop reason is available by default in Sonnet 4.5+ models. For earlier models, requires beta header `model-context-window-exceeded-2025-08-26`.

---

### 3. Empty Responses with `end_turn`

**What it is:** Claude returns an empty response (exactly 2-3 tokens with no content) with `stop_reason: "end_turn"`.

**Common causes:**
1. Adding text blocks immediately after tool results
2. Sending Claude's completed response back without adding anything

**From Anthropic docs:**
> "This typically happens when Claude interprets that the assistant turn is complete, particularly after tool results."

**Prevention (Correct Pattern):**
```python
# CORRECT: Send tool results directly without additional text
messages = [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": [{"type": "tool_use", ...}]},
    {"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": "...", "content": "..."}
    ]}  # Just the tool_result, no additional text
]
```

---

### 4. Behavioral Tendency to Stop Early

**What it is:** Claude models may have a learned tendency to stop generating when they perceive the output is "long enough" - even when instructed to continue.

**Why it happens:**
- Training data may have patterns of shorter responses
- Model may be optimizing for perceived "helpfulness" vs. completeness
- Safety training may encourage brevity in some contexts

**Mitigation:** Prompt engineering (already implemented in `prompts/active.md`)

---

## Existing Mitigations in System Prompt

The `prompts/active.md` file already contains extensive OUTPUT COMPLETION MANDATE instructions (lines 5-73):

```markdown
## OUTPUT COMPLETION MANDATE (CRITICAL - READ CAREFULLY)

**ABSOLUTE REQUIREMENT**: Generate the COMPLETE legal memorandum in a SINGLE response.
You have 64,000 output tokens available...

### PROHIBITED BEHAVIORS (VIOLATIONS WILL RENDER OUTPUT UNUSABLE):
❌ DO NOT say "I've reached my practical limit" - YOU HAVE NOT (64K tokens available)
❌ DO NOT say "given my token constraints" - THERE ARE NO MEANINGFUL CONSTRAINTS
❌ DO NOT ask "Would you like me to prioritize specific sections?" - NO, COMPLETE ALL SECTIONS
❌ DO NOT offer to "continue in a follow-up" - COMPLETE IT NOW
❌ DO NOT say "the complete memorandum would continue here" - ACTUALLY WRITE IT
❌ DO NOT provide a "framework" and then stop - PROVIDE THE FULL DOCUMENT
❌ DO NOT ask which areas to "focus on" or "expand" - EXPAND ALL AREAS FULLY
❌ DO NOT claim you need "Target-specific data" to continue - USE FRAMEWORK ANALYSIS

### REQUIRED BEHAVIOR:
✅ Generate the COMPLETE Executive Summary (Board Briefing) - ALL subsections
✅ Generate the COMPLETE Detailed Analysis - ALL 10 sections
✅ Generate ALL footnotes (minimum 100, typically 150-250)
✅ Generate the COMPLETE Cross-Reference Matrix
✅ Generate the COMPLETE Scenario Analysis
✅ Continue generating until the document is COMPLETE

### TOKEN REALITY CHECK:
- You have 64,000 output tokens available
- 15,000 words ≈ 20,000 tokens (with formatting)
- 20,000 words ≈ 27,000 tokens
- You can generate 2-3x the required content without hitting limits
```

**Conclusion:** The system prompt is well-configured. The issue is likely:
1. **Code-level issue** - `stop_reason` not being detected/handled
2. **Model behavior** - Prompt engineering alone cannot fully resolve

---

## Prompt File Configuration

**Important Discovery:**
```
prompts/active.md -> memorandum.md (symlink)
```

Only **ONE** prompt file is used when the frontend runs:
- `claude-sdk-server.js` loads `prompts/active.md` (lines 140-141)
- `active.md` is a symlink to `memorandum.md`
- `memorandum.md` is the 113KB comprehensive legal system prompt

Any prompt modifications should be made to **`prompts/memorandum.md`** (the actual file).

---

## Recommended Solutions

### Solution A: Prompt-Based Continuation Instruction (RECOMMENDED - SIMPLEST)

**File:** `prompts/memorandum.md`

Add a user-friendly continuation instruction that can be used when output is incomplete:

**Recommended Continuation Prompt:**
```
"PLEASE REVIEW THE EXISTING WORK, THEN FINISH THE COMPLETE GENERATION ENSURING GRANULAR, THOROUGH OUTPUT FULFILLING EXPECTATIONS"
```

**Implementation Options:**

1. **Frontend Button** - Add a "Complete Output" button that sends this continuation prompt
2. **System Prompt Addition** - Add continuation protocol to `memorandum.md`
3. **Auto-Detection** - Frontend detects truncation and shows continuation option

**Why This Works:**
- Simple, no code changes required to server
- Leverages Claude's ability to review and continue
- User-controlled (they decide when to continue)
- Clear instruction that emphasizes thoroughness

---

### Solution B: Server-Side Continuation Loop (HIGH IMPACT)

**File:** `src/server/claude-sdk-server.js`

**Concept:** Detect `stop_reason: "max_tokens"` and automatically send a continuation request.

**Implementation:**

```javascript
// Add after the result handling in the agentQuery loop (around line 774)

case 'result':
  // Check for truncation
  const isTruncated = message.stop_reason === 'max_tokens' ||
                      message.subtype === 'max_tokens' ||
                      message.stop_reason === 'model_context_window_exceeded';

  if (isTruncated && continuationCount < MAX_CONTINUATIONS) {
    continuationCount++;
    console.log(`⚠️ [AgentSDK] Response truncated (${message.stop_reason}) - continuation ${continuationCount}/${MAX_CONTINUATIONS}`);

    // Notify frontend
    send({
      type: 'continuation_requested',
      reason: message.stop_reason,
      attempt: continuationCount,
      timestamp: new Date().toISOString()
    });

    // Send continuation prompt
    // Note: With Agent SDK, this would require starting a new query with resume
    // The exact implementation depends on SDK session handling
  }

  // Continue with normal result handling...
```

**Note:** The Claude Agent SDK's `maxTurns` parameter (currently set to 100) handles multi-turn tool loops but NOT response truncation. Explicit continuation logic is needed.

---

### Solution B: Enhanced Prompt Instructions (MEDIUM IMPACT)

**File:** `prompts/active.md`

**Add continuation protocol section:**

```markdown
## CONTINUATION PROTOCOL (If Truncated)

If your output is cut off due to token limits, the system will automatically request continuation.
When you receive "Please continue from where you left off":

1. **Resume EXACTLY where you stopped** - no recap, no introduction
2. **Continue generating the remaining sections** - do not restart
3. **Maintain all formatting** - numbering, citation patterns, heading hierarchy
4. **Do NOT apologize or explain the truncation** - just continue
5. **Simply continue the document as if uninterrupted** - seamless continuation

### Continuation Response Format:
- Start with the EXACT next word/sentence where you left off
- If mid-section, continue that section
- If between sections, start the next section header
- Maintain footnote numbering sequence
```

---

### Solution C: Frontend Auto-Continuation (MEDIUM IMPACT)

**File:** `test/claude-playground.html`

**Concept:** Detect truncation in frontend and show a "Continue" button or auto-continue.

**Implementation:**

```javascript
// In handleEvent function, add to 'final' type handling:

if (data.type === 'final') {
  const isTruncated = data.stop_reason === 'max_tokens' ||
                      data.stop_reason === 'model_context_window_exceeded' ||
                      (data.usage?.output_tokens >= 60000);

  if (isTruncated) {
    console.log('⚠️ Response may be truncated:', data.stop_reason);

    // Show continuation UI
    const continueBtn = document.createElement('button');
    continueBtn.className = 'btn primary';
    continueBtn.textContent = 'Continue Response';
    continueBtn.onclick = () => {
      // Send continuation request
      sendQuery('Please continue from where you left off. Resume the document exactly where you stopped without any preamble or recap.');
    };

    // Append to transcript
    const warningDiv = document.createElement('div');
    warningDiv.className = 'system-message warning';
    warningDiv.innerHTML = '<strong>Response may be incomplete.</strong> Click below to request continuation.';
    warningDiv.appendChild(continueBtn);
    transcript.appendChild(warningDiv);
  }
}
```

**Additional UI improvements:**
- Progress indicator showing output token usage
- Auto-concatenation of multiple responses
- Warning when approaching token limits

---

### Solution D: Extended Thinking Budget (LOW IMPACT)

**File:** `src/server/claude-sdk-server.js`

**Concept:** Increase thinking tokens to give Claude more "planning" capacity before generating.

**Current:**
```javascript
maxThinkingTokens: 4096
```

**Recommended:**
```javascript
maxThinkingTokens: 16384  // 4x increase
```

**Rationale:** More thinking tokens allows Claude to better plan the document structure and allocate space for each section, potentially reducing premature stopping.

---

## Implementation Plan

### RECOMMENDED: Simple Frontend Button (Day 1)

**Simplest approach - add a "Complete Output" button to the frontend:**

1. **Add button to `test/claude-playground.html`:**
   ```javascript
   // Add after response completion
   const completeBtn = document.createElement('button');
   completeBtn.className = 'btn primary';
   completeBtn.textContent = 'Complete Output';
   completeBtn.onclick = () => {
     sendQuery('PLEASE REVIEW THE EXISTING WORK, THEN FINISH THE COMPLETE GENERATION ENSURING GRANULAR, THOROUGH OUTPUT FULFILLING EXPECTATIONS');
   };
   ```

2. **Show button when:**
   - Response ends
   - User perceives output is incomplete
   - Optional: Auto-detect via `stop_reason === 'max_tokens'`

3. **Benefits:**
   - Zero server changes
   - User-controlled
   - Works with existing session resume
   - Clear, actionable continuation prompt

---

### Alternative: Full Implementation (Days 1-3)

#### Phase 1: Server-Side Detection & Logging (Day 1)

1. **Add truncation detection** to `claude-sdk-server.js`:
   - Check `stop_reason` in result messages
   - Log all truncation events with context
   - Emit SSE event to frontend about truncation status

2. **Add monitoring**:
   - Track truncation rate in metrics
   - Log which queries trigger truncation

#### Phase 2: Frontend Continuation UI (Day 1-2)

1. **Add "Complete Output" button** to `claude-playground.html`:
   - Show when truncation detected OR always visible
   - Send the recommended continuation prompt
   - Append continued response to existing output

2. **Add progress indicator**:
   - Show output token count
   - Warning at 50,000+ tokens
   - Clear indicator when truncated

#### Phase 3: Auto-Continuation (Day 2-3)

1. **Implement auto-continuation** using session resume:
   - Detect truncation via `stop_reason`
   - Auto-send continuation prompt
   - Limit to 3 continuations max

2. **Response concatenation**:
   - Track partial responses
   - Ensure seamless concatenation
   - Handle edge cases (mid-word, mid-sentence)

#### Phase 4: Prompt Enhancement (Day 3)

1. **Add continuation protocol** to `prompts/memorandum.md`
2. **Test with various query types**
3. **Refine based on observed behavior**

---

## Files to Modify

### RECOMMENDED (Minimal Change)

| File | Changes | Priority |
|------|---------|----------|
| `test/claude-playground.html` | Add "Complete Output" button | HIGH |

### Alternative (Full Implementation)

| File | Changes | Priority |
|------|---------|----------|
| `test/claude-playground.html` | Add "Complete Output" button, auto-detection UI | HIGH |
| `src/server/claude-sdk-server.js` | Add stop_reason detection, SSE event | MEDIUM |
| `prompts/memorandum.md` | Add continuation protocol section | LOW |
| `src/utils/sdkMetrics.js` | Add truncation tracking metrics | LOW |

**Note:** `prompts/active.md` is a symlink to `memorandum.md` - modify the actual file.

---

## Verification Procedure

1. **Start server:**
   ```bash
   SUBAGENTS_ENABLED=true npm run sdk-server
   ```

2. **Submit test query requiring long output:**
   ```
   Generate a comprehensive M&A due diligence memorandum for the acquisition of
   TechCorp by MegaCorp. Include full analysis of CFIUS, privacy, cybersecurity,
   government contracts, IP, AI governance, employment, commercial, antitrust,
   and tax considerations with 150+ footnotes.
   ```

3. **Verify:**
   - [ ] System detects if truncation occurred
   - [ ] `stop_reason` is logged to console
   - [ ] Frontend shows truncation warning (if applicable)
   - [ ] "Continue" button appears
   - [ ] Continuation request works
   - [ ] Final output is complete and properly formatted
   - [ ] No duplicate sections between continuations
   - [ ] Footnote numbering is continuous

---

## Key Anthropic Documentation References

### Handling Stop Reasons
**URL:** https://docs.anthropic.com/en/api/handling-stop-reasons

### Stop Reason Values

| Value | Meaning | Action |
|-------|---------|--------|
| `end_turn` | Natural completion | None needed |
| `max_tokens` | Hit token limit | Continue generation |
| `stop_sequence` | Hit stop sequence | Check sequence |
| `tool_use` | Waiting for tool result | Execute tool |
| `pause_turn` | Server tool paused | Continue conversation |
| `refusal` | Safety refusal | Rephrase request |
| `model_context_window_exceeded` | Hit context limit | Response valid but limited |

### Official Continuation Pattern (Python)

```python
def get_complete_response(client, prompt, max_attempts=3):
    messages = [{"role": "user", "content": prompt}]
    full_response = ""

    for _ in range(max_attempts):
        response = client.messages.create(
            model="claude-sonnet-4-5",
            messages=messages,
            max_tokens=4096
        )

        full_response += response.content[0].text

        if response.stop_reason != "max_tokens":
            break

        # Continue from where it left off
        messages = [
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": full_response},
            {"role": "user", "content": "Please continue from where you left off."}
        ]

    return full_response
```

### Empty Response Prevention

```python
# INCORRECT: Adding text immediately after tool_result
messages = [
    {"role": "assistant", "content": [{"type": "tool_use", ...}]},
    {"role": "user", "content": [
        {"type": "tool_result", ...},
        {"type": "text", "text": "Here's the result"}  # DON'T DO THIS
    ]}
]

# CORRECT: Send tool results directly without additional text
messages = [
    {"role": "assistant", "content": [{"type": "tool_use", ...}]},
    {"role": "user", "content": [
        {"type": "tool_result", ...}
    ]}  # Just the tool_result, no additional text
]
```

---

## Alternative Approaches (For Future Consideration)

### 1. Agent SDK Built-in Continuation
Check if the Agent SDK has built-in continuation handling:

```javascript
options: {
  maxTurns: 100,
  maxOutputTokens: 64000,
  continueOnTruncation: true,  // Hypothetical - check SDK docs
}
```

### 2. Chunked Generation
Break the memorandum into sections and generate each separately:
- Generate Executive Summary
- Generate each of 10 sections individually
- Combine in frontend/backend

### 3. Pre-generation Planning
Ask Claude to outline the document first, then generate each section:
- Reduces chance of running out of tokens mid-section
- Allows better token allocation per section

---

## Conclusion

The incomplete output issue is primarily caused by:
1. **Token limit truncation** (`max_tokens` or context window)
2. **Model behavioral tendencies** to stop early

The system prompt already has strong anti-truncation instructions. The fix requires **code-level changes** to:
1. Detect truncation via `stop_reason`
2. Implement automatic continuation
3. Provide frontend UI for manual continuation

Priority implementation order:
1. Server-side truncation detection & logging
2. Frontend "Continue" button
3. Server-side auto-continuation loop
4. Prompt enhancement for continuation protocol

---

---

## Verification: Sources Confirmed from Anthropic

All solutions in this document are verified against official Anthropic sources:

| Solution | Official Source | URL |
|----------|----------------|-----|
| Check `stop_reason` field | Anthropic API Documentation | docs.anthropic.com/en/api/handling-stop-reasons |
| Handle `max_tokens` truncation | Anthropic API Documentation | docs.anthropic.com/en/api/handling-stop-reasons |
| Handle `model_context_window_exceeded` | Anthropic API Documentation | docs.anthropic.com/en/api/handling-stop-reasons |
| Continuation pattern | Official Cookbook | platform.claude.com/docs/en/resources/cookbook |
| Buffer accumulation for streaming | GitHub Issue #913 | github.com/eyaltoledano/claude-task-master/issues/913 |
| `--continue` / `--resume` CLI options | Claude Code SDK Documentation | SDK helpers.md |

### Official Code Pattern (Verified December 2025)

```python
# From: docs.anthropic.com/en/api/handling-stop-reasons
def get_max_possible_tokens(client, prompt):
    response = client.messages.create(
        model="claude-sonnet-4-5",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=64000  # Set to model's maximum output tokens
    )

    if response.stop_reason == "model_context_window_exceeded":
        print(f"Generated {response.usage.output_tokens} tokens (context limit reached)")
    elif response.stop_reason == "max_tokens":
        print(f"Generated {response.usage.output_tokens} tokens (max_tokens reached)")
    else:
        print(f"Generated {response.usage.output_tokens} tokens (natural completion)")

    return response.content[0].text
```

### Known SDK Issue Reference

GitHub Issue #913 documents similar truncation behavior in Claude Code SDK:
- JSON responses truncated at ~8,000-10,000 characters
- Error: `SyntaxError: Unterminated string in JSON at position 8000`
- Confirmed workaround: Buffer accumulation approach

---

*Document generated from research using Exa MCP on December 12, 2025*
*Sources verified against official Anthropic documentation (December 2025)*
