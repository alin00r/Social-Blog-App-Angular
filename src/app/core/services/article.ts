import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { appConfig } from '../config/app-config';
import { Article as ArticleModel } from '../models/article.model';
import { ToastService } from './toast';

interface ArticlesResponse {
  status: string;
  results: number;
  data: ArticleModel[];
}

interface FeedResponse {
  data: ArticleModel[];
}

interface ArticleResponse {
  status: string;
  data: ArticleModel;
}

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private readonly apiUrl = `${appConfig.apiBaseUrl}/posts`;

  constructor(
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  getArticles(): Observable<ArticlesResponse> {
    return this.http.get<ArticlesResponse>(this.apiUrl).pipe(
      catchError((error) => {
        const message = error?.error?.message || 'Failed to load articles. Please try again.';
        this.toast.error(message, 'Loading Error');
        return throwError(() => error);
      }),
    );
  }

  getArticleById(id: string): Observable<ArticleResponse> {
    return this.http.get<ArticleResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        const message = error?.error?.message || 'Failed to load article. Please try again.';
        this.toast.error(message, 'Loading Error');
        return throwError(() => error);
      }),
    );
  }

  getFeed(): Observable<FeedResponse> {
    return this.http.get<FeedResponse>(`${this.apiUrl}/feed`).pipe(
      catchError((error) => {
        const message = error?.error?.message || 'Failed to load public feed. Please try again.';
        this.toast.error(message, 'Feed Error');
        return throwError(() => error);
      }),
    );
  }

  createArticle(payload: { title: string; content: string; images: File[]; group?: string }): Observable<ArticleResponse> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('content', payload.content);
    if (payload.group) {
      formData.append('group', payload.group);
    }
    payload.images.forEach((image) => formData.append('images', image));

    return this.http.post<ArticleResponse>(this.apiUrl, formData).pipe(
      tap(() => {
        this.toast.success('Article created successfully!', 'Success');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to create article. Please try again.';
        this.toast.error(message, 'Creation Error');
        return throwError(() => error);
      }),
    );
  }

  updateArticle(
    id: string,
    payload: { title: string; content: string; group?: string; images?: File[] },
  ): Observable<ArticleResponse> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('content', payload.content);
    if (payload.group) {
      formData.append('group', payload.group);
    }
    // Only append new images if they exist (backend keeps existing images)
    if (payload.images && payload.images.length > 0) {
      payload.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    return this.http.patch<ArticleResponse>(`${this.apiUrl}/${id}`, formData).pipe(
      tap((response) => {
        this.toast.success('Article updated successfully!', 'Success');
      }),
      catchError((error) => {
        let message = 'Failed to update article. Please try again.';
        if (error?.error?.message) {
          message = error.error.message;
        } else if (error?.error?.data?.message) {
          message = error.error.data.message;
        }
        this.toast.error(message, 'Update Error');
        return throwError(() => ({ ...error, displayMessage: message }));
      }),
    );
  }

  deleteArticle(id: string): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.toast.success('Article deleted successfully!', 'Success');
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to delete article. Please try again.';
        this.toast.error(message, 'Deletion Error');
        return throwError(() => error);
      }),
    );
  }
}
