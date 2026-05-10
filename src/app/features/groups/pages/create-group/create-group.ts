import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { GroupService } from '../../../../core/services/group';

@Component({
  selector: 'app-create-group-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-group.html',
})
export class CreateGroupPage {
  private fb = inject(FormBuilder);

  loading = false;
  errorMessage = '';

  createGroupForm = this.fb.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
  });

  createGroupImgFile: File | null = null;

  constructor(
    private groupService: GroupService,
    private router: Router,
  ) {}

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.createGroupImgFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  submit(): void {
    if (this.createGroupForm.invalid) {
      this.createGroupForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const value = this.createGroupForm.getRawValue();

    this.groupService
      .createGroup({
        title: value.title?.trim() || '',
        description: value.description?.trim() || '',
        groupImg: this.createGroupImgFile,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/groups']);
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to create group.';
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/groups']);
  }
}
