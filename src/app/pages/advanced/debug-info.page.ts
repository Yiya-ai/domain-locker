import { Component } from '@angular/core';
declare const __APP_VERSION__: string;

@Component({
  standalone: true,
  selector: 'app-advanced-debug-info-page',
  templateUrl: './debug-info.page.html',
})
export default class DebugInfoPage {
  readonly version = __APP_VERSION__;
}
