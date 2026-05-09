import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';

document.documentElement.classList.add('dark');

platformBrowser()
  .bootstrapModule(AppModule, {})
  .catch((err) => console.error(err));
