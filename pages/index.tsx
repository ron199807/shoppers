import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { ShoppingList } from '../types';
import ListCard from '@/components/auth/lists/ListCard';
import Link from 'next/link';

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [openLists, setOpenLists] = useState<ShoppingList[]>([]);
  const [myLists, setMyLists] = useState<ShoppingList[]>([]);
  const [myActiveBids, setMyActiveBids] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch open shopping lists
    const fetchOpenLists = async () => {
      const { data } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          client:profiles(*),
          items:list_items(*)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (data) setOpenLists(data);
    };

    // Fetch client's own lists
    const fetchMyLists = async () => {
      if (profile?.user_type === 'client') {
        const { data } = await supabase
          .from('shopping_lists')
          .select(`
            *,
            items:list_items(*),
            selected_bid:bids(*, shopper:profiles(*))
          `)
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });
        
        if (data) setMyLists(data);
      }
    };

    // Fetch shopper's bids
    const fetchMyBids = async () => {
      if (profile?.user_type === 'shopper') {
        const { data } = await supabase
          .from('bids')
          .select(`
            *,
            list:shopping_lists(*, client:profiles(*))
          `)
          .eq('shopper_id', user.id)
          .order('created_at', { ascending: false });
        
        if (data) setMyActiveBids(data);
      }
    };

    fetchOpenLists();
    fetchMyLists();
    fetchMyBids();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Shopper</h1>
          <p className="text-xl mb-8">Post shopping tasks or earn money by shopping for others</p>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Get Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || user.email}!</h1>
          <p className="text-gray-600">
            {profile?.user_type === 'client' 
              ? 'Post shopping tasks and find reliable shoppers' 
              : 'Browse shopping tasks and earn money'}
          </p>
        </div>

        {/* Quick Actions */}
        {profile?.user_type === 'client' && (
          <div className="mb-8">
            <Link href="/create-list">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                + Create New Shopping List
              </button>
            </Link>
          </div>
        )}

        {/* Open Lists Section (for shoppers) */}
        {profile?.user_type === 'shopper' && openLists.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Available Shopping Tasks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openLists.map(list => (
                <ListCard key={list.id} list={list} userType="shopper" />
              ))}
            </div>
          </div>
        )}

        {/* My Lists Section (for clients) */}
        {profile?.user_type === 'client' && myLists.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">My Shopping Lists</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myLists.map(list => (
                <ListCard key={list.id} list={list} userType="client" />
              ))}
            </div>
          </div>
        )}

        {/* My Bids Section (for shoppers) */}
        {profile?.user_type === 'shopper' && myActiveBids.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">My Active Bids</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myActiveBids.map(bid => (
                <div key={bid.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-bold text-lg mb-2">{bid.list.title}</h3>
                  <p className="text-gray-600 mb-2">Your bid: ${bid.amount}</p>
                  <p className="text-sm text-gray-500">Status: {bid.status}</p>
                  <Link href={`/list/${bid.list.id}`}>
                    <button className="mt-4 text-blue-600 hover:underline">View Details</button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}