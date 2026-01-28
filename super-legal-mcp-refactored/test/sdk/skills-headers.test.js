import { describe, test, expect } from '@jest/globals';
import { buildBetaHeader } from '../../src/utils/skillsRequestBuilder.js';

describe('Skills Beta Headers', () => {
  test('should include skills betas when requested', () => {
    const header = buildBetaHeader({ includeSkills: true });
    expect(header).toContain('code-execution-2025-08-25');
    expect(header).toContain('skills-2025-10-02');
    // Always includes thinking + fine-grained
    expect(header).toContain('interleaved-thinking-2025-05-14');
    expect(header).toContain('fine-grained-tool-streaming-2025-05-14');
  });

  test('should include structured outputs beta when requested', () => {
    const header = buildBetaHeader({ includeStructuredOutputs: true });
    expect(header).toContain('structured-outputs-2025-11-13');
  });

  test('should dedupe betas while preserving order', () => {
    const header = buildBetaHeader({
      includeStructuredOutputs: true,
      includeSkills: true
    });
    const parts = header.split(',');
    const unique = new Set(parts);
    expect(unique.size).toBe(parts.length);
  });
});

