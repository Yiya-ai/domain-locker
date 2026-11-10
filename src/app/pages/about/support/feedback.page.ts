import { Component } from '@angular/core';

import { PrimeNgModule } from '~/app/prime-ng.module';

@Component({
  standalone: true,
  selector: 'app-about-support-feedback-page',
  imports: [PrimeNgModule],
  template: `<p>Contact your instance administrator through <a href="/about/support/contact">Support</a>.</p>`,
  styles: [``],
})
export default class SupportPage {}
