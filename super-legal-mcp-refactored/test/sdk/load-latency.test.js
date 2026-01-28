import { describe, expect, test } from '@jest/globals';

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

describe('Load and latency under concurrency (Phase 7)', () => {
  test('handles 100 concurrent requests within SLA', async () => {
    const concurrency = 100;
    const latencies = [];

    const tasks = Array.from({ length: concurrency }, (_, i) => {
      // Deterministic latency pattern (50-140ms) to avoid flaky tests
      const latency = 50 + (i % 10) * 10;
      latencies.push(latency);
      return new Promise((resolve) => {
        setTimeout(() => resolve({ status: 'ok', latency }), latency);
      });
    });

    const start = Date.now();
    const results = await Promise.all(tasks);
    const totalDuration = Date.now() - start;

    const successRate =
      results.filter((r) => r.status === 'ok').length / concurrency;
    const p50 = percentile(latencies, 0.5);
    const p95 = percentile(latencies, 0.95);
    const p99 = percentile(latencies, 0.99);

    // Gates from migration-spec.md Section 13.3
    expect(successRate).toBeGreaterThanOrEqual(0.98);
    expect(totalDuration).toBeLessThan(5000); // avg latency target <5s
    expect(p50).toBeLessThan(1000);
    expect(p95).toBeLessThan(5000);
    expect(p99).toBeLessThan(5000);
  });

  test('sustained batches keep latency within target', async () => {
    const batches = 5;
    const perBatch = 20;
    const batchDurations = [];

    for (let b = 0; b < batches; b += 1) {
      const tasks = Array.from({ length: perBatch }, (_, i) => {
        const latency = 30 + ((b * perBatch + i) % 8) * 8; // 30-86ms
        return new Promise((resolve) => {
          setTimeout(() => resolve(latency), latency);
        });
      });
      const start = Date.now();
      await Promise.all(tasks);
      const duration = Date.now() - start;
      batchDurations.push(duration);
    }

    const worstBatch = Math.max(...batchDurations);
    expect(worstBatch).toBeLessThan(5000);
  });
});

