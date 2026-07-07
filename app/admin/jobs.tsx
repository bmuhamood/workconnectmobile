// app/admin/jobs.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { Badge, Button, Card, EmptyState, LoadingView, Screen } from '../../components/ui';
import { colors, formatUGX, spacing } from '../../constants/theme';

export default function AdminJobsScreen() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('job_postings')
      .select('*, employer_profiles(company_name, first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(200);
    setJobs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (jobId: string, status: string) => {
    const { error } = await supabase.from('job_postings').update({ status } as any).eq('id', jobId);
    if (error) {
      Toast.show({ type: 'error', text1: 'Failed' });
      return;
    }
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
  };

  const confirmDelete = (jobId: string, title: string) => {
    Alert.alert(
      'Delete job posting?',
      `"${title}" will be cancelled and hidden from the marketplace. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => updateStatus(jobId, 'cancelled') },
      ]
    );
  };

  if (loading) return <LoadingView />;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Moderate Jobs' }} />
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={<EmptyState title="No job postings" icon="briefcase-outline" />}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Badge text={item.status} tone={item.status === 'active' ? 'success' : item.status === 'draft' ? 'warning' : 'default'} />
            </View>
            <Text style={styles.employer}>{item.employer_profiles?.company_name || `${item.employer_profiles?.first_name ?? ''} ${item.employer_profiles?.last_name ?? ''}`}</Text>
            <Text style={styles.salary}>{formatUGX(item.salary_min)} - {formatUGX(item.salary_max)}</Text>
            <View style={styles.actions}>
              {item.status === 'draft' && <Button title="Publish" onPress={() => updateStatus(item.id, 'active')} style={{ flex: 1 }} />}
              {item.status === 'active' && <Button title="Close" variant="outline" onPress={() => updateStatus(item.id, 'closed')} style={{ flex: 1 }} />}
              <Button title="Delete" variant="danger" onPress={() => confirmDelete(item.id, item.title)} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  employer: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  salary: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
