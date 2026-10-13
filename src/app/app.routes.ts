import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { roleGuard } from './guards/role.guard';

import { LoginComponent } from './pages/login/login'; 
import { Dashboard } from './pages/dashboard/dashboard';
import { Requests } from './pages/requests/requests';
import { Catalog } from './pages/catalog/catalog';
import { Audit } from './pages/audit/audit';
import { Reports } from './pages/reports/reports';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  // Dashboard: Accesible para cualquier usuario autenticado
  { 
    path: 'dashboard', 
    component: Dashboard, 
    canActivate: [MsalGuard] 
  },
  
  // Gestión de Solicitudes: Cliente (crea), Operador (gestiona) y Admin
  { 
    path: 'requests', 
    component: Requests, 
    canActivate: [MsalGuard, roleGuard(['Cliente', 'Operador', 'Admin'])] 
  },
  
  // Catálogo: Exclusivo Admin
  { 
    path: 'catalog', 
    component: Catalog, 
    canActivate: [MsalGuard, roleGuard(['Admin'])] 
  },
  
  // Reportería (KPIs): Exclusivo Admin
  { 
    path: 'reports', 
    component: Reports, 
    canActivate: [MsalGuard, roleGuard(['Admin'])] 
  },
  
  // Auditoría (Timeline): Exclusivo Auditor
  { 
    path: 'audit', 
    component: Audit, 
    canActivate: [MsalGuard, roleGuard(['Auditor'])] 
  },
  
  { path: '**', redirectTo: 'login' }
];