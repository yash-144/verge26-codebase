import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

export default function LoginScreen() {
  const router = useRouter();
  const { splashFinished, setIsVerified } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  // Modal states
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authStep, setAuthStep] = useState<'email' | 'otp' | 'success'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const firebaseUser = await authService.signIn();
      if (firebaseUser) {
        // Trust Firebase-authenticated session immediately.
        setIsVerified(true);
        // Keep backend profile sync best-effort.
        void authService.syncUserWithBackend(firebaseUser).catch(() => { });
      }
    } catch {
      setError('Login connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailInitiate = () => {
    setError('');
    setAuthStep('email');
    setAuthModalVisible(true);
  };

  const initiateUplink = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setModalLoading(true);
    setError('');
    try {
      await authService.sendVerificationCode(email);
      setAuthStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send code. Please try again.');
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
      verifySequence(newOtp.join(''));
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const verifySequence = async (code: string) => {
    if (modalLoading) return;

    setModalLoading(true);
    setError('');
    try {
      await authService.confirmVerificationCode(email, code, name.trim());

      setAuthStep('success');

      // Show success for 1.5s then redirect
      setTimeout(() => {
        setAuthModalVisible(false);
        setIsVerified(true);
        router.replace('/dashboard');
      }, 1500);

    } catch (err: any) {

      setError(err.message || 'Invalid code. Please check and try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Image source={require('../assets/astronaut.png')} style={styles.bgImageFill} resizeMode="cover" />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.titleContainer}>
          <Text style={styles.welcomeText}>
            {displayedText}
            <Text style={{ color: cursorVisible ? THEME.colors.accent : 'transparent' }}>_</Text>
          </Text>
        </View>

        <Animated.View entering={FadeInDown.duration(800)} style={styles.buttonContainer}>
          <VergeButton
            label="Continue with Google"
            onPress={handleGoogleLogin}
            loading={loading && !authModalVisible}
            icon={<Ionicons name="logo-google" size={14} color="#000" />}
            style={styles.loginBtn}
          />

          <TouchableOpacity onPress={handleEmailInitiate} style={styles.emailContinueBtn} activeOpacity={0.8}>
            <BlurView intensity={20} tint="dark" style={styles.emailBlur}>
              <Ionicons name="mail-outline" size={16} color="#FFF" />
              <Text style={styles.emailContinueText}>CONTINUE WITH EMAIL</Text>
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
                    <Text style={styles.successTitle}>Verification Done</Text>
                    <Text style={styles.successSubtitle}>Welcome to the Verge network.</Text>
                  </Animated.View>
                ) : (
                  <>
                    <View style={styles.sheetHeader}>
                      <Text style={styles.sheetTitle}>
                        {authStep === 'email' ? 'Email Verification' : 'Verify Code'}
                      </Text>
                      <Text style={styles.sheetSubtitle}>
                        {authStep === 'email'
                          ? 'Enter your email address to receive a verification code.'
                          : `Enter the 6-digit code sent to ${email}`}
                      </Text>
                    </View>

                    {error ? (
                      <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle-outline" size={16} color="#FF4B4B" />
                        <Text style={styles.errorBannerText}>{error}</Text>
                      </View>
                    ) : null}

                    {authStep === 'email' ? (
                      <View style={styles.sheetBody}>
                        <TextInput
                          style={styles.sheetInput}
                          placeholder="Your full name"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={name}
                          onChangeText={(t) => { setName(t); setError(''); }}
                          autoCapitalize="words"
                          selectionColor={THEME.colors.accent}
                          autoFocus
                        />
                        <TextInput
                          style={styles.sheetInput}
                          placeholder="name@example.com"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={email}
                          onChangeText={(t) => { setEmail(t); setError(''); }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          selectionColor={THEME.colors.accent}
                        />
                        <VergeButton
                          label="Send Code"
                          onPress={initiateUplink}
                          loading={modalLoading}
                          style={styles.sheetPrimaryBtn}
                        />
                      </View>
                    ) : (
                      <View style={styles.sheetBody}>
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
                          <View style={styles.sheetVerifyingIndicator}>
                            <ActivityIndicator size="small" color={THEME.colors.accent} />
                            <Text style={styles.sheetVerifyingText}>Verifying code...</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          onPress={() => { setAuthStep('email'); setError(''); setOtp(['', '', '', '', '', '']); }}
                          style={styles.sheetBackAction}
                          disabled={modalLoading}
                        >
                          <Text style={styles.sheetBackActionText}>Use a different email</Text>
                        </TouchableOpacity>
                      </View>
                    )}
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
  loginBtn: { height: 56, borderRadius: 16 },
  emailContinueBtn: { height: 56, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emailBlur: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  emailContinueText: { color: '#FFF', fontSize: 12, fontFamily: THEME.fonts.primaryBold, letterSpacing: 1.5 },
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
    marginTop: 'auto', // Forces it to stay at the bottom
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { marginBottom: 28 },
  sheetTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  sheetSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },
  sheetBody: { gap: 20 },
  sheetInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, height: 56, paddingHorizontal: 20, color: '#FFF', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sheetPrimaryBtn: { height: 56, borderRadius: 16 },
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
  sheetVerifyingIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  sheetVerifyingText: { color: THEME.colors.accent, fontSize: 13, fontWeight: '600' },
  sheetBackAction: { alignSelf: 'center', paddingVertical: 10, marginTop: 10 },
  sheetBackActionText: { color: THEME.colors.textMuted, fontSize: 13, fontWeight: '500' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 75, 75, 0.1)', padding: 14, borderRadius: 16, marginBottom: 16, gap: 10 },
  errorBannerText: { color: '#FF4B4B', fontSize: 13, fontWeight: '500', flex: 1 },

  successContainer: { alignItems: 'center', paddingVertical: 20 },
  successIconWrapper: { marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 10 },
  successSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
});
