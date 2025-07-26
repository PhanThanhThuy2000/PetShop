// app/screens/ProductDetailScreen.tsx - GỘP CHỨC NĂNG YÊU THÍCH VÀ BIẾN THỂ + BUY NOW
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, getCart } from '../redux/slices/cartSlice';

// 🆕 IMPORTS CHO BIẾN THỂ
import PetVariantSelector from '@/components/PetVariantSelector';
import { API_BASE_URL } from '../utils/api-client';

// 🆕 IMPORTS CHO YÊU THÍCH
import { CustomFavouriteAlert } from '../../components/ui/CustomFavouriteAlert';
import { FavouriteToast } from '../../components/ui/FavouriteToast';
import { useFavouriteAlert } from '../../hooks/useFavouriteAlert';
import { useFavouriteToast } from '../../hooks/useFavouriteToast';

import {
  addToFavourites,
  checkFavouriteStatus,
  fetchFavourites,
  removeFromFavourites
} from '../redux/slices/favouriteSlice';
import { AppDispatch, RootState } from '../redux/store';
import { petsService, productsService } from '../services/api-services';
import { Pet, PetImage, PetVariant, Product, ProductImage } from '../types';
import { requiresAuth, useAuthGuard } from '../utils/authGuard';

// --- Data Interfaces ---
interface Variation { id: string; image: any; }
interface RelatedItem { id: string; image: any; title: string; price: string; }

// --- Sample Data ---
const RELATED_ITEMS: RelatedItem[] = Array.from({ length: 4 }).map((_, i) => ({
  id: `${i}`,
  image: require('@/assets/images/dog.png'),
  title: 'Lorem ipsum dolor sit amet consectetur',
  price: '$17.00',
}));

// --- Countdown Hook ---
function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  return {
    h: Math.floor(seconds / 3600),
    m: Math.floor((seconds % 3600) / 60),
    s: seconds % 60,
  };
}

// --- Subcomponents ---
const Header: FC<{ image: any; images: (PetImage | ProductImage)[]; selectedImageId: string }> = ({ image, images, selectedImageId }) => {
  const selectedImage = images.find(img => img._id === selectedImageId) || images[0];
  const displayImage = selectedImage ? { uri: selectedImage.url } : image;

  return (
    <ImageBackground source={displayImage} style={styles.headerImage}>
      <View style={styles.carouselDots}>
        {images.map((_, i) => (
          <View key={i} style={[styles.dot, selectedImageId === images[i]._id && styles.dotActive]} />
        ))}
      </View>
    </ImageBackground>
  );
};

const VariationSelector: FC<{ images: (PetImage | ProductImage)[]; onSelect: (v: Variation) => void; selectedId: string }> = ({ images, onSelect, selectedId }) => {
  return (
    <FlatList
      data={images.map((img) => ({ id: img._id, image: { uri: img.url } }))}
      horizontal
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.varList}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.varItem, item.id === selectedId && styles.varSelected]}
          onPress={() => onSelect(item)}
        >
          <Image source={item.image} style={styles.varImg} />
        </TouchableOpacity>
      )}
    />
  );
};

const InfoRow: FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoKey}>{label}</Text>
    <Text style={styles.infoVal}>{value}</Text>
  </View>
);

