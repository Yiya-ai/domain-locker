import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  externalQueriesEnabled,
  isPublicIp,
} from '../../src/server/utils/external-queries';
import { emptyEntry, exportCsv, importCsv } from '../../src/shared/portfolio';

describe('private ledger defaults', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('blocks network lookups even when a legacy configuration enables them', () => {
    vi.stubEnv('DL_ENABLE_EXTERNAL_QUERIES', undefined);
    expect(externalQueriesEnabled()).toBe(false);
    vi.stubEnv('DL_ENABLE_EXTERNAL_QUERIES', 'true');
    expect(externalQueriesEnabled()).toBe(false);
  });

  it('only accepts routable public addresses for connections', () => {
    for (const ip of [
      '127.0.0.1',
      '10.0.0.1',
      '169.254.1.1',
      '::1',
      'fe80::1',
      '::ffff:192.168.1.1',
    ]) {
      expect(isPublicIp(ip)).toBe(false);
    }
    expect(isPublicIp('1.1.1.1')).toBe(true);
    expect(isPublicIp('2606:4700:4700::1111')).toBe(true);
  });

  it('uses text-safe cells by default and preserves exact values in interchange mode', () => {
    const row = {
      ...emptyEntry(),
      domainFull: 'sample.invalid',
      registrar: '+supplier',
      notes: '=memo',
    };
    const [safe] = importCsv(exportCsv([row]));
    expect(safe.registrar).toBe("'+supplier");
    expect(safe.notes).toBe("'=memo");
    expect(importCsv(exportCsv([row], false))).toEqual([row]);
  });
});
