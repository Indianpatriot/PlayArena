import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ColorMode = 'dark' | 'light';

interface ThemeContextValue {
  colorMode: ColorMode;
  isLightMode: boolean;
  toggleColorMode: () => void;
}

const THEME_STORAGE_KEY = 'playarena-color-mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>('dark');

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (mounted && (stored === 'dark' || stored === 'light')) {
          setColorMode(stored);
        }
      })
      .catch(() => {
        // Keep the dark default when persistence is unavailable.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorMode((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      colorMode,
      isLightMode: colorMode === 'light',
      toggleColorMode,
    }),
    [colorMode, toggleColorMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
