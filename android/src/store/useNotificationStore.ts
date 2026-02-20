import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  date: number;
  read: boolean;
  data?: any;
}

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'read' | 'date'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (notification) => {
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Date.now().toString(),
              date: Date.now(),
              read: false,
            },
            ...state.notifications,
          ],
        }));
      },
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },
      clearAll: () => {
        set({ notifications: [] });
      },
      unreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
