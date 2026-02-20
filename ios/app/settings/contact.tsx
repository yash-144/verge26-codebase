import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';

export default function ContactUs() {
  const router = useRouter();

  const handleEmail = () => {
    Linking.openURL('mailto:verge@srmuniversity.ac.in');
  };

  const ContactCard = ({ icon, title, value, onPress, color }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.contactCard}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color || '#3b82f6'}15`, borderColor: `${color || '#3b82f6'}30` }]}>
        <Ionicons name={icon} size={24} color={color || "#3b82f6"} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardSubTitle}>{title}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={THEME.colors.borderLight} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      <VergeHeader title="CONTACT" onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          Have a question or need assistance regarding Verge 2k26? Reach out to our team through any of the channels below.
        </Text>

        <ContactCard
          color={THEME.colors.accent} 
          icon="mail-outline"
          title="Official Email"
          value="verge@srmuniversity.ac.in"
          onPress={handleEmail}
        />

        <View style={styles.socialSection}>
          <Text style={styles.sectionTitle}>CONNECT WITH US</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://instagram.com/verge.srmuh')}
              style={styles.socialCard}
            >
              <Ionicons name="logo-instagram" size={28} color={THEME.colors.accent} />
              <Text style={styles.socialLabel}>Instagram</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://www.linkedin.com/company/verge-srmuh/')}
              style={styles.socialCard}
            >
              <Ionicons name="logo-linkedin" size={28} color={THEME.colors.accent} />
              <Text style={styles.socialLabel}>LinkedIn</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Our team usually responds to emails within 24-48 hours during the festival season. For immediate assistance, please use our official social channels.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  introText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 32,
    fontWeight: '500',
  },
  contactCard: {
    backgroundColor: THEME.colors.cardBg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardInfo: {
    marginLeft: 16,
    flex: 1,
  },
  cardSubTitle: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardValue: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  socialSection: {
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 16,
    marginLeft: 4,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialCard: {
    flex: 1,
    backgroundColor: THEME.colors.cardBg,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  noteBox: {
    marginTop: 40,
    padding: 20,
    backgroundColor: 'rgba(255, 107, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.08)',
    borderRadius: 24,
  },
  noteText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
});