import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';

export default function InfoScreen() {
  const router = useRouter();

  const InfoSection = ({ title, icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <View style={styles.infoSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color={THEME.colors.accent} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const TimeRow = ({ label, time }: { label: string, time: string }) => (
    <View style={styles.timeRow}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={styles.timeValue}>{time}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      <VergeHeader title="INFO" onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        <InfoSection title="Medical Center" icon="medkit-outline">
          <Text style={styles.subLabel}>WEEKDAY HOURS</Text>
          <TimeRow label="Morning" time="9:00 AM - 12:30 PM" />
          <TimeRow label="Evening" time="1:30 PM - 4:00 PM" />
          
          <Text style={[styles.subLabel, { marginTop: 16 }]}>SPECIALISTS</Text>
          <TimeRow label="Dentist (Sat)" time="4:00 PM - 7:00 PM" />
          <TimeRow label="ENT (Mon & Thu)" time="5:00 PM - 6:30 PM" />
          <TimeRow label="Homeopathic (Tue)" time="5:30 PM - 6:30 PM" />
        </InfoSection>
        
        <InfoSection title="Mess Timings" icon="restaurant-outline">
          <TimeRow label="Breakfast" time="8:00 AM - 9:30 AM" />
          <TimeRow label="Lunch" time="12:30 PM - 2:00 PM" />
          <TimeRow label="Snacks" time="5:00 PM - 6:00 PM" />
          <TimeRow label="Dinner" time="8:00 PM - 9:00 PM" />
        </InfoSection>

        <InfoSection title="Food Outlets" icon="fast-food-outline">
          <TimeRow label="Bunny's Kitchen" time="10:00 AM - 10:00 PM" />
          <TimeRow label="Cafe Ryana" time="10:00 AM - 10:00 PM" />
          <TimeRow label="Gags Cafe" time="9:00 AM - 4:30 PM" />
          <TimeRow label="Royal Cafe" time="9:00 AM - 4:30 PM" />
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              Note: Food stalls are functional throughout the Fest Timings
            </Text>
          </View>
        </InfoSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.bg },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  infoSection: {
    backgroundColor: THEME.colors.cardBg, borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: THEME.colors.border, marginBottom: 20,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: THEME.colors.accentMuted, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: THEME.colors.text, fontSize: 16, fontWeight: '700', marginLeft: 12 },
  subLabel: { color: THEME.colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: THEME.colors.border },
  timeLabel: { color: THEME.colors.textSecondary, fontSize: 13, fontWeight: '500' },
  timeValue: { color: THEME.colors.accent, fontSize: 13, fontWeight: '700' },
  noteBox: { marginTop: 12, backgroundColor: 'rgba(255,107,0,0.05)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,107,0,0.1)' },
  noteText: { color: THEME.colors.textMuted, fontSize: 11, lineHeight: 18 },
});