import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';

export default function Organisers() {
  const router = useRouter();

  const CommitteeCard = ({ name, role, department }: { name: string, role: string, department: string }) => (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Ionicons name="person-outline" size={24} color={THEME.colors.accent} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{name.toUpperCase()}</Text>
        <Text style={styles.role}>{role.toUpperCase()}</Text>
        <Text style={styles.department}>{department.toUpperCase()}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      <VergeHeader title="ORGANISERS" onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.introBox}>
          <Text style={styles.introText}>
            Verge 2k26 is hosted under the authority of the Organising Committee at <Text style={{ color: THEME.colors.text, fontWeight: '700' }}>SRM University, Delhi-NCR, Sonepat.</Text> Meet the visionaries leading the charge.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>FACULTY MENTORS</Text>
        <CommitteeCard 
          name="Dr. Sanjay Viswanathan" 
          role="Convenor // Verge 2k26" 
          department="Department of Computer Science"
        />
        <CommitteeCard 
          name="Prof. Anita Sharma" 
          role="Co-Convenor" 
          department="School of Management"
        />

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>STUDENT LEADS</Text>
        <CommitteeCard 
          name="Aaryan Malhotra" 
          role="Student Secretary" 
          department="Core Committee"
        />
        <CommitteeCard 
          name="Isha Kapoor" 
          role="Joint Secretary" 
          department="Events & Operations"
        />
        <CommitteeCard 
          name="Rohit Verma" 
          role="Technical Head" 
          department="Innovation Wing"
        />

        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>
            &quot;The VERGE Organising Committee is committed to fostering a culture of technical excellence and creative leadership.&quot;
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          SRM UNIVERSITY DELHI-NCR // 2k26
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.bg },
  content: { flex: 1, paddingVertical: 20, paddingHorizontal: 20, paddingTop: 24 },
  introBox: { marginBottom: 32 },
  introText: { color: THEME.colors.textMuted, fontSize: 13, lineHeight: 22, fontWeight: '500' },
  sectionLabel: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 4, marginBottom: 16, marginLeft: 4 },
  card: {
    backgroundColor: THEME.colors.cardBg, borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: THEME.colors.border, flexDirection: 'row',
    alignItems: 'center', marginBottom: 16,
  },
  iconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: THEME.colors.accentMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.colors.accentBorder },
  cardInfo: { marginLeft: 16, flex: 1 },
  name: { color: THEME.colors.text, fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  role: { color: THEME.colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  department: { color: THEME.colors.textMuted, fontSize: 8, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, backgroundColor: THEME.colors.border, width: '100%', marginVertical: 24 },
  quoteBox: { marginTop: 24, marginBottom: 40, padding: 24, backgroundColor: 'rgba(255,107,0,0.03)', borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,107,0,0.08)' },
  quoteText: { color: THEME.colors.textMuted, fontSize: 11, fontStyle: 'italic', textAlign: 'center', lineHeight: 18 },
  footer: { padding: 32, borderTopWidth: 1, borderTopColor: THEME.colors.border, alignItems: 'center' },
  footerText: { color: THEME.colors.borderLight, fontSize: 8, fontWeight: '700', letterSpacing: 5 }
});