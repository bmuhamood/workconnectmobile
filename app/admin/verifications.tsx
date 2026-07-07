// app/admin/verifications.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Badge, Button, Card, EmptyState, LoadingView, Screen } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';

export default function AdminVerificationsScreen() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('worker_documents')
      .select('*, worker_profiles(first_name, last_name)')
      .eq('status', 'pending')
      .order('uploaded_at', { ascending: false });
    setDocs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (doc: any, status: 'verified' | 'rejected') => {
    const { error } = await supabase.from('worker_documents').update({
      status, verified_by: user?.id, verified_at: new Date().toISOString(),
    } as any).eq('id', doc.id);
    if (error) return;

    if (status === 'verified' && doc.document_type === 'national_id') {
      await supabase.from('worker_profiles').update({ verification_status: 'verified' } as any).eq('id', doc.worker_id);
    }
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  };

  if (loading) return <LoadingView />;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Verifications' }} />
      <FlatList
        data={docs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={<EmptyState title="All caught up" subtitle="No pending document verifications." icon="shield-checkmark-outline" />}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.name}>{item.worker_profiles?.first_name} {item.worker_profiles?.last_name}</Text>
              <Badge text={item.document_type.replace(/_/g, ' ')} />
            </View>
            <Text style={styles.viewLink} onPress={() => Linking.openURL(item.document_file_url)}>View Document</Text>
            <View style={styles.actions}>
              <Button title="Approve" onPress={() => decide(item, 'verified')} style={{ flex: 1 }} />
              <Button title="Reject" variant="danger" onPress={() => decide(item, 'rejected')} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  viewLink: { color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
