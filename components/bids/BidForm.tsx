import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface BidFormProps {
  listId: string;
  onBidPlaced: () => void;
  onCancel: () => void;
}

export default function BidForm({ listId, onBidPlaced, onCancel }: BidFormProps) {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate amount
    const bidAmount = parseFloat(amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      setError('Please enter a valid bid amount');
      setLoading(false);
      return;
    }

    try {
      const { error: bidError } = await supabase
        .from('bids')
        .insert([
          {
            list_id: listId,
            shopper_id: user?.id,
            amount: bidAmount,
            message: message.trim() || null,
            estimated_delivery_time: estimatedDeliveryTime || null,
            status: 'pending',
          },
        ]);

      if (bidError) throw bidError;

      onBidPlaced();
    } catch (err) {
      console.error('Error placing bid:', err);
      setError('Failed to place bid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-gray-700 text-lg font-semibold mb-4">Place Your Bid</h3>
      
      {error && (
        <div className="bg-red-500 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bid Amount ($) *
        </label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your bid amount"
        />
        <p className="text-gray-900 text-xs text-gray-500 mt-1">
          This is how much you'll charge for shopping and delivering the items
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estimated Delivery Time
        </label>
        <input
          type="datetime-local"
          value={estimatedDeliveryTime}
          onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
          className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message to Client (Optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Introduce yourself and explain why you're a good fit for this shopping task..."
        />
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Placing Bid...' : 'Submit Bid'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}