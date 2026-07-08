// app/index.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import { colors, type } from '../constants/theme';

export default function Index() {
  const { loading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('workconnect:onboarded').then((v) => setOnboarded(v === 'true'));
  }, []);

  // Branded gradient handoff screen instead of a bare spinner — bridges
  // the native splash screen and the first real screen with a consistent
  // look, rather than a jarring flash of plain white.
  if (loading || onboarded === null) {
    return (
      <LinearGradient colors={[colors.heroStart, colors.heroMid, colors.heroEnd]} style={styles.container}>
        <View style={styles.markWrap}>
          <Image source={require('../assets/icon.png')} style={styles.markImage} />
        </View>
        <Text style={styles.brand}>WorkConnect</Text>
      </LinearGradient>
    );
  }

  if (!onboarded) return <Redirect href="/onboarding" />;
  // Guests land in the tabs too — Jobs and Find Workers are public,
  // matching the web app. Login is only required when actually applying,
  // saving, messaging, or posting — enforced at the point of that action,
  // not as a blanket gate here.
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  markWrap: {
    width: 84,
    height: 84,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  markImage: { width: 84, height: 84, borderRadius: 22 },
  brand: { ...type.h2, color: colors.white },
});
