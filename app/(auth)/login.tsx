// app/(auth)/login.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/ui';
import { colors, radius, spacing, type } from '../../constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Enter your email and password' });
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Login failed', text2: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.heroMid }}>
      <LinearGradient colors={[colors.heroStart, colors.heroMid, colors.heroEnd]} style={styles.hero}>
        <View style={styles.markWrap}>
          <Image source={require('../../assets/icon.png')} style={styles.markImage} />
        </View>
        <Text style={styles.welcome}>Welcome back</Text>
        <Text style={styles.welcomeSub}>Sign in to keep things moving</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <Input label="Email" icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
          <Input label="Password" icon="lock-closed-outline" isPassword value={password} onChangeText={setPassword} placeholder="••••••••" />

          <Link href="/(auth)/forgot-password" style={styles.link}>
            Forgot password?
          </Link>

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.lg }} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>New to WorkConnect?</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button title="Join as a Worker" variant="outline" onPress={() => router.push('/(auth)/register-worker')} />
          <Button title="Join as an Employer" variant="ghost" onPress={() => router.push('/(auth)/register-employer')} style={{ marginTop: spacing.xs }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 76, paddingBottom: 40, paddingHorizontal: spacing.xl, alignItems: 'center' },
  markWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  markImage: { width: 68, height: 68, borderRadius: 18 },
  welcome: { ...type.h1, color: colors.white },
  welcomeSub: { ...type.body, color: 'rgba(255,255,255,0.72)', marginTop: 4 },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -24,
  },
  sheetContent: { padding: spacing.xl, paddingTop: spacing.xl + 4 },
  link: { color: colors.primary, fontWeight: '600', textAlign: 'right', marginTop: -spacing.sm, marginBottom: spacing.xs },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
});
