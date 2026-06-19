import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '@/src/types';

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'app-storage',
    }
  )
);
