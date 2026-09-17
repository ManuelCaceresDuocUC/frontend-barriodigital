import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';
import { PublicClientApplication } from '@azure/msal-browser';
import { 
  MSAL_INSTANCE, 
  MSAL_GUARD_CONFIG, 
  MSAL_INTERCEPTOR_CONFIG, // Importar
  MsalService, 
  MsalGuard, 
  MsalBroadcastService, 
  MsalInterceptor // Importar
} from '@azure/msal-angular';
import { msalConfig, msalGuardConfig, msalInterceptorConfig } from './auth-config';

export function MSALInstanceFactory() {
  return new PublicClientApplication(msalConfig);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // withInterceptorsFromDi() es crucial para que funcione el interceptor clásico en modo Standalone
    provideHttpClient(withInterceptorsFromDi()), 
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useValue: msalGuardConfig
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useValue: msalInterceptorConfig // Proveer la configuración
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor, // Registrar el interceptor
      multi: true
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};