import { supabase } from '../supabaseClient';
import { Conversation, Message } from '../../types';

// Get or create a conversation
export const getOrCreateConversation = async (listId: string, clientId: string, shopperId: string) => {
  // First, check if conversation exists
  const { data: existingConversation, error: findError } = await supabase
    .from('conversations')
    .select(`
      *,
      list:shopping_lists(*),
      client:profiles!conversations_client_id_fkey(*),
      shopper:profiles!conversations_shopper_id_fkey(*)
    `)
    .eq('list_id', listId)
    .eq('client_id', clientId)
    .eq('shopper_id', shopperId)
    .maybeSingle();
  
  if (findError && findError.code !== 'PGRST116') {
    console.error('Error finding conversation:', findError);
    throw findError;
  }
  
  if (existingConversation) {
    return existingConversation as Conversation;
  }
  
  // Create new conversation
  const { data: newConversation, error: createError } = await supabase
    .from('conversations')
    .insert([
      {
        list_id: listId,
        client_id: clientId,
        shopper_id: shopperId,
      }
    ])
    .select(`
      *,
      list:shopping_lists(*),
      client:profiles!conversations_client_id_fkey(*),
      shopper:profiles!conversations_shopper_id_fkey(*)
    `)
    .single();
  
  if (createError) {
    console.error('Error creating conversation:', createError);
    throw createError;
  }
  
  return newConversation as Conversation;
};

// Get user's conversations
export const getUserConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      list:shopping_lists(
        *,
        client:profiles!shopping_lists_client_id_fkey(*)
      ),
      client:profiles!conversations_client_id_fkey(*),
      shopper:profiles!conversations_shopper_id_fkey(*)
    `)
    .or(`client_id.eq.${userId},shopper_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
  
  return data as Conversation[];
};

// Get messages for a conversation
export const getMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
  
  return data as Message[];
};

// Send a message
export const sendMessage = async (conversationId: string, senderId: string, content: string) => {
  // Insert the message
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert([
      {
        conversation_id: conversationId,
        sender_id: senderId,
        content: content,
      }
    ])
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(*)
    `)
    .single();
  
  if (messageError) {
    console.error('Error sending message:', messageError);
    throw messageError;
  }
  
  // Update the conversation's last message
  const { error: updateError } = await supabase
    .from('conversations')
    .update({
      last_message: content,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
  
  if (updateError) {
    console.error('Error updating conversation:', updateError);
    // Don't throw here - message was sent successfully
  }
  
  return message as Message;
};

// Mark messages as read for a conversation
export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('read', false)
    .select();
  
  if (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
  
  return data;
};

// Get unread message count for a user
export const getUnreadMessageCount = async (userId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('read', false)
    .neq('sender_id', userId);
  
  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
  
  return data?.length || 0;
};

// Subscribe to new messages in real-time
export const subscribeToMessages = (
  conversationId: string,
  onNewMessage: (message: Message) => void
) => {
  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        // Fetch the full message with sender profile
        const { data: fullMessage } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(*)
          `)
          .eq('id', payload.new.id)
          .single();
        
        if (fullMessage) {
          onNewMessage(fullMessage as Message);
        }
      }
    )
    .subscribe();
  
  return subscription;
};

// Subscribe to conversation updates
export const subscribeToConversations = (
  userId: string,
  onConversationUpdate: (conversation: Conversation) => void
) => {
  const subscription = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `client_id=eq.${userId},shopper_id=eq.${userId}`,
      },
      async (payload) => {
        // Fetch the full conversation with related data
        const { data: fullConversation } = await supabase
          .from('conversations')
          .select(`
            *,
            list:shopping_lists(*),
            client:profiles!conversations_client_id_fkey(*),
            shopper:profiles!conversations_shopper_id_fkey(*)
          `)
          .eq('id', payload.new.id)
          .single();
        
        if (fullConversation) {
          onConversationUpdate(fullConversation as Conversation);
        }
      }
    )
    .subscribe();
  
  return subscription;
};