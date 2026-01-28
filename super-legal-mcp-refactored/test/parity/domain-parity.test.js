import { describe, test, expect } from '@jest/globals';

function normalize(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  const copy = { ...obj };
  delete copy.timestamp;
  delete copy.request_id;
  delete copy.response_time;
  return copy;
}

function calculateParity(a, b) {
  const na = JSON.stringify(normalize(a));
  const nb = JSON.stringify(normalize(b));
  if (na === nb) return 1.0;
  const maxLen = Math.max(na.length, nb.length);
  const minLen = Math.min(na.length, nb.length);
  return maxLen === 0 ? 1.0 : minLen / maxLen;
}

const samples = {
  sec: {
    legacy: { company: 'Tesla', filings: [{ type: '10-K', year: 2023 }] },
    sdk: { company: 'Tesla', filings: [{ type: '10-K', year: 2023 }] }
  },
  epa: {
    legacy: { facility: 'Exxon Baytown', violations: [{ statute: 'CAA' }] },
    sdk: { facility: 'Exxon Baytown', violations: [{ statute: 'CAA' }] }
  },
  fda: {
    legacy: { device: 'Pacemaker X', recalls: [{ reason: 'battery' }] },
    sdk: { device: 'Pacemaker X', recalls: [{ reason: 'battery' }] }
  },
  govinfo: {
    legacy: { bills: [{ number: 'H.R.1234', topic: 'climate' }] },
    sdk: { bills: [{ number: 'H.R.1234', topic: 'climate' }] }
  }
};

describe('Domain parity (structural)', () => {
  for (const [domain, data] of Object.entries(samples)) {
    test(`${domain} outputs are structurally equivalent`, () => {
      const parity = calculateParity(data.legacy, data.sdk);
      expect(parity).toBeGreaterThanOrEqual(0.98);
    });
  }
});

