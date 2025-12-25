import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

import { registerCustomIcons } from './assets/icon';

registerCustomIcons();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
