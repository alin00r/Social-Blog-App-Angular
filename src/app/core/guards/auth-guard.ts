import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Check if the current user's account is still active
  const currentUser = authService.getCurrentUser();
  if (currentUser && currentUser.active === false) {
    authService.logout().subscribe({
      next: () => router.createUrlTree(['/login']),
      error: () => router.createUrlTree(['/login']),
    });
    return router.createUrlTree(['/login']);
  }

  return true;
};
