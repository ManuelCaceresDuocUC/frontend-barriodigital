import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-dashboard',
  template: `
    <div style="padding: 20px;">
      <h2>Bienvenido al Dashboard de BarrioDigital</h2>
      <p>Usuario autenticado: <strong>{{ userEmail }}</strong></p>
      <button (click)="logout()" style="padding: 8px 16px; cursor: pointer;">Cerrar sesión</button>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  userEmail: string = '';

  constructor(private authService: MsalService) {}

  ngOnInit(): void {
    const accounts = this.authService.instance.getAllAccounts();
    if (accounts.length > 0) {
      this.userEmail = accounts[0].username;
    }
  }

  logout(): void {
    this.authService.logoutRedirect();
  }
}