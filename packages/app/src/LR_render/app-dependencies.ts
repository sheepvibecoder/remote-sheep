// How the composition root hands the adapters to the Angular view: one token for the whole set,
// until each screen is rebuilt in Angular and asks for the ports it needs on its own.

import { InjectionToken } from '@angular/core';
import type { AppDependencies } from './app.view';

export const APP_DEPENDENCIES = new InjectionToken<AppDependencies>('AppDependencies');
