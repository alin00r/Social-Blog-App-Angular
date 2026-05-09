import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-verify-code',
  standalone: false,
  templateUrl: './verify-code.html',
  styleUrl: './verify-code.css',
})
export class VerifyCode {
  private fb = inject(FormBuilder);

  loading = false;

  verifyCodeForm = this.fb.group({
    resetCode: ['', [Validators.required]],
  });

  constructor(private authService: Auth, private router: Router) {}

  onSubmit(): void {
    if (this.verifyCodeForm.invalid) {
      this.verifyCodeForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService.verifyCode(this.verifyCodeForm.getRawValue() as { resetCode: string }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/reset-password']);
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
