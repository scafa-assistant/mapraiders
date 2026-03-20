import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import Web3Auth, { LOGIN_PROVIDER, OPENLOGIN_NETWORK } from '@web3auth/react-native-sdk';

const WEB3AUTH_CLIENT_ID = 'BL1ISQZjJwjmZYdNF9g7SwyTihaKXu28jrnWZRSJt1_jAbC2P9t_KeRFHmJ3V82nQElSYxGy9W3DMve6VZvlIs8';

const redirectUrl = 'mapraiders://auth';

class Web3AuthService {
  private web3auth: Web3Auth | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.web3auth = new Web3Auth(WebBrowser, SecureStore, {
        clientId: WEB3AUTH_CLIENT_ID,
        network: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET,
        redirectUrl,
        loginConfig: {},
        whiteLabel: {
          appName: 'MapRaiders',
          logoLight: '',
          logoDark: '',
          defaultLanguage: 'en',
          mode: 'dark',
          theme: {
            primary: '#00D4FF',
          },
        },
      });

      this.initialized = true;
      console.log('[Web3Auth] Initialized');
    } catch (error) {
      console.error('[Web3Auth] Init error:', error);
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
    if (!this.web3auth) {
      await this.init();
    }

    try {
      const response = await this.web3auth!.login({
        loginProvider: provider,
        ...extraOptions,
      });

      if (response) {
        return {
          idToken: response.privKey || '',
          userInfo: response.userInfo || {},
        };
      }
      return null;
    } catch (error) {
      console.error('[Web3Auth] Login error:', error);
      return null;
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
