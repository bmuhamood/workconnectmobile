// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { LoadingView } from '../../components/ui';
import { colors } from '../../constants/theme';

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingView />;

  // Guests (no user) can browse Jobs and Find Workers freely, matching
  // the web app — only actions like applying, messaging, or posting
  // require login, enforced at the point of that action instead of here.
  const isEmployer = user?.role === 'employer' || user?.role === 'admin' || user?.role === 'super_admin';
  const isWorker = user?.role === 'worker';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: 'Jobs', tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="workers"
        options={{
          title: 'Workers',
          href: isWorker ? null : undefined, // hidden only for the worker role — guests and employers can both browse
          tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          href: user ? undefined : null, // messaging inherently requires an account
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: user ? 'Profile' : 'Login', tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
