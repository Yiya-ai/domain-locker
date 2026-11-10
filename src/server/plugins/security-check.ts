import { isApiKeyConfigured, isAuthEnabled } from '../lib/auth';
import Logger from '../utils/logger';

const log = new Logger('security');

/** Runs after plugins/env.ts, which is what puts DL_* into process.env */
export default function warnIfUnprotected() {
  if (process.env['DL_ENV_TYPE'] !== 'selfHosted') return;
  if (isAuthEnabled() || isApiKeyConfigured()) return;

  log.warn(
    'No runtime credentials are configured. The ledger and manual jobs are locked.',
  );
}
