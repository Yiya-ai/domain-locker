import { ErrorHandler, Injectable, inject } from '@angular/core';
import { GlobalMessageService } from '~/app/services/messaging.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(): void {
    console.error('Domain Locker encountered an unexpected error.');
  }
}

interface ErrorParams {
  error?: Error | unknown; // Should be error, but might be funny error type
  message?: string; // Friendly message to show to user (if needed)
  location?: string; // Location in code where error occurred
  showToast?: boolean; // Whether to show a toast to the user
  date?: Date; // Date of error (if not now)
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private messages = inject(GlobalMessageService);

  handleError({ message, showToast }: ErrorParams): void {
    if (showToast && message) {
      this.messages.showMessage({ severity: 'error', summary: 'Error', detail: message });
    }
  }
}
