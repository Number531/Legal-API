import { describe, expect, test, beforeEach } from '@jest/globals';
import { enforceSkillQuota, resetSkillQuotas } from '../../src/middleware/skillsQuotaEnforcer.js';

describe('Skills quota enforcement', () => {
  beforeEach(() => resetSkillQuotas());

  test('allows requests under limits', () => {
    const result = enforceSkillQuota({ userId: 'u1', skillName: 'sec_filing_extractor' });
    expect(result.allowed).toBe(true);
  });

  test('blocks after exceeding hourly limit', () => {
    let last;
    for (let i = 0; i < 61; i += 1) {
      last = enforceSkillQuota({ userId: 'u1', skillName: 'sec_filing_extractor' });
    }
    expect(last.allowed).toBe(false);
    expect(last.reason).toBe('quota_exceeded');
  });
});

