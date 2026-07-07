// app/post-job.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useJobs } from '../hooks/useJobs';
import { Button, Input, Screen } from '../components/ui';
import { colors, spacing, radius } from '../constants/theme';

export default function PostJobScreen() {
  const { createJobPosting } = useJobs();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', requirements: '',
    salary_min: '', salary_max: '', location: 'Kampala',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('job_categories').select('id, name').eq('is_active', true).order('name').then(({ data }) => setCategories(data ?? []));
  }, []);

  const update = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });

  const handleSubmit = async () => {
    if (!categoryId || !form.title || !form.description || !form.salary_min || !form.salary_max) {
      Toast.show({ type: 'error', text1: 'Fill in all required fields' });
      return;
    }
    setSubmitting(true);
    try {
      await createJobPosting({
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        salary_min: parseInt(form.salary_min),
        salary_max: parseInt(form.salary_max),
        location: form.location,
        category_id: categoryId,
      });
      Toast.show({ type: 'success', text1: 'Job posted as draft', text2: 'Publish it from My Job Postings' });
      router.replace('/my-jobs');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to post job', text2: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen>
        <Stack.Screen options={{ headerShown: true, title: 'Post a Job' }} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.chipsWrap}>
            {categories.map((c) => (
              <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.chip, categoryId === c.id && styles.chipActive]}>
                <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
              </Pressable>
            ))}
          </View>

          <Input label="Job Title *" value={form.title} onChangeText={(v) => update('title', v)} placeholder="e.g. Full-time Nanny" />
          <Input label="Description *" value={form.description} onChangeText={(v) => update('description', v)} multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top' }} />
          <Input label="Requirements" value={form.requirements} onChangeText={(v) => update('requirements', v)} multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Input label="Min Salary (UGX) *" value={form.salary_min} onChangeText={(v) => update('salary_min', v)} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Max Salary (UGX) *" value={form.salary_max} onChangeText={(v) => update('salary_max', v)} keyboardType="numeric" />
            </View>
          </View>
          <Input label="Location" value={form.location} onChangeText={(v) => update('location', v)} />

          <Button title="Post Job" onPress={handleSubmit} loading={submitting} style={{ marginTop: spacing.md }} />
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
});
