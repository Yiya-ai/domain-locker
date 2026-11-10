import { requireExternalQueries } from '../utils/external-queries';
import { defineEventHandler } from 'h3';

const timeout = 5000;

export default defineEventHandler(async (event) => {
  await requireExternalQueries(event);
  event.node.res.setHeader(
    'Cache-Control',
    'private, no-store',
  );
  event.node.res.setHeader('Content-Type', 'application/json');



  const [scheduledCrons, databaseStatus, supabaseStatus, uptimeStatus, ghActions] =
    await Promise.all([
      fetchHealthchecks(),
      fetchDatabaseHealth(),
      fetchSupabaseHealth(),
      fetchUptimeStatus(),
      fetchGitHubCIStatus(),
    ]);

  return { scheduledCrons, databaseStatus, supabaseStatus, uptimeStatus, ghActions };
});

async function fetchHealthchecks(): Promise<unknown[]> {
  const apiKey = import.meta.env['HEALTHCHECKS_API_KEY'];
  if (!apiKey) return [];
  try {
    const res = await fetch('https://healthchecks.io/api/v3/checks', {
      headers: { 'X-Api-Key': apiKey },
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { checks?: Record<string, unknown>[] };
    return (body.checks || []).map(({ status }) => ({ status }));
  } catch (err) {
    console.error('[external-checks] Healthchecks error:', err);
    return [];
  }
}

async function fetchDatabaseHealth(): Promise<unknown> {
  const supabaseUrl = import.meta.env['SUPABASE_URL'];
  if (!supabaseUrl) return {};
  try {
    const url = `${supabaseUrl}/functions/v1/health`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeout),
    });
    return { up: res.ok };
  } catch (err) {
    console.error('[external-checks] Database health error:', err);
    return {};
  }
}

async function fetchSupabaseHealth(): Promise<{ healthy?: boolean } | undefined> {
  const anonKey = import.meta.env['SUPABASE_ANON_KEY'];
  if (!anonKey) return {};
  try {
    const res = await fetch(`${import.meta.env['SUPABASE_URL']}/health`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: AbortSignal.timeout(timeout),
    });
    const body = await res.text();
    return { healthy: body.trim() === 'Healthy' };
  } catch (err) {
    console.error('[external-checks] Supabase health error:', err);
    return { healthy: false };
  }
}

async function fetchUptimeStatus(): Promise<unknown | undefined> {
  const url = import.meta.env['UPTIME_KUMA_URL'];
  if (!url) return {};
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeout),
    });
    return { up: res.ok };
  } catch (err) {
    console.error('[external-checks] Uptime error:', err);
    return {};
  }
}

async function fetchGitHubCIStatus(): Promise<unknown | undefined> {
  const url = 'https://gh-workflows.as93.workers.dev/?user=lissy93&repo=domain-locker';
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeout),
    });
    return { up: res.ok };
  } catch (err) {
    console.error('[external-checks] github actions error:', err);
    return {};
  }
}
