import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';

export default function LegalScreen() {
  const router = useRouter();
  const [modalType, setModalType] = useState<'none' | 'legal' | 'privacy'>('none');

  const LegalContent = () => (
    <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.legalTitle}>Intellectual Property, Usage Restrictions & Legal Notice</Text>
      <Text style={styles.legalText}>
        This application, including but not limited to its software architecture, source code, user interface, design elements, logos, content, databases, backend services, documentation, and all related digital assets (collectively referred to as “the Application”), is the exclusive intellectual property of the VERGE Organising Committee and the VERGE App Development Team, SRM University, Delhi-NCR, Sonepat. {"\n"}{"\n"}
        All rights, title, and interest in and to the Application are fully reserved. The Application is provided solely for authorized use in connection with VERGE and its associated events.
      </Text>

      <Text style={styles.legalTitle}>Prohibited Activities</Text>
      <Text style={styles.legalText}>
        Users and third parties are strictly prohibited from engaging in any of the following activities, whether directly or indirectly:{"\n"}{"\n"}
        • Unauthorized access to the Application, its servers, APIs, databases, or internal systems{"\n"}
        • Copying, reproducing, modifying, distributing, publishing, sublicensing, or selling any part of the Application{"\n"}
        • Reverse engineering, decompiling, disassembling, or attempting to derive the source code or underlying structure of the Application{"\n"}
        • Tampering with security mechanisms, authentication flows, payment systems, or notification services{"\n"}
        • Creating derivative works or unauthorized versions of the Application{"\n"}
        • Using the Application for any unlawful, malicious, or non-approved purpose
      </Text>

      <Text style={styles.legalTitle}>Security & Monitoring</Text>
      <Text style={styles.legalText}>
        The VERGE Organising Committee reserves the right to monitor usage of the Application to ensure compliance with these terms. Any suspicious activity, security breach attempt, or misuse may result in immediate restriction or termination of access without prior notice.
      </Text>

      <Text style={styles.legalTitle}>Disciplinary & Legal Consequences</Text>
      <Text style={styles.legalText}>
        Any violation of this notice or misuse of the Application may lead to:{"\n"}{"\n"}
        • Disciplinary action under the rules, regulations, and code of conduct of SRM University, Delhi-NCR, Sonepat{"\n"}
        • Suspension or permanent revocation of access to the Application{"\n"}
        • Legal action under applicable Indian laws, including but not limited to provisions of the Information Technology Act, 2000, Indian Copyright Act, the Indian Penal Code, and other relevant cyber laws and regulations{"\n"}{"\n"}
        The Organising Committee reserves the right to initiate civil or criminal proceedings where deemed necessary.
      </Text>

      <Text style={styles.legalTitle}>No License Granted</Text>
      <Text style={styles.legalText}>
        Nothing contained in this Application or these terms shall be construed as granting any license or right, express or implied, to use, copy, or exploit any part of the Application except as explicitly permitted for personal, non-commercial use related to VERGE.
      </Text>

      <Text style={styles.legalTitle}>Governing Authority</Text>
      <Text style={[styles.legalText, { marginBottom: 40 }]}>
        This Application is operated under the authority of VERGE Organising Committee and the VERGE Development Team SRM University, Delhi-NCR, Sonepat, and any disputes arising from its use shall be subject to the jurisdiction of the competent courts as determined by applicable university policies and Indian law.
      </Text>
    </ScrollView>
  );

  const PrivacyContent = () => (
    <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.legalTitleLarge}>Privacy Policy</Text>
      <Text style={styles.legalText}>
        This Privacy Policy describes how the VERGE Tech Fest App (“the App”) collects, uses, stores, and protects user information. The App is officially operated by the VERGE Organising Committee, SRM University, Delhi-NCR, Sonepat.{"\n"}{"\n"}
        By using this App, you agree to the collection and use of information in accordance with this Privacy Policy.
      </Text>

      <Text style={styles.legalSubTitle}>1. Information We Collect</Text>
      <Text style={styles.legalText}>
        We collect only the information necessary to provide core app functionality.{"\n"}{"\n"}
        <Text style={{ fontWeight: 'bold', color: THEME.colors.text }}>a) Personal Information</Text>{"\n"}
        Name and email address obtained through Email Verification. Profile information required for event participation, bookings, and purchases.{"\n"}{"\n"}
        <Text style={{ fontWeight: 'bold', color: THEME.colors.text }}>b) Transaction Information</Text>{"\n"}
        Hostel booking details, Merchandise order details, Payment status and order history. (Payment processing is handled by authorized third-party payment gateways. The App does not store card or UPI credentials.){"\n"}{"\n"}
        <Text style={{ fontWeight: 'bold', color: THEME.colors.text }}>c) Usage & Technical Data</Text>{"\n"}
        Device information (such as OS version). Notification tokens for sending updates and alerts.
      </Text>

      <Text style={styles.legalSubTitle}>2. How We Use Your Information</Text>
      <Text style={styles.legalText}>
        Collected information is used strictly for: user authentication, event registration, hostel/merchandise fulfillment, sending important announcements, improving app performance, and resolving support queries. We do not use user data for advertising or commercial profiling.
      </Text>

      <Text style={styles.legalSubTitle}>3. Data Sharing & Disclosure</Text>
      <Text style={styles.legalText}>
        User data is not sold or rented. Information may be shared only with authorized organizers, trusted third-party services (auth, payments, analytics), or when required by law.
      </Text>

      <Text style={styles.legalSubTitle}>4. Data Storage & Security</Text>
      <Text style={styles.legalText}>
        Reasonable safeguards are implemented to protect user data against unauthorized access. Access is restricted to authorized personnel only.
      </Text>

      <Text style={styles.legalSubTitle}>5. Data Retention</Text>
      <Text style={styles.legalText}>
        User data is retained only as long as necessary to conduct events, fulfill transactions, or meet legal requirements.
      </Text>

      <Text style={styles.legalSubTitle}>7. Notifications</Text>
      <Text style={styles.legalText}>
        The App sends event updates, schedule changes, and emergency alerts. Users may manage permissions in device settings.
      </Text>

      <Text style={styles.legalSubTitle}>8. Children’s Privacy</Text>
      <Text style={styles.legalText}>
        The App is intended for students and does not knowingly collect data from children.
      </Text>

      <Text style={styles.legalSubTitle}>9. Changes to This Policy</Text>
      <Text style={styles.legalText}>
        This policy may be updated. Continued use indicates acceptance of revised terms.
      </Text>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Contact Us</Text>
        <Text style={styles.contactInfo}>Email: verge@srmuniversity.ac.in</Text>
        <Text style={styles.contactInfo}>Organising Committee: VERGE, SRM University, Delhi-NCR, Sonepat</Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      <VergeHeader title="LEGAL" onBack={() => router.back()} />

      <View style={styles.mainContent}>
        <View style={styles.selectorCard}>
          <Ionicons name="shield-checkmark" size={48} color={THEME.colors.accent} style={styles.shieldIcon} />
          <Text style={styles.selectorIntro}>Please review our official protocols.</Text>

          <TouchableOpacity onPress={() => setModalType('legal')} style={styles.selectorBtn}>
            <Text style={styles.selectorBtnText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={THEME.colors.accent} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalType('privacy')} style={styles.selectorBtn}>
            <Text style={styles.selectorBtnText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={THEME.colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={modalType !== 'none'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setModalType('none')}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>
              {modalType === 'legal' ? 'TERMS OF SERVICE' : 'PRIVACY POLICY'}
            </Text>
            <TouchableOpacity onPress={() => setModalType('none')}>
              <Ionicons name="close-circle" size={32} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            {modalType === 'legal' ? <LegalContent /> : <PrivacyContent />}
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={() => setModalType('none')} style={styles.agreeBtn}>
              <Text style={styles.agreeBtnText}>I Have Read & Understood</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.bg },
  mainContent: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  selectorCard: { backgroundColor: THEME.colors.cardBg, padding: 32, borderRadius: 40, borderWidth: 1, borderColor: THEME.colors.border },
  shieldIcon: { alignSelf: 'center', marginBottom: 20 },
  selectorIntro: { color: THEME.colors.textMuted, textAlign: 'center', marginBottom: 32, fontWeight: '500' },
  selectorBtn: { backgroundColor: THEME.colors.surface, padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  selectorBtnText: { color: THEME.colors.text, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: THEME.colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: THEME.colors.border },
  modalHeaderText: { color: THEME.colors.text, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  modalScroll: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  legalTitle: { color: THEME.colors.text, fontSize: 16, fontWeight: '800', marginBottom: 16, marginTop: 12 },
  legalTitleLarge: { color: THEME.colors.text, fontSize: 24, fontWeight: '900', marginBottom: 20 },
  legalSubTitle: { color: THEME.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8, marginTop: 24 },
  legalText: { color: THEME.colors.textMuted, fontSize: 13, lineHeight: 22, marginBottom: 24 },
  contactCard: { padding: 20, backgroundColor: THEME.colors.cardBg, borderWidth: 1, borderColor: THEME.colors.border, borderRadius: 16, marginBottom: 40 },
  contactTitle: { color: THEME.colors.text, fontWeight: '700', marginBottom: 8 },
  contactInfo: { color: THEME.colors.textMuted, fontSize: 11, marginBottom: 4 },
  modalFooter: { padding: 24, borderTopWidth: 1, borderTopColor: THEME.colors.border },
  agreeBtn: { backgroundColor: THEME.colors.accent, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  agreeBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});