import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

export type Role = 'Cliente' | 'Operador' | 'Admin' | 'Auditor';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private msalService: MsalService) {}

  getUserRoles(): string[] {
    const account = this.msalService.instance.getActiveAccount();
    const claims = account?.idTokenClaims as { roles?: string[] };
    return claims?.roles || [];
  }

  hasRole(role: Role): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: Role[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.some(r => userRoles.includes(r as string));
  }
}