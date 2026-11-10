import { sql, type Kysely, type Transaction } from 'kysely';
import type { Entry } from '../../../shared/portfolio';
import type { Database } from '../schema';
import { currentUserId, toNumber } from './helpers';
import { upsertRegistrar } from './domain-write';
import { apiError } from '../../lib/errors';

export function portfolioRepo(db: Kysely<Database>) {
  async function write(
    trx: Transaction<Database>,
    entry: Entry,
    id: string | null,
    user: string,
  ) {
    if (!id) {
      const existing = await trx
        .selectFrom('domains')
        .select('id')
        .where('user_id', '=', user)
        .where(sql<string>`lower(domain_name)`, '=', entry.domainFull)
        .executeTakeFirst();
      if (existing) return false;
    }
    const registrar_id = await upsertRegistrar(trx, entry.registrar, user);
    const fields = {
      registrar_id,
      notes: entry.notes,
      expiry_date: entry.expireDate || null,
      registration_date: entry.registerDate || null,
    };
    if (id) {
      const updated = await trx
        .updateTable('domains')
        .set(fields)
        .where('id', '=', id)
        .where('user_id', '=', user)
        .where(sql<string>`lower(domain_name)`, '=', entry.domainFull)
        .returning('id')
        .executeTakeFirst();
      if (!updated) throw apiError('not_found', 'Domain no longer exists.');
    } else {
      const inserted = await trx
        .insertInto('domains')
        .values({ ...fields, domain_name: entry.domainFull, user_id: user })
        .onConflict((c) => c.columns(['user_id', 'domain_name']).doNothing())
        .returning('id')
        .executeTakeFirst();
      if (!inserted) return false;
      id = inserted.id;
    }
    const amounts = {
      purchase_price: entry.registerPrice,
      renewal_cost: entry.renewPrice,
      target_price: entry.targetPrice,
      actual_price: entry.actualPrice,
    };
    await trx
      .insertInto('domain_costings')
      .values({ domain_id: id, ...amounts })
      .onConflict((c) => c.column('domain_id').doUpdateSet(amounts))
      .execute();
    return true;
  }
  return {
    async list(user = currentUserId()) {
      const rows = await db
        .selectFrom('domains as d')
        .leftJoin('registrars as r', 'r.id', 'd.registrar_id')
        .leftJoin('domain_costings as c', 'c.domain_id', 'd.id')
        .where('d.user_id', '=', user)
        .select([
          'd.id',
          'd.domain_name',
          'd.registration_date',
          'd.expiry_date',
          'd.notes',
          'r.name',
          'c.purchase_price',
          'c.renewal_cost',
          'c.target_price',
          'c.actual_price',
        ])
        .orderBy('d.domain_name')
        .execute();
      const day = (value: unknown) =>
        value instanceof Date
          ? value.toISOString().slice(0, 10)
          : String(value ?? '').slice(0, 10);
      return rows.map((r) => ({
        id: r.id,
        domainFull: r.domain_name,
        registrar: r.name ?? '',
        notes: r.notes ?? '',
        registerDate: day(r.registration_date),
        expireDate: day(r.expiry_date),
        registerPrice: toNumber(r.purchase_price),
        renewPrice: toNumber(r.renewal_cost),
        targetPrice: toNumber(r.target_price),
        actualPrice: toNumber(r.actual_price),
      }));
    },
    async add(entries: Entry[], user = currentUserId()) {
      return db.transaction().execute(async (trx) => {
        let added = 0;
        for (const entry of entries) if (await write(trx, entry, null, user)) added++;
        return { added, skipped: entries.length - added };
      });
    },
    async edit(id: string, entry: Entry, user = currentUserId()) {
      return db.transaction().execute((trx) => write(trx, entry, id, user));
    },
  };
}
