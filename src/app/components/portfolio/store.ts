import { InjectionToken } from '@angular/core';
import type { Entry } from '../../../shared/portfolio';

export type Row = Entry & { id: string };
export interface PortfolioStore {
  currency: string;
  portable: boolean;
  list(): Promise<Row[]>;
  add(rows: Entry[]): Promise<{ added: number; skipped: number }>;
  edit(id: string, record: Entry): Promise<unknown>;
  remove(id: string): Promise<unknown>;
}
export const PORTFOLIO_STORE = new InjectionToken<PortfolioStore>('Portfolio store');
