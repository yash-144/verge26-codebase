import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';

export default function AboutUs() {
  const router = useRouter();

  const ObjectiveItem = ({ title, desc, icon }: { title: string, desc: string, icon: any }) => (
    <View style={styles.objectiveItem}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={20} color={THEME.colors.accent} />
      </View>
      <View style={styles.objectiveText}>
        <Text style={styles.objectiveTitle}>{title}</Text>
        <Text style={styles.objectiveDesc}>{desc}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      <VergeHeader title="ABOUT" onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.introSection}>
          <Text style={styles.subHeader}>THE EXTRAVAGANZA</Text>
          <Text style={styles.mainTitle}>VERGE 2k26</Text>
          <Text style={styles.introText}>
            Verge 2k26 is the flagship annual festival of SRM University Delhi-NCR, designed to be a confluence of technological innovation, industry leadership, and creative expression. 
          </Text>
        </View>

        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>
            &quot;Building on the success of Verge 2025, which achieved a social media reach of 1M+, Verge 2k26 aims to set a new benchmark for university festivals in North India.&quot;
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KEY OBJECTIVES</Text>
          
          <ObjectiveItem 
            icon="bulb-outline"
            title="Innovation"
            desc="Provide a high-stakes platform for students to solve real-world problems through hackathons and ideathons."
          />
          <ObjectiveItem 
            icon="briefcase-outline"
            title="Industry Integration"
            desc="Bridge the gap between academia and industry via panel discussions, workshops, and startup expos."
          />
          <ObjectiveItem 
            icon="trending-up-outline"
            title="Holistic Growth"
            desc="Combine technical rigor with cultural vibrancy to foster teamwork and creativity."
          />
        </View>

        <View style={styles.experienceCard}>
          <Text style={styles.expTitle}>The Experience</Text>
          <Text style={styles.expDesc}>
            Experience two days of innovation, technology, and creativity with thrilling competitions, hands-on workshops, and inspiring talks from industry leaders.
          </Text>
          
          <View style={styles.tagRow}>
            {['Innovation Hub', 'Tech Workshops', 'Expert Talks', 'Networking Events'].map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.closingNote}>
          <Text style={styles.closingText}>
            Verge serves as a dynamic platform for students to exhibit their talents, engage with cutting-edge technology, and celebrate diverse cultural expressions at SRM University, Delhi-NCR, Sonepat.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.bg },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  introSection: { marginBottom: 32, alignItems: 'center' },
  subHeader: { color: THEME.colors.accent, fontWeight: '800', letterSpacing: 2, fontSize: 10, marginBottom: 8 },
  mainTitle: { color: THEME.colors.text, fontSize: 32, fontWeight: '900', marginBottom: 16 },
  introText: { color: THEME.colors.textSecondary, fontSize: 15, lineHeight: 24, textAlign: 'center' },
  quoteBox: { backgroundColor: THEME.colors.cardBg, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: THEME.colors.border, marginBottom: 32 },
  quoteText: { color: THEME.colors.textMuted, fontSize: 14, fontStyle: 'italic', lineHeight: 22, textAlign: 'center' },
  section: { marginBottom: 32 },
  sectionTitle: { color: THEME.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 24, letterSpacing: 1 },
  objectiveItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: THEME.colors.accentMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.colors.accentBorder },
  objectiveText: { marginLeft: 16, flex: 1 },
  objectiveTitle: { color: THEME.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  objectiveDesc: { color: THEME.colors.textMuted, fontSize: 13, lineHeight: 20 },
  experienceCard: { backgroundColor: THEME.colors.accent, borderRadius: 32, padding: 32, marginBottom: 32 },
  expTitle: { color: '#000', fontSize: 24, fontWeight: '900', marginBottom: 12 },
  expDesc: { color: 'rgba(0,0,0,0.7)', fontSize: 14, lineHeight: 22, marginBottom: 24, fontWeight: '500' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: { backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  tagText: { color: '#000', fontSize: 11, fontWeight: '700' },
  closingNote: { marginBottom: 40 },
  closingText: { color: THEME.colors.textMuted, fontSize: 12, lineHeight: 20, textAlign: 'center', fontWeight: '500' }
});