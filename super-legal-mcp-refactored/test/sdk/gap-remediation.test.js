import { describe, it, expect } from '@jest/globals';
import { buildBetaHeader } from '../../src/utils/skillsRequestBuilder.js';
import { mapExceptionToCode, ERROR_CODES } from '../../src/utils/sdkErrorTaxonomy.js';
import { createSdkStreamHandler } from '../../src/utils/sdkStreamHandler.js';

describe('Gap Remediation', () => {
  it('buildBetaHeader includes context-1m when requested', () => {
    const header = buildBetaHeader({ includeExtendedContext: true });
    expect(header.split(',')).toContain('context-1m-2025-08-07');
  });

  it('mapExceptionToCode maps 401/403/529 correctly', () => {
    expect(mapExceptionToCode({ status: 401 })).toBe(ERROR_CODES.AUTHENTICATION_ERROR);
    expect(mapExceptionToCode({ status: 403 })).toBe(ERROR_CODES.PERMISSION_ERROR);
    expect(mapExceptionToCode({ status: 529 })).toBe(ERROR_CODES.OVERLOADED_ERROR);
  });

  it('sdkStreamHandler captures signature and citations deltas', async () => {
    const handler = createSdkStreamHandler();
    await handler.handle({ type: 'content_block_start', content_block: { type: 'thinking', id: 'th1' } });
    await handler.handle({ type: 'content_block_delta', content_block_id: 'th1', delta: { type: 'signature_delta', signature: 'sig-123' } });
    await handler.handle({ type: 'content_block_delta', delta: { type: 'citations_delta', citation: { page: 1, ref: 'p1' } } });
    const final = handler.final();
    expect(final.signatures[0].signature).toBe('sig-123');
    expect(final.citations[0]).toEqual({ page: 1, ref: 'p1' });
  });
});

