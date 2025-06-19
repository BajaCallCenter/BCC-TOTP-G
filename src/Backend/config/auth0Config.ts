
// Auth0 configuration - to be updated with actual credentials
export const auth0Config = {
  domain: process.env.VITE_AUTH0_DOMAIN || 'your-domain.auth0.com',
  clientId: process.env.VITE_AUTH0_CLIENT_ID || 'your-client-id',
  redirectUri: window.location.origin,
  audience: process.env.VITE_AUTH0_AUDIENCE,
  scope: 'openid profile email',
};

// Auth0 provider configuration
export const auth0ProviderConfig = {
  ...auth0Config,
  cacheLocation: 'localstorage' as const,
  useRefreshTokens: true,
};
