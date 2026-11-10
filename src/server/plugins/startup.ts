import { ensureMigrated } from '../db/ready';
import { startScheduler } from '../jobs/schedule';
import Logger from '../utils/logger';

const log = new Logger('startup');

/* Sets the database up as the server boots, then starts the scheduled jobs */
export default function initialiseDatabase() {
  if (process.env['DL_BUILDING'] === 'true') return;

  void ensureMigrated().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Database setup failed, retrying on the next request: ${message}`);
  });

  // Each job waits on the migration itself
  startScheduler();
}
