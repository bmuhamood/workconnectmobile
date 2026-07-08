// app/payments/[id].tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { generateAndShareReceipt } from '../../lib/generateReceipt';
import { Button, Card, LoadingView, Screen } from '../../components/ui';
import { colors, formatUGX, formatDate, spacing } from '../../constants/theme';

export default function PayslipScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('worker_payments')
        .select('*, worker_profiles(first_name, last_name, profession), contracts(job_title, employer_profiles(company_name, first_name, last_name))')
        .eq('id', id)
        .single();
      setPayment(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <LoadingView />;
  if (!payment) return <View style={{ padding: spacing.lg }}><Text>Payslip not found.</Text></View>;

  const employer = payment.contracts?.employer_profiles;
  const worker = payment.worker_profiles;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateAndShareReceipt({
        title: 'Payslip',
        reference: payment.payment_reference,
        date: formatDate(payment.scheduled_date),
        partyLeft: { label: 'Employee', name: `${worker?.first_name ?? ''} ${worker?.last_name ?? ''}`, sub: worker?.profession },
        partyRight: {
          label: 'Employer',
          name: employer?.company_name || `${employer?.first_name ?? ''} ${employer?.last_name ?? ''}`,
          sub: payment.contracts?.job_title,
        },
        lineItems: [
          { description: 'Gross Salary', amount: payment.salary_amount },
          ...(payment.deductions > 0 ? [{ description: 'Deductions', amount: -payment.deductions }] : []),
        ],
        total: { label: 'Net Pay', amount: payment.net_amount },
      });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to generate PDF', text2: err.message });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Payslip' }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card>
          <Text style={styles.brand}>WorkConnect</Text>
          <Text style={styles.ref}>Ref: {payment.payment_reference}</Text>
          <Text style={styles.ref}>{formatDate(payment.scheduled_date)}</Text>

          <View style={styles.divider} />

          <Row label="Employee" value={`${worker?.first_name ?? ''} ${worker?.last_name ?? ''}`} />
          <Row label="Employer" value={employer?.company_name || `${employer?.first_name ?? ''} ${employer?.last_name ?? ''}`} />
          <Row label="Position" value={payment.contracts?.job_title ?? '—'} />

          <View style={styles.divider} />

          <Row label="Gross Salary" value={formatUGX(payment.salary_amount)} />
          {payment.deductions > 0 && <Row label="Deductions" value={`-${formatUGX(payment.deductions)}`} />}
          <View style={styles.divider} />
          <Row label="Net Pay" value={formatUGX(payment.net_amount)} bold />

          <View style={styles.divider} />
          <Row label="Method" value={payment.payment_method?.replace(/_/g, ' ') ?? '—'} />
          <Row label="Status" value={payment.status} />
        </Card>

        <Button title="Download / Share PDF" onPress={handleDownload} loading={downloading} style={{ marginTop: spacing.lg }} />

        <Text style={styles.footer}>System-generated payslip · WorkConnect Uganda</Text>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontSize: 17, fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { fontSize: 20, fontWeight: '800', color: colors.text },
  ref: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: colors.textMuted, fontSize: 14, textTransform: 'capitalize' },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  footer: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: spacing.lg },
});
