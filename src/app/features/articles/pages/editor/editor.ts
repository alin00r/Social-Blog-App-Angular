import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  private currentArticle: ArticleModel | null = null;

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
      this.articleService
        .updateArticle(this.articleId, {
          title: formValue.title as string,
          content: formValue.content as string,
          group: (formValue.group as string) || undefined,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.router.navigate(['/articles']);
          },
          error: (error) => {
            this.saving = false;
            this.errorMessage = error?.error?.message || 'Failed to update article.';
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
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/articles']);
        },
        error: (error) => {
          this.saving = false;
          this.errorMessage = error?.error?.message || 'Failed to create article.';
        },
      });
  }

  private loadArticleForEdit(): void {
    this.loading = true;
    this.errorMessage = '';

    this.articleService.getArticles().subscribe({
      next: (response) => {
        this.currentArticle = response.data.find((post) => post._id === this.articleId) || null;

        if (!this.currentArticle) {
          this.errorMessage = 'Article not found.';
          this.loading = false;
          return;
        }

        this.editorForm.patchValue({
          title: this.currentArticle.title,
          content: this.currentArticle.content,
          group: typeof this.currentArticle.group === 'string' ? this.currentArticle.group : this.currentArticle.group?._id || '',
        });
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
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
