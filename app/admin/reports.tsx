// app/admin/reports.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Badge, Button, Card, EmptyState, LoadingView, Screen } from '../../components/ui';
import { colors, formatDate, spacing } from '../../constants/theme';

export default function AdminReportsScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reports')
      .select('*, reporter:profiles!reports_reporter_id_fkey(first_name,last_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    setReports(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id: string, status: string) => {
    const { error } = await supabase.from('reports').update({ status, resolved_at: new Date().toISOString() } as any).eq('id', id);
    if (!error) setReports((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <LoadingView />;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Reports' }} />
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={<EmptyState title="No open reports" icon="flag-outline" />}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Badge text={item.category.replace(/_/g, ' ')} tone="danger" />
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.reporter}>From: {item.reporter ? `${item.reporter.first_name} ${item.reporter.last_name}` : 'Anonymous'}</Text>
            <View style={styles.actions}>
              <Button title="Mark Resolved" onPress={() => resolve(item.id, 'resolved')} style={{ flex: 1 }} />
              <Button title="Dismiss" variant="ghost" onPress={() => resolve(item.id, 'dismissed')} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: { fontSize: 12, color: colors.textLight },
  description: { fontSize: 14, color: colors.text, marginTop: spacing.sm },
  reporter: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
