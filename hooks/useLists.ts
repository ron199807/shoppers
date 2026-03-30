import { useState, useEffect } from 'react';
import { ShoppingList, ListItem } from '../types';
import {
  getShoppingLists,
  getShoppingListById,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  addListItems,
  updateListItem,
  deleteListItem,
} from '../lib/api/lists';

export const useLists = (filters?: { status?: string; client_id?: string }) => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const data = await getShoppingLists(filters);
      setLists(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch shopping lists');
      console.error(err);
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
    try {
      setLoading(true);
      const data = await getShoppingListById(id);
      setList(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch shopping list');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchList();
    }
  }, [id]);

  const updateList = async (updates: Partial<ShoppingList>) => {
    try {
      const updated = await updateShoppingList(id, updates);
      setList(updated);
      return updated;
    } catch (err) {
      setError('Failed to update list');
      console.error(err);
      throw err;
    }
  };

  const addItems = async (items: Omit<ListItem, 'id' | 'list_id' | 'created_at'>[]) => {
    try {
      const newItems = await addListItems(id, items);
      if (list) {
        setList({
          ...list,
          items: [...(list.items || []), ...newItems],
        });
      }
      return newItems;
    } catch (err) {
      setError('Failed to add items');
      console.error(err);
      throw err;
    }
  };

  const updateItem = async (itemId: string, updates: Partial<ListItem>) => {
    try {
      const updated = await updateListItem(itemId, updates);
      if (list) {
        setList({
          ...list,
          items: list.items?.map(item => 
            item.id === itemId ? updated : item
          ),
        });
      }
      return updated;
    } catch (err) {
      setError('Failed to update item');
      console.error(err);
      throw err;
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await deleteListItem(itemId);
      if (list) {
        setList({
          ...list,
          items: list.items?.filter(item => item.id !== itemId),
        });
      }
    } catch (err) {
      setError('Failed to delete item');
      console.error(err);
      throw err;
    }
  };

  const deleteList = async () => {
    try {
      await deleteShoppingList(id);
    } catch (err) {
      setError('Failed to delete list');
      console.error(err);
      throw err;
    }
  };

  return {
    list,
    loading,
    error,
    refetch: fetchList,
    updateList,
    addItems,
    updateItem,
    deleteItem,
    deleteList,
  };
};

export const useCreateList = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createList = async (
    listData: Omit<ShoppingList, 'id' | 'created_at' | 'updated_at' | 'client' | 'items' | 'selected_bid'>,
    items: Omit<ListItem, 'id' | 'list_id' | 'created_at'>[]
  ) => {
    try {
      setLoading(true);
      const newList = await createShoppingList(listData, items);
      setError(null);
      return newList;
    } catch (err) {
      setError('Failed to create shopping list');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createList, loading, error };
};