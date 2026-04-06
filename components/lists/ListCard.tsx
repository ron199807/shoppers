import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShoppingList } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';

interface ListCardProps {
  list: ShoppingList;
  userType: 'client' | 'shopper';
  currentUserId?: string;
  onDelete?: () => void;
}

// Status configuration with proper design tokens
const STATUS_CONFIG = {
  open: {
    label: 'Open',
    color: 'success',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: '📋'
  },
  in_progress: {
    label: 'In Progress',
    color: 'warning',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: '🔄'
  },
  completed: {
    label: 'Completed',
    color: 'info',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: '✅'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'error',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: '❌'
  }
} as const;

export default function ListCard({ 
  list, 
  userType, 
  currentUserId, 
  onDelete 
}: ListCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string>('');
  
  const totalItems = list.items?.length || 0;
  const isOwner = list.client_id === currentUserId;
  const hasBid = list.bids?.some(bid => bid.shopper_id === currentUserId);
  const userBid = list.bids?.find(bid => bid.shopper_id === currentUserId);
  const canWithdraw = hasBid && userBid?.status === 'pending';
  
  const status = STATUS_CONFIG[list.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this shopping list? This action cannot be undone and will delete all associated bids and items.')) {
      return;
    }

    setActionType('delete');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Deleting list:', list.id);
      
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', list.id);

      if (error) throw error;
      
      console.log('List deleted successfully');
      alert('List deleted successfully');
      
      // Call the refresh callback to update the UI
      if (onDelete) {
        console.log('Calling onDelete callback');
        onDelete();
      }
      
      // If we're on the list detail page, redirect to dashboard
      if (router.pathname === `/list/${list.id}`) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      setError('Failed to delete list. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
      setActionType('');
    }
  };

  const handleEdit = () => {
    router.push(`/edit-list/${list.id}`);
  };

  const handleWithdrawBid = async () => {
    if (!userBid) return;
    
    if (!confirm('Are you sure you want to withdraw your bid? This action cannot be undone.')) {
      return;
    }

    setActionType('withdraw');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Withdrawing bid:', userBid.id);
      
      const { error } = await supabase
        .from('bids')
        .delete()
        .eq('id', userBid.id)
        .eq('shopper_id', currentUserId);

      if (error) throw error;
      
      console.log('Bid withdrawn successfully');
      alert('Bid withdrawn successfully');
      
      // Call the refresh callback to update the UI
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error withdrawing bid:', error);
      setError('Failed to withdraw bid. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
      setActionType('');
    }
  };

  const handleCancelList = async () => {
    if (!confirm('Are you sure you want to cancel this list? This will reject all pending bids.')) {
      return;
    }

    setActionType('cancel');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Cancelling list:', list.id);
      
      // First, reject all pending bids
      const { error: bidsError } = await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('list_id', list.id)
        .eq('status', 'pending');
      
      if (bidsError) console.error('Error rejecting bids:', bidsError);
      
      // Then update the list status
      const { error } = await supabase
        .from('shopping_lists')
        .update({ status: 'cancelled' })
        .eq('id', list.id);

      if (error) throw error;
      
      console.log('List cancelled successfully');
      alert('List cancelled successfully');
      
      // Call the refresh callback to update the UI
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error cancelling list:', error);
      setError('Failed to cancel list. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
      setActionType('');
    }
  };

  // Determine if a specific action is loading
  const isLoadingDelete = isLoading && actionType === 'delete';
  const isLoadingWithdraw = isLoading && actionType === 'withdraw';
  const isLoadingCancel = isLoading && actionType === 'cancel';

  return (
    <article className="group relative bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
      {/* Error Toast */}
      {error && (
        <div className="absolute top-2 right-2 z-10 bg-red-50 text-red-700 px-3 py-1 rounded-md text-xs font-medium animate-slide-in">
          {error}
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors">
            {list.title}
          </h3>
          <span className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            ${status.bg} ${status.text} border ${status.border} shrink-0
          `}>
            <span className="text-sm">{status.icon}</span>
            {status.label}
          </span>
        </div>

        {/* Description */}
        {list.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {list.description}
          </p>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Items</span>
            <span className="text-lg font-semibold text-gray-900">{totalItems}</span>
          </div>
          
          {list.budget && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Budget</span>
              <span className="text-lg font-semibold text-emerald-600">
                ${list.budget.toFixed(2)}
              </span>
            </div>
          )}
          
          <div className="flex flex-col col-span-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Posted by</span>
            <span className="text-sm font-medium text-gray-700">
              {list.client?.full_name || 'Anonymous'}
            </span>
          </div>

          {list.status === 'in_progress' && list.selected_bid && (
            <div className="flex flex-col col-span-2 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Selected Bid</span>
              <span className="text-sm font-semibold text-emerald-600">
                ${list.selected_bid.amount.toFixed(2)} by {list.selected_bid.shopper?.full_name}
              </span>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <Link href={`/list/${list.id}`}>
          <button 
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {userType === 'client' ? 'View Details' : 
             list.status === 'open' ? 'Place Bid' : 'View Details'}
          </button>
        </Link>
        
        {/* Client Actions - Only show for open lists */}
        {userType === 'client' && isOwner && list.status === 'open' && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              onClick={handleEdit}
              disabled={isLoading}
              className="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Edit
            </button>
            <button
              onClick={handleCancelList}
              disabled={isLoadingCancel}
              className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingCancel ? 'Cancelling...' : 'Cancel'}
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoadingDelete}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingDelete ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
        
        {/* Shopper Actions */}
        {userType === 'shopper' && canWithdraw && (
          <button
            onClick={handleWithdrawBid}
            disabled={isLoadingWithdraw}
            className="mt-3 w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingWithdraw ? 'Withdrawing...' : `Withdraw Bid ($${userBid?.amount.toFixed(2)})`}
          </button>
        )}
        
        {/* Bid Status Messages */}
        {userType === 'shopper' && hasBid && !canWithdraw && (
          <div className="mt-3">
            {userBid?.status === 'pending' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-amber-600 text-sm">⏳</span>
                <p className="text-sm text-amber-700">
                  Your bid (${userBid?.amount.toFixed(2)}) is pending review
                </p>
              </div>
            )}
            
            {userBid?.status === 'accepted' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-emerald-600 text-sm">✓</span>
                <p className="text-sm text-emerald-700">
                  Your bid was accepted! Start shopping now.
                </p>
              </div>
            )}
            
            {userBid?.status === 'rejected' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-red-600 text-sm">✗</span>
                <p className="text-sm text-red-700">
                  Your bid was not selected
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}