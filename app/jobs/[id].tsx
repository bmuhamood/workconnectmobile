// app/jobs/[id].tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useJobs, JobPosting, useSavedJobs } from '../../hooks/useJobs';
import { useAuth } from '../../hooks/useAuth';
import { Badge, Button, Card, LoadingView, Screen } from '../../components/ui';
import { colors, formatDate, formatUGX, spacing } from '../../constants/theme';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { fetchJobById, applyForJob } = useJobs();
  const { savedJobIds, fetchSavedJobIds, toggleSaveJob } = useSavedJobs();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchJobById(id).then((j) => {
      setJob(j);
      setLoading(false);
    });
    fetchSavedJobIds();
  }, [id]);

  const handleApply = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    setApplying(true);
    try {
      await applyForJob(id);
      Toast.show({ type: 'success', text1: 'Application submitted!' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to apply', text2: err.message });
    } finally {
      setApplying(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    try {
      const nowSaved = await toggleSaveJob(id);
      Toast.show({ type: 'success', text1: nowSaved ? 'Job saved' : 'Removed from saved' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: err.message });
    }
  };

  if (loading) return <LoadingView />;
  if (!job) return <View style={{ padding: spacing.lg }}><Text>Job not found.</Text></View>;

  const saved = savedJobIds.includes(id);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Job Details' }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={styles.title}>{job.title}</Text>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={24} color={colors.primary} onPress={handleSave} />
        </View>
        <Text style={styles.employer}>{job.employer.company_name}</Text>

        <View style={styles.metaWrap}>
          <Badge text={job.category_name || 'General'} tone="info" />
          {job.is_featured && <Badge text="Featured" tone="warning" />}
        </View>

        <Card style={{ marginTop: spacing.md }}>
          <MetaRow icon="location-outline" text={job.location} />
          <MetaRow icon="cash-outline" text={`${formatUGX(job.salary_min)} - ${formatUGX(job.salary_max)}`} />
          <MetaRow icon="calendar-outline" text={`Posted ${formatDate(job.created_at)}`} />
        </Card>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.body}>{job.description}</Text>

        {job.requirements && (
          <>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.body}>{job.requirements}</Text>
          </>
        )}

        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <Button title="Apply Now" onPress={handleApply} loading={applying} />
          <Button title={saved ? 'Saved' : 'Save for Later'} variant="outline" onPress={handleSave} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function MetaRow({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 }}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={{ color: colors.text, fontSize: 14 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text, flex: 1, marginRight: spacing.sm },
  employer: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  metaWrap: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.xs },
  body: { fontSize: 14, color: colors.text, lineHeight: 21 },
});
