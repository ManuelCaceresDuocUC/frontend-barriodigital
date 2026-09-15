import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

// Revisa el nombre exacto de tus archivos dentro de /login y /dashboard
import { LoginComponent } from './pages/login/login'; 
import { DashboardComponent } from './pages/dashboard/dashboard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [MsalGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];