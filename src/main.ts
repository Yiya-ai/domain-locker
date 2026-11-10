import { restrictNavigation } from './shared/private-navigation';
import './styles.css';
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from '~/app/app.component';
import { appConfig } from '~/app/app.config';

// Remove diagnostics retained by older versions on this device.
try { localStorage.removeItem('DL_error_log'); } catch { /* Storage can be unavailable. */ }
restrictNavigation(document);

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error('💀 Bollocks, something went seriously wrong...', err),
);
