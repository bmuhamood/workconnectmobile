// app/admin/users.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Badge, Card, Input, LoadingView, Screen } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(300);
      setUsers(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = users.filter((u) => !search || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Users' }} />
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Input placeholder="Search users..." value={search} onChangeText={setSearch} />
      </View>
      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/admin/users/${item.id}`)}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                  {item.is_blacklisted ? <Badge text="Blacklisted" tone="danger" /> : item.is_blocked ? <Badge text="Suspended" tone="warning" /> : <Badge text={item.role} />}
                </View>
                <Text style={styles.email}>{item.email}</Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
