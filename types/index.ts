export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category_id: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export type ShoppingItemInput = Omit<ShoppingItem, 'id' | 'created_at' | 'updated_at'>;