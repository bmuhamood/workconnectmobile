// app/saved-jobs.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSavedJobs } from '../hooks/useJobs';
import { Card, EmptyState, LoadingView, Screen } from '../components/ui';
import { colors, formatUGX, spacing } from '../constants/theme';

export default function SavedJobsScreen() {
  const { fetchSavedJobs, toggleSaveJob } = useSavedJobs();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchSavedJobs();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRemove = (jobId: string, title: string) => {
    Alert.alert('Remove saved job?', `"${title}" will be removed from your saved list.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await toggleSaveJob(jobId);
            setItems((prev) => prev.filter((i) => i.job_postings?.id !== jobId));
          } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Failed to remove', text2: err.message });
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Saved Jobs' }} />
      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={<EmptyState title="No saved jobs yet" subtitle="Tap the bookmark icon on any job to save it here." icon="bookmark-outline" />}
          renderItem={({ item }) => {
            const job = item.job_postings;
            if (!job) return null;
            return (
              <Pressable onPress={() => router.push(`/jobs/${job.id}`)}>
                <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
                    <Text style={styles.employer}>{job.employer_profiles?.company_name}</Text>
                    <Text style={styles.salary}>{formatUGX(job.salary_min)} - {formatUGX(job.salary_max)}</Text>
                  </View>
                  <Pressable onPress={() => handleRemove(job.id, job.title)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                  </Pressable>
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
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  employer: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  salary: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
});
