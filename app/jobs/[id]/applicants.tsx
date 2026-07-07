// app/jobs/[id]/applicants.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { Badge, Button, Card, EmptyState, LoadingView, Screen } from '../../../components/ui';
import { colors, spacing } from '../../../constants/theme';

const STATUSES = ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'];

export default function ApplicantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('job_applications')
      .select('id, status, applied_at, cover_letter, worker_profiles(id, user_id, first_name, last_name, profession, city, rating_average, verification_status)')
      .eq('job_posting_id', id)
      .order('applied_at', { ascending: false });
    setApplicants(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (applicationId: string, status: string) => {
    const { error } = await supabase.from('job_applications').update({ status } as any).eq('id', applicationId);
    if (error) {
      Toast.show({ type: 'error', text1: 'Failed to update' });
      return;
    }
    setApplicants((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
  };

  const handleMessage = async (workerUserId: string) => {
    if (!user) return;
    const [p1, p2] = [user.id, workerUserId].sort();
    const { data: existing } = await supabase.from('conversations').select('id').eq('participant_1', p1).eq('participant_2', p2).maybeSingle();
    let conversationId = existing?.id;
    if (!conversationId) {
      const { data, error } = await supabase.from('conversations').insert({ participant_1: p1, participant_2: p2 } as any).select('id').single();
      if (error) return;
      conversationId = data.id;
    }
    router.push(`/messages/${conversationId}`);
  };

  if (loading) return <LoadingView />;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Applicants' }} />
      <FlatList
        data={applicants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={<EmptyState title="No applicants yet" icon="people-outline" />}
        renderItem={({ item }) => {
          const w = item.worker_profiles;
          return (
            <Card>
              <Pressable onPress={() => router.push(`/workers/${w.id}`)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.name}>{w.first_name} {w.last_name}</Text>
                  {w.verification_status === 'verified' && <Badge text="Verified" tone="success" />}
                </View>
                <Text style={styles.meta}>{w.profession} · {w.city} · ⭐ {w.rating_average?.toFixed(1) ?? 'New'}</Text>
              </Pressable>
              {item.cover_letter ? <Text style={styles.coverLetter} numberOfLines={3}>{item.cover_letter}</Text> : null}

              <View style={styles.statusRow}>
                {STATUSES.map((s) => (
                  <Pressable key={s} onPress={() => updateStatus(item.id, s)}>
                    <Badge text={s} tone={item.status === s ? 'info' : 'default'} />
                  </Pressable>
                ))}
              </View>
              <Button title="Message" variant="outline" onPress={() => handleMessage(w.user_id)} style={{ marginTop: spacing.sm }} />
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  coverLetter: { fontSize: 13, color: colors.text, marginTop: spacing.sm, fontStyle: 'italic' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
});
