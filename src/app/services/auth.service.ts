import { Injectable, inject } from '@angular/core';
import { firstValueFrom, map, type Observable } from 'rxjs';
import { ApiClient } from '~/app/services/db-query-services/api/api-client';
import { EnvService } from '~/app/services/environment.service';
import { SupabaseService } from '~/app/services/supabase.service';

export interface AuthStatus {
  authRequired: boolean;
  authenticated: boolean;
}

/** Runtime password authentication for the self-hosted ledger. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiClient);
  private envService = inject(EnvService);
  private supabaseService = inject(SupabaseService);

  status(): Promise<AuthStatus> {
    return firstValueFrom(this.api.get<AuthStatus>('/v1/auth/status'));
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.status()).authenticated;
  }

  login(password: string): Observable<void> {
    return this.api
      .post<AuthStatus>('/v1/auth/login', { password })
      .pipe(map(() => undefined));
  }

  async signOut(): Promise<void> {
    if (this.envService.isSupabaseEnabled()) {
      await this.supabaseService.signOut();
      return;
    }
    await firstValueFrom(this.api.post<AuthStatus>('/v1/auth/logout'));
  }
}
