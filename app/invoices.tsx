// app/invoices.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Badge, Button, Card, EmptyState, LoadingView, Screen } from '../components/ui';
import { colors, formatUGX, formatDate, spacing } from '../constants/theme';

export default function InvoicesScreen() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('employer_invoices')
        .select('*, contracts(job_title, worker_profiles(first_name, last_name))')
        .order('created_at', { ascending: false });
      setInvoices(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const handlePay = async (invoiceId: string) => {
    setPaying(invoiceId);
    try {
      const { data, error } = await supabase.functions.invoke('initiate-payment', {
        body: { invoice_id: invoiceId, payment_method: 'mobile_money' },
      });
      if (error) throw error;
      if (data?.payment_url) {
        await WebBrowser.openBrowserAsync(data.payment_url);
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to initiate payment', text2: err.message });
    } finally {
      setPaying(null);
    }
  };

  if (loading) return <LoadingView />;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Invoices' }} />
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={<EmptyState title="No invoices yet" icon="receipt-outline" />}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.number}>{item.invoice_number}</Text>
              <Badge text={item.status} tone={item.status === 'paid' ? 'success' : item.status === 'overdue' ? 'danger' : 'warning'} />
            </View>
            <Text style={styles.job}>{item.contracts?.job_title}</Text>
            <Text style={styles.amount}>{formatUGX(item.total_amount)}</Text>
            <Text style={styles.due}>Due {formatDate(item.due_date)}</Text>
            {item.status !== 'paid' && (
              <Button title="Pay Now" onPress={() => handlePay(item.id)} loading={paying === item.id} style={{ marginTop: spacing.sm }} />
            )}
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  number: { fontSize: 15, fontWeight: '700', color: colors.text },
  job: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.xs },
  due: { fontSize: 12, color: colors.textLight, marginTop: 2 },
});
