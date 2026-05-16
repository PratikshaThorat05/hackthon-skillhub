import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  inject(Router).navigate(['/login']);
  return false;
};

export const hrGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn() && auth.isHR()) return true;
  inject(Router).navigate(['/login']);
  return false;
};

// Redirects already-logged-in users away from public pages (login/register)
export const publicGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) return true;
  const router = inject(Router);
  router.navigate([auth.isHR() ? '/hr/search' : '/employee/upload']);
  return false;
};
