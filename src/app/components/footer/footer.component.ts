import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

declare const __APP_VERSION__: string;

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  @Input() big = false;
  readonly appVersion = __APP_VERSION__;
}
