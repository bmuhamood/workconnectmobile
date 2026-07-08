// app/(tabs)/workers.tsx
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkers, WorkerProfile, WorkerFilters } from '../../hooks/useWorkers';
import { Badge, Card, EmptyState, Input, LoadingView, Screen } from '../../components/ui';
import { colors, formatUGX, radius, spacing } from '../../constants/theme';

const AVAILABILITY_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Available', value: 'available' },
  { label: 'Full-time', value: 'full_time' },
  { label: 'Part-time', value: 'part_time' },
  { label: 'Flexible', value: 'flexible' },
];

const MIN_RATING_OPTIONS = [
  { label: 'Any rating', value: 0 },
  { label: '3+ stars', value: 3 },
  { label: '4+ stars', value: 4 },
  { label: '4.5+ stars', value: 4.5 },
];

export default function WorkersScreen() {
  const { workers, loading, searchWorkers } = useWorkers();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [availability, setAvailability] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const buildFilters = (): WorkerFilters => ({
    search: search || undefined,
    city: city || undefined,
    availability: availability || undefined,
    min_rating: minRating || undefined,
  });

  useFocusEffect(useCallback(() => { searchWorkers(buildFilters()); }, [searchWorkers]));

  const applyFilters = () => searchWorkers(buildFilters());

  const clearFilters = () => {
    setSearch('');
    setCity('');
    setAvailability('');
    setMinRating(0);
    searchWorkers({});
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await searchWorkers(buildFilters());
    setRefreshing(false);
  };

  const activeFilterCount = (city ? 1 : 0) + (availability ? 1 : 0) + (minRating ? 1 : 0);

  return (
    <Screen>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.title}>Find Workers</Text>
          <Pressable style={styles.filterToggle} onPress={() => setShowFilters((v) => !v)}>
            <Ionicons name="options-outline" size={18} color={colors.primary} />
            <Text style={styles.filterToggleText}>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</Text>
          </Pressable>
        </View>
        <Input
          placeholder="Search by name or profession..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={applyFilters}
          returnKeyType="search"
          icon="search-outline"
        />

        {showFilters && (
          <View style={styles.filterPanel}>
            <Input placeholder="City (e.g. Kampala)" value={city} onChangeText={setCity} icon="location-outline" />

            <Text style={styles.filterLabel}>Availability</Text>
            <View style={styles.chipsRow}>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.chip, availability === opt.value && styles.chipActive]}
                  onPress={() => setAvailability(opt.value)}
                >
                  <Text style={[styles.chipText, availability === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Minimum rating</Text>
            <View style={styles.chipsRow}>
              {MIN_RATING_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.label}
                  style={[styles.chip, minRating === opt.value && styles.chipActive]}
                  onPress={() => setMinRating(opt.value)}
                >
                  <Text style={[styles.chipText, minRating === opt.value && styles.chipTextActive]}>{opt.label}</Text>
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

      {loading && workers.length === 0 ? (
        <LoadingView />
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState title="No workers found" subtitle="Try a different search or clear your filters." icon="people-outline" />}
          renderItem={({ item }) => <WorkerCard worker={item} />}
        />
      )}
    </Screen>
  );
}

function WorkerCard({ worker }: { worker: WorkerProfile }) {
  return (
    <Pressable onPress={() => router.push(`/workers/${worker.id}`)}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{worker.full_name}</Text>
            <Text style={styles.profession}>{worker.profession} · {worker.city}</Text>
          </View>
          {worker.verification_status === 'verified' && <Badge text="Verified" tone="success" />}
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={14} color="#f59e0b" />
          <Text style={styles.meta}>{worker.rating_average?.toFixed(1) ?? 'New'}</Text>
          <Text style={styles.meta}>· {worker.experience_years} yrs exp</Text>
        </View>
        {worker.hourly_rate > 0 && <Text style={styles.rate}>{formatUGX(worker.hourly_rate)}/hr</Text>}
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
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xs },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  applyBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  applyBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  clearBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  clearBtnText: { color: colors.textMuted, fontWeight: '700', fontSize: 14 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  profession: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  meta: { fontSize: 13, color: colors.textMuted },
  rate: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
});
