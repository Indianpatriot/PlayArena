import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Protected route guard — sits inside AuthProvider
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isLightMode } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Protected screens: anything not in the auth flow
    const authScreens = ['index', 'player-login', 'owner-login', 'signup', 'forgot-password'];
    const currentSegment = String(segments[0] ?? '');
    const isAuthScreen = authScreens.includes(currentSegment);

    if (!isAuthenticated && !isAuthScreen) {
      // Not logged in, trying to access protected area → redirect to player-login
      router.replace('/player-login');
    } else if (isAuthenticated && isAuthScreen && currentSegment !== 'index') {
      // Already logged in, visiting auth screens → go to dashboard
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: isLightMode ? '#F6F8FB' : Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.neonGreen} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <ThemeProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <AuthGate>
              <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="player-login" options={{ animation: 'fade' }} />
                <Stack.Screen name="owner-login" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="signup" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="dashboard" options={{ animation: 'fade' }} />
                <Stack.Screen name="checkout" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="ticket" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="game-feedback" options={{ animation: 'slide_from_right' }} />
              </Stack>
            </AuthGate>
          </AuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </AlertProvider>
  );
}
