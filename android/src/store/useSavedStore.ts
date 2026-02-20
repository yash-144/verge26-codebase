import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SavedState {
  savedIds: string[];
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggleSave: (id) => {
        const { savedIds } = get();
        const isAlreadySaved = savedIds.includes(id);
        set({
          savedIds: isAlreadySaved 
            ? savedIds.filter((i) => i !== id) 
            : [...savedIds, id]
        });
      },
      isSaved: (id) => get().savedIds.includes(id),
    }),
    {
      name: 'saved-events-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);