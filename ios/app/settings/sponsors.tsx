import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';

export default function SponsorsScreen() {
  const router = useRouter();
  
  const sponsorTiers = [
    {
      tier: "Title Sponsor",
      size: "large",
      items: [
        { id: 1, name: "TechNova Systems", industry: "Cloud Infrastructure", color: "#3b82f6", brandImageUrl: "https://res.cloudinary.com/demo/image/upload/v1600000000/tech_nova_logo.png" }
      ]
    },
    {
      tier: "Platinum Sponsors",
      size: "medium",
      items: [
        { id: 2, name: "Aura Energy", industry: "Renewable Tech", color: "#10b981", brandImageUrl: "https://res.cloudinary.com/demo/image/upload/v1600000000/aura_energy_logo.png" },
        { id: 3, name: "Nexus Labs", industry: "AI Research", color: "#8b5cf6", brandImageUrl: "https://res.cloudinary.com/demo/image/upload/v1600000000/nexus_labs_logo.png" }
      ]
    },
    {
      tier: "Gold Sponsors",
      size: "small",
      items: [
        { id: 4, name: "Vertex Finance", industry: "FinTech", color: "#f59e0b", brandImageUrl: "https://res.cloudinary.com/demo/image/upload/v1600000000/vertex_finance_logo.png" },
        { id: 5, name: "Swift Logistics", industry: "Delivery", color: "#ef4444", brandImageUrl: "https://res.cloudinary.com/demo/image/upload/v1600000000/swift_logistics_logo.png" },
        { id: 6, name: "CodeBase", industry: "Education", color: "#06b6d4", brandImageUrl: "https://res.cloudinary.com/demo/image/upload/v1600000000/codebase_logo.png" }
      ]
    }
  ];

  const handleContactOutreach = () => {
    const email = 'verge@srmuniversity.ac.in';
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      <VergeHeader title="SPONSORS" onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          The success of Verge 2k26 is made possible by the generous support of our industry partners and sponsors.
        </Text>

        {sponsorTiers.map((tierGroup, index) => (
          <View key={index} style={styles.tierSection}>
            {/* Tier Title */}
            <View style={styles.tierTitleRow}>
              <View style={styles.tierLine} />
              <Text style={styles.tierTitleText}>
                {tierGroup.tier.toUpperCase()}
              </Text>
              <View style={styles.tierLine} />
            </View>

            {/* Sponsor Cards Grid */}
            <View style={styles.sponsorGrid}>
              {tierGroup.items.map((sponsor) => (
                <View 
                  key={sponsor.id} 
                  style={[
                    styles.sponsorCard,
                    { width: tierGroup.size === 'large' ? '100%' : tierGroup.size === 'medium' ? '48%' : '31%' }
                  ]}
                >
                  <View 
                    style={[styles.iconBox, { backgroundColor: `${sponsor.color}20`, borderColor: `${sponsor.color}40` }]}
                  >
                    <Image 
                      source={{ uri: sponsor.brandImageUrl }} 
                      style={styles.sponsorBrandImage} 
                      contentFit="contain"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  </View>
                  <Text style={styles.sponsorName} numberOfLines={1}>
                    {sponsor.name}
                  </Text>
                  <Text style={styles.sponsorIndustry}>
                    {sponsor.industry}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* CTA Section */}
        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.ctaContainer}
          onPress={handleContactOutreach}
        >
          <Ionicons name="rocket-outline" size={32} color={THEME.colors.accent} />
          <Text style={styles.ctaTitle}>Partner with us</Text>
          <Text style={styles.ctaDesc}>
            Want to showcase your brand to 10,000+ students?{"\n"}Join the Verge 2k26 network.
          </Text>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Contact Outreach</Text>
          </View>
        </TouchableOpacity>

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
    paddingTop: 20,
  },
  introText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 32,
    fontWeight: '500',
  },
  tierSection: {
    marginBottom: 40,
  },
  tierTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tierLine: {
    height: 1,
    flex: 1,
    backgroundColor: THEME.colors.border,
  },
  tierTitleText: {
    marginHorizontal: 16,
    color: THEME.colors.accent,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 2,
  },
  sponsorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sponsorCard: {
    marginBottom: 16,
    aspectRatio: 1,
    backgroundColor: THEME.colors.cardBg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  sponsorBrandImage: {
    width: '80%',
    height: '80%',
  },
  sponsorName: {
    color: THEME.colors.text,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 12,
  },
  sponsorIndustry: {
    color: THEME.colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  ctaContainer: {
    marginTop: 10,
    marginBottom: 40,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.1)',
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    color: THEME.colors.accent,
    fontWeight: '800',
    fontSize: 18,
    marginTop: 16,
  },
  ctaDesc: {
    color: THEME.colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
    fontWeight: '500',
  },
  ctaButton: {
    marginTop: 24,
    backgroundColor: THEME.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
  },
});