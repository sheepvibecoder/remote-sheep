// The Angular root. It starts the hand-written view, whose markup is still in index.html, and
// hands it what it needs to mount the screens already moved into components (ADR 0007).

import {
  afterNextRender,
  ApplicationRef,
  Component,
  EnvironmentInjector,
  inject,
} from '@angular/core';
import { APP_DEPENDENCIES } from './app-dependencies';
import { startApp } from './app.view';

@Component({
  selector: 'app-root',
  template: '',
})
export class AppComponent {
  constructor() {
    const dependencies = inject(APP_DEPENDENCIES);
    const angular = { appRef: inject(ApplicationRef), injector: inject(EnvironmentInjector) };
    afterNextRender(() => {
      startApp(dependencies, angular);
    });
  }
}
