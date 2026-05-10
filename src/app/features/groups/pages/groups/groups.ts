import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Article } from '../../../../core/models/article.model';
import { Group } from '../../../../core/models/group.model';
import { Auth } from '../../../../core/services/auth';
import { GroupService } from '../../../../core/services/group';

@Component({
  selector: 'app-groups-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './groups.html',
  styleUrl: './groups.css',
})
export class GroupsPage implements OnInit {
  groups: Group[] = [];
  myGroups: Group[] = [];
  groupsLoading = false;
  groupsError = '';
  groupsSuccess = '';

  selectedGroup: Group | null = null;
  groupId = '';
  addMemberGroupId = '';
  memberUserId = '';
  removeMemberUserId = '';
  permissionUserId = '';
  permissionInput = 'read,write';

  groupPosts: Article[] = [];
  groupPostsLoading = false;
  selectedGroupPost: Article | null = null;
  groupPostId = '';

  constructor(
    private groupService: GroupService,
    private authService: Auth,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadAllGroups();
    this.loadMyGroups();
  }

  openCreateGroupPage(): void {
    this.router.navigate(['/groups/create']);
  }

  loadMyGroups(): void {
    this.groupService
      .getMyGroups()
      .pipe(
        finalize(() => {
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (groups) => {
          this.myGroups = Array.isArray(groups) ? groups : [];

          if (!this.addMemberGroupId && this.myGroups.length > 0) {
            this.addMemberGroupId = this.myGroups[0]._id;
          }

          this.cdr.detectChanges();
        },
        error: () => {
          this.myGroups = [];
          this.cdr.detectChanges();
        },
      });
  }

  loadAllGroups(): void {
    this.groupsLoading = true;
    this.groupsError = '';

    this.groupService
      .getAll()
      .pipe(
        finalize(() => {
          this.groupsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (groups) => {
          this.groups = Array.isArray(groups) ? groups : [];
          this.groupsSuccess = this.groups.length ? 'Groups loaded successfully.' : 'No groups found yet.';
          this.groupsError = '';
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.groupsError = error?.error?.message || 'Failed to load groups.';
          this.groupsSuccess = '';
          this.cdr.detectChanges();
        },
      });
  }

  selectGroup(group: Group): void {
    this.router.navigate(['/groups/update', group._id]);
  }

  isGroupAdmin(group: Group): boolean {
    const currentUser = this.authService.getCurrentUser();
    const currentUserId = currentUser?.id || currentUser?._id;

    if (!currentUserId || !Array.isArray(group.admins)) {
      return false;
    }

    return group.admins.some((admin) => {
      if (!admin) {
        return false;
      }

      if (typeof admin === 'string') {
        return admin === currentUserId;
      }

      const adminRef = admin as { _id?: string; id?: string };
      return adminRef._id === currentUserId || adminRef.id === currentUserId;
    });
  }

  deleteGroupFromCard(group: Group): void {
    this.groupId = group._id;
    this.deleteGroup();
  }

  loadGroup(): void {
    if (!this.groupId.trim()) {
      this.groupsError = 'Please enter a group ID.';
      this.groupsSuccess = '';
      return;
    }

    this.groupsLoading = true;
    this.groupsError = '';
    this.groupsSuccess = '';

    this.groupService
      .getGroupById(this.groupId.trim())
      .pipe(
        finalize(() => {
          this.groupsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.selectedGroup = response.data;
          this.addMemberGroupId = response.data._id;
          this.groupsSuccess = 'Group loaded successfully.';
          this.groupsError = '';
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.groupsError = error?.error?.message || 'Failed to load group.';
          this.groupsSuccess = '';
          this.cdr.detectChanges();
        },
      });
  }

  deleteGroup(): void {
    if (!this.groupId.trim()) {
      this.groupsError = 'Enter a group ID first.';
      this.groupsSuccess = '';
      return;
    }

    this.groupsLoading = true;
    this.groupsError = '';
    this.groupsSuccess = '';

    this.groupService
      .deleteGroup(this.groupId.trim())
      .pipe(
        finalize(() => {
          this.groupsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.selectedGroup = null;
          this.groupPosts = [];
          this.selectedGroupPost = null;
          this.groupsSuccess = 'Group deleted successfully.';
          this.groupsError = '';
          if (this.addMemberGroupId === this.groupId.trim()) {
            this.addMemberGroupId = this.myGroups.find((group) => group._id !== this.groupId.trim())?._id || '';
          }
          this.removeGroupById(this.groupId.trim());
          this.groupId = '';
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.groupsError = error?.error?.message || 'Failed to delete group.';
          this.groupsSuccess = '';
          this.cdr.detectChanges();
        },
      });
  }

  addMember(): void {
    if (!this.addMemberGroupId.trim() || !this.memberUserId.trim()) {
      this.groupsError = 'Group and user ID are required.';
      this.groupsSuccess = '';
      return;
    }

    this.groupsLoading = true;
    this.groupsError = '';
    this.groupsSuccess = '';

    this.groupService
      .addUserToGroup(this.addMemberGroupId.trim(), this.memberUserId.trim())
      .pipe(
        finalize(() => {
          this.groupsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.selectedGroup = response.data;
          this.memberUserId = '';
          this.addMemberGroupId = response.data._id || this.addMemberGroupId;
          this.groupsSuccess = 'User added to group.';
          this.groupsError = '';
          this.upsertGroup(response.data);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.groupsError = error?.error?.message || 'Failed to add user.';
          this.groupsSuccess = '';
          this.cdr.detectChanges();
        },
      });
  }

  removeMember(): void {
    if (!this.groupId.trim() || !this.removeMemberUserId.trim()) {
      this.groupsError = 'Group ID and user ID are required.';
      this.groupsSuccess = '';
      return;
    }

    this.groupsLoading = true;
    this.groupsError = '';
    this.groupsSuccess = '';

    this.groupService
      .removeUserFromGroup(this.groupId.trim(), this.removeMemberUserId.trim())
      .pipe(
        finalize(() => {
          this.groupsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.selectedGroup = response.data;
          this.removeMemberUserId = '';
          this.groupsSuccess = 'User removed from group.';
          this.groupsError = '';
          this.upsertGroup(response.data);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.groupsError = error?.error?.message || 'Failed to remove user.';
          this.groupsSuccess = '';
          this.cdr.detectChanges();
        },
      });
  }

  updatePermissions(): void {
    if (!this.groupId.trim() || !this.permissionUserId.trim()) {
      this.groupsError = 'Group ID and user ID are required.';
      this.groupsSuccess = '';
      return;
    }

    const permissions = this.permissionInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (permissions.length === 0) {
      this.groupsError = 'Please provide at least one permission.';
      this.groupsSuccess = '';
      return;
    }

    this.groupsLoading = true;
    this.groupsError = '';
    this.groupsSuccess = '';

    this.groupService
      .updateMemberPermissions(this.groupId.trim(), {
        userId: this.permissionUserId.trim(),
        permissions,
      })
      .pipe(
        finalize(() => {
          this.groupsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.selectedGroup = response.data;
          this.groupsSuccess = 'Member permissions updated.';
          this.groupsError = '';
          this.upsertGroup(response.data);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.groupsError = error?.error?.message || 'Failed to update permissions.';
          this.groupsSuccess = '';
          this.cdr.detectChanges();
        },
      });
  }

  loadGroupPosts(): void {
    if (!this.groupId.trim()) {
      this.groupsError = 'Please enter a group ID first.';
      this.groupsSuccess = '';
      return;
    }

    this.groupPostsLoading = true;
    this.groupsError = '';
    this.groupsSuccess = '';

    this.groupService
      .getGroupPosts(this.groupId.trim())
      .pipe(
        finalize(() => {
          this.groupPostsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.groupPosts = Array.isArray(response.data) ? response.data : [];
          this.selectedGroupPost = null;
          this.groupsSuccess = 'Group posts loaded.';
          this.groupsError = '';
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.groupsError = error?.error?.message || 'Failed to load group posts.';
          this.groupsSuccess = '';
          this.cdr.detectChanges();
        },
      });
  }

  loadGroupPostById(): void {
    if (!this.groupId.trim() || !this.groupPostId.trim()) {
      this.groupsError = 'Group ID and post ID are required.';
      this.groupsSuccess = '';
      return;
    }

    this.groupPostsLoading = true;
    this.groupsError = '';
    this.groupsSuccess = '';

    this.groupService
      .getGroupPostById(this.groupId.trim(), this.groupPostId.trim())
      .pipe(
        finalize(() => {
          this.groupPostsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.selectedGroupPost = response.data;
          this.groupsSuccess = 'Group post loaded.';
          this.groupsError = '';
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.groupsError = error?.error?.message || 'Failed to load group post.';
          this.groupsSuccess = '';
          this.cdr.detectChanges();
        },
      });
  }

  private upsertGroup(group: Group): void {
    const index = this.groups.findIndex((item) => item._id === group._id);

    if (index === -1) {
      this.groups = [group, ...this.groups];
      return;
    }

    this.groups = this.groups.map((item, itemIndex) => (itemIndex === index ? group : item));
  }

  private removeGroupById(groupId: string): void {
    this.groups = this.groups.filter((group) => group._id !== groupId);
  }

  getSelectedGroupMemberOptions(): Array<{ id: string; label: string }> {
    const members = this.selectedGroup?.members;

    if (!Array.isArray(members)) {
      return [];
    }

    return members
      .map((member) => {
        if (!member) {
          return null;
        }

        if (typeof member === 'string') {
          return { id: member, label: member };
        }

        const user = member as {
          _id?: string;
          id?: string;
          name?: string;
          username?: string;
          email?: string;
        };
        const id = user._id || user.id || '';

        if (!id) {
          return null;
        }

        return {
          id,
          label: user.name || user.username || user.email || id,
        };
      })
      .filter((member): member is { id: string; label: string } => !!member);
  }
}
