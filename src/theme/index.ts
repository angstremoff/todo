import {createContext, useContext} from 'react';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    accentMuted: string;
    success: string;
    danger: string;
    overlay: string;
    input: string;
  };
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    card: '#F1F5F9',
    text: '#0F172A',
    muted: '#475569',
    border: '#E2E8F0',
    accent: '#0EA5E9',
    accentMuted: '#38BDF8',
    success: '#10B981',
    danger: '#EF4444',
    overlay: 'rgba(15, 23, 42, 0.25)',
    input: '#E2E8F0',
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#0B1224',
    surface: '#0F172A',
    card: '#111827',
    text: '#E2E8F0',
    muted: '#94A3B8',
    border: '#1E293B',
    accent: '#22D3EE',
    accentMuted: '#0EA5E9',
    success: '#34D399',
    danger: '#F87171',
    overlay: 'rgba(0, 0, 0, 0.5)',
    input: '#1E293B',
  },
};

export const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);
