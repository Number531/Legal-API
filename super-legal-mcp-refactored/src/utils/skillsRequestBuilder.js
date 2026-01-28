import { getEnabledManagedSkills } from '../skills/managedSkillsConfig.js';

function normalizeCustomSkill(skill) {
  return {
    type: 'custom',
    name: skill.name,
    description: skill.description,
    instructions: skill.instructions,
    language: skill.language,
    code: skill.code,
    sandbox: skill.sandbox
  };
}

/**
 * Build the container.skills array combining Anthropic managed skills and custom skills.
 * Managed: { type: 'anthropic', skill_id: 'pdf' }
 * Custom: { type: 'custom', name, description, instructions, language, code, sandbox }
 */
export function buildSkillsContainer(customSkills = []) {
  const enabledManaged = getEnabledManagedSkills().map((skill_id) => ({
    type: 'anthropic',
    skill_id
  }));
  const enabledCustom = (customSkills || []).map(normalizeCustomSkill);
  const combined = [...enabledManaged, ...enabledCustom];
  return combined.length ? combined : null;
}

/**
 * Compute beta headers for a request, adding structured outputs and skills.
 * Returns a comma-joined string or undefined if no betas are needed.
 */
export function buildBetaHeader({
  includeStructuredOutputs = false,
  includeSkills = false,
  includeExtendedContext = false,
  includeContextManagement = true
} = {}) {
  const betas = [
    'interleaved-thinking-2025-05-14',
    'fine-grained-tool-streaming-2025-05-14'
  ];

  if (includeStructuredOutputs) {
    betas.push('structured-outputs-2025-11-13');
  }
  if (includeSkills) {
    betas.push('code-execution-2025-08-25', 'skills-2025-10-02');
  }
  if (includeExtendedContext) {
    betas.push('context-1m-2025-08-07');
  }
  if (includeContextManagement) {
    betas.push('context-management-2025-06-27');
  }

  // Deduplicate while preserving order
  const seen = new Set();
  const unique = betas.filter((b) => {
    if (seen.has(b)) return false;
    seen.add(b);
    return true;
  });

  return unique.length ? unique.join(',') : undefined;
}

/**
 * Build context_management configuration for automatic context window management.
 * Uses SDK-native context editing to clear old tool results when approaching token limits.
 * Per Anthropic best practices (Jan 2026): clear_thinking must be listed FIRST.
 *
 * @param {Object} options
 * @param {number} options.triggerTokens - Token count at which clearing begins (default: 500000, optimized for 1M context window per Anthropic cookbook)
 * @param {number} options.keepToolUses - Number of recent tool interactions to preserve (default: 10)
 * @param {number} options.keepThinkingTurns - Number of thinking turns to preserve (default: 10)
 * @param {string[]} options.excludeTools - Tools exempt from clearing (default: ['Write', 'Edit'])
 * @returns {Object} context_management configuration for API request
 */
export function buildContextManagement({
  triggerTokens = 500000,
  keepToolUses = 10,
  keepThinkingTurns = 10,
  excludeTools = ['Write', 'Edit']
} = {}) {
  return {
    edits: [
      {
        type: 'clear_thinking_20251015',
        keep: { type: 'thinking_turns', value: keepThinkingTurns }
      },
      {
        type: 'clear_tool_uses_20250919',
        trigger: { type: 'input_tokens', value: triggerTokens },
        keep: { type: 'tool_uses', value: keepToolUses },
        exclude_tools: excludeTools
      }
    ]
  };
}

