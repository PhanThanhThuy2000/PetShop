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