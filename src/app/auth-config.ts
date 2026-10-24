import { LogLevel, PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';

export const msalConfig = {
  auth: {
    clientId: '2fc5d9c1-8b42-4674-b0dc-23990c22f370',
    // 1. Agregamos /v2.0 para forzar el emisor v2 que exige AWS API Gateway
    authority: 'https://login.microsoftonline.com/ffcb40ec-aa43-4c4e-acd8-4d27467872c5/v2.0',
    redirectUri: `${window.location.origin}/dashboard`,
    postLogoutRedirectUri: `${window.location.origin}/login`
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  }
};

export const msalGuardConfig: MsalGuardConfiguration = {
  interactionType: InteractionType.Redirect,
  authRequest: {
    // Scopes iniciales para autenticar la identidad del usuario
    scopes: ['openid', 'profile', 'email', 'user.read']
  }
};

export const msalInterceptorConfig: MsalInterceptorConfiguration = {
  interactionType: InteractionType.Redirect,
  protectedResourceMap: new Map([
    [
      'https://lkbz5es695.execute-api.us-east-1.amazonaws.com/*', 
      ['api://2fc5d9c1-8b42-4674-b0dc-23990c22f370/access_as_user']
    ]
  ])
};