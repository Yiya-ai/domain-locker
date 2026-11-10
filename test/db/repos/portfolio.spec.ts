import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BACKENDS, createMigratedDb } from '../../helpers/backends';

import { createRepos } from '~/server/db/repos';
import {
  daysLeft,
  emptyEntry,
  expiryState,
  exportCsv,
  importCsv,
  portfolioEntry,
} from '~/shared/portfolio';

const sample = {
  ...emptyEntry(),
  domainFull: 'sample.example',
  registrar: 'Namecheap',
  notes: 'Project A, "staging"\nSecond line',
  registerDate: '2024-02-29',
  targetPrice: 200,
  actualPrice: 0,
};

describe.each(BACKENDS)('portfolio ledger (%s)', (backend) => {
  let db: Awaited<ReturnType<typeof createMigratedDb>>;
  let repos: ReturnType<typeof createRepos>;
  beforeEach(async () => {
    db = await createMigratedDb(backend, 'dl_test_portfolio');
    repos = createRepos(db, backend);
  });
  afterEach(() => db.destroy());
  it('round-trips nine CSV fields, zero, null, quotes and multiline notes', () => {
    expect(importCsv(exportCsv([sample]))).toEqual([sample]);
    expect(() =>
      importCsv(exportCsv([sample]).replace('2024-02-29', '2023-02-29')),
    ).toThrow('Record 1');
    expect(() => importCsv(exportCsv([sample]) + '\n"unfinished')).toThrow('Unclosed');
    expect(portfolioEntry.safeParse({ ...sample, registerPrice: -1 }).success).toBe(
      false,
    );
  });
  it('counts today and day 30 as upcoming while an absent date stays unknown', () => {
    const today = new Date(2026, 0, 1, 22);
    expect(
      ['', '2025-12-31', '2026-01-01', '2026-01-31', '2026-02-01'].map((d) =>
        expiryState(daysLeft(d, today)),
      ),
    ).toEqual([
      'Unknown',
      'Expired',
      'Due within 30 days',
      'Due within 30 days',
      'Active',
    ]);
  });
  it('skips duplicate imports and edits the same domain without overwriting existing relations or valuation', async () => {
    expect(await repos.portfolio.add([sample, sample])).toEqual({ added: 1, skipped: 1 });
    const [row] = await repos.portfolio.list();
    await repos.assets.setCostings([
      { domain_id: row.id, current_value: 910, auto_renew: true },
    ]);
    await repos.portfolio.edit(row.id, {
      ...sample,
      registerPrice: 10.25,
      notes: 'Updated',
    });
    const [domain] = await repos.domains.list();
    expect(domain.notes).toBe('Updated');
    expect(domain.domain_costings).toMatchObject({
      current_value: 910,
      auto_renew: true,
      purchase_price: 10.25,
      target_price: 200,
      actual_price: 0,
    });
    expect(await repos.portfolio.list('b0000000-bbbb-42b0-b0b0-00b000000b69')).toEqual(
      [],
    );
    await expect(
      repos.portfolio.edit(row.id, sample, 'b0000000-bbbb-42b0-b0b0-00b000000b69'),
    ).rejects.toThrow();
    expect(await repos.portfolio.add([sample])).toEqual({ added: 0, skipped: 1 });
    expect((await repos.portfolio.list())[0].notes).toBe('Updated');
  });
});
