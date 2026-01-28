const metrics = {
  invocations: {},
  failures: {},
  quotaBreaches: {},
  latencyMs: {},
  outputBytes: {}
};

function bump(map, key) {
  if (!map[key]) map[key] = 0;
  map[key] += 1;
}

function pushMetric(map, key, value) {
  if (!map[key]) map[key] = [];
  map[key].push(value);
  // Keep last 100 samples to bound memory
  if (map[key].length > 100) map[key] = map[key].slice(-100);
}

export function recordSkillInvocation(skillId, latencyMs = null, outputBytes = null) {
  bump(metrics.invocations, skillId);
  if (latencyMs != null) pushMetric(metrics.latencyMs, skillId, latencyMs);
  if (outputBytes != null) pushMetric(metrics.outputBytes, skillId, outputBytes);
}

export function recordSkillFailure(skillId) {
  bump(metrics.failures, skillId);
}

export function recordSkillQuotaBreach(skillId) {
  bump(metrics.quotaBreaches, skillId);
}

export function getSkillMetrics() {
  return {
    invocations: { ...metrics.invocations },
    failures: { ...metrics.failures },
    quotaBreaches: { ...metrics.quotaBreaches },
    latencyMs: { ...metrics.latencyMs },
    outputBytes: { ...metrics.outputBytes }
  };
}

