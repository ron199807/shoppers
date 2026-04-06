export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  user_type: 'client' | 'shopper';
  phone?: string | null;
  address?: string | null;
  rating: number;
  total_ratings: number;
  created_at: string;
  updated_at?: string;
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
  bids?: Bid[];
  // New delivery and payment fields
  delivery_status?: 'pending' | 'shopping' | 'ready_for_delivery' | 'delivered' | 'completed';
  payment_status?: 'pending' | 'paid' | 'failed';
  payment_amount?: number;
  payment_method?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
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
  last_message?: string;
  last_message_at?: string;
  messages?: Message[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: Profile;
  content: string;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Delivery {
  id: string;
  list_id: string;
  shopper_id: string;
  client_id: string;
  status: 'shopping' | 'ready_for_delivery' | 'delivered' | 'completed';
  shopping_started_at?: string;
  shopping_completed_at?: string;
  delivery_started_at?: string;
  delivered_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  list_id: string;
  client_id: string;
  shopper_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  created_at: string;
  completed_at?: string;
}

export interface Rating {
  id: string;
  list_id: string;
  client_id: string;
  shopper_id: string;
  rating: number;
  review?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'bid_accepted' | 'bid_rejected' | 'delivery_update' | 'payment_received' | 'rating_received';
  read: boolean;
  metadata?: any;
  created_at: string;
}