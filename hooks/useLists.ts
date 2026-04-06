import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ShoppingList, ListItem } from '../types';

export const useLists = (filters?: { status?: string; client_id?: string }) => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = async () => {
    try {
      setLoading(true);
      
      // Build the query
      let query = supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }

      const { data: listsData, error: listsError } = await query;

      if (listsError) throw listsError;

      if (!listsData || listsData.length === 0) {
        setLists([]);
        setError(null);
        return;
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

      // Get client profiles for these lists
      const clientIds = [...new Set(listsData.map(l => l.client_id))];
      const { data: clientsData, error: clientsError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', clientIds);

      if (clientsError) throw clientsError;

      // Combine all data
      const completeLists: ShoppingList[] = listsData.map(list => ({
        ...list,
        client: clientsData?.find(c => c.id === list.client_id),
        items: itemsData?.filter(i => i.list_id === list.id) || [],
        bids: bidsWithShoppers?.filter(b => b.list_id === list.id) || [],
        selected_bid: bidsWithShoppers?.find(b => b.id === list.selected_bid_id) || null,
      }));

      setLists(completeLists);
      setError(null);
    } catch (err) {
      console.error('Error fetching lists:', err);
      setError('Failed to fetch shopping lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [JSON.stringify(filters)]);

  return { lists, loading, error, refetch: fetchLists };
};

export const useList = (id: string) => {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch the shopping list
      const { data: listData, error: listError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', id)
        .single();

      if (listError) throw listError;
      if (!listData) {
        setError('List not found');
        return;
      }

      // Fetch client profile
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', listData.client_id)
        .single();

      if (clientError) console.error('Error fetching client:', clientError);

      // Fetch list items
      const { data: itemsData, error: itemsError } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', id);

      if (itemsError) console.error('Error fetching items:', itemsError);

      // Fetch bids
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .eq('list_id', id);

      if (bidsError) console.error('Error fetching bids:', bidsError);

      // Fetch shopper profiles for bids
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

      // Find selected bid
      const selectedBid = bidsWithShoppers?.find(b => b.id === listData.selected_bid_id);

      // Assemble complete list
      const completeList: ShoppingList = {
        ...listData,
        client: clientData || null,
        items: itemsData || [],
        bids: bidsWithShoppers || [],
        selected_bid: selectedBid || null,
      };

      setList(completeList);
      setError(null);
    } catch (err) {
      console.error('Error fetching list:', err);
      setError('Failed to fetch list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [id]);

  const updateList = async (updates: Partial<ShoppingList>) => {
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchList();
      return true;
    } catch (err) {
      console.error('Error updating list:', err);
      throw err;
    }
  };

  const deleteList = async () => {
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting list:', err);
      throw err;
    }
  };

  return { list, loading, error, refetch: fetchList, updateList, deleteList };
};

export const useCreateList = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createList = async (
    listData: Omit<ShoppingList, 'id' | 'created_at' | 'updated_at' | 'client' | 'items' | 'bids' | 'selected_bid'>,
    items: Omit<ListItem, 'id' | 'list_id' | 'created_at'>[]
  ) => {
    try {
      setLoading(true);
      
      // Create the shopping list
      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .insert([listData])
        .select()
        .single();

      if (listError) throw listError;

      // Create list items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          list_id: list.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || null,
        }));

        const { error: itemsError } = await supabase
          .from('list_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      setError(null);
      return list;
    } catch (err) {
      console.error('Error creating list:', err);
      setError('Failed to create shopping list');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createList, loading, error };
};