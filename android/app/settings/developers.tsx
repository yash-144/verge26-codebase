import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal, 
  Linking, 
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';

// --- TEAM DATA ---
const TEAM = [
  {
    id: 1,
    name: "Sanskar Bhadani",
    role: "App Developer",
    image: "https://via.placeholder.com/150", 
    quote: "Code is like humor. When you have to explain it, it’s bad.",
    about: "Full-stack mobile developer specializing in React Native and high-performance backend systems. Passionate about building seamless user experiences for Verge 2k26.",
    socials: {
      instagram: "https://instagram.com/sanskarbhadani08",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/"
    }
  },
  {
    id: 2,
    name: "Agrim",
    role: "Web Developer",
    image: "https://via.placeholder.com/150",
    quote: "First, solve the problem. Then, write the code.",
    about: "Expert in frontend architecture and reactive design. Handling the core web infrastructure and dashboard systems for the festival.",
    socials: {
      instagram: "https://instagram.com/",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/"
    }
  },
  {
    id: 3,
    name: "Anmol Sinha",
    role: "Developer",
    image: "https://via.placeholder.com/150",
    quote: "7+7=77",
    about: "Mobile developer passionate about building seamless user experiences for Verge 2k26. Dedicated to creating robust architectures that scale.",
    socials: {
      instagram: "https://instagram.com/sanskarbhadani08",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/"
    }
  }
];

export default function Developers() {
  const router = useRouter();
  const [selectedDev, setSelectedDev] = useState<typeof TEAM[0] | null>(null);

  const openLink = (url: string) => {
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <LinearGradient
        colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      <VergeHeader title="TEAM" onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {TEAM.map((dev) => (
          <TouchableOpacity 
            key={dev.id}
            onPress={() => setSelectedDev(dev)}
            activeOpacity={0.9}
            style={styles.devCard}
          >
            <Image source={{ uri: dev.image }} style={styles.devThumb} />

            <View style={styles.devInfo}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{dev.role.toUpperCase()}</Text>
              </View>
              <Text style={styles.devName}>{dev.name.toUpperCase()}</Text>

              <View style={styles.socialRow}>
                <TouchableOpacity onPress={() => openLink(dev.socials.instagram)}>
                  <Ionicons name="logo-instagram" size={18} color={THEME.colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openLink(dev.socials.linkedin)}>
                  <Ionicons name="logo-linkedin" size={18} color={THEME.colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openLink(dev.socials.github)}>
                  <Ionicons name="logo-github" size={18} color={THEME.colors.accent} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={!!selectedDev}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDev(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setSelectedDev(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="chevron-down" size={28} color={THEME.colors.accent} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.profileHeader}>
                <Image source={{ uri: selectedDev?.image }} style={styles.largeAvatar} />
                
                <View style={styles.profileMeta}>
                  <View style={[styles.roleBadge, { marginBottom: 8 }]}>
                    <Text style={styles.roleText}>{selectedDev?.role.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.largeName}>{selectedDev?.name.toUpperCase()}</Text>
                  
                  <View style={styles.socialRowLarge}>
                    <TouchableOpacity onPress={() => openLink(selectedDev?.socials.instagram || '')}>
                      <Ionicons name="logo-instagram" size={22} color={THEME.colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLink(selectedDev?.socials.linkedin || '')}>
                      <Ionicons name="logo-linkedin" size={22} color={THEME.colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openLink(selectedDev?.socials.github || '')}>
                      <Ionicons name="logo-github" size={22} color={THEME.colors.accent} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.quoteBox}>
                <Text style={styles.quoteText}>&quot;{selectedDev?.quote}&quot;</Text>
              </View>

              <View style={styles.modalDivider} />

              <View style={styles.bioSection}>
                <Text style={styles.bioLabel}>BIOGRAPHY // PROFILE</Text>
                <Text style={styles.bioText}>{selectedDev?.about}</Text>
              </View>

              <View style={styles.modalFooter}>
                <Text style={styles.footerBrand}>VERGE 2k26</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.bg },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  devCard: {
    flexDirection: 'row', backgroundColor: THEME.colors.cardBg, borderWidth: 1,
    borderColor: THEME.colors.border, borderRadius: 24, paddingHorizontal: 20, padding: 20, marginBottom: 16,
  },
  devThumb: { width: 80, height: 80, borderRadius: 16, backgroundColor: THEME.colors.surface },
  devInfo: { marginLeft: 16, flex: 1, justifyContent: 'center' },
  roleBadge: { backgroundColor: THEME.colors.accent, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 },
  roleText: { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  devName: { color: THEME.colors.text, fontSize: 18, fontWeight: '900', letterSpacing: 0.5, marginBottom: 12 },
  socialRow: { flexDirection: 'row', gap: 20 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.9)' },
  modalContent: { backgroundColor: THEME.colors.bg, height: '90%', borderRadius: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,107,0,0.2)', overflow: 'hidden' },
  modalHeader: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  closeBtn: { width: 56, height: 56, borderRadius: 20, backgroundColor: THEME.colors.cardBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.colors.border },
  modalScroll: { flex: 1, paddingHorizontal: 32, paddingTop: 20 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  largeAvatar: { width: 120, height: 120, borderRadius: 32, backgroundColor: THEME.colors.surface, borderWidth: 2, borderColor: THEME.colors.border },
  profileMeta: { marginLeft: 24, flex: 1 },
  largeName: { color: THEME.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 16 },
  socialRowLarge: { flexDirection: 'row', gap: 24 },
  quoteBox: { paddingHorizontal: 16, marginBottom: 32 },
  quoteText: { color: THEME.colors.accent, textAlign: 'center', fontSize: 20, fontStyle: 'italic', opacity: 0.8 },
  modalDivider: { height: 1, backgroundColor: THEME.colors.border, width: '100%', marginBottom: 32 },
  bioSection: { marginBottom: 48 },
  bioLabel: { color: THEME.colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 4, marginBottom: 16 },
  bioText: { color: THEME.colors.textSecondary, fontSize: 15, lineHeight: 26, textAlign: 'justify' },
  modalFooter: { alignItems: 'center', marginBottom: 40, opacity: 0.2 },
  footerBrand: { color: THEME.colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 6 }
});