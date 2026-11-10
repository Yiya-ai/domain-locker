import { defineEventHandler, getRequestHeader, getRequestURL, sendRedirect } from 'h3';
import { hasValidSession } from '../lib/auth';

// Redirect before SSR or the client can start fetching protected ledger data.
export default defineEventHandler((event) => {
  if (!['GET', 'HEAD'].includes(event.method)) return;
  if (!getRequestHeader(event, 'accept')?.includes('text/html')) return;
  const { pathname: path, search } = getRequestURL(event);
  if (
    /^\/(?:domains|stats|value|assets|notifications|settings|advanced)(?:\/|$)/.test(
      path,
    ) &&
    !hasValidSession(event)
  )
    return sendRedirect(
      event,
      '/login?' + new URLSearchParams({ returnUrl: path + search }),
      302,
    );
  return;
});
