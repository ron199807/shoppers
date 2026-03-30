export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  user_type: 'client' | 'shopper';
  phone?: string;
  address?: string;
  rating: number;
  total_ratings: number;
  created_at: string;
}

export interface ShoppingList {
  id: string;
  client_id: string;
  client?: Profile;
  title: string;
  description?: string;
  budget?: number;
  delivery_address: string;
  delivery_deadline?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  selected_bid_id?: string;
  selected_bid?: Bid;
  items?: ListItem[];
  created_at: string;
  updated_at: string;
  bids?: Bid[];
}

export interface ListItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;

}

export interface Bid {
  id: string;
  list_id: string;
  shopper_id: string;
  shopper?: Profile;
  amount: number;
  message?: string;
  estimated_delivery_time?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  Rating?: Rating;
}

export interface Conversation {
  id: string;
  list_id: string;
  list?: ShoppingList;
  client_id: string;
  client?: Profile;
  shopper_id: string;
  shopper?: Profile;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: Profile;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Delivery {
  id: string;
  list_id: string;
  shopper_id: string;
  status: 'shopping' | 'ready_for_delivery' | 'delivered';
  delivery_proof?: string;
  delivered_at?: string;
}

export interface Payment {
  id: string;
  list_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string;
}

export interface Rating {
  id: string;
  list_id: string;
  rating: number;
  review?: string;
  created_at: string;
}