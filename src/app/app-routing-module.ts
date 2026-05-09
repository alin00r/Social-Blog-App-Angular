import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './features/auth/pages/login/login';
import { Register } from './features/auth/pages/register/register';
import { ForgotPassword } from './features/auth/pages/forgot-password/forgot-password';
import { VerifyCode } from './features/auth/pages/verify-code/verify-code';
import { ResetPassword } from './features/auth/pages/reset-password/reset-password';
import { Users } from './features/users/pages/users/users';
import { Articles } from './features/articles/pages/articles/articles';
import { Editor } from './features/articles/pages/editor/editor';
import { Landing } from './features/home/pages/landing/landing';
import { authGuard } from './core/guards/auth-guard';

const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'verify-code', component: VerifyCode },
  { path: 'reset-password', component: ResetPassword },
  { path: 'users', component: Users, canActivate: [authGuard] },
  { path: 'feed', loadComponent: () => import('./features/articles/pages/feed/feed').then((m) => m.Feed) },
  {
    path: 'groups',
    loadComponent: () =>
      import('./features/groups/pages/groups/groups').then((m) => m.GroupsPage),
    canActivate: [authGuard],
  },
  { path: 'articles', component: Articles },
  { path: 'editor', component: Editor, canActivate: [authGuard] },
  { path: 'editor/:id', component: Editor, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
