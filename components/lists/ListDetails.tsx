import { useState } from 'react';
import { ShoppingList, Bid } from '../../types';
import BidForm from '../bids/BidForm';
import BidList from '../bids/BidList';

interface ListDetailsProps {
  list: ShoppingList;
  userType: 'client' | 'shopper';
  userId: string;
  onUpdate: (updates: Partial<ShoppingList>) => Promise<void>;
  onBidPlaced?: () => void;
}

export default function ListDetails({ 
  list, 
  userType, 
  userId, 
  onUpdate,
  onBidPlaced 
}: ListDetailsProps) {
  const [showBidForm, setShowBidForm] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const isOwner = list.client_id === userId;
  const hasBid = list.bids?.some(bid => bid.shopper_id === userId);
  const canPlaceBid = userType === 'shopper' && list.status === 'open' && !hasBid;
  const pendingBids = list.bids?.filter(b => b.status === 'pending') || [];
  const selectedBid = list.selected_bid;

  const handleAcceptBid = async (bid: Bid) => {
    if (!confirm(`Accept bid of $${bid.amount?.toFixed(2) || bid.amount} from ${bid.shopper?.full_name}?`)) {
      return;
    }
    
    setUpdating(true);
    try {
      await onUpdate({
        selected_bid_id: bid.id,
        status: 'in_progress',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open for Bids';
      case 'in_progress':
        return 'In Progress - Shopper Assigned';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Safely format currency
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'Not specified';
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* List Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold">{list.title}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(list.status)}`}>
            {getStatusText(list.status)}
          </span>
        </div>
        
        <p className="text-gray-600 mb-4 whitespace-pre-wrap">{list.description || 'No description provided'}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Budget</p>
            <p className="font-semibold text-lg text-green-600">
              {formatCurrency(list.budget)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Delivery Address</p>
            <p className="font-medium">{list.delivery_address || 'Not specified'}</p>
          </div>
          {list.delivery_deadline && (
            <div>
              <p className="text-sm text-gray-500">Delivery Deadline</p>
              <p className="font-medium">
                {new Date(list.delivery_deadline).toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Posted by</p>
            <p className="font-medium">{list.client?.full_name || 'Anonymous'}</p>
            {list.client?.rating && list.client.rating > 0 && (
              <p className="text-sm text-yellow-600">⭐ {list.client.rating} / 5 ({list.client.total_ratings || 0} ratings)</p>
            )}
          </div>
        </div>

        {isOwner && list.status === 'open' && pendingBids.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">No bids received yet. Wait for shoppers to place bids on your list.</p>
          </div>
        )}
      </div>

      {/* Shopping Items */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Shopping List Items</h2>
        {list.items && list.items.length > 0 ? (
          <div className="space-y-2">
            {list.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ×{item.quantity} {item.unit || ''}
                  </span>
                  {item.notes && (
                    <p className="text-xs text-gray-400 mt-1">{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No items added to this list yet.</p>
        )}
      </div>

      {/* Bids Section (for clients) */}
      {userType === 'client' && isOwner && list.status === 'open' && pendingBids.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Received Bids ({pendingBids.length})
          </h2>
          <BidList 
            bids={pendingBids}
            onAcceptBid={handleAcceptBid}
          />
          {updating && (
            <p className="text-center text-gray-500 mt-4">Processing...</p>
          )}
        </div>
      )}

      {/* Selected Shopper (for clients) */}
      {userType === 'client' && isOwner && selectedBid && (
        <div className="bg-green-50 border border-green-200 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2 text-green-800">✓ Shopper Selected</h2>
          <p className="text-green-700">
            You've accepted the bid from <strong>{selectedBid.shopper?.full_name}</strong> for 
            <strong> {formatCurrency(selectedBid.amount)}</strong>.
          </p>
          <p className="text-green-700 mt-2">
            They will start shopping soon. You can message them through the chat.
          </p>
          {selectedBid.message && (
            <div className="mt-3 p-3 bg-green-100 rounded">
              <p className="text-sm text-green-800">
                <strong>Shopper's message:</strong> {selectedBid.message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Place Bid Section (for shoppers) */}
      {userType === 'shopper' && !isOwner && canPlaceBid && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {!showBidForm ? (
            <button
              onClick={() => setShowBidForm(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Place a Bid
            </button>
          ) : (
            <BidForm
              listId={list.id}
              onBidPlaced={() => {
                setShowBidForm(false);
                if (onBidPlaced) onBidPlaced();
              }}
              onCancel={() => setShowBidForm(false)}
            />
          )}
        </div>
      )}

      {/* My Bid Status (for shoppers who already bid) */}
      {userType === 'shopper' && !isOwner && hasBid && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2 text-blue-800">Your Bid Status</h2>
          {list.bids?.map(bid => {
            if (bid.shopper_id === userId) {
              return (
                <div key={bid.id}>
                  <p className="text-blue-700">
                    You placed a bid of <strong>{formatCurrency(bid.amount)}</strong> on{' '}
                    {new Date(bid.created_at).toLocaleDateString()}
                  </p>
                  {bid.message && (
                    <p className="text-blue-700 mt-2 text-sm">
                      Your message: "{bid.message}"
                    </p>
                  )}
                  <p className="text-blue-700 mt-2">
                    Status: <strong className="capitalize">{bid.status}</strong>
                  </p>
                  {bid.status === 'pending' && (
                    <p className="text-yellow-600 mt-2">
                      Waiting for the client to review and accept your bid...
                    </p>
                  )}
                  {bid.status === 'accepted' && (
                    <p className="text-green-600 mt-2">
                      🎉 Congratulations! Your bid was accepted. You can now start shopping.
                    </p>
                  )}
                  {bid.status === 'rejected' && (
                    <p className="text-red-600 mt-2">
                      Unfortunately, your bid was not selected for this task. Keep trying other opportunities!
                    </p>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}