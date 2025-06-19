
// API layer for TOTP operations
import TOTPService, { TOTPAccount } from '../services/TOTPService';

export const totpAPI = {
  async getAccounts(): Promise<TOTPAccount[]> {
    const totpService = TOTPService.getInstance();
    return await totpService.getAccounts();
  },

  async addAccount(account: Omit<TOTPAccount, 'id'>): Promise<TOTPAccount> {
    const totpService = TOTPService.getInstance();
    return await totpService.addAccount(account);
  },

  async removeAccount(id: string): Promise<void> {
    const totpService = TOTPService.getInstance();
    await totpService.removeAccount(id);
  },

  async getCurrentCodes(): Promise<{ [accountId: string]: any }> {
    const totpService = TOTPService.getInstance();
    return await totpService.getCurrentCodes();
  },
};
