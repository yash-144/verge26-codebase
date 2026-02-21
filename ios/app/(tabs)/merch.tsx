import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import {
  Text,
  View,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
  PanResponder,
  FlatList,
  Platform,
  Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Grid3X3,
  Shirt,
  Layers,
  Watch,
  X,
  History,
  ShoppingBag,
  Search,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Path } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { useCartStore } from '../../src/store/useCartStore';
import { THEME } from '../../src/constants/Theme';
import { VergeHeader } from '../../src/components/VergeHeader';
import { VergeLoader } from '../../src/components/VergeLoader';
import { apiHelper } from '../../src/services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MERCH_BG_ASSET = RNImage.resolveAssetSource(require('../../assets/merch-bg.jpeg'));
const MERCH_BG_RATIO = MERCH_BG_ASSET.width / MERCH_BG_ASSET.height;

const CARD_WIDTH = SCREEN_WIDTH * 0.6;
const CARD_HEIGHT = 350;
const CARD_SPACING = 5;
const CARD_TOTAL = CARD_WIDTH + CARD_SPACING;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

const CATEGORIES = ['all', 'tshirt', 'hoodie', 'accessory'] as const;
const CATEGORY_ICONS: Record<string, any> = {
  all: Grid3X3,
  tshirt: Shirt,
  hoodie: Layers,
  accessory: Watch,
};

