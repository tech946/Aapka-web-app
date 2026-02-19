import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserWithRoles } from '@/types/roles';

interface UserState {
  user: UserWithRoles | null;
  loading: boolean;
  lastFetched: number | null;
  setUser: (user: UserWithRoles | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
  shouldRefetch: () => boolean;
}

const CACHE_DURATION = 5 * 60 * 1000;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      lastFetched: null,

      setUser: (user) => {
        set({
          user,
          lastFetched: Date.now(),
          loading: false,
        });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      clearUser: () => {
        set({
          user: null,
          lastFetched: null,
          loading: false,
        });
      },

      shouldRefetch: () => {
        const state = get();
        if (!state.user || !state.lastFetched) return true;
        return Date.now() - state.lastFetched > CACHE_DURATION;
      },
    }),
    {
      name: 'web-app-user-store',
      partialize: (state) => ({
        user: state.user,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
