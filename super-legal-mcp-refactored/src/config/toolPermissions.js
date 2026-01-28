/**
 * Route-based tool permission configuration.
 * Adjust allowlists as new routes are added.
 */
export const TOOL_PERMISSIONS = {
  '/api/research': {
    allowedTools: [], // empty means allow all known tools
    disallowedTools: [],
    parallelExecution: true
  },
  '/api/stream': {
    allowedTools: [],
    disallowedTools: [],
    parallelExecution: true
  }
};

export function filterToolsByPermissions(allTools = [], route = '') {
  const perms = TOOL_PERMISSIONS[route];
  if (!perms) return allTools;

  const { allowedTools = [], disallowedTools = [] } = perms;

  const filtered = allTools.filter((tool) => {
    if (disallowedTools.includes('*')) return false;
    if (disallowedTools.includes(tool.name)) return false;
    if (allowedTools.length === 0) return true;
    return allowedTools.includes(tool.name);
  });

  return filtered;
}

export function isParallelAllowed(route = '') {
  const perms = TOOL_PERMISSIONS[route];
  if (!perms) return true;
  return perms.parallelExecution !== false;
}

