import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Conversation, Message } from '../types';
import {
  getUserConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToMessages,
  subscribeToConversations,
} from '../lib/api/chat';

// Hook for managing conversations
export const useConversations = (userId: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const data = await getUserConversations(userId);
        setConversations(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Subscribe to conversation updates
    const subscription = subscribeToConversations(userId, (updatedConversation) => {
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === updatedConversation.id);
        if (index !== -1) {
          // Update existing conversation
          const newConversations = [...prev];
          newConversations[index] = updatedConversation;
          // Sort by last_message_at
          return newConversations.sort((a, b) => 
            new Date(b.last_message_at || '').getTime() - new Date(a.last_message_at || '').getTime()
          );
        } else {
          // Add new conversation
          return [updatedConversation, ...prev];
        }
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return { conversations, loading, error, setConversations };
};

// Hook for managing messages in a conversation
export const useMessages = (conversationId: string, userId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const data = await getMessages(conversationId);
        setMessages(data);
        
        // Mark messages as read when opening conversation
        if (data.length > 0) {
          await markMessagesAsRead(conversationId, userId);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = subscribeToMessages(conversationId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      
      // Mark new message as read if it's from someone else
      if (newMessage.sender_id !== userId) {
        markMessagesAsRead(conversationId, userId).catch(console.error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, userId]);

  const sendNewMessage = async (content: string) => {
    if (!content.trim()) return;
    
    try {
      setSending(true);
      const newMessage = await sendMessage(conversationId, userId, content);
      setMessages(prev => [...prev, newMessage]);
      setError(null);
      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      throw err;
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, error, sendNewMessage };
};

// Hook for unread message count
export const useUnreadMessages = (userId: string) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('read', false)
          .neq('sender_id', userId);
        
        if (!error) {
          setUnreadCount(data?.length || 0);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Subscribe to new messages to update count in real-time
    const subscription = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.new.sender_id !== userId) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `read=eq.true`,
        },
        (payload) => {
          if (payload.new.sender_id !== userId) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return { unreadCount, loading };
};