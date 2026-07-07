// app/settings.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, Input, LoadingView, Screen } from '../components/ui';
import { colors, spacing } from '../constants/theme';

interface NotificationPrefs {
  email_notifications: boolean;
  email_payments: boolean;
  email_contracts: boolean;
  email_messages: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
}

const PREF_LABELS: [keyof NotificationPrefs, string][] = [
  ['email_notifications', 'Email notifications (master switch)'],
  ['email_payments', 'Payment emails'],
  ['email_contracts', 'Contract emails'],
  ['email_messages', 'New message emails'],
  ['sms_notifications', 'SMS notifications'],
  ['push_notifications', 'Push notifications'],
];

export default function SettingsScreen() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setPhone(user.phone || '');

    (async () => {
      setLoading(true);
      const { data } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        setPrefs(data);
      } else {
        const { data: created } = await supabase.from('notification_preferences').insert({ user_id: user.id } as any).select('*').single();
        if (created) setPrefs(created);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from('profiles').update({ first_name: firstName, last_name: lastName, phone }).eq('id', user.id);
      if (error) throw error;

      if (user.role === 'worker') {
        await supabase.from('worker_profiles').update({ first_name: firstName, last_name: lastName }).eq('user_id', user.id);
      } else if (user.role === 'employer') {
        await supabase.from('employer_profiles').update({ first_name: firstName, last_name: lastName }).eq('user_id', user.id);
      }

      await refreshUser();
      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to update profile', text2: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      Toast.show({ type: 'error', text1: 'Password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Toast.show({ type: 'success', text1: 'Password updated' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to update password', text2: err.message });
    } finally {
      setChangingPassword(false);
    }
  };

  const togglePref = async (key: keyof NotificationPrefs) => {
    if (!user || !prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSavingPrefs(true);
    try {
      const { error } = await supabase.from('notification_preferences').update({ [key]: updated[key] } as any).eq('user_id', user.id);
      if (error) throw error;
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to save preference' });
      setPrefs(prefs);
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading || !user) return <LoadingView />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen>
        <Stack.Screen options={{ headerShown: true, title: 'Settings' }} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
          <Card>
            <Text style={styles.sectionTitle}>Account Info</Text>
            <Text style={styles.sectionSubtitle}>{user.email} · {user.role}</Text>
            <Input label="First Name" value={firstName} onChangeText={setFirstName} />
            <Input label="Last Name" value={lastName} onChangeText={setLastName} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Button title="Save Profile" onPress={handleSaveProfile} loading={savingProfile} />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Change Password</Text>
            <Input label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="At least 8 characters" />
            <Input label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <Button title="Update Password" onPress={handleChangePassword} loading={changingPassword} />
          </Card>

          {prefs && (
            <Card>
              <Text style={styles.sectionTitle}>Notifications</Text>
              {PREF_LABELS.map(([key, label]) => (
                <View key={key} style={styles.prefRow}>
                  <Text style={styles.prefLabel}>{label}</Text>
                  <Pressable
                    onPress={() => togglePref(key)}
                    disabled={savingPrefs}
                    style={[styles.toggle, prefs[key] && styles.toggleOn]}
                  >
                    <View style={[styles.toggleDot, prefs[key] && styles.toggleDotOn]} />
                  </Pressable>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  sectionSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  prefLabel: { flex: 1, fontSize: 14, color: colors.text, marginRight: spacing.sm },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: colors.border, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.primary },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  toggleDotOn: { transform: [{ translateX: 18 }] },
});
