import { defineEventHandler } from 'h3';
import { legacyManagedMode, pickClientEnv } from '../utils/client-env';

/**
 * GET /api/env-var
 *   => the allowlisted, client-safe environment variables for self-hosted runtime config
 */
export default defineEventHandler((event) => {
  if (legacyManagedMode()) return { error: true, message: 'Managed deployments are disabled' };
  const environmentVariables = process.env || {};
  event.node.res.setHeader('Cache-Control', 'no-store');
  return { error: false, env: pickClientEnv(environmentVariables) };
});
