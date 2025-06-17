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

// Product types (dựa trên server)
export interface Product {
  _id: string;
  name: string;
  price: number;
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

// Pet types (dựa trên server)
export interface Pet {
  _id: string;
  name: string;
  price: number;
  type: string;
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

// Cart types (dựa trên server)
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

// API Response types
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