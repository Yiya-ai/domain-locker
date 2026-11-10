import { TranslateModule } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { EppStatusChartComponent } from '~/app/components/charts/domain-epp-status/domain-epp-status.component';
import StatusesIndexPageComponent from '~/app/pages/assets/statuses/index.page';

@Component({
  standalone: true,
  selector: 'app-stats-security-profile-page',
  template: `
    <h1>{{ 'UI.EPP_SECURITY_STATUS' | translate }}</h1>
    <div class="flex flex-col gap-8">
      <app-epp-status-chart />
      <app-statuses-index />
    </div>
  `,
  imports: [TranslateModule, EppStatusChartComponent, StatusesIndexPageComponent],
  styles: ['::ng-deep app-statuses-index h1 { display: none !important; } '],
})
export default class SecurityProfilePage {}
