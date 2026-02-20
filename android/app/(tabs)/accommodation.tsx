import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { authService } from '@/services/auth';
import { THEME } from '@/constants/Theme';
import { VergeHeader } from '@/components/VergeHeader';
import { VergeLoader } from '@/components/VergeLoader';
import { VergeAlert } from '@/components/VergeAlert';
import { apiHelper } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SECTORS = [
  { id: 'Boys', title: 'MALE SECTOR' },
  { id: 'Girls', title: 'FEMALE SECTOR' },
];

const HostelCard = React.memo(({ item, index, onPress }: { item: any; index: number; onPress: (id: string) => void }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => { scale.value = withTiming(0.98, { duration: 150 }); };
  const handlePressOut = () => { scale.value = withTiming(1, { duration: 150 }); };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: scale.value }] };
  });

  const isGirls = item.gender.toLowerCase() === 'female';
  const accentColor = isGirls ? '#FF2D55' : THEME.colors.accent;

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 30)}
      style={styles.cardWrapper}
    >
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={() => onPress(item._id)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.cardContainer}
        >
          <View style={styles.cardMain}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={[styles.typePill, { backgroundColor: accentColor + '15' }]}>
                  <Text style={[styles.typeText, { color: accentColor }]}>{item.available ? 'AVAILABLE' : 'FULL'}</Text>
                </View>
              </View>
              <View style={styles.priceTag}>
                <Text style={styles.priceValue}>₹{item.price}</Text>
                <Text style={styles.priceUnit}>/ night</Text>
              </View>
            </View>

            <Text style={styles.cardDesc}>{item.description}</Text>

            <View style={styles.cardFeatures}>
              <View style={styles.featureItem}>
                <Ionicons name="people-outline" size={16} color={THEME.colors.textSecondary} />
                <Text style={styles.featureText}>{item.beds} BEDS</Text>
              </View>
              <View style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Book Now</Text>
                <Ionicons name="arrow-forward" size={14} color={accentColor} />
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

