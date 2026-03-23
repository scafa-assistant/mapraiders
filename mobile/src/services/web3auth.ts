// Social Login Service
// Uses native Google Sign-In instead of Web3Auth (which is incompatible with Hermes)
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '988585973091-pe5oe30v67n25jodvcj83ottbvvi3tg2.apps.googleusercontent.com',
  offlineAccess: true,
});

class SocialAuthService {
  async loginWithGoogle(): Promise<{ idToken: string; userInfo: any } | null> {
    try {
      console.log('[SocialAuth] Starting Google Sign-In...');
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (response.data) {
        const { idToken } = response.data;
        const user = response.data.user;
        console.log('[SocialAuth] Google login successful:', user.email);

        return {
          idToken: idToken || '',
          userInfo: {
            email: user.email,
            name: user.name,
            profileImage: user.photo,
          },
        };
      }
      return null;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[SocialAuth] User cancelled Google sign-in');
        return null;
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        console.log('[SocialAuth] Sign-in already in progress');
        return null;
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error('[SocialAuth] Google Play Services not available');
        throw new Error('Google Play Services not available on this device');
      }
      console.error('[SocialAuth] Google login error:', error?.message || error);
      throw error;
    }
  }

  async loginWithApple(): Promise<{ idToken: string; userInfo: any } | null> {
    // Apple Sign-In not implemented yet for Android
    throw new Error('Apple Sign-In is only available on iOS');
  }

  async loginWithEmail(_email: string): Promise<{ idToken: string; userInfo: any } | null> {
    // Email passwordless — use the server's regular login for now
    throw new Error('Please use email + password login below');
  }

  async logout(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch {}
  }

  isInitialized(): boolean {
    return true;
  }
}

export const web3authService = new SocialAuthService();
