import { TranslateModule } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { PrimeNgModule } from '../../prime-ng.module';

import { ExtendedMenuItem, statsLinks } from '~/app/constants/navigation-links';

@Component({
  standalone: true,
  imports: [TranslateModule, PrimeNgModule],
  selector: 'app-stats-page',
  // templateUrl: './index.page.html',
  template: `
    <div class="mx-auto mt-6 w-4/5">
      <!-- Intro -->
      <h2 class="text-4xl">{{ 'UI.DOMAIN_STATISTICS' | translate }}</h2>
      <p class="italic text-xl opacity-70">
        {{ 'UI.EXPLORE_AN_IN_DEPTH_VIEW_OF_YOUR_DOMAIN_DATA_WITH_INTERACTIVE_CHARTS_AND_INSIGHTS_USE_THE_OPTIONS_ON_THE_LEFT_TO_VISUALIZE_EVERYTHING_FROM_DOMAIN_PROVIDERS_AND_SECURITY_PROFILES_TO_SSL_LIFESPANS_AND_UPCOMING_EXPIRATIONS' | translate }}
      </p>
      <!-- List of stats pages -->
      <ul
        class="mt-4 p-0 list-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 wide-grid [--wide-grid-min:18rem]"
      >
        @for (item of items; track item.label) {
          <li
            class="rounded-lg py-2 px-3 transition-all ease-in-out hover:surface-50 text-default p-card hover:text-primary"
          >
            <a
              routerLink="{{ item['routerLink'] }}"
              class="flex flex-col gap-1 no-underline
            text-inherit {{
                item['color'] ? 'text-' + item['color'] + '-400' : 'text-primary-400'
              }}"
            >
              <div class="flex gap-2 align-items-center text-md text-lg">
                <i class="{{ item.icon }} opacity-70 text-lg"></i>
                <span>{{ item.label }}</span>
              </div>
              <p class="m-0 text-sm italic opacity-70 text-default">
                {{ item['description'] }}
              </p>
            </a>
          </li>
        }
      </ul>
      <!-- Sparkle icon -->
      <i
        class="text-7xl text-center w-full mx-auto my-3 text-primary opacity-20 pi pi-sparkles"
      ></i>
    </div>
  `,
})
export default class StatsIndexPage {
  items: ExtendedMenuItem[] = statsLinks as ExtendedMenuItem[];
}
