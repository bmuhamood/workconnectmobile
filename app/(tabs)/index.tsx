// app/(tabs)/index.tsx
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Card, Screen, Button } from '../../components/ui';
import { colors, formatUGX, radius, spacing } from '../../constants/theme';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [completion, setCompletion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    if (!user) return;
    if (user.role === 'worker') {
      const { data: wp } = await supabase
        .from('worker_profiles')
        .select('id, bio, hourly_rate, profession, city')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!wp) return;
      const [{ count: applications }, { count: contracts }, { data: payments }, { count: skillCount }, { count: docCount }] = await Promise.all([
        supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('worker_id', wp.id),
        supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('worker_id', wp.id).in('status', ['trial', 'active']),
        supabase.from('worker_payments').select('net_amount').eq('worker_id', wp.id).eq('status', 'completed'),
        supabase.from('worker_skills').select('id', { count: 'exact', head: true }).eq('worker_id', wp.id),
        supabase.from('worker_documents').select('id', { count: 'exact', head: true }).eq('worker_id', wp.id),
      ]);
      setStats({
        applications: applications ?? 0,
        activeContracts: contracts ?? 0,
        totalEarned: (payments ?? []).reduce((s: number, p: any) => s + p.net_amount, 0),
      });
      // Simple completion heuristic across the fields that actually matter
      // for getting hired: basic info, bio, rate, at least one skill, at
      // least one uploaded document.
      const checks = [!!wp.profession, !!wp.city, !!wp.bio, !!wp.hourly_rate, (skillCount ?? 0) > 0, (docCount ?? 0) > 0];
      setCompletion(Math.round((checks.filter(Boolean).length / checks.length) * 100));
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
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // -------------------------------------------------------------------
  // Guest view — no account yet. Browsing is fully open; only actions
  // like applying, messaging, or posting require login (enforced at that
  // point, not here).
  // -------------------------------------------------------------------
  if (!user) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={styles.greeting}>Welcome to WorkConnect 👋</Text>
          <Text style={styles.guestSubtitle}>Uganda's trusted marketplace for domestic and skilled work.</Text>

          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <Button title="Browse Jobs" onPress={() => router.push('/(tabs)/jobs')} />
            <Button title="Find Workers" variant="outline" onPress={() => router.push('/(tabs)/workers')} />
          </View>

          <Card style={{ marginTop: spacing.xl }}>
            <Text style={styles.cardTitle}>Ready to apply or hire?</Text>
            <Text style={styles.guestCardBody}>Create a free account to apply for jobs, message workers and employers, and manage contracts.</Text>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <Button title="Log In" onPress={() => router.push('/(auth)/login')} />
              <Button title="Create Account" variant="outline" onPress={() => router.push('/(auth)/register-worker')} />
            </View>
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.greeting}>Hi, {user?.first_name} 👋</Text>
        <Text style={styles.role}>{isAdmin ? 'Administrator' : isWorker ? 'Worker' : 'Employer'}</Text>

        {isWorker && (
          <Card style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.cardTitle}>Profile Completion</Text>
              <Text style={styles.completionPct}>{completion}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion}%` }]} />
            </View>
          </Card>
        )}

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

        {!isAdmin && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.cardTitle}>{isWorker ? 'Total Earned' : 'Pending Payments'}</Text>
            <Text style={styles.cardAmount}>{formatUGX(isWorker ? stats.totalEarned ?? 0 : stats.pendingAmount ?? 0)}</Text>
          </Card>
        )}

        {/* Quick Actions — role-specific */}
        <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
        <Text style={styles.sectionSubtitle}>
          {isWorker
            ? 'Everything you need to manage your work profile'
            : isAdmin
            ? 'Everything you need to keep the platform running smoothly'
            : 'Everything you need to manage your hiring'}
        </Text>

        <View style={styles.quickGrid}>
          {isWorker && (
            <>
              <QuickAction icon="person-circle-outline" title="Complete Profile" subtitle="Fill missing information" onPress={() => router.push('/profile-edit')} />
              <QuickAction icon="briefcase-outline" title="Browse Jobs" subtitle="Find new opportunities" onPress={() => router.push('/(tabs)/jobs')} />
              <QuickAction icon="document-attach-outline" title="Update Documents" subtitle="Add new documents" onPress={() => router.push('/documents')} />
              <QuickAction icon="wallet-outline" title="View Earnings" subtitle="Check payment history" onPress={() => router.push('/payments')} />
            </>
          )}
          {!isWorker && !isAdmin && (
            <>
              <QuickAction icon="add-circle-outline" title="Post a Job" subtitle="Reach verified workers" onPress={() => router.push('/post-job')} />
              <QuickAction icon="briefcase-outline" title="My Postings" subtitle="Manage open jobs" onPress={() => router.push('/my-jobs')} />
              <QuickAction icon="people-outline" title="Find Workers" subtitle="Browse verified profiles" onPress={() => router.push('/(tabs)/workers')} />
              <QuickAction icon="receipt-outline" title="Invoices" subtitle="View & pay invoices" onPress={() => router.push('/invoices')} />
            </>
          )}
          {isAdmin && (
            <>
              <QuickAction icon="speedometer-outline" title="Admin Dashboard" subtitle="Platform overview" onPress={() => router.push('/admin')} />
              <QuickAction icon="shield-checkmark-outline" title="Verifications" subtitle="Review pending IDs" onPress={() => router.push('/admin/verifications')} />
              <QuickAction icon="flag-outline" title="Reports" subtitle="Open user reports" onPress={() => router.push('/admin/reports')} />
              <QuickAction icon="people-outline" title="Manage Users" subtitle="Suspend or verify" onPress={() => router.push('/admin/users')} />
            </>
          )}
        </View>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
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

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickCard} onPress={onPress}>
      <View style={styles.quickIconWrap}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text },
  guestSubtitle: { fontSize: 15, color: colors.textMuted, marginTop: 6, lineHeight: 21 },
  guestCardBody: { fontSize: 14, color: colors.textMuted, marginTop: 4, lineHeight: 20 },
  role: { fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  cardTitle: { fontSize: 13, color: colors.textMuted },
  cardAmount: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 4 },
  completionPct: { fontSize: 14, fontWeight: '800', color: colors.primary },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.lg },
  sectionSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  quickSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
