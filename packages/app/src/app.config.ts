// Angular's half of the composition root: the providers the application starts with.

import { provideBrowserGlobalErrorListeners, type ApplicationConfig } from '@angular/core';
import { APP_DEPENDENCIES } from './LR_render/app-dependencies';
import type { AppDependencies } from './LR_render/app.view';

export function appConfig(dependencies: AppDependencies): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      { provide: APP_DEPENDENCIES, useValue: dependencies },
    ],
  };
}
