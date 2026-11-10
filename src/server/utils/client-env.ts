/**
 * Environment variables the browser is allowed to see. Anything absent here
 * (database credentials, API keys, tokens) stays server-side, whether it is
 * requested via /api/env-var or bundled at build time.
 */
export const CLIENT_SAFE_ENV_VARS = [
  'DL_PORTFOLIO_CURRENCY',
  'DL_DISABLE_WRITE_METHODS',
] as const;

/** Tells the client which database the server is using, never how to reach it */
export const DB_BACKEND_VAR = 'DL_DB_BACKEND';

const PG_REQUIRED_VARS = ['DL_PG_HOST', 'DL_PG_USER', 'DL_PG_PASSWORD', 'DL_PG_NAME'];

export function isPostgresConfigured(env: Record<string, string | undefined>): boolean {
  return PG_REQUIRED_VARS.every((name) => Boolean(env[name]));
}

/** Picks the allowlisted variables out of an environment, plus the backend name */
export function pickClientEnv(
  env: Record<string, string | undefined>,
): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const name of CLIENT_SAFE_ENV_VARS) {
    if (env[name] !== undefined) picked[name] = env[name] as string;
  }
  picked['DL_ENV_TYPE'] = 'selfHosted';
  picked[DB_BACKEND_VAR] = isPostgresConfigured(env) ? 'postgres' : 'sqlite';
  return picked;
}

/** Reject retired managed deployments so they cannot silently create a second ledger. */
export function legacyManagedMode(): boolean {
  return process.env['DL_ENV_TYPE'] === 'managed';
}
