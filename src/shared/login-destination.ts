/** Resolve an internal navigation target before performing a full reload after login. */
export function loginDestination(returnUrl: string | null, location: URL): string {
  const fallback = '/domains/ledger';
  if (!returnUrl?.startsWith('/') || returnUrl.startsWith('//')) return fallback;
  try {
    const target = new URL(returnUrl, location.origin);
    if (target.origin !== location.origin || /^\/login\/?$/.test(target.pathname))
      return fallback;
    // A fragment is not sent to the server. Browsers retain it across the login redirect.
    if (!target.hash) target.hash = location.hash;
    return target.href;
  } catch {
    return fallback;
  }
}
