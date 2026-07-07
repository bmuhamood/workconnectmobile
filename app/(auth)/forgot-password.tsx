// app/(auth)/forgot-password.tsx
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { AuthHero, Button, Input, Screen } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Toast.show({ type: 'error', text1: 'Enter your email' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to send reset email', text2: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ backgroundColor: '#1e1b4b' }}>
      <AuthHero title="Forgot password?" subtitle="We'll email you a reset link" onBack={() => router.back()} />
      <View style={{ flex: 1, backgroundColor: '#f9fafb', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, padding: spacing.xl, paddingTop: spacing.xl + 4 }}>
        {sent ? (
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={28} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Check your inbox</Text>
            <Text style={styles.successText}>We sent a reset link to {email} — check your inbox and spam folder.</Text>
          </View>
        ) : (
          <Input label="Email" icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
        )}

        {!sent && <Button title="Send Reset Link" onPress={handleSubmit} loading={loading} style={{ marginTop: spacing.sm }} />}
        <Button title="Back to Login" variant="ghost" onPress={() => router.replace('/(auth)/login')} style={{ marginTop: spacing.sm }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  successBox: { alignItems: 'center', paddingVertical: spacing.xl },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  successTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  successText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
