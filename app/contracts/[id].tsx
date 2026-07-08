// app/contracts/[id].tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
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
        {contract.is_trial && <Text style={styles.trialTag}>Trial period{contract.trial_duration_days ? ` · ${contract.trial_duration_days} days` : ''}</Text>}

        <Text style={styles.sectionTitle}>Parties</Text>
        <Card>
          <Row label="Employer" value={contract.employer_profiles?.company_name || `${contract.employer_profiles?.first_name ?? ''} ${contract.employer_profiles?.last_name ?? ''}`} />
          <Row label="Worker" value={`${contract.worker_profiles?.first_name ?? ''} ${contract.worker_profiles?.last_name ?? ''}`} />
          <Row label="Contract Type" value={contract.contract_type ?? '—'} />
        </Card>

        <Text style={styles.sectionTitle}>Compensation</Text>
        <Card>
          <Row label="Salary" value={formatUGX(contract.worker_salary_amount)} />
          <Row label="Service Fee" value={formatUGX(contract.service_fee_amount)} />
          <Row label="Total Monthly Cost" value={formatUGX(contract.total_monthly_cost)} />
          <Row label="Payment Frequency" value={contract.payment_frequency ?? '—'} />
        </Card>

        <Text style={styles.sectionTitle}>Schedule & Location</Text>
        <Card>
          <Row label="Start Date" value={formatDate(contract.start_date)} />
          {contract.end_date && <Row label="End Date" value={formatDate(contract.end_date)} />}
          {contract.trial_end_date && <Row label="Trial Ends" value={formatDate(contract.trial_end_date)} />}
          <Row label="Work Location" value={contract.work_location ?? '—'} />
          <Row label="Hours / Week" value={String(contract.work_hours_per_week ?? '—')} />
        </Card>

        {contract.work_schedule && Object.keys(contract.work_schedule).length > 0 && (
          <Card style={{ marginTop: spacing.sm }}>
            <Text style={styles.fieldLabel}>Weekly Schedule</Text>
            {Object.entries(contract.work_schedule).map(([day, hours]) => (
              <Row key={day} label={day.charAt(0).toUpperCase() + day.slice(1)} value={String(hours)} />
            ))}
          </Card>
        )}

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.body}>{contract.job_description}</Text>

        {contract.trial_feedback && (
          <>
            <Text style={styles.sectionTitle}>Trial Feedback</Text>
            <Text style={styles.body}>{contract.trial_feedback}</Text>
          </>
        )}

        {contract.termination_reason && (
          <>
            <Text style={styles.sectionTitle}>Termination Reason</Text>
            <Text style={styles.body}>{contract.termination_reason}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Signatures</Text>
        <Card>
          <Row
            label="Employer"
            value={contract.signed_by_employer ? `✓ Signed ${contract.employer_signature_date ? formatDate(contract.employer_signature_date) : ''}` : 'Unsigned'}
          />
          <Row
            label="Worker"
            value={contract.signed_by_worker ? `✓ Signed ${contract.worker_signature_date ? formatDate(contract.worker_signature_date) : ''}` : 'Unsigned'}
          />
        </Card>

        {contract.contract_document_url && (
          <Button
            title="View Full Contract Document"
            variant="outline"
            onPress={() => Linking.openURL(contract.contract_document_url)}
            style={{ marginTop: spacing.md }}
          />
        )}

        {(isEmployer || isWorker) && !alreadySigned && (
          <Button title="Sign Contract" onPress={handleSign} loading={signing} style={{ marginTop: spacing.lg }} />
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
  trialTag: { fontSize: 13, color: colors.warning, fontWeight: '600', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.xs },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.xs },
  body: { fontSize: 14, color: colors.text, lineHeight: 21 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right', flexShrink: 1, marginLeft: spacing.sm },
});
