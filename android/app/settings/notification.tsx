import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Linking, 
  Platform, 
  Switch,
  AppState,
  AppStateStatus,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';

export default function NotificationsScreen() {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(false);
  const appState = useRef(AppState.currentState);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setIsEnabled(status === 'granted');
  };

  useEffect(() => {
    checkPermission();
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkPermission();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  const openSystemSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
        { key: 'android.provider.extra.APP_PACKAGE', value: 'com.verge.converge' },
      ]);
    }
  };

  const ReasonRow = ({ icon, title, desc, color }: any) => (
    <View style={styles.reasonRow}>
      <View style={[styles.reasonIconBox, { backgroundColor: `${color || THEME.colors.accent}15` }]}>
        <Ionicons name={icon} size={20} color={color || THEME.colors.accent} />
      </View>
      <View style={styles.reasonTextContainer}>
        <Text style={[styles.reasonTitle, color ? { color } : null]}>{title}</Text>
        <Text style={styles.reasonDesc}>{desc}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      <VergeHeader title="ALERTS" onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionLabel}>NOTIFICATION PERMISSION</Text>
            <Text style={styles.permissionStatus}>
              {isEnabled ? "STATUS: ACTIVE" : "STATUS: DISABLED"}
            </Text>
          </View>
          <Switch
            trackColor={{ false: THEME.colors.border, true: THEME.colors.accent }}
            thumbColor={isEnabled ? '#ffffff' : '#475569'}
            ios_backgroundColor={THEME.colors.border}
            onValueChange={openSystemSettings}
            value={isEnabled}
          />
        </View>

        <View style={styles.reasonsSection}>
          <Text style={styles.sectionHeader}>WHY WE NEED ACCESS</Text>

          <ReasonRow 
            icon="flash-outline" 
            title="Instant & Live Updates" 
            desc="Get real-time news about the festival and events." 
          />
          <ReasonRow 
            icon="cart-outline" 
            title="Your Purchases" 
            desc="Get alerts for your orders and merch delivery." 
          />
          <ReasonRow 
            icon="bed-outline" 
            title="Your Bookings" 
            desc="Stay updated on your stay and room information." 
          />
          <ReasonRow 
            icon="calendar-outline" 
            title="Schedule Changes" 
            desc="Know instantly if an event is moved or cancelled." 
          />
          <ReasonRow 
            icon="shield-checkmark-outline" 
            title="Security Alerts" 
            desc="Important notices about your account and safety." 
            color={THEME.colors.danger}
          />
        </View>

        <TouchableOpacity 
          onPress={openSystemSettings}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={20} color={THEME.colors.accent} />
          <Text style={styles.settingsButtonText}>OPEN SYSTEM SETTINGS</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>VERGE 2k26</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.bg },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  permissionCard: {
    backgroundColor: THEME.colors.cardBg, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: THEME.colors.border, flexDirection: 'row',
    alignItems: 'center', marginBottom: 32,
  },
  permissionInfo: { flex: 1, paddingRight: 16 },
  permissionLabel: { color: THEME.colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  permissionStatus: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '700', marginTop: 4, letterSpacing: 1 },
  reasonsSection: { gap: 12 },
  sectionHeader: { color: THEME.colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 8, marginLeft: 4 },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: THEME.colors.cardBg, borderRadius: 20,
    borderWidth: 1, borderColor: THEME.colors.border,
  },
  reasonIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reasonTextContainer: { marginLeft: 16, flex: 1 },
  reasonTitle: { color: THEME.colors.text, fontSize: 14, fontWeight: '700' },
  reasonDesc: { color: THEME.colors.textMuted, fontSize: 11, marginTop: 2, fontWeight: '500' },
  settingsButton: {
    marginTop: 40, backgroundColor: THEME.colors.accentMuted,
    borderWidth: 1, borderColor: THEME.colors.accentBorder,
    padding: 18, borderRadius: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  settingsButtonText: { color: THEME.colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  footer: { marginTop: 60, paddingBottom: 40, alignItems: 'center' },
  footerLine: { height: 1, backgroundColor: THEME.colors.border, width: '100%', marginBottom: 16 },
  footerText: { color: THEME.colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 6 },
});