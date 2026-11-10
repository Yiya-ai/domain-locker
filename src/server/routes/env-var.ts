import { defineEventHandler } from 'h3';
import { pickClientEnv } from '../utils/client-env';

/**
 * GET /api/env-var
 *   => the allowlisted, client-safe environment variables for self-hosted runtime config
 */
export default defineEventHandler((event) => {
  const environmentVariables = process.env || {};
  event.node.res.setHeader('Cache-Control', 'no-store');
  return { error: false, env: pickClientEnv(environmentVariables) };
});
