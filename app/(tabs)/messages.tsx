// app/(tabs)/messages.tsx
import { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useMessages, UIConversation } from '../../hooks/useMessages';
import { Badge, Card, EmptyState, LoadingView, Screen } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';

export default function MessagesScreen() {
  const { conversations, loading, fetchConversations } = useMessages();

  useFocusEffect(useCallback(() => { fetchConversations(); }, [fetchConversations]));

  return (
    <Screen>
      <Text style={styles.title}>Messages</Text>

      {loading && conversations.length === 0 ? (
        <LoadingView />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchConversations} />}
          ListEmptyComponent={<EmptyState title="No conversations yet" subtitle="Message a worker or employer to get started." icon="chatbubbles-outline" />}
          renderItem={({ item }) => <ConversationRow conversation={item} />}
        />
      )}
    </Screen>
  );
}

function ConversationRow({ conversation }: { conversation: UIConversation }) {
  return (
    <Pressable onPress={() => router.push(`/messages/${conversation.id}`)}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{conversation.participant.name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.name}>{conversation.participant.name}</Text>
            {conversation.unreadCount > 0 && <Badge text={String(conversation.unreadCount)} tone="info" />}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>{conversation.lastMessage || 'No messages yet'}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.text, padding: spacing.lg, paddingBottom: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  lastMessage: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
