// app/(tabs)/workers.tsx
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkers, WorkerProfile } from '../../hooks/useWorkers';
import { Badge, Card, EmptyState, Input, LoadingView, Screen } from '../../components/ui';
import { colors, formatUGX, spacing } from '../../constants/theme';

export default function WorkersScreen() {
  const { workers, loading, searchWorkers } = useWorkers();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { searchWorkers(); }, [searchWorkers]));

  const onRefresh = async () => {
    setRefreshing(true);
    await searchWorkers(search);
    setRefreshing(false);
  };

  return (
    <Screen>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Text style={styles.title}>Find Workers</Text>
        <Input
          placeholder="Search by name or profession..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => searchWorkers(search)}
          returnKeyType="search"
        />
      </View>

      {loading && workers.length === 0 ? (
        <LoadingView />
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState title="No workers found" subtitle="Try a different search." icon="people-outline" />}
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
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  profession: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  meta: { fontSize: 13, color: colors.textMuted },
  rate: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
});
