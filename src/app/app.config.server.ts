import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BEFORE_APP_SERIALIZED, provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { APP_ID } from '@angular/core';

const serverProviders = [
  provideServerRendering(),
  {
    provide: BEFORE_APP_SERIALIZED,
    multi: true,
    deps: [DOCUMENT],
    useFactory: (doc: Document) => () => {
      // Relative resources belong to this installation. Strip external URLs before first paint.
      const base = new URL('https://local.invalid/');
      for (const attribute of ['href', 'src', 'action', 'ping']) {
        doc.querySelectorAll(`[${attribute}]`).forEach((element) => {
          const value = element.getAttribute(attribute) ?? '';
          if (attribute === 'src' && /^data:image\//i.test(value)) return;
          try {
            if (attribute !== 'ping' && new URL(value, base).origin === base.origin) return;
          } catch { /* Malformed destinations are removed as well. */ }
          element.removeAttribute(attribute);
        });
      }
    },
  },
  ...provideNoopAnimations(),
  { provide: APP_ID, useValue: 'domain-locker' },
];

const serverConfig: ApplicationConfig = {
  providers: serverProviders,
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
