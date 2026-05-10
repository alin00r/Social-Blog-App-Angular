import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { finalize, timeout } from 'rxjs/operators';
import { Article as ArticleModel } from '../../../../core/models/article.model';
import { Group as GroupModel } from '../../../../core/models/group.model';
import { ArticleService } from '../../../../core/services/article';
import { GroupService } from '../../../../core/services/group';
import { Router } from '@angular/router';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feed.html',
  styleUrl: './feed.css',
})
export class Feed implements OnInit, OnDestroy {
  readonly defaultProfileImage =
    'https://img.magnific.com/free-psd/contact-icon-illustration-isolated_23-2151903337.jpg?semt=ais_hybrid&w=740&q=80';

  posts: ArticleModel[] = [];
  loading = true;
  errorMessage = '';

  myGroups: GroupModel[] = [];
  myGroupsLoading = false;
  myGroupsError = '';

  allGroups: GroupModel[] = [];
  allGroupsLoading = false;
  groupsById: Map<string, GroupModel> = new Map();

  selectedGroupId = '';
  selectedGroupPosts: ArticleModel[] = [];
  selectedGroupPostsLoading = false;

  // Track current image index for each post
  postImageIndexes: Map<string, number> = new Map();

  // Auto-play tracking
  private autoPlayIntervals: Map<string, number> = new Map();
  autoPlayActive: Map<string, boolean> = new Map();
  private readonly AUTO_PLAY_INTERVAL = 4000; // 4 seconds

  constructor(
    private articleService: ArticleService,
    private groupService: GroupService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadFeed();
    this.loadMyGroups();
    this.loadAllGroups();
  }

  ngOnDestroy(): void {
    this.stopAllAutoPlay();
  }

  loadFeed(): void {
    this.loading = true;
    this.errorMessage = '';

    this.articleService
      .getFeed()
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
          this.posts = list.map((post) => ({
            ...post,
            images: Array.isArray(post.images) ? post.images : [],
          }));

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
          this.errorMessage = error?.error?.message || 'Failed to load public feed.';
          this.cdr.detectChanges();
        },
      });
  }

  loadMyGroups(): void {
    this.myGroupsLoading = true;
    this.myGroupsError = '';

    this.groupService
      .getMyGroups()
      .pipe(
        finalize(() => {
          this.myGroupsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (groups) => {
          this.myGroups = Array.isArray(groups) ? groups : [];
          this.selectedGroupId = '';
          this.selectedGroupPosts = [];
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.myGroupsError = error?.error?.message || 'Failed to load your groups.';
          this.cdr.detectChanges();
        },
      });
  }

  loadAllGroups(): void {
    this.allGroupsLoading = true;

    this.groupService
      .getAll()
      .pipe(
        finalize(() => {
          this.allGroupsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (groups) => {
          this.allGroups = Array.isArray(groups) ? groups : [];
          this.groupsById.clear();
          this.allGroups.forEach((group) => {
            this.groupsById.set(group._id, group);
          });
          this.cdr.detectChanges();
        },
        error: () => {
          this.allGroups = [];
          this.groupsById.clear();
          this.cdr.detectChanges();
        },
      });
  }

  openGroup(groupId: string): void {
    if (!groupId) {
      return;
    }
    this.router.navigate(['/feed/group', groupId]);
  }

  getAuthorName(post: ArticleModel): string {
    if (typeof post.author === 'string') {
      return 'Unknown';
    }
    return post.author?.name || post.author?.username || 'Unknown';
  }

  getAuthorAvatar(post: ArticleModel): string | null {
    if (!post.author || typeof post.author === 'string') {
      return this.defaultProfileImage;
    }

    const profileImg = post.author.profileImg?.trim();
    return profileImg ? profileImg : this.defaultProfileImage;
  }


    getPostInitial(post: ArticleModel): string {
      const author = this.getAuthorName(post).trim();
      return author ? author.charAt(0).toUpperCase() : 'U';
    }

    getPostId(post: ArticleModel): string {
      return (post as any)._id || '';
    }

    getGroupForPost(post: ArticleModel): GroupModel | undefined {
      const groupId = typeof post.group === 'string' ? post.group : (post.group as any)?._id;
      return groupId ? this.groupsById.get(groupId) : undefined;
    }

    getGroupNameForPost(post: ArticleModel): string {
      const group = this.getGroupForPost(post);
      return group?.title || '';
    }

    getGroupImage(group: GroupModel): string {
      return group.groupImg || '';
    }

    getGroupSummary(group: GroupModel): string {
      return group.description || 'No description provided.';
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

    getCurrentImage(post: ArticleModel): string | undefined {
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

      this.stopAutoPlay(postId);
      this.autoPlayActive.set(postId, true);

      const interval = window.setInterval(() => {
        const currentIndex = this.postImageIndexes.get(postId) || 0;
        const nextIndex = (currentIndex + 1) % totalImages;
        this.postImageIndexes.set(postId, nextIndex);
        this.cdr.detectChanges();
      }, this.AUTO_PLAY_INTERVAL);

      this.autoPlayIntervals.set(postId, interval);
    }

    pauseAutoPlay(postId: string): void {
      this.stopAutoPlay(postId);
    }

    resumeAutoPlay(postId: string, totalImages: number): void {
      if (this.autoPlayActive.get(postId)) {
        this.startAutoPlay(postId, totalImages);
      }
    }

    stopAutoPlay(postId: string): void {
      const interval = this.autoPlayIntervals.get(postId);
      if (interval) {
        clearInterval(interval);
        this.autoPlayIntervals.delete(postId);
      }
    }

    stopAllAutoPlay(): void {
      this.autoPlayIntervals.forEach((interval) => {
        clearInterval(interval);
      });
      this.autoPlayIntervals.clear();
      this.autoPlayActive.clear();
    }
}
