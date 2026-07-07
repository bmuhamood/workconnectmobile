// app/payments/index.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Badge, Card, EmptyState, LoadingView, Screen } from '../../components/ui';
import { colors, formatUGX, formatDate, spacing } from '../../constants/theme';

export default function PaymentsScreen() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!workerProfile) { setLoading(false); return; }
      const { data } = await supabase
        .from('worker_payments')
        .select('*, contracts(job_title)')
        .eq('worker_id', workerProfile.id)
        .order('created_at', { ascending: false });
      setPayments(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const totalReceived = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.net_amount, 0);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Payments' }} />
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Card>
          <Text style={styles.totalLabel}>Total Received</Text>
          <Text style={styles.totalAmount}>{formatUGX(totalReceived)}</Text>
        </Card>
      </View>

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={<EmptyState title="No payments yet" icon="wallet-outline" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => item.status === 'completed' && router.push(`/payments/${item.id}`)}>
              <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle} numberOfLines={1}>{item.contracts?.job_title ?? 'Contract payment'}</Text>
                  <Text style={styles.date}>{formatDate(item.scheduled_date)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.amount}>{formatUGX(item.net_amount)}</Text>
                  <Badge text={item.status} tone={item.status === 'completed' ? 'success' : item.status === 'failed' ? 'danger' : 'warning'} />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  totalLabel: { fontSize: 13, color: colors.textMuted },
  totalAmount: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 4 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700', color: colors.text },
});
