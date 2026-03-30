import { supabase } from '../supabaseClient';
import { ShoppingList, ListItem } from '../../types';

export const getShoppingLists = async (filters?: {
  status?: string;
  client_id?: string;
}) => {
  let query = supabase
    .from('shopping_lists')
    .select(`
      *,
      client:profiles(*),
      items:list_items(*),
      selected_bid:bids(*, shopper:profiles(*))
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ShoppingList[];
};

export const getShoppingListById = async (id: string) => {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select(`
      *,
      client:profiles(*),
      items:list_items(*),
      bids:bids(*, shopper:profiles(*)),
      selected_bid:bids(*, shopper:profiles(*))
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ShoppingList;
};

export const createShoppingList = async (
  list: Omit<ShoppingList, 'id' | 'created_at' | 'updated_at' | 'client' | 'items' | 'selected_bid'>,
  items: Omit<ListItem, 'id' | 'list_id' | 'created_at'>[]
) => {
  // Create the shopping list
  const { data: listData, error: listError } = await supabase
    .from('shopping_lists')
    .insert([list])
    .select()
    .single();

  if (listError) throw listError;

  // Create the items
  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('list_items')
      .insert(
        items.map(item => ({
          ...item,
          list_id: listData.id,
        }))
      );

    if (itemsError) throw itemsError;
  }

  return getShoppingListById(listData.id);
};

export const updateShoppingList = async (
  id: string,
  updates: Partial<ShoppingList>
) => {
  const { data, error } = await supabase
    .from('shopping_lists')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ShoppingList;
};

export const deleteShoppingList = async (id: string) => {
  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const addListItems = async (listId: string, items: Omit<ListItem, 'id' | 'list_id' | 'created_at'>[]) => {
  const { data, error } = await supabase
    .from('list_items')
    .insert(
      items.map(item => ({
        ...item,
        list_id: listId,
      }))
    )
    .select();

  if (error) throw error;
  return data;
};

export const updateListItem = async (id: string, updates: Partial<ListItem>) => {
  const { data, error } = await supabase
    .from('list_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteListItem = async (id: string) => {
  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};