// Web3Auth Service — LAZY LOADED
// The Web3Auth SDK crashes on import in Hermes (React Native) because it
// uses Node.js APIs (EventEmitter.bind, etc.) at module level.
// Solution: dynamic import() only when the user actually taps a social login button.

const WEB3AUTH_CLIENT_ID = 'BL1ISQZjJwjmZYdNF9g7SwyTihaKXu28jrnWZRSJt1_jAbC2P9t_KeRFHmJ3V82nQElSYxGy9W3DMve6VZvlIs8';
const redirectUrl = 'mapraiders://auth';

let web3authInstance: any = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

async function doInit(): Promise<void> {
  try {
    console.log('[Web3Auth] Loading SDK...');

    // Dynamic imports — only loaded when needed, not at app startup
    const WebBrowser = await import('expo-web-browser');
    const SecureStore = await import('expo-secure-store');
    const { default: Web3Auth } = await import('@web3auth/react-native-sdk');
    const { CommonPrivateKeyProvider } = await import('@web3auth/base-provider');

    const chainConfig = {
      chainNamespace: 'other' as any,
      chainId: '0x1',
      rpcTarget: 'https://rpc.ankr.com/eth',
    };

    const privateKeyProvider = new CommonPrivateKeyProvider({
      config: { chainConfig },
    });

    const w3a = new Web3Auth(WebBrowser, SecureStore, {
      clientId: WEB3AUTH_CLIENT_ID,
      network: 'sapphire_devnet' as any,
      redirectUrl,
      privateKeyProvider,
      whiteLabel: {
        appName: 'MapRaiders',
        defaultLanguage: 'en',
        mode: 'dark',
        theme: { primary: '#00D4FF' },
      },
    });

    await w3a.init();
    web3authInstance = w3a;
    initialized = true;
    console.log('[Web3Auth] v8 SDK initialized successfully');
  } catch (error: any) {
    console.error('[Web3Auth] Init failed:', error?.message || error);
    initPromise = null;
    throw error;
  }
}

class Web3AuthService {
  async init(): Promise<void> {
    if (initialized) return;
    if (initPromise) return initPromise;
    initPromise = doInit();
    return initPromise;
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
    if (!initialized) {
      await this.init();
    }

    if (!web3authInstance) {
      throw new Error('Web3Auth not available after init');
    }

    console.log('[Web3Auth] Starting login with provider:', provider);
    const result = await web3authInstance.login({
      loginProvider: provider,
      ...extraOptions,
    });

    if (result) {
      const userInfo = web3authInstance.userInfo();
      console.log('[Web3Auth] Login successful:', userInfo?.email);
      return {
        idToken: userInfo?.idToken || '',
        userInfo: userInfo || {},
      };
    }
    return null;
  }

  async logout(): Promise<void> {
    if (!web3authInstance) return;
    try {
      await web3authInstance.logout();
    } catch (error) {
      console.error('[Web3Auth] Logout error:', error);
    }
  }

  isInitialized(): boolean {
    return initialized;
  }
}

export const web3authService = new Web3AuthService();
