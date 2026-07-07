// app/messages/[id].tsx
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMessages, UIMessage } from '../../hooks/useMessages';
import { Button, Input, LoadingView, Screen } from '../../components/ui';
import { colors, spacing } from '../../constants/theme';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { messages, loading, fetchMessages, sendMessage, subscribeToConversation } = useMessages();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    fetchMessages(id);
    const unsubscribe = subscribeToConversation(id);
    return unsubscribe;
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const toSend = text;
    setText('');
    setSending(true);
    try {
      await sendMessage(id, toSend);
    } catch {
      setText(toSend);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Chat' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        {loading && messages.length === 0 ? (
          <LoadingView />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: spacing.md, gap: spacing.xs }}
            renderItem={({ item }) => <MessageBubble message={item} />}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Input value={text} onChangeText={setText} placeholder="Type a message..." style={{ marginBottom: 0 }} />
          </View>
          <Button title="Send" onPress={handleSend} loading={sending} style={styles.sendBtn} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  return (
    <View style={[styles.bubbleRow, message.isSent && { justifyContent: 'flex-end' }]}>
      <View style={[styles.bubble, message.isSent ? styles.bubbleSent : styles.bubbleReceived]}>
        <Text style={message.isSent ? styles.bubbleTextSent : styles.bubbleTextReceived}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleSent: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleReceived: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleTextSent: { color: colors.white, fontSize: 14 },
  bubbleTextReceived: { color: colors.text, fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  sendBtn: { paddingHorizontal: spacing.lg },
});
