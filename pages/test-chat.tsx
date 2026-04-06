import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getOrCreateConversation } from '../lib/api/chat';

export default function TestChat() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);

  const testCreateConversation = async () => {
    if (!user) return;
    
    try {
      const conversation = await getOrCreateConversation(
        'your-list-id-here',
        user.id,
        'shopper-id-here'
      );
      setResult(conversation);
      console.log('Conversation created:', conversation);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: String(error) });
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Chat API</h1>
      <button
        onClick={testCreateConversation}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Test Create Conversation
      </button>
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}