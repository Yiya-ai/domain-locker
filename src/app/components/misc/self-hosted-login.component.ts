import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { LogoComponent } from '~/app/components/home-things/logo/logo.component';
import { AuthService } from '~/app/services/auth.service';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { ApiRequestError } from '~/app/services/db-query-services/api/api-client';
import { loginDestination } from '~/shared/login-destination';

/** Password sign-in for a self-hosted instance running with DL_AUTH_PASSWORD */
@Component({
  standalone: true,
  selector: 'app-self-hosted-login',
  imports: [TranslateModule, ReactiveFormsModule, RouterLink, PrimeNgModule, LogoComponent],
  template: `
    <p-card styleClass="max-w-[500px] w-[calc(100%-0.5rem)]">
      <ng-template pTemplate="header">
        <div class="flex gap-2 items-center p-4 pb-0">
          <app-logo />
          <h2 class="m-0">{{ 'UI.SIGN_IN' | translate }}</h2>
        </div>
      </ng-template>

      @if (checking) {
        <p class="m-0 opacity-70">{{ 'UI.CHECKING_WHETHER_THIS_INSTANCE_NEEDS_A_PASSWORD' | translate }}</p>
      } @else if (authenticated) {
        <p class="m-0">{{ 'UI.YOU_RE_SIGNED_IN' | translate }}</p>
        <div class="flex gap-2 mt-3">
          <p-button
            [label]="'UI.GO_TO_MY_DOMAINS' | translate"
            icon="pi pi-arrow-right"
            routerLink="/domains"
          />
          <p-button
            [label]="'UI.SIGN_OUT' | translate"
            icon="pi pi-sign-out"
            severity="secondary"
            [outlined]="true"
            (click)="signOut()"
          />
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="signIn()" class="flex flex-col gap-3">
          <label for="instance-password" class="text-sm opacity-70">
            {{ 'UI.THIS_INSTANCE_IS_PASSWORD_PROTECTED' | translate }}
          </label>
          <input
            id="instance-password"
            pInputText
            type="password"
            formControlName="password"
            autocomplete="current-password"
            [placeholder]="'UI.PASSWORD' | translate"
            class="w-full"
          />
          @if (errorMessage) {
            <small class="text-red-400">{{ errorMessage }}</small>
          }
          <p-button
            type="submit"
            [label]="'UI.SIGN_IN' | translate"
            icon="pi pi-sign-in"
            [loading]="submitting"
            [disabled]="form.invalid"
            styleClass="w-full justify-center"
          />
        </form>
      }
    </p-card>
  `,
})
export class SelfHostedLoginComponent implements OnInit {
  private translator = inject(TranslateService);
  private fb = inject(FormBuilder);
  private platform = inject(PLATFORM_ID);
  private auth = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr = inject(ChangeDetectorRef);

  form = this.fb.nonNullable.group({
    password: ['', Validators.required],
  });

  checking = true;
  authenticated = false;
  submitting = false;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platform)) return;
    try {
      const status = await this.auth.status();
      this.authenticated = status.authenticated;
    } catch (error) {
      this.errorHandler.handleError({
        error,
        message: 'Could not reach this instance to check whether it needs a password',
        location: 'SelfHostedLoginComponent',
      });
    } finally {
      this.checking = false;
      this.cdr.detectChanges();
    }
  }

  signIn(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    this.errorMessage = '';
    this.auth.login(this.form.getRawValue().password).subscribe({
      // A reload lets every service pick the session up, rather than half the app
      next: () => {
        const location = new URL(window.location.href);
        window.location.replace(loginDestination(location.searchParams.get('returnUrl'), location));
      },
      error: (error: unknown) => {
        this.submitting = false;
        this.errorMessage =
          error instanceof ApiRequestError && error.code === 'unauthorized'
            ? this.translator.instant('UI.INCORRECT_PASSWORD')
            : this.translator.instant('UI.COULD_NOT_SIGN_IN_PLEASE_TRY_AGAIN');
        this.cdr.detectChanges();
      },
    });
  }

  async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
      window.location.reload();
    } catch (error) {
      this.errorHandler.handleError({
        error,
        message: 'Could not sign out',
        showToast: true,
        location: 'SelfHostedLoginComponent',
      });
    }
  }
}
