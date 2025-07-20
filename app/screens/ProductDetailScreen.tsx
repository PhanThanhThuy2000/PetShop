// app/screens/ProductDetailScreen.tsx - UPDATED WITH CUSTOM HOOKS
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

// ✅ UPDATED IMPORTS - Using your custom components and hooks (WITHOUT useFavouriteStatus)
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
import { Pet, PetImage, Product, ProductImage } from '../types';

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

const VariationSelector: FC<{ images: (PetImage | ProductImage)[]; onSelect: (v: Variation) => void; selectedId: string }> = ({ images, onSelect, selectedId }) => (
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
          <Text style={styles.viewAllText}>View All Reviews</Text>
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

        if (response.success) {
          const filteredPets = response.data
            .filter((pet: Pet) => pet._id !== currentItemId)
            .slice(0, 4);
          setRelatedItems(filteredPets);
        }
      } else {
        const response = await productsService.getProducts({ limit: 8 });

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
        {item.price?.toLocaleString('vi-VN')}đ
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

// ✅ ENHANCED FooterBar Component với checkFavouriteStatus support
const FooterBar: FC<{
  isFavorite: boolean;
  toggleFavorite: () => void;
  navigation: any;
  petId?: string;
  productId?: string;
  item: Pet | Product;
  onAddToCart: () => void;
  isAddingToCart: boolean;
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
  isAddingToCart,
  isTogglingFavourite = false,
  isCheckingFavourite = false
}) => (
    <View style={styles.footer}>
      {/* ✅ ENHANCED FAVOURITE BUTTON với improved visual states */}
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

      {/* ✅ ADD TO CART BUTTON */}
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
          <Text style={styles.cartBtnTxt}>Thêm vào giỏ</Text>
        )}
      </TouchableOpacity>

      {/* ✅ BUY NOW BUTTON */}
      <TouchableOpacity
        style={[
          styles.buyBtn,
          (isAddingToCart || isTogglingFavourite || isCheckingFavourite) && styles.buttonDisabled
        ]}
        disabled={isAddingToCart || isTogglingFavourite || isCheckingFavourite}
        onPress={() => {
          const cartItems = [{
            id: item._id,
            title: item.name,
            price: item.price,
            quantity: 1,
            image: item.images && item.images.length > 0
              ? { uri: item.images[0].url }
              : require('@/assets/images/dog.png'),
            type: petId ? 'pet' : 'product',
          }];
          const total = item.price;
          navigation.navigate('Payment', { cartItems, total, petId, productId });
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.buyBtnTxt}>Mua ngay</Text>
      </TouchableOpacity>
    </View>
  );

