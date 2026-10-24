export const environment = {
  production: false,
  azureAd: {
    clientId: '2fc5d9c1-8b42-4674-b0dc-23990c22f370',
    tenantId: 'ffcb40ec-aa43-4c4e-acd8-4d27467872c5',
    redirectUri: window.location.origin,
    authority: 'https://login.microsoftonline.com/ffcb40ec-aa43-4c4e-acd8-4d27467872c5/v2.0',
    scopeApi: 'api://2fc5d9c1-8b42-4674-b0dc-23990c22f370/access_as_user'
  },
  // URL confirmada y operativa de tu AWS API Gateway
  apiBffUrl: 'https://lkbz5es695.execute-api.us-east-1.amazonaws.com'
};