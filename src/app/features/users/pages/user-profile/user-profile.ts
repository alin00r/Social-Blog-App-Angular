import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { User } from '../../../../core/models/user.model';
import { Auth } from '../../../../core/services/auth';
import { Article } from '../../../../core/models/article.model';
import { ArticleService } from '../../../../core/services/article';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfilePage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(Auth);
  private articleService = inject(ArticleService);

  readonly defaultProfileImage =
    'https://img.magnific.com/free-psd/contact-icon-illustration-isolated_23-2151903337.jpg?semt=ais_hybrid&w=740&q=80';

  userId: string | null = null;
  user: User | null = null;
  userArticles: Article[] = [];
  userLoading = false;
  articlesLoading = false;
  errorMessage = '';
  currentUserId: string | null = null;

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?._id || this.authService.getCurrentUser()?.id || null;

    this.route.params.subscribe((params) => {
      this.userId = params['id'];
      if (this.userId) {
        this.loadUserProfile();
        this.loadUserArticles();
      }
    });
  }

  loadUserProfile(): void {
    if (!this.userId) return;

    this.userLoading = true;
    this.errorMessage = '';

    this.authService
      .getCurrentUserProfile(true)
      .pipe(finalize(() => (this.userLoading = false)))
      .subscribe({
        next: (user) => {
          if (user._id === this.userId || user.id === this.userId) {
            this.user = user;
          } else {
            this.errorMessage = 'User not found';
          }
        },
        error: () => {
          this.errorMessage = 'Failed to load user profile';
        },
      });
  }

  loadUserArticles(): void {
    if (!this.userId) return;

    this.articlesLoading = true;

    this.articleService
      .getArticles()
      .pipe(finalize(() => (this.articlesLoading = false)))
      .subscribe({
        next: (response) => {
          this.userArticles = (Array.isArray(response.data) ? response.data : []).filter(
            (article) => article.author === this.userId || (article.author as any)?._id === this.userId,
          );
        },
        error: () => {
          this.userArticles = [];
        },
      });
  }

  getProfileImageUrl(): string {
    return this.user?.profileImg || this.defaultProfileImage;
  }

  isCurrentUser(): boolean {
    if (!this.user || !this.currentUserId) return false;
    return this.user._id === this.currentUserId || this.user.id === this.currentUserId;
  }

  editProfile(): void {
    this.router.navigate(['/users']);
  }

  viewArticle(articleId: string): void {
    // Navigate to article detail or editor
    this.router.navigate(['/editor', articleId]);
  }

  goBack(): void {
    this.router.navigate(['/feed']);
  }
}
