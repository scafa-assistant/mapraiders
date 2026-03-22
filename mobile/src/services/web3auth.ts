import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import Web3Auth, { LOGIN_PROVIDER, OPENLOGIN_NETWORK } from '@web3auth/react-native-sdk';

const WEB3AUTH_CLIENT_ID = 'BL1ISQZjJwjmZYdNF9g7SwyTihaKXu28jrnWZRSJt1_jAbC2P9t_KeRFHmJ3V82nQElSYxGy9W3DMve6VZvlIs8';

const redirectUrl = 'mapraiders://auth';

class Web3AuthService {
  private web3auth: Web3Auth | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    // Prevent multiple simultaneous init calls
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    try {
      const web3auth = new Web3Auth(WebBrowser, SecureStore, {
        clientId: WEB3AUTH_CLIENT_ID,
        network: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET,
        redirectUrl,
        whiteLabel: {
          appName: 'MapRaiders',
          defaultLanguage: 'en',
          mode: 'dark',
          theme: {
            primary: '#00D4FF',
          },
        },
      });

      // Web3Auth SDK v7 requires explicit init() call after constructor
      if (typeof web3auth.init === 'function') {
        await web3auth.init();
      }

      this.web3auth = web3auth;
      this.initialized = true;
      console.log('[Web3Auth] Initialized successfully');
    } catch (error: any) {
      console.error('[Web3Auth] Init error:', error?.message || error);
      this.initPromise = null; // Allow retry on next call
      throw error; // Propagate so caller knows init failed
    }
  }

  async loginWithGoogle(): Promise<{ idToken: string; userInfo: any } | null> {
    return this.login(LOGIN_PROVIDER.GOOGLE);
  }

  async loginWithApple(): Promise<{ idToken: string; userInfo: any } | null> {
    return this.login(LOGIN_PROVIDER.APPLE);
  }

  async loginWithEmail(email: string): Promise<{ idToken: string; userInfo: any } | null> {
    return this.login(LOGIN_PROVIDER.EMAIL_PASSWORDLESS, { login_hint: email });
  }

  private async login(
    provider: string,
    extraOptions?: Record<string, string>
  ): Promise<{ idToken: string; userInfo: any } | null> {
    // Ensure SDK is initialized
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
      const response = await this.web3auth.login({
        loginProvider: provider,
        ...extraOptions,
      });

      if (response) {
        console.log('[Web3Auth] Login successful');
        return {
          idToken: response.privKey || '',
          userInfo: response.userInfo || {},
        };
      }
      return null;
    } catch (error: any) {
      console.error('[Web3Auth] Login error:', error?.message || error);
      throw error; // Let the UI handle the error
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
