// app/contracts/[id].tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Badge, Button, Card, LoadingView, Screen } from '../../components/ui';
import { colors, formatDate, formatUGX, spacing } from '../../constants/theme';

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('contracts')
      .select('*, employer_profiles(user_id, company_name, first_name, last_name), worker_profiles(user_id, first_name, last_name)')
      .eq('id', id)
      .single();
    setContract(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleSign = async () => {
    if (!user || !contract) return;
    const isEmployer = contract.employer_profiles?.user_id === user.id;
    const isWorker = contract.worker_profiles?.user_id === user.id;
    if (!isEmployer && !isWorker) return;

    setSigning(true);
    try {
      const patch: any = isEmployer
        ? { signed_by_employer: true, employer_signature_date: new Date().toISOString() }
        : { signed_by_worker: true, worker_signature_date: new Date().toISOString() };
      const { error } = await supabase.from('contracts').update(patch).eq('id', id);
      if (error) throw error;
      Toast.show({ type: 'success', text1: 'Contract signed' });
      load();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to sign', text2: err.message });
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <LoadingView />;
  if (!contract) return <View style={{ padding: spacing.lg }}><Text>Contract not found.</Text></View>;

  const isEmployer = contract.employer_profiles?.user_id === user?.id;
  const isWorker = contract.worker_profiles?.user_id === user?.id;
  const alreadySigned = isEmployer ? contract.signed_by_employer : contract.signed_by_worker;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Contract' }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={styles.title}>{contract.job_title}</Text>
          <Badge text={contract.status} tone={contract.status === 'active' ? 'success' : contract.status === 'trial' ? 'warning' : 'default'} />
        </View>

        <Card style={{ marginTop: spacing.md }}>
          <Row label="Employer" value={contract.employer_profiles?.company_name || `${contract.employer_profiles?.first_name ?? ''} ${contract.employer_profiles?.last_name ?? ''}`} />
          <Row label="Worker" value={`${contract.worker_profiles?.first_name ?? ''} ${contract.worker_profiles?.last_name ?? ''}`} />
          <Row label="Salary" value={formatUGX(contract.worker_salary_amount)} />
          <Row label="Service Fee" value={formatUGX(contract.service_fee_amount)} />
          <Row label="Total" value={formatUGX(contract.total_monthly_cost)} />
          <Row label="Start Date" value={formatDate(contract.start_date)} />
          {contract.trial_end_date && <Row label="Trial Ends" value={formatDate(contract.trial_end_date)} />}
        </Card>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.body}>{contract.job_description}</Text>

        <Text style={styles.sectionTitle}>Signatures</Text>
        <Card>
          <Row label="Employer" value={contract.signed_by_employer ? '✓ Signed' : 'Unsigned'} />
          <Row label="Worker" value={contract.signed_by_worker ? '✓ Signed' : 'Unsigned'} />
        </Card>

        {(isEmployer || isWorker) && !alreadySigned && (
          <Button title="Sign Contract" onPress={handleSign} loading={signing} style={{ marginTop: spacing.xl }} />
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: colors.text, flex: 1, marginRight: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.xs },
  body: { fontSize: 14, color: colors.text, lineHeight: 21 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
