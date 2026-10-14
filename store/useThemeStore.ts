import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeState {
  mode: ThemeMode;
  primaryColor: string;
  setMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'auto',
  primaryColor: '#6366f1',
  setMode: (mode) => set({ mode }),
  setPrimaryColor: (color) => set({ primaryColor: color }),
}));
