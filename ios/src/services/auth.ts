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

  setBackendUser: async (user: Session): Promise<void> => {
    await AsyncStorage.setItem(BACKEND_USER_KEY, JSON.stringify(user));
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

  loginWithPassword: async (email: string, password: string): Promise<Session> => {
    const response = await apiHelper.fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/users/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Login failed');
    }

    await authService.setBackendUser(data.data);
    return data.data;
  },

  register: async (name: string, email: string, password: string): Promise<Session> => {
    const response = await apiHelper.fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/users/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Registration failed');
    }

    // User is created but not verified yet. 
    // We can't setBackendUser yet because they need to verify OTP first to login.
    return data.data;
  },

  sendLoginOtp: async (email: string): Promise<void> => {
    const response = await apiHelper.fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/users/login-otp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Failed to send OTP');
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

  confirmVerificationCode: async (email: string, code: string): Promise<Session> => {
    const response = await apiHelper.fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/email/confirm`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Verification failed');
    }

    // After successful verification, fetch the updated user profile and save it
    const userRes = await apiHelper.fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/get?email=${email}`);
    const userData = await userRes.json();

    if (userData.status && userData.data) {
      await authService.setBackendUser(userData.data);
      return userData.data;
    } else {
      throw new Error('Failed to fetch user profile after verification');
    }
  },
};

