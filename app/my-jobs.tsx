// app/my-jobs.tsx
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useJobs, JobPosting } from '../hooks/useJobs';
import { Badge, Button, Card, EmptyState, LoadingView, Screen } from '../components/ui';
import { colors, formatUGX, spacing } from '../constants/theme';

export default function MyJobsScreen() {
  const { fetchEmployerJobs, updateJobStatus } = useJobs();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchEmployerJobs();
    setJobs(data);
    setLoading(false);
  }, [fetchEmployerJobs]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePublish = async (jobId: string) => {
    try {
      await updateJobStatus(jobId, 'active');
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'active' } : j)));
      Toast.show({ type: 'success', text1: 'Job published' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to publish', text2: err.message });
    }
  };

  const handleClose = (jobId: string, title: string) => {
    Alert.alert('Close this job posting?', `"${title}" will no longer accept new applications.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close Job',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateJobStatus(jobId, 'closed');
            setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'closed' } : j)));
            Toast.show({ type: 'success', text1: 'Job closed' });
          } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Failed', text2: err.message });
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'My Job Postings' }} />
      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={<EmptyState title="No job postings yet" subtitle="Post a job to start hiring." icon="briefcase-outline" />}
          renderItem={({ item }) => (
            <Card>
              <Pressable onPress={() => router.push(`/jobs/${item.id}`)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  <Badge text={item.status} tone={item.status === 'active' ? 'success' : item.status === 'draft' ? 'warning' : 'default'} />
                </View>
                <Text style={styles.salary}>{formatUGX(item.salary_min)} - {formatUGX(item.salary_max)}</Text>
              </Pressable>
              <View style={styles.actions}>
                <Button title="Applicants" variant="outline" onPress={() => router.push(`/jobs/${item.id}/applicants`)} style={{ flex: 1 }} />
                {item.status === 'draft' && <Button title="Publish" onPress={() => handlePublish(item.id)} style={{ flex: 1 }} />}
                {item.status === 'active' && <Button title="Close" variant="ghost" onPress={() => handleClose(item.id, item.title)} style={{ flex: 1 }} />}
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  salary: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
