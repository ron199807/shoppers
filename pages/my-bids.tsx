import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { getShopperBids, BidWithList } from '../lib/api/bids';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Status Configuration with Icons and Colors
const BID_STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    color: 'warning',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: '⏳',
    badge: 'bg-amber-100 text-amber-800',
    message: 'Your bid is under review. The client will review all bids and select one soon.'
  },
  accepted: {
    label: 'Accepted 🎉',
    color: 'success',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: '✅',
    badge: 'bg-emerald-100 text-emerald-800',
    message: 'Congratulations! Your bid was accepted. Start shopping and communicate with the client.'
  },
  rejected: {
    label: 'Not Selected',
    color: 'error',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: '❌',
    badge: 'bg-red-100 text-red-800',
    message: 'Your bid was not selected for this list. Keep browsing for more opportunities!'
  }
} as const;

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 py-8">
    <div className="container mx-auto px-4 max-w-4xl">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div className="h-10 w-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
        <div className="h-6 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
      </div>

      {/* Bids List Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
              <div className="h-8 w-28 bg-gray-200 rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[...Array(3)].map((_, j) => (
                <div key={j}>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2 animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
              ))}
            </div>
            <div className="flex space-x-3">
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center"
  >
    <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">No bids placed yet</h3>
    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
      Start bidding on shopping lists to help clients and earn money
    </p>
    <Link href="/">
      <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Browse Available Lists
      </button>
    </Link>
  </motion.div>
);

// Access Denied Component
const AccessDenied = () => (
  <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V8a4 4 0 00-8 0v3h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-6">
            This page is only available for shoppers. Please switch to a shopper account to view and manage your bids.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  </ProtectedRoute>
);

// Bid Card Component
const BidCard = ({ 
  bid, 
  onWithdraw, 
  isWithdrawing 
}: { 
  bid: BidWithList; 
  onWithdraw: (id: string) => void; 
  isWithdrawing: boolean;
}) => {
  const status = BID_STATUS_CONFIG[bid.status];
  const statusConfig = BID_STATUS_CONFIG[bid.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1 hover:text-blue-600 transition-colors">
              {bid.list.title}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Posted by {bid.list.client?.full_name || 'Anonymous'}</span>
              {bid.list.client?.rating > 0 && (
                <span className="inline-flex items-center gap-1 text-yellow-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  {bid.list.client.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <span className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            ${status.bg} ${status.text} border ${status.border} shrink-0
          `}>
            <span className="text-base">{status.icon}</span>
            {status.label}
          </span>
        </div>

        {/* Bid Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Your Bid</p>
            <p className="text-2xl font-bold text-emerald-600">${bid.amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">List Budget</p>
            <p className="text-base font-semibold text-gray-900">
              ${bid.list.budget?.toFixed(2) || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Placed On</p>
            <p className="text-base font-medium text-gray-700">
              {new Date(bid.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Bid Message */}
        {bid.message && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-700">Your message:</span>
              <br />
              {bid.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Link href={`/list/${bid.list.id}`}>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View List Details
            </button>
          </Link>
          
          {bid.status === 'accepted' && (
            <Link href={`/messages?conversation=${bid.list.id}`}>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message Client
              </button>
            </Link>
          )}

          {bid.status === 'pending' && (
            <button
              onClick={() => onWithdraw(bid.id)}
              disabled={isWithdrawing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWithdrawing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Withdrawing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Withdraw Bid
                </>
              )}
            </button>
          )}
        </div>

        {/* Status Message */}
        <div className={`mt-4 p-4 rounded-lg border ${status.bg} ${status.border}`}>
          <div className="flex items-start gap-2">
            <span className="text-lg">{status.icon}</span>
            <p className={`text-sm ${status.text}`}>
              {statusConfig.message}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function MyBids() {
  const { user, profile, loading: authLoading } = useAuth();
  const [bids, setBids] = useState<BidWithList[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const fetchMyBids = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID, skipping fetch');
      return;
    }
    
    console.log('Fetching bids for shopper ID:', user.id);
    
    try {
      setLoading(true);
      const data = await getShopperBids(user.id);
      console.log('Fetched bids:', data);
      console.log('Number of bids:', data?.length);
      setBids(data || []);
    } catch (err) {
      console.error('Error fetching bids:', err);
      toast.error('Failed to load your bids');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user || profile?.user_type !== 'shopper') return;
    fetchMyBids();
  }, [user, profile, fetchMyBids]);

  const handleWithdrawBid = useCallback(async (bidId: string) => {
    if (!confirm('⚠️ Are you sure you want to withdraw this bid? This action cannot be undone.')) {
      return;
    }

    setWithdrawing(bidId);
    try {
      const { error } = await supabase
        .from('bids')
        .delete()
        .eq('id', bidId)
        .eq('shopper_id', user?.id);

      if (error) throw error;
      
      toast.success('Bid withdrawn successfully');
      await fetchMyBids();
    } catch (error) {
      console.error('Error withdrawing bid:', error);
      toast.error('Failed to withdraw bid');
    } finally {
      setWithdrawing(null);
    }
  }, [user?.id, fetchMyBids]);

  const stats = useMemo(() => ({
    total: bids.length,
    pending: bids.filter(b => b.status === 'pending').length,
    accepted: bids.filter(b => b.status === 'accepted').length,
    rejected: bids.filter(b => b.status === 'rejected').length,
  }), [bids]);

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  if (profile?.user_type !== 'shopper') {
    return <AccessDenied />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-white/95">
          <div className="container mx-auto px-4 max-w-4xl py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  My Bids
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Track and manage all your bids on shopping lists
                </p>
              </div>
              <Link href="/">
                <button className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
                  <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="font-medium">Back to Dashboard</span>
                </button>
              </Link>
            </div>

            {/* Stats Cards */}
            {bids.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total Bids</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-xs text-amber-600 uppercase tracking-wide">Pending</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-xs text-emerald-600 uppercase tracking-wide">Accepted</p>
                  <p className="text-2xl font-bold text-emerald-700">{stats.accepted}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-600 uppercase tracking-wide">Not Selected</p>
                  <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 max-w-4xl py-8">
          <AnimatePresence mode="wait">
            {bids.length === 0 ? (
              <EmptyState key="empty" />
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {bids.map((bid) => (
                  <BidCard
                    key={bid.id}
                    bid={bid}
                    onWithdraw={handleWithdrawBid}
                    isWithdrawing={withdrawing === bid.id}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProtectedRoute>
  );
}