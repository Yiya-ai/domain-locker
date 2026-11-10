import { portfolioEntry } from '../../../../shared/portfolio';
import { defineApiRoute } from '../../../lib/handler';
export default defineApiRoute(
  { write: true, body: portfolioEntry },
  ({ db, body, uuidParam }) => db.portfolio.edit(uuidParam('id'), body),
);
