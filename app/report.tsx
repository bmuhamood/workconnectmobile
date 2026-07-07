// app/report.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, Input, Screen } from '../components/ui';
import { colors, radius, spacing } from '../constants/theme';

const CATEGORIES = [
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'fraud', label: 'Fraud or scam' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'payment_dispute', label: 'Payment dispute' },
  { value: 'other', label: 'Other' },
];

export default function ReportScreen() {
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [reportedEmail, setReportedEmail] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!category || !description.trim()) {
      Toast.show({ type: 'error', text1: 'Select a category and describe the issue' });
      return;
    }
    setSubmitting(true);
    try {
      let reported_user_id: string | null = null;
      if (reportedEmail.trim()) {
        const { data } = await supabase.from('profiles').select('id').eq('email', reportedEmail.trim().toLowerCase()).maybeSingle();
        reported_user_id = data?.id ?? null;
      }
      const { error } = await supabase.from('reports').insert({
        reporter_id: user?.id ?? null, reported_user_id, category, description,
      } as any);
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to submit report', text2: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen>
        <Stack.Screen options={{ headerShown: true, title: 'Report a Concern' }} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {submitted ? (
            <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={styles.sentTitle}>Report Submitted</Text>
              <Text style={styles.sentSubtitle}>Our team reviews every report and will follow up if needed.</Text>
              <Button title="Return Home" onPress={() => router.push('/(tabs)')} style={{ marginTop: spacing.lg }} />
            </Card>
          ) : (
            <>
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={18} color={colors.danger} />
                <Text style={styles.warningText}>
                  If you're in immediate danger, contact local emergency services first — this form is reviewed by our team, not monitored in real time.
                </Text>
              </View>

              <Text style={styles.label}>Category *</Text>
              <View style={styles.chipsWrap}>
                {CATEGORIES.map((c) => (
                  <Pressable key={c.value} onPress={() => setCategory(c.value)} style={[styles.chip, category === c.value && styles.chipActive]}>
                    <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Input label="Email of person you're reporting (optional)" value={reportedEmail} onChangeText={setReportedEmail} autoCapitalize="none" keyboardType="email-address" />
              <Input
                label="What happened? *"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                style={{ height: 120, textAlignVertical: 'top' }}
                placeholder="Include as much detail as you can — dates, what was said or done, and any relevant context."
              />

              <Button title="Submit Report" onPress={handleSubmit} loading={submitting} style={{ marginTop: spacing.md }} />
            </>
          )}
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  warningBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.dangerLight, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg },
  warningText: { flex: 1, fontSize: 12, color: colors.danger, lineHeight: 17 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.dangerLight, borderColor: colors.danger },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: colors.danger, fontWeight: '600' },
  sentTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  sentSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});
