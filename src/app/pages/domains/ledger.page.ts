import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../services/db-query-services/api/api-client';
import DatabaseService from '../../services/database.service';
import { CurrencyService } from '../../services/currency.service';
import { PortfolioComponent } from '../../components/portfolio/portfolio.component';
import {
  PORTFOLIO_STORE,
  type PortfolioStore,
  type Row,
} from '../../components/portfolio/store';

function serverStore(): PortfolioStore {
  const api = inject(ApiClient);
  const database = inject(DatabaseService);
  async function change<T>(request: Promise<T>) {
    const value = await request;
    database.invalidateDomains();
    return value;
  }
  return {
    portable: false,
    currency: inject(CurrencyService).getCurrencyCode(),
    list: () => firstValueFrom(api.get<Row[]>('/v1/portfolio')),
    add: (records) =>
      change(
        firstValueFrom(
          api.post<{ added: number; skipped: number }>('/v1/portfolio', records),
        ),
      ),
    edit: (id, row) => change(firstValueFrom(api.put('/v1/portfolio/' + id, row))),
    remove: (id) => change(firstValueFrom(api.delete('/v1/domains/' + id))),
  };
}
@Component({
  standalone: true,
  imports: [PortfolioComponent],
  providers: [{ provide: PORTFOLIO_STORE, useFactory: serverStore }],
  template: '<app-portfolio [initialDomain]="domain" />',
})
export default class LedgerPage {
  domain = inject(ActivatedRoute).snapshot.queryParamMap.get('domain') || '';
}
