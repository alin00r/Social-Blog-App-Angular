import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { VerifyCode } from './pages/verify-code/verify-code';
import { ResetPassword } from './pages/reset-password/reset-password';

@NgModule({
  declarations: [Login, Register, ForgotPassword, VerifyCode, ResetPassword],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class AuthModule {}
