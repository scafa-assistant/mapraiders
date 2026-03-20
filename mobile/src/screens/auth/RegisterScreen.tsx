import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { RegisterScreenProps } from '../../navigation/types';
import { web3authService } from '../../services/web3auth';

const { width } = Dimensions.get('window');

interface ValidationErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { register, web3Login, isLoading, error, clearError } = useAuthStore();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const errors: ValidationErrors = {};

    if (!username.trim()) {
      errors.username = 'Username is required.';
    } else if (username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    } else if (username.trim().length > 20) {
      errors.username = 'Username must be under 20 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      errors.username = 'Only letters, numbers, and underscores.';
    }

    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register(username.trim(), email.trim().toLowerCase(), password);
    } catch (_err) {
      // Error handled by store
    }
  };

  const getPasswordStrength = (): { label: string; color: string; width: string } => {
    if (!password) return { label: '', color: 'transparent', width: '0%' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Weak', color: '#FF4757', width: '20%' };
    if (score <= 2) return { label: 'Fair', color: '#FFB800', width: '40%' };
    if (score <= 3) return { label: 'Good', color: '#FFB800', width: '60%' };
    if (score <= 4) return { label: 'Strong', color: '#00FF88', width: '80%' };
    return { label: 'Excellent', color: '#00FF88', width: '100%' };
  };

  const strength = getPasswordStrength();

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    try {
      await web3authService.init();

      const result = provider === 'google'
        ? await web3authService.loginWithGoogle()
        : await web3authService.loginWithApple();

      if (result) {
        await web3Login(provider, result.idToken, result.userInfo);
      } else {
        Alert.alert('Sign up cancelled', 'Social login was cancelled or failed.');
      }
    } catch (_err) {
      // Error is handled by the store
    } finally {
      setSocialLoading(null);
    }
  };

  const handleEmailLink = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address first.');
      return;
    }
    setSocialLoading('email');
    try {
      await web3authService.init();
      const result = await web3authService.loginWithEmail(email.trim().toLowerCase());

      if (result) {
        await web3Login('email', result.idToken, result.userInfo);
      } else {
        Alert.alert('Sign up cancelled', 'Email login was cancelled or failed.');
      }
    } catch (_err) {
      // Error is handled by the store
    } finally {
      setSocialLoading(null);
    }
  };

  const isBusy = isLoading || socialLoading !== null;

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
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#8892B0" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>JOIN THE GRID</Text>
            <Text style={styles.subtitle}>Create your walker identity</Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#FF4757" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Ionicons name="close" size={18} color="#FF4757" />
              </TouchableOpacity>
            </View>
          )}

          {/* Social Login Buttons */}
          <View style={styles.socialSection}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => handleSocialLogin('google')}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              {socialLoading === 'google' ? (
                <ActivityIndicator color="#0A0E17" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#0A0E17" style={styles.socialIcon} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.appleButton}
                onPress={() => handleSocialLogin('apple')}
                disabled={isBusy}
                activeOpacity={0.8}
              >
                {socialLoading === 'apple' ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={22} color="#FFFFFF" style={styles.socialIcon} />
                    <Text style={styles.appleButtonText}>Continue with Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.emailLinkButton}
              onPress={handleEmailLink}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              {socialLoading === 'email' ? (
                <ActivityIndicator color="#00D4FF" size="small" />
              ) : (
                <>
                  <Ionicons name="link-outline" size={20} color="#00D4FF" style={styles.socialIcon} />
                  <Text style={styles.emailLinkButtonText}>Sign up with Email Link</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.orDividerRow}>
            <View style={styles.orDivider} />
            <Text style={styles.orDividerText}>OR</Text>
            <View style={styles.orDivider} />
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>CALLSIGN</Text>
            <View
              style={[
                styles.inputContainer,
                validationErrors.username ? styles.inputError : null,
              ]}
            >
              <Ionicons name="person-outline" size={20} color="#8892B0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#555E78"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (validationErrors.username) {
                    setValidationErrors((prev) => ({ ...prev, username: undefined }));
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>
            {validationErrors.username && (
              <Text style={styles.fieldError}>{validationErrors.username}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <View
              style={[
                styles.inputContainer,
                validationErrors.email ? styles.inputError : null,
              ]}
            >
              <Ionicons name="mail-outline" size={20} color="#8892B0" style={styles.inputIcon} />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#555E78"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (validationErrors.email) {
                    setValidationErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
            {validationErrors.email && (
              <Text style={styles.fieldError}>{validationErrors.email}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View
              style={[
                styles.inputContainer,
                validationErrors.password ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#8892B0"
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Min 8 characters"
                placeholderTextColor="#555E78"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (validationErrors.password) {
                    setValidationErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8892B0"
                />
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarBackground}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      { width: strength.width as any, backgroundColor: strength.color },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}
            {validationErrors.password && (
              <Text style={styles.fieldError}>{validationErrors.password}</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <View
              style={[
                styles.inputContainer,
                validationErrors.confirmPassword ? styles.inputError : null,
              ]}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color="#8892B0" style={styles.inputIcon} />
              <TextInput
                ref={confirmRef}
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor="#555E78"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }));
                  }
                }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              {confirmPassword.length > 0 && password === confirmPassword && (
                <Ionicons name="checkmark-circle" size={20} color="#00FF88" />
              )}
            </View>
            {validationErrors.confirmPassword && (
              <Text style={styles.fieldError}>{validationErrors.confirmPassword}</Text>
            )}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isBusy && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isBusy}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#0A0E17" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>INITIALIZE WALKER</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLinkAction}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#141B2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8892B0',
    marginTop: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: '#FF4757',
    fontSize: 13,
  },
  socialSection: {
    marginBottom: 8,
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
    color: '#0A0E17',
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
    borderColor: '#00D4FF',
  },
  emailLinkButtonText: {
    color: '#00D4FF',
    fontSize: 15,
    fontWeight: '600',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#1A2340',
  },
  orDividerText: {
    color: '#555E78',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 16,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    color: '#8892B0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A2340',
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: {
    borderColor: '#FF4757',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  fieldError: {
    color: '#FF4757',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  strengthBarBackground: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1A2340',
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#7B61FF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    color: '#8892B0',
    fontSize: 14,
  },
  loginLinkAction: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '600',
  },
});
