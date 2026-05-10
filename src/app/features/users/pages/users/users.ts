import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../../../core/services/auth';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private fb = inject(FormBuilder);
  readonly defaultProfileImage =
    'https://img.magnific.com/free-psd/contact-icon-illustration-isolated_23-2151903337.jpg?semt=ais_hybrid&w=740&q=80';

  currentUser: User | null = null;
  profileLoading = false;
  passwordLoading = false;
  deleteLoading = false;
  selectedProfileImage: File | null = null;

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
  });

  passwordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private authService: Auth,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      this.patchProfileForm(this.currentUser);
    }

    if (!this.currentUser) {
      this.profileLoading = true;
      this.authService
        .getCurrentUserProfile()
        .pipe(finalize(() => (this.profileLoading = false)))
        .subscribe({
          next: (user) => {
            this.currentUser = user;
            this.patchProfileForm(user);
          },
          error: () => {
            this.router.navigate(['/login']);
          },
        });
    }
  }

  onProfileImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedProfileImage = input.files?.[0] || null;
  }

  getProfileImageUrl(): string {
    const profileImg = this.currentUser?.profileImg?.trim();
    return profileImg ? profileImg : this.defaultProfileImage;
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileLoading = true;

    const value = this.profileForm.getRawValue();
    this.authService
      .updateMe({
        name: value.name as string,
        email: value.email as string,
        profileImg: this.selectedProfileImage,
      })
      .pipe(finalize(() => (this.profileLoading = false)))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.patchProfileForm(user);
          this.selectedProfileImage = null;
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordLoading = true;

    this.authService
      .changeMyPassword({ newPassword: this.passwordForm.controls.newPassword.value || '' })
      .pipe(finalize(() => (this.passwordLoading = false)))
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.router.navigate(['/login']);
        },
      });
  }

  deleteAccount(): void {
    if (!confirm('Deactivate your account?')) {
      return;
    }

    this.deleteLoading = true;

    this.authService
      .deleteMe()
      .pipe(finalize(() => (this.deleteLoading = false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
      });
  }

  private patchProfileForm(user: User): void {
    this.profileForm.patchValue({
      name: user.name,
      email: user.email,
    });
  }
}
