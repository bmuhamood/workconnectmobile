// app/admin/index.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button, Card, LoadingView, Screen } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    (async () => {
      const [{ count: workers }, { count: employers }, { count: activeContracts }, { count: pendingVerifications }, { count: openReports }] = await Promise.all([
        supabase.from('worker_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('employer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('contracts').select('id', { count: 'exact', head: true }).in('status', ['trial', 'active']),
        supabase.from('worker_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ]);
      setStats({
        workers: workers ?? 0,
        employers: employers ?? 0,
        activeContracts: activeContracts ?? 0,
        pendingVerifications: pendingVerifications ?? 0,
        openReports: openReports ?? 0,
      });
    })();
  }, []);

  if (!stats) return <LoadingView />;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Admin' }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.grid}>
          <StatCard label="Workers" value={stats.workers} />
          <StatCard label="Employers" value={stats.employers} />
          <StatCard label="Active Contracts" value={stats.activeContracts} />
          <StatCard label="Pending Verifications" value={stats.pendingVerifications} highlight={stats.pendingVerifications > 0} />
        </View>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <Button title="Manage Users" onPress={() => router.push('/admin/users')} />
          <Button title="Moderate Jobs" variant="outline" onPress={() => router.push('/admin/jobs')} />
          <Button title="Financial Overview" variant="outline" onPress={() => router.push('/admin/financial')} />
          <Button title={`Verifications${stats.pendingVerifications > 0 ? ` (${stats.pendingVerifications})` : ''}`} variant="outline" onPress={() => router.push('/admin/verifications')} />
          <Button title={`Reports${stats.openReports > 0 ? ` (${stats.openReports})` : ''}`} variant="outline" onPress={() => router.push('/admin/reports')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card style={[styles.statCard, highlight ? { borderColor: colors.warning } : null]}>
      <Text style={[styles.statValue, highlight && { color: colors.warning }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: { width: '47%', alignItems: 'center', paddingVertical: spacing.lg },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});
