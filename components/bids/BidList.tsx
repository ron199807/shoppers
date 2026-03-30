import { Bid } from '../../types';

interface BidListProps {
  bids: Bid[];
  onAcceptBid: (bid: Bid) => void;
}

export default function BidList({ bids, onAcceptBid }: BidListProps) {
  if (bids.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No bids received yet. Be the first to place a bid!
      </div>
    );
  }

  // Safely format currency
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      {bids.map((bid) => (
        <div key={bid.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg">{bid.shopper?.full_name || 'Anonymous Shopper'}</h3>
              <p className="text-sm text-gray-500">
                Bid placed on {new Date(bid.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(bid.amount)}</p>
              {bid.shopper?.rating && bid.shopper.rating > 0 && (
                <p className="text-sm text-yellow-600">⭐ {bid.shopper.rating} / 5</p>
              )}
            </div>
          </div>

          {bid.message && (
            <div className="mb-3 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-700">{bid.message}</p>
            </div>
          )}

          {bid.estimated_delivery_time && (
            <p className="text-sm text-gray-600 mb-3">
              📅 Estimated delivery: {new Date(bid.estimated_delivery_time).toLocaleString()}
            </p>
          )}

          <button
            onClick={() => onAcceptBid(bid)}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Accept This Bid
          </button>
        </div>
      ))}
    </div>
  );
}