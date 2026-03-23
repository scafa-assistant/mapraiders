import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import Web3Auth from '@web3auth/react-native-sdk';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';

const WEB3AUTH_CLIENT_ID = 'BL1ISQZjJwjmZYdNF9g7SwyTihaKXu28jrnWZRSJt1_jAbC2P9t_KeRFHmJ3V82nQElSYxGy9W3DMve6VZvlIs8';
const redirectUrl = 'mapraiders://auth';

const chainConfig = {
  chainNamespace: 'eip155' as const,
  chainId: '0x1',
  rpcTarget: 'https://rpc.ankr.com/eth',
  displayName: 'Ethereum Mainnet',
  blockExplorerUrl: 'https://etherscan.io',
  ticker: 'ETH',
  tickerName: 'Ethereum',
};

class Web3AuthService {
  private web3auth: Web3Auth | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    try {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: { chainConfig },
      });

      const web3auth = new Web3Auth(WebBrowser, SecureStore, {
        clientId: WEB3AUTH_CLIENT_ID,
        network: 'sapphire_devnet' as any,
        redirectUrl,
        privateKeyProvider,
        whiteLabel: {
          appName: 'MapRaiders',
          defaultLanguage: 'en',
          mode: 'dark',
          theme: {
            primary: '#00D4FF',
          },
        },
      });

      await web3auth.init();
      this.web3auth = web3auth;
      this.initialized = true;
      console.log('[Web3Auth] v8 Initialized successfully');
    } catch (error: any) {
      console.error('[Web3Auth] Init error:', error?.message || error);
      this.initPromise = null;
      throw error;
    }
  }

  async loginWithGoogle(): Promise<{ idToken: string; userInfo: any } | null> {
    return this.login('google');
  }

  async loginWithApple(): Promise<{ idToken: string; userInfo: any } | null> {
    return this.login('apple');
  }

  async loginWithEmail(email: string): Promise<{ idToken: string; userInfo: any } | null> {
    return this.login('email_passwordless', { login_hint: email });
  }

  private async login(
    provider: string,
    extraOptions?: Record<string, string>
  ): Promise<{ idToken: string; userInfo: any } | null> {
    if (!this.initialized) {
      try {
        await this.init();
      } catch (error: any) {
        console.error('[Web3Auth] Cannot login - init failed:', error?.message);
        throw new Error('Web3Auth initialization failed. Please try again.');
      }
    }

    if (!this.web3auth) {
      throw new Error('Web3Auth not available');
    }

    try {
      console.log('[Web3Auth] Starting login with provider:', provider);
      const provider_result = await this.web3auth.login({
        loginProvider: provider,
        ...extraOptions,
      });

      if (provider_result) {
        const userInfo = this.web3auth.userInfo();
        console.log('[Web3Auth] Login successful, user:', userInfo?.email);
        return {
          idToken: userInfo?.idToken || '',
          userInfo: userInfo || {},
        };
      }
      return null;
    } catch (error: any) {
      console.error('[Web3Auth] Login error:', error?.message || error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    if (!this.web3auth) return;
    try {
      await this.web3auth.logout();
    } catch (error) {
      console.error('[Web3Auth] Logout error:', error);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const web3authService = new Web3AuthService();
