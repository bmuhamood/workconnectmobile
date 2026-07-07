// app/(auth)/register-employer.tsx
import { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { AuthHero, Button, Input, Screen } from '../../components/ui';
import { spacing } from '../../constants/theme';

export default function RegisterEmployerScreen() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '',
    company_name: '', city: 'Kampala',
  });
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });

  const handleRegister = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.phone || !form.password) {
      Toast.show({ type: 'error', text1: 'Fill in all required fields' });
      return;
    }
    setLoading(true);
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            phone: form.phone,
            first_name: form.first_name,
            last_name: form.last_name,
            role: 'employer',
            registration_method: 'email',
          },
        },
      });
      if (error) throw error;
      const userId = signUpData.user?.id;
      if (!userId) throw new Error('Check your email to confirm your account.');

      const { error: profileError } = await supabase.from('employer_profiles').insert({
        user_id: userId,
        first_name: form.first_name,
        last_name: form.last_name,
        company_name: form.company_name || null,
        city: form.city,
      } as any);
      if (profileError) throw profileError;

      Toast.show({ type: 'success', text1: 'Registered!', text2: 'Check your email to confirm, then log in.' });
      router.replace('/(auth)/login');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Registration failed', text2: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ backgroundColor: '#1e1b4b' }}>
      <AuthHero title="Join as an Employer" subtitle="Hire verified, trusted workers" onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#f9fafb', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xl + 4 }}>
          <Input label="First Name *" icon="person-outline" value={form.first_name} onChangeText={(v) => update('first_name', v)} />
          <Input label="Last Name *" icon="person-outline" value={form.last_name} onChangeText={(v) => update('last_name', v)} />
          <Input label="Email *" icon="mail-outline" value={form.email} onChangeText={(v) => update('email', v)} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Phone *" icon="call-outline" value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" placeholder="+256..." />
          <Input label="Password *" icon="lock-closed-outline" isPassword value={form.password} onChangeText={(v) => update('password', v)} />
          <Input label="Company Name (optional)" icon="business-outline" value={form.company_name} onChangeText={(v) => update('company_name', v)} />
          <Input label="City" icon="location-outline" value={form.city} onChangeText={(v) => update('city', v)} />

          <Button title="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: spacing.sm }} />
          <Button title="Back to Login" variant="ghost" onPress={() => router.replace('/(auth)/login')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
