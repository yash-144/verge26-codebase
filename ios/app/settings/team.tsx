import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';
import { apiHelper } from '../../src/services/api';

const { width } = Dimensions.get('window');
const AVATAR_W = (width - 48) / 4; // 12px padding on each side (24) + 3 gaps of 8px (24) = 48
const AVATAR_H = AVATAR_W * 1.25;
const ARC_CARD_W = 110;
const ARC_CARD_H = 135;
const ARC_CONTAINER_H = 210;

/* ───────────────────── TYPES ───────────────────── */
interface TeamMember {
  id: string | number;
  name: string;
  role: string;
  subrole: string;
  image: string;
  quote?: string;
  about?: string;
}

type TeamCategory = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
};

const CATEGORY_STYLES: Array<{ match: RegExp; icon: keyof typeof Ionicons.glyphMap; accent: string }> = [
  { match: /ORGANI[ZS]ER/, icon: 'people-outline', accent: '#FF6B6B' },
  { match: /DEVELOPER|TECH/, icon: 'code-slash-outline', accent: '#4ECDC4' },
  { match: /CORE|MANAGER/, icon: 'star-outline', accent: '#FFE66D' },
  { match: /GRAPHIC|DESIGN/, icon: 'color-palette-outline', accent: '#A8E6CF' },
  { match: /SOCIAL|MEDIA|PR|MARKETING/, icon: 'megaphone-outline', accent: '#DDA0DD' },
];

const FALLBACK_STYLES: Array<{ icon: keyof typeof Ionicons.glyphMap; accent: string }> = [
  { icon: 'planet-outline', accent: '#82AAFF' },
  { icon: 'rocket-outline', accent: '#FFB86B' },
  { icon: 'sparkles-outline', accent: '#9BE7A2' },
  { icon: 'layers-outline', accent: '#C8A2FF' },
];

