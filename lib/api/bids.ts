import { supabase } from '../supabaseClient';

export interface BidWithList {
  id: string;
  amount: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  list: {
    id: string;
    title: string;
    description: string;
    budget: number;
    status: string;
    client: {
      id: string;
      full_name: string;
      rating: number;
    };
  };
}

export const getShopperBids = async (shopperId: string): Promise<BidWithList[]> => {
  if (!shopperId) return [];
  
  try {
    // Get shopper's bids
    const { data: bidsData, error: bidsError } = await supabase
      .from('bids')
      .select('*')
      .eq('shopper_id', shopperId)
      .order('created_at', { ascending: false });
    
    if (bidsError) throw bidsError;
    
    if (!bidsData || bidsData.length === 0) {
      return [];
    }
    
    // Get list IDs from bids
    const listIds = [...new Set(bidsData.map(b => b.list_id))];
    
    // Get shopping lists
    const { data: listsData, error: listsError } = await supabase
      .from('shopping_lists')
      .select('*')
      .in('id', listIds);
    
    if (listsError) throw listsError;
    
    // Get client profiles
    const clientIds = [...new Set(listsData?.map(l => l.client_id) || [])];
    const { data: clientsData, error: clientsError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', clientIds);
    
    if (clientsError) throw clientsError;
    
    // Combine all data
    const completeBids: BidWithList[] = bidsData.map(bid => {
      const list = listsData?.find(l => l.id === bid.list_id);
      return {
        ...bid,
        list: {
          ...list,
          client: clientsData?.find(c => c.id === list?.client_id) || {
            id: '',
            full_name: 'Anonymous',
            rating: 0
          },
        }
      };
    });
    
    return completeBids;
  } catch (error) {
    console.error('Error in getShopperBids:', error);
    throw error;
  }
};