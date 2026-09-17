import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <header>
        <h2>Bienvenido, {{ userName }}</h2>
        <p>Tu rol en el sistema: <strong>{{ userRoles.join(', ') }}</strong></p>
        <button (click)="logout()">Cerrar Sesión</button>
      </header>
      
      <nav class="dashboard-menu">
        <a routerLink="/requests" class="card">Gestión de Trámites</a>
        <a routerLink="/catalog" class="card" *ngIf="hasRole('Admin') || hasRole('Operador') || hasRole('Cliente')">Catálogo y Cupos</a>
      </nav>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  userName: string = '';
  userRoles: string[] = [];

  constructor(private authService: MsalService) {}

  ngOnInit(): void {
    const activeAccount = this.authService.instance.getAllAccounts()[0];
    if (activeAccount) {
      this.userName = activeAccount.name || 'Usuario';
      this.userRoles = (activeAccount.idTokenClaims as any)?.roles || ['Cliente'];
    }
  }

  hasRole(role: string): boolean {
    return this.userRoles.includes(role);
  }

  logout() {
    this.authService.logoutRedirect();
  }
}