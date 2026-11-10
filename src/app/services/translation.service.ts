import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { availableLanguages, browserUiLanguage } from '../../shared/ui-language';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  translateService = inject(TranslateService);
  readonly availableLanguages = availableLanguages;

  getLanguageToUse(): string {
    return this.translateService.currentLang || browserUiLanguage();
  }

  switchLanguage(code: string) {
    if (!availableLanguages.some((language) => language.code === code)) return;
    this.translateService.use(code).subscribe(() => {
      if (typeof window === 'undefined') return;
      document.documentElement.lang = code;
      try { localStorage.setItem('domain-locker.language', code); } catch { /* Storage is optional. */ }
      const url = new URL(location.href);
      if (url.searchParams.has('lang')) {
        url.searchParams.set('lang', code);
        history.replaceState(history.state, '', url);
      }
    });
  }

  menuLabel(label: string): string {
    const key = label.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const labels = this.translateService.instant('UI');
    return labels?.[key] ?? label;
  }
}
