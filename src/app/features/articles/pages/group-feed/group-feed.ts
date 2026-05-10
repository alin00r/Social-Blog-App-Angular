import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Article } from '../../../../core/models/article.model';
import { Group } from '../../../../core/models/group.model';
import { GroupService } from '../../../../core/services/group';

@Component({
  selector: 'app-group-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-feed.html',
  styleUrl: './group-feed.css',
})
export class GroupFeed implements OnInit {
  groupId: string | null = null;
  group: Group | null = null;
  posts: Article[] = [];
  loading = true;
  errorMessage = '';

  // Track current image index for each post
  postImageIndexes: Map<string, number> = new Map();

  // Auto-play tracking
  private autoPlayIntervals: Map<string, number> = new Map();
  autoPlayActive: Map<string, boolean> = new Map();
  private readonly AUTO_PLAY_INTERVAL = 4000;

  constructor(
    private groupService: GroupService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.groupId = params['id'];
      if (this.groupId) {
        this.loadGroupPosts();
      }
    });
  }

  loadGroupPosts(): void {
    if (!this.groupId) return;

    this.loading = true;
    this.errorMessage = '';

    this.groupService
      .getGroupById(this.groupId)
      .pipe(
        finalize(() => {
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.group = response.data;
          this.loadPosts();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to load group.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadPosts(): void {
    if (!this.groupId) return;

    this.groupService
      .getGroupPosts(this.groupId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.posts = Array.isArray(response?.data) ? response.data : [];

          // Auto-start auto-play for posts with multiple images
          this.posts.forEach((post) => {
            if (post.images && post.images.length > 1) {
              const postId = (post as any)._id || '';
              this.startAutoPlay(postId, post.images.length);
            }
          });

          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to load group posts.';
          this.cdr.detectChanges();
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/feed']);
  }

  getAuthorName(post: Article): string {
    if (typeof post.author === 'string') {
      return 'Unknown';
    }
    return post.author?.name || post.author?.username || 'Unknown';
  }

  getAuthorAvatar(post: Article): string | null {
    if (!post.author || typeof post.author === 'string') {
      return null;
    }
    return post.author.profileImg || null;
  }

  getPostInitial(post: Article): string {
    const author = this.getAuthorName(post).trim();
    return author ? author.charAt(0).toUpperCase() : 'U';
  }

  getPostId(post: Article): string {
    return (post as any)._id || '';
  }

  nextImage(postId: string, totalImages: number): void {
    const currentIndex = this.postImageIndexes.get(postId) || 0;
    const nextIndex = (currentIndex + 1) % totalImages;
    this.postImageIndexes.set(postId, nextIndex);
  }

  prevImage(postId: string, totalImages: number): void {
    const currentIndex = this.postImageIndexes.get(postId) || 0;
    const prevIndex = (currentIndex - 1 + totalImages) % totalImages;
    this.postImageIndexes.set(postId, prevIndex);
  }

  getCurrentImage(post: Article): string | undefined {
    const postId = (post as any)._id || '';
    const currentIndex = this.postImageIndexes.get(postId) || 0;
    return post.images?.[currentIndex]?.url;
  }

  setImageIndex(postId: string, index: number): void {
    this.postImageIndexes.set(postId, index);
  }

  getImageIndex(postId: string): number {
    return this.postImageIndexes.get(postId) || 0;
  }

  startAutoPlay(postId: string, totalImages: number): void {
    if (totalImages <= 1) return;

    this.autoPlayActive.set(postId, true);

    const interval = window.setInterval(() => {
      const currentIndex = this.postImageIndexes.get(postId) || 0;
      const nextIndex = (currentIndex + 1) % totalImages;
      this.postImageIndexes.set(postId, nextIndex);
      this.cdr.detectChanges();
    }, this.AUTO_PLAY_INTERVAL);

    this.autoPlayIntervals.set(postId, interval);
  }

  stopAutoPlay(postId: string): void {
    const interval = this.autoPlayIntervals.get(postId);
    if (interval !== undefined) {
      clearInterval(interval);
      this.autoPlayIntervals.delete(postId);
    }
    this.autoPlayActive.set(postId, false);
  }

  pauseAutoPlay(postId: string): void {
    this.stopAutoPlay(postId);
    this.autoPlayActive.set(postId, false);
  }

  resumeAutoPlay(postId: string, totalImages: number): void {
    if (totalImages > 1) {
      this.startAutoPlay(postId, totalImages);
    }
  }

  ngOnDestroy(): void {
    this.autoPlayIntervals.forEach((interval) => clearInterval(interval));
    this.autoPlayIntervals.clear();
  }
}
