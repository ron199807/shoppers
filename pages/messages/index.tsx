import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useConversations } from '../../hooks/useChat';
import ConversationsList from '@/components/chat/ConversationsList';
import ChatInterface from '../../components/chat/ChatInterface';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { Conversation } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  InboxIcon,
  UsersIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { conversations, loading } = useConversations(user?.id);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Messages
                </h1>
                <p className="text-gray-600 mt-2">
                  Chat with clients and shoppers about your shopping tasks
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-5 h-5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-gray-700">Refresh</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Conversations</p>
                  <p className="text-2xl font-bold text-gray-800">{conversations?.length || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Chats</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {conversations?.filter(c => c.last_message).length || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <InboxIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unread</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {conversations?.filter(c => c.last_message).length || 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Chat Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-320px)]">
              {/* Conversations List */}
              <div className="border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h2 className="font-semibold text-lg text-gray-800 flex items-center space-x-2">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
                    <span>Conversations</span>
                    {conversations?.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                        {conversations.length}
                      </span>
                    )}
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ConversationsList 
                    onSelectConversation={setSelectedConversation}
                    selectedConversationId={selectedConversation?.id}
                  />
                </div>
              </div>
              
              {/* Chat Area */}
              <div className="md:col-span-2 bg-gray-50 flex flex-col">
                <AnimatePresence mode="wait">
                  {selectedConversation ? (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col h-full"
                    >
                      {/* Chat Header */}
                      <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {selectedConversation.client?.full_name?.charAt(0) || 
                               selectedConversation.shopper?.full_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {selectedConversation.client_id === user?.id 
                                ? selectedConversation.shopper?.full_name 
                                : selectedConversation.client?.full_name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {selectedConversation.client_id === user?.id ? 'Shopper' : 'Client'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Messages */}
                      <div className="flex-1 overflow-hidden">
                        <ChatInterface conversationId={selectedConversation.id} />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex items-center justify-center"
                    >
                      <div className="text-center px-4">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                          <ChatBubbleLeftRightIcon className="w-12 h-12 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          No conversation selected
                        </h3>
                        <p className="text-gray-500 max-w-sm">
                          Select a conversation from the list to start messaging. 
                          You can chat with clients about shopping tasks or with shoppers about their bids.
                        </p>
                        {conversations?.length === 0 && (
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              💡 Tip: Conversations start automatically when you accept a bid or when your bid is accepted.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Empty State with CTA */}
          {conversations?.length === 0 && !selectedConversation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 text-center"
            >
              <p className="text-gray-500">
                No conversations yet. 
                {profile?.user_type === 'client' 
                  ? ' Accept a bid from a shopper to start chatting!' 
                  : ' Place a bid on a shopping list and wait for the client to accept it!'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}