/**
 * Cost alert thresholds for SDK migration.
 * Ratios relative to baseline expected cost for a request.
 */

export const costAlertThresholds = {
  warn: 1.5,
  critical: 2.0,
  emergency: 3.0
};

export function getCostAlertLevel(currentCost, baselineCost) {
  if (!baselineCost || baselineCost <= 0) return 'unknown';
  const ratio = currentCost / baselineCost;
  if (ratio >= costAlertThresholds.emergency) return 'emergency';
  if (ratio >= costAlertThresholds.critical) return 'critical';
  if (ratio >= costAlertThresholds.warn) return 'warn';
  return 'normal';
}

