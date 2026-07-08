// app/(tabs)/jobs.tsx
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useJobs, JobPosting, JobFilters } from '../../hooks/useJobs';
import { Card, EmptyState, Input, LoadingView, Screen } from '../../components/ui';
import { colors, formatUGX, radius, spacing } from '../../constants/theme';

// Matches web's SALARY_RANGES exactly (app/jobs/page.tsx)
const SALARY_RANGES = [
  { label: 'Any salary', min: 0, max: 0 },
  { label: 'Up to 500k', min: 0, max: 500000 },
  { label: '500k - 1M', min: 500000, max: 1000000 },
  { label: '1M - 2M', min: 1000000, max: 2000000 },
  { label: '2M - 5M', min: 2000000, max: 5000000 },
  { label: 'Over 5M', min: 5000000, max: 0 },
];

export default function JobsScreen() {
  const { jobs, loading, fetchJobs } = useJobs();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [salaryIndex, setSalaryIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const buildFilters = (): JobFilters => ({
    search: search || undefined,
    location: location || undefined,
    min_salary: SALARY_RANGES[salaryIndex].min || undefined,
    max_salary: SALARY_RANGES[salaryIndex].max || undefined,
  });

  useFocusEffect(useCallback(() => { fetchJobs(buildFilters()); }, [fetchJobs]));

  const applyFilters = () => fetchJobs(buildFilters());

  const clearFilters = () => {
    setSearch('');
    setLocation('');
    setSalaryIndex(0);
    fetchJobs({});
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs(buildFilters());
    setRefreshing(false);
  };

  const activeFilterCount = (location ? 1 : 0) + (salaryIndex !== 0 ? 1 : 0);

  return (
    <Screen>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.title}>Jobs</Text>
          <Pressable style={styles.filterToggle} onPress={() => setShowFilters((v) => !v)}>
            <Ionicons name="options-outline" size={18} color={colors.primary} />
            <Text style={styles.filterToggleText}>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</Text>
          </Pressable>
        </View>
        <Input
          placeholder="Search jobs..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={applyFilters}
          returnKeyType="search"
          icon="search-outline"
        />

        {showFilters && (
          <View style={styles.filterPanel}>
            <Input placeholder="Location (e.g. Kampala)" value={location} onChangeText={setLocation} icon="location-outline" />

            <Text style={styles.filterLabel}>Salary range</Text>
            <View style={styles.chipsRow}>
              {SALARY_RANGES.map((range, i) => (
                <Pressable
                  key={range.label}
                  style={[styles.chip, salaryIndex === i && styles.chipActive]}
                  onPress={() => setSalaryIndex(i)}
                >
                  <Text style={[styles.chipText, salaryIndex === i && styles.chipTextActive]}>{range.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <Pressable style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </Pressable>
              <Pressable style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {loading && jobs.length === 0 ? (
        <LoadingView />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState title="No jobs found" subtitle="Try a different search or clear your filters." icon="briefcase-outline" />}
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
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.full, backgroundColor: colors.primaryLight },
  filterToggleText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  filterPanel: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  filterLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: spacing.xs, marginBottom: spacing.xs },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  applyBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  applyBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  clearBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  clearBtnText: { color: colors.textMuted, fontWeight: '700', fontSize: 14 },
  jobTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  jobEmployer: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  jobMeta: { fontSize: 13, color: colors.textMuted },
  jobSalary: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
});
