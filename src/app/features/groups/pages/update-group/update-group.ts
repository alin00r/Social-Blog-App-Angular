import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { GroupService } from '../../../../core/services/group';
import { Group } from '../../../../core/models/group.model';

@Component({
  selector: 'app-update-group-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './update-group.html',
})
export class UpdateGroupPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  errorMessage = '';
  groupId: string | null = null;
  currentGroup: Group | null = null;

  updateGroupForm = this.fb.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
  });

  updateGroupImgFile: File | null = null;

  constructor(
    private groupService: GroupService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.groupId = params['id'];
      if (this.groupId) {
        this.loadGroupData();
      }
    });
  }

  loadGroupData(): void {
    if (!this.groupId) return;

    this.loading = true;
    this.errorMessage = '';

    this.groupService
      .getGroupById(this.groupId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.currentGroup = response.data;
          this.updateGroupForm.patchValue({
            title: response.data.title,
            description: response.data.description,
          });
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to load group.';
          this.cdr.detectChanges();
        },
      });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateGroupImgFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  submit(): void {
    if (this.updateGroupForm.invalid || !this.groupId) {
      this.updateGroupForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const value = this.updateGroupForm.getRawValue();

    const payload = {
      title: value.title?.trim() || undefined,
      description: value.description?.trim() || undefined,
      groupImg: this.updateGroupImgFile,
    };

    this.groupService
      .updateGroup(this.groupId, payload)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/groups']);
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to update group.';
          this.cdr.detectChanges();
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/groups']);
  }
}
