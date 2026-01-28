export function shouldRouteToSdk(flags, rand = Math.random) {
  if (!flags?.SDK_TOOL_RUNNER) return false;
  const pct = Number(flags.CANARY_PCT || 0);
  if (!Number.isFinite(pct) || pct <= 0) return false;
  return rand() < pct / 100;
}

