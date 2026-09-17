import { LogLevel, PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';
export const msalConfig = {
  auth: {
    clientId: '2fc5d9c1-8b42-4674-b0dc-23990c22f370',
    authority: 'https://login.microsoftonline.com/ffcb40ec-aa43-4c4e-acd8-4d27467872c5',
    redirectUri: 'http://localhost:4200/dashboard', // Cambiado de https a http
    postLogoutRedirectUri: 'http://localhost:4200/login' // Cambiado de https a http
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  }
};

export const msalGuardConfig: MsalGuardConfiguration = {
  interactionType: InteractionType.Redirect,
  authRequest: {
    scopes: ['openid', 'profile', 'email', 'user.read']
  }
};

export const msalInterceptorConfig: MsalInterceptorConfiguration = {
  interactionType: InteractionType.Redirect,
  protectedResourceMap: new Map([
    // Asumiendo que tu BFF correrá en localhost:8080.
    // MSAL adjuntará el token a cualquier petición HTTP que comience con esta URL.
    ['http://localhost:8080/*', ['openid', 'profile', 'user.read']]
  ])
};