const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

const KEYCLOAK_BASE = (hostname === 'localhost' || hostname === '127.0.0.1')
  ? 'http://localhost:8080'
  : `${protocol}//${hostname}:8080`;

export const authConfig = {
  clientId: 'oauth2-pkce-client',
  authorizationEndpoint: `${KEYCLOAK_BASE}/realms/fitness-app/protocol/openid-connect/auth`,
  tokenEndpoint: `${KEYCLOAK_BASE}/realms/fitness-app/protocol/openid-connect/token`,
  redirectUri: origin,
  scope: 'openid profile email',
  onRefreshTokenExpire: (event) => event.logIn(),
}