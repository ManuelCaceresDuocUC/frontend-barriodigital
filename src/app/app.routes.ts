import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

// Revisa el nombre exacto de tus archivos dentro de /login y /dashboard
import { LoginComponent } from './pages/login/login'; 
import { DashboardComponent } from './pages/dashboard/dashboard';
import { Requests } from './pages/requests/requests';
import { Catalog } from './pages/catalog/catalog';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [MsalGuard] },
  { path: 'requests', component: Requests, canActivate: [MsalGuard] },
  { path: 'catalog', component: Catalog, canActivate: [MsalGuard] },
  { path: '**', redirectTo: 'login' }
];