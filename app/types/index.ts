// app/types/index.ts - UPDATED VERSION
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'User' | 'Staff' | 'Admin';
  status: 'active' | 'inactive';
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

// 🔧 CẬP NHẬT PetVariant interface với import_price và selling_price
export interface PetVariant {
  _id: string;
  pet_id: string | Pet;
  color: string;
  weight: number;
  gender: 'Male' | 'Female';
  age: number;

  // 🆕 THÊM MỚI - Fields từ backend model
  import_price: number; // Giá nhập
  selling_price: number; // Giá bán

  // ✅ GIỮ NGUYÊN - Fields cũ để backward compatibility
  price_adjustment: number; // Vẫn có để tính toán fallback

  stock_quantity: number;
  sku?: string;
  is_available: boolean;

  // 🔧 CẬP NHẬT - Fields tính toán
  final_price?: number; // Sẽ ưu tiên selling_price hoặc fallback
  display_name?: string;
  variant_name?: string; // Alias cho display_name

  created_at: string;
  updated_at: string;
}

export interface PetVariantOptions {
  colors: string[];
  genders: ('Male' | 'Female')[];
  age_range: {
    min: number;
    max: number;
  };
  weight_range: {
    min: number;
    max: number;
  };
  totalVariants: number;
}

export interface VariantFilters {
  color?: string;
  gender?: 'Male' | 'Female';
  minAge?: number;
  maxAge?: number;
  minWeight?: number;
  maxWeight?: number;
}

// Cập nhật Pet interface để include variants - KHÔNG CÓ PRICE
export interface Pet {
  _id: string;
  name: string;
  // ❌ BỎ HOÀN TOÀN: price: number; 
  type: string;
  breed_id: {
    _id: string;
    name: string;
    description?: string;
  } | string;
  user_id?: {
    _id: string;
    username: string;
    email: string;
  } | string;
  // ❌ BỎ HOÀN TOÀN age, weight, gender - chuyển sang variants
  description?: string;
  status: 'available' | 'sold' | 'reserved';
  images: Array<{
    _id?: string;
    url: string;
    description?: string;
  }>;
  variants?: PetVariant[]; // 🆕 THÊM MỚI - REQUIRED
  variant_options?: PetVariantOptions; // 🆕 THÊM MỚI
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface PetImage {
  _id: string;
  url: string;
  is_primary: boolean;
  pet_id: string;
}

// Cập nhật CartItem interface
export interface CartItem {
  _id: string;
  user_id: string;
  pet_id?: Pet;
  product_id?: Product;
  variant_id?: PetVariant; // 🆕 THÊM MỚI
  quantity: number;
  added_at: string;
  item_type?: 'pet' | 'product' | 'variant'; // 🆕 THÊM MỚI
  item_info?: any;
  unit_price?: number;
  total_price?: number;
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

// Cập nhật OrderItem interface
export interface OrderItem {
  _id: string;
  quantity: number;
  unit_price: number;
  pet_id?: Pet;
  product_id?: Product;
  variant_id?: PetVariant; // 🆕 THÊM MỚI
  order_id: Order;
  addresses_id: string;
  created_at: string;
  updated_at: string;
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

// Cập nhật AddToCartRequest interface
export interface AddToCartRequest {
  pet_id?: string;
  product_id?: string;
  variant_id?: string; // 🆕 THÊM MỚI
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
  currentRoom: ChatRoom | null;
  rooms: ChatRoom[];
  messages: ChatMessage[];
  isConnected: boolean;
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  typingUsers: string[];
  unreadCount: number;
  error: string | null;
}

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
  status: 'active' | 'inactive' | 'pending' | 'expired' | 'used';
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

export interface Address {
  _id: string;
  name: string;
  phone: string;
  note: string;
  province: string;
  district: string;
  ward: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  created_at: string;
  pet_id: {
    _id: string;
    name: string;
    breed: string;
  };
  user_id: {
    _id: string;
    username: string;
    email: string;
  };
  product_id?: {
    _id: string;
    name: string;
  };
}

// Care Service interfaces
export interface CareService {
  _id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // phút
  category: 'grooming' | 'health' | 'training' | 'boarding' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CareServiceCategory {
  value: string;
  label: string;
}

// Appointment interfaces
export interface Appointment {
  _id: string;
  user_id: string | User;
  pet_id: string | Pet;
  order_id: string;
  service_id: string | CareService;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  staff_id?: string | User;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentRequest {
  pet_id: string;
  service_id: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  notes?: string;
  staff_id?: string; // ID của nhân viên nếu có
  total_amount?: number; // Tổng tiền nếu đã biết trước 
  order_id?: string; // ID của đơn hàng nếu có
  user_id?: string; // ID của người dùng nếu không lấy từ token
}

export interface UpdateAppointmentRequest {
  appointment_date?: string;
  appointment_time?: string;
  notes?: string;
}

export interface UpdateAppointmentStatusRequest {
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no-show';
  staff_id?: string;
}

export interface AvailableSlotsResponse {
  date: string;
  availableSlots: string[];
  bookedSlots: string[];
}

export interface CreateCareServiceRequest {
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: 'grooming' | 'health' | 'bathing' | 'spa' | 'other';
}

export interface UpdateCareServiceRequest {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  category?: 'grooming' | 'health' | 'bathing' | 'spa' | 'other';
  is_active?: boolean;
}

// State interfaces cho Redux
export interface AppointmentState {
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  availableSlots: string[];
  isLoading: boolean;
  error: string | null;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CareServiceState {
  services: CareService[];
  categories: CareServiceCategory[];
  currentService: CareService | null;
  isLoading: boolean;
  error: string | null;
}

export interface Breed {
  _id: string;
  name: string;
  description?: string;
  category_id: string; // Thêm category_id
  created_at: string;
  updated_at: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryImage {
  _id: string;
  url: string;
  is_primary: boolean;
  category_id: string;
  created_at: string;
}

export interface BreedImage {
  _id: string;
  url: string;
  is_primary: boolean;
  breed_id: string;
  created_at: string;
}

// 🚀 Helper functions để handle transition từ Pet cũ sang PetVariant mới
export namespace PetVariantHelpers {

