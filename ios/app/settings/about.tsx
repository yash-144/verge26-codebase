import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';

export default function AboutUs() {
  const router = useRouter();

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

        <View style={styles.srmCard}>
          <Image
            source={require('../../assets/schedule-bg.png')}
            style={[StyleSheet.absoluteFill, styles.srmCardImage]}
            contentFit="cover"
            transition={500}
            cachePolicy="memory-disk"
          />
          <View style={styles.srmOverlay} />
          <View style={styles.srmContent}>
            <Text style={styles.sectionTitle}>ABOUT SRM</Text>
            <Text style={styles.srmText}>
              SRM University, Delhi-NCR is a premier educational institution committed to excellence in academics, innovation, and holistic development. Located in Sonepat, Haryana, the university is a hub of transformative learning, fostering leaders who shape the future.
            </Text>
            <Text style={styles.srmText}>
              As part of the esteemed SRM Group, which has over three decades of educational excellence, SRM University, Delhi-NCR is guided by a mission to provide world-class education and empower students with the skills, knowledge, and values needed to excel in a globalized world.
            </Text>
          </View>
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
  section: { marginBottom: 32 },
  srmCard: {
    minHeight: 280,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  srmCardImage: {
    transform: [{ scale: 1.14 }],
  },
  srmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  srmContent: {
    padding: 24,
  },
  sectionTitle: { color: THEME.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 24, letterSpacing: 1 },
  srmText: { color: THEME.colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 12 },
});
