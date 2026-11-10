import { z } from 'zod';

const amount = z.number().finite().min(0).max(99999999.99).multipleOf(0.01).nullable();
const date = z.union([z.literal(''), z.iso.date()]);
export const portfolioEntry = z.object({
  domainFull: z
    .string()
    .trim()
    .toLowerCase()
    .max(253)
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
      'Enter a full domain name (use punycode for international domains).',
    ),
  registrar: z.string().trim().max(255),
  registerPrice: amount,
  renewPrice: amount,
  targetPrice: amount,
  actualPrice: amount,
  registerDate: date,
  expireDate: date,
  notes: z.string().max(65536),
});
export type Entry = z.infer<typeof portfolioEntry>;
export const columns = Object.keys(portfolioEntry.shape) as (keyof Entry)[];
export const prices = [
  'registerPrice',
  'renewPrice',
  'targetPrice',
  'actualPrice',
] as const;
export const emptyEntry = (): Entry => ({
  domainFull: '',
  registrar: '',
  registerPrice: null,
  renewPrice: null,
  targetPrice: null,
  actualPrice: null,
  registerDate: '',
  expireDate: '',
  notes: '',
});
export function validateEntry(input: unknown): Entry {
  const result = portfolioEntry.safeParse(input);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  throw new Error(issue.path.join('.') + ': ' + issue.message);
}

export function spreadsheetText(value: string) {
  return /^(?:[\t\r\n]|\s*[=+@\-＝＋－＠])/.test(value) ? "'" + value : value;
}

export function exportCsv(entries: Entry[], spreadsheetSafe = true): string {
  const cells = (entry: Entry) =>
    columns
      .map((key) => {
        const value = String(entry[key] ?? '');
        const text = spreadsheetSafe ? spreadsheetText(value) : value;
        return '"' + text.replaceAll('"', '""') + '"';
      })
      .join(',');
  return '\uFEFF' + [columns.join(','), ...entries.map(cells)].join('\r\n');
}

// A quoted cell may contain CRLF, commas and doubled quotes.
function readCells(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false,
    closed = false;
  const endCell = () => {
    row.push(cell);
    cell = '';
    closed = false;
  };
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch !== '"') cell += ch;
      else if (source[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = false;
        closed = true;
      }
    } else if (ch === ',') endCell();
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      endCell();
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else if (ch === '"' && cell === '' && !closed) quoted = true;
    else if (closed || ch === '"') throw new Error('Invalid CSV quoting.');
    else cell += ch;
  }
  if (quoted) throw new Error('Unclosed quoted cell.');
  endCell();
  if (row.some((v) => v !== '')) rows.push(row);
  return rows;
}

export function importCsv(source: string): Entry[] {
  const [header, ...rows] = readCells(source.replace(/^\uFEFF/, ''));
  if (
    !header ||
    header.length !== columns.length ||
    !columns.every((k) => header.includes(k))
  )
    throw new Error('Expected the nine MiPanel CSV column names: ' + columns.join(', '));
  if (!rows.length || rows.length > 5000)
    throw new Error('Import 1–5,000 records at a time.');
  return rows.map((cells, index) => {
    try {
      if (cells.length !== header.length) throw new Error('Wrong number of columns.');
      const record = Object.fromEntries(header.map((k, i) => [k, cells[i]]));
      const money = Object.fromEntries(
        prices.map((k) => {
          const text = record[k].trim();
          if (text !== '' && !/^\d+(?:\.\d+)?$/.test(text))
            throw new Error('Invalid ' + k);
          return [k, text === '' ? null : Number(text)];
        }),
      );
      return validateEntry({ ...record, ...money });
    } catch (e) {
      throw new Error('Record ' + (index + 1) + ': ' + (e as Error).message);
    }
  });
}

export function daysLeft(date: string, now = new Date()): number | null {
  if (!date) return null;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.parse(date + 'T00:00:00Z') - today) / 86400000);
}
export function expiryState(days: number | null) {
  if (days === null) return 'Unknown';
  if (days < 0) return 'Expired';
  return days <= 30 ? 'Due within 30 days' : 'Active';
}
