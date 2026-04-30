import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

// Protected route guard — sits inside AuthProvider
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Protected screens: anything not in the auth flow
    const authScreens = ['index', 'welcome', 'player-login', 'owner-login', 'signup'];
    const currentSegment = segments[0] ?? '';
    const isAuthScreen = authScreens.includes(currentSegment);

    if (!isAuthenticated && !isAuthScreen) {
      // Not logged in, trying to access protected area → redirect to welcome
      router.replace('/welcome');
    } else if (isAuthenticated && isAuthScreen && currentSegment !== 'index') {
      // Already logged in, visiting auth screens → go to dashboard
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.neonGreen} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AuthGate>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="player-login" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="owner-login" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="signup" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="dashboard" options={{ animation: 'fade' }} />
            </Stack>
          </AuthGate>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
