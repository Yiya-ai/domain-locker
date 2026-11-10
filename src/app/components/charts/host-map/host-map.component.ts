import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-host-map',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './host-map.component.html',
})
export class HostMapComponent {}
