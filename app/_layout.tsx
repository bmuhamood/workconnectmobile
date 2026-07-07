// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../hooks/useAuth';
import { subscribeToForegroundMessages } from '../lib/pushNotifications';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  useEffect(() => {
    const unsubscribe = subscribeToForegroundMessages();
    return unsubscribe;
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <Toast />
    </AuthProvider>
  );
}
