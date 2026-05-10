import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { appConfig } from '../config/app-config';
import { User } from '../models/user.model';
import { ToastService } from './toast';

interface AuthResponse {
  status: string;
  token: string;
  data?: {
    user: User;
  };
}

interface MessageResponse {
  status: string;
  message: string;
}

interface MeResponse {
  data: {
    _id: string;
    name: string;
    email: string;
    profileImg?: string;
    role?: string;
    active?: boolean;
    profileImgId?: string;
  };
}

interface UpdateMeResponse {
  status: string;
  data: {
    _id: string;
    name: string;
    email: string;
    profileImg?: string;
    role?: string;
  };
}

interface ChangePasswordResponse {
  status: string;
  token: string;
}

interface JwtPayload {
  id?: string;
  _id?: string;
  sub?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly apiUrl = `${appConfig.apiBaseUrl}/auth`;
  private readonly userStorageKey = 'blog_user';
  private readonly tokenStorageKey = 'blog_token';

  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private toast: ToastService,
  ) {
    if (this.getToken()) {
      this.refreshCurrentUser();
    }
  }

  register(payload: { name: string; email: string; password: string; passwordConfirm: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap((res) => {
        this.saveSession(res, {
          name: payload.name,
          username: payload.name,
          email: payload.email,
          role: 'user',
          profileImg: undefined,
        });
        // Fetch the full user profile with image after successful registration
        this.refreshCurrentUser();
        this.toast.success('Registration successful!', 'Welcome');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Registration failed. Please try again.';
        this.toast.error(message, 'Registration Error');
        return throwError(() => error);
      }),
    );
  }

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap((res) => {
        // Check if account is still active
        if (res.data?.user && res.data.user.active === false) {
          this.clearSession();
          this.toast.error('Your account has been deactivated. Please contact support to reactivate.', 'Account Deactivated');
          throw new Error('Account deactivated');
        }

        const storedUser = this.getStoredUser();
        this.saveSession(res, {
          email: payload.email,
          name: storedUser?.name || this.deriveNameFromEmail(payload.email),
          username: storedUser?.username || storedUser?.name || this.deriveNameFromEmail(payload.email),
          role: storedUser?.role || 'user',
          profileImg: storedUser?.profileImg,
        });

        // Fetch the full user profile with image after successful login
        this.refreshCurrentUser();
        this.toast.success('Login successful!', 'Welcome Back');
      }),
      catchError((error) => {
        if (error.message === 'Account deactivated') {
          return throwError(() => error);
        }
        const message = error?.error?.message || 'Login failed. Please try again.';
        this.toast.error(message, 'Login Error');
        return throwError(() => error);
      }),
    );
  }

  logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearSession();
        this.toast.info('You have been logged out', 'Logout');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Logout failed.';
        this.toast.error(message, 'Logout Error');
        return throwError(() => error);
      }),
    );
  }

  logoutDueToTokenExpiration(): void {
    this.clearSession();
    this.toast.info('Your session has expired. Please log in again.', 'Session Expired');
  }

  private clearSession(): void {
    localStorage.removeItem(this.userStorageKey);
    localStorage.removeItem(this.tokenStorageKey);
    this.currentUserSubject.next(null);
  }

  forgotPassword(payload: { email: string }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/forgotPassword`, payload).pipe(
      tap((res) => {
        this.toast.success(res.message || 'Reset code sent to your email', 'Check Email');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to send reset code. Please try again.';
        this.toast.error(message, 'Error');
        return throwError(() => error);
      }),
    );
  }

  verifyCode(payload: { resetCode: string }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/verifyCode`, payload).pipe(
      tap((res) => {
        this.toast.success(res.message || 'Code verified successfully', 'Success');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Invalid or expired code. Please try again.';
        this.toast.error(message, 'Verification Failed');
        return throwError(() => error);
      }),
    );
  }

  resetPassword(payload: { email: string; newPassword: string }): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>(`${this.apiUrl}/resetPassword`, payload).pipe(
      tap((res) => {
        const storedUser = this.getStoredUser();
        this.saveSession(res, {
          email: payload.email,
          name: storedUser?.name || this.deriveNameFromEmail(payload.email),
          username: storedUser?.username || storedUser?.name || this.deriveNameFromEmail(payload.email),
          role: storedUser?.role || 'user',
          profileImg: storedUser?.profileImg,
        });
        // Fetch the full user profile with image after successful password reset
        this.refreshCurrentUser();
        this.toast.success('Password reset successfully!', 'Success');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to reset password. Please try again.';
        this.toast.error(message, 'Reset Error');
        return throwError(() => error);
      }),
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  refreshCurrentUser(): void {
    if (!this.getToken()) {
      return;
    }

    this.getCurrentUserProfile(true).subscribe({
      next: (user) => {
        const normalizedUser: User = {
          ...user,
          id: user.id || user._id || this.getUserIdFromToken(),
        };

        localStorage.setItem(this.userStorageKey, JSON.stringify(normalizedUser));
        this.currentUserSubject.next(normalizedUser);
      },
      error: () => {
        // Keep the existing token/session if the profile request fails.
      },
    });
  }

  getCurrentUserProfile(silent = false): Observable<User> {
    return this.http.get<MeResponse>(`${appConfig.apiBaseUrl}/users/getMe`).pipe(
      map((response) => {
        // Check if account is deactivated
        if (response.data.active === false) {
          throw new Error('Account deactivated');
        }
        return {
          _id: response.data._id,
          id: response.data._id || this.getUserIdFromToken(),
          name: response.data.name,
          username: response.data.name,
          email: response.data.email,
          profileImg: response.data.profileImg,
          profileImgId: response.data.profileImgId,
          role: response.data.role || 'user',
          active: response.data.active,
        };
      }),
      tap((normalizedUser) => {
        localStorage.setItem(this.userStorageKey, JSON.stringify(normalizedUser));
        this.currentUserSubject.next(normalizedUser);
      }),
      catchError((error) => {
        if (error.message === 'Account deactivated') {
          this.clearSession();
          if (!silent) {
            this.toast.error('Your account has been deactivated. Please contact support.', 'Account Deactivated');
          }
        } else if (!silent) {
          const message = error?.error?.message || 'Failed to load user profile.';
          this.toast.error(message, 'Profile Error');
        }
        return throwError(() => error);
      }),
    );
  }

  updateMe(payload: { name: string; email: string; profileImg?: File | null }): Observable<User> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('email', payload.email);

    if (payload.profileImg) {
      formData.append('profileImg', payload.profileImg);
    }

    return this.http.patch<UpdateMeResponse>(`${appConfig.apiBaseUrl}/users/updateMe`, formData).pipe(
      map((response) => ({
        _id: response.data._id,
        id: response.data._id || this.getUserIdFromToken(),
        name: response.data.name,
        username: response.data.name,
        email: response.data.email,
        profileImg: response.data.profileImg,
        role: response.data.role || 'user',
      })),
      tap((normalizedUser) => {
        localStorage.setItem(this.userStorageKey, JSON.stringify(normalizedUser));
        this.currentUserSubject.next(normalizedUser);
        this.toast.success('Profile updated successfully!', 'Success');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to update profile.';
        this.toast.error(message, 'Update Error');
        return throwError(() => error);
      }),
    );
  }

  changeMyPassword(payload: { newPassword: string }): Observable<ChangePasswordResponse> {
    return this.http.patch<ChangePasswordResponse>(`${appConfig.apiBaseUrl}/users/changeMyPassword`, payload).pipe(
      tap(() => {
        // Force re-authentication after password change.
        this.clearSession();
        this.toast.success('Password changed successfully. Please log in again.', 'Success');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to change password.';
        this.toast.error(message, 'Password Error');
        return throwError(() => error);
      }),
    );
  }

  deleteMe(): Observable<void> {
    return this.http.delete<void>(`${appConfig.apiBaseUrl}/users/deleteMe`).pipe(
      tap(() => {
        this.clearSession();
        this.toast.info('Your account has been deactivated.', 'Account Removed');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to deactivate account.';
        this.toast.error(message, 'Delete Error');
        return throwError(() => error);
      }),
    );
  }

  private saveSession(response: AuthResponse, fallbackUser?: Partial<User>): void {
    localStorage.setItem(this.tokenStorageKey, response.token);

    const sessionUser = response.data?.user ?? this.buildFallbackUser(fallbackUser);

    if (sessionUser) {
      localStorage.setItem(this.userStorageKey, JSON.stringify(sessionUser));
      this.currentUserSubject.next(sessionUser);
      return;
    }

    this.refreshCurrentUser();
  }

  private buildFallbackUser(fallbackUser?: Partial<User>): User | null {
    if (!fallbackUser?.email && !fallbackUser?.name) {
      return null;
    }

    const name = fallbackUser.name || this.deriveNameFromEmail(fallbackUser.email || '');
    const tokenUserId = this.getUserIdFromToken();

    return {
      _id: fallbackUser._id,
      id: fallbackUser.id || tokenUserId,
      name,
      username: fallbackUser.username || name,
      email: fallbackUser.email || '',
      role: fallbackUser.role || 'user',
    };
  }

  private getUserIdFromToken(): string | undefined {
    const token = this.getToken();

    if (!token) {
      return undefined;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      return undefined;
    }

    try {
      const payloadJson = this.decodeBase64Url(parts[1]);
      const payload = JSON.parse(payloadJson) as JwtPayload;
      return payload.id || payload._id || payload.sub;
    } catch {
      return undefined;
    }
  }

  private decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    return atob(normalized + padding);
  }

  private deriveNameFromEmail(email: string): string {
    const localPart = email.split('@')[0] || 'Account';
    return localPart
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  }

  private getStoredUser(): User | null {
    const savedUser = localStorage.getItem(this.userStorageKey);
    if (!savedUser) {
      return null;
    }

    const parsedUser = JSON.parse(savedUser) as User;
    const tokenUserId = this.getUserIdFromToken();

    if (!parsedUser.id && tokenUserId) {
      return {
        ...parsedUser,
        id: tokenUserId,
      };
    }

    return parsedUser;
  }
}
