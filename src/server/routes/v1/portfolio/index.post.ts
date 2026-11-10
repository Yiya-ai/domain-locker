import { z } from 'zod';
import { portfolioEntry } from '../../../../shared/portfolio';
import { defineApiRoute } from '../../../lib/handler';
export default defineApiRoute(
  { write: true, body: z.array(portfolioEntry).min(1).max(5000) },
  ({ db, body }) => db.portfolio.add(body),
);
