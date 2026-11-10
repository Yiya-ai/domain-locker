import { z } from 'zod';
import { defineApiRoute } from '../../../lib/handler';
import { apiError } from '../../../lib/errors';
import { checkPassword, isAuthEnabled, startSession } from '../../../lib/auth';

const attempts = new Map<string, { count: number; until: number }>();

const schema = z.object({ password: z.string().max(1024) });

export default defineApiRoute(
  { public: true, skipMigration: true, body: schema },
  ({ event, body }) => {
    if (!isAuthEnabled())
      throw apiError(
        'forbidden',
        'Set DL_AUTH_PASSWORD on the server before signing in.',
      );
    const now = Date.now();
    const address = event.node.req.socket.remoteAddress || 'local';
    for (const [key, attempt] of attempts) {
      if (attempt.until <= now) attempts.delete(key);
    }
    const attempt = attempts.get(address) || { count: 0, until: now + 60_000 };
    if (attempt.count >= 8 || (!attempts.has(address) && attempts.size >= 4096)) {
      throw apiError('rate_limited', 'Too many login attempts. Try again in a minute.');
    }
    if (!checkPassword(body.password)) {
      attempt.count++;
      attempts.set(address, attempt);
      throw apiError('unauthorized', 'Incorrect password');
    }
    attempts.delete(address);
    startSession(event);
    return { authenticated: true };
  },
);
