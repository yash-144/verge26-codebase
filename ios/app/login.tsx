import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/services/auth';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { THEME } from '@/constants/Theme';
import { VergeButton } from '@/components/VergeButton';
import { useAppContext } from '@/context/AppContext';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FULL_TEXT = "HEY.\nWELCOME TO\nVERGE";

type AuthMode = 'login' | 'signup';
type AuthStep = 'initial' | 'password' | 'otp' | 'success';

export default function LoginScreen() {
  const router = useRouter();
  const { splashFinished, setIsVerified } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  // Modal states
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [authStep, setAuthStep] = useState<AuthStep>('initial');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const otpInputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!splashFinished) return;
    let currentIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    const typeNextChar = () => {
      if (currentIndex < FULL_TEXT.length) {
        setDisplayedText(FULL_TEXT.substring(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeNextChar, FULL_TEXT.substring(0, currentIndex) === "HEY." ? 600 : 25);
      }
    };
    const startTimeout = setTimeout(typeNextChar, 400);
    return () => {
      clearTimeout(startTimeout);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [splashFinished]);

  useEffect(() => {
    const cursorInterval = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(cursorInterval);
  }, []);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setOtp(['', '', '', '', '', '']);
    setError('');
  };

  const openAuth = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
    setAuthStep('initial');
    setAuthModalVisible(true);
  };

  const handleContinueInitial = async () => {
    if (mode === 'signup') {
      if (!name.trim()) return setError('Name is required');
      if (!email.trim() || !email.includes('@')) return setError('Valid email is required');
      if (password.length < 6) return setError('Password must be at least 6 characters');
      
      setModalLoading(true);
      setError('');
      try {
        await authService.register(name.trim(), email.trim(), password);
        setAuthStep('otp');
      } catch (err: any) {
        setError(err.message || 'Registration failed');
      } finally {
        setModalLoading(false);
      }
    } else {
      // Login mode - just check email first
      if (!email.trim() || !email.includes('@')) return setError('Valid email is required');
      // For login, we can ask for password or OTP
      setAuthStep('password');
    }
  };

  const handleLoginPassword = async () => {
    if (!password) return setError('Password is required');
    setModalLoading(true);
    setError('');
    try {
      await authService.loginWithPassword(email.trim(), password);
      completeAuth();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setModalLoading(false);
    }
  };

  const handleLoginOtpRequest = async () => {
    setModalLoading(true);
    setError('');
    try {
      await authService.sendLoginOtp(email.trim());
      setAuthStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== '') && newOtp.length === 6) {
      Keyboard.dismiss();
      verifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (code: string) => {
    if (modalLoading) return;
    setModalLoading(true);
    setError('');
    try {
      await authService.confirmVerificationCode(email.trim(), code);
      completeAuth();
    } catch (err: any) {
      setError(err.message || 'Invalid code');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
    } finally {
      setModalLoading(false);
    }
  };

  const completeAuth = () => {
    setAuthStep('success');
    setTimeout(() => {
      setAuthModalVisible(false);
      setIsVerified(true);
      router.replace('/dashboard');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Image 
        source={require('../assets/astronaut.png')} 
        style={styles.bgImageFill} 
        contentFit="cover"
        transition={500}
        cachePolicy="memory-disk"
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.titleContainer}>
          <Text style={styles.welcomeText}>
            {displayedText}
            <Text style={{ color: cursorVisible ? THEME.colors.accent : 'transparent' }}>_</Text>
          </Text>
        </View>

        <Animated.View entering={FadeInDown.duration(800)} style={styles.buttonContainer}>
          <VergeButton 
            label="SIGN IN" 
            onPress={() => openAuth('login')} 
            style={styles.primaryBtn}
          />
          
          <TouchableOpacity onPress={() => openAuth('signup')} style={styles.secondaryBtn} activeOpacity={0.8}>
            <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
              <Text style={styles.secondaryBtnText}>CREATE ACCOUNT</Text>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      <Modal
        visible={authModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => !modalLoading && setAuthModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalFullOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => !modalLoading && setAuthModalVisible(false)}
            >
              <View style={styles.modalBackdrop} />
            </Pressable>

            <View style={styles.bottomSheet}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}
                bounces={false}
              >
                <View style={styles.sheetHandle} />

                {authStep === 'success' ? (
                  <Animated.View entering={FadeIn} style={styles.successContainer}>
                    <View style={styles.successIconWrapper}>
                      <Ionicons name="checkmark-circle" size={80} color={THEME.colors.accent} />
                    </View>
                    <Text style={styles.successTitle}>Welcome Back</Text>
                    <Text style={styles.successSubtitle}>Identity verified. Uplink established.</Text>
                  </Animated.View>
                ) : (
                  <>
                    <View style={styles.sheetHeader}>
                      <Text style={styles.sheetTitle}>
                        {mode === 'login' ? 'Welcome Back' : 'Join Verge'}
                      </Text>
                      <Text style={styles.sheetSubtitle}>
                        {authStep === 'initial' 
                          ? (mode === 'login' ? 'Enter your email to continue.' : 'Create your account to join the festival.')
                          : authStep === 'password' ? 'Enter your password.'
                          : `Enter the 6-digit code sent to ${email}`}
                      </Text>
                    </View>

                    {error ? (
                      <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle-outline" size={16} color="#FF4B4B" />
                        <Text style={styles.errorBannerText}>{error}</Text>
                      </View>
                    ) : null}

                    <View style={styles.sheetBody}>
                      {authStep === 'initial' && (
                        <>
                          {mode === 'signup' && (
                            <TextInput
                              style={styles.sheetInput}
                              placeholder="Full Name"
                              placeholderTextColor="rgba(255,255,255,0.3)"
                              value={name}
                              onChangeText={setName}
                              autoCapitalize="words"
                              selectionColor={THEME.colors.accent}
                            />
                          )}
                          <TextInput
                            style={styles.sheetInput}
                            placeholder="Email Address"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            selectionColor={THEME.colors.accent}
                          />
                          {mode === 'signup' && (
                            <TextInput
                              style={styles.sheetInput}
                              placeholder="Password"
                              placeholderTextColor="rgba(255,255,255,0.3)"
                              value={password}
                              onChangeText={setPassword}
                              secureTextEntry
                              selectionColor={THEME.colors.accent}
                            />
                          )}
                          <VergeButton
                            label={mode === 'signup' ? "Register" : "Continue"}
                            onPress={handleContinueInitial}
                            loading={modalLoading}
                          />
                        </>
                      )}

                      {authStep === 'password' && (
                        <>
                          <TextInput
                            style={styles.sheetInput}
                            placeholder="Password"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoFocus
                            selectionColor={THEME.colors.accent}
                          />
                          <VergeButton
                            label="Login"
                            onPress={handleLoginPassword}
                            loading={modalLoading}
                          />
                          <TouchableOpacity 
                            onPress={handleLoginOtpRequest}
                            style={styles.otpLink}
                            disabled={modalLoading}
                          >
                            <Text style={styles.otpLinkText}>Login with OTP instead</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {authStep === 'otp' && (
                        <View style={styles.otpContainer}>
                          <View style={styles.otpRow}>
                            {otp.map((digit, idx) => (
                              <TextInput
                                key={idx}
                                ref={ref => { otpInputs.current[idx] = ref; }}
                                style={[styles.otpBox, digit !== '' && styles.otpBoxActive]}
                                value={digit}
                                onChangeText={(v) => handleOtpChange(v, idx)}
                                onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                selectionColor={THEME.colors.accent}
                                autoFocus={idx === 0}
                              />
                            ))}
                          </View>
                          {modalLoading && (
                            <View style={styles.verifyingIndicator}>
                              <ActivityIndicator size="small" color={THEME.colors.accent} />
                              <Text style={styles.verifyingText}>Verifying...</Text>
                            </View>
                          )}
                        </View>
                      )}
                      
                      {authStep !== 'initial' && (
                        <TouchableOpacity
                          onPress={() => { setAuthStep('initial'); setError(''); }}
                          style={styles.backAction}
                          disabled={modalLoading}
                        >
                          <Text style={styles.backActionText}>Go Back</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.bg },
  overlay: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 40 },
  bgImageFill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  buttonContainer: { gap: 12 },
  primaryBtn: { height: 56, borderRadius: 16 },
  secondaryBtn: { height: 56, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  blurContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: '#FFF', fontSize: 12, fontFamily: THEME.fonts.primaryBold, letterSpacing: 1.5 },
  titleContainer: { marginBottom: 40, paddingHorizontal: 4 },
  welcomeText: { fontFamily: THEME.fonts.primaryBold, fontSize: 34, color: '#FFFFFF', textAlign: 'left', lineHeight: 40, letterSpacing: 1, textTransform: 'uppercase', textShadowColor: 'rgba(255, 107, 0, 0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },

  modalFullOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  bottomSheet: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { marginBottom: 24 },
  sheetTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  sheetSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },
  sheetBody: { gap: 16 },
  sheetInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, height: 56, paddingHorizontal: 20, color: '#FFF', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  otpContainer: { gap: 20 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  otpBox: {
    width: (SCREEN_WIDTH - 88) / 6,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center'
  },
  otpBoxActive: { borderColor: THEME.colors.accent, backgroundColor: 'rgba(255, 107, 0, 0.05)' },
  verifyingIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  verifyingText: { color: THEME.colors.accent, fontSize: 13, fontWeight: '600' },
  
  otpLink: { alignSelf: 'center', padding: 8 },
  otpLinkText: { color: THEME.colors.accent, fontSize: 13, fontWeight: '600' },
  backAction: { alignSelf: 'center', padding: 8 },
  backActionText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '500' },
  
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 75, 75, 0.1)', padding: 14, borderRadius: 16, marginBottom: 16, gap: 10 },
  errorBannerText: { color: '#FF4B4B', fontSize: 13, fontWeight: '500', flex: 1 },

  successContainer: { alignItems: 'center', paddingVertical: 20 },
  successIconWrapper: { marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 10 },
  successSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
});
