import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
  StyleSheet,
  Pressable,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  X,
  Bookmark,
  BookmarkCheck,
  MapPin,
  ArrowRight,
  Grid2x2,
  Code2,
  Users,
  Hammer,
  Ellipsis,
  Calendar,
  XCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSavedStore } from '@/store/useSavedStore';
import { useClubStore } from '@/store/useClubStore';
import { THEME } from '@/constants/Theme';
import { VergeHeader } from '@/components/VergeHeader';
import { VergeLoader } from '@/components/VergeLoader';
import { apiHelper } from '@/services/api';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;
const CATEGORIES = ['all', 'tech', 'non-tech', 'workshop', 'other'];
const CACHE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const CATEGORY_ICONS: Record<string, any> = {
  all: Grid2x2,
  tech: Code2,
  'non-tech': Users,
  workshop: Hammer,
  other: Ellipsis,
};

interface Event {
  _id: string;
  title: string;
  category: 'tech' | 'non-tech' | 'workshop' | 'other';
  venue: string;
  date: string;
  time: string;
  registrationFee: number;
  requiresTeam: boolean;
  status: 'active' | 'inactive';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Event Card ─────────────────────────────────────────────────────
const EventCard = memo(({ item, index, onPress }: { item: Event; index: number; onPress: (id: string) => void }) => {
  const isSaved = useSavedStore(useCallback((s) => s.savedIds.includes(item._id), [item._id]));
  const toggleSave = useSavedStore((s) => s.toggleSave);
  const scale = useSharedValue(1);
  const bookmarkScale = useSharedValue(1);

  const eventDate = useMemo(() => {
    const d = new Date(item.date);
    return {
      day: d.toLocaleDateString('en-GB', { day: 'numeric' }),
      month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
      weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
    };
  }, [item.date]);

  const handlePressIn = useCallback(() => { 'worklet'; scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }, []);
  const handlePressOut = useCallback(() => { 'worklet'; scale.value = withSpring(1, { damping: 12, stiffness: 300 }); }, []);

  const animatedCard = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animatedBookmark = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: bookmarkScale.value }],
    };
  });


  const handlePress = useCallback(() => onPress(item._id), [onPress, item._id]);
  const handleSave = useCallback(() => {
    bookmarkScale.value = withSequence(
      withSpring(1.4, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 }),
    );
    toggleSave(item._id);
  }, [toggleSave, item._id]);

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 30).springify().damping(18)}
      style={styles.cardWrapper}
    >
      <Animated.View style={animatedCard}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.card}
        >
          <View style={styles.cardRimLight} />
          <View style={styles.cardBody}>
            <View style={styles.dateCol}>
              <Text style={styles.dateDay}>{eventDate.day}</Text>
              <Text style={styles.dateMonth}>{eventDate.month}</Text>
              <View style={styles.dateDivider} />
              <Text style={styles.dateWeekday}>{eventDate.weekday}</Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.contentCol}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <AnimatedPressable onPress={handleSave} hitSlop={14} style={[styles.bookmarkBtn]}>
                  <Animated.View style={animatedBookmark}>
                    {isSaved ? (
                      <BookmarkCheck size={18} color={THEME.colors.accent} strokeWidth={2.2} />
                    ) : (
                      <Bookmark size={18} color={THEME.colors.textSecondary} strokeWidth={2.2} />
                    )}
                  </Animated.View>
                </AnimatedPressable>
              </View>

              <View style={styles.eventMetaBlock}>
                <View style={styles.eventMetaRow}>
                  <MapPin size={14} color={THEME.colors.textSecondary} strokeWidth={2.2} />
                  <Text style={styles.eventMetaText} numberOfLines={1}>{item.venue}</Text>
                </View>
                <Text style={styles.eventMetaSubText} numberOfLines={1}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)} {'\u2022'} {item.requiresTeam ? 'Team' : 'Solo'}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                {item.registrationFee > 0 ? (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceSymbol}>₹</Text>
                    <Text style={styles.priceValue}>{item.registrationFee}</Text>
                  </View>
                ) : (
                  <View style={styles.freePill}>
                    <Text style={styles.freeText}>FREE</Text>
                  </View>
                )}

                <LinearGradient
                  colors={['#FF8C00', THEME.colors.accent]}
                  style={styles.registerBtn}
                >
                  <View style={styles.registerBtnHighlight} />
                  <Text style={styles.registerBtnText}>Register</Text>
                  <ArrowRight size={13} color="#000" strokeWidth={2.4} />
                </LinearGradient>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