export default function Accommodation() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [selectedGender, setSelectedGender] = useState('Boys');
  const [loading, setLoading] = useState(true);
  const [hasExistingBooking, setHasExistingBooking] = useState(false);
  const [hostels, setHostels] = useState<any[]>([]);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: any[];
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const fetchHostels = async () => {
    try {
      const response = await apiHelper.fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/hostels`);
      if (response.ok) {
        const result = await response.json();
        // Assuming result.data contains the array of hostels based on project patterns
        setHostels(result.data || result);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      if (!userId) return;
      const response = await apiHelper.fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/get?id=${userId}`);
      if (response.ok) {
        const result = await response.json();
        setUserProfile(result.data);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const checkExistingBooking = async (userId: string) => {
    try {
      if (!userId) return;
      const response = await apiHelper.fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/accommodation/my?userId=${userId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setHasExistingBooking(true);
        }
      }
    } catch (error) {
      // Silent fail
    }
  };

  useEffect(() => {
    const currentUser = authService.getSession();
    setUser(currentUser);

    const init = async () => {
      await fetchHostels();
      const backendUser = await authService.getBackendUser();

      if (backendUser || currentUser) {
        const bid = backendUser?._id || '';
        await Promise.all([
          fetchUserProfile(bid),
          checkExistingBooking(bid)
        ]);
      }
      setLoading(false);
    };

    init();
  }, []);

  const hGender = useMemo(() => selectedGender === 'Boys' ? 'male' : 'female', [selectedGender]);

  const getMissingProfileFields = useCallback((profile: any) => {
    const missing: string[] = [];

    const hasValue = (value: any) => String(value ?? '').trim().length > 0;
    const phone = String(profile?.phone ?? '').trim();
    const aadhaar = String(profile?.aadhaarNumber ?? '').trim();

    if (!hasValue(profile?.name)) missing.push('NAME');
    if (!/^[0-9]{10}$/.test(phone)) missing.push('PHONE');
    if (!hasValue(profile?.gender)) missing.push('GENDER');
    if (!hasValue(profile?.dob)) missing.push('DOB');
    if (!hasValue(profile?.collegeName)) missing.push('COLLEGE');
    if (!hasValue(profile?.studentId)) missing.push('STUDENT ID');
    if (!/^[0-9]{12}$/.test(aadhaar)) missing.push('AADHAAR NUMBER');
    if (!hasValue(profile?.aadhaarImage)) missing.push('AADHAAR IMAGE');
    if (!hasValue(profile?.studentIdImage)) missing.push('STUDENT ID IMAGE');

    return missing;
  }, []);

  const handleBooking = useCallback((id: string) => {
    const session = authService.getSession();
    if (!session && !userProfile) {
      showAlert('Link Lost', 'Please establish session to reserve pod.');
      router.replace("/login");
      return;
    }

    const hostel = hostels.find(h => h._id === id);
    const hostelGender = (hostel?.gender || hGender).toLowerCase();

    // 1. Incomplete Profile Check
    const missingFields = getMissingProfileFields(userProfile);
    if (missingFields.length > 0) {
      showAlert('Profile Incomplete', `Complete profile fields before booking: ${missingFields.join(', ')}.`, [
        { text: 'Go to Profile', onPress: () => router.push('/(tabs)/profile') },
        { text: 'Cancel', style: 'cancel' }
      ]);
      return;
    }

    // 2. Immediate Gender Mismatch Check
    const profileGender = String(userProfile?.gender || '').toLowerCase();
    const targetSectorGender = hostelGender;

    if (profileGender && targetSectorGender && profileGender !== targetSectorGender) {
      showAlert(
        'Access Denied',
        `Your profile indicates you are ${profileGender.toUpperCase()}. You can only book accommodations in the ${profileGender.toUpperCase()} sector.`
      );
      return;
    }

    if (hasExistingBooking) {
      showAlert(
        'Deployment Active',
        'You already have an active accommodation assignment or pending request. Please check your deployment info.',
        [
          { text: 'View Deployment', onPress: () => router.push('/(Hostel)/BookedHostel' as any) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    router.push({
      pathname: "/(Hostel)/HostelRegister" as any,
      params: {
        hostelId: id,
        hostelName: hostel?.name || 'Unknown Hostel',
        userId: userProfile._id,
        hostelGender: targetSectorGender
      }
    });
  }, [userProfile, router, hasExistingBooking, hGender, hostels, getMissingProfileFields]);


  const filteredHostels = useMemo(() => {
    return hostels.filter(h => {
      const targetGender = selectedGender === 'Boys' ? 'male' : 'female';
      const genderMatch = h.gender.toLowerCase() === targetGender;
      return genderMatch;
    });
  }, [selectedGender, hostels]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== null && index !== undefined) {
        setSelectedGender(SECTORS[index].id);
      }
    }
  }).current;

  return (
    <View style={{ flex: 1, backgroundColor: THEME.colors.bg }}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <VergeHeader
          title="STAY"
          rightElement={
            !loading && (
              <TouchableOpacity
                onPress={() => router.push('/(Hostel)/BookedHostel' as any)}
                activeOpacity={0.7}
                style={styles.myPodButton}
              >
                <Ionicons name="bed-outline" size={20} color={THEME.colors.accent} />
              </TouchableOpacity>
            )
          }
        />

        {loading ? (
          <VergeLoader message="LOADING..." />
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <FlatList
                data={filteredHostels}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => <HostelCard item={item} index={index} onPress={handleBooking} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                ListHeaderComponent={<Text style={styles.sectionTitle}>Available Units</Text>}
                ListEmptyComponent={<Text style={styles.emptyText}>No quarters found in this sector</Text>}
              />

              <LinearGradient
                colors={['transparent', THEME.colors.bg]}
                style={styles.listGradient}
                pointerEvents="none"
              />
            </View>

            <View style={styles.footerSection}>
              <View style={styles.carouselWrap}>
                <View pointerEvents="none" style={[styles.chevronWrap, styles.chevronLeftWrap]}>
                  <ChevronLeft size={14} color={THEME.colors.textMuted} strokeWidth={2.2} />
                </View>

                <FlatList
                  data={SECTORS}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                  decelerationRate="fast"
                  snapToInterval={SCREEN_WIDTH}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.sectorCardContainer}>
                      <View style={styles.sectorCard}>
                        <Image
                          source={item.id === 'Boys' ? require('../../assets/boys.png') : require('../../assets/girls.png')}
                          style={styles.sectorImage}
                          resizeMode="cover"
                        />
                        <LinearGradient
                          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']}
                          style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.sectorContent}>
                          <Text style={styles.sectorTitle}>{item.title}</Text>
                          <View style={styles.indicatorContainer}>
                            <View style={[styles.dot, selectedGender === 'Boys' ? styles.dotActive : styles.dotInactive]} />
                            <View style={[styles.dot, selectedGender === 'Girls' ? styles.dotActive : styles.dotInactive]} />
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                />

                <View pointerEvents="none" style={[styles.chevronWrap, styles.chevronRightWrap]}>
                  <ChevronRight size={14} color={THEME.colors.textMuted} strokeWidth={2.2} />
                </View>
              </View>
            </View>
          </>
        )}

        <VergeAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  myPodButton: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: THEME.colors.textSecondary, marginTop: 20, marginBottom: 16, marginLeft: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },

  cardWrapper: { marginBottom: 16 },
  cardContainer: {
    backgroundColor: '#111', borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden',
  },
  cardMain: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: THEME.colors.text, marginBottom: 6 },
  typePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  priceTag: { alignItems: 'flex-end' },
  priceValue: { fontSize: 20, fontWeight: '900', color: THEME.colors.text },
  priceUnit: { fontSize: 10, color: THEME.colors.textMuted, marginTop: -2 },
  cardDesc: { fontSize: 13, color: THEME.colors.textSecondary, lineHeight: 20, marginTop: 16, marginBottom: 20 },
  cardFeatures: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 12, fontWeight: '600', color: THEME.colors.textSecondary },
  bookBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookBtnText: { fontSize: 13, fontWeight: '700', color: THEME.colors.text },

  listGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, zIndex: 10 },
  footerSection: { paddingBottom: 24, paddingTop: 10 },
  carouselWrap: { position: 'relative' },
  chevronWrap: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', zIndex: 20 },
  chevronLeftWrap: { left: 28 },
  chevronRightWrap: { right: 28 },
  sectorCardContainer: { width: SCREEN_WIDTH, paddingHorizontal: 20 },
  sectorCard: { height: 140, backgroundColor: '#000', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  sectorImage: { width: '100%', height: '100%', position: 'absolute' },
  sectorContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  sectorTitle: { fontSize: 22, fontWeight: '900', color: THEME.colors.text, letterSpacing: 1 },
  indicatorContainer: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dot: { height: 4, borderRadius: 2 },
  dotActive: { width: 24, backgroundColor: THEME.colors.accent },
  dotInactive: { width: 8, backgroundColor: 'rgba(255,255,255,0.45)' },
  emptyText: { textAlign: 'center', color: THEME.colors.textMuted, marginTop: 40, fontSize: 13, fontWeight: '600' },
});
