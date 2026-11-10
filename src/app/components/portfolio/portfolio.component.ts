import { ChangeDetectorRef, Component, Input, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PORTFOLIO_STORE, type Row } from './store';
import {
  daysLeft,
  emptyEntry,
  expiryState,
  exportCsv,
  importCsv,
  prices,
  validateEntry,
  type Entry,
} from '../../../shared/portfolio';

@Component({
  standalone: true,
  selector: 'app-portfolio',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    TableModule,
    InputTextModule,
    InputTextareaModule,
  ],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css'],
})
export class PortfolioComponent implements OnInit {
  @Input() initialDomain = '';
  readonly store = inject(PORTFOLIO_STORE);
  private cd = inject(ChangeDetectorRef);
  private platform = inject(PLATFORM_ID);
  readonly zh =
    typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh');
  t(en: string, zh: string) {
    return this.zh ? zh : en;
  }
  rows: Row[] = [];
  filtered: Row[] = [];
  search = '';
  state = '';
  first = 0;
  pageSize = 10;
  busy = false;
  loaded = false;
  error = '';
  notice = '';
  dialog: 'edit' | 'delete' | 'import' | 'export' | null = null;
  entry = emptyEntry();
  selected: Row | null = null;
  batch: Entry[] = [];
  rate: number | null = 1;
  readonly prices = prices;
  readonly moneyLabels = {
    registerPrice: this.t('Purchase price', '注册价'),
    renewPrice: this.t('Annual renewal', '年续费'),
    targetPrice: this.t('Asking price', '意向售价'),
    actualPrice: this.t('Sale price', '实际售价'),
  };
  readonly states = ['Active', 'Due within 30 days', 'Expired', 'Unknown'];
  readonly stateLabels: Record<string, string> = {
    Active: this.t('Active', '正常'),
    'Due within 30 days': this.t('Due within 30 days', '30 天内到期'),
    Expired: this.t('Expired', '已过期'),
    Unknown: this.t('No expiry date', '未设到期日'),
  };
  readonly numberFormat = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: this.store.currency,
  });
  summary = { count: 0, due: 0, registerPrice: 0, targetPrice: 0, actualPrice: 0 };
  days = daysLeft;
  status(date: string) {
    return expiryState(daysLeft(date));
  }
  amount(value: number | null) {
    return value === null ? '—' : this.numberFormat.format(value);
  }
  lock() {
    window.location.reload();
  }
  ngOnInit() {
    if (!isPlatformBrowser(this.platform)) return;
    void this.run(async () => {
      await this.refresh();
      const initial = this.rows.find((row) => row.domainFull === this.initialDomain);
      if (initial) this.edit(initial);
    });
  }
  async refresh() {
    this.rows = await this.store.list();
    this.loaded = true;
    this.summary = {
      count: this.rows.length,
      due: 0,
      registerPrice: 0,
      targetPrice: 0,
      actualPrice: 0,
    };
    for (const row of this.rows) {
      if (this.status(row.expireDate) === 'Due within 30 days') this.summary.due++;
      for (const k of ['registerPrice', 'targetPrice', 'actualPrice'] as const)
        this.summary[k] += row[k] ?? 0;
    }
    this.filter(false);
  }
  filter(resetPage = true) {
    const q = this.search.trim().toLowerCase();
    this.filtered = this.rows.filter(
      (r) =>
        (!this.state || this.status(r.expireDate) === this.state) &&
        [r.domainFull, r.registrar, r.notes].some((s) => s.toLowerCase().includes(q)),
    );
    const lastPage = Math.max(0, Math.ceil(this.filtered.length / this.pageSize) - 1);
    this.first = resetPage ? 0 : Math.min(this.first, lastPage * this.pageSize);
  }
  edit(row: Row | null) {
    this.selected = row;
    this.entry = row ? { ...row } : emptyEntry();
    this.error = '';
    this.dialog = 'edit';
  }
  askDelete(row: Row) {
    this.selected = row;
    this.error = '';
    this.dialog = 'delete';
  }
  async save() {
    await this.run(async () => {
      const record = validateEntry(this.entry);
      if (this.selected) await this.store.edit(this.selected.id, record);
      else if (!(await this.store.add([record])).added)
        throw new Error(this.t('Domain already exists.', '该域名已存在。'));
      await this.finish(this.t('Saved.', '已保存。'));
    });
  }
  async remove() {
    if (!this.selected) return;
    const id = this.selected.id;
    await this.run(async () => {
      await this.store.remove(id);
      await this.finish(this.t('Deleted.', '已删除。'));
    });
  }
  async readFile(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    await this.run(async () => {
      if (file.size > 8 * 1024 * 1024)
        throw new Error(this.t('Maximum CSV size is 8 MiB.', 'CSV 文件上限为 8 MiB。'));
      this.batch = importCsv(await file.text());
      this.rate = this.store.currency === 'CNY' ? 1 : null;
      this.dialog = 'import';
    });
  }
  get duplicates() {
    const names = new Set(this.rows.map((r) => r.domainFull.toLowerCase()));
    let skipped = 0;
    for (const r of this.batch) {
      if (names.has(r.domainFull)) skipped++;
      names.add(r.domainFull);
    }
    return skipped;
  }
  async importRows() {
    await this.run(async () => {
      const batch = this.convert(this.batch, false);
      const { added, skipped } = await this.store.add(batch);
      await this.finish(
        this.t(
          'Added ' + added + ', skipped ' + skipped + '.',
          '已导入 ' + added + ' 条，跳过 ' + skipped + ' 条。',
        ),
      );
    });
  }
  spreadsheetSafe = true;
  askExport() {
    this.spreadsheetSafe = true;
    this.rate = this.store.currency === 'CNY' ? 1 : null;
    this.error = '';
    this.dialog = 'export';
  }
  download() {
    void this.run(async () => {
      const csv = exportCsv(this.convert(this.rows, true), this.spreadsheetSafe);
      const url = URL.createObjectURL(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'domains_export.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.dialog = null;
    });
  }
  private convert(entries: Entry[], outbound: boolean) {
    if (!this.rate || !Number.isFinite(this.rate) || this.rate <= 0)
      throw new Error(this.t('Enter a positive exchange rate.', '请填写正数汇率。'));
    const multiplier = outbound ? 1 / this.rate : this.rate;
    return entries.map((row) => {
      const copy = { ...row };
      for (const key of prices) {
        const value = row[key];
        if (value !== null && multiplier !== 1)
          copy[key] = Math.round(value * multiplier * 100) / 100;
      }
      return validateEntry(copy);
    });
  }
  private async finish(message: string) {
    this.dialog = null;
    this.notice = message;
    await this.refresh();
  }
  async run(action: () => Promise<void>) {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.notice = '';
    try {
      await action();
    } catch (e) {
      this.error =
        e instanceof Error ? e.message : this.t('Operation failed.', '操作失败。');
    } finally {
      this.busy = false;
      this.cd.markForCheck();
    }
  }
}
