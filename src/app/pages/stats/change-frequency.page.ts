import { TranslateModule } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { DomainUpdatesComponent } from '~/app/components/domain-things/domain-updates/domain-updates.component';
import { ChangeHistoryChartComponent } from '~/app/components/charts/change-history/change-history.component';

@Component({
  standalone: true,
  selector: 'app-stats-change-frequency-page',
  template: `
    <h1>{{ 'UI.CHANGE_FREQUENCY' | translate }}</h1>
    <div class="flex flex-col gap-2">
      <app-change-history-chart />
      <h2 class="mb-0 mt-4">{{ 'UI.RECENT_CHANGE_LOG' | translate }}</h2>
      <app-domain-updates />
    </div>
  `,
  imports: [TranslateModule, DomainUpdatesComponent, ChangeHistoryChartComponent],
  styles: [
    `
      ::ng-deep .filter-button {
        display: none;
      }
    `,
  ],
})
export default class ChangeFrequencyPage {}
