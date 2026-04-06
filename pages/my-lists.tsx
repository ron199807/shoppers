import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { getClientLists } from '../lib/api/lists';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Link from 'next/link';
import { ShoppingList } from '../types';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import ListCard from '@/components/lists/ListCard'; // ← Import the shared component

// Status Configuration with Icons (keep for styling reference if needed)
const STATUS_CONFIG = {
  open: {
    label: 'Open',
    color: 'success',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: '📋',
    badge: 'bg-emerald-100 text-emerald-800'
  },
  in_progress: {
    label: 'In Progress',
    color: 'warning',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: '🔄',
    badge: 'bg-amber-100 text-amber-800'
  },
  completed: {
    label: 'Completed',
    color: 'info',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: '✅',
    badge: 'bg-blue-100 text-blue-800'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'error',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: '❌',
    badge: 'bg-red-100 text-red-800'
  }
} as const;

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
    <div className="container mx-auto px-4 max-w-7xl">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Active Lists Section Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <div className="space-y-3 mb-4">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyState = () => (
  <div className="text-center py-16 px-4">
    <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">No shopping lists yet</h3>
    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
      Create your first shopping list to get started with our platform
    </p>
    <Link href="/create-list">
      <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Your First List
      </button>
    </Link>
  </div>
);

// Access Denied Component
const AccessDenied = () => (
  <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V8a4 4 0 00-8 0v3h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-6">
            This page is only available for clients. Please switch to a client account to access your shopping lists.
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
        </div>
      </div>
    </div>
  </ProtectedRoute>
);

export default function MyLists() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchMyLists = async () => {
    if (!user?.id) {
      console.log('No user ID, skipping fetch');
      return;
    }
    
    console.log('Fetching lists for client ID:', user.id);
    
    try {
      setLoading(true);
      const data = await getClientLists(user.id);
      console.log('Fetched lists:', data);
      console.log('Number of lists:', data?.length);
      setLists(data || []);
    } catch (err) {
      console.error('Error fetching lists:', err);
      toast.error('Failed to load your lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || profile?.user_type !== 'client') return;
    fetchMyLists();
  }, [user, profile]);

  const handleDeleteList = async (listId: string) => {
    if (!confirm('⚠️ Warning: This action cannot be undone. This will permanently delete the list, all items, and all associated bids. Are you sure you want to continue?')) {
      return;
    }

    setActionInProgress(listId);
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId)
        .eq('client_id', user?.id);

      if (error) throw error;
      
      toast.success('List deleted successfully');
      await fetchMyLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Failed to delete list');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancelList = async (listId: string) => {
    if (!confirm('Are you sure you want to cancel this list? This will reject all pending bids and mark the list as cancelled.')) {
      return;
    }

    setActionInProgress(listId);
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ status: 'cancelled' })
        .eq('id', listId)
        .eq('client_id', user?.id);

      if (error) throw error;
      
      toast.success('List cancelled successfully');
      await fetchMyLists();
    } catch (error) {
      console.error('Error cancelling list:', error);
      toast.error('Failed to cancel list');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleEditList = (listId: string) => {
    router.push(`/edit-list/${listId}`);
  };

  // Refresh function to pass to ListCard
  const refreshData = () => {
    fetchMyLists();
  };

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  if (profile?.user_type !== 'client') {
    return <AccessDenied />;
  }

  const activeLists = lists.filter(l => l.status !== 'completed' && l.status !== 'cancelled');
  const completedLists = lists.filter(l => l.status === 'completed' || l.status === 'cancelled');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 max-w-7xl py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  My Shopping Lists
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage and track all your shopping lists
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link href="/create-list">
                  <button className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New List
                  </button>
                </Link>
                <Link href="/">
                  <button className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 max-w-7xl py-8">
          {lists.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Active Lists */}
              {activeLists.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Active Lists</h2>
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {activeLists.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeLists.map(list => (
                      <ListCard 
                        key={list.id} 
                        list={list} 
                        userType="client"
                        currentUserId={user?.id}
                        onDelete={refreshData}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Completed Lists */}
              {completedLists.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Completed & Cancelled</h2>
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {completedLists.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedLists.map(list => (
                      <div key={list.id} className="opacity-75 hover:opacity-100 transition-opacity">
                        <ListCard 
                          key={list.id} 
                          list={list} 
                          userType="client"
                          currentUserId={user?.id}
                          onDelete={refreshData}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}