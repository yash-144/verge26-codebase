import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import RazorpayCheckout from 'react-native-razorpay';
import { authService } from '../../src/services/auth';
import { VergeAlert } from '../../src/components/VergeAlert';
import { VergeHeader } from '../../src/components/VergeHeader';
import { VergeLoader } from '../../src/components/VergeLoader';
import { apiHelper } from '../../src/services/api';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID!;
const PRICE_PER_DAY = 150;
const MESS_PRICE = 299;

const AVAILABLE_DAYS = ['Day-0 : 12th', 'Day-1 : 13th', 'Day-2 : 14th'];

const THEME = {
  bg: '#050505',
  panel: '#111111',
  panelSoft: '#0B0B0B',
  accent: '#FF6B00',
  text: '#FFFFFF',
  textMuted: '#8F8F8F',
  border: '#1F1F1F',
  borderLight: '#2A2A2A',
  success: '#00C853',
  error: '#FF3D00',
};

type FormState = {
  name: string;
  gender: string;
  collegeName: string;
  email: string;
  phone: string;
  selectedDays: string[];
  mess: boolean;
  mongoUserId: string;
};

export default function HostelRegister() {
  const router = useRouter();
  const { hostelId, hostelName, hostelGender } = useLocalSearchParams();

  const goToStayScreen = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/accommodation' as any);
  }, [router]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: any[];
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const [form, setForm] = useState<FormState>({
    name: '',
    gender: '',
    collegeName: '',
    email: '',
    phone: '',
    selectedDays: [],
    mess: false,
    mongoUserId: '',
  });

  const fetchUserData = useCallback(async () => {
    try {
      const backendUser = await authService.getUserSession();

      if (!backendUser) return;

      const bid = backendUser?._id;
      if (!bid) {
        if (__DEV__) console.error('No MongoDB user ID available for hostel registration');
        setLoading(false);
        return;
      }

      const response = await apiHelper.fetch(`${SERVER_URL}/api/users/get?id=${bid}`);

      if (response.ok) {
        const result = await response.json();
        const userData = result.data;

        const updatedForm = {
          name: userData.name || backendUser?.name || '',
          gender: userData.gender || backendUser?.gender || '',
          collegeName: userData.collegeName || backendUser?.collegeName || '',
          email: userData.email || backendUser?.email || '',
          mongoUserId: userData._id || backendUser?._id,
        };
        setForm((prev) => ({ ...prev, ...updatedForm }));

        if (userData.gender && hostelGender) {
          const hGen = String(hostelGender).toLowerCase();
          const uGen = userData.gender.toLowerCase();
          if ((hGen === 'male' && uGen !== 'male') || (hGen === 'female' && uGen !== 'female')) {
            showAlert(
              'Access Denied',
              `This sector is for ${hGen.toUpperCase()} candidates. Your profile indicates ${uGen.toUpperCase()}.`,
              [{ text: 'Go Back', onPress: goToStayScreen }]
            );
          }
        }
      }
    } catch {
      if (__DEV__) console.error('Error fetching user for hostel');
    } finally {
      setLoading(false);
    }
  }, [goToStayScreen, hostelGender]);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  const isProfileIncomplete = !form.gender || !form.collegeName || !form.name;
  const stayAmount = form.selectedDays.length * PRICE_PER_DAY;
  const messAmount = form.mess ? form.selectedDays.length * MESS_PRICE : 0;
  const totalAmount = stayAmount + messAmount;

  const isGenderMismatched = () => {
    if (!form.gender) return false;
    if (!hostelGender) return false;

    const hGen = String(hostelGender).toLowerCase();
    const uGen = form.gender.toLowerCase();

    if (hGen === 'male' && uGen !== 'male') return true;
    if (hGen === 'female' && uGen !== 'female') return true;

    return false;
  };

  const toggleDay = (day: string) => {
    setForm((prev) => {
      const selectedDays = prev.selectedDays.includes(day)
        ? prev.selectedDays.filter((d) => d !== day)
        : [...prev.selectedDays, day];
      return { ...prev, selectedDays };
    });
  };

  const handlePreCheck = () => {
    if (isGenderMismatched()) {
      showAlert('Access Denied', 'Gender mismatch with selected hostel.');
      return;
    }

    if (form.selectedDays.length === 0) {
      showAlert('Required', 'Please select at least one day for accommodation.');
      return;
    }

    if (!form.phone || form.phone.length < 10) {
      showAlert('Required', 'Please enter a valid WhatsApp number.');
      return;
    }

    setShowPaymentModal(true);
  };

  const startRazorpayPayment = () => {
    setShowPaymentModal(false);

    const options = {
      description: `Accommodation at ${hostelName} for ${form.selectedDays.length} days`,
      image: 'https://your-logo-url.com/logo.png',
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: totalAmount * 100,
      name: 'VERGE 2k26 Accommodation',
      prefill: {
        email: form.email,
        contact: form.phone,
        name: form.name,
      },
      theme: { color: THEME.accent },
    };

    setTimeout(() => {
      RazorpayCheckout.open(options)
        .then((data: any) => {
          handleFinalizeBooking(data.razorpay_payment_id);
        })
        .catch((error: any) => {
          if (error.code === 2) {
            showAlert('Payment Cancelled', 'The transaction was cancelled. No charges were made.');
          } else {
            showAlert(
              'Payment Failed',
              'The transaction could not be completed. Please try again or use a different payment method.'
            );
          }
        });
    }, 500);
  };

  const handleFinalizeBooking = async (paymentId: string) => {
    setSubmitting(true);
    try {
      const qrHash = `${form.mongoUserId}_${Date.now()}`;

      const payload = {
        userId: form.mongoUserId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        collegeName: form.collegeName,
        days: form.selectedDays,
        qrTokenHash: qrHash,
        hostelName: hostelName,
        hostelId: hostelId,
        mess: form.mess,
      };

      const response = await apiHelper.fetch(`${SERVER_URL}/api/accommodation/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitting(false);
        showAlert('Booking Confirmed', 'Your accommodation has been secured.', [
          { text: 'View Ticket', onPress: () => router.replace('/(Hostel)/BookedHostel' as any) },
        ]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save booking');
      }
    } catch (error: any) {
      setSubmitting(false);
      showAlert(
        'Sync Error',
        `Payment successful but booking failed: ${error.message}. Contact support with Payment ID: ${paymentId}`
      );
    }
  };

  const selectedDaysLabel = useMemo(() => {
    if (form.selectedDays.length === 0) return 'No days selected';
    if (form.selectedDays.length === 1) return '1 day selected';
    return `${form.selectedDays.length} days selected`;
  }, [form.selectedDays.length]);

  const ctaDisabled = submitting || !!isGenderMismatched() || form.selectedDays.length === 0;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[THEME.bg, '#0A0A0A', THEME.bg]} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={['top']} style={styles.container}>
        <VergeHeader title="REGISTRATION" onBack={goToStayScreen} />

        {loading ? (
          <VergeLoader message="LOADING..." />
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardWrap}>
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
            >
              {isProfileIncomplete ? (
                <View style={styles.errorCard}>
                  <Ionicons name="alert-circle" size={48} color={THEME.error} />
                  <Text style={styles.errorTitle}>PROFILE INCOMPLETE</Text>
                  <Text style={styles.errorDesc}>Complete your profile first to continue with hostel booking.</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/profile' as any)} style={styles.errorButton}>
                    <Text style={styles.errorButtonText}>COMPLETE PROFILE</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.heroPanel}>
                    <Text style={styles.overline}>ASSIGNED SECTOR</Text>
                    <Text style={styles.heroTitle}>{hostelName}</Text>
                    <View style={styles.heroMetaRow}>
                      <View style={styles.genderPill}>
                        <Ionicons name="shield-checkmark-outline" size={14} color={THEME.accent} />
                        <Text style={styles.genderPillText}>{String(hostelGender || 'Open').toUpperCase()}</Text>
                      </View>
                      <Text style={styles.heroAmount}>₹{totalAmount}</Text>
                    </View>
                  </View>

                  {isGenderMismatched() && (
                    <View style={styles.warningBanner}>
                      <Ionicons name="warning-outline" size={16} color={THEME.error} />
                      <Text style={styles.warningText}>Gender mismatch with selected hostel sector.</Text>
                    </View>
                  )}

                  <SectionHeader title="Candidate" subtitle="Auto-filled from profile" />
                  <View style={styles.inlineList}>
                    <InfoRow icon="person-outline" label="Name" value={form.name || 'UNSPECIFIED'} />
                    <InfoRow icon="male-female-outline" label="Gender" value={form.gender || 'UNSPECIFIED'} />
                    <InfoRow icon="school-outline" label="College" value={form.collegeName || 'UNSPECIFIED'} />
                    <InfoRow icon="mail-outline" label="Email" value={form.email || 'UNSPECIFIED'} />
                  </View>

                  <Divider />

                  <SectionHeader title="Stay Duration" subtitle={selectedDaysLabel} />
                  <View style={styles.daysWrap}>
                    {AVAILABLE_DAYS.map((day) => {
                      const isSelected = form.selectedDays.includes(day);
                      return (
                        <Pressable
                          key={day}
                          onPress={() => toggleDay(day)}
                          style={[styles.dayItem, isSelected && styles.dayItemActive]}
                        >
                          <View style={styles.dayLeft}>
                            <Ionicons
                              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                              size={20}
                              color={isSelected ? THEME.accent : THEME.textMuted}
                            />
                            <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>{day}</Text>
                          </View>
                          <Text style={styles.dayPrice}>₹{PRICE_PER_DAY + MESS_PRICE}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Divider />

                  <SectionHeader title="Communication" subtitle="WhatsApp number for updates" />
                  <View style={styles.inputRow}>
                    <Ionicons name="logo-whatsapp" size={18} color="#25D366" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      keyboardType="phone-pad"
                      placeholder="+91 00000 00000"
                      placeholderTextColor={THEME.textMuted}
                      value={form.phone}
                      onChangeText={(t) => setForm({ ...form, phone: t })}
                      selectionColor={THEME.accent}
                    />
                  </View>

                  <Pressable
                    onPress={() => setForm((prev) => ({ ...prev, mess: !prev.mess }))}
                    style={[styles.messRow, form.mess && styles.messRowActive]}
                  >
                    <View style={styles.dayLeft}>
                      <Ionicons
                        name={form.mess ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={form.mess ? THEME.accent : THEME.textMuted}
                      />
                      <View>
                        <Text style={[styles.dayText, form.mess && styles.dayTextActive]}>Include Mess</Text>
                        <Text style={styles.messHint}>₹{MESS_PRICE} per selected day</Text>
                      </View>
                    </View>
                    <Text style={styles.dayPrice}>{form.mess ? 'Selected' : 'Optional'}</Text>
                  </Pressable>

                  <View style={styles.totalStrip}>
                    <View style={styles.totalLeft}>
                      <Text style={styles.stripLabel}>Stay: ₹{stayAmount}</Text>
                      <Text style={styles.stripLabel}>Mess: ₹{messAmount}</Text>
                    </View>
                    <View>
                      <Text style={styles.stripTotalLabel}>TOTAL</Text>
                      <Text style={styles.stripTotalValue}>₹{totalAmount}</Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {!isProfileIncomplete && (
              <View style={styles.footer}>
                <TouchableOpacity
                  disabled={ctaDisabled}
                  onPress={handlePreCheck}
                  style={[styles.payButton, ctaDisabled && styles.payButtonDisabled]}
                >
                  <LinearGradient
                    colors={[THEME.accent, '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.payGradient}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <>
                        <Ionicons name="card-outline" size={20} color="#000" />
                        <Text style={styles.payText}>PROCEED TO PAY ₹{totalAmount}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

      <Modal visible={showPaymentModal} transparent animationType="slide" onRequestClose={() => setShowPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>PAYMENT SUMMARY</Text>

            <View style={styles.summaryBlock}>
              <SummaryRow label="Accommodation" value={String(hostelName)} />
              <SummaryRow label="Duration" value={`${form.selectedDays.length} days`} />
              <SummaryRow label="Stay Cost" value={`₹${stayAmount}`} />
              <SummaryRow label="Mess Fee" value={`₹${messAmount}`} />
              <View style={styles.modalDivider} />
              <SummaryRow label="Payable" value={`₹${totalAmount}`} highlight />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={startRazorpayPayment} style={styles.modalPrimaryButton}>
                <Text style={styles.modalPrimaryText}>PAY NOW</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={styles.modalSecondaryButton}>
                <Text style={styles.modalSecondaryText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <VergeAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionSubtitle}>{subtitle}</Text>
  </View>
);

const Divider = () => <View style={styles.sectionDivider} />;

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon} size={16} color={THEME.accent} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const SummaryRow = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <View style={styles.summaryRow}>
    <Text style={[styles.summaryLabel, highlight && styles.summaryLabelHighlight]}>{label}</Text>
    <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  container: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 124,
  },
  overline: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  heroPanel: {
    backgroundColor: THEME.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
  },
  heroTitle: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 12,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.35)',
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  genderPillText: {
    color: THEME.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroAmount: {
    color: THEME.success,
    fontSize: 20,
    fontWeight: '900',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 61, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  warningText: {
    color: '#FFAE9B',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  sectionSubtitle: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 16,
  },
  inlineList: {
    backgroundColor: THEME.panelSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoLabel: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '56%',
    textAlign: 'right',
  },
  daysWrap: {
    gap: 10,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.panelSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dayItemActive: {
    borderColor: THEME.accent,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dayText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '700',
  },
  dayTextActive: {
    color: THEME.accent,
  },
  dayPrice: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.panelSoft,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: THEME.text,
    fontWeight: '700',
    fontSize: 14,
  },
  messRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.panelSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  messRowActive: {
    borderColor: THEME.accent,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  messHint: {
    color: THEME.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  totalStrip: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 12,
  },
  totalLeft: {
    gap: 4,
  },
  stripLabel: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  stripTotalLabel: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'right',
  },
  stripTotalValue: {
    color: THEME.success,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  payButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payGradient: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  payText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  errorCard: {
    backgroundColor: 'rgba(255, 61, 0, 0.1)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.3)',
    alignItems: 'center',
    marginTop: 20,
  },
  errorTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 12,
    letterSpacing: 1,
  },
  errorDesc: {
    color: THEME.textMuted,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: THEME.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: THEME.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.borderLight,
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: 20,
  },
  modalTitle: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: 1,
  },
  summaryBlock: {
    backgroundColor: THEME.panelSoft,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 22,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryValue: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '900',
  },
  summaryLabelHighlight: {
    color: THEME.accent,
    fontSize: 13,
  },
  summaryValueHighlight: {
    color: THEME.accent,
    fontSize: 18,
  },
  modalDivider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 2,
  },
  modalActions: {
    gap: 10,
  },
  modalPrimaryButton: {
    backgroundColor: THEME.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalPrimaryText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  modalSecondaryButton: {
    backgroundColor: THEME.panelSoft,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  modalSecondaryText: {
    color: THEME.textMuted,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
});
