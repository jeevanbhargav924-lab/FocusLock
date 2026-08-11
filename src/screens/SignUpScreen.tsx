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
  SafeAreaView,
} from 'react-native';
// @ts-ignore
import auth, {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  updateProfile,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { colors, typography, spacing, radius } from '../theme';
import { FocusButton } from '../components/FocusButton';
import { FocusCard } from '../components/FocusCard';
import {
  AppleIcon,
  EmailIcon,
  GoogleIcon,
  PasswordLockIcon,
  ShowPasswordIcon,
  ProfileIcon,
} from '../utils/Icons';
import { saveUserProfile } from '../services/database';
import { Toast } from '../components/Toast';

interface SignUpScreenProps {
  onLoginSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onLoginSuccess,
  onNavigateToLogin,
}) => {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Field-Specific Error States
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<boolean>(false);

  const [focusedInput, setFocusedInput] = useState<'fullName' | 'email' | 'password' | null>(null);

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

  const clearErrors = () => {
    setFullNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setTermsError(false);
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

  const handleSignUp = async () => {
    clearErrors();
    let hasError = false;

    if (!fullName.trim()) {
      setFullNameError('Please enter your full name');
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      hasError = true;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Please enter a password');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (!agreedToTerms) {
      setTermsError(true);
      hasError = true;
    }

    if (hasError) {
      Toast.error('Form Incomplete', 'Please fix highlighted errors before submitting.');
      return;
    }

    setLoading(true);
    try {
      const authInst = getAuthInstance();
      let userCredential;

      if (typeof createUserWithEmailAndPassword === 'function') {
        userCredential = await createUserWithEmailAndPassword(authInst, email.trim(), password);
      } else if (typeof authInst.createUserWithEmailAndPassword === 'function') {
        userCredential = await authInst.createUserWithEmailAndPassword(authInst, email.trim(), password);
      } else {
        throw new Error('Firebase Auth module initialization pending.');
      }

      const user = userCredential.user;

      // Update Display Name
      if (user) {
        try {
          if (typeof updateProfile === 'function') {
            await updateProfile(user, { displayName: fullName.trim() });
          } else if (typeof user.updateProfile === 'function') {
            await user.updateProfile({ displayName: fullName.trim() });
          }
        } catch (e) {
          console.warn('Could not update profile display name:', e);
        }
      }

      // Save User Profile to SQLite Database
      await saveUserProfile({
        uid: user.uid,
        email: user.email || email.trim(),
        display_name: fullName.trim(),
        photo_url: user.photoURL || '',
        created_at: Date.now(),
      });

      Toast.success('Account Created! 🎉', `Welcome to FocusLock, ${fullName.trim()}!`);
      onLoginSuccess();
    } catch (error: any) {
      console.log('Firebase Sign Up Error:', error);

      if (error.code === 'auth/email-already-in-use') {
        setEmailError('That email address is already registered');
        Toast.error('Sign Up Failed', 'That email address is already registered! Please log in.');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('Your password must be at least 6 characters long');
        Toast.error('Weak Password', 'Your password must be at least 6 characters long.');
      } else if (error.code === 'auth/invalid-email') {
        setEmailError('Invalid email format');
        Toast.error('Invalid Email', 'Please enter a valid email address.');
      } else {
        Toast.error('Sign Up Failed', error.message || 'Could not complete registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
        display_name: user.displayName || fullName.trim() || 'Focus User',
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/images/appIcon.png')}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>
            Start your journey to deep focus today.
          </Text>
        </View>

        {/* Main Sign Up Form Card */}
        <FocusCard style={styles.formCard}>
          {/* Full Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedInput === 'fullName' && styles.inputWrapperFocused,
                !!fullNameError && styles.inputWrapperError,
              ]}>
              <View style={styles.fieldIcon}>
                <ProfileIcon
                  color={
                    fullNameError
                      ? '#FF6B6B'
                      : focusedInput === 'fullName'
                      ? '#4ECCA3'
                      : '#8B949E'
                  }
                />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="John Doe"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={text => {
                  setFullName(text);
                  if (fullNameError) setFullNameError(null);
                }}
                autoCapitalize="words"
                onFocus={() => setFocusedInput('fullName')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            {fullNameError ? (
              <Text style={styles.fieldErrorText}>⚠️ {fullNameError}</Text>
            ) : null}
          </View>

          {/* Email Address Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedInput === 'email' && styles.inputWrapperFocused,
                !!emailError && styles.inputWrapperError,
              ]}>
              <View style={styles.fieldIcon}>
                <EmailIcon
                  color={
                    emailError
                      ? '#FF6B6B'
                      : focusedInput === 'email'
                      ? '#4ECCA3'
                      : '#8B949E'
                  }
                />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="john@example.com"
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

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedInput === 'password' && styles.inputWrapperFocused,
                !!passwordError && styles.inputWrapperError,
              ]}>
              <View style={styles.fieldIcon}>
                <PasswordLockIcon
                  color={
                    passwordError
                      ? '#FF6B6B'
                      : focusedInput === 'password'
                      ? '#4ECCA3'
                      : '#8B949E'
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
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.fieldIconRight}>
                <ShowPasswordIcon
                  color={
                    passwordError
                      ? '#FF6B6B'
                      : showPassword
                      ? '#4ECCA3'
                      : '#8B949E'
                  }
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.fieldErrorText}>⚠️ {passwordError}</Text>
            ) : null}
          </View>

          {/* Terms and Conditions Checkbox */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setAgreedToTerms(!agreedToTerms);
              if (termsError) setTermsError(false);
            }}
            style={styles.checkboxRow}>
            <View
              style={[
                styles.checkboxSquare,
                agreedToTerms && styles.checkboxSquareChecked,
                termsError && styles.checkboxSquareError,
              ]}>
              {agreedToTerms && <Text style={styles.checkmarkSymbol}>✓</Text>}
            </View>
            <Text style={[styles.termsText, termsError && styles.termsTextError]}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms and Conditions</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy.</Text>
            </Text>
          </TouchableOpacity>

          {/* Sign Up Submit Button */}
          {loading ? (
            <ActivityIndicator size="large" color="#4ECCA3" style={{ marginVertical: 14 }} />
          ) : (
            <FocusButton
              title="Sign Up →"
              variant="primary"
              size="large"
              onPress={handleSignUp}
              style={styles.signUpBtn}
            />
          )}

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Sign-In Buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.socialBtnHalf}
              onPress={handleGoogleSignIn}>
              <GoogleIcon width={18} height={18} />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.socialBtnHalf}
                onPress={onLoginSuccess}>
                <AppleIcon width={18} height={18} />
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.socialBtnHalf}
                onPress={async () => {
                  await saveUserProfile({
                    uid: 'guest_' + Date.now(),
                    email: 'guest@focuslock.app',
                    display_name: 'Guest User',
                    created_at: Date.now(),
                  });
                  onLoginSuccess();
                }}>
                <Text style={styles.socialText}>Guest</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Log In Link Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginLinkText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </FocusCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(121, 134, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(121, 134, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
  },
  formCard: {
    padding: 20,
    backgroundColor: '#161B22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F141C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    height: 48,
  },
  inputWrapperFocused: {
    borderColor: '#4ECCA3',
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
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldIconRight: {
    marginLeft: 10,
    padding: 4,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: 48,
  },

  /* Terms Checkbox */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 14,
    gap: 10,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#8B949E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSquareChecked: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  checkboxSquareError: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  checkmarkSymbol: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#8B949E',
  },
  termsTextError: {
    color: '#FF6B6B',
  },
  termsLink: {
    color: '#7986FF',
    textDecorationLine: 'underline',
  },

  /* Buttons & Social */
  signUpBtn: {
    marginTop: 4,
    backgroundColor: '#7986FF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: '#6E7681',
    fontSize: 10,
    fontWeight: '700',
    marginHorizontal: 10,
    letterSpacing: 0.6,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  socialBtnHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F141C',
    borderRadius: 12,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  socialText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Footer Switcher */
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  footerText: {
    color: '#8B949E',
    fontSize: 13,
  },
  loginLinkText: {
    color: '#4ECCA3',
    fontSize: 13,
    fontWeight: '700',
  },
});
