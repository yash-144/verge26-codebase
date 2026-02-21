import 'expo-dev-client';
import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { View, StyleSheet } from 'react-native';

// Internal Imports
import { authService, Session } from '@/services/auth';
import { notificationService } from '@/services/notification';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { useFonts, Orbitron_400Regular, Orbitron_700Bold, Orbitron_900Black } from '@expo-google-fonts/orbitron';
import { VideoSplashScreen } from '@/components/VideoSplashScreen';
import { THEME } from '@/constants/Theme';
import { GlobalAlert } from '@/components/GlobalAlert';
import { NetworkListener } from '@/components/NetworkListener';
import { Ionicons } from '@expo/vector-icons';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
    'Anurati': require('../assets/fonts/Anurati-Regular.otf'),
    'Guardians': require('../assets/fonts/Guardians.ttf'),
    ...Ionicons.font,
  });

  const [user, setUser] = useState<Session | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const { splashFinished, setSplashFinished, isVerified, setIsVerified } = useAppContext();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const activeUser = await authService.getUserSession();
        setUser(activeUser);
        setIsVerified(Boolean(activeUser?.emailVerified));
      } catch (err) {
        setUser(null);
        setIsVerified(false);
      } finally {
        setAuthInitialized(true);
      }
    };
    initializeAuth();
  }, [setIsVerified]);

  useEffect(() => {
    if (!fontsLoaded || !authInitialized) return;

    SplashScreen.hideAsync();

    if (!isVerified) {
      if (segments[0] !== 'login') {
        router.replace('/login');
      }
    } else {
      if (segments[0] === 'login' || segments[0] === 'index' || (segments.length as number) === 0) {
        router.replace('/dashboard');
      }
    }
  }, [user, segments, fontsLoaded, authInitialized, isVerified]);

  useEffect(() => {
    const registerNotifications = async () => {
      const activeUser = await authService.getUserSession();
      if (activeUser && isVerified) {
        const token = await notificationService.registerForPushNotificationsAsync();
        if (token) {
          await notificationService.sendTokenToBackend(token, activeUser);
        }
      }
    };
    registerNotifications();
  }, [user, isVerified]);

  useEffect(() => {
    const cleanup = notificationService.setupNotificationListeners();
    return cleanup;
  }, []);

  if (!fontsLoaded || !authInitialized) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: THEME.colors.bg }}>
      <View style={styles.container}>
        <Stack screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: THEME.colors.bg }
        }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="dashboard" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="MerchStore/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
        </Stack>
        {!splashFinished && (
          <View style={StyleSheet.absoluteFill}>
            <VideoSplashScreen onFinish={() => setSplashFinished(true)} />
          </View>
        )}
        <GlobalAlert />
        <NetworkListener />
      </View>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutContent />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
});
