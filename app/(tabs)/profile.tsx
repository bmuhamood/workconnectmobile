// app/(tabs)/profile.tsx
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Button, Card, Screen } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, flexGrow: 1, justifyContent: 'center' }}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.name}>You're browsing as a guest</Text>
            <Text style={styles.role}>Log in or create an account to apply, message, and manage contracts</Text>
          </View>
          <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <Button title="Log In" onPress={() => router.push('/(auth)/login')} />
            <Button title="Join as a Worker" variant="outline" onPress={() => router.push('/(auth)/register-worker')} />
            <Button title="Join as an Employer" variant="ghost" onPress={() => router.push('/(auth)/register-employer')} />
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
          <Text style={styles.role}>{user?.email}</Text>
        </View>

        <Card style={{ marginTop: spacing.lg }}>
          <Row icon="call-outline" label="Phone" value={user?.phone || '—'} />
          <Row icon="shield-checkmark-outline" label="Role" value={user?.role ?? '—'} />
          <Row icon="checkmark-circle-outline" label="Verified" value={user?.is_verified ? 'Yes' : 'Not yet'} />
        </Card>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {user?.role === 'worker' && (
            <>
              <Button title="Edit Profile" onPress={() => router.push('/profile-edit')} />
              <Button title="My Applications" variant="outline" onPress={() => router.push('/applications')} />
              <Button title="My Saved Jobs" variant="outline" onPress={() => router.push('/saved-jobs')} />
              <Button title="My Documents" variant="outline" onPress={() => router.push('/documents')} />
              <Button title="Payments & Payslips" variant="outline" onPress={() => router.push('/payments')} />
            </>
          )}
          {user?.role === 'employer' && (
            <>
              <Button title="Post a Job" onPress={() => router.push('/post-job')} />
              <Button title="My Job Postings" variant="outline" onPress={() => router.push('/my-jobs')} />
              <Button title="Invoices" variant="outline" onPress={() => router.push('/invoices')} />
            </>
          )}
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <Button title="Admin Dashboard" onPress={() => router.push('/admin')} />
          )}
          <Button title="Contracts" variant="outline" onPress={() => router.push('/contracts')} />
          <Button title="Settings" variant="outline" onPress={() => router.push('/settings')} />
          <Button title="Contact Us" variant="ghost" onPress={() => router.push('/contact')} />
          <Button title="Report a Concern" variant="ghost" onPress={() => router.push('/report')} />
          <Button title="Log Out" variant="danger" onPress={confirmLogout} />
        </View>

        <Text style={styles.footer}>WorkConnect · Uganda</Text>
      </ScrollView>
    </Screen>
  );
}

function Row({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { alignItems: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.primary },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  role: { fontSize: 14, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1, fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  footer: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: spacing.xl },
});
