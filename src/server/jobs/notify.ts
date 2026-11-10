import { repos, type Repos } from '../db/repos';
import Logger from '../utils/logger';

const log = new Logger('notify');

export interface DomainNotification {
  domainId: string;
  domainName: string;
  changeType: string;
  message: string;
  title?: string;
}

/** Store enabled notifications in the local database. */
export async function notify(notification: DomainNotification): Promise<boolean> {
  const db = repos();

  if (!(await isEnabledForDomain(db, notification))) {
    log.debug(`${notification.changeType} not enabled for ${notification.domainName}`);
    return false;
  }

  await db.notifications.add(
    notification.domainId,
    notification.changeType,
    notification.message,
  );

  return true;
}

/** Preferences are per domain and matched by prefix, as the UI groups them */
async function isEnabledForDomain(
  db: Repos,
  notification: DomainNotification,
): Promise<boolean> {
  const preferences = await db.notifications.preferencesFor(notification.domainId);
  return preferences.some(
    (preference) =>
      preference.is_enabled &&
      notification.changeType.startsWith(preference.notification_type),
  );
}