const ReviewCard: FC<{ navigation: any }> = ({ navigation }) => {
  const handleViewAllReviews = () => {
    try {
      console.log('🔍 Navigating to Reviews screen');
      navigation.navigate('Reviews');
    } catch (error) {
      console.error('❌ Navigation error:', error);
      Alert.alert('Lỗi', 'Không thể mở màn hình đánh giá');
    }
  };

  return (
    <View style={styles.reviewCard}>
      <Image source={require('@/assets/images/dog.png')} style={styles.avatar} />
      <View style={styles.reviewContent}>
        <Text style={styles.reviewer}>Veronika</Text>
        <View style={styles.starRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <FontAwesome key={i} name="star" size={14} color="#FBBF24" />
          ))}
        </View>
        <Text numberOfLines={3} style={styles.reviewText}>Lorem ipsum dolor sit amet...</Text>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={handleViewAllReviews}
        >
          <Text style={styles.viewAllText}>Xem tất cả đánh giá</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const RelatedGrid: FC<{
  navigation: any;
  currentItemId?: string;
  currentItemType?: 'pet' | 'product'
}> = ({ navigation, currentItemId, currentItemType = 'pet' }) => {
  const [relatedItems, setRelatedItems] = useState<(Pet | Product)[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRelatedItems();
  }, [currentItemId]);

  const loadRelatedItems = async () => {
    try {
      setLoading(true);
      if (currentItemType === 'pet') {
        const response = await petsService.getPets({ limit: 8 });
        console.log('Related pets response:', response.data);
        if (response.success) {
          const filteredPets = response.data
            .filter((pet: Pet) => pet._id !== currentItemId)
            .slice(0, 4);
          setRelatedItems(filteredPets);
        }
      } else {
        const response = await productsService.getProducts({ limit: 8 });
        console.log('Related products response:', response.data);
        if (response.success) {
          const filteredProducts = response.data
            .filter((product: Product) => product._id !== currentItemId)
            .slice(0, 4);
          setRelatedItems(filteredProducts);
        }
      }
    } catch (error) {
      console.error('Error loading related items:', error);
      const fallbackData = RELATED_ITEMS.map(item => ({
        _id: item.id,
        name: item.title,
        price: 17000,
        images: [{ url: 'https://via.placeholder.com/150' }]
      })) as any[];
      setRelatedItems(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const handleRelatedItemPress = (item: Pet | Product) => {
    const isPet = 'breed_id' in item || currentItemType === 'pet';
    if (isPet) {
      navigation.push('ProductDetail', {
        pet: item,
        petId: item._id
      });
    } else {
      navigation.push('ProductDetail', {
        productId: item._id
      });
    }
  };

  const renderRelatedItem = ({ item }: { item: Pet | Product }) => (
    <TouchableOpacity
      style={styles.relatedItem}
      onPress={() => handleRelatedItemPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: item.images?.[0]?.url || 'https://via.placeholder.com/150'
        }}
        style={styles.relatedImg}
      />
      <Text style={styles.relatedTitle} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.relatedPrice}>
        {item.price?.toLocaleString('vi-VN')}₫
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.relatedLoadingContainer}>
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.loadingText}>Đang tải sản phẩm liên quan...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={relatedItems}
      numColumns={2}
      keyExtractor={(item) => item._id}
      columnWrapperStyle={styles.relatedRow}
      scrollEnabled={false}
      renderItem={renderRelatedItem}
      ListEmptyComponent={
        <View style={styles.emptyRelatedContainer}>
          <Text style={styles.emptyRelatedText}>Không có sản phẩm liên quan</Text>
        </View>
      }
    />
  );
};

// 🔧 UPDATED FooterBar - Thêm onBuyNow prop
const FooterBar: FC<{
  isFavorite: boolean;
  toggleFavorite: () => void;
  navigation: any;
  petId?: string;
  productId?: string;
  item: Pet | Product;
  onAddToCart: () => void;
  onBuyNow: () => void; // 🆕 Thêm prop cho buy now
  isAddingToCart: boolean;
  selectedVariant?: PetVariant | null;
  isTogglingFavourite?: boolean;
  isCheckingFavourite?: boolean;
}> = ({
  isFavorite,
  toggleFavorite,
  navigation,
  petId,
  productId,
  item,
  onAddToCart,
  onBuyNow, // 🆕 Destructure prop mới
  isAddingToCart,
  selectedVariant,
  isTogglingFavourite = false,
  isCheckingFavourite = false
}) => {

    // 🆕 Tính giá hiển thị với variant
    const getDisplayPrice = () => {
      if (selectedVariant) {
        return selectedVariant.final_price || (item.price + selectedVariant.price_adjustment);
      }
      return item.price;
    };

    // 🆕 Kiểm tra có variants không  
    const hasVariants = 'breed_id' in item && Array.isArray(item.variants) && item.variants.length > 0;

    return (
      <View style={styles.footer}>
        {/* 🆕 ENHANCED FAVOURITE BUTTON */}
        <TouchableOpacity
          style={[
            styles.favBtn,
            isFavorite && styles.favBtnActive,
            (isTogglingFavourite || isCheckingFavourite) && styles.favBtnLoading
          ]}
          onPress={toggleFavorite}
          disabled={isTogglingFavourite || isAddingToCart || isCheckingFavourite}
          activeOpacity={0.7}
        >
          {(isTogglingFavourite || isCheckingFavourite) ? (
            <ActivityIndicator
              size="small"
              color={isFavorite ? '#EF4444' : '#6B7280'}
            />
          ) : (
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#EF4444' : '#6B7280'}
            />
          )}
        </TouchableOpacity>

        {/* 🆕 ADD TO CART BUTTON với variant support */}
        <TouchableOpacity
          style={[
            styles.cartBtn,
            (isAddingToCart || isTogglingFavourite || isCheckingFavourite) && styles.buttonDisabled
          ]}
          onPress={onAddToCart}
          disabled={isAddingToCart || isTogglingFavourite || isCheckingFavourite}
          activeOpacity={0.8}
        >
          {isAddingToCart ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.cartBtnTxt, { marginLeft: 8 }]}>Đang thêm...</Text>
            </View>
          ) : (
            <Text style={styles.cartBtnTxt}>
              {hasVariants ? 'Add cart' : 'Add cart'}
            </Text>
          )}
        </TouchableOpacity>

        {/* 🔧 BUY NOW BUTTON với variant support - UPDATED */}
        <TouchableOpacity
          style={[
            styles.buyBtn,
            (isAddingToCart || isTogglingFavourite || isCheckingFavourite) && styles.buttonDisabled
          ]}
          disabled={isAddingToCart || isTogglingFavourite || isCheckingFavourite}
          onPress={onBuyNow} // 🔧 Sử dụng onBuyNow thay vì logic inline
          activeOpacity={0.8}
        >
          <Text style={styles.buyBtnTxt}>Mua ngay</Text>
        </TouchableOpacity>
      </View>
    );
  };

