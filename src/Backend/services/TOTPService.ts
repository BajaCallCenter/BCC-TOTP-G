
// TOTP service for handling time-based one-time password logic

export interface TOTPAccount {
  id: string;
  name: string;
  email: string;
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
  issuer?: string;
}

export interface TOTPCode {
  code: string;
  timeRemaining: number;
  progress: number;
}

class TOTPService {
  private static instance: TOTPService;
  private accounts: TOTPAccount[] = [];

  static getInstance(): TOTPService {
    if (!TOTPService.instance) {
      TOTPService.instance = new TOTPService();
    }
    return TOTPService.instance;
  }

  // Get all TOTP accounts for the current user
  async getAccounts(): Promise<TOTPAccount[]> {
    // This will fetch from backend/database
    return [...this.accounts];
  }

  // Add a new TOTP account
  async addAccount(account: Omit<TOTPAccount, 'id'>): Promise<TOTPAccount> {
    const newAccount: TOTPAccount = {
      ...account,
      id: Date.now().toString(),
    };
    
    this.accounts.push(newAccount);
    return newAccount;
  }

  // Remove a TOTP account
  async removeAccount(id: string): Promise<void> {
    this.accounts = this.accounts.filter(account => account.id !== id);
  }

  // Generate TOTP code for an account
  generateTOTPCode(account: TOTPAccount): TOTPCode {
    // This is a simplified implementation
    // In production, you would use a proper TOTP library like 'otplib'
    const now = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(now / account.period);
    const timeRemaining = account.period - (now % account.period);
    const progress = Math.round((timeRemaining / account.period) * 100);

    // Mock code generation - replace with real TOTP algorithm
    const mockCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    return {
      code: mockCode,
      timeRemaining,
      progress,
    };
  }

  // Get current codes for all accounts
  async getCurrentCodes(): Promise<{ [accountId: string]: TOTPCode }> {
    const codes: { [accountId: string]: TOTPCode } = {};
    
    for (const account of this.accounts) {
      codes[account.id] = this.generateTOTPCode(account);
    }

    return codes;
  }
}

export default TOTPService;
