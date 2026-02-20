import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Lock, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../src/store/useCartStore';
import { authService } from '../../src/services/auth';
import RazorpayCheckout from 'react-native-razorpay';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';
import { VergeAlert } from '../../src/components/VergeAlert';
import { apiHelper } from '../../src/services/api';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID!;

export default function Checkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cart, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });

  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      const user = await authService.getUserSession();
      setSessionUser(user);
      if (!user) {
        setInitialLoading(false);
        return;
      }

      let latestProfile = user;
      try {
        let response;
        if (user?._id) {
          response = await apiHelper.fetch(`${SERVER_URL}/api/users/get?id=${user._id}`, { silent: true });
        } else if (user?.email) {
          response = await apiHelper.fetch(`${SERVER_URL}/api/users/get?email=${user.email}`, { silent: true });
        }

        if (response?.ok) {
          const result = await response.json();
          latestProfile = result?.data || user;
        }
      } catch {
        // Best-effort profile hydration only
      }

      setProfileUser(latestProfile);
      setForm(prev => ({
        ...prev,
        name: latestProfile?.name || prev.name || '',
        phone: String(latestProfile?.phone || prev.phone || ''),
        address: latestProfile?.address || prev.address || '',
        city: latestProfile?.city || prev.city || '',
        pincode: String(latestProfile?.pincode || prev.pincode || ''),
      }));
      setInitialLoading(false);
    };
    init();
  }, []);

  const subtotal = cart?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
  const platformFee = cart?.length > 0 ? 20 : 0;
  const finalAmount = subtotal + platformFee;

  const getMissingProfileFields = (profile: any) => {
    const missing: string[] = [];
    const hasValue = (value: any) => String(value ?? '').trim().length > 0;
    const phone = String(profile?.phone ?? '').trim();
    const aadhaar = String(profile?.aadhaarNumber ?? '').trim();

    if (!hasValue(profile?.name)) missing.push('NAME');
    if (!/^[0-9]{10}$/.test(phone)) missing.push('PHONE');
    if (!hasValue(profile?.gender)) missing.push('GENDER');
    if (!hasValue(profile?.dob)) missing.push('DOB');
    if (!hasValue(profile?.collegeName)) missing.push('COLLEGE');
    if (!hasValue(profile?.studentId)) missing.push('STUDENT ID');
    if (!/^[0-9]{12}$/.test(aadhaar)) missing.push('AADHAAR NUMBER');
    if (!hasValue(profile?.aadhaarImage)) missing.push('AADHAAR IMAGE');
    if (!hasValue(profile?.studentIdImage)) missing.push('STUDENT ID IMAGE');

    return missing;
  };

  const missingFields = useMemo(() => {
    if (initialLoading) return [];
    return getMissingProfileFields(profileUser || sessionUser);
  }, [profileUser, sessionUser, initialLoading]);

  const isProfileIncomplete = missingFields.length > 0;

  const handlePlaceOrder = () => {
    if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
      showAlert('Required', 'Please fill in all shipping details.');
      return;
    }
    setShowPaymentModal(true);
  };

  const startRazorpayPayment = async () => {
    setShowPaymentModal(false);

    const userEmail = profileUser?.email || sessionUser?.email || '';

    const options = {
      description: 'VERGE 2k26 Official Merchandise',
      image: 'https://your-logo-url.com/logo.png',
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: Math.round(finalAmount * 100),
      name: 'VERGE 2k26',
      prefill: {
        email: userEmail,
        contact: form.phone,
        name: form.name
      },
      theme: { color: THEME.colors.accent }
    };

    setTimeout(() => {
      RazorpayCheckout.open(options).then((data: any) => {
        handleFinalizeOrder(data.razorpay_payment_id);
      }).catch((error: any) => {
        if (error.code === 2) {
          showAlert('Payment Cancelled', 'The transaction was cancelled. No charges were made.');
        } else {
          showAlert('Payment Failed', 'The transaction could not be completed. Please try again.');
        }
      });
    }, 500);
  };

  const handleFinalizeOrder = async (paymentId: string) => {
    setLoading(true);
    try {
      // Ensure we have a valid backend user with _id
      let user = sessionUser;
      if (!user?._id) {
        // Re-fetch from storage in case sync completed after page load
        user = await authService.getUserSession();
        if (user) setSessionUser(user);
      }
      if (!user?._id) {
        // Last resort: try syncing now
        const firebaseUser = authService.getSession();
        if (firebaseUser) {
          user = await authService.syncUserWithBackend(firebaseUser);
          if (user) setSessionUser(user);
        }
      }
      if (!user?._id) {
        throw new Error('Unable to verify your account. Please sign out and sign in again.');
      }

      const userEmail = profileUser?.email || sessionUser?.email || '';

      const orderPayload = {
        userId: user._id,
        items: cart.map((item: any) => ({
          productId: item._id,
          name: item.title,
          variant: {
            size: item.selectedSize || "Free Size",
            color: item.selectedColor || "Default",
            price: item.price
          },
          paddingHorizontal: 20,
          quantity: item.quantity
        })),
        customer: {
          name: form.name,
          email: userEmail,
          phone: form.phone,
          address: form.address,
          city: form.city,
          pincode: form.pincode
        },
        paymentId: paymentId,
        orderId: `ORD-${Date.now()}`,
        paymentStatus: "paid",
        orderStatus: "processing"
      };

      const response = await apiHelper.fetch(`${SERVER_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderPayload,
          shippingInfo: {
            pickupLocation: "Main Gate",
          }
        }),
      });

      const responseData = await response.json().catch(() => ({ message: "Invalid server response" }));

      if (response.ok) {
        clearCart();
        router.replace({
          pathname: '/MerchStore/order-status',
          params: {
            status: 'success',
            orderId: orderPayload.orderId,
            paymentId: paymentId
          }
        });
      } else {
        throw new Error(responseData.message || "Server verification failed");
      }
    } catch (error: any) {
      showAlert(
        'Sync Error',
        `Payment successful, but order creation failed: ${error.message}. Please contact support with Payment ID: ${paymentId}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <VergeHeader title="CHECKOUT" onBack={() => router.back()} />

        {initialLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={THEME.colors.accent} />
            <Text style={{ color: THEME.colors.textMuted, marginTop: 12, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>LOADING PROFILE...</Text>
          </View>
        ) : isProfileIncomplete ? (
          <ScrollView contentContainerStyle={styles.errorContainer}>
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={48} color={THEME.colors.danger} />
              <Text style={styles.errorTitle}>PROFILE INCOMPLETE</Text>
              <Text style={styles.errorDesc}>
                Complete your profile first to continue with merchandise checkout.
              </Text>
              <View style={styles.missingFieldsBox}>
                <Text style={styles.missingFieldsTitle}>REQUIRED FIELDS:</Text>
                {missingFields.map(field => (
                  <View key={field} style={styles.missingFieldRow}>
                    <Ionicons name="close-circle-outline" size={14} color={THEME.colors.danger} />
                    <Text style={styles.missingFieldText}>{field}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile' as any)}
                style={styles.errorButton}
              >
                <LinearGradient
                  colors={[THEME.colors.accent, '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.errorButtonGradient}
                >
                  <Text style={styles.errorButtonText}>COMPLETE PROFILE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scrollView}
              contentContainerStyle={{ paddingBottom: 160 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Review Items Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>REVIEW ITEMS</Text>
                <View style={styles.card}>
                  {cart?.map((item: any, index: number) => (
                    <View key={item._id} style={[styles.itemRow, index === 0 && { borderTopWidth: 0 }]}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.itemPrice}>x{item.quantity}  ₹{item.price * item.quantity}</Text>
                    </View>
                  ))}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL BILL</Text>
                    <Text style={styles.totalValue}>₹{finalAmount}</Text>
                  </View>
                </View>
              </View>

              {/* Shipping Details Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SHIPPING DETAILS</Text>
                <View style={styles.card}>
                  <TextInput
                    style={styles.input}
                    value={form.name}
                    onChangeText={(t) => setForm({ ...form, name: t })}
                    placeholder="NAME"
                    placeholderTextColor={THEME.colors.textMuted}
                  />
                  <TextInput
                    style={styles.input}
                    keyboardType="phone-pad"
                    value={form.phone}
                    onChangeText={(t) => setForm({ ...form, phone: t })}
                    placeholder="PHONE NUMBER"
                    placeholderTextColor={THEME.colors.textMuted}
                  />
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    multiline
                    numberOfLines={3}
                    value={form.address}
                    onChangeText={(t) => setForm({ ...form, address: t })}
                    placeholder="DETAILED ADDRESS"
                    placeholderTextColor={THEME.colors.textMuted}
                  />
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, { flex: 1, borderRightWidth: 1, borderBottomWidth: 0 }]}
                      value={form.city}
                      onChangeText={(t) => setForm({ ...form, city: t })}
                      placeholder="CITY"
                      placeholderTextColor={THEME.colors.textMuted}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
                      keyboardType="number-pad"
                      value={form.pincode}
                      onChangeText={(t) => setForm({ ...form, pincode: t })}
                      placeholder="PINCODE"
                      placeholderTextColor={THEME.colors.textMuted}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {!initialLoading && !isProfileIncomplete && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              disabled={loading || cart?.length === 0}
              onPress={handlePlaceOrder}
              style={({ pressed }) => [
                styles.payButton,
                (pressed || loading || cart?.length === 0) && styles.payButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={['#FF8C00', THEME.colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <View style={styles.payButtonContent}>
                    <Lock size={16} color="#000" strokeWidth={2.2} style={{ marginRight: 8 }} />
                    <Text style={styles.payButtonText}>PAY ₹{finalAmount}</Text>
                    <ArrowRight size={18} color="#000" strokeWidth={2.2} style={{ marginLeft: 8 }} />
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>PAYMENT SUMMARY</Text>
            <View style={styles.modalSummary}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>SUBTOTAL</Text>
                <Text style={styles.modalValue}>₹{subtotal}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>PLATFORM FEE</Text>
                <Text style={styles.modalValue}>₹{platformFee}</Text>
              </View>
              <View style={styles.modalDivider} />
              <View style={styles.modalRow}>
                <Text style={[styles.modalLabel, { color: THEME.colors.accent }]}>PAYABLE</Text>
                <Text style={[styles.modalValue, { color: THEME.colors.accent, fontSize: 20 }]}>₹{finalAmount}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={startRazorpayPayment} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>PROCEED TO GATEWAY</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <VergeAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  itemName: {
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    color: THEME.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  totalLabel: {
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalValue: {
    color: THEME.colors.accent,
    fontSize: 16,
    fontWeight: '900',
  },
  input: {
    padding: 16,
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  row: {
    flexDirection: 'row',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: THEME.colors.bg,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    zIndex: 20,
    elevation: 20,
  },
  payButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: THEME.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: THEME.colors.cardBg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.text,
    letterSpacing: 1,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalSummary: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalLabel: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalValue: {
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  modalDivider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 12,
  },
  modalButton: {
    backgroundColor: THEME.colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalClose: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loaderOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 5, 5, 0.95)',
  },
  loaderContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  errorContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  errorCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  errorTitle: {
    color: THEME.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 20,
    letterSpacing: 1,
    textAlign: 'center',
  },
  errorDesc: {
    color: THEME.colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
    fontWeight: '600',
  },
  missingFieldsBox: {
    width: '100%',
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  missingFieldsTitle: {
    color: THEME.colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  missingFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  missingFieldText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  errorButton: {
    marginTop: 32,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  errorButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
