import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { ShoppingList } from '../types';
import ListCard from '@/components/lists/ListCard';
import Link from 'next/link';

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [openLists, setOpenLists] = useState<ShoppingList[]>([]);
  const [myLists, setMyLists] = useState<ShoppingList[]>([]);
  const [myActiveBids, setMyActiveBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

// Function to refresh all data
const refreshData = async () => {
  if (!user) return;
  console.log('=== REFRESH DATA CALLED ===');
  
  try {
    console.log('Refreshing data...');
    // Clear existing data before fetching new data
    setOpenLists([]);
    setMyLists([]);
    setMyActiveBids([]);

    // ========== 1. Fetch Open Lists (for shoppers) ==========
    // First, get all open shopping lists
    const { data: openListsData, error: openListsError } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    
    if (openListsError) throw openListsError;
    
    if (openListsData && openListsData.length > 0) {
      // Get client profiles for these lists
      const clientIds = [...new Set(openListsData.map(l => l.client_id))];
      const { data: clients, error: clientsError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', clientIds);
      
      if (clientsError) throw clientsError;
      
      // Get items for these lists
      const listIds = openListsData.map(l => l.id);
      const { data: items, error: itemsError } = await supabase
        .from('list_items')
        .select('*')
        .in('list_id', listIds);
      
      if (itemsError) throw itemsError;
      
      // Get bids for these lists
      const { data: bids, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .in('list_id', listIds);
      
      if (bidsError) throw bidsError;
      
      // Get shopper profiles for bids
      let bidsWithShoppers = bids || [];
      if (bids && bids.length > 0) {
        const shopperIds = [...new Set(bids.map(b => b.shopper_id))];
        const { data: shoppers, error: shoppersError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', shopperIds);
        
        if (!shoppersError && shoppers) {
          bidsWithShoppers = bids.map(bid => ({
            ...bid,
            shopper: shoppers.find(s => s.id === bid.shopper_id)
          }));
        }
      }
      
      // Combine all data
      const completeOpenLists = openListsData.map(list => ({
        ...list,
        client: clients?.find(c => c.id === list.client_id),
        items: items?.filter(i => i.list_id === list.id) || [],
        bids: bidsWithShoppers?.filter(b => b.list_id === list.id) || [],
        selected_bid: bidsWithShoppers?.find(b => b.id === list.selected_bid_id) || null,
      }));
      
      setOpenLists(completeOpenLists);
    } else {
      setOpenLists([]);
    }

    // ========== 2. Fetch Client's Own Lists ==========
    if (profile?.user_type === 'client') {
      // Get client's lists
      const { data: myListsData, error: myListsError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      
      if (myListsError) throw myListsError;
      
      if (myListsData && myListsData.length > 0) {
        // Get items for these lists
        const listIds = myListsData.map(l => l.id);
        const { data: items, error: itemsError } = await supabase
          .from('list_items')
          .select('*')
          .in('list_id', listIds);
        
        if (itemsError) throw itemsError;
        
        // Get bids for these lists
        const { data: bids, error: bidsError } = await supabase
          .from('bids')
          .select('*')
          .in('list_id', listIds);
        
        if (bidsError) throw bidsError;
        
        // Get shopper profiles for bids
        let bidsWithShoppers = bids || [];
        if (bids && bids.length > 0) {
          const shopperIds = [...new Set(bids.map(b => b.shopper_id))];
          const { data: shoppers, error: shoppersError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', shopperIds);
          
          if (!shoppersError && shoppers) {
            bidsWithShoppers = bids.map(bid => ({
              ...bid,
              shopper: shoppers.find(s => s.id === bid.shopper_id)
            }));
          }
        }
        
        // Get client profile
        const { data: clientProfile, error: clientError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (clientError) throw clientError;
        
        // Combine all data
        const completeMyLists = myListsData.map(list => ({
          ...list,
          client: clientProfile,
          items: items?.filter(i => i.list_id === list.id) || [],
          bids: bidsWithShoppers?.filter(b => b.list_id === list.id) || [],
          selected_bid: bidsWithShoppers?.find(b => b.id === list.selected_bid_id) || null,
        }));
        
        setMyLists(completeMyLists);
      } else {
        setMyLists([]);
      }
    }

    // ========== 3. Fetch Shopper's Bids ==========
    if (profile?.user_type === 'shopper') {
      // Get shopper's bids
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .eq('shopper_id', user.id)
        .order('created_at', { ascending: false });
      
      if (bidsError) throw bidsError;
      
      if (bidsData && bidsData.length > 0) {
        // Get list IDs from bids
        const listIds = [...new Set(bidsData.map(b => b.list_id))];
        
        // Get shopping lists
        const { data: lists, error: listsError } = await supabase
          .from('shopping_lists')
          .select('*')
          .in('id', listIds);
        
        if (listsError) throw listsError;
        
        // Get client profiles
        const clientIds = [...new Set(lists?.map(l => l.client_id) || [])];
        const { data: clients, error: clientsError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', clientIds);
        
        if (clientsError) throw clientsError;
        
        // Get items for lists
        const { data: items, error: itemsError } = await supabase
          .from('list_items')
          .select('*')
          .in('list_id', listIds);
        
        if (itemsError) throw itemsError;
        
        // Combine data
        const completeBids = bidsData.map(bid => {
          const list = lists?.find(l => l.id === bid.list_id);
          return {
            ...bid,
            list: {
              ...list,
              client: clients?.find(c => c.id === list?.client_id),
              items: items?.filter(i => i.list_id === list?.id) || [],
            }
          };
        });
        
        setMyActiveBids(completeBids);
      } else {
        setMyActiveBids([]);
      }
    }
  } catch (err) {
    console.error('Error fetching data:', err);
    setError('Failed to load dashboard data');
  }
};

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      await refreshData();
      setLoading(false);
    };

    fetchData();
  }, [user, profile]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-gray-800 text-4xl font-bold mb-4">Welcome to Shopper</h1>
          <p className="text-gray-600 text-xl mb-8">Post shopping tasks or earn money by shopping for others</p>
          <Link href="/login">
            <button className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Get Started
            </button>
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
          <h1 className="text-gray-800 text-2xl font-bold mb-2">Welcome back, {profile?.full_name || user.email}!</h1>
          <p className="text-gray-600">
            {profile?.user_type === 'client' 
              ? 'Post shopping tasks and find reliable shoppers' 
              : 'Browse shopping tasks and earn money'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Quick Actions */}
        {profile?.user_type === 'client' && (
          <div className="mb-8">
            <Link href="/create-list">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                + Create New Shopping List
              </button>
            </Link>
          </div>
        )}

        {/* Open Lists Section (for shoppers) */}
        {profile?.user_type === 'shopper' && (
          <>
            {openLists.length > 0 ? (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-gray-800 text-2xl font-bold">Available Shopping Tasks</h2>
                  {openLists.length > 6 && (
                    <Link href="/available-lists" className="text-blue-600 hover:underline">
                      View all {openLists.length} tasks →
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {openLists.slice(0, 6).map(list => (
                    <ListCard 
                      key={list.id} 
                      list={list} 
                      userType="shopper"
                      currentUserId={user?.id}
                      onDelete={refreshData}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center mb-8">
                <p className="text-gray-500 text-lg">No available shopping tasks at the moment</p>
                <p className="text-gray-400 mt-2">Check back later for new opportunities!</p>
              </div>
            )}
          </>
        )}

        {/* My Lists Section (for clients) */}
        {profile?.user_type === 'client' && (
          <>
            {myLists.length > 0 ? (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-gray-800 text-2xl font-bold">My Shopping Lists</h2>
                  <Link href="/my-lists" className="text-blue-600 hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myLists.slice(0, 6).map(list => (
                    <ListCard 
                      key={list.id} 
                      list={list} 
                      userType="client"
                      currentUserId={user?.id}
                      onDelete={refreshData}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center mb-8">
                <p className="text-gray-500 text-lg mb-4">You haven't created any shopping lists yet</p>
                <Link href="/create-list">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                    Create Your First List
                  </button>
                </Link>
              </div>
            )}
          </>
        )}

        {/* My Bids Section (for shoppers) */}
        {profile?.user_type === 'shopper' && myActiveBids.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-800 text-2xl font-bold">My Active Bids</h2>
              <Link href="/my-bids" className="text-blue-600 hover:underline">
                View all bids →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myActiveBids.slice(0, 6).map(bid => (
                <div key={bid.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-gray-800 font-bold text-lg line-clamp-1">{bid.list.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bid.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {bid.list.description || 'No description'}
                  </p>
                  <p className="text-green-600 font-bold text-lg mb-2">${bid.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mb-3">
                    Posted by: {bid.list.client?.full_name || 'Anonymous'}
                  </p>
                  
                  {/* Withdraw button for pending bids */}
                  {bid.status === 'pending' && (
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to withdraw this bid?')) {
                          const { error } = await supabase
                            .from('bids')
                            .delete()
                            .eq('id', bid.id);
                          
                          if (!error) {
                            refreshData();
                          } else {
                            alert('Failed to withdraw bid');
                          }
                        }
                      }}
                      className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors mb-2"
                    >
                      Withdraw Bid
                    </button>
                  )}
                  
                  <Link href={`/list/${bid.list.id}`}>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
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