import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { Article as ArticleModel } from '../../../../core/models/article.model';
import { Auth } from '../../../../core/services/auth';
import { ArticleService } from '../../../../core/services/article';

@Component({
  selector: 'app-articles',
  standalone: false,
  templateUrl: './articles.html',
  styleUrl: './articles.css',
})
export class Articles implements OnInit {
  articles: ArticleModel[] = [];
  loading = true;
  errorMessage = '';
  actionMessage = '';

  constructor(
    private articleService: ArticleService,
    public authService: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.loading = true;
    this.errorMessage = '';

    this.articleService
      .getArticles()
      .pipe(
        timeout(15000),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          const list = Array.isArray(response?.data) ? response.data : [];
          this.articles = list.map((post) => ({
            ...post,
            images: Array.isArray(post.images) ? post.images : [],
          }));
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to load articles.';
          this.cdr.detectChanges();
        },
      });
  }

  canManage(post: ArticleModel): boolean {
    const user = this.authService.getCurrentUser();
    const authorId = typeof post.author === 'string' ? post.author : post.author?.id || post.author?._id;
    const currentUserId = user?.id || user?._id;
    const isOwner = !!currentUserId && !!authorId && currentUserId === authorId;
    const isSuperAdmin = !!user && user.role === 'super-admin';
    return isOwner || isSuperAdmin;
  }

  getAuthorDisplayName(post: ArticleModel): string {
    const user = this.authService.getCurrentUser();
    const authorId = typeof post.author === 'string' ? post.author : post.author?.id || post.author?._id;
    const currentUserId = user?.id || user?._id;

    if (currentUserId && authorId && currentUserId === authorId) {
      return user?.name || user?.username || user?.email || 'You';
    }

    if (typeof post.author === 'string') {
      return 'Unknown';
    }

    return post.author?.name || post.author?.username || 'Unknown';
  }

  editArticle(post: ArticleModel): void {
    this.router.navigate(['/editor', post._id]);
  }

  deleteArticle(post: ArticleModel): void {
    if (!confirm('Delete this article?')) {
      return;
    }

    this.actionMessage = '';

    this.articleService.deleteArticle(post._id).subscribe({
      next: () => {
        this.actionMessage = 'Article deleted successfully.';
        this.articles = this.articles.filter((item) => item._id !== post._id);
      },
      error: (error) => {
        this.actionMessage = error?.error?.message || 'Failed to delete article.';
      },
    });
  }
}