// ─── MAIN SCREEN ────────────────────────────────────────────────────
export default function Events() {
  const router = useRouter();
  const navigation = useNavigation();

  const savedCount = useSavedStore(s => s.savedIds.length);
  const savedIds = useSavedStore(s => s.savedIds);
  const { setClubs, lastFetched } = useClubStore();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSavedModalVisible, setIsSavedModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const fetchClubs = useCallback(async () => {
    try {
      const now = Date.now();
      if (lastFetched && now - lastFetched < CACHE_TIMEOUT) return;

      const res = await apiHelper.fetch(`${SERVER_URL}/api/clubs`);
      const json = await res.json();
      if (res.ok && json.data) {
        setClubs(json.data);
      }
    } catch { /* Silent fail */ }
  }, [lastFetched, setClubs]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await apiHelper.fetch(`${SERVER_URL}/api/events`);
      const json = await res.json();
      if (res.ok) setEvents(json.data || []);
      
      // Also fetch clubs in parallel
      fetchClubs();
    } catch { /* */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchClubs]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filteredEvents = useMemo(() =>
    events.filter((e) => {
      const matchSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
      return matchSearch && matchCat && e.status === 'active';
    }),
    [events, searchQuery, selectedCategory]);

  const savedEventsList = useMemo(() => events.filter((e) => savedIds.includes(e._id)), [events, savedIds]);

  const handleEventPress = useCallback((id: string) => {
    router.push({ pathname: 'EventDetails/[id]', params: { id } });
  }, [router]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else router.replace('/dashboard');
  }, [navigation, router]);

  const handleRefresh = useCallback(() => { setRefreshing(true); fetchEvents(); }, [fetchEvents]);

  const renderEventItem = useCallback(({ item, index }: { item: Event; index: number }) => (
    <EventCard item={item} index={index} onPress={handleEventPress} />
  ), [handleEventPress]);

  const keyExtractor = useCallback((i: Event) => i._id, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image
        source={require('../../assets/events-bg.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <VergeHeader
          title="EVENTS"
          onBack={handleBack}
          rightElement={
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => setSearchVisible(p => !p)}
                style={[styles.hdrIconBtn, searchVisible && styles.hdrIconBtnActive]}
              >
                {searchVisible ? (
                  <X size={18} color={THEME.colors.accent} strokeWidth={2.2} />
                ) : (
                  <Search size={18} color={THEME.colors.textSecondary} strokeWidth={2.2} />
                )}
              </Pressable>

              <Pressable
                onPress={() => setIsSavedModalVisible(true)}
                style={[styles.hdrIconBtn, savedCount > 0 && styles.hdrIconBtnActive]}
              >
                {savedCount > 0 ? (
                  <BookmarkCheck size={18} color={THEME.colors.accent} strokeWidth={2.2} />
                ) : (
                  <Bookmark size={18} color={THEME.colors.textSecondary} strokeWidth={2.2} />
                )}
                {savedCount > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeTxt}>{savedCount}</Text></View>
                )}
              </Pressable>
            </View>
          }
        />

        {loading ? (
          <VergeLoader message="LOADING..." />
        ) : (
          <Animated.FlatList
            data={filteredEvents}
            keyExtractor={keyExtractor}
            renderItem={renderEventItem}
            contentContainerStyle={[styles.listContent, filteredEvents.length === 0 && { flex: 1 }]}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            initialNumToRender={6}
            maxToRenderPerBatch={4}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={THEME.colors.accent} progressBackgroundColor={THEME.colors.surface} />
            }
            ListHeaderComponent={
              <View style={styles.listHeader}>
                {searchVisible && (
                  <Animated.View entering={FadeInDown.duration(350).springify().damping(16)} style={styles.searchBar}>
                    <Search size={16} color={THEME.colors.textMuted} strokeWidth={2.2} />
                    <TextInput
                      placeholder="Search events..."
                      placeholderTextColor={THEME.colors.textMuted}
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus
                      selectionColor={THEME.colors.accent}
                    />
                    {searchQuery.length > 0 && (
                      <Pressable onPress={() => setSearchQuery('')}>
                        <XCircle size={18} color={THEME.colors.textMuted} strokeWidth={2.2} />
                      </Pressable>
                    )}
                  </Animated.View>
                )}

                <Animated.View entering={FadeInDown.duration(400).delay(200)}>
                  <FlatList
                    horizontal
                    data={CATEGORIES}
                    keyExtractor={(i) => i}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.catList}
                    renderItem={({ item }) => {
                      const CategoryIcon = CATEGORY_ICONS[item];
                      return (
                        <Pressable
                          onPress={() => setSelectedCategory(item)}
                          style={[styles.pill, selectedCategory === item && styles.pillActive]}
                        >
                          <CategoryIcon
                            size={14}
                            color={selectedCategory === item ? THEME.colors.accent : '#A0A0A0'}
                            strokeWidth={2.2}
                          />
                          <Text style={[styles.pillText, selectedCategory === item && styles.pillTextActive]}>
                            {item === 'non-tech' ? 'NON-TECH' : item.toUpperCase()}
                          </Text>
                        </Pressable>
                      );
                    }}
                  />
                </Animated.View>

                <View style={styles.resultsBar}>
                  <View style={styles.resultsLine} />
                  <Text style={styles.resultsText}>{filteredEvents.length} EVENT{filteredEvents.length !== 1 ? 'S' : ''}</Text>
                  <View style={styles.resultsLine} />
                </View>
              </View>
            }
            ListEmptyComponent={
              <Animated.View entering={FadeIn.duration(700)} style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Calendar size={44} color={THEME.colors.textMuted} strokeWidth={2.2} />
                </View>
                <Text style={styles.emptyTitle}>No Events Found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your filters or search</Text>
              </Animated.View>
            }
          />
        )}

        <Modal visible={isSavedModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsSavedModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <VergeHeader 
              title="SAVED" 
              onBack={() => setIsSavedModalVisible(false)}
              rightElement={
                <View style={{ paddingRight: 8 }}>
                   <Text style={styles.modalSubtitle}>{savedEventsList.length} ITEMS</Text>
                </View>
              }
            />

            <FlatList
              data={savedEventsList}
              keyExtractor={(item) => item._id}
              renderItem={({ item, index }) => (
                <EventCard item={item} index={index} onPress={(id) => { setIsSavedModalVisible(false); handleEventPress(id); }} />
              )}
              contentContainerStyle={[styles.modalList, savedEventsList.length === 0 && { flex: 1 }]}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}><Bookmark size={44} color={THEME.colors.textMuted} strokeWidth={2.2} /></View>
                  <Text style={styles.emptyTitle}>No Saved Events</Text>
                  <Text style={styles.emptySubtitle}>Bookmark events to find them here</Text>
                </View>
              }
            />
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  headerActions: { flexDirection: 'row', gap: 8 },
  hdrIconBtn: {
    width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  hdrIconBtnActive: { backgroundColor: THEME.colors.accentMuted, borderColor: THEME.colors.accentBorder },
  badge: { position: 'absolute', top: 5, right: 5, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: THEME.colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeTxt: { fontSize: 9, fontWeight: '900', color: '#000' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.colors.surface,
    borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 14,
    borderWidth: 1, borderColor: THEME.colors.borderLight,
  },
  searchInput: { flex: 1, marginLeft: 10, color: THEME.colors.text, fontSize: 15, fontWeight: '500' },
  catList: { marginBottom: 18, marginTop: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, backgroundColor: 'transparent', marginRight: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', gap: 6,
  },
  pillActive: { backgroundColor: 'rgba(255,107,0,0.12)', borderColor: 'rgba(255,107,0,0.4)' },
  pillText: { fontSize: 11, fontWeight: '500', color: '#A0A0A0', letterSpacing: 0.8 },
  pillTextActive: { color: THEME.colors.accent },
  resultsBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  resultsLine: { flex: 1, height: 1, backgroundColor: THEME.colors.border },
  resultsText: { fontSize: 10, fontWeight: '700', color: THEME.colors.textMuted, letterSpacing: 1.8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  listHeader: { paddingTop: 12, marginBottom: 14 },
  cardWrapper: { marginBottom: 20 },
  card: {
    backgroundColor: THEME.colors.cardBg, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: THEME.colors.border,
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 40, shadowOffset: { width: 0, height: 10 }, elevation: 14,
  },
  cardRimLight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
  },
  cardBody: { flexDirection: 'row', padding: 20, gap: 16 },
  dateCol: { alignItems: 'center', width: 45, paddingTop: 4 },
  dateDay: { fontSize: 22, fontWeight: '600', color: THEME.colors.accent, lineHeight: 22 },
  dateMonth: { fontSize: 11, fontWeight: '400', color: THEME.colors.text, letterSpacing: 1, marginTop: 2 },
  dateDivider: { width: 12, height: 1.5, backgroundColor: THEME.colors.accent, marginVertical: 6, opacity: 0.5 },
  dateWeekday: { fontSize: 10, fontWeight: '400', color: THEME.colors.textMuted, letterSpacing: 1 },
  verticalDivider: { width: 1, backgroundColor: THEME.colors.border, marginVertical: 10, opacity: 0.1 },
  contentCol: { flex: 1, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: THEME.colors.text, flex: 1, lineHeight: 24 },
  bookmarkBtn: {
    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  eventMetaBlock: { gap: 2, paddingRight: 8 },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventMetaText: { flex: 1, fontSize: 13, color: '#9A9A9A', fontWeight: '400' },
  eventMetaSubText: { marginLeft: 19, fontSize: 12, color: THEME.colors.textMuted, fontWeight: '400' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 6, marginTop: 4,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceSymbol: { fontSize: 13, fontWeight: '400', color: '#9A9A9A', marginRight: 1 },
  priceValue: { fontSize: 22, fontWeight: '400', color: THEME.colors.text, letterSpacing: 0.5 },
  freePill: {
    backgroundColor: 'rgba(46,204,113,0.12)', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(46,204,113,0.4)',
  },
  freeText: { fontSize: 11, fontWeight: '500', color: '#2ecc71', letterSpacing: 1 },
  registerBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10, gap: 4,
    overflow: 'hidden',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  registerBtnHighlight: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  registerBtnText: { color: '#000', fontSize: 12, fontWeight: '500', letterSpacing: 0.3 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: {
    width: 84, height: 84, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: THEME.colors.text, letterSpacing: 0.5 },
  emptySubtitle: { fontSize: 13, color: THEME.colors.textMuted, fontWeight: '400' },
  modalContainer: { flex: 1, backgroundColor: THEME.colors.bg },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: THEME.colors.borderLight, alignSelf: 'center', marginTop: 24, marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: THEME.colors.text, letterSpacing: 0.5 },
  modalSubtitle: { fontSize: 10, color: THEME.colors.accent, fontWeight: '800', letterSpacing: 1 },
  modalList: { padding: 16, paddingBottom: 40 },
});
