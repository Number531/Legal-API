import { skillQuotas } from '../config/skillsQuotas.js';
import { recordSkillQuotaBreach } from '../utils/skillsMetrics.js';

// Simple in-memory counters; replace with Redis for production.
const counters = new Map(); // key: `${user}:${skill}`

function getKey(userId, skillName) {
  return `${userId || 'anon'}:${skillName}`;
}

function increment(key, windowMs) {
  const now = Date.now();
  let entry = counters.get(key);
  if (!entry || entry.expiresAt < now) {
    entry = { count: 0, expiresAt: now + windowMs };
  }
  entry.count += 1;
  counters.set(key, entry);
  return entry;
}

export function enforceSkillQuota({ userId, skillName }) {
  const quota = skillQuotas[skillName] || skillQuotas.__default;
  if (!quota) return { allowed: true };

  const key = getKey(userId, skillName);
  const hourly = increment(key + ':hour', 60 * 60 * 1000);
  const daily = increment(key + ':day', 24 * 60 * 60 * 1000);

  if (hourly.count > quota.hourlyLimit || daily.count > quota.dailyLimit) {
    recordSkillQuotaBreach(skillName);
    return {
      allowed: false,
      reason: 'quota_exceeded',
      hourlyCount: hourly.count,
      dailyCount: daily.count,
      limits: { hourly: quota.hourlyLimit, daily: quota.dailyLimit }
    };
  }

  return {
    allowed: true,
    hourlyCount: hourly.count,
    dailyCount: daily.count,
    limits: { hourly: quota.hourlyLimit, daily: quota.dailyLimit }
  };
}

export function resetSkillQuotas() {
  counters.clear();
}

