import { supabase } from './supabaseClient';
import { ShoppingItem, Category, ShoppingItemInput } from '../types';

// Shopping Items API
export const getShoppingItems = async () => {
  const { data, error } = await supabase
    .from('shopping_items')
    .select(`
      *,
      category:categories(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as ShoppingItem[];
};

export const addShoppingItem = async (item: ShoppingItemInput) => {
  const { data, error } = await supabase
    .from('shopping_items')
    .insert([item])
    .select()
    .single();
  
  if (error) throw error;
  return data as ShoppingItem;
};

export const updateShoppingItem = async (id: string, updates: Partial<ShoppingItem>) => {
  const { data, error } = await supabase
    .from('shopping_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as ShoppingItem;
};

export const deleteShoppingItem = async (id: string) => {
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Categories API
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data as Category[];
};