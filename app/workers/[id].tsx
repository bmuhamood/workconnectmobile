// app/workers/[id].tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useWorkers, WorkerProfile } from '../../hooks/useWorkers';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../hooks/useAuth';
import { Badge, Button, Card, LoadingView, Screen } from '../../components/ui';
import { colors, formatUGX, spacing } from '../../constants/theme';

export default function WorkerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { fetchWorkerProfile } = useWorkers();
  const { getOrCreateConversation } = useMessages();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchWorkerProfile(id).then((w) => {
      setWorker(w);
      setLoading(false);
    });
  }, [id]);

  const handleMessage = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!worker?.user_id) {
      Toast.show({ type: 'error', text1: "This worker's account is incomplete" });
      return;
    }
    setMessaging(true);
    try {
      const conversationId = await getOrCreateConversation(worker.user_id);
      router.push(`/messages/${conversationId}`);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to start conversation', text2: err.message });
    } finally {
      setMessaging(false);
    }
  };

  if (loading) return <LoadingView />;
  if (!worker) return <View style={{ padding: spacing.lg }}><Text>Worker not found.</Text></View>;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: worker.full_name }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{worker.first_name.charAt(0)}{worker.last_name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{worker.full_name}</Text>
          <Text style={styles.profession}>{worker.profession}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
            {worker.verification_status === 'verified' && <Badge text="Verified" tone="success" />}
            <Badge text={`⭐ ${worker.rating_average?.toFixed(1) ?? 'New'}`} />
          </View>
        </View>

        <Card style={{ marginTop: spacing.lg }}>
          <InfoRow label="City" value={worker.city} />
          <InfoRow label="Experience" value={`${worker.experience_years} years`} />
          {worker.hourly_rate > 0 && <InfoRow label="Rate" value={`${formatUGX(worker.hourly_rate)}/hr`} />}
        </Card>

        {worker.bio && (
          <>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.body}>{worker.bio}</Text>
          </>
        )}

        <View style={{ marginTop: spacing.xl }}>
          <Button title="Message This Worker" onPress={handleMessage} loading={messaging} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '800', color: colors.primary },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  profession: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { color: colors.textMuted, fontSize: 14 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.xs },
  body: { fontSize: 14, color: colors.text, lineHeight: 21 },
});
