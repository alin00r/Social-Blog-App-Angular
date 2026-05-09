import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../../core/services/auth';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const passwordConfirm = control.get('passwordConfirm');

  if (!password || !passwordConfirm) {
    return null;
  }

  return password.value === passwordConfirm.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);

  loading = false;

  registerForm = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  constructor(private authService: Auth, private router: Router) {}

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService
      .register(this.registerForm.getRawValue() as { name: string; email: string; password: string; passwordConfirm: string })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/articles']);
        },
        error: () => {
          this.loading = false;
        },
      });
  }
}