/* ═══════════ ARC CARD COMPONENT ═══════════ */
const ArcCard = React.memo(({ member, index, phase, total, onSelect }: {
  member: TeamMember; index: number; phase: Animated.SharedValue<number>; total: number;
  onSelect: (m: TeamMember) => void;
}) => {
  const animStyle = useAnimatedStyle(() => {
    // Calculate offset from center with wrapping
    let offset = index - phase.value;
    offset = ((offset % total) + total + total / 2) % total - total / 2;

    const absOff = Math.abs(offset);
    const visible = absOff <= 3;

    // Arc geometry
    const spreadAngle = 0.75; // radians between cards
    const angle = offset * spreadAngle;
    const arcRadius = width * 0.38;
    const arcDepth = 35;

    const tx = Math.sin(angle) * arcRadius;
    const ty = (1 - Math.cos(angle)) * arcDepth;
    const rot = offset * 10; // degrees tilt
    const sc = 1 - absOff * 0.12;

    // Smooth fade: full opacity at center, gradual fade to 0 at edge
    const fadeStart = 1.5; // start fading after this offset
    const opacity = visible
      ? absOff <= fadeStart ? 1 : Math.max(1 - (absOff - fadeStart) / (3 - fadeStart), 0)
      : 0;

    return {
      opacity,
      zIndex: visible ? Math.round((3 - absOff) * 10) : -1,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { rotate: `${rot}deg` },
        { scale: Math.max(sc, 0.55) },
      ],
    };
  });

  return (
    <Animated.View style={[s.arcCardAbsolute, animStyle]}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => onSelect(member)}>
        <View style={s.arcCard}>
          <Image source={{ uri: member.image }} style={s.arcCardImg} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={s.arcCardGrad} />
          <Text style={s.arcCardName} numberOfLines={1}>{member.name}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

/* ═══════════ ARC CAROUSEL CONTAINER ═══════════ */
const ArcCarousel = React.memo(({ organizers, onSelect }: {
  organizers: TeamMember[]; onSelect: (m: TeamMember) => void;
}) => {
  const N = organizers.length;
  const phase = useSharedValue(0);

  useEffect(() => {
    if (N <= 1) return;
    phase.value = 0;
    phase.value = withRepeat(
      withTiming(N, { duration: N * 3000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [N]);

  return (
    <View style={s.arcStage}>
      <View style={s.arcGlow} />
      {organizers.map((m, i) => (
        <ArcCard key={m.id} member={m} index={i} phase={phase} total={N} onSelect={onSelect} />
      ))}
    </View>
  );
});

/* ═══════════════════════════════════════════════ */
export default function TeamScreen() {
  const router = useRouter();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const getDirectImageUrl = (url: string) => {
    if (!url) return 'https://via.placeholder.com/150';
    if (url.includes('drive.google.com')) {
      const id = url.split('id=')[1] || url.split('/d/')[1]?.split('/')[0];
      return `https://drive.google.com/uc?export=view&id=${id}`;
    }
    return url;
  };

  const fetchTeam = async () => {
    try {
      const response = await apiHelper.fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/team`);
      const result = await response.json();
      if (result.status && result.data) {
        const mappedTeam: TeamMember[] = result.data.map((m: any) => ({
          id: m._id,
          name: m.name,
          role: String(m.role || 'TEAM').trim().toUpperCase(),
          subrole: String(m.role || 'Team')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          image: getDirectImageUrl(m.photo),
          quote: '',
          about: '',
        }));
        setTeam(mappedTeam);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, TeamCategory>();
    team.forEach((member, idx) => {
      const key = member.role;
      if (map.has(key)) return;

      const styled = CATEGORY_STYLES.find((s) => s.match.test(key));
      const fallback = FALLBACK_STYLES[idx % FALLBACK_STYLES.length];
      const icon = styled?.icon ?? fallback.icon;
      const accent = styled?.accent ?? fallback.accent;
      const label = key
        .toLowerCase()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      map.set(key, { key, label, icon, accent });
    });
    return map;
  }, [team]);

  const categories = useMemo(() => Array.from(categoryMap.values()), [categoryMap]);

  const groups = useMemo(() => {
    const g: Record<string, TeamMember[]> = {};
    categories.forEach((c) => {
      g[c.key] = team.filter((m) => m.role === c.key);
    });
    return g;
  }, [team, categories]);

  /* Separate organizers from other categories */
  const organizers = useMemo(() => {
    const orgCat = categories.find(c => /ORGANI[ZS]ER/.test(c.key));
    return orgCat ? groups[orgCat.key] || [] : [];
  }, [categories, groups]);

  const otherCategories = useMemo(() => {
    return categories.filter(c => !/ORGANI[ZS]ER/.test(c.key));
  }, [categories]);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={s.root}>
        <LinearGradient colors={[THEME.colors.bg, '#050508']} style={StyleSheet.absoluteFill} />
        <VergeHeader title="THE TEAM" onBack={() => router.back()} />
        <View style={s.loaderContainer}>
          <ActivityIndicator size="large" color={THEME.colors.accent} />
          <Text style={s.loaderText}>SYNCHRONIZING CREW DATA...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ═══════════════════ RENDER ════════════════════ */
  return (
    <SafeAreaView edges={['top']} style={s.root}>
      <LinearGradient colors={[THEME.colors.bg, '#050508']} style={StyleSheet.absoluteFill} />
      <VergeHeader title="THE TEAM" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* ════════════ ORGANIZERS ARC CAROUSEL ════════════ */}
        {organizers.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={s.sectionLabel}>MEET OUR ORGANISERS</Text>
            <Text style={s.sectionSub}>The minds behind the event</Text>
            <ArcCarousel organizers={organizers} onSelect={setSelectedMember} />
          </Animated.View>
        )}

        {/* ════════════ OTHER CATEGORIES ════════════ */}
        {otherCategories.map((cat, ci) => {
          const members = groups[cat.key];
          if (!members?.length) return null;

          return (
            <Animated.View
              key={cat.key}
              entering={FadeInDown.delay(300 + ci * 120).duration(400)}
              style={s.categorySection}
            >
              <View style={s.catHeader}>
                <View style={[s.catIconWrap, { backgroundColor: `${cat.accent}20` }]}>
                  <Ionicons name={cat.icon} size={16} color={cat.accent} />
                </View>
                <Text style={[s.catLabel, { color: cat.accent }]}>{cat.label}</Text>
                <Text style={s.catCount}>{members.length}</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.memberRow}
              >
                {members.map((m) => {
                  return (
                    <View key={m.id} style={s.memberItem}>
                      <View style={[s.memberAvatarWrap, { borderColor: `${cat.accent}30` }]}>
                        <Image source={{ uri: m.image }} style={s.memberAvatar} />
                      </View>
                      <Text style={s.memberName} numberOfLines={2}>{m.name}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </Animated.View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ════════════ DETAIL MODAL ════════════ */}
      <Modal
        visible={!!selectedMember}
        transparent
        animationType="none"
        onRequestClose={() => setSelectedMember(null)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setSelectedMember(null)}>
          {selectedMember && (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              style={s.modalSheet}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                {/* Handle bar */}
                <View style={s.modalHandle} />

                {/* Avatar + glow */}
                <View style={s.modalAvatarSection}>
                  <View style={s.modalGlow} />
                  <View style={s.modalAvatarBorder}>
                    <Image source={{ uri: selectedMember.image }} style={s.modalAvatar} />
                  </View>
                </View>

                {/* Info */}
                <Text style={s.modalName}>{selectedMember.name}</Text>
                <Text style={s.modalRole}>{selectedMember.subrole}</Text>

                {/* Close button */}
                <TouchableOpacity
                  onPress={() => setSelectedMember(null)}
                  style={s.modalClose}
                >
                  <Text style={s.modalCloseText}>CLOSE</Text>
                </TouchableOpacity>
              </Pressable>
            </Animated.View>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ═══════════════════ STYLES ═══════════════════ */
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loaderText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontFamily: THEME.fonts.primaryBold,
    letterSpacing: 1.5,
  },
  scrollContent: {
    paddingTop: 0,
  },

  /* ── Section Headers ── */
  sectionLabel: {
    fontSize: 13,
    fontFamily: THEME.fonts.primaryBold,
    color: '#FF6B6B',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 3,
  },
  sectionSub: {
    fontSize: 10,
    fontFamily: THEME.fonts.primary,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginBottom: 14,
    opacity: 0.6,
  },

  /* ── Arc Carousel ── */
  arcStage: {
    width: width,
    height: ARC_CONTAINER_H,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  arcGlow: {
    position: 'absolute',
    top: 5,
    width: width * 0.55,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#FF6B6B',
    opacity: 0.07,
  },
  arcCardAbsolute: {
    position: 'absolute',
    width: ARC_CARD_W,
    height: ARC_CARD_H,
  },
  arcCard: {
    width: ARC_CARD_W,
    height: ARC_CARD_H,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF6B6B40',
    overflow: 'hidden',
    backgroundColor: '#181818',
  },
  arcCardImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  arcCardGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
  },
  arcCardName: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    fontFamily: THEME.fonts.primaryBold,
    color: '#fff',
    letterSpacing: 0.5,
  },

  /* ── Category Sections ── */
  categorySection: {
    marginBottom: 20,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 8,
  },
  catIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontSize: 12,
    fontFamily: THEME.fonts.primaryBold,
    letterSpacing: 0.8,
    flex: 1,
  },
  catCount: {
    fontSize: 10,
    fontFamily: THEME.fonts.primary,
    color: THEME.colors.textMuted,
    opacity: 0.5,
  },
  memberRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  memberItem: {
    alignItems: 'center',
    width: AVATAR_W,
  },
  memberAvatarWrap: {
    width: AVATAR_W,
    height: AVATAR_H,
    borderRadius: 8,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  memberAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  memberName: {
    fontSize: 9,
    fontFamily: THEME.fonts.primaryBold,
    color: THEME.colors.text,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: AVATAR_W + 4,
  },
  memberRole: {
    fontSize: 7,
    fontFamily: THEME.fonts.primary,
    marginTop: 2,
    textAlign: 'center',
    maxWidth: AVATAR_W + 12,
    opacity: 0.7,
  },

  /* ── Detail Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalSheet: {
    backgroundColor: '#111111',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHandle: {
    display: 'none',
  },
  modalAvatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: THEME.colors.accent,
    opacity: 0.08,
    top: -10,
  },
  modalAvatarBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: `${THEME.colors.accent}60`,
    overflow: 'hidden',
    backgroundColor: '#181818',
  },
  modalAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalName: {
    fontSize: 18,
    fontFamily: THEME.fonts.primaryBold,
    color: THEME.colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalRole: {
    fontSize: 11,
    fontFamily: THEME.fonts.primaryBold,
    color: THEME.colors.accent,
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 22,
  },
  modalClose: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalCloseText: {
    fontSize: 11,
    fontFamily: THEME.fonts.primaryBold,
    color: THEME.colors.textMuted,
    letterSpacing: 2,
  },
});
