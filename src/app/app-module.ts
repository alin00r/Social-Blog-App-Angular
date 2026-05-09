import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Navbar } from './shared/components/navbar/navbar';
import { AuthModule } from './features/auth/auth-module';
import { UsersModule } from './features/users/users-module';
import { ArticlesModule } from './features/articles/articles-module';
import { authTokenInterceptor } from './core/interceptors/auth-token-interceptor';
import { Footer } from './shared/components/footer/footer';
import { Landing } from './features/home/pages/landing/landing';

@NgModule({
  declarations: [App, Navbar, Footer, Landing],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    AuthModule,
    UsersModule,
    ArticlesModule,
    ToastrModule.forRoot(),
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
