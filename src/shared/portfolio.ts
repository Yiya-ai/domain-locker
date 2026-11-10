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
const fieldNamesZh: Record<keyof Entry, string> = {
  domainFull: '域名', registrar: '注册商', registerDate: '注册日期', expireDate: '到期日期',
  registerPrice: '注册价', renewPrice: '年续费', targetPrice: '意向售价', actualPrice: '实际售价', notes: '备注',
};

export function validateEntry(input: unknown, zh = false): Entry {
  const result = portfolioEntry.safeParse(input);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  if (zh) {
    const field = issue.path[0] as keyof Entry;
    if (field === 'domainFull') throw new Error('请输入完整的域名，国际化域名请使用 Punycode 格式。');
    if (field === 'notes') throw new Error('备注应为文本，最多 65,536 个字符。');
    if (field === 'registrar') throw new Error('注册商应为文本，最多 255 个字符。');
    if (field === 'registerDate' || field === 'expireDate') throw new Error(fieldNamesZh[field] + '请使用有效的年-月-日格式。');
    if (prices.some(key => key === field)) throw new Error(fieldNamesZh[field] + '应为非负金额，最多两位小数，上限 99,999,999.99。');
    throw new Error('域名记录的格式不正确。');
  }
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
function readCells(source: string, zh: boolean): string[][] {
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
    else if (closed || ch === '"') throw new Error(zh ? 'CSV 引号格式不正确。' : 'Invalid CSV quoting.');
    else cell += ch;
  }
  if (quoted) throw new Error(zh ? 'CSV 单元格缺少结束引号。' : 'Unclosed quoted cell.');
  endCell();
  if (row.some((v) => v !== '')) rows.push(row);
  return rows;
}

export function importCsv(source: string, zh = false): Entry[] {
  const [header, ...rows] = readCells(source.replace(/^\uFEFF/, ''), zh);
  if (
    !header ||
    header.length !== columns.length ||
    !columns.every((k) => header.includes(k))
  )
    throw new Error((zh ? 'MiPanel CSV 表头必须包含这九列：' : 'Expected the nine MiPanel CSV column names: ') + columns.join(', '));
  if (!rows.length || rows.length > 5000)
    throw new Error(zh ? '每次可导入 1 至 5,000 条记录。' : 'Import 1–5,000 records at a time.');
  return rows.map((cells, index) => {
    try {
      if (cells.length !== header.length) throw new Error(zh ? '列数与表头不一致。' : 'Wrong number of columns.');
      const record = Object.fromEntries(header.map((k, i) => [k, cells[i]]));
      const money = Object.fromEntries(
        prices.map((k) => {
          const text = record[k].trim();
          if (text !== '' && !/^\d+(?:\.\d+)?$/.test(text))
            throw new Error(zh ? fieldNamesZh[k] + '金额格式不正确。' : 'Invalid ' + k);
          return [k, text === '' ? null : Number(text)];
        }),
      );
      return validateEntry({ ...record, ...money }, zh);
    } catch (e) {
      throw new Error((zh ? '第 ' + (index + 1) + ' 条记录：' : 'Record ' + (index + 1) + ': ') + (e as Error).message);
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
