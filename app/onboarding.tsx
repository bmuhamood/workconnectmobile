// app/onboarding.tsx
import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Pressable, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, spacing, type } from '../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  {
    icon: 'briefcase',
    title: 'Find real work,\nfaster',
    subtitle: 'Browse verified job opportunities across Uganda — nannies, drivers, security, and more, tailored to your skills.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Verified,\nrated, trusted',
    subtitle: "Every worker is ID-verified and rated by real employers, so you always know exactly who you're hiring.",
  },
  {
    icon: 'wallet',
    title: 'Get paid,\nreliably',
    subtitle: 'Mobile money payouts, protected contracts, and transparent service fees — every step covered.',
  },
  {
    icon: 'chatbubbles',
    title: 'Stay connected,\ninstantly',
    subtitle: 'Message workers and employers directly and get notified the moment something needs your attention.',
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const finish = async () => {
    await AsyncStorage.setItem('workconnect:onboarded', 'true');
    router.replace('/(auth)/login');
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      finish();
    }
  };

  return (
    <LinearGradient colors={[colors.heroStart, colors.heroMid, colors.heroEnd]} style={{ flex: 1 }}>
      <Pressable onPress={finish} style={styles.skipBtn} hitSlop={12}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}>
            <View style={styles.iconRing}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={44} color={colors.white} />
              </View>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <BlurView intensity={30} tint="dark" style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable onPress={goNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>{index === SLIDES.length - 1 ? 'Get Started' : 'Next'}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.heroStart} />
        </Pressable>
      </BlurView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  skipBtn: { position: 'absolute', top: 56, right: spacing.lg, zIndex: 10, padding: spacing.sm },
  skipText: { color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: '600' },
  iconRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.display, color: colors.white, textAlign: 'center', lineHeight: 38 },
  subtitle: { ...type.body, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: spacing.md, lineHeight: 22, maxWidth: 300 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: colors.white, width: 22 },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  nextText: { color: colors.heroStart, fontWeight: '700', fontSize: 15 },
});
