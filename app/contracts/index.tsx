// app/contracts/index.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Badge, Card, EmptyState, LoadingView, Screen } from '../../components/ui';
import { colors, formatUGX, spacing } from '../../constants/theme';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  active: 'success',
  trial: 'warning',
  completed: 'info',
  terminated: 'danger',
  cancelled: 'default',
  draft: 'default',
};

export default function ContractsScreen() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('contracts')
        .select('*, employer_profiles(company_name, first_name, last_name), worker_profiles(first_name, last_name)')
        .order('created_at', { ascending: false });
      setContracts(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Contracts' }} />
      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={<EmptyState title="No contracts yet" icon="documents-outline" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/contracts/${item.id}`)}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.title} numberOfLines={1}>{item.job_title}</Text>
                  <Badge text={item.status} tone={STATUS_TONE[item.status] ?? 'default'} />
                </View>
                <Text style={styles.party}>
                  {user?.role === 'worker'
                    ? item.employer_profiles?.company_name || `${item.employer_profiles?.first_name ?? ''} ${item.employer_profiles?.last_name ?? ''}`
                    : `${item.worker_profiles?.first_name ?? ''} ${item.worker_profiles?.last_name ?? ''}`}
                </Text>
                <Text style={styles.amount}>{formatUGX(item.total_monthly_cost)}/month</Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  party: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  amount: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
});
