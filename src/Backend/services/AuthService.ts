
// Auth service for handling authentication logic
// This will be integrated with Auth0 later

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
  };

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Placeholder for Auth0 integration
  async loginWithGoogle(): Promise<User> {
    // This will be replaced with Auth0 Google authentication
    const mockUser: User = {
      id: '1',
      email: 'user@example.com',
      name: 'John Doe',
      picture: 'https://via.placeholder.com/64',
    };

    this.authState = {
      isAuthenticated: true,
      user: mockUser,
      token: 'mock-jwt-token',
    };

    return mockUser;
  }

  async logout(): Promise<void> {
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null,
    };
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getUser(): User | null {
    return this.authState.user;
  }

  getToken(): string | null {
    return this.authState.token;
  }
}

export default AuthService;
