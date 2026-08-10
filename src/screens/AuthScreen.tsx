import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
// @ts-ignore
import auth, {
  getAuth,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} from '@react-native-firebase/auth';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { colors, typography, spacing, radius } from '../theme';
import { FocusButton } from '../components/FocusButton';
import { FocusCard } from '../components/FocusCard';
import { AppleIcon, EmailIcon, GoogleIcon, PasswordLockIcon, ShowPasswordIcon } from '../utils/Icons';
import { saveUserProfile } from '../services/database';
import { SignUpScreen } from './SignUpScreen';
import { Toast } from '../components/Toast';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Field-Specific Error States
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: '204885497983-8eaa5rtsbr5q2ng30697qdp29bckeb1f.apps.googleusercontent.com',
        scopes: ['email', 'profile'],
      });
    } catch (e) {
      console.warn('GoogleSignin configure error:', e);
    }
  }, []);

  if (isSignUp) {
    return (
      <SignUpScreen
        onLoginSuccess={onLoginSuccess}
        onNavigateToLogin={() => setIsSignUp(false)}
      />
    );
  }

  const clearErrors = () => {
    setEmailError(null);
    setPasswordError(null);
  };

  // Helper to safely get Auth instance
  const getAuthInstance = () => {
    if (typeof getAuth === 'function') {
      try {
        const instance = getAuth();
        if (instance) return instance;
      } catch (e) {}
    }
    if (typeof auth === 'function') {
      try {
        const instance = auth();
        if (instance) return instance;
      } catch (e) {}
    }
    return auth || {};
  };

  // Handle Firebase Email/Password Sign-In
  const handleEmailAuth = async () => {
    clearErrors();
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Please enter your email address');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Please enter your password');
      hasError = true;
    }

    if (hasError) {
      Toast.error('Required Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const authInst = getAuthInstance();
      let userCredential;

      if (typeof signInWithEmailAndPassword === 'function') {
        userCredential = await signInWithEmailAndPassword(authInst, email.trim(), password);
      } else if (typeof authInst.signInWithEmailAndPassword === 'function') {
        userCredential = await authInst.signInWithEmailAndPassword(authInst, email.trim(), password);
      } else {
        throw new Error('Firebase Auth module initialization pending.');
      }

      const user = userCredential.user;

      // Store User Profile in SQLite Database
      await saveUserProfile({
        uid: user.uid,
        email: user.email || email.trim(),
        display_name: user.displayName || email.trim().split('@')[0],
        photo_url: user.photoURL || '',
        created_at: Date.now(),
      });

      Toast.success('Login Successful! 🎉', `Welcome back, ${user.displayName || email.trim().split('@')[0]}!`);
      onLoginSuccess();
    } catch (error: any) {
      console.log('Firebase Auth Error:', error);

      let msg = 'Authentication failed. Please try again.';
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found'
      ) {
        setEmailError('Account not found or invalid email');
        setPasswordError('Please check your credentials');
        msg = 'Invalid email or password. Please check your credentials.';
      } else if (error.code === 'auth/wrong-password') {
        setPasswordError('Incorrect password');
        msg = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        setEmailError('Invalid email format');
        msg = 'Please enter a valid email address.';
      } else if (error.message) {
        msg = error.message;
      }

      Toast.error('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Firebase Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken || (signInResult as any).idToken;

      if (!idToken) {
        throw new Error('Google ID Token was not returned.');
      }

      const provider = GoogleAuthProvider || (auth as any).GoogleAuthProvider;
      const credential = provider.credential(idToken);
      const authInst = getAuthInstance();

      let userCredential;
      if (typeof signInWithCredential === 'function') {
        userCredential = await signInWithCredential(authInst, credential);
      } else {
        userCredential = await authInst.signInWithCredential(credential);
      }
      const user = userCredential.user;

      await saveUserProfile({
        uid: user.uid,
        email: user.email || '',
        display_name: user.displayName || 'Focus User',
        photo_url: user.photoURL || '',
        created_at: Date.now(),
      });

      Toast.success('Google Sign-In Successful! 🎉');
      onLoginSuccess();
    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      Toast.error('Google Sign-In Failed', error.message || 'Could not complete Google Sign-In.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Logo Badge */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Image
            source={require('../../assets/images/appIcon.png')}
            style={styles.logoImage}
          />
        </View>
        <Text style={[typography.displayLarge, styles.title]}>FocusLock</Text>
        <Text style={[typography.bodyMedium, styles.subtitle]}>
          Welcome back. Re-enter your flow state.
        </Text>
      </View>

      {/* Main Login Form Card */}
      <FocusCard style={styles.formCard}>
        {/* Email Address */}
        <View style={styles.inputGroup}>
          <Text style={[typography.labelCaps, styles.inputLabel]}>
            Email Address
          </Text>
          <View
            style={[
              styles.inputWrapper,
              focusedInput === 'email' && { borderColor: colors.borderActive },
              !!emailError && styles.inputWrapperError,
            ]}
          >
            <View style={styles.fieldIcon}>
              <EmailIcon
                color={
                  emailError
                    ? '#FF6B6B'
                    : focusedInput === 'email'
                    ? '#fff'
                    : '#ffffff37'
                }
              />
            </View>

            <TextInput
              style={[styles.textInput]}
              placeholder="name@company.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (emailError) setEmailError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {emailError ? (
            <Text style={styles.fieldErrorText}>⚠️ {emailError}</Text>
          ) : null}
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <View style={styles.labelWithLink}>
            <Text style={[typography.labelCaps, styles.inputLabel]}>
              Password
            </Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.forgotLink}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.inputWrapper,
              focusedInput === 'password' && { borderColor: colors.borderActive },
              !!passwordError && styles.inputWrapperError,
            ]}
          >
            <View style={styles.fieldIcon}>
              <PasswordLockIcon
                color={
                  passwordError
                    ? '#FF6B6B'
                    : focusedInput === 'password'
                    ? '#fff'
                    : '#ffffff37'
                }
              />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (passwordError) setPasswordError(null);
              }}
              secureTextEntry
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
            <View style={styles.fieldIconRight}>
              <ShowPasswordIcon
                color={passwordError ? '#FF6B6B' : '#ffffff37'}
              />
            </View>
          </View>
          {passwordError ? (
            <Text style={styles.fieldErrorText}>⚠️ {passwordError}</Text>
          ) : null}
        </View>

        {/* Login Button */}
        {loading ? (
          <ActivityIndicator size="large" color="#4ECCA3" style={{ marginVertical: 12 }} />
        ) : (
          <FocusButton
            title="Login →"
            variant="primary"
            size="large"
            onPress={handleEmailAuth}
            style={{ marginTop: spacing.xs }}
          />
        )}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Social Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.socialBtn}
          onPress={handleGoogleSignIn}
        >
          <View style={styles.socialIcon}><GoogleIcon/></View>
          <Text style={styles.socialText}>Continue with Google</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.socialBtn}
            onPress={onLoginSuccess}
          >
            <View style={styles.socialIcon}><AppleIcon/></View>
            <Text style={styles.socialText}>Continue with Apple</Text>
          </TouchableOpacity>
        )}

        {/* Continue as Guest */}
        <TouchableOpacity
          style={styles.guestRow}
          onPress={async () => {
            await saveUserProfile({
              uid: 'guest_user',
              email: 'guest@focuslock.app',
              display_name: 'Guest User',
              created_at: Date.now(),
            });
            onLoginSuccess();
          }}>
          <Text style={styles.guestText}>Continue as Guest</Text>
        </TouchableOpacity>
      </FocusCard>

      {/* Footer Mode Switcher */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => setIsSignUp(true)}>
          <Text style={styles.createAccountText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.containerMargin,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: 'rgba(121, 134, 255, 0.12)',
    borderWidth: 1,
    borderColor: colors.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  logoImage: {
    width: 54,
    height: 54,
    resizeMode: 'contain',
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 30,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  formCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'none',
    fontWeight: '500',
  },
  labelWithLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotLink: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputWrapperError: {
    borderColor: '#FF6B6B',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 107, 107, 0.06)',
  },
  fieldErrorText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 2,
  },
  fieldIcon: {
    marginRight: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldIconRight: {
    marginLeft: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm + 2,
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginHorizontal: spacing.sm,
    letterSpacing: 0.5,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs + 2,
  },
  socialIcon: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginRight: spacing.xs,
  },
  socialText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  guestRow: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  guestText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  createAccountText: {
    color: colors.accentGreen,
    fontSize: 13,
    fontWeight: '600',
  },
});