  /**
   * Lấy giá cuối cùng từ variant - KHÔNG CẦN basePetPrice
   */
  export function getFinalPrice(variant: PetVariant, basePetPrice?: number): number {
    // 1. Ưu tiên selling_price nếu có
    if (variant.selling_price && variant.selling_price > 0) {
      return variant.selling_price;
    }

    // 2. Fallback: final_price đã tính sẵn
    if (variant.final_price && variant.final_price > 0) {
      return variant.final_price;
    }

    // 3. Fallback: import_price nếu không có gì khác
    if (variant.import_price && variant.import_price > 0) {
      return variant.import_price;
    }

    // 4. Final fallback: price_adjustment (legacy)
    return Math.abs(variant.price_adjustment || 0);
  }

  /**
   * Lấy display name của variant
   */
  export function getDisplayName(variant: PetVariant): string {
    if (variant.variant_name) return variant.variant_name;
    if (variant.display_name) return variant.display_name;

    // Tạo display name từ thuộc tính
    return `${variant.color} - ${variant.weight}kg - ${variant.gender} - ${variant.age} years`;
  }

  /**
   * Kiểm tra variant có available không
   */
  export function isVariantAvailable(variant: PetVariant): boolean {
    return variant.is_available && (variant.stock_quantity || 0) > 0;
  }

  /**
   * Lấy giá nhập để tính profit margin
   */
  export function getImportPrice(variant: PetVariant): number {
    return variant.import_price || 0;
  }

  /**
   * Tính profit margin
   */
  export function getProfitMargin(variant: PetVariant, basePetPrice?: number): number {
    const finalPrice = getFinalPrice(variant, basePetPrice);
    const importPrice = getImportPrice(variant);

    if (importPrice <= 0) return 0;

    return ((finalPrice - importPrice) / importPrice) * 100;
  }

  /**
   * Lấy giá từ Pet - CHỈ TỪ VARIANTS
   */
  export function getPetPrice(pet: Pet): number {
    if (pet.variants && pet.variants.length > 0) {
      // Lấy giá thấp nhất từ variants available
      const availableVariants = pet.variants.filter(v => isVariantAvailable(v));
      if (availableVariants.length > 0) {
        return Math.min(...availableVariants.map(v => getFinalPrice(v)));
      }
      // Nếu không có variant available, lấy variant đầu tiên
      return getFinalPrice(pet.variants[0]);
    }
    // Không có variants = không có giá
    return 0;
  }

  /**
   * Lấy giá cao nhất từ variants
   */
  export function getPetMaxPrice(pet: Pet): number {
    if (pet.variants && pet.variants.length > 0) {
      const availableVariants = pet.variants.filter(v => isVariantAvailable(v));
      if (availableVariants.length > 0) {
        return Math.max(...availableVariants.map(v => getFinalPrice(v)));
      }
      return getFinalPrice(pet.variants[0]);
    }
    return 0;
  }

  /**
   * Kiểm tra pet có available variants không
   */
  export function hasAvailableVariants(pet: Pet): boolean {
    return pet.variants?.some(v => isVariantAvailable(v)) || false;
  }

  /**
   * Lấy variant mặc định (giá thấp nhất, có sẵn)
   */
  export function getDefaultVariant(pet: Pet): PetVariant | null {
    if (!pet.variants?.length) return null;

    const availableVariants = pet.variants.filter(v => isVariantAvailable(v));
    if (!availableVariants.length) return pet.variants[0]; // Fallback variant đầu tiên

    return availableVariants.reduce((min, variant) =>
      getFinalPrice(variant) < getFinalPrice(min) ? variant : min
    );
  }

  /**
   * Kiểm tra có nên hiển thị "Từ" trong giá không
   */
  export function shouldShowPricePrefix(pet: Pet): boolean {
    if (!pet.variants?.length) return false;

    const availableVariants = pet.variants.filter(v => isVariantAvailable(v));
    if (availableVariants.length <= 1) return false;

    const prices = availableVariants.map(v => getFinalPrice(v));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return minPrice !== maxPrice; // Hiển thị "Từ" nếu có nhiều mức giá
  }
}