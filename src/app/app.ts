import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend-barriodigital';

  constructor(
    private msalService: MsalService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // MSAL ya fue inicializado por APP_INITIALIZER en app.config.ts
    this.msalService.handleRedirectObservable().subscribe({
      next: (result) => {
        if (result && result.account) {
          this.msalService.instance.setActiveAccount(result.account);
        } else {
          const accounts = this.msalService.instance.getAllAccounts();
          if (accounts.length > 0) {
            this.msalService.instance.setActiveAccount(accounts[0]);
          }
        }
      },
      error: (err) => console.error('Error MSAL redirect:', err)
    });
  }

  logout(): void {
    this.authService.logout();
  }
}