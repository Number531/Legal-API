/**
 * Feature flags for the SDK migration.
 * Values are sourced from environment variables with safe defaults.
 */

const envBool = (value, defaultValue) =>
  value === undefined ? defaultValue : value === 'true';

export const featureFlags = {
  // Default ON for cutover; can disable via env for emergency rollback
  SDK_TOOL_RUNNER: envBool(process.env.SDK_TOOL_RUNNER, true),
  SDK_STREAMING: envBool(process.env.SDK_STREAMING, true),
  STRUCTURED_OUTPUTS: envBool(process.env.STRUCTURED_OUTPUTS, true),
  // Custom skills disabled: Non-SDK-compliant format with no-op code.
  // Subagents handle all domain expertise. Managed skills (pdf, xlsx, docx) still work.
  // Files preserved in /src/skills/customSkills/ for future SDK-compliant conversion.
  // See: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
  SKILLS_ENABLED: envBool(process.env.SKILLS_ENABLED, false),
  EXTENDED_CONTEXT: envBool(process.env.EXTENDED_CONTEXT, false),
  // Agent SDK multi-turn mode - enables automatic tool execution loop
  USE_AGENT_SDK: envBool(process.env.USE_AGENT_SDK, true),
  // Legal domain subagents for specialized research
  SUBAGENTS_ENABLED: envBool(process.env.SUBAGENTS_ENABLED, true),
  // Split memorandum.md into specialized sub-files for optimized context injection
  // See: docs/split-memorandum.md v3.0
  USE_SPLIT_PROMPTS: envBool(process.env.USE_SPLIT_PROMPTS, false),
  // Default 100% canary for full cutover; override via env if needed
  CANARY_PCT: Number(process.env.CANARY_PCT ?? 100),
  PRESERVE_GRACE_PERIOD: Number(process.env.PRESERVE_GRACE_PERIOD || 0)
};

// Model constants for selection logic
export const OPUS_4_5_MODEL = 'claude-opus-4-5-20251101';