// ── Carousel Card ──────────────────────────────────────────────────
const CarouselCard = memo(({ item, index, scrollX, onPress }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const input = [
      (index - 1) * CARD_TOTAL,
      index * CARD_TOTAL,
      (index + 1) * CARD_TOTAL,
    ];

    const rotation = interpolate(scrollX.value, input, [8, 0, -8], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, input, [40, 0, 40], Extrapolation.CLAMP);
    const translateX = interpolate(scrollX.value, input, [-10, 0, 10], Extrapolation.CLAMP);
    const scale = interpolate(scrollX.value, input, [0.88, 1, 0.88], Extrapolation.CLAMP);

    return {
      transform: [
        { perspective: 1000 },
        { translateY: CARD_HEIGHT / 2 },
        { rotateZ: `${rotation}deg` },
        { rotateY: `${rotation * -1.5}deg` },
        { translateY: -CARD_HEIGHT / 2 },
        { translateY },
        { translateX },
        { scale },
      ],
      zIndex: interpolate(scrollX.value, input, [1, 10, 1], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, input, [0.7, 1, 0.7], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View style={[styles.carouselCard, animatedStyle]} renderToHardwareTextureAndroid={true}>
      <Pressable onPress={() => onPress(item._id)} style={styles.cardPressable}>
        <View style={styles.cardContainer}>
          <Image
            source={{ uri: item.images?.[0] }}
            style={styles.cardImage}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.cardOverlay}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardPriceTypography}>₹{item.price.toLocaleString()}</Text>
            </View>
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ── Joystick ──────────────────────────────
const ARC_RADIUS = 160;
const ITEM_SIZE = 50;
const TAP_MAX_DISTANCE = 14;
const TAP_MAX_DURATION_MS = 450;
const HOLD_DEAD_ZONE = 26;
const HOLD_MAX_ANGLE_DIFF = 32;
const HOLD_SWITCH_BUFFER_DEG = 6;

const JoystickButton = memo(({ activeCategory, onSelect, onHoldChange }: any) => {
  const [isHolding, setIsHolding] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const hoverRef = useRef<string | null>(null);
  const touchStartRef = useRef(0);
  const holdProgress = useSharedValue(0);
  const arcAngle = useSharedValue(90);
  const arcOpacity = useSharedValue(0);
  const isOpen = isHolding || isPinnedOpen;

  useEffect(() => {
    onHoldChange?.(isOpen);
  }, [isOpen, onHoldChange]);

  useEffect(() => {
    holdProgress.value = withTiming(isHolding ? 1 : 0, { duration: isHolding ? 260 : 140 });
  }, [isHolding]);

  const holdArcStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: arcOpacity.value,
      transform: [
        { rotate: `${180 - arcAngle.value + 10}deg` },
        { scale: interpolate(holdProgress.value, [0, 1], [0.9, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  const menuPositions = useMemo(() => {
    return CATEGORIES.map((cat, i) => {
      const angle = (100 / (CATEGORIES.length - 1)) * i + 40;
      const rad = (180 - angle) * (Math.PI / 180);
      return { cat, x: Math.cos(rad) * ARC_RADIUS, y: -Math.sin(rad) * ARC_RADIUS };
    });
  }, []);

  const getCategoryAngle = useCallback((category: string | null) => {
    if (!category) return 90;
    const match = menuPositions.find((pos) => pos.cat === category);
    if (!match) return 90;
    return Math.atan2(-match.y, match.x) * (180 / Math.PI);
  }, [menuPositions]);

  const getAngleDiff = useCallback((a: number, b: number) => {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
  }, []);

  useEffect(() => {
    if (isHolding) {
      arcAngle.value = withTiming(getCategoryAngle(activeHover ?? activeCategory), { duration: 120 });
      arcOpacity.value = withTiming(1, { duration: 80 });
    } else {
      arcOpacity.value = withTiming(0, { duration: 110 });
    }
  }, [activeCategory, activeHover, isHolding, getCategoryAngle]);

  const handleItemTap = useCallback((category: string) => {
    onSelect(category);
    setIsPinnedOpen(false);
    setActiveHover(null);
    hoverRef.current = null;
  }, [onSelect]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      touchStartRef.current = Date.now();
      setIsHolding(true);
    },
    onPanResponderMove: (_, g) => {
      const angleDeg = Math.atan2(-g.dy, g.dx) * (180 / Math.PI);
      const dist = Math.hypot(g.dx, g.dy);

      let closest: string | null = null;
      let minDiff = Infinity;
      if (dist > HOLD_DEAD_ZONE) {
        menuPositions.forEach(pos => {
          const posAngleDeg = Math.atan2(-pos.y, pos.x) * (180 / Math.PI);
          const diff = getAngleDiff(angleDeg, posAngleDeg);
          if (diff < minDiff) {
            minDiff = diff;
            closest = pos.cat;
          }
        });

        if (minDiff > HOLD_MAX_ANGLE_DIFF) closest = null;

        if (closest && hoverRef.current && closest !== hoverRef.current) {
          const currentPos = menuPositions.find((pos) => pos.cat === hoverRef.current);
          if (currentPos) {
            const currentAngle = Math.atan2(-currentPos.y, currentPos.x) * (180 / Math.PI);
            const currentDiff = getAngleDiff(angleDeg, currentAngle);
            if (currentDiff <= minDiff + HOLD_SWITCH_BUFFER_DEG) closest = hoverRef.current;
          }
        }
      }
      if (hoverRef.current !== closest) {
        hoverRef.current = closest;
        runOnJS(setActiveHover)(closest);
      }
    },
    onPanResponderRelease: (_, g) => {
      const gestureDist = Math.hypot(g.dx, g.dy);
      const pressDuration = Date.now() - touchStartRef.current;
      const isTap = gestureDist < TAP_MAX_DISTANCE && pressDuration < TAP_MAX_DURATION_MS;

      if (hoverRef.current) runOnJS(onSelect)(hoverRef.current);
      if (isTap && !hoverRef.current) runOnJS(setIsPinnedOpen)(prev => !prev);

      runOnJS(setIsHolding)(false);
      runOnJS(setActiveHover)(null);
      hoverRef.current = null;
    },
    onPanResponderTerminate: () => {
      runOnJS(setIsHolding)(false);
      runOnJS(setActiveHover)(null);
      hoverRef.current = null;
    }
  }), [getAngleDiff, menuPositions, onSelect]);

  return (
    <View style={styles.joystickWrapper}>
      {isOpen && (
        <View style={styles.orbitalContainer}>
          {menuPositions.map((pos, index) => (
            <Animated.View
              key={pos.cat}
              entering={FadeIn.duration(180).delay(index * 24)}
              exiting={FadeOut.duration(130)}
              style={styles.menuItem}
            >
              <View style={{ transform: [{ translateX: pos.x }, { translateY: pos.y }] }}>
                <Pressable
                  onPress={() => handleItemTap(pos.cat)}
                  disabled={!isPinnedOpen || isHolding}
                  style={styles.menuItemPressable}
                >
                  <BlurView intensity={25} tint="dark" style={[
                    styles.itemCircle,
                    activeHover === pos.cat && styles.itemCircleActive,
                    activeCategory === pos.cat && !activeHover && styles.activeIndicator
                  ]}>
                    {(() => {
                      const CategoryIcon = CATEGORY_ICONS[pos.cat];
                      return (
                        <CategoryIcon
                          size={22}
                          color={activeHover === pos.cat ? '#000' : '#FFF'}
                          strokeWidth={2.2}
                        />
                      );
                    })()}
                  </BlurView>
                  <Text style={styles.itemLabel}>{pos.cat.toUpperCase()}</Text>
                </Pressable>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      <View {...panResponder.panHandlers} style={[styles.mainOrb, isOpen && styles.orbActive]}>
        <View style={styles.orbContent}>
          <Image
            source={require('../../assets/moon.png')}
            style={{ width: '100%', height: '100%', opacity: isOpen ? 1 : 0.6 }}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
          {isPinnedOpen && !isHolding && (
            <Animated.View
              pointerEvents="none"
              entering={FadeIn.duration(140)}
              exiting={FadeOut.duration(120)}
              style={styles.centerCloseIconWrap}
            >
              <X size={28} color="rgba(255,255,255,0.55)" strokeWidth={2.2} />
            </Animated.View>
          )}
        </View>

        <Animated.View pointerEvents="none" style={[styles.orbArcOverlay, holdArcStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <SvgGradient id="merchArcGlow" x1="50%" y1="0%" x2="50%" y2="100%">
                <Stop offset="0%" stopColor="#FF9B2A" stopOpacity="0" />
                <Stop offset="50%" stopColor="#FF9B2A" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#FF9B2A" stopOpacity="0" />
              </SvgGradient>
            </Defs>
            <Path d="M 23.6 12.3 A 46 46 0 0 0 23.6 87.7" stroke="url(#merchArcGlow)" strokeWidth={9} strokeOpacity={0.1} strokeLinecap="round" fill="none" />
            <Path d="M 23.6 12.3 A 46 46 0 0 0 23.6 87.7" stroke="url(#merchArcGlow)" strokeWidth={6} strokeOpacity={0.16} strokeLinecap="round" fill="none" />
            <Path d="M 23.6 12.3 A 46 46 0 0 0 23.6 87.7" stroke="url(#merchArcGlow)" strokeWidth={3} strokeOpacity={0.95} strokeLinecap="round" fill="none" />
          </Svg>
        </Animated.View>
      </View>

      <Text style={styles.orbHint}>Explore</Text>
    </View>
  );
});

// ── Main Merch Screen ──
export default function Merch() {
  const router = useRouter();
  const { cart } = useCartStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isJoystickHeld, setIsJoystickHeld] = useState(false);

  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const scrollX = useSharedValue(0);
  const overlayProgress = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { 'worklet'; scrollX.value = e.contentOffset.x; },
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: overlayProgress.value };
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      scrollX.value = 0;
    });
  }, [activeTab, searchQuery]);

  useEffect(() => {
    overlayProgress.value = withTiming(isJoystickHeld ? 1 : 0, { duration: 260 });
  }, [isJoystickHeld]);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiHelper.fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/products`);
        const j = await r.json();
        if (j.status && j.data) {
          setProducts(j.data);
          // Prefetch images
          const imagesToPrefetch = j.data
            .map((p: any) => p.images?.[0])
            .filter((url: string) => !!url);
          if (imagesToPrefetch.length > 0) {
            Image.prefetch(imagesToPrefetch);
          }
        }
      } catch (e) { /* silent */ } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => products.filter(p =>
    p.status === 'active' && (activeTab === 'all' || p.category === activeTab) &&
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  ), [products, activeTab, searchQuery]);

  const handleProductPress = useCallback((id: string) => {
    router.push(`MerchStore/${id}` as any);
  }, [router]);

  const renderItem = useCallback(({ item, index }: any) => (
    <CarouselCard
      item={item}
      index={index}
      scrollX={scrollX}
      onPress={handleProductPress}
    />
  ), [handleProductPress]);

  const keyExtractor = useCallback((item: any) => item._id, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/merch-bg.jpeg')}
        style={styles.merchBgImage}
        contentFit="cover"
        transition={500}
        cachePolicy="memory-disk"
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <VergeHeader
          title="STORE"
          rightElement={
            <View style={styles.headerActions}>
              <Pressable onPress={() => router.push('MerchStore/orders' as any)} style={styles.iconBtn}>
                <History size={20} color={THEME.colors.textMuted} strokeWidth={2.2} />
              </Pressable>
              <Pressable onPress={() => router.push('MerchStore/cart' as any)} style={[styles.iconBtn, cart?.length > 0 && styles.iconBtnActive]}>
                <ShoppingBag size={20} color={cart?.length > 0 ? THEME.colors.accent : THEME.colors.textMuted} strokeWidth={2.2} />
                {cart?.length > 0 && <View style={styles.badge}><Text style={styles.badgeTxt}>{cart.length}</Text></View>}
              </Pressable>
            </View>
          }
        />

        <View style={styles.searchBar}>
          <Search size={18} color={THEME.colors.textMuted} strokeWidth={2.2} />
          <TextInput
            placeholder="SEARCH PRODUCTS..."
            placeholderTextColor={THEME.colors.textMuted}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            removeClippedSubviews={Platform.OS === 'android'}
          />
        </View>

        <View style={styles.categoryTabs}>
          <FlatList
            horizontal
            data={CATEGORIES}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catList}
            removeClippedSubviews={true}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setActiveTab(item)}
                style={[styles.pill, activeTab === item && styles.pillActive]}
              >
                {(() => {
                  const CategoryIcon = CATEGORY_ICONS[item];
                  return (
                    <CategoryIcon
                      size={14}
                      color={activeTab === item ? THEME.colors.accent : '#A0A0A0'}
                      strokeWidth={2.2}
                    />
                  );
                })()}
                <Text style={[styles.pillText, activeTab === item && styles.pillTextActive]}>
                  {item.toUpperCase()}
                </Text>
              </Pressable>
            )}
          />
        </View>

        {loading ? (
          <VergeLoader message="LOADING..." />
        ) : (
          <View style={styles.carouselWrapper}>
            <Animated.FlatList
              ref={flatListRef}
              data={filtered}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SIDE_PADDING }}
              snapToInterval={CARD_TOTAL}
              snapToAlignment="start"
              decelerationRate="fast"
              disableIntervalMomentum
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              initialNumToRender={3}
              maxToRenderPerBatch={2}
              windowSize={3}
              removeClippedSubviews={true}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>NO ITEMS FOUND</Text></View>}
            />
          </View>
        )}

      </SafeAreaView>

      <Animated.View
        style={[styles.joystickBackdrop, overlayAnimatedStyle]}
        pointerEvents="none"
      />

      <View pointerEvents="box-none" style={styles.joystickLayer}>
        <JoystickButton
          activeCategory={activeTab}
          onSelect={setActiveTab}
          onHoldChange={setIsJoystickHeld}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.bg },
  merchBgImage: {
    position: 'absolute',
    top: 0,
    height: SCREEN_HEIGHT,
    width: SCREEN_HEIGHT * MERCH_BG_RATIO,
    left: (SCREEN_WIDTH - SCREEN_HEIGHT * MERCH_BG_RATIO) / 2,
  },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: THEME.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212' },
  iconBtnActive: { borderColor: THEME.colors.accent },
  badge: { position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9, backgroundColor: THEME.colors.accent, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { fontSize: 10, fontWeight: '900', color: '#000' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', marginHorizontal: 20, borderRadius: 15, paddingHorizontal: 16, height: 54, marginBottom: 10, borderWidth: 1, borderColor: THEME.colors.border },
  searchInput: { flex: 1, marginLeft: 12, color: '#FFF', fontWeight: '600', letterSpacing: 0.5 },
  categoryTabs: { marginBottom: 15 },
  catList: { paddingHorizontal: 20, marginTop: 2, marginBottom: 6 },
  pill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, backgroundColor: 'transparent', marginRight: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', gap: 6,
  },
  pillActive: { backgroundColor: 'rgba(255,107,0,0.12)', borderColor: 'rgba(255,107,0,0.4)' },
  pillText: { fontSize: 11, fontWeight: '500', color: '#A0A0A0', letterSpacing: 0.8 },
  pillTextActive: { color: THEME.colors.accent },
  carouselWrapper: { flex: 1, paddingTop: 50, paddingBottom: 140 },
  carouselCard: { width: CARD_WIDTH, marginHorizontal: CARD_SPACING / 2, height: CARD_HEIGHT },
  cardPressable: { flex: 1 },
  cardContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#141414',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', justifyContent: 'flex-end', padding: 20 },
  cardContent: { gap: 2 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  cardPriceTypography: { color: THEME.colors.accent, fontSize: 16, fontWeight: '900', textAlign: 'left' },
  joystickBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 15 },
  joystickLayer: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  joystickWrapper: { position: 'absolute', bottom: 20, alignSelf: 'center', alignItems: 'center' },
  centerCloseIconWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  mainOrb: { width: 120, height: 120, borderRadius: 60, overflow: 'visible', bottom: -15 },
  orbActive: { transform: [{ scale: 0.94 }] },
  orbContent: { ...StyleSheet.absoluteFillObject, borderRadius: 60, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  orbArcOverlay: { position: 'absolute', top: 12, left: 12, width: 96, height: 96, zIndex: 5 },
  orbHint: { color: THEME.colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  orbitalContainer: { position: 'absolute', bottom: 0, alignItems: 'center', justifyContent: 'center' },
  menuItem: { position: 'absolute', alignItems: 'center', width: 80 },
  menuItemPressable: { alignItems: 'center' },
  itemCircle: { width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  itemCircleActive: { backgroundColor: THEME.colors.accent, borderColor: THEME.colors.accent, transform: [{ scale: 1.15 }] },
  activeIndicator: { borderColor: THEME.colors.accent, borderWidth: 1.5 },
  itemLabel: { color: '#FFF', fontSize: 8, fontWeight: '900', marginTop: 8, letterSpacing: 1 },
  empty: { width: SCREEN_WIDTH - 40, alignItems: 'center', justifyContent: 'center', height: 200 },
  emptyText: { color: THEME.colors.textMuted, letterSpacing: 3, fontSize: 12, fontWeight: '700' }
});
