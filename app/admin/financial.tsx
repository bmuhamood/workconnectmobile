// app/admin/financial.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Badge, Card, LoadingView, Screen } from '../../components/ui';
import { colors, formatUGX, formatDate, spacing } from '../../constants/theme';

export default function AdminFinancialScreen() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'invoices' | 'transactions'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingAmount: 0, paidCount: 0, overdueCount: 0 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: invs }, { data: txs }] = await Promise.all([
        supabase.from('employer_invoices').select('*, employer_profiles(company_name, first_name, last_name)').order('created_at', { ascending: false }).limit(50),
        supabase.from('payment_transactions').select('*').order('initiated_at', { ascending: false }).limit(50),
      ]);
      setInvoices(invs ?? []);
      setTransactions(txs ?? []);

      const paid = (invs ?? []).filter((i: any) => i.status === 'paid');
      const pending = (invs ?? []).filter((i: any) => i.status === 'pending');
      const overdue = (invs ?? []).filter((i: any) => i.status === 'overdue');
      setStats({
        totalRevenue: paid.reduce((s: number, i: any) => s + (i.service_fee_amount || 0), 0),
        pendingAmount: pending.reduce((s: number, i: any) => s + (i.total_amount || 0), 0),
        paidCount: paid.length,
        overdueCount: overdue.length,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingView />;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Financial' }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.grid}>
          <Card style={styles.statCard}><Text style={styles.statLabel}>Platform Revenue</Text><Text style={styles.statValue}>{formatUGX(stats.totalRevenue)}</Text></Card>
          <Card style={styles.statCard}><Text style={styles.statLabel}>Pending Amount</Text><Text style={styles.statValue}>{formatUGX(stats.pendingAmount)}</Text></Card>
          <Card style={styles.statCard}><Text style={styles.statLabel}>Paid Invoices</Text><Text style={styles.statValue}>{stats.paidCount}</Text></Card>
          <Card style={[styles.statCard, stats.overdueCount > 0 && { borderColor: colors.danger }]}><Text style={styles.statLabel}>Overdue</Text><Text style={[styles.statValue, { color: colors.danger }]}>{stats.overdueCount}</Text></Card>
        </View>

        <View style={styles.tabsRow}>
          <Pressable onPress={() => setTab('invoices')} style={[styles.tab, tab === 'invoices' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'invoices' && styles.tabTextActive]}>Invoices</Text>
          </Pressable>
          <Pressable onPress={() => setTab('transactions')} style={[styles.tab, tab === 'transactions' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'transactions' && styles.tabTextActive]}>Transactions</Text>
          </Pressable>
        </View>

        {tab === 'invoices' ? (
          <View style={{ gap: spacing.sm }}>
            {invoices.map((inv) => (
              <Card key={inv.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.rowTitle}>{inv.invoice_number}</Text>
                  <Badge text={inv.status} tone={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'} />
                </View>
                <Text style={styles.rowSubtitle}>{inv.employer_profiles?.company_name || `${inv.employer_profiles?.first_name ?? ''} ${inv.employer_profiles?.last_name ?? ''}`}</Text>
                <Text style={styles.rowAmount}>{formatUGX(inv.total_amount)}</Text>
                <Text style={styles.rowDate}>Due {formatDate(inv.due_date)}</Text>
              </Card>
            ))}
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {transactions.map((tx) => (
              <Card key={tx.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.rowTitle}>{tx.external_reference}</Text>
                  <Badge text={tx.status} tone={tx.status === 'successful' ? 'success' : tx.status === 'failed' ? 'danger' : 'warning'} />
                </View>
                <Text style={styles.rowSubtitle}>{tx.transaction_type.replace(/_/g, ' ')} · {tx.payment_provider}</Text>
                <Text style={styles.rowAmount}>{formatUGX(tx.amount)}</Text>
                <Text style={styles.rowDate}>{formatDate(tx.initiated_at)}</Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { width: '47%' },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 4 },
  tabsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tab: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.border },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.white },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowAmount: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: spacing.xs },
  rowDate: { fontSize: 11, color: colors.textLight, marginTop: 2 },
});
