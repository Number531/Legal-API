/**
 * Canary configuration and rollout thresholds.
 * Derived from migration-spec.md Section 12 (Phase 4) and Section 14 (parity gates).
 */

const DEFAULT_TIERS = [
  { percent: 5,  minDurationMinutes: 60,  label: 'initial' },
  { percent: 25, minDurationMinutes: 240, label: 'domain-validation' },
  { percent: 50, minDurationMinutes: 1440, label: 'stability' },
  { percent: 75, minDurationMinutes: 1440, label: 'near-full' },
  { percent: 100, minDurationMinutes: 10080, label: 'full' } // 1 week
];

const ROLLBACK_THRESHOLDS = {
  parityMin: 0.95, // output parity
  latencyRegressionMaxPct: 20, // P95 regression vs baseline
  errorRateMaxMultiple: 2, // error rate doubles vs baseline
  breakerTripIncreaseAllowed: 0 // no increase
};

/**
 * Simple sticky bucket: hashes an identifier to a value 0-99 for consistent routing.
 */
function stickyBucket(identifier = '') {
  let hash = 0;
  for (let i = 0; i < identifier.length; i += 1) {
    hash = (hash * 31 + identifier.charCodeAt(i)) >>> 0;
  }
  return hash % 100;
}

function isWithinCanary(bucket, canaryPct) {
  const pct = Number.isFinite(canaryPct) ? canaryPct : 0;
  return bucket < Math.max(0, Math.min(100, pct));
}

/**
 * Decide routing for a request, given a stable identifier (user/session/requestId).
 */
function shouldRouteToSdk({ identifier, canaryPct }) {
  const bucket = stickyBucket(identifier || '');
  return isWithinCanary(bucket, canaryPct);
}

/**
 * Evaluate rollback thresholds against current metrics snapshot.
 */
function shouldRollback(metrics = {}) {
  const {
    parity = 1,
    latencyRegressionPct = 0,
    errorRateMultiple = 1,
    breakerTripDelta = 0
  } = metrics;

  if (parity < ROLLBACK_THRESHOLDS.parityMin) return true;
  if (latencyRegressionPct > ROLLBACK_THRESHOLDS.latencyRegressionMaxPct) return true;
  if (errorRateMultiple > ROLLBACK_THRESHOLDS.errorRateMaxMultiple) return true;
  if (breakerTripDelta > ROLLBACK_THRESHOLDS.breakerTripIncreaseAllowed) return true;
  return false;
}

/**
 * Return canonical rollout tiers; allows env overrides.
 */
function getTiers() {
  return DEFAULT_TIERS;
}

export {
  getTiers,
  shouldRouteToSdk,
  shouldRollback,
  stickyBucket,
  ROLLBACK_THRESHOLDS
};


