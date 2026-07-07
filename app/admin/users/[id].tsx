// app/admin/users/[id].tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { Badge, Button, Card, Input, LoadingView, Screen } from '../../../components/ui';
import { colors, formatDate, radius, spacing } from '../../../constants/theme';

const RECORD_TYPES = ['misconduct', 'criminal_record', 'complaint', 'warning', 'policy_violation', 'other'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentAdmin } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [recordType, setRecordType] = useState('misconduct');
  const [severity, setSeverity] = useState('low');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibleToUser, setVisibleToUser] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('disciplinary_records').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    ]);
    setProfile(p);
    setRecords(r ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const toggleBlock = () => {
    if (profile.is_blocked) {
      applyBlock(false, null);
      return;
    }
    if (Platform.OS === 'ios') {
      Alert.prompt('Suspend account', 'Reason (shown to the user):', (reason) => applyBlock(true, reason || 'Policy violation'));
    } else {
      Alert.alert('Suspend account', 'Suspend this account for a policy violation?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Suspend', style: 'destructive', onPress: () => applyBlock(true, 'Policy violation') },
      ]);
    }
  };

  const applyBlock = async (blocked: boolean, reason: string | null) => {
    const { error } = await supabase.from('profiles').update({
      is_blocked: blocked,
      blocked_reason: blocked ? reason : null,
      blocked_at: blocked ? new Date().toISOString() : null,
      blocked_by: blocked ? currentAdmin?.id : null,
    } as any).eq('id', id);
    if (error) return;
    setProfile((prev: any) => ({ ...prev, is_blocked: blocked, blocked_reason: reason }));
    Toast.show({ type: 'success', text1: blocked ? 'Account suspended' : 'Account unblocked' });
  };

  const toggleBlacklist = () => {
    const nowBlacklisted = !profile.is_blacklisted;
    if (nowBlacklisted) {
      Alert.alert('Blacklist account', 'Permanently blacklist this account? This is a strong action for serious violations.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Blacklist', style: 'destructive', onPress: () => applyBlacklist(true) },
      ]);
    } else {
      applyBlacklist(false);
    }
  };

  const applyBlacklist = async (value: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_blacklisted: value } as any).eq('id', id);
    if (error) return;
    setProfile((prev: any) => ({ ...prev, is_blacklisted: value }));
    Toast.show({ type: 'success', text1: value ? 'Account blacklisted' : 'Removed from blacklist' });
  };

  const addRecord = async () => {
    if (!title.trim() || !description.trim()) {
      Toast.show({ type: 'error', text1: 'Fill in a title and description' });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.from('disciplinary_records').insert({
        user_id: id, record_type: recordType, severity, title, description,
        is_visible_to_public: visibleToUser, reported_by: currentAdmin?.id,
      } as any).select().single();
      if (error) throw error;
      setRecords((prev) => [data, ...prev]);
      setShowAddForm(false);
      setTitle(''); setDescription(''); setVisibleToUser(false);
      Toast.show({ type: 'success', text1: 'Disciplinary record added' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to add record', text2: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return <LoadingView />;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: `${profile.first_name} ${profile.last_name}` }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Card>
          <Text style={styles.email}>{profile.email}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.xs }}>
            <Badge text={profile.role} />
            {profile.is_blacklisted && <Badge text="Blacklisted" tone="danger" />}
            {profile.is_blocked && !profile.is_blacklisted && <Badge text="Suspended" tone="warning" />}
          </View>
          {profile.is_blocked && profile.blocked_reason && <Text style={styles.reason}>Reason: {profile.blocked_reason}</Text>}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <Button title={profile.is_blocked ? 'Unblock' : 'Suspend'} variant={profile.is_blocked ? 'outline' : 'danger'} onPress={toggleBlock} style={{ flex: 1 }} />
            <Button title={profile.is_blacklisted ? 'Un-blacklist' : 'Blacklist'} variant={profile.is_blacklisted ? 'outline' : 'danger'} onPress={toggleBlacklist} style={{ flex: 1 }} />
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>Disciplinary Records ({records.length})</Text>
            <Pressable onPress={() => setShowAddForm((v) => !v)}>
              <Text style={styles.addLink}>{showAddForm ? 'Cancel' : '+ Add Record'}</Text>
            </Pressable>
          </View>

          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.chipsWrap}>
                {RECORD_TYPES.map((t) => (
                  <Pressable key={t} onPress={() => setRecordType(t)} style={[styles.chip, recordType === t && styles.chipActive]}>
                    <Text style={[styles.chipText, recordType === t && styles.chipTextActive]}>{t.replace(/_/g, ' ')}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Severity</Text>
              <View style={styles.chipsWrap}>
                {SEVERITIES.map((s) => (
                  <Pressable key={s} onPress={() => setSeverity(s)} style={[styles.chip, severity === s && styles.chipActive]}>
                    <Text style={[styles.chipText, severity === s && styles.chipTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
              <Input label="Title" value={title} onChangeText={setTitle} />
              <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
              <Pressable onPress={() => setVisibleToUser((v) => !v)} style={styles.checkboxRow}>
                <View style={[styles.checkbox, visibleToUser && styles.checkboxOn]} />
                <Text style={styles.checkboxLabel}>Visible to the user themselves (leave off for sensitive records)</Text>
              </Pressable>
              <Button title="Save Record" onPress={addRecord} loading={saving} />
            </View>
          )}

          {records.length === 0 ? (
            <Text style={styles.empty}>No disciplinary history.</Text>
          ) : (
            records.map((r) => (
              <View key={r.id} style={styles.recordItem}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <Badge text={r.record_type.replace(/_/g, ' ')} />
                  <Badge text={r.severity} tone={r.severity === 'critical' ? 'danger' : r.severity === 'high' ? 'warning' : 'default'} />
                  <Text style={styles.recordDate}>{formatDate(r.created_at)}</Text>
                </View>
                <Text style={styles.recordTitle}>{r.title}</Text>
                <Text style={styles.recordDescription}>{r.description}</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  email: { fontSize: 15, fontWeight: '700', color: colors.text },
  reason: { fontSize: 12, color: colors.warning, marginTop: spacing.xs },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  addLink: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  addForm: { marginTop: spacing.md, gap: spacing.xs },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: spacing.xs },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.xs },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xs },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: colors.border },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { flex: 1, fontSize: 12, color: colors.textMuted },
  empty: { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
  recordItem: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm },
  recordDate: { fontSize: 11, color: colors.textLight },
  recordTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 4 },
  recordDescription: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