const ProductDetailScreen: FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();

  // ✅ GET PARAMS FIRST
  const petId = route.params?.pet?._id || route.params?.petId;
  const productId = route.params?.productId || route.params?.id;

  // ✅ UPDATED CUSTOM HOOKS - Using your implementations (WITHOUT useFavouriteStatus)
  const { alertConfig, showRemoveAlert, hideAlert } = useFavouriteAlert();
  const {
    showFavouriteAdded,
    showFavouriteRemoved,
    showFavouriteError,
    showNetworkError,
    toastConfig,
    hideToast
  } = useFavouriteToast();

  // ✅ REDUX STATE - Keep original logic
  const { favourites, loading: favouriteLoading, favouriteStatusMap } = useSelector((state: RootState) => state.favourites);
  const { isLoading: cartLoading } = useSelector((state: RootState) => state.cart);

  // ✅ MEMOIZED FAVOURITE STATUS - Back to original logic
  const isFavorite = useMemo(() => {
    const key = petId ? `pet_${petId}` : `product_${productId}`;
    return favouriteStatusMap[key] || false;
  }, [favouriteStatusMap, petId, productId]);

  // ✅ LOCAL STATE
  const [item, setItem] = useState<Pet | Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVar, setSelectedVar] = useState<Variation | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingFavourite, setIsTogglingFavourite] = useState(false);
  const [isCheckingFavourite, setIsCheckingFavourite] = useState(false); // ✅ Keep this for manual checking

  const { h, m, s } = useCountdown(36 * 60 + 58);

  // ✅ ENHANCED handleToggleFavorite using custom hooks (WITHOUT auto-status management)
  const handleToggleFavorite = async () => {
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
      // ✅ STEP 1: CHECK CURRENT STATUS FROM SERVER
      const statusResult = await dispatch(checkFavouriteStatus(params)).unwrap();
      const currentServerStatus = statusResult.isFavorite;

      console.log('✅ Current server status:', currentServerStatus);
      console.log('📱 Current local status:', isFavorite);

      setIsCheckingFavourite(false);

      // ✅ STEP 2: HANDLE BASED ON SERVER STATUS
      if (currentServerStatus) {
        // ✅ ITEM IS IN FAVOURITES - SHOW CUSTOM CONFIRMATION DIALOG
        console.log('💬 Item is in favourites, showing custom remove confirmation...');

        showRemoveAlert(
          itemDisplayName,
          itemImage,
          async () => {
            // ✅ USER CONFIRMED REMOVAL
            console.log('✅ User confirmed removal');
            setIsTogglingFavourite(true);

            try {
              await dispatch(removeFromFavourites(params)).unwrap();
              await dispatch(fetchFavourites());

              // ✅ SHOW SUCCESS TOAST with undo option
              showFavouriteRemoved(itemDisplayName, async () => {
                // ✅ UNDO FUNCTION
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
        // ✅ ITEM NOT IN FAVOURITES - ADD DIRECTLY
        console.log('➕ Item not in favourites, adding directly...');
        setIsTogglingFavourite(true);

        try {
          await dispatch(addToFavourites(params)).unwrap();
          await dispatch(fetchFavourites());

          // ✅ SHOW SUCCESS TOAST
          showFavouriteAdded(itemDisplayName);

        } catch (error: any) {
          console.error('❌ Add favourite error:', error);

          const errorMessage = error as string;
          const isDuplicate = errorMessage?.includes('đã có trong') ||
            errorMessage?.includes('duplicate') ||
            errorMessage?.includes('yêu thích');

          if (isDuplicate) {
            // ✅ DUPLICATE case - show success anyway
            showFavouriteAdded(itemDisplayName);
          } else {
            // ✅ REAL ERROR - check if network error
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

      // ✅ CHECK IF NETWORK ERROR
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
  // const handleToggleFavorite = async () => {
  //   if (!item || isTogglingFavourite || isCheckingFavourite) {
  //     return;
  //   }

  //   const params = petId ? { pet_id: petId } : { product_id: productId };
  //   const itemDisplayName = item.name || 'sản phẩm này';

  //   console.log('🔄 Toggle favourite clicked for:', itemDisplayName);
  //   setIsCheckingFavourite(true);

  //   try {
  //     const statusResult = await dispatch(checkFavouriteStatus(params)).unwrap();
  //     const currentServerStatus = statusResult.isFavorite;

  //     setIsCheckingFavourite(false);

  //     if (currentServerStatus) {
  //       // REMOVE - Show confirmation
  //       Alert.alert(
  //         'Xóa khỏi yêu thích',
  //         `Bạn có chắc muốn xóa "${itemDisplayName}" khỏi danh sách yêu thích?`,
  //         [
  //           { text: 'Hủy', style: 'cancel' },
  //           {
  //             text: 'Xóa',
  //             style: 'destructive',
  //             onPress: async () => {
  //               setIsTogglingFavourite(true);
  //               try {
  //                 await dispatch(removeFromFavourites(params)).unwrap();
  //                 await dispatch(fetchFavourites());
  //                 Alert.alert('Thành công', `Đã xóa "${itemDisplayName}" khỏi yêu thích`);
  //               } catch (error) {
  //                 Alert.alert('Lỗi', 'Không thể xóa khỏi yêu thích');
  //               } finally {
  //                 setIsTogglingFavourite(false);
  //               }
  //             }
  //           }
  //         ]
  //       );
  //     } else {
  //       // ADD - Direct add
  //       setIsTogglingFavourite(true);
  //       try {
  //         await dispatch(addToFavourites(params)).unwrap();
  //         await dispatch(fetchFavourites());
  //         Alert.alert('Thành công', `Đã thêm "${itemDisplayName}" vào yêu thích`);
  //       } catch (error) {
  //         Alert.alert('Lỗi', 'Không thể thêm vào yêu thích');
  //       } finally {
  //         setIsTogglingFavourite(false);
  //       }
  //     }
  //   } catch (error) {
  //     setIsCheckingFavourite(false);
  //     Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái yêu thích');
  //   }
  // };
  // ✅ FETCH FAVOURITES ON MOUNT
  useEffect(() => {
    console.log('🔄 ProductDetail mounted, fetching favourites...');
    dispatch(fetchFavourites());
  }, [dispatch]);

  // ✅ CHECK FAVOURITE STATUS WHEN ITEM LOADS - OPTIMIZED
  useEffect(() => {
    if (item && (petId || productId)) {
      const key = petId ? `pet_${petId}` : `product_${productId}`;

      // ✅ ONLY CHECK IF NOT ALREADY IN STATUS MAP
      if (!(key in favouriteStatusMap)) {
        console.log('🔍 Checking favourite status for new item:', { petId, productId });
        const params = petId ? { pet_id: petId } : { product_id: productId };
        dispatch(checkFavouriteStatus(params));
      }
    }
  }, [item, petId, productId, dispatch, favouriteStatusMap]);

  // ✅ FETCH FAVOURITES KHI FOCUS VÀO SCREEN - OPTIMIZED (Back to original)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 ProductDetail focused, refreshing favourites...');
      dispatch(fetchFavourites());

      // ✅ DEBOUNCED CHECK STATUS to avoid excessive calls
      const timeoutId = setTimeout(() => {
        if (petId || productId) {
          const params = petId ? { pet_id: petId } : { product_id: productId };
          dispatch(checkFavouriteStatus(params));
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }, [dispatch, petId, productId])
  );

  // ✅ SINGLE ADD TO CART FUNCTION (không thay đổi)
  const handleAddToCart = async () => {
    if (!item) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin sản phẩm');
      return;
    }

    setIsAddingToCart(true);

    try {
      const cartParams = {
        quantity: 1,
        ...(petId ? { pet_id: petId } : { product_id: productId })
      };

      console.log('Adding to cart with params:', cartParams);

      await dispatch(addToCart(cartParams)).unwrap();
      dispatch(getCart());

      Alert.alert(
        'Thành công',
        `${item.name} đã được thêm vào giỏ hàng`,
        [
          { text: 'Tiếp tục mua sắm', style: 'cancel' },
          {
            text: 'Xem giỏ hàng',
            onPress: () => navigation.navigate('Cart')
          }
        ]
      );

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

  // ✅ FETCH ITEM DATA (không thay đổi)
  const fetchItem = async (retryCount: number = 0) => {
    const maxRetries = 3;
    try {
      setIsLoading(true);
      setError(null);
      let response;

      if (petId) {
        console.log('🐾 Loading Pet:', petId);
        response = await petsService.getPetById(petId);
        setItem(response.data);
        if (response.data.images && response.data.images.length > 0) {
          setSelectedVar({ id: response.data.images[0]._id, image: { uri: response.data.images[0].url } });
        }
      } else if (productId) {
        console.log('🛍️ Loading Product:', productId);
        response = await productsService.getProductById(productId);
        setItem(response.data);
        if (response.data.images && response.data.images.length > 0) {
          setSelectedVar({ id: response.data.images[0]._id, image: { uri: response.data.images[0].url } });
        }
      } else {
        throw new Error('No pet or product ID provided');
      }
    } catch (err: any) {
      if (err.response?.status === 404 && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return fetchItem(retryCount + 1);
      }
      setError(err.response?.status === 404 ? 'Item not found' : err.message || 'Failed to load item');
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

  // ✅ Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Error state
  if (error || !item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchItem()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Process item data
  const productTitle = item.name || 'Unknown Item';
  const productPrice = item.price ? `${item.price.toLocaleString('vi-VN')}₫` : 'N/A';
  const productImage = item.images && item.images.length > 0
    ? { uri: item.images[0].url }
    : require('@/assets/images/dog.png');
  const isPet = 'breed_id' in item;
  const breed = isPet ? (item as Pet).breed_id?.name || 'Unknown' : 'N/A';
  const age = isPet ? ((item as Pet).age ? `${(item as Pet).age} year${(item as Pet).age > 1 ? 's' : ''}` : 'Unknown') : 'N/A';
  const gender = isPet ? (item as Pet).gender || 'Unknown' : 'N/A';
  const weight = isPet ? ((item as Pet).weight ? `${(item as Pet).weight} kg` : 'Unknown') : 'N/A';
  const description = item.description || (isPet ? 'Purus in massa tempor nec feugiat...' : 'No description available');

  return (
    <SafeAreaView style={styles.container}>

      {/* ✅ Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Detail</Text>
        <TouchableOpacity style={styles.headerFav}>
          <Ionicons name="share-social-outline" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* ✅ Main image với carousel */}
        <Header
          image={productImage}
          images={item.images || []}
          selectedImageId={selectedVar?.id || (item.images && item.images[0]?._id) || ''}
        />

        <View style={styles.content}>
          {/* ✅ Sale badge và timer */}
          <View style={[styles.rowCenter, styles.spaceBetween]}>
            <Text style={styles.badge}>Sale</Text>
            <View style={styles.timerBox}>
              <Ionicons name="time-outline" size={16} color="#000" />
              <Text style={styles.timerText}>{`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`}</Text>
            </View>
          </View>

          {/* ✅ Price và rating */}
          <View style={[styles.rowCenter, styles.marginTop]}>
            <Text style={styles.price}>{productPrice}</Text>
            <View style={styles.ratingRow}>
              <FontAwesome name="star" size={14} color="#FBBF24" />
              <Text style={styles.ratingText}>4.9</Text>
              <Text style={styles.soldText}>(Sold 50)</Text>
            </View>
          </View>

          {/* ✅ Title */}
          <Text style={styles.title}>{productTitle}</Text>

          {/* ✅ Variations */}
          <Text style={styles.sectionTitle}>Variations</Text>
          {item.images && item.images.length > 0 && (
            <VariationSelector
              images={item.images}
              onSelect={setSelectedVar}
              selectedId={selectedVar?.id || ''}
            />
          )}

          {/* ✅ Information (chỉ cho Pet) */}
          {isPet && (
            <>
              <Text style={styles.sectionTitle}>Information</Text>
              <View style={styles.infoBox}>
                <InfoRow label="Gender" value={gender} />
                <InfoRow label="Age" value={age} />
                <InfoRow label="Weight" value={weight} />
                <InfoRow label="Breed" value={breed} />
              </View>
            </>
          )}

          {/* ✅ Rating & Reviews */}
          <Text style={styles.sectionTitle}>Rating & Reviews</Text>
          <View style={styles.reviewHeader}>
            <Text style={styles.avgRating}>4.5</Text>
            <FontAwesome name="star" size={16} color="#FBBF24" />
            <Text style={styles.ratingCount}>Product Ratings (90)</Text>
          </View>
          <ReviewCard navigation={navigation} />

          {/* ✅ Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text
            style={styles.descText}
            numberOfLines={isDescriptionExpanded ? undefined : 3}
          >
            {description || 'No description available'}
          </Text>
          <TouchableOpacity
            style={styles.toggleDescBtn}
            onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          >
            <Text style={styles.toggleDescText}>
              {isDescriptionExpanded ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>

          {/* ✅ Description image */}
          <Image source={productImage} style={styles.descImage} />

          {/* ✅ Related items */}
          <Text style={styles.sectionTitle}>Related Items</Text>
          <RelatedGrid
            navigation={navigation}
            currentItemId={item._id}
            currentItemType={isPet ? 'pet' : 'product'}
          />
        </View>
      </ScrollView>

      {/* ✅ Bottom actions với custom favourite handling */}
      <FooterBar
        isFavorite={isFavorite}
        toggleFavorite={handleToggleFavorite}
        navigation={navigation}
        petId={petId}
        productId={productId}
        item={item}
        onAddToCart={handleAddToCart}
        isAddingToCart={isAddingToCart}
        isTogglingFavourite={isTogglingFavourite}
        isCheckingFavourite={isCheckingFavourite}
      />

      {/* ✅ CUSTOM ALERT COMPONENT */}
      <CustomFavouriteAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        itemName={alertConfig.itemName}
        itemImage={alertConfig.itemImage}
        onClose={hideAlert}
        onConfirm={alertConfig.onConfirm}
        onCancel={hideAlert}
      />

      {/* ✅ TOAST COMPONENT */}
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

// ✅ KEEP ALL EXISTING STYLES - Giữ nguyên tất cả styles
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
  topIcons: { position: 'absolute', top: 16, right: 16, flexDirection: 'row' },
  iconBtn: { marginLeft: 12 },
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

  // ✅ Styles cho RelatedGrid loading
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

  // ✅ ENHANCED FOOTER STYLES
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

  favBtnPressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.7,
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