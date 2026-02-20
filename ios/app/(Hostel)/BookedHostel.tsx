import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/auth';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';
import QRCode from 'react-native-qrcode-svg';
import { apiHelper } from '../../src/services/api';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

interface Booking {
  verified: boolean;
  allottedRoomNumber?: string;
  days: number;
  paymentStatus: 'paid' | 'pending' | 'failed' | string;
  qrToken?: string;
  verifiedAt?: string;
  hostelName: string;
}

export default function BookedHostel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBooking = async () => {
    try {
      let backendUser = await authService.getUserSession();

      if (!backendUser) {
        setLoading(false);
        return;
      }

      let bid = backendUser?._id;
      
      // If _id is missing, try to fetch the profile by email to get the ID
      if (!bid && backendUser?.email) {
        try {
          const profileRes = await apiHelper.fetch(`${SERVER_URL}/api/users/get?email=${backendUser.email}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.data?._id) {
              bid = profileData.data._id;
            }
          }
        } catch (profileErr) {
          // Silent fail for recovery
        }
      }

      if (!bid) {
        setErrorMsg('User ID not found. Please complete your profile.');
        setLoading(false);
        return;
      }

      setErrorMsg(null);
      
      const response = await apiHelper.fetch(`${SERVER_URL}/api/accommodation/my?userId=${bid}`);

      const contentType = response.headers.get("content-type");
      if (response.ok && contentType?.includes("application/json")) {
        const result = await response.json();
        
        if (result.status && result.data) {
          if (Array.isArray(result.data)) {
            setBooking(result.data.length > 0 ? result.data[0] : null);
          } else {
            setBooking(result.data);
          }
        } else {
          setErrorMsg(result.message || "No deployment data found.");
          setBooking(null);
        }
      } else {
        const text = await response.text();
        try {
          const errJson = JSON.parse(text);
          setErrorMsg(errJson.message || "No deployment data found.");
        } catch {
          setErrorMsg("Uplink error.");
        }
        setBooking(null);
      }
    } catch (err) {
      setErrorMsg("Network offline.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchBooking();
    });
    return () => task.cancel();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooking();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={THEME.colors.accent} size="large" />
        <Text style={styles.loadingText}>LOADING...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />

      <VergeHeader title="DEPLOYMENT" onBack={() => router.back()} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.accent} progressBackgroundColor={THEME.colors.surface} />}
      >
        {booking ? (
          <View style={styles.briefingContainer}>
            {/* Status Bar */}
            <View style={styles.statusBanner}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: booking.verified ? THEME.colors.success : THEME.colors.danger }
              ]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>OPERATIONAL STATUS</Text>
                <Text style={[
                  styles.statusValue,
                  { color: booking.verified ? THEME.colors.success : THEME.colors.danger }
                ]}>
                  {booking.verified ? 'ACCESS VERIFIED' : 'PENDING CLEARANCE'}
                </Text>
              </View>
              <Ionicons
                name={booking.verified ? "shield-checkmark" : "warning"}
                size={24}
                color={booking.verified ? THEME.colors.success : THEME.colors.danger}
              />
            </View>

            {/* Main Info Card */}
            <View style={styles.mainCard}>
              <View style={styles.cardSection}>
                <Text style={styles.label}>DEPLOYMENT SECTOR</Text>
                <Text style={styles.hostelName}>{String(booking.hostelName || 'ASSIGNED SECTOR').toUpperCase()}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardSection}>
                <Text style={styles.label}>UNIT ASSIGNMENT</Text>
                <Text style={styles.roomNumber}>
                  {booking.allottedRoomNumber || 'PENDING ALLOTMENT'}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>DURATION</Text>
                  <Text style={styles.statValue}>{booking.days} DAYS</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>PAYMENT</Text>
                  <Text style={[
                    styles.statValue,
                    { color: booking.paymentStatus === 'paid' ? THEME.colors.success : THEME.colors.accent }
                  ]}>
                    {String(booking.paymentStatus || 'PENDING').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* QR Section */}
            <View style={styles.qrBriefing}>
              <Text style={styles.qrLabel}>IDENTITY TOKEN</Text>
              <Text style={styles.qrSubLabel}>Present for entry authorization</Text>

              <View style={styles.qrFrame}>
                <View style={styles.qrInnerFrame}>
                  {booking.qrToken ? (
                    <QRCode
                      value={booking.qrToken}
                      size={180}
                      backgroundColor="#FFF"
                      color="#000"
                    />
                  ) : (
                    <ActivityIndicator color={THEME.colors.accent} />
                  )}
                </View>
                {/* Corner Accents */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>

            {booking.verifiedAt && (
              <View style={styles.logFooter}>
                <Ionicons name="time-outline" size={12} color={THEME.colors.textMuted} />
                <Text style={styles.logText}>
                  LAST SYNC: {new Date(booking.verifiedAt).toLocaleString().toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.borderLight} />
            </View>
            <Text style={styles.emptyTitle}>NO DEPLOYMENT DATA</Text>
            <Text style={styles.emptyDesc}>
              {errorMsg || "You have no active accommodation assignments recorded in the system."}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/accommodation' as any)}
              style={styles.exploreButton}
            >
              <Text style={styles.exploreButtonText}>ACQUIRE QUARTERS</Text>
              <Ionicons name="arrow-forward" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  briefingContainer: {
    gap: 20,
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardBg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 16,
  },
  statusIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mainCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  cardSection: {
    padding: 20,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  hostelName: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.text,
    letterSpacing: 0.5,
  },
  roomNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.colors.accent,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  statItem: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.text,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: THEME.colors.border,
  },
  qrBriefing: {
    alignItems: 'center',
    backgroundColor: THEME.colors.cardBg,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  qrLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.text,
    letterSpacing: 2,
  },
  qrSubLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    marginTop: 4,
    marginBottom: 24,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  qrFrame: {
    padding: 12,
    position: 'relative',
  },
  qrInnerFrame: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: THEME.colors.accent,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  logFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  logText: {
    fontSize: 8,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 24,
  },
  emptyTitle: {
    color: THEME.colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyDesc: {
    color: THEME.colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: THEME.colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exploreButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
