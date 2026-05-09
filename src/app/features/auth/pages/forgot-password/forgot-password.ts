import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private fb = inject(FormBuilder);

  loading = false;

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(private authService: Auth, private router: Router) {}

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService.forgotPassword(this.forgotPasswordForm.getRawValue() as { email: string }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/verify-code']);
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