// 🔧 MAIN COMPONENT - Thêm logic cho Buy Now với variant
const ProductDetailScreen: FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();

  // GET PARAMS FIRST
  const petId = route.params?.pet?._id || route.params?.petId;
  const productId = route.params?.productId || route.params?.id;

  // 🆕 CUSTOM HOOKS CHO YÊU THÍCH
  const { alertConfig, showRemoveAlert, hideAlert } = useFavouriteAlert();
  const {
    showFavouriteAdded,
    showFavouriteRemoved,
    showFavouriteError,
    showNetworkError,
    toastConfig,
    hideToast
  } = useFavouriteToast();

  // AUTH GUARD
  const { checkAuthAndProceed } = useAuthGuard();

  // REDUX STATE
  const { favourites, loading: favouriteLoading, favouriteStatusMap } = useSelector((state: RootState) => state.favourites);
  const { isLoading: cartLoading } = useSelector((state: RootState) => state.cart);
  const { token } = useSelector((state: RootState) => state.auth);

  // 🆕 MEMOIZED FAVOURITE STATUS
  const isFavorite = useMemo(() => {
    const key = petId ? `pet_${petId}` : `product_${productId}`;
    return favouriteStatusMap[key] || false;
  }, [favouriteStatusMap, petId, productId]);

  // LOCAL STATE
  const [item, setItem] = useState<Pet | Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVar, setSelectedVar] = useState<Variation | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingFavourite, setIsTogglingFavourite] = useState(false);
  const [isCheckingFavourite, setIsCheckingFavourite] = useState(false);

  // 🔧 VARIANT STATE - Thêm state để phân biệt add to cart vs buy now
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<PetVariant | null>(null);
  const [variantActionType, setVariantActionType] = useState<'add_to_cart' | 'buy_now'>('add_to_cart'); // 🔧 State mới

  const { h, m, s } = useCountdown(36 * 60 + 58);

  // 🆕 Log variants khi item load
  useEffect(() => {
    if (item && 'breed_id' in item) {
      console.log('Pet variants available:', (item as Pet).variants?.length || 0);
    }
  }, [item]);

  // 🆕 Helper function để tính giá với variant
  const getDisplayPrice = (variant?: PetVariant) => {
    if (variant) {
      return variant.final_price || (item!.price + variant.price_adjustment);
    }
    return item!.price;
  };

  // 🆕 ENHANCED handleToggleFavorite với auth guard
  const handleToggleFavorite = async () => {
    checkAuthAndProceed(
      token,
      {
        ...requiresAuth('favorites'),
        onLoginRequired: () => navigation.navigate('Login'),
      },
      async () => {
        await performToggleFavorite();
      }
    );
  };

  // 🆕 Actual toggle favorite logic (extracted)
  const performToggleFavorite = async () => {
    if (!item || isTogglingFavourite || isCheckingFavourite) {
      console.log('🚫 Toggle blocked - busy state');
      return;
    }

    const params = petId ? { pet_id: petId } : { product_id: productId };
    const itemDisplayName = item.name || 'sản phẩm này';
    const itemImage = item.images?.[0] ? { uri: item.images[0].url } : require('@/assets/images/dog.png');

    console.log('🔄 Toggle favourite clicked for:', itemDisplayName);
    setIsCheckingFavourite(true);

    try {
      const statusResult = await dispatch(checkFavouriteStatus(params)).unwrap();
      const currentServerStatus = statusResult.isFavorite;

      console.log('✅ Current server status:', currentServerStatus);
      console.log('📱 Current local status:', isFavorite);

      setIsCheckingFavourite(false);

      if (currentServerStatus) {
        // ITEM IS IN FAVOURITES - SHOW CUSTOM CONFIRMATION DIALOG
        console.log('💬 Item is in favourites, showing custom remove confirmation...');

        showRemoveAlert(
          itemDisplayName,
          itemImage,
          async () => {
            console.log('✅ User confirmed removal');
            setIsTogglingFavourite(true);

            try {
              await dispatch(removeFromFavourites(params)).unwrap();
              await dispatch(fetchFavourites());

              showFavouriteRemoved(itemDisplayName, async () => {
                console.log('🔄 Undo removal requested');
                setIsTogglingFavourite(true);
                try {
                  await dispatch(addToFavourites(params)).unwrap();
                  await dispatch(fetchFavourites());
                  showFavouriteAdded(itemDisplayName);
                  console.log('✅ Undo successful');
                } catch (error) {
                  console.error('❌ Undo failed:', error);
                  showFavouriteError('Không thể hoàn tác. Vui lòng thử lại.');
                } finally {
                  setIsTogglingFavourite(false);
                }
              });

            } catch (error: any) {
              console.error('❌ Remove favourite error:', error);
              showFavouriteError('Không thể xóa khỏi yêu thích. Vui lòng thử lại.');
            } finally {
              setIsTogglingFavourite(false);
            }
          }
        );

      } else {
        // ITEM NOT IN FAVOURITES - ADD DIRECTLY
        console.log('➕ Item not in favourites, adding directly...');
        setIsTogglingFavourite(true);

        try {
          await dispatch(addToFavourites(params)).unwrap();
          await dispatch(fetchFavourites());
          showFavouriteAdded(itemDisplayName);

        } catch (error: any) {
          console.error('❌ Add favourite error:', error);

          const errorMessage = error as string;
          const isDuplicate = errorMessage?.includes('đã có trong') ||
            errorMessage?.includes('duplicate') ||
            errorMessage?.includes('yêu thích');

          if (isDuplicate) {
            showFavouriteAdded(itemDisplayName);
          } else {
            const isNetworkError = errorMessage?.includes('network') ||
              errorMessage?.includes('timeout') ||
              errorMessage?.includes('connection');

            if (isNetworkError) {
              showNetworkError();
            } else {
              showFavouriteError(`Không thể thêm "${itemDisplayName}" vào danh sách yêu thích.`);
            }
          }
        } finally {
          setIsTogglingFavourite(false);
        }
      }

    } catch (error: any) {
      console.error('❌ Check favourite status error:', error);
      setIsCheckingFavourite(false);

      const isNetworkError = error?.message?.includes('network') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('connection') ||
        (typeof navigator !== 'undefined' && !navigator.onLine);

      if (isNetworkError) {
        showNetworkError();
      } else {
        showFavouriteError('Không thể kiểm tra trạng thái yêu thích.');
      }
    }
  };

  // 🔧 ENHANCED handleAddToCart với auth guard
  const handleAddToCart = async () => {
    if (!item) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin sản phẩm');
      return;
    }

    checkAuthAndProceed(
      token,
      {
        ...requiresAuth('cart'),
        onLoginRequired: () => navigation.navigate('Login'),
      },
      async () => {
        await performAddToCart();
      }
    );
  };

  // Actual add to cart logic (extracted)
  const performAddToCart = async () => {
    // 🆕 Nếu là pet và có variants, hiển thị variant selector
    const isPet = 'breed_id' in item!;
    if (isPet && Array.isArray(item!.variants) && item!.variants.length > 0) {
      setVariantActionType('add_to_cart'); // 🔧 Set action type
      setShowVariantSelector(true);
      return;
    }

    await addItemToCart();
  };

  // 🆕 NEW handleBuyNow function với variant support và auth guard
  const handleBuyNow = async () => {
    if (!item) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin sản phẩm');
      return;
    }

    checkAuthAndProceed(
      token,
      {
        ...requiresAuth('purchase'),
        onLoginRequired: () => navigation.navigate('Login'),
      },
      async () => {
        await performBuyNow();
      }
    );
  };

  const performBuyNow = async () => {
    const isPet = 'breed_id' in item!;
    if (isPet && Array.isArray(item!.variants) && item!.variants.length > 0) {
      setVariantActionType('buy_now'); // 🔧 Set action type
      setShowVariantSelector(true);
      return;
    }

    await proceedToBuyNow();
  };

  const proceedToBuyNow = async (variant?: PetVariant) => {
    console.log('Buy now clicked:', { selectedVariant: variant, price: getDisplayPrice(variant) });

    const cartItems = [{
      id: variant?._id || item!._id,  // 🔧 Sử dụng variant._id nếu có variant
      title: item!.name,
      price: getDisplayPrice(variant),
      quantity: 1,
      image: Array.isArray(item!.images) && item!.images.length > 0
        ? { uri: item!.images[0].url }
        : require('@/assets/images/dog.png'),

      type: variant ? 'variant' : (petId ? 'pet' : 'product'),

      petId: petId || undefined,
      productId: productId || undefined,
      variantId: variant?._id || undefined,  // 🔧 QUAN TRỌNG: variantId để PaymentScreen nhận diện

      // 🔧 FIX: Thêm thông tin variant cho PaymentScreen
      variant: variant || undefined,
      variantInfo: variant ? {
        color: variant.color,
        weight: variant.weight,
        gender: variant.gender,
        age: variant.age,
        display_name: variant.variant_name || variant.display_name
      } : undefined
    }];

    const total = getDisplayPrice(variant);

    console.log('🔧 Formatted cartItems for Payment:', JSON.stringify(cartItems, null, 2));

    navigation.navigate('Payment', {
      cartItems,
      total,
      petId,
      productId,
      variantId: variant?._id  // 🔧 Cũng truyền variantId riêng để backup
    });
  };

  // 🆕 addItemToCart với variant support
  const addItemToCart = async (variant?: PetVariant) => {
    setIsAddingToCart(true);

    try {
      let cartParams: any = { quantity: 1 };

      if (variant) {
        cartParams.variant_id = variant._id;
        console.log('🛒 Adding variant to cart:', variant._id);
      } else if (petId) {
        cartParams.pet_id = petId;
        console.log('🛒 Adding pet to cart:', petId);
      } else if (productId) {
        cartParams.product_id = productId;
        console.log('🛒 Adding product to cart:', productId);
      }

      console.log('Adding to cart with params:', cartParams);

      try {
        await dispatch(addToCart(cartParams)).unwrap();
        dispatch(getCart());

        Alert.alert(
          'Thành công',
          `${item?.name} đã được thêm vào giỏ hàng`,
          [
            { text: 'Tiếp tục mua sắm', style: 'cancel' },
            {
              text: 'Xem giỏ hàng',
              onPress: () => navigation.navigate('Cart')
            }
          ]
        );
      } catch (reduxError) {
        console.log('Redux failed, trying direct API call:', reduxError);
        const response = await fetch(`${API_BASE_URL}/api/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(cartParams),
        });

        const result = await response.json();
        console.log('Cart response:', result);

        if (result.success) {
          Alert.alert('Thành công', 'Đã thêm vào giỏ hàng!');
        } else {
          Alert.alert('Lỗi', result.message || 'Không thể thêm vào giỏ hàng');
        }
      }
    } catch (error: any) {
      console.error('Add to cart error:', error);
      let errorMessage = 'Không thể thêm vào giỏ hàng';
      if (typeof error === 'string') {
        if (error.includes('already exists in cart')) {
          errorMessage = 'Sản phẩm đã có trong giỏ hàng';
        } else if (error.includes('must have either')) {
          errorMessage = 'Thông tin sản phẩm không hợp lệ';
        } else if (error.includes('network') || error.includes('timeout')) {
          errorMessage = 'Lỗi kết nối. Vui lòng thử lại';
        }
      }
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // 🔧 ENHANCED handleVariantSelect - xử lý cả add to cart và buy now
  const handleVariantSelect = (variant: PetVariant) => {
    console.log('Selected variant:', variant, 'Action type:', variantActionType);
    setSelectedVariant(variant);

    if (variantActionType === 'add_to_cart') {
      addItemToCart(variant);
    } else if (variantActionType === 'buy_now') {
      proceedToBuyNow(variant);
    }
  };

  // FETCH FAVOURITES ON MOUNT - Only for authenticated users
  useEffect(() => {
    if (token) {
      console.log('🔄 ProductDetail mounted, fetching favourites...');
      dispatch(fetchFavourites());
    }
  }, [dispatch, token]);

  // CHECK FAVOURITE STATUS WHEN ITEM LOADS - Only for authenticated users
  useEffect(() => {
    if (item && (petId || productId) && token) {
      const key = petId ? `pet_${petId}` : `product_${productId}`;
      if (!(key in favouriteStatusMap)) {
        console.log('🔍 Checking favourite status for new item:', { petId, productId });
        const params = petId ? { pet_id: petId } : { product_id: productId };
        dispatch(checkFavouriteStatus(params));
      }
    }
  }, [item, petId, productId, dispatch, favouriteStatusMap, token]);

  // FETCH FAVOURITES KHI FOCUS VÀO SCREEN - Only for authenticated users
  useFocusEffect(
    useCallback(() => {
      if (token) {
        console.log('🔄 ProductDetail focused, refreshing favourites...');
        dispatch(fetchFavourites());

        const timeoutId = setTimeout(() => {
          if (petId || productId) {
            const params = petId ? { pet_id: petId } : { product_id: productId };
            dispatch(checkFavouriteStatus(params));
          }
        }, 500);

        return () => clearTimeout(timeoutId);
      }
    }, [dispatch, petId, productId, token])
  );

  // FETCH ITEM DATA
  const fetchItem = async (retryCount: number = 0) => {
    const maxRetries = 3;
    try {
      setIsLoading(true);
      setError(null);
      let response;

      if (petId) {
        console.log('🐾 Loading Pet:', petId);
        response = await petsService.getPetById(petId);
        console.log('API Pet Response:', response.data);
        const petData = {
          ...response.data,
          images: Array.isArray(response.data.images) ? response.data.images : [],
          variants: Array.isArray(response.data.variants) ? response.data.variants : [],
        };
        console.log('Normalized Pet Data:', petData);
        setItem(petData);
        if (petData.images.length > 0) {
          setSelectedVar({ id: petData.images[0]._id, image: { uri: petData.images[0].url } });
        }
      } else if (productId) {
        console.log('🛍️ Loading Product:', productId);
        response = await productsService.getProductById(productId);
        console.log('API Product Response:', response.data);
        const productData = {
          ...response.data,
          images: Array.isArray(response.data.images) ? response.data.images : [],
          variants: [],
        };
        console.log('Normalized Product Data:', productData);
        setItem(productData);
        if (productData.images.length > 0) {
          setSelectedVar({ id: productData.images[0]._id, image: { uri: productData.images[0].url } });
        }
      } else {
        throw new Error('No pet or product ID provided');
      }
    } catch (err: any) {
      console.error('Fetch item error:', err);
      if (err.response?.status === 404 && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return fetchItem(retryCount + 1);
      }
      setError(err.response?.status === 404 ? 'Item not found on server (404). Check the ID or server endpoint.' : err.message || 'Failed to load item data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (petId || productId) {
      fetchItem();
    } else {
      setError('No item ID provided');
      setIsLoading(false);
    }
  }, [petId, productId]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchItem()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Process item data
  const productTitle = item.name || 'Unknown Item';
  const productPrice = item.price ? `${item.price.toLocaleString('vi-VN')}₫` : 'N/A';
  const productImage = Array.isArray(item.images) && item.images.length > 0
    ? { uri: item.images[0].url }
    : require('@/assets/images/dog.png');
  const isPet = 'breed_id' in item;
  const breed = isPet ? (typeof (item as Pet).breed_id === 'object' ? (item as Pet).breed_id?.name || 'Unknown' : 'Unknown') : 'N/A';
  const age = isPet ? ((item as Pet).age ? `${(item as Pet).age} năm` : 'Unknown') : 'N/A';
  const gender = isPet ? (item as Pet).gender || 'Unknown' : 'N/A';
  const weight = isPet ? ((item as Pet).weight ? `${(item as Pet).weight} kg` : 'Unknown') : 'N/A';
  const description = item.description || (isPet ? 'Purus in massa tempor nec feugiat...' : 'Không có mô tả');

  // 🆕 Tính giá hiển thị với variant
  const displayPrice = selectedVariant
    ? (selectedVariant.final_price || (item.price + selectedVariant.price_adjustment))
    : item.price;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
        <TouchableOpacity style={styles.headerFav}>
          <Ionicons name="share-social-outline" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Main image */}
        <Header
          image={productImage}
          images={Array.isArray(item.images) ? item.images : []}
          selectedImageId={selectedVar?.id || (Array.isArray(item.images) && item.images[0]?._id) || ''}
        />

        <View style={styles.content}>
          {/* Sale badge và timer */}
          <View style={[styles.rowCenter, styles.spaceBetween]}>
            <Text style={styles.badge}>Sale</Text>
            <View style={styles.timerBox}>
              <Ionicons name="time-outline" size={16} color="#000" />
              <Text style={styles.timerText}>{`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`}</Text>
            </View>
          </View>

          {/* Price và rating - 🆕 Hiển thị giá variant */}
          <View style={[styles.rowCenter, styles.marginTop]}>
            <Text style={styles.price}>
              {displayPrice.toLocaleString('vi-VN')}₫
            </Text>
            <View style={styles.ratingRow}>
              <FontAwesome name="star" size={14} color="#FBBF24" />
              <Text style={styles.ratingText}>4.9</Text>
              <Text style={styles.soldText}>(Đã bán 50)</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{productTitle}</Text>

          {/* 🆕 Hiển thị thông tin variant đã chọn */}
          {selectedVariant && (
            <View style={styles.variantInfoContainer}>
              <Text style={styles.variantInfoTitle}>Biến thể đã chọn:</Text>
              <Text style={styles.variantInfoText}>
                {selectedVariant.variant_name || 'Biến thể đặc biệt'} - {selectedVariant.final_price ?
                  `${selectedVariant.final_price.toLocaleString('vi-VN')}₫` :
                  `+${selectedVariant.price_adjustment.toLocaleString('vi-VN')}₫`
                }
              </Text>
            </View>
          )}

          {/* Variations */}
          {Array.isArray(item.images) && item.images.length > 0 && (
            <VariationSelector
              images={item.images}
              onSelect={setSelectedVar}
              selectedId={selectedVar?.id || ''}
            />
          )}

          {/* Rating & Reviews */}
          <Text style={styles.sectionTitle}>Đánh giá & Nhận xét</Text>
          <View style={styles.reviewHeader}>
            <Text style={styles.avgRating}>4.5</Text>
            <FontAwesome name="star" size={16} color="#FBBF24" />
            <Text style={styles.ratingCount}>Đánh giá sản phẩm (90)</Text>
          </View>
          <ReviewCard navigation={navigation} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text
            style={styles.descText}
            numberOfLines={isDescriptionExpanded ? undefined : 3}
          >
            {description}
          </Text>
          <TouchableOpacity
            style={styles.toggleDescBtn}
            onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          >
            <Text style={styles.toggleDescText}>
              {isDescriptionExpanded ? 'Thu gọn' : 'Xem thêm'}
            </Text>
          </TouchableOpacity>

          {/* Description image */}
          <Image source={productImage} style={styles.descImage} />

          {/* Related items */}
          <Text style={styles.sectionTitle}>Sản phẩm liên quan</Text>
          <RelatedGrid
            navigation={navigation}
            currentItemId={item._id}
            currentItemType={isPet ? 'pet' : 'product'}
          />
        </View>
      </ScrollView>

      {/* 🔧 UPDATED FooterBar - thêm onBuyNow prop */}
      <FooterBar
        isFavorite={isFavorite}
        toggleFavorite={handleToggleFavorite}
        navigation={navigation}
        petId={petId}
        productId={productId}
        item={item}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow} // 🆕 Thêm prop mới
        isAddingToCart={isAddingToCart}
        selectedVariant={selectedVariant}
        isTogglingFavourite={isTogglingFavourite}
        isCheckingFavourite={isCheckingFavourite}
      />

      {/* 🆕 Variant Selector Modal - không thay đổi */}
      {item && 'breed_id' in item && Array.isArray((item as Pet).variants) && (
        <PetVariantSelector
          visible={showVariantSelector}
          onClose={() => setShowVariantSelector(false)}
          pet={item as Pet}
          onSelectVariant={handleVariantSelect}
          selectedVariant={selectedVariant}
        />
      )}

      {/* 🆕 CUSTOM ALERT COMPONENT cho yêu thích */}
      <CustomFavouriteAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        itemName={alertConfig.itemName}
        itemImage={alertConfig.itemImage}
        onClose={hideAlert}
        onConfirm={alertConfig.onConfirm}
        onCancel={hideAlert}
      />

      {/* 🆕 TOAST COMPONENT cho yêu thích */}
      <FavouriteToast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        actionText={toastConfig.actionText}
        onActionPress={toastConfig.onActionPress}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
};

export default ProductDetailScreen;

// 🆕 STYLES - Gộp tất cả styles từ cả hai phiên bản
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 35,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold' },
  headerFav: { padding: 4 },
  headerImage: { width: '100%', height: 300 },
  carouselDots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 8, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', margin: 4 },
  dotActive: { backgroundColor: '#2563EB' },
  content: { padding: 16 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  spaceBetween: { justifyContent: 'space-between' },
  badge: { color: '#EF4444', borderColor: '#FECACA', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  timerBox: { flexDirection: 'row', alignItems: 'center', padding: 4, borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 4 },
  timerText: { marginLeft: 4 },
  marginTop: { marginTop: 8 },
  price: { color: '#EF4444', fontSize: 20, fontWeight: 'bold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 16 },
  ratingText: { marginHorizontal: 4 },
  soldText: { color: '#6B7280' },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },

  // 🆕 Styles cho variant info
  variantInfoContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  variantInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  variantInfoText: {
    fontSize: 13,
    color: '#374151',
  },

  varList: { paddingVertical: 8 },
  varItem: { marginRight: 12, borderRadius: 8 },
  varSelected: { borderWidth: 2, borderColor: '#10B981' },
  varImg: { width: 60, height: 60, borderRadius: 8 },
  infoBox: { marginTop: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoKey: { color: '#374151' },
  infoVal: { fontWeight: '500' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  avgRating: { fontSize: 18, fontWeight: '600', marginRight: 4 },
  ratingCount: { color: '#6B7280', marginLeft: 8 },
  reviewCard: { flexDirection: 'row', marginTop: 12, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewContent: { flex: 1 },
  reviewer: { fontWeight: '600' },
  starRow: { flexDirection: 'row', marginVertical: 4 },
  reviewText: { color: '#374151', marginBottom: 8 },
  viewAllBtn: { backgroundColor: '#2563EB', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  viewAllText: { color: '#fff', fontWeight: '600' },
  descText: { color: '#6B7280', lineHeight: 20, marginTop: 8 },
  toggleDescBtn: { marginTop: 8, alignSelf: 'flex-start' },
  toggleDescText: { color: '#2563EB', fontWeight: '600' },
  descImage: { width: '100%', height: 200, borderRadius: 8, marginVertical: 16 },
  relatedRow: { justifyContent: 'space-between' },
  relatedItem: { width: '48%', marginBottom: 16 },
  relatedImg: { width: '100%', height: 120, borderRadius: 8 },
  relatedTitle: { marginTop: 8, color: '#374151', fontSize: 14 },
  relatedPrice: { fontWeight: '600', marginTop: 4, color: '#EF4444' },

  // Styles cho RelatedGrid loading
  relatedLoadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyRelatedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyRelatedText: {
    fontSize: 14,
    color: '#999',
  },

  // 🆕 ENHANCED FOOTER STYLES - Gộp từ cả hai phiên bản
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },

  favBtn: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1 }],
  },

  favBtnActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    shadowColor: '#EF4444',
    shadowOpacity: 0.2,
    transform: [{ scale: 1.05 }],
  },

  favBtnLoading: {
    borderColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },

  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.05,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartBtn: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartBtnTxt: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  buyBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buyBtnTxt: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Loading và error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D94A4A',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});