import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Article as ArticleModel } from '../../../../core/models/article.model';
import { Group } from '../../../../core/models/group.model';
import { ArticleService } from '../../../../core/services/article';
import { GroupService } from '../../../../core/services/group';

@Component({
  selector: 'app-editor',
  standalone: false,
  templateUrl: './editor.html',
  styleUrl: './editor.css',
})
export class Editor implements OnInit {
  private fb = inject(FormBuilder);

  loading = false;
  saving = false;
  groupsLoading = false;
  errorMessage = '';
  groupsError = '';
  isEditMode = false;
  articleId = '';
  selectedImages: File[] = [];
  selectedImagePreviews: { file: File; preview: string }[] = [];
  myGroups: Group[] = [];
  currentArticle: ArticleModel | null = null;
  private articleLoadTimeoutId: ReturnType<typeof window.setTimeout> | null = null;

  editorForm = this.createForm();

  constructor(
    private articleService: ArticleService,
    private groupService: GroupService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadMyGroups();
    this.articleId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditMode = !!this.articleId;

    if (this.isEditMode) {
      this.loadArticleForEdit();
    }
  }

  onImagesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedImages = input.files ? Array.from(input.files) : [];

    // Generate previews
    this.selectedImagePreviews = this.selectedImages.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
  }

  onSubmit(): void {
    if (this.editorForm.invalid) {
      this.editorForm.markAllAsTouched();
      return;
    }

    if (!this.isEditMode && this.selectedImages.length === 0) {
      this.errorMessage = 'Please select at least one image.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const formValue = this.editorForm.getRawValue();

    if (this.isEditMode) {
      // Only send new images - backend keeps existing ones
      this.articleService
        .updateArticle(this.articleId, {
          title: formValue.title as string,
          content: formValue.content as string,
          group: (formValue.group as string) || undefined,
          images: this.selectedImages, // Only new images selected by user
        })
        .pipe(
          finalize(() => {
            this.saving = false;
          }),
        )
        .subscribe({
          next: (response) => {
            // Update local article state with the response
            this.currentArticle = response.data;

            // Wait a moment to show success, then navigate
            setTimeout(() => {
              this.router.navigate(['/articles']);
            }, 1500);
          },
          error: (error) => {
            this.errorMessage = error?.displayMessage || error?.error?.message || 'Failed to update article. Please try again.';
          },
        });
      return;
    }

    this.articleService
      .createArticle({
        title: formValue.title as string,
        content: formValue.content as string,
        images: this.selectedImages,
        group: (formValue.group as string) || undefined,
      })
      .pipe(
        finalize(() => {
          this.saving = false;
        }),
      )
      .subscribe({
        next: () => {
          setTimeout(() => {
            this.router.navigate(['/articles']);
          }, 1500);
        },
        error: (error) => {
          this.errorMessage = error?.displayMessage || error?.error?.message || 'Failed to create article. Please try again.';
        },
      });
  }

  private loadArticleForEdit(): void {
    this.loading = true;
    this.errorMessage = '';

    if (this.articleLoadTimeoutId) {
      window.clearTimeout(this.articleLoadTimeoutId);
    }

    this.articleLoadTimeoutId = window.setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.errorMessage = 'Article is taking longer than expected to load. You can refresh or try again.';
      }
    }, 5000);

    this.articleService
      .getArticleById(this.articleId)
      .pipe(
        finalize(() => {
          if (this.articleLoadTimeoutId) {
            window.clearTimeout(this.articleLoadTimeoutId);
            this.articleLoadTimeoutId = null;
          }
          this.loading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.currentArticle = response?.data || null;

          if (!this.currentArticle) {
            this.errorMessage = 'Article not found.';
            return;
          }

          this.editorForm.patchValue({
            title: this.currentArticle.title,
            content: this.currentArticle.content,
            group:
              typeof this.currentArticle.group === 'string'
                ? this.currentArticle.group
                : this.currentArticle.group?._id || '',
          });
          this.selectedImages = [];
          this.selectedImagePreviews = [];
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to load article.';
        },
      });
  }

  private loadMyGroups(): void {
    this.groupsLoading = true;
    this.groupsError = '';

    this.groupService.getMyGroups().subscribe({
      next: (groups) => {
        this.myGroups = Array.isArray(groups) ? groups : [];
        this.groupsLoading = false;
      },
      error: (error) => {
        this.myGroups = [];
        this.groupsLoading = false;
        this.groupsError = error?.error?.message || 'Failed to load your groups.';
      },
    });
  }


  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  removeImage(index: number): void {
    URL.revokeObjectURL(this.selectedImagePreviews[index].preview);
    this.selectedImagePreviews.splice(index, 1);
    this.selectedImages.splice(index, 1);
  }

  private createForm() {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(3)]],
      group: [''],
    });
  }
}
