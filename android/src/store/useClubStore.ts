import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Club {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  coordinatorName?: string;
  coordinatorMobile?: string;
}

interface ClubState {
  clubs: Record<string, Club>;
  lastFetched: number | null;
  setClubs: (clubList: Club[]) => void;
  getClub: (id: string) => Club | undefined;
  clearCache: () => void;
}

export const useClubStore = create<ClubState>()(
  persist(
    (set, get) => ({
      clubs: {},
      lastFetched: null,
      setClubs: (clubList) => {
        const clubMap = clubList.reduce((acc, club) => {
          acc[club._id] = club;
          return acc;
        }, {} as Record<string, Club>);
        
        set({ 
          clubs: { ...get().clubs, ...clubMap },
          lastFetched: Date.now()
        });
      },
      getClub: (id) => get().clubs[id],
      clearCache: () => set({ clubs: {}, lastFetched: null }),
    }),
    {
      name: 'club-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
