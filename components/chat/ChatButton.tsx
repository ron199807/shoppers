import { useState } from 'react';
import { getOrCreateConversation } from '../../lib/api/chat';
import ChatInterface from './ChatInterface';

interface ChatButtonProps {
  listId: string;
  clientId: string;
  shopperId: string;
  currentUserId: string;
}

export default function ChatButton({ listId, clientId, shopperId, currentUserId }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openChat = async () => {
    if (conversationId) {
      setIsOpen(true);
      return;
    }

    setLoading(true);
    try {
      const conversation = await getOrCreateConversation(listId, clientId, shopperId);
      setConversationId(conversation.id);
      setIsOpen(true);
    } catch (error) {
      console.error('Error opening chat:', error);
      alert('Failed to open chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openChat}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Opening...' : '💬 Message'}
      </button>

      {/* Chat Modal */}
      {isOpen && conversationId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
            <div className="flex-1">
              <ChatInterface 
                conversationId={conversationId} 
                onClose={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}