import { supabase } from '../supabaseClient';
import { ShoppingList } from '@/types';

export const getClientLists = async (clientId: string): Promise<ShoppingList[]> => {
  if (!clientId) return [];

  try {
    // First, get all lists for this client
    const { data: listsData, error: listsError } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (listsError) throw listsError;

    if (!listsData || listsData.length === 0) {
      return [];
    }

    // Get list IDs
    const listIds = listsData.map(l => l.id);

    // Get items for these lists
    const { data: itemsData, error: itemsError } = await supabase
      .from('list_items')
      .select('*')
      .in('list_id', listIds);

    if (itemsError) throw itemsError;

    // Get bids for these lists
    const { data: bidsData, error: bidsError } = await supabase
      .from('bids')
      .select('*')
      .in('list_id', listIds);

    if (bidsError) throw bidsError;

    // Get shopper profiles for bids
    let bidsWithShoppers = bidsData || [];
    if (bidsData && bidsData.length > 0) {
      const shopperIds = [...new Set(bidsData.map(b => b.shopper_id))];
      const { data: shoppersData, error: shoppersError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', shopperIds);

      if (!shoppersError && shoppersData) {
        bidsWithShoppers = bidsData.map(bid => ({
          ...bid,
          shopper: shoppersData.find(s => s.id === bid.shopper_id)
        }));
      }
    }

    // Get client profile
    const { data: clientProfile, error: clientError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError) throw clientError;

    // Combine all data
    const completeLists: ShoppingList[] = listsData.map(list => ({
      ...list,
      client: clientProfile,
      items: itemsData?.filter(i => i.list_id === list.id) || [],
      bids: bidsWithShoppers?.filter(b => b.list_id === list.id) || [],
      selected_bid: bidsWithShoppers?.find(b => b.id === list.selected_bid_id) || null,
    }));

    return completeLists;
  } catch (error) {
    console.error('Error in getClientLists:', error);
    throw error;
  }
};