import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  AppState,
  Image as RNImage,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  useAnimatedProps,
  cancelAnimation,
  type SharedValue,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, {
  Defs,
  Path,
  Circle,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import { Countdown } from '@/components/Countdown';
import { authService } from '@/services/auth';
import { THEME } from '@/constants/Theme';

// --- Types ---
type NavRoute = '/(tabs)/events' | '/(tabs)/schedule' | '/(tabs)/merch' | '/(tabs)/accommodation' | '/(tabs)/profile';
type DrawerRoute = '/maps' | 'settings/info' | 'settings/about' | 'settings/notification' | '/settings/sponsors' | '/settings/contact' | '/settings/developers' | '/settings/team' | '/';

// --- Configuration ---
const NAV_ITEMS = [
  { id: 'events', label: 'Events', icon: 'calendar-clear-outline' },
  { id: 'schedule', label: 'Schedule', icon: 'time-outline' },
  { id: 'merch', label: 'Merch', icon: 'bag-handle-outline' },
  { id: 'stay', label: 'Stay', icon: 'bed-outline' },
] as const;

const DRAWER_LINKS = [
  { id: 'maps', label: 'Maps', sub: 'NAV', icon: 'map-outline' },
  { id: 'info', label: 'General Info', sub: 'READ', icon: 'newspaper-outline' },
  { id: 'about', label: 'About Verge', sub: 'READ', icon: 'earth-outline' },
  { id: 'sponsors', label: 'Sponsors', sub: 'PARTNERS', icon: 'diamond-outline' },
  { id: 'contact', label: 'Contact Us', sub: 'CONNECT', icon: 'chatbubble-ellipses-outline' },
  { id: 'team', label: 'Verge Team', sub: 'TEAM', icon: 'people-outline' },

] as const;

const NAV_ROUTES: Record<string, NavRoute> = {
  events: '/(tabs)/events',
  schedule: '/(tabs)/schedule',
  merch: '/(tabs)/merch',
  stay: '/(tabs)/accommodation',
};

const DRAWER_ROUTES: Record<string, DrawerRoute> = {
  maps: '/maps',
  info: 'settings/info',
  about: 'settings/about',
  sponsors: '/settings/sponsors',
  contact: '/settings/contact',
  team: '/settings/team',
};

// --- Math & Geometry (Pure Functions) ---

const bezier = (t: number, p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }, p3: { x: number, y: number }) => {
  'worklet';
  const cX = 3 * (p1.x - p0.x);
  const bX = 3 * (p2.x - p1.x) - cX;
  const aX = p3.x - p0.x - cX - bX;
  const cY = 3 * (p1.y - p0.y);
  const bY = 3 * (p2.y - p1.y) - cY;
  const aY = p3.y - p0.y - cY - bY;
  const x = aX * t * t * t + bX * t * t + cX * t + p0.x;
  const y = aY * t * t * t + bY * t * t + cY * t + p0.y;
  return { x, y };
};

// Moved outside component to prevent recreation logic
const generateOptimizedPath = (w: number, h: number, menuCount: number) => {
  const startX = 40;
  const startY = 80;
  const drawerWidth = w;
  let d = `M ${startX},${startY}`;

  // Use Float32Array for better memory performance if processed in native, 
  // but Reanimated interpolate expects standard arrays. 
  const input: number[] = [];
  const outputX: number[] = [];
  const outputY: number[] = [];
  const outputAngle: number[] = [];
  const menuTriggers: { x: number; y: number; trigger: number }[] = [];

  let prevX = startX;
  let prevY = startY;
  const availableHeight = h - 140;
  const segmentH = availableHeight / (menuCount + 0.5);
  const SAMPLES_PER_SEGMENT = 20;
  let globalT = 0;
  const totalSamples = (menuCount + 1) * SAMPLES_PER_SEGMENT;

  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < menuCount; i++) {
    const isEven = i % 2 === 0;
    const wave = isEven ? drawerWidth * 0.08 : drawerWidth * 0.22;
    const randomX = seededRandom(i * 42) * 30 - 15;
    const targetX = Math.max(40, Math.min(drawerWidth * 0.35, wave + randomX));
    const targetY = startY + (i + 1) * segmentH;

    const p0 = { x: prevX, y: prevY };
    const cp1X = prevX + (targetX - prevX) * 0.5;
    const cp1Y = prevY + segmentH * 0.8;
    const cp2X = targetX;
    const cp2Y = targetY - segmentH * 0.5;

    // Smooth control points
    const intensity = 50;
    const p1 = { x: cp1X + (isEven ? intensity : -intensity), y: cp1Y };
    const p2 = { x: cp2X + (isEven ? -intensity : intensity), y: cp2Y };
    const p3 = { x: targetX, y: targetY };

    d += ` C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;

    for (let j = 0; j < SAMPLES_PER_SEGMENT; j++) {
      const t = j / SAMPLES_PER_SEGMENT;
      const point = bezier(t, p0, p1, p2, p3);
      const nextT = (j + 1) / SAMPLES_PER_SEGMENT;
      const nextPoint = bezier(nextT, p0, p1, p2, p3);
      const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI) + 90;

      input.push(globalT / totalSamples);
      outputX.push(point.x);
      outputY.push(point.y);
      outputAngle.push(angle);
      globalT++;
    }
    menuTriggers.push({
      x: targetX,
      y: targetY,
      trigger: (globalT - 10) / totalSamples,
    });
    prevX = targetX;
    prevY = targetY;
  }

  // Final Segment
  const finalX = startX + 15;
  const finalY = h - 60;
  const p0 = { x: prevX, y: prevY };
  const p1 = { x: prevX, y: prevY + 60 };
  const p2 = { x: finalX, y: finalY - 40 };
  const p3 = { x: finalX, y: finalY };

  d += ` C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;

  for (let j = 0; j < SAMPLES_PER_SEGMENT; j++) {
    const t = j / SAMPLES_PER_SEGMENT;
    const point = bezier(t, p0, p1, p2, p3);
    const nextPoint = bezier((j + 1) / SAMPLES_PER_SEGMENT, p0, p1, p2, p3);
    const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI) + 90;

    input.push(globalT / totalSamples);
    outputX.push(point.x);
    outputY.push(point.y);
    outputAngle.push(angle);
    globalT++;
  }

  // Ensure strict closure
  input.push(1);
  outputX.push(finalX);
  outputY.push(finalY);
  outputAngle.push(outputAngle[outputAngle.length - 1]);

  return { d, animationData: { input, outputX, outputY, outputAngle }, menuTriggers };
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Sub-Components ───

const SeamlessBackground = memo(React.forwardRef<{ pause: () => void; play: () => void }, object>((_props, ref) => {
  const player = useVideoPlayer(require('../assets/home-bg.mp4'), (p) => {
    p.loop = true;
    p.play();
    p.muted = true;
  });

  React.useImperativeHandle(ref, () => ({
    pause: () => player.pause(),
    play: () => player.play(),
  }), [player]);

  useEffect(() => {
    const handleAppStateChange = (state: string) => {
      if (state === 'active') {
        player.play();
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [player]);

  return (
    <View style={styles.backgroundContainer} pointerEvents="none">
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.bgOverlay} />
    </View>
  );
}));

const Header = memo(({ insets, headerEnter }: { insets: EdgeInsets; headerEnter: SharedValue<number> }) => {
  const containerStyle = useAnimatedStyle(() => ({
    opacity: headerEnter.value,
    marginTop: insets.top + 120,
    transform: [{ translateY: interpolate(headerEnter.value, [0, 1], [-15, 0]) }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(headerEnter.value, [0, 0.8, 1], [0, 1, 0.8]),
    letterSpacing: interpolate(headerEnter.value, [0, 1], [4, 8]),
    transform: [{ translateY: interpolate(headerEnter.value, [0, 1], [5, 0]) }],
  }));

  const yearStyle = useAnimatedStyle(() => ({
    opacity: interpolate(headerEnter.value, [0, 0.8, 1], [0, 0, 1]),
    transform: [
      { translateY: interpolate(headerEnter.value, [0, 0.8, 1], [10, 10, 0]) },
      { scale: interpolate(headerEnter.value, [0.8, 1], [0.95, 1]) },
    ],
  }));

  return (
    <Animated.View style={[styles.headerContainer, containerStyle]}>
      <View>
        <Text style={styles.headerGlow}>VERGE</Text>
        <Text style={styles.headerText}>VERGE</Text>
      </View>
      <Animated.Text style={[styles.subtitle, subtitleStyle]}>JOURNEY BEYOND</Animated.Text>
      <Animated.View style={[styles.countdownContainer, yearStyle]}>
        <Countdown />
      </Animated.View>
    </Animated.View>
  );
});

const NavItem = memo(({
  item, onPress, disabled, index, entered, totalItems, screenWidth, screenHeight
}: {
  item: (typeof NAV_ITEMS)[number];
  onPress: (id: string) => void;
  disabled: boolean;
  index: number;
  entered: SharedValue<number>;
  totalItems: number;
  screenWidth: number;
  screenHeight: number;
}) => {
  const insets = useSafeAreaInsets();

  // Memoize geometry calculations to avoid recalc on every render
  const { cx, cy, itemSize, iconBox, iconSize } = useMemo(() => {
    // Fixed sizes for absolute consistency across all items
    const size = 80;
    const halfItem = size / 2;
    const horizontalInset = Math.max(16, Math.min(screenWidth * 0.06, 28));
    const minCenterX = horizontalInset + halfItem;
    const maxCenterX = screenWidth - horizontalInset - halfItem;
    const distribution = totalItems > 1 ? index / (totalItems - 1) : 0.5;
    const calculatedCx = minCenterX + (maxCenterX - minCenterX) * distribution;

    // Adjusted arc for a more "planet-like" curve
    // Added a base lift to shift the ends (Events/Stay) up
    const baseOffsetFromBottom = Math.max(145, Math.min(screenHeight * 0.22, 185));
    const baselineY = screenHeight - insets.bottom - baseOffsetFromBottom;
    const arcLift = Math.max(45, Math.min(screenWidth * 0.18, 65));
    const baseLift = 15; // Reduced from 25 to shift down
    const calculatedCy = baselineY - Math.sin(distribution * Math.PI) * arcLift - baseLift;

    const iBox = 48; // Explicitly identical

    return {
      cx: calculatedCx,
      cy: calculatedCy,
      itemSize: size,
      iconBox: iBox,
      iconSize: 22 // Explicitly identical
    };
  }, [screenWidth, screenHeight, totalItems, index, insets.bottom]);

  const pressed = useSharedValue(0);
  const handlePress = useCallback(() => onPress(item.id), [item.id, onPress]);

  const handlePressIn = useCallback(() => { pressed.value = withSpring(1, { damping: 12, stiffness: 400 }); }, [pressed]);
  const handlePressOut = useCallback(() => { pressed.value = withSpring(0, { damping: 12, stiffness: 400 }); }, [pressed]);

  const animatedStyle = useAnimatedStyle(() => {
    // Perfectly symmetric stagger ensures Schedule and Merch stay levelled
    const centerIndex = (totalItems - 1) / 2;
    const stagger = Math.abs(index - centerIndex) * 0.12;
    const t = interpolate(entered.value, [stagger, stagger + 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    return {
      opacity: t,
      transform: [
        { translateY: interpolate(t, [0, 1], [30, 0]) },
        { scale: interpolate(t, [0, 1], [0.6, 1]) }
      ],
    };
  });

  const iconScale = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.85]) }],
  }));

  return (
    <Animated.View style={[{
      position: 'absolute', left: cx - itemSize / 2, top: cy - itemSize / 2,
      width: itemSize, height: itemSize, alignItems: 'center', justifyContent: 'center', zIndex: 30
    }, animatedStyle]}>
      <AnimatedPressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled} style={styles.navPressable}>
        <Animated.View style={[{
          width: iconBox, height: iconBox, borderRadius: iconBox / 3, borderWidth: 1,
          overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 7,
          backgroundColor: 'rgba(20, 20, 20, 0.5)', borderColor: 'rgba(255,255,255,0.1)'
        }, iconScale]}>
          <Ionicons name={item.icon as any} size={iconSize} color={THEME.colors.text} />
        </Animated.View>
        <Text style={styles.navLabel}>{item.label}</Text>
      </AnimatedPressable>
    </Animated.View>
  );
});

