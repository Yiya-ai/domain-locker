import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { createError, type H3Event } from 'h3';
import { verifyAuth } from './auth';

export const externalQueriesEnabled = (): boolean => false;

export async function requireExternalQueries(event: H3Event): Promise<void> {
  if (!(await verifyAuth(event)).success) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in required' });
  }
  if (!externalQueriesEnabled()) {
    throw createError({
      statusCode: 403,
      statusMessage: 'External queries are disabled. Use manual entry.',
    });
  }
}

/** Resolve once. Each connection uses this literal address with the original TLS name. */
export async function publicAddress(host: string): Promise<string> {
  const addresses = await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicIp(address)))
    throw new Error('A public network address is required.');
  return addresses[0].address;
}

export function isPublicIp(address: string): boolean {
  if (!ipaddr.isValid(address)) return false;
  const ip = ipaddr.process(address);
  return (
    ip.range() === 'unicast' &&
    (ip.kind() !== 'ipv6' || (ip.toByteArray()[0] & 0xe0) === 0x20)
  );
}
