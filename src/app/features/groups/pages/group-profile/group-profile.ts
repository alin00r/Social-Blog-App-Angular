import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Group } from '../../../../core/models/group.model';
import { GroupService } from '../../../../core/services/group';
import { Auth } from '../../../../core/services/auth';

interface MemberPermissionView {
  userId: string;
  permissions: string[];
  isAdmin: boolean;
}

@Component({
  selector: 'app-group-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-profile.html',
  styleUrl: './group-profile.css',
})
export class GroupProfilePage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupService = inject(GroupService);
  private authService = inject(Auth);
  private cdr = inject(ChangeDetectorRef);

  readonly defaultGroupImage = 'https://via.placeholder.com/300?text=Group';

  group: Group | null = null;
  memberPermissions: MemberPermissionView[] = [];
  groupLoading = false;
  errorMessage = '';
  currentUserId: string | null = null;

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?._id || this.authService.getCurrentUser()?.id || null;

    this.route.params.subscribe((params) => {
      const groupId = params['id'];
      if (groupId) {
        this.loadGroupProfile(groupId);
      }
    });
  }

  loadGroupProfile(groupId: string): void {
    this.groupLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.groupService
      .getGroupById(groupId)
      .pipe(finalize(() => {
        this.groupLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response: any) => {
          console.log('Group API Response:', response);
          // Handle both { data: {...} } and direct object responses
          const groupData = response?.data || response;
          if (groupData) {
            this.group = groupData;
            this.loadMemberPermissions();
            this.cdr.markForCheck();
          } else {
            this.errorMessage = 'Invalid group data received';
          }
        },
        error: (error) => {
          console.error('Group load error:', error);
          this.errorMessage = error?.error?.message || 'Failed to load group profile.';
          this.cdr.markForCheck();
        },
      });
  }

  loadMemberPermissions(): void {
    if (!this.group || !this.group.memberPermissions) return;

    this.memberPermissions = this.group.memberPermissions.map((perm: any) => ({
      userId: perm.user,
      permissions: perm.permissions || [],
      isAdmin: this.group?.admins?.includes(perm.user) || false,
    }));
  }

  getGroupImageUrl(): string {
    return this.group?.groupImg || this.defaultGroupImage;
  }

  isGroupAdmin(): boolean {
    if (!this.group || !this.currentUserId) return false;
    return this.group.admins?.includes(this.currentUserId) || false;
  }

  editGroup(): void {
    if (this.group?._id) {
      this.router.navigate(['/groups/update', this.group._id]);
    }
  }

  navigateToGroupFeed(): void {
    if (this.group?._id) {
      this.router.navigate(['/feed/group', this.group._id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/groups']);
  }
}
