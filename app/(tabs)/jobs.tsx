// app/(tabs)/jobs.tsx
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useJobs, JobPosting } from '../../hooks/useJobs';
import { Card, EmptyState, Input, LoadingView, Screen } from '../../components/ui';
import { colors, formatUGX, spacing } from '../../constants/theme';

export default function JobsScreen() {
  const { jobs, loading, fetchJobs } = useJobs();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { fetchJobs(); }, [fetchJobs]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs(search);
    setRefreshing(false);
  };

  return (
    <Screen>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Text style={styles.title}>Jobs</Text>
        <Input
          placeholder="Search jobs..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchJobs(search)}
          returnKeyType="search"
        />
      </View>

      {loading && jobs.length === 0 ? (
        <LoadingView />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState title="No jobs found" subtitle="Check back soon or try a different search." icon="briefcase-outline" />}
          renderItem={({ item }) => <JobCard job={item} />}
        />
      )}
    </Screen>
  );
}

function JobCard({ job }: { job: JobPosting }) {
  return (
    <Pressable onPress={() => router.push(`/jobs/${job.id}`)}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
          {job.is_featured && <Ionicons name="star" size={16} color="#f59e0b" />}
        </View>
        <Text style={styles.jobEmployer}>{job.employer.company_name}</Text>
        <View style={styles.jobMetaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.jobMeta}>{job.location}</Text>
        </View>
        <Text style={styles.jobSalary}>{formatUGX(job.salary_min)} - {formatUGX(job.salary_max)}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  jobTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  jobEmployer: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  jobMeta: { fontSize: 13, color: colors.textMuted },
  jobSalary: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
});
