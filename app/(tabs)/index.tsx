// app/(tabs)/index.tsx
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Card, Screen, Button } from '../../components/ui';
import { colors, formatUGX, spacing } from '../../constants/theme';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    if (!user) return;
    if (user.role === 'worker') {
      const { data: wp } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!wp) return;
      const [{ count: applications }, { count: contracts }, { data: payments }] = await Promise.all([
        supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('worker_id', wp.id),
        supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('worker_id', wp.id).in('status', ['trial', 'active']),
        supabase.from('worker_payments').select('net_amount').eq('worker_id', wp.id).eq('status', 'completed'),
      ]);
      setStats({
        applications: applications ?? 0,
        activeContracts: contracts ?? 0,
        totalEarned: (payments ?? []).reduce((s: number, p: any) => s + p.net_amount, 0),
      });
    } else {
      const { data: ep } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!ep) return;
      const [{ count: postings }, { count: contracts }, { data: invoices }] = await Promise.all([
        supabase.from('job_postings').select('id', { count: 'exact', head: true }).eq('employer_id', ep.id),
        supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('employer_id', ep.id).in('status', ['trial', 'active']),
        supabase.from('employer_invoices').select('total_amount').eq('employer_id', ep.id).eq('status', 'pending'),
      ]);
      setStats({
        postings: postings ?? 0,
        activeContracts: contracts ?? 0,
        pendingAmount: (invoices ?? []).reduce((s: number, i: any) => s + i.total_amount, 0),
      });
    }
  }, [user]);

  useFocusEffect(useCallback(() => { loadStats(); }, [loadStats]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const isWorker = user?.role === 'worker';

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.greeting}>Hi, {user?.first_name} 👋</Text>
        <Text style={styles.role}>{user?.role === 'admin' || user?.role === 'super_admin' ? 'Administrator' : isWorker ? 'Worker' : 'Employer'}</Text>

        <View style={styles.statsRow}>
          {isWorker ? (
            <>
              <StatCard label="Applications" value={String(stats.applications ?? 0)} />
              <StatCard label="Active Contracts" value={String(stats.activeContracts ?? 0)} />
            </>
          ) : (
            <>
              <StatCard label="Job Postings" value={String(stats.postings ?? 0)} />
              <StatCard label="Active Contracts" value={String(stats.activeContracts ?? 0)} />
            </>
          )}
        </View>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.cardTitle}>{isWorker ? 'Total Earned' : 'Pending Payments'}</Text>
          <Text style={styles.cardAmount}>{formatUGX(isWorker ? stats.totalEarned ?? 0 : stats.pendingAmount ?? 0)}</Text>
        </Card>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {isWorker ? (
            <Button title="Browse Jobs" onPress={() => router.push('/(tabs)/jobs')} />
          ) : (
            <Button title="Find Workers" onPress={() => router.push('/(tabs)/workers')} />
          )}
          <Button title="Messages" variant="outline" onPress={() => router.push('/(tabs)/messages')} />
          <Button title="Log Out" variant="ghost" onPress={logout} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text },
  role: { fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  cardTitle: { fontSize: 13, color: colors.textMuted },
  cardAmount: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 4 },
});
