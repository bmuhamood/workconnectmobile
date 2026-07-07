// hooks/useMessages.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface UIMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isSent: boolean;
}

export interface UIConversation {
  id: string;
  participant: { id: string; name: string; role: string };
  lastMessage: string;
  unreadCount: number;
  timestamp: Date;
}

function fullName(p: any) {
  return `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || 'User';
}

export function useMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('conversations')
        .select(
          `*, p1:profiles!conversations_participant_1_fkey(id,first_name,last_name,role), p2:profiles!conversations_participant_2_fkey(id,first_name,last_name,role)`
        )
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      const mapped: UIConversation[] = await Promise.all(
        (data ?? []).map(async (row: any) => {
          const other = row.participant_1 === user.id ? row.p2 : row.p1;
          const [{ count }, { data: lastMsg }] = await Promise.all([
            supabase.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', row.id).eq('receiver_id', user.id).eq('is_read', false),
            supabase.from('messages').select('message_text').eq('conversation_id', row.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          ]);
          return {
            id: row.id,
            participant: { id: other?.id, name: fullName(other), role: other?.role ?? '' },
            lastMessage: lastMsg?.message_text ?? '',
            unreadCount: count ?? 0,
            timestamp: new Date(row.last_message_at),
          };
        })
      );
      setConversations(mapped);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!user) return;
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(
        (data ?? []).map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          content: m.message_text,
          timestamp: new Date(m.created_at),
          isRead: m.is_read,
          isSent: m.sender_id === user.id,
        }))
      );

      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString(), status: 'read' } as any)
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
    },
    [user]
  );

  const sendMessage = useCallback(
    async (conversationId: string, text: string) => {
      if (!user || !text.trim()) return;
      const { data: convRow } = await supabase.from('conversations').select('participant_1, participant_2').eq('id', conversationId).single();
      if (!convRow) return;
      const receiverId = convRow.participant_1 === user.id ? convRow.participant_2 : convRow.participant_1;

      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, receiver_id: receiverId, message_text: text } as any)
        .select()
        .single();
      if (error) throw error;

      setMessages((prev) => [...prev, { id: data.id, senderId: user.id, content: text, timestamp: new Date(data.created_at), isRead: true, isSent: true }]);
    },
    [user]
  );

  const subscribeToConversation = useCallback(
    (conversationId: string) => {
      channelRef.current?.unsubscribe();
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
          const m = payload.new as any;
          setMessages((prev) => {
            if (prev.some((e) => e.id === m.id)) return prev;
            return [...prev, { id: m.id, senderId: m.sender_id, content: m.message_text, timestamp: new Date(m.created_at), isRead: m.is_read, isSent: m.sender_id === user?.id }];
          });
        })
        .subscribe();
      channelRef.current = channel;
      return () => {
        channel.unsubscribe();
      };
    },
    [user]
  );

  const getOrCreateConversation = useCallback(
    async (otherUserId: string) => {
      if (!user) throw new Error('Please log in');
      const [p1, p2] = [user.id, otherUserId].sort();
      const { data: existing } = await supabase.from('conversations').select('id').eq('participant_1', p1).eq('participant_2', p2).maybeSingle();
      if (existing) return existing.id as string;
      const { data, error } = await supabase.from('conversations').insert({ participant_1: p1, participant_2: p2 } as any).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    [user]
  );

  useEffect(() => {
    fetchConversations();
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [fetchConversations]);

  return { conversations, messages, loading, fetchConversations, fetchMessages, sendMessage, subscribeToConversation, getOrCreateConversation };
}
