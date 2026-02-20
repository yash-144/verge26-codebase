import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiHelper } from './api';

export type Session = {
  _id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  profilePic?: string;
  [key: string]: any;
};

const BACKEND_USER_KEY = 'backend_user';
const BACKEND_SYNCED_KEY = 'backend_synced';

export const authService = {
  /**
   * Returns the persistent MongoDB profile (which has _id).
   */
  getUserSession: async (): Promise<Session | null> => {
    return await authService.getBackendUser();
  },

  signOut: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        BACKEND_USER_KEY,
        BACKEND_SYNCED_KEY,
      ]);
    } catch (e) {
      // Ignore errors on logout
    }
  },

  getBackendUser: async (): Promise<Session | null> => {
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
      console.error('Error persisting user session:', e);
      throw e;
    }
  },
};
