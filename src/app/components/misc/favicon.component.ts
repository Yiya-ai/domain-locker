import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-domain-favicon',
  standalone: true,
  template: `<i aria-hidden="true" [class]="styleClass + ' pi pi-globe'" [style.font-size.px]="size"></i>`,
})
export class DomainFaviconComponent {
  @Input() domain = '';
  @Input() size = 24;
  @Input() styleClass = '';
  @Input() domainIcon = '';
}
