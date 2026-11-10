import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-advanced-status-page',
  imports: [AsyncPipe],
  templateUrl: './status.page.html',
})
export default class StatusPage {
  readonly status = inject(HttpClient).get<{ status: string }>('/api/health').pipe(
    map((health) => health.status === 'ok' ? '正常 · Online' : '异常 · Unavailable'),
    catchError(() => of('异常 · Unavailable')),
  );
}
