import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Article } from '../../../../core/models/article.model';
import { Group } from '../../../../core/models/group.model';
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
  isUpdateGroupOpen = false;
  groupsLoading = false;
  groupsError = '';
  groupsSuccess = '';

  createTitle = '';
  createDescription = '';
  createGroupImgFile: File | null = null;

  groupId = '';
  selectedGroup: Group | null = null;

  updateTitle = '';
  updateDescription = '';
  updateGroupImgFile: File | null = null;

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
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAllGroups();
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
    this.selectedGroup = group;
    this.isUpdateGroupOpen = true;
    this.groupId = group._id;
    this.updateTitle = group.title;
    this.updateDescription = group.description;
    this.groupsSuccess = 'Group selected.';
    this.groupsError = '';
  }

  deleteGroupFromCard(group: Group): void {
    this.groupId = group._id;
    this.deleteGroup();
  }

  closeUpdateGroup(): void {
    this.isUpdateGroupOpen = false;
  }

  onCreateGroupImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.createGroupImgFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  onUpdateGroupImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateGroupImgFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  createGroup(): void {
    if (!this.createTitle.trim() || !this.createDescription.trim()) {
      this.groupsError = 'Group title and description are required.';
      this.groupsSuccess = '';
      return;
    }

    this.groupsLoading = true;
    this.groupsError = '';
    this.groupsSuccess = '';

    this.groupService
      .createGroup({
        title: this.createTitle.trim(),
        description: this.createDescription.trim(),
        groupImg: this.createGroupImgFile,
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
          this.groupId = response.data._id;
          this.updateTitle = response.data.title;
          this.updateDescription = response.data.description;
          this.createTitle = '';
          this.createDescription = '';
          this.createGroupImgFile = null;
          this.groupsSuccess = 'Group created and selected.';
          this.groupsError = '';
          this.upsertGroup(response.data);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.groupsError = error?.error?.message || 'Failed to create group.';
          this.groupsSuccess = '';
          this.cdr.detectChanges();
        },
      });
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
          this.isUpdateGroupOpen = true;
          this.updateTitle = response.data.title;
          this.updateDescription = response.data.description;
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

  updateGroup(): void {
    if (!this.groupId.trim()) {
      this.groupsError = 'Enter a group ID first.';
      this.groupsSuccess = '';
      return;
    }

    const payload = {
      title: this.updateTitle.trim() || undefined,
      description: this.updateDescription.trim() || undefined,
      groupImg: this.updateGroupImgFile,
    };

    if (!payload.title && !payload.description && !payload.groupImg) {
      this.groupsError = 'Please provide at least one field to update.';
      this.groupsSuccess = '';
      return;
    }

    this.groupsLoading = true;
    this.groupsError = '';
    this.groupsSuccess = '';

    this.groupService
      .updateGroup(this.groupId.trim(), payload)
      .pipe(
        finalize(() => {
          this.groupsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.selectedGroup = response.data;
          this.updateTitle = response.data.title;
          this.updateDescription = response.data.description;
          this.updateGroupImgFile = null;
          this.groupsSuccess = 'Group updated successfully.';
          this.groupsError = '';
          this.upsertGroup(response.data);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.groupsError = error?.error?.message || 'Failed to update group.';
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
          this.isUpdateGroupOpen = false;
          this.groupPosts = [];
          this.selectedGroupPost = null;
          this.groupsSuccess = 'Group deleted successfully.';
          this.groupsError = '';
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
    if (!this.groupId.trim() || !this.memberUserId.trim()) {
      this.groupsError = 'Group ID and user ID are required.';
      this.groupsSuccess = '';
      return;
    }

    this.groupsLoading = true;
    this.groupsError = '';
    this.groupsSuccess = '';

    this.groupService
      .addUserToGroup(this.groupId.trim(), this.memberUserId.trim())
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
}
