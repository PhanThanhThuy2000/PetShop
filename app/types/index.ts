// index.ts
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'User' | 'Staff' | 'Admin';
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  user_id: string;
  images?: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  _id: string;
  url: string;
  is_primary: boolean;
  product_id: string;
}

export interface Pet {
  age: any;
  gender: any;
  _id: string;
  name: string;
  price: number;
  weight: number;
  type: string;
  description: string;
  breed_id?: {
    _id: string;
    name: string;
    description?: string;
  };
  user_id: string;
  images?: PetImage[];
  created_at: string;
  updated_at: string;
}

export interface PetImage {
  _id: string;
  url: string;
  is_primary: boolean;
  pet_id: string;
}

export interface CartItem {
  _id: string;
  user_id: string;
  pet_id?: Pet;
  product_id?: Product;
  quantity: number;
  added_at: string;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  isLoading: boolean;
  error: string | null;
}

// Thêm interface cho Order
export interface Order {
  _id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Thêm interface cho OrderItem
export interface OrderItem {
  _id: string;
  quantity: number;
  unit_price: number;
  pet_id?: Pet;
  product_id?: Product;
  order_id: Order;
  addresses_id: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

export interface AddToCartRequest {
  pet_id?: string;
  product_id?: string;
  quantity: number;
}


export interface ChatRoom {
  _id: string;
  customer_id: {
    _id: string;
    username: string;
    email: string;
    avatar_url?: string;
  };
  assigned_staff_id?: {
    _id: string;
    username: string;
    email: string;
  } | null;
  status: 'waiting' | 'active' | 'closed';
  subject: string;
  priority: 'low' | 'medium' | 'high';
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  _id: string;
  room_id: string;
  sender_id: {
    _id: string;
    username: string;
    avatar_url?: string;
    role: 'User' | 'Staff' | 'Admin';
  };
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  is_read: boolean;
  read_by: Array<{
    user_id: string;
    read_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface ChatState {
  // Current active room
  currentRoom: ChatRoom | null;
  
  // All user's rooms
  rooms: ChatRoom[];
  
  // Messages for current room
  messages: ChatMessage[];
  
  // Socket connection state
  isConnected: boolean;
  
  // Loading states
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  
  // Typing indicator
  typingUsers: string[]; // usernames đang gõ
  
  // Unread counts
  unreadCount: number;
  
  // Error handling
  error: string | null;
}

// API Request/Response types cho Chat
export interface CreateChatRoomRequest {
  subject?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface SendMessageRequest {
  roomId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file';
}

export interface ChatRoomsResponse {
  rooms: ChatRoom[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface ChatHistoryResponse {
  room: ChatRoom;
  messages: ChatMessage[];
  unread_count: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface UnreadCountResponse {
  total_unread: number;
  rooms_with_unread: Array<{
    room_id: string;
    unread_count: number;
  }>;
}

// Socket Events Types
export interface SocketAuthData {
  token: string;
}

export interface SocketJoinRoomData {
  roomId: string;
}

export interface SocketSendMessageData {
  roomId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file';
}

export interface SocketTypingData {
  roomId: string;
  isTyping: boolean;
}

// Socket Event Listeners Types
export interface SocketNewMessageData {
  id: string;
  roomId: string;
  content: string;
  messageType: string;
  sender: {
    id: string;
    username: string;
    avatar_url?: string;
    role: string;
  };
  timestamp: string;
  isRead: boolean;
}

export interface SocketUserTypingData {
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface SocketStaffJoinedData {
  staffName: string;
  message: string;
}

export interface SocketRoomUpdatedData {
  roomId: string;
  updates: {
    status?: string;
    assignedStaff?: {
      id: string;
      username: string;
    };
  };
}
export interface Voucher {
  _id: string;
  title?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  expiry_date: string;
  max_usage: number;
  used_count?: number;
  status: 'active' | 'inactive' | 'pending' | 'expired';
  textColor?: string;
  color?: string;
  isDashed?: boolean;
  saved_by_users?: string[];
  user_id: string;
  category_id: string;
  created_by?: string;
  last_modified_by?: string;
  created_at: string;
  updated_at: string;
  used_at?: string;
}