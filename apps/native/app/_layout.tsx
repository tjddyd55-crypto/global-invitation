import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/src/providers/AppProviders';
import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme/tokens';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === 'idle' || status === 'bootstrapping') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (status === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [status, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const router = useRouter();

  return (
    <AppProviders onUnauthorized={() => router.replace('/(auth)/login')}>
      <StatusBar style="dark" />
      <AuthGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="create/concept" options={{ presentation: 'card' }} />
          <Stack.Screen name="create/template" options={{ presentation: 'card' }} />
          <Stack.Screen name="editor/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="preview/[id]" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="payment/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="payment-success/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="account-security" options={{ presentation: 'card' }} />
        </Stack>
      </AuthGate>
    </AppProviders>
  );
}
