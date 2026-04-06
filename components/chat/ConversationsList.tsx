import { useConversations } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { Conversation } from '../../types';
import { motion } from 'framer-motion';
import { 
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export default function ConversationsList({ 
  onSelectConversation, 
  selectedConversationId 
}: ConversationsListProps) {
  const { user } = useAuth();
  const { conversations, loading, error } = useConversations(user?.id);

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.client_id === user?.id) {
      return conversation.shopper;
    }
    return conversation.client;
  };

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error loading conversations</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">
          No conversations yet.
          <br />
          <span className="text-xs text-gray-400">
            Conversations start when you accept a bid or your bid is accepted
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conversation, index) => {
        const otherParticipant = getOtherParticipant(conversation);
        const isSelected = conversation.id === selectedConversationId;
        const hasUnread = false; // You can implement unread logic here
        
        return (
          <motion.button
            key={conversation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onSelectConversation(conversation)}
            className={`w-full text-left p-4 transition-all duration-200 ${
              isSelected
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-200'
                }`}>
                  {otherParticipant?.avatar_url ? (
                    <img 
                      src={otherParticipant.avatar_url} 
                      alt={otherParticipant.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={`font-semibold truncate ${
                    isSelected ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {otherParticipant?.full_name || 'Unknown User'}
                  </h3>
                  {conversation.last_message_at && (
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <ClockIcon className="w-3 h-3" />
                      <span>{formatLastMessageTime(conversation.last_message_at)}</span>
                    </div>
                  )}
                </div>
                <p className={`text-sm truncate ${
                  isSelected ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {conversation.last_message || 'No messages yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {conversation.list?.title}
                </p>
              </div>
              
              {/* Unread indicator */}
              {hasUnread && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}