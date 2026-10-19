import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

export type Role = 'Cliente' | 'Operador' | 'Admin' | 'Auditor';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private msalService: MsalService) {}

  getActiveAccount() {
    return this.msalService.instance.getActiveAccount();
  }

  getUserRoles(): string[] {
    const account = this.getActiveAccount();
    const claims = account?.idTokenClaims as { roles?: string[] };
    return claims?.roles || [];
  }

  hasRole(role: Role): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: Role[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.some(r => userRoles.includes(r));
  }

  getUserName(): string {
    const account = this.getActiveAccount();
    return account?.name || account?.username?.split('@')[0] || 'Usuario Municipal';
  }

  getUserEmail(): string {
    const account = this.getActiveAccount();
    return account?.username || 'sin-correo@barriodigital.cl';
  }

  getUserOid(): string {
    const account = this.getActiveAccount();
    const claims = account?.idTokenClaims as { oid?: string; sub?: string };
    return claims?.oid || claims?.sub || account?.homeAccountId || '';
  }

  getPrimaryRole(): string {
    const roles = this.getUserRoles();
    if (roles.includes('Admin')) return 'Administrador';
    if (roles.includes('Operador')) return 'Operador Municipal';
    if (roles.includes('Auditor')) return 'Auditor General';
    if (roles.includes('Cliente')) return 'Vecino / Cliente';
    return 'Usuario Regular';
  }

  getUserInitials(): string {
    const name = this.getUserName().trim();
    if (!name) return 'BD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // MÉTODO PARA CERRAR SESIÓN CON MSAL
  logout(): void {
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: 'http://localhost:4200/login'
    });
  }
}