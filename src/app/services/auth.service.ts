import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

export type Role = 'Cliente' | 'Operador' | 'Admin' | 'Auditor';

/** Roles que la aplicación reconoce. */
const KNOWN_ROLES: Role[] = ['Cliente', 'Operador', 'Admin', 'Auditor'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private msalService: MsalService) {}

  getActiveAccount() {
    return this.msalService.instance.getActiveAccount();
  }

  /**
   * Roles del usuario. Quien está autenticado pero no trae ningún rol conocido (por ejemplo, un vecino
   * que se registró solo) se trata como Cliente. Los roles del personal solo existen si se asignan en
   * Azure: nunca se otorgan por defecto. Debe coincidir con la regla de los microservicios.
   */
  getUserRoles(): string[] {
    const account = this.getActiveAccount();
    const claims = account?.idTokenClaims as { roles?: string[] };
    const roles = claims?.roles || [];
    const hasKnownRole = roles.some(r => KNOWN_ROLES.includes(r as Role));
    return hasKnownRole ? roles : [...roles, 'Cliente'];
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
    const claims = account?.idTokenClaims as { email?: string };
    return claims?.email || account?.username || 'sin-correo@barriodigital.cl';
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
      postLogoutRedirectUri: `${window.location.origin}/login`
    });
  }
}
