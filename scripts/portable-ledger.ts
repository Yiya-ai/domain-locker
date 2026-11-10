import { browserUiLanguage } from '../src/shared/ui-language';
import { restrictNavigation } from '../src/shared/private-navigation';
import 'zone.js';
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { PortfolioComponent } from '../src/app/components/portfolio/portfolio.component';
import { PORTFOLIO_STORE } from '../src/app/components/portfolio/store';
import { unlock } from './portable-vault';

restrictNavigation(document);
document.documentElement.lang = browserUiLanguage();
const form = document.querySelector<HTMLFormElement>('#unlock')!;
unlock(form, (store) =>
  bootstrapApplication(PortfolioComponent, {
    providers: [provideNoopAnimations(), { provide: PORTFOLIO_STORE, useValue: store }],
  }),
).catch((error) => {
  form.querySelector('[role=status]')!.textContent = String(error);
});
