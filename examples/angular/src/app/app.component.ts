import { Component } from '@angular/core';
import { PenToolComponent } from './pen-tool.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PenToolComponent],
  template: `<app-pen-tool />`
})
export class AppComponent {}
