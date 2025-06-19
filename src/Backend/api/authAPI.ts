
// API layer for authentication
import AuthService from '../services/AuthService';

export const authAPI = {
  async login(provider: 'google'): Promise<any> {
    const authService = AuthService.getInstance();
    
    switch (provider) {
      case 'google':
        return await authService.loginWithGoogle();
      default:
        throw new Error(`Unsupported auth provider: ${provider}`);
    }
  },

  async logout(): Promise<void> {
    const authService = AuthService.getInstance();
    await authService.logout();
  },

  async getCurrentUser(): Promise<any> {
    const authService = AuthService.getInstance();
    return authService.getUser();
  },

  async isAuthenticated(): Promise<boolean> {
    const authService = AuthService.getInstance();
    return authService.isAuthenticated();
  },
};
