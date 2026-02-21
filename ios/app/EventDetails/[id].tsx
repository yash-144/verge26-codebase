import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  Linking,
  StyleSheet,
  Share,
  TouchableOpacity
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  withSequence,
} from 'react-native-reanimated';
import { useSavedStore } from '@/store/useSavedStore';
import { useClubStore } from '@/store/useClubStore';
import { THEME } from '@/constants/Theme';
import { VergeHeader } from '@/components/VergeHeader';
import { VergeLoader } from '@/components/VergeLoader';
import { apiHelper } from '@/services/api';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

interface Club {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  coordinatorName?: string;
  coordinatorMobile?: string;
}

interface Event {
  _id: string;
  title: string;
  description?: string;
  category: string;
  venue: string;
  date: string;
  time: string;
  maxParticipants: number;
  registrationFee: number;
  requiresTeam: boolean;
  status: string;
  unstopLink?: string;
  club?: string | Club | null;
  eventImageURL?: string;
}

// ─── Info Row ─────────────────────────────────────────────────────────
const InfoRow = memo(({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Ionicons name={icon} size={16} color={THEME.colors.accent} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
));

// ─── Section Header ──────────────────────────────────────────────────
const SectionHeader = memo(({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionAccent} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
));

export default function EventDetails() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  const isSaved = useSavedStore(useCallback((s) => s.savedIds.includes(id as string), [id]));
  const toggleSave = useSavedStore((s) => s.toggleSave);
  const getCachedClub = useClubStore((s) => s.getClub);

  const scrollY = useSharedValue(0);
  const bookmarkScale = useSharedValue(1);
  const pageOpacity = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { 'worklet'; scrollY.value = e.contentOffset.y; },
  });

  const heroScale = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { scale: interpolate(scrollY.value, [-100, 0], [1.1, 1], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(scrollY.value, [0, 200], [1, 0.3], Extrapolation.CLAMP),
    };
  });

  const bookmarkAnimStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: bookmarkScale.value }] };
  });

  const pageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
  }));

  const fetchClubDetails = async (clubId: string) => {
    // 1. Check Cache
    const cached = getCachedClub(clubId);
    if (cached) {
      setClub(cached);
      return;
    }

    // 2. Fallback to API
    try {
      const response = await apiHelper.fetch(`${SERVER_URL}/api/clubs/${clubId}`);
      const json = await response.json();
      if (json.status === true && json.data) {
        setClub(json.data);
      }
    } catch {
      // Silent fail
    }
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await apiHelper.fetch(`${SERVER_URL}/api/events/${id}`);
        const json = await response.json();
        if (json.status === true && json.data) {
          setEvent(json.data);
          if (json.data.club) {
            if (typeof json.data.club === 'object') {
              setClub(json.data.club);
            } else {
              fetchClubDetails(json.data.club);
            }
          }
        }
      } catch {
        if (__DEV__) console.error('Error fetching event details');
      } finally {
        setLoading(false);
        pageOpacity.value = withTiming(1, { duration: 400 });
      }
    };
    fetchEventDetails();
  }, [id]);

  const handleRegister = useCallback(async () => {
    const unstopUrl = event?.unstopLink || 'https://unstop.com/';
    await Linking.openURL(unstopUrl);
  }, [event]);

  const handleSave = useCallback(() => {
    bookmarkScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 }),
    );
    toggleSave(id as string);
  }, [id, toggleSave]);

  const handleShare = useCallback(async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `Check out "${event.title}" at Verge!\n${event.unstopLink || ''}`,
      });
    } catch { }
  }, [event]);

  if (loading) return (
    <View style={styles.container}>
      <VergeLoader message="LOADING..." />
    </View>
  );
  if (!event) return null;

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'tech': return '#3B82F6';
      case 'non-tech': return '#A855F7';
      case 'workshop': return '#10B981';
      default: return THEME.colors.accent;
    }
  };

  const catColor = event ? getCategoryColor(event.category) : THEME.colors.accent;
  const formattedDate = event ? new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : '';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <VergeHeader
          title="EVENT"
          rightElement={
            <View style={styles.topBarActions}>
              <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                <Ionicons name="share-outline" size={18} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.iconBtn, isSaved && styles.iconBtnActive]}
              >
                <Animated.View style={bookmarkAnimStyle}>
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color={isSaved ? THEME.colors.accent : THEME.colors.textSecondary}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
          }
        />

        {loading ? (
          <VergeLoader message="LOADING..." />
        ) : !event ? null : (
          <Animated.View style={[{ flex: 1 }, pageAnimatedStyle]}>
            <Animated.ScrollView
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              removeClippedSubviews={true}
            >
              {/* ─── Hero Section ─────────────────────────────────── */}
              <Animated.View style={heroScale}>
                <View style={styles.heroSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
                    <Text style={[styles.heroTitle, { flex: 1, marginBottom: 0 }]}>{event.title}</Text>
                    {event.eventImageURL && (
                      <Image
                        source={{ uri: event.eventImageURL }}
                        style={styles.eventImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                    )}
                  </View>
                  <View style={[styles.categoryPill, { backgroundColor: catColor + '14', borderColor: catColor + '30' }]}>
                    <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
                    <Text style={[styles.categoryText, { color: catColor }]}>
                      {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* ─── Details Section ──────────────────────────────── */}
              <SectionHeader title="Event Details" />

              <View style={styles.infoList}>
                <InfoRow icon="calendar-outline" label="Date & Time" value={`${formattedDate}, ${event.time}`} />
                <InfoRow icon="location-outline" label="Venue" value={event.venue} />
                <InfoRow
                  icon="people-outline"
                  label="Participation"
                  value={event.requiresTeam ? `Team - ${event.maxParticipants} Participants` : `Individual (${event.maxParticipants})`}
                />
              </View>

              {/* ─── About Section ────────────────────────────────── */}
              <SectionHeader title="Description" />

              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>
                  {event.description || 'No description available for this event yet. Stay tuned for updates!'}
                </Text>
              </View>

              {/* ─── Organized By ─────────────────────────────────── */}
              {club && (
                <>
                  <SectionHeader title="Organized By" />
                  <View style={[styles.clubCard, { flexDirection: 'column', alignItems: 'flex-start', gap: 14 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={styles.clubAvatar}>
                        <Text style={styles.clubAvatarText}>
                          {club.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.clubName, { fontSize: 18, fontWeight: '800', color: THEME.colors.accent }]}>{club.name}</Text>
                    </View>
                    {club.description && (
                      <Text style={[styles.clubDesc, { color: THEME.colors.text, fontSize: 14, fontWeight: '500', lineHeight: 22, marginTop: 2 }]}>
                        {club.description}
                      </Text>
                    )}
                    {(club.coordinatorName || club.coordinatorMobile) && (
                      <View style={{ marginTop: 8, width: '100%' }}>
                        <Text style={{ color: THEME.colors.accent, fontWeight: '700', fontSize: 13, marginBottom: 6 }}>Coordinator</Text>
                        <View style={{ gap: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                            {club.coordinatorName && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                <Ionicons name="person-circle-outline" size={16} color={THEME.colors.textSecondary} />
                                <Text style={{ color: THEME.colors.textSecondary, fontWeight: '600', fontSize: 13 }}>{club.coordinatorName}</Text>
                              </View>
                            )}
                            {club.coordinatorMobile && (
                              <TouchableOpacity
                                onPress={() => Linking.openURL(`tel:${club.coordinatorMobile}`)}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                              >
                                <Ionicons name="call-outline" size={15} color={THEME.colors.textMuted} />
                                <Text style={{ color: THEME.colors.textMuted, fontWeight: '500', fontSize: 13 }}>{club.coordinatorMobile}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </>
              )}

              <View style={{ height: 100 }} />
            </Animated.ScrollView>

            {/* ─── Register CTA ────────────────────────────────────── */}
            <View style={styles.ctaContainer}>
              <LinearGradient
                colors={['rgba(5,5,5,0)', 'rgba(5,5,5,0.9)', 'rgba(5,5,5,1)']}
                style={styles.ctaGradient}
              />
              <View style={styles.ctaContent}>
                <View style={styles.ctaPriceWrap}>
                  <Text style={styles.ctaPriceLabel}>
                    {event.registrationFee > 0 ? 'Fee' : 'Entry'}
                  </Text>
                  <Text style={styles.ctaPriceValue}>
                    {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleRegister}
                  style={styles.ctaButton}
                >
                  <LinearGradient
                    colors={['#FF8C00', THEME.colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradientBtn}
                  >
                    <Text style={styles.ctaButtonText}>Register Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="#000" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.bg },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  iconBtnActive: {
    backgroundColor: THEME.colors.accentMuted,
    borderColor: THEME.colors.accentBorder
  },
  heroSection: { paddingTop: 8, paddingBottom: 28 },
  heroTitle: { color: THEME.colors.text, fontSize: 30, fontFamily: THEME.fonts.primaryBold, lineHeight: 38, letterSpacing: -0.3, marginBottom: 14 },
  eventImage: { width: 80, height: 80 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 6, marginBottom: 14 },
  categoryDot: { width: 5, height: 5, borderRadius: 3 },
  categoryText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionAccent: { width: 3, height: 16, borderRadius: 2, backgroundColor: THEME.colors.accent },
  sectionTitle: { color: THEME.colors.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  infoList: { backgroundColor: THEME.colors.cardBg, borderWidth: 1, borderColor: THEME.colors.border, borderRadius: 14, overflow: 'hidden', marginBottom: 32 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: THEME.colors.border, gap: 12 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255, 107, 0, 0.08)', alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1, gap: 1 },
  infoLabel: { color: THEME.colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  infoValue: { color: THEME.colors.text, fontSize: 14, fontWeight: '600' },
  descriptionCard: { backgroundColor: THEME.colors.cardBg, borderWidth: 1, borderColor: THEME.colors.border, borderRadius: 14, padding: 18, marginBottom: 32 },
  descriptionText: { color: THEME.colors.textSecondary, fontSize: 14, lineHeight: 24, fontWeight: '400' },
  clubCard: { backgroundColor: THEME.colors.cardBg, borderWidth: 1, borderColor: THEME.colors.border, borderRadius: 14, padding: 16, marginBottom: 32 },
  clubAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255, 107, 0, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 107, 0, 0.15)', alignItems: 'center', justifyContent: 'center' },
  clubAvatarText: { color: THEME.colors.accent, fontSize: 18, fontWeight: '800' },
  clubName: { color: THEME.colors.text, fontSize: 15, fontWeight: '700' },
  clubDesc: { color: THEME.colors.textMuted, fontSize: 12, lineHeight: 17 },
  ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  ctaGradient: { position: 'absolute', top: -30, left: 0, right: 0, height: 30 },
  ctaContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34, backgroundColor: THEME.colors.bg },
  ctaPriceWrap: { gap: 1 },
  ctaPriceLabel: { color: THEME.colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  ctaPriceValue: { color: THEME.colors.text, fontSize: 20, fontWeight: '800' },
  ctaButton: { borderRadius: 14, overflow: 'hidden' },
  ctaGradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 16 },
  ctaButtonText: { color: '#000', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});
