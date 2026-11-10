import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only origin-relative paths are safe on the server, where no browser origin exists.
    const environment = typeof window === 'undefined' ? null : window.location;
    const env = (globalThis as { process?: { env?: Record<string, string> } }).process?.env;
    const base = environment?.origin ?? `http://localhost:${env?.['NITRO_PORT'] || env?.['PORT'] || '3000'}`;
    const target = new URL(request.url, base);
    if (target.origin !== base || !['http:', 'https:'].includes(target.protocol)) {
      return throwError(() => new Error('External requests are disabled.'));
    }
    return next.handle(request);
  }
}
