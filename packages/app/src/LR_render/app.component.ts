// The Angular root. For now it only starts the hand-written view, whose markup is still in
// index.html: the screens move into Angular components one at a time (ADR 0007).

import { afterNextRender, Component, inject } from '@angular/core';
import { APP_DEPENDENCIES } from './app-dependencies';
import { startApp } from './app.view';

@Component({
  selector: 'app-root',
  template: '',
})
export class AppComponent {
  constructor() {
    const dependencies = inject(APP_DEPENDENCIES);
    afterNextRender(() => {
      startApp(dependencies);
    });
  }
}
