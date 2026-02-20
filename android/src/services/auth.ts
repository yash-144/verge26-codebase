import {
  FirebaseAuthTypes,
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
} from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiHelper } from './api';

export type Session = FirebaseAuthTypes.User;

GoogleSignin.configure({
  webClientId:
    '984491381156-kl32ofsehe10i7h55vj9vdb4ptgrg158.apps.googleusercontent.com',
});

const BACKEND_USER_KEY = 'backend_user';
const BACKEND_SYNCED_KEY = 'backend_synced';

let _syncInProgress: Promise<any> | null = null;

export const authService = {
  getSession: (): Session | null => {
    return getAuth().currentUser;
  },

  /**
   * Returns a unified user object.
   * Returns the persistent MongoDB profile (which has _id). Falls back to null.
   */
  getUserSession: async (): Promise<any | null> => {
    const backendUser = await authService.getBackendUser();
    if (backendUser) return backendUser;

    // No backend user persisted yet — caller should trigger sync first
    return null;
  },

  signIn: async (): Promise<Session | null> => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      const idToken =
        (signInResult as any)?.data?.idToken ??
        (signInResult as any)?.idToken;

      if (!idToken) throw new Error('No ID token');

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(
        getAuth(),
        googleCredential
      );

      return userCredential.user;
    } catch (error: any) {
      if (
        error?.code === statusCodes.SIGN_IN_CANCELLED ||
        error?.code === statusCodes.IN_PROGRESS ||
        error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
      ) {
        return null;
      }

      throw error;
    }
  },

  signOut: async (): Promise<void> => {
    try {
      await GoogleSignin.signOut().catch(() => { });
      const auth = getAuth();
      if (auth.currentUser) {
        await firebaseSignOut(auth).catch(() => { });
      }
    } catch (e) {
      // Ignore auth errors on logout
    } finally {
      await AsyncStorage.multiRemove([
        BACKEND_USER_KEY,
        BACKEND_SYNCED_KEY,
      ]);
    }
  },

  onAuthStateChanged: (callback: (user: Session | null) => void) => {
    return firebaseOnAuthStateChanged(getAuth(), callback);
  },

  syncUserWithBackend: async (user: Session): Promise<any> => {
    // If a sync is already in flight, wait for it instead of firing another
    if (_syncInProgress) {
      return _syncInProgress;
    }

    const doSync = async () => {
      try {
        // Check if already synced
        const existing = await authService.getBackendUser();
        if (existing) {
          return existing;
        }

        const response = await apiHelper.fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/users/create`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: user.displayName || 'Unknown',
              email: user.email,
              profilePic: user.photoURL,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(`Backend sync failed (${response.status}): ${data?.message || JSON.stringify(data)}`);
        }

        // Save backend user locally (this contains the MongoDB _id)
        const userData = data.data;
        if (userData) {
          await AsyncStorage.setItem(BACKEND_USER_KEY, JSON.stringify(userData));
          await AsyncStorage.setItem(BACKEND_SYNCED_KEY, 'true');
        }

        return userData;
      } catch (err) {
        return null;
      }
    };

    _syncInProgress = doSync();
    try {
      return await _syncInProgress;
    } finally {
      _syncInProgress = null;
    }
  },

  getBackendUser: async () => {
    const raw = await AsyncStorage.getItem(BACKEND_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  checkEmailVerified: async (email: string): Promise<boolean> => {
    try {
      const response = await apiHelper.fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/get?email=${email}`);
      const data = await response.json();
      return data.data?.emailVerified || false;
    } catch (e) {
      return false;
    }
  },

  sendVerificationCode: async (email: string): Promise<void> => {
    const response = await apiHelper.fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/email`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }
    );

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(data?.message || `Error ${response.status}: Connection failed`);
    }
  },

  confirmVerificationCode: async (email: string, code: string, name?: string): Promise<void> => {
    const response = await apiHelper.fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/email/confirm`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      }
    );



    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(data?.message || `Error ${response.status}: Invalid sequence`);
    }

    // After successful verification, fetch the updated user profile and save it
    try {
      const userRes = await apiHelper.fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/get?email=${email}`);
      const userData = await userRes.json();

      if (userData.status && userData.data) {
        await AsyncStorage.setItem(BACKEND_USER_KEY, JSON.stringify(userData.data));
      } else {
        // User record doesn't exist in MongoDB yet, create it
        const createRes = await apiHelper.fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/users/create`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              name: name || email.split('@')[0],
              emailVerified: true,
            }),
          }
        );
        const createData = await createRes.json();
        if (createData.status && createData.data) {
          await AsyncStorage.setItem(BACKEND_USER_KEY, JSON.stringify(createData.data));
        } else {
          throw new Error(`Failed to create user record: ${JSON.stringify(createData)}`);
        }
      }
    } catch (e) {
      // Don't persist a user without _id — it would cause issues everywhere
    }
  },
};
