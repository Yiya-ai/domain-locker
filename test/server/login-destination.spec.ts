import { describe, expect, it } from 'vitest';
import { loginDestination } from '../../src/shared/login-destination';

const login = new URL('https://ledger.example/login#notes');

describe('self-hosted login destination', () => {
  it('restores the entry query and the fragment carried through a document redirect', () => {
    expect(loginDestination('/domains/ledger?domain=example.invalid', login)).toBe(
      'https://ledger.example/domains/ledger?domain=example.invalid#notes',
    );
  });

  it('preserves a fragment from client-side navigation', () => {
    expect(loginDestination('/value#chart', login)).toBe(
      'https://ledger.example/value#chart',
    );
  });

  it('uses the ledger for a direct login or a non-local destination', () => {
    for (const input of [
      null,
      '/login',
      '//elsewhere.example',
      'https://elsewhere.example',
    ]) {
      expect(loginDestination(input, login)).toBe('/domains/ledger');
    }
  });
});
