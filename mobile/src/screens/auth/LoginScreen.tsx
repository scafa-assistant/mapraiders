import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { LoginScreenProps } from '../../navigation/types';
import { web3authService } from '../../services/web3auth';
import { strings as S } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../utils/constants';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { login, web3Login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert(S.common.error, S.auth.login.enterEmail);
      return;
    }
    if (!password) {
      Alert.alert(S.common.error, S.auth.login.enterPassword);
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (_err) {
      // Error is handled by the store
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    try {
      const result = provider === 'google'
        ? await web3authService.loginWithGoogle()
        : await web3authService.loginWithApple();
      if (result && result.userInfo?.email) {
        await web3Login(provider, result.idToken || 'google-native', result.userInfo);
      }
    } catch (err: any) {
      Alert.alert(S.auth.login.loginErrorTitle, err?.message || S.auth.login.socialLoginFailed);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleEmailLink = async () => {
    if (!email.trim()) {
      Alert.alert(S.common.error, S.auth.login.enterEmailFirst);
      return;
    }
    setSocialLoading('email');
    try {
      const result = await web3authService.loginWithEmail(email.trim().toLowerCase());
      if (result) {
        await web3Login('email_passwordless', result.idToken, result.userInfo);
      }
    } catch (_err) {
      // Error handled by store
    } finally {
      setSocialLoading(null);
    }
  };

  const isBusy = isLoading || !!socialLoading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Title */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="grid" size={48} color="#1558F0" />
            </View>
            <Text style={styles.title}>MAPRAIDERS</Text>
            <Text style={styles.subtitle}>{S.auth.login.tagline}</Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#D7263D" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Ionicons name="close" size={18} color="#D7263D" />
              </TouchableOpacity>
            </View>
          )}

          {/* Social Login */}
          <View style={styles.socialSection}>
            <TouchableOpacity
              style={[styles.googleButton, isBusy && styles.loginButtonDisabled]}
              onPress={() => handleSocialLogin('google')}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              {socialLoading === 'google' ? (
                <ActivityIndicator color="#141210" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#4285F4" style={styles.socialIcon} />
                  <Text style={styles.googleButtonText}>{S.auth.login.continueWithGoogle}</Text>
                </>
              )}
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.appleButton, isBusy && styles.loginButtonDisabled]}
                onPress={() => handleSocialLogin('apple')}
                disabled={isBusy}
                activeOpacity={0.8}
              >
                {socialLoading === 'apple' ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={styles.socialIcon} />
                    <Text style={styles.appleButtonText}>{S.auth.login.continueWithApple}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.emailLinkButton, isBusy && styles.loginButtonDisabled]}
              onPress={handleEmailLink}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              {socialLoading === 'email' ? (
                <ActivityIndicator color="#1558F0" size="small" />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={20} color="#1558F0" style={styles.socialIcon} />
                  <Text style={styles.emailLinkButtonText}>{S.auth.login.loginWithEmailLink}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{S.auth.login.or}</Text>
            <View style={styles.divider} />
          </View>

          {/* Email/Password Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={S.auth.login.emailPlaceholder}
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={S.auth.login.passwordPlaceholder}
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isBusy && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>{S.auth.login.enterTheGrid}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>{S.auth.login.forgotPassword}</Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.footer}>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{S.auth.login.newWalker}</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>{S.auth.login.createAccount}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: '#1558F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1558F0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
    letterSpacing: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(215, 38, 61, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(215, 38, 61, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: '#D7263D',
    fontSize: 13,
  },
  socialSection: {
    marginBottom: 20,
    gap: 12,
  },
  socialIcon: {
    marginRight: 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 52,
  },
  googleButtonText: {
    color: '#141210',
    fontSize: 15,
    fontWeight: '600',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    height: 52,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emailLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#1558F0',
  },
  emailLinkButtonText: {
    color: '#1558F0',
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: width - 64,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 16,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#1558F0',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1558F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
  forgotText: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
  },
  registerButton: {
    borderWidth: 1.5,
    borderColor: '#1558F0',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  registerButtonText: {
    color: '#1558F0',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
