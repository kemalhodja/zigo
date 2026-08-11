import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StudentGamificationSnapshot } from "@/lib/domain/gamification/scoring-engine";

export type OfflineProfileState = {
  // Gamification & Economy
  gamification: StudentGamificationSnapshot | null;
  
  // Basic Info
  profileId: string | null;
  role: string | null;
  fullName: string | null;
  
  // App State
  isOfflineMode: boolean;
  
  // Actions
  setProfile: (profile: { id: string; role: string; fullName: string }) => void;
  setGamification: (data: StudentGamificationSnapshot) => void;
  setOfflineMode: (isOffline: boolean) => void;
  clearState: () => void;
};

export const useAppStore = create<OfflineProfileState>()(
  persist(
    (set) => ({
      gamification: null,
      profileId: null,
      role: null,
      fullName: null,
      isOfflineMode: false,

      setProfile: (profile) => 
        set(() => ({ 
          profileId: profile.id, 
          role: profile.role, 
          fullName: profile.fullName 
        })),

      setGamification: (gamification) => 
        set(() => ({ gamification })),

      setOfflineMode: (isOfflineMode) => 
        set(() => ({ isOfflineMode })),

      clearState: () => 
        set(() => ({
          gamification: null,
          profileId: null,
          role: null,
          fullName: null,
        })),
    }),
    {
      name: "zigo-offline-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({ 
        gamification: state.gamification, 
        profileId: state.profileId, 
        role: state.role, 
        fullName: state.fullName 
      }),
    }
  )
);
