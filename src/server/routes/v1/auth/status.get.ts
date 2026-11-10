import { defineApiRoute } from '../../../lib/handler';
import { hasValidSession } from '../../../lib/auth';

// Public so the login page can ask whether a password is required
export default defineApiRoute({ public: true, skipMigration: true }, ({ event }) => ({
  authRequired: true,
  authenticated: hasValidSession(event),
}));
