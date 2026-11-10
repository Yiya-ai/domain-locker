import type { H3Event } from 'h3';
import { isAuthorised } from '../lib/auth';

export async function verifyAuth(event: H3Event) {
  return isAuthorised(event)
    ? { success: true }
    : { success: false, error: 'Authentication required' };
}