const MenuItem = memo(({ data, pos, progress, onPress }: {
  data: (typeof DRAWER_LINKS)[number];
  pos: { x: number; y: number; trigger: number };
  progress: SharedValue<number>;
  onPress: (id: string) => void;
}) => {
  const rStyle = useAnimatedStyle(() => {
    const isVisible = progress.value > pos.trigger;
    return {
      opacity: withTiming(isVisible ? 1 : 0, { duration: 250 }),
      transform: [
        { translateX: withTiming(isVisible ? 32 : -10, { duration: 350, easing: Easing.out(Easing.back(1)) }) },
        { translateY: -25 },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', zIndex: 30, right: 20, left: pos.x, top: pos.y }, rStyle]}>
      <TouchableOpacity style={styles.menuItemTouchable} onPress={() => onPress(data.id)} activeOpacity={0.6}>
        <View style={styles.menuDot} />
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemSub}>{data.sub}</Text>
          <View style={styles.menuItemRow}>
            <Ionicons name={data.icon as any} size={16} color={THEME.colors.text} />
            <Text style={styles.menuItemLabel}>{data.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const SpaceCommandButton = memo(({ menuProgress, onPress, top }: { menuProgress: SharedValue<number>; onPress: () => void; top: number }) => {
  const orbitAngle = useSharedValue(0);
  useEffect(() => {
    orbitAngle.value = withRepeat(withTiming(360, { duration: 5000, easing: Easing.linear }), -1, false);
  }, []);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitAngle.value}deg` }],
    opacity: interpolate(menuProgress.value, [0, 1], [0.3, 0.8]),
  }));

  return (
    <View style={[styles.menuButtonContainer, { top }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.menuButton}>
        <View style={styles.centerContent}>
          <Animated.View style={[styles.menuButtonRing, outerRingStyle]} />
          <Ionicons name="grid-outline" size={18} color={THEME.colors.text} />
        </View>
      </TouchableOpacity>
    </View>
  );
});

// Separated into component to isolate the heavy interpolation logic
const RocketCursor = memo(({ progress, animationData }: { progress: SharedValue<number>, animationData: any }) => {
  const rocketStyle = useAnimatedStyle(() => {
    if (progress.value < 0.01) return { opacity: 0 };
    return {
      opacity: 1,
      transform: [
        { translateX: interpolate(progress.value, animationData.input, animationData.outputX) - 16 },
        { translateY: interpolate(progress.value, animationData.input, animationData.outputY) - 16 },
        { rotate: `${interpolate(progress.value, animationData.input, animationData.outputAngle)}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.rocketContainer, rocketStyle]}>
      <Svg width={32} height={32} viewBox="0 0 24 24">
        <Defs>
          <SvgGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
          </SvgGradient>
        </Defs>
        <Path d="M12 2L15 8L15 15C15 15 17 17 17 19L12 17L7 19C7 17 9 15 9 15L9 8L12 2Z" fill="white" stroke="rgba(255,255,255,0.5)" strokeWidth={0.5} />
        <Circle cx="12" cy="10" r="1.5" fill="#000" />
        <Path d="M9 15L7 19L5 21L7 22L12 20L17 22L19 21L17 19L15 15" fill="url(#flameGrad)" opacity={0.7} />
      </Svg>
    </Animated.View>
  );
});

const ProfileBox = memo(({ 
  profilePhoto, 
  onPress, 
  isOpen, 
  top 
}: { 
  profilePhoto: string | null; 
  onPress: () => void; 
  isOpen: boolean;
  top: number;
}) => {
  return (
    <View style={[styles.profileButtonContainer, { top }]}>
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.75} 
        disabled={isOpen} 
        style={styles.profileGlassContainer}
      >
        <BlurView intensity={30} tint="dark" style={styles.profileBlur}>
          <View style={styles.profileImageFrame}>
            {profilePhoto ? (
              <Image 
                source={{ uri: profilePhoto }} 
                style={styles.profileImage} 
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
              />
            ) : (
              <Ionicons name="person-outline" size={18} color={THEME.colors.textSecondary} />
            )}
          </View>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
});

// ─── Main Dashboard ───
export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Refs for stability
  const isNavigatingRef = useRef(false);
  const bgRef = useRef<{ pause: () => void; play: () => void }>(null);
  const rafRef = useRef<number | null>(null);

  // Memoize costly geometry generation
  const { d, animationData, menuTriggers } = useMemo(() => {
    return generateOptimizedPath(screenWidth, screenHeight, DRAWER_LINKS.length);
  }, [screenWidth, screenHeight]);

  // Shared Values
  const progress = useSharedValue(0);
  const drawerOpacity = useSharedValue(0);
  const menuProgress = useSharedValue(0);
  const navEntered = useSharedValue(0);
  const headerEnter = useSharedValue(0);

  // Lifecycle
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        const [session, localPic] = await Promise.all([
          authService.getUserSession(),
          AsyncStorage.getItem('local_profile_pic'),
        ]);
        
        setProfilePhoto(localPic || session?.profilePic || null);
        isNavigatingRef.current = false;
        bgRef.current?.play();

        // Prefetch high-priority background assets for other screens
        Image.prefetch([
          RNImage.resolveAssetSource(require('../assets/astronaut.png')).uri,
          RNImage.resolveAssetSource(require('../assets/events-bg.png')).uri,
          RNImage.resolveAssetSource(require('../assets/merch-bg.jpeg')).uri,
          RNImage.resolveAssetSource(require('../assets/schedule-bg.png')).uri,
        ]);
      };

      init();

      navEntered.value = 0;
      headerEnter.value = 0;
      headerEnter.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
      navEntered.value = withDelay(50, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, []) // Empty dependency array ok here as values are stable refs or set functions
  );

  const toggleDrawer = useCallback(() => {
    setIsOpen((prev) => {
      const nextState = !prev;
      if (nextState) {
        drawerOpacity.value = withTiming(1, { duration: 200 });
        progress.value = withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) });
        menuProgress.value = withTiming(1, { duration: 150 });
      } else {
        drawerOpacity.value = withTiming(0, { duration: 150 });
        progress.value = withTiming(0, { duration: 300 });
        menuProgress.value = withTiming(0, { duration: 100 });
      }
      return nextState;
    });
  }, []);

  const handleNavPress = useCallback((id: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    bgRef.current?.pause();
    cancelAnimation(navEntered);
    cancelAnimation(headerEnter);

    rafRef.current = requestAnimationFrame(() => {
      const route = NAV_ROUTES[id];
      if (route) router.push(route);
    });
  }, [router]);

  const handleDrawerNav = useCallback((id: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    setIsOpen(false);
    drawerOpacity.value = 0;
    progress.value = 0;
    menuProgress.value = 0;
    bgRef.current?.pause();

    rafRef.current = requestAnimationFrame(() => {
      const route = DRAWER_ROUTES[id];
      if (route) router.push(route);
    });
  }, [router]);

  const handleProfilePress = useCallback(() => {
    if (isOpen || isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    bgRef.current?.pause();
    rafRef.current = requestAnimationFrame(() => {
      router.push('/(tabs)/profile');
    });
  }, [isOpen, router]);

  const pathProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(progress.value, [0, 1], [2500, 0]),
  }));

  const drawerContainerStyle = useAnimatedStyle(() => ({ opacity: drawerOpacity.value }));
  const topInset = insets.top + 14;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SeamlessBackground ref={bgRef} />

      <View style={styles.mainContent}>
        <Header insets={insets} headerEnter={headerEnter} />

        {NAV_ITEMS.map((item, index) => (
          <NavItem
            key={item.id}
            item={item}
            onPress={handleNavPress}
            disabled={isOpen}
            index={index}
            entered={navEntered}
            totalItems={NAV_ITEMS.length}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
          />
        ))}
      </View>

      <SpaceCommandButton menuProgress={menuProgress} onPress={toggleDrawer} top={topInset} />

      <ProfileBox 
        profilePhoto={profilePhoto} 
        onPress={handleProfilePress} 
        isOpen={isOpen} 
        top={topInset} 
      />

      <Animated.View style={[styles.drawerOverlay, drawerContainerStyle]} pointerEvents={isOpen ? 'auto' : 'none'} renderToHardwareTextureAndroid>
        <View style={styles.drawerBackdrop} />

        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id="pathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={THEME.colors.accent} stopOpacity="0.1" />
              <Stop offset="100%" stopColor={THEME.colors.accent} stopOpacity="0.4" />
            </SvgGradient>
          </Defs>
          <AnimatedPath
            d={d}
            stroke="rgba(255, 107, 0, 0.3)"
            strokeWidth={1.5}
            fill="none"
            animatedProps={pathProps}
            strokeDasharray={[1, 14]}
            strokeLinecap="round"
          />
        </Svg>

        <RocketCursor progress={progress} animationData={animationData} />

        {menuTriggers.map((pos, i) => (
          <MenuItem
            key={DRAWER_LINKS[i].id}
            data={DRAWER_LINKS[i]}
            pos={pos}
            progress={progress}
            onPress={handleDrawerNav}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.colors.bg,
  },
  backgroundContainer: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
    zIndex: -1,
  },
  videoStyle: {
    width: '100%',
    height: '100%',
  },
  mainContent: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -100,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  navPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: THEME.colors.text,
    fontSize: 9,
    fontFamily: THEME.fonts.primaryBold,
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    fontFamily: THEME.fonts.header,
    fontSize: 56,
    color: THEME.colors.text,
    letterSpacing: 12,
    textAlign: 'center',
    lineHeight: 74,
    textShadowColor: THEME.colors.accent,
    textShadowRadius: 4,
    opacity: 0.1,
  },
  headerText: {
    fontFamily: THEME.fonts.header,
    fontSize: 56,
    color: THEME.colors.text,
    letterSpacing: 12,
    textAlign: 'center',
    lineHeight: 74,
  },
  subtitle: {
    fontFamily: THEME.fonts.primaryBold,
    fontSize: 10,
    color: THEME.colors.accent,
    marginTop: 16,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  countdownContainer: {
    marginTop: 24,
  },
  menuButtonContainer: {
    position: 'absolute',
    left: 18,
    zIndex: 300,
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    borderTopColor: THEME.colors.accent,
    borderRightColor: 'rgba(255, 107, 0, 0.3)',
  },
  profileButtonContainer: {
    position: 'absolute',
    right: 18,
    zIndex: 300,
  },
  profileGlassContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  profileBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageFrame: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  rocketContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    zIndex: 25,
  },
  menuItemTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  menuDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.accent,
    marginRight: 14,
    marginLeft: -30,
    shadowColor: THEME.colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  menuItemContent: {
    flex: 1,
    minWidth: 200,
  },
  menuItemSub: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontFamily: THEME.fonts.primary,
    letterSpacing: 3,
    marginBottom: 3,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuItemLabel: {
    color: THEME.colors.text,
    fontSize: 16,
    fontFamily: THEME.fonts.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});