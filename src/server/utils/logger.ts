// src/utils/logger.ts

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug' | 'misc';

const COLORS: Record<LogLevel, string> = {
  info: '🔵',
  success: '🟢',
  warn: '🟡',
  error: '🔴',
  debug: '🟣',
  misc: '⚪',
};

const DL_DISABLE_LOGGING = process.env['DL_DISABLE_LOGGING'] !== 'false';
const DL_DEBUG = process.env['DL_DEBUG'] === 'true';
class Logger {
  private prefix: string;

  constructor(prefix = '') {
    this.prefix = prefix ? `[${prefix}]` : '';
  }

  private shouldLog(level: LogLevel): boolean {
    if (DL_DISABLE_LOGGING) return false;
    if (level === 'debug' && !DL_DEBUG) return false;
    return true;
  }

  private write(level: LogLevel, message: string) {
    // Never write free-form messages containing user data, even when logging is enabled.
    // Lookup diagnostics may contain domain names, IPs or provider URLs.
    if (['[whois]', '[domain-info]', '[domain-subs]'].includes(this.prefix)) return;
    const job = this.prefix === '[scheduler]'
      ? /^Scheduled (cleanup-monitor-data|expiration-reminders|domain-monitor|domain-updater) every \d+ minutes$/.exec(message)?.[1]
      : undefined;
    const line = `${COLORS[level]} ${this.prefix} ${job ? 'Scheduled ' + job : level}`;
    if (!this.shouldLog(level)) return;

    try {
      switch (level) {
        case 'error':
          console.error(line);
          break;
        case 'warn':
          console.warn(line);
          break;
        default:
          console.log(line);
      }
    } catch (_) {
      // Something has gone terribly wrong, even the console is broken!
      // This should never happen, but if it does, there's not much we can do.
    }
  }

  info(msg: string) {
    this.write('info', msg);
  }

  success(msg: string) {
    this.write('success', msg);
  }

  warn(msg: string) {
    this.write('warn', msg);
  }

  error(msg: string) {
    this.write('error', msg);
  }

  debug(msg: string) {
    this.write('debug', msg);
  }

  misc(msg: string) {
    this.write('misc', msg);
  }


}

/** Error text for a log line, with the cause that fetch otherwise hides */
export function errorMessage(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const cause = err.cause as NodeJS.ErrnoException | undefined;
  const detail = cause?.message || cause?.code;
  return detail ? `${err.message}: ${detail}` : err.message;
}

export default Logger;
