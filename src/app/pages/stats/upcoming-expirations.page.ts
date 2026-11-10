import { TranslateModule } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { DomainExpirationBarComponent } from '~/app/components/charts/domain-expiration-bar/domain-expiration-bar.component';

@Component({
  standalone: true,
  selector: 'app-stats-upcoming-expirations-page',
  template: `
    <h1 class="mt-2 mb-4">{{ 'UI.UPCOMING_EXPIRATIONS' | translate }}</h1>
    <app-domain-expiration-bar [showFull]="true" />
  `,
  imports: [TranslateModule, DomainExpirationBarComponent],
  styles: [
    '::ng-deep .domain-timeline-thing {display: flex; margin-top: 2rem; margin-left: -4rem;} ',
  ],
})
export default class HostMapPage {}
