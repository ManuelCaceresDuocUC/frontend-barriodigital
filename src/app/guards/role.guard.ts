import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService, Role } from '../services/auth.service';

export const roleGuard = (allowedRoles: Role[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
};