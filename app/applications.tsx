// app/applications.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Badge, Card, EmptyState, LoadingView, Screen } from '../components/ui';
import { colors, formatDate, spacing } from '../constants/theme';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  accepted: 'success',
  shortlisted: 'info',
  pending: 'warning',
  rejected: 'danger',
  reviewed: 'info',
  withdrawn: 'default',
};

export default function ApplicationsScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!workerProfile) { setLoading(false); return; }
      const { data } = await supabase
        .from('job_applications')
        .select('id, status, applied_at, cover_letter, job_postings(id, title, location, employer_profiles(company_name, first_name, last_name))')
        .eq('worker_id', workerProfile.id)
        .order('applied_at', { ascending: false });
      setApplications(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'My Applications' }} />
      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={<EmptyState title="No applications yet" subtitle="Apply to a job to see it tracked here." icon="document-text-outline" />}
          renderItem={({ item }) => {
            const job = item.job_postings;
            return (
              <Pressable onPress={() => job && router.push(`/jobs/${job.id}`)}>
                <Card>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.title} numberOfLines={1}>{job?.title ?? 'Job removed'}</Text>
                    <Badge text={item.status} tone={STATUS_TONE[item.status] ?? 'default'} />
                  </View>
                  <Text style={styles.employer}>{job?.employer_profiles?.company_name || `${job?.employer_profiles?.first_name ?? ''} ${job?.employer_profiles?.last_name ?? ''}`}</Text>
                  <Text style={styles.date}>Applied {formatDate(item.applied_at)}</Text>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  employer: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  date: { fontSize: 12, color: colors.textLight, marginTop: spacing.xs },
});
