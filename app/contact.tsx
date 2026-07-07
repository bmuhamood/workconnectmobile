// app/contact.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, Input, Screen } from '../components/ui';
import { colors, spacing } from '../constants/theme';

export default function ContactScreen() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) {
      Toast.show({ type: 'error', text1: 'Fill in all required fields' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('contact_submissions').insert({
        name: form.name, email: form.email, phone: form.phone || null,
        subject: form.subject, message: form.message, submitted_by: user?.id ?? null,
      } as any);
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to send message', text2: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen>
        <Stack.Screen options={{ headerShown: true, title: 'Contact Us' }} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {sent ? (
            <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={styles.sentTitle}>Message Sent</Text>
              <Text style={styles.sentSubtitle}>We'll get back to you within 24 hours.</Text>
            </Card>
          ) : (
            <>
              <Text style={styles.intro}>
                Questions, feedback, or need help? Send us a message and our team will respond within 24 hours.
              </Text>
              <Input label="Your Name *" value={form.name} onChangeText={(v) => update('name', v)} />
              <Input label="Email *" value={form.email} onChangeText={(v) => update('email', v)} autoCapitalize="none" keyboardType="email-address" />
              <Input label="Phone" value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" />
              <Input label="Subject *" value={form.subject} onChangeText={(v) => update('subject', v)} />
              <Input
                label="Message *"
                value={form.message}
                onChangeText={(v) => update('message', v)}
                multiline
                numberOfLines={5}
                style={{ height: 120, textAlignVertical: 'top' }}
              />
              <Button title="Send Message" onPress={handleSubmit} loading={submitting} style={{ marginTop: spacing.md }} />
            </>
          )}
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 20 },
  sentTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  sentSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});
