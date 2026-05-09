import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { appConfig } from '../config/app-config';
import { Article } from '../models/article.model';
import { Group } from '../models/group.model';
import { ToastService } from './toast';

interface GroupResponse {
  data: Group;
}

interface GroupPostsResponse {
  results: number;
  data: Article[];
}

interface GroupPostResponse {
  data: Article;
}

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private readonly apiUrl = `${appConfig.apiBaseUrl}/groups`;
  private readonly myGroupsUrl = `${appConfig.apiBaseUrl}/groups/my`;

  constructor(
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  createGroup(payload: { title: string; description: string; groupImg?: File | null }): Observable<GroupResponse> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    if (payload.groupImg) {
      formData.append('groupImg', payload.groupImg);
    }

    return this.http.post<GroupResponse>(this.apiUrl, formData).pipe(
      tap(() => {
        this.toast.success('Group created successfully.', 'Groups');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to create group.';
        this.toast.error(message, 'Groups');
        return throwError(() => error);
      }),
    );
  }

  getGroupById(groupId: string): Observable<GroupResponse> {
    return this.http.get<GroupResponse>(`${this.apiUrl}/${groupId}`).pipe(
      catchError((error) => {
        const message = error?.error?.message || 'Failed to load group.';
        this.toast.error(message, 'Groups');
        return throwError(() => error);
      }),
    );
  }

  updateGroup(
    groupId: string,
    payload: { title?: string; description?: string; groupImg?: File | null },
  ): Observable<GroupResponse> {
    const formData = new FormData();
    if (payload.title) {
      formData.append('title', payload.title);
    }
    if (payload.description) {
      formData.append('description', payload.description);
    }
    if (payload.groupImg) {
      formData.append('groupImg', payload.groupImg);
    }

    return this.http.put<GroupResponse>(`${this.apiUrl}/${groupId}`, formData).pipe(
      tap(() => {
        this.toast.success('Group updated successfully.', 'Groups');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to update group.';
        this.toast.error(message, 'Groups');
        return throwError(() => error);
      }),
    );
  }

  deleteGroup(groupId: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/${groupId}`).pipe(
      tap(() => {
        this.toast.success('Group deleted successfully.', 'Groups');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to delete group.';
        this.toast.error(message, 'Groups');
        return throwError(() => error);
      }),
    );
  }

  addUserToGroup(groupId: string, userId: string): Observable<GroupResponse> {
    return this.http.post<GroupResponse>(`${this.apiUrl}/${groupId}/users`, { userId }).pipe(
      tap(() => {
        this.toast.success('User added to group.', 'Groups');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to add user to group.';
        this.toast.error(message, 'Groups');
        return throwError(() => error);
      }),
    );
  }

  removeUserFromGroup(groupId: string, userId: string): Observable<GroupResponse> {
    return this.http.delete<GroupResponse>(`${this.apiUrl}/${groupId}/users/${userId}`).pipe(
      tap(() => {
        this.toast.success('User removed from group.', 'Groups');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to remove user from group.';
        this.toast.error(message, 'Groups');
        return throwError(() => error);
      }),
    );
  }

  getGroupPosts(groupId: string): Observable<GroupPostsResponse> {
    return this.http.get<GroupPostsResponse>(`${this.apiUrl}/${groupId}/posts`).pipe(
      catchError((error) => {
        const message = error?.error?.message || 'Failed to load group posts.';
        this.toast.error(message, 'Groups');
        return throwError(() => error);
      }),
    );
  }

  getGroupPostById(groupId: string, postId: string): Observable<GroupPostResponse> {
    return this.http.get<GroupPostResponse>(`${this.apiUrl}/${groupId}/posts/${postId}`).pipe(
      catchError((error) => {
        const message = error?.error?.message || 'Failed to load group post.';
        this.toast.error(message, 'Groups');
        return throwError(() => error);
      }),
    );
  }

  updateMemberPermissions(groupId: string, payload: { userId: string; permissions: string[] }): Observable<GroupResponse> {
    return this.http.put<GroupResponse>(`${this.apiUrl}/${groupId}/permissions`, payload).pipe(
      tap(() => {
        this.toast.success('Member permissions updated.', 'Groups');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to update permissions.';
        this.toast.error(message, 'Groups');
        return throwError(() => error);
      }),
    );
  }

  getAll(): Observable<Group[]> {
    return this.http.get<{ data: Group[] }>(this.myGroupsUrl).pipe(
      map((response) => (Array.isArray(response?.data) ? response.data : [])),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to load groups.';
        this.toast.error(message, 'Groups');
        return throwError(() => error);
      }),
    );
  }

  getMyGroups(): Observable<Group[]> {
    return this.http.get<{ data: Group[] }>(this.myGroupsUrl).pipe(
      map((response) => (Array.isArray(response?.data) ? response.data : [])),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to load your groups.';
        this.toast.error(message, 'Groups');
        return throwError(() => error);
      }),
    );
  }
}
