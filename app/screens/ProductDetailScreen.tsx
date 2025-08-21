import PetVariantSelector from '@/components/PetVariantSelector';
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
import { CustomFavouriteAlert } from '../../components/ui/CustomFavouriteAlert';
import { FavouriteToast } from '../../components/ui/FavouriteToast';
import { useFavouriteAlert } from '../../hooks/useFavouriteAlert';
import { useFavouriteToast } from '../../hooks/useFavouriteToast';
import { addToCart, getCart } from '../redux/slices/cartSlice';
import {
  addToFavourites,
  checkFavouriteStatus,
  fetchFavourites,
  removeFromFavourites
} from '../redux/slices/favouriteSlice';
import { AppDispatch, RootState } from '../redux/store';
import { petsService } from '../services/petsService';
import { productsService } from '../services/productsService';
import { Review, reviewService, ReviewStats } from '../services/ReviewServices';
import { Pet, PetImage, PetVariant, Product, ProductImage } from '../types';
import { API_BASE_URL } from '../utils/api-client';
import { requiresAuth, useAuthGuard } from '../utils/authGuard';
import { PetVariantHelpers } from '../utils/petVariantHelpers'; // 🆕 IMPORT PetVariantHelpers

// --- Data Interfaces ---
interface Variation { id: string; image: any; }

interface RelatedItem {
  _id: string;
  name: string;
  price: number;
  images?: Array<{ url: string; is_primary?: boolean }>;
  itemType: 'pet' | 'product';
  relationshipType?: string;
  similarityScore?: number;
  compatibleWithPetType?: string;
  breed_id?: any;
  category_id?: any;
}

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

// ReviewCard Component
const ReviewCard: FC<{
  navigation: any;
  reviews: Review[];
  reviewStats: ReviewStats;
  onViewAllPress: () => void;
  loading: boolean;
}> = ({ navigation, reviews, reviewStats, onViewAllPress, loading }) => {
  if (loading) {
    return (
      <View style={styles.reviewLoadingContainer}>
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.reviewLoadingText}>Đang tải đánh giá...</Text>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.noReviewsContainer}>
        <FontAwesome name="star-o" size={32} color="#9CA3AF" />
        <Text style={styles.noReviewsText}>Chưa có đánh giá nào</Text>
        <Text style={styles.noReviewsSubtext}>Hãy là người đầu tiên đánh giá!</Text>
      </View>
    );
  }

  const latestReview = reviews[0];

  return (
    <View style={styles.reviewCard}>
      <Image
        source={{
          uri: latestReview.user_id?.avatar || 'https://via.placeholder.com/40'
        }}
        style={styles.avatar}
      />
      <View style={styles.reviewContent}>
        <Text style={styles.reviewer}>
          {latestReview.user_id?.username || 'Người dùng'}
        </Text>
        <View style={styles.starRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <FontAwesome
              key={i}
              name="star"
              size={14}
              color={i < latestReview.rating ? "#FBBF24" : "#E5E7EB"}
            />
          ))}
          <Text style={styles.reviewDate}>
            {new Date(latestReview.created_at).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <Text numberOfLines={3} style={styles.reviewText}>
          {latestReview.comment}
        </Text>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={onViewAllPress}
        >
          <Text style={styles.viewAllText}>
            Xem tất cả {reviewStats.totalReviews} đánh giá
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// RelatedItems Component
const RelatedItems: FC<{
  navigation: any;
  currentItemId: string;
  currentItemType: 'pet' | 'product';
  limit?: number;
}> = ({ navigation, currentItemId, currentItemType, limit = 8 }) => {
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<any>(null);

  useEffect(() => {
    if (currentItemId && currentItemType) {
      loadRelatedItems();
    }
  }, [currentItemId, currentItemType]);

  const loadRelatedItems = async () => {
    try {
      setLoading(true);
      console.log('🔗 Loading related items for:', { currentItemId, currentItemType });

      let response;

      if (currentItemType === 'pet') {
        response = await petsService.getRelatedItems(currentItemId, limit);
      } else {
        response = await productsService.getRelatedItems(currentItemId, limit);
      }

      if (response.success) {
        console.log('✅ Related items response:', response.data);
        const relatedData = response.data.relatedItems || [];
        setRelatedItems(relatedData);
        setBreakdown(response.data.breakdown);
      }
    } catch (error) {
      console.error('❌ Error loading related items:', error);
      await loadFallbackItems();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackItems = async () => {
    try {
      console.log('⚠️ Using fallback method for related items');
      let items: RelatedItem[] = [];

      if (currentItemType === 'pet') {
        const response = await petsService.getPets({ limit: limit + 1 });
        if (response.success) {
          items = response.data
            .filter((pet: Pet) => pet._id !== currentItemId)
            .slice(0, limit)
            .map((pet: Pet) => ({
              ...pet,
              price: PetVariantHelpers.getPetPrice(pet), // 🆕 Sử dụng PetVariantHelpers
              itemType: 'pet' as const,
              relationshipType: 'similar'
            }));
        }
      } else {
        const response = await productsService.getProducts({ limit: limit + 1 });
        if (response.success) {
          items = response.data
            .filter((product: Product) => product._id !== currentItemId)
            .slice(0, limit)
            .map((product: Product) => ({
              ...product,
              itemType: 'product' as const,
              relationshipType: 'similar'
            }));
        }
      }

      setRelatedItems(items);
    } catch (error) {
      console.error('❌ Fallback loading failed:', error);
      setRelatedItems([]);
    }
  };

  const handleItemPress = (item: RelatedItem) => {
    console.log('🎯 Related item pressed:', {
      itemType: item.itemType,
      itemId: item._id,
      relationshipType: item.relationshipType
    });

    if (item.itemType === 'pet') {
      navigation.push('ProductDetail', {
        petId: item._id,
      });
    } else {
      navigation.push('ProductDetail', {
        productId: item._id,
      });
    }
  };

  const getRelationshipBadge = (relationshipType?: string) => {
    const badges = {
      'same-breed': { text: 'Cùng giống', color: '#10B981' },
      'same-category': { text: 'Cùng loại', color: '#3B82F6' },
      'pet-compatible': { text: 'Phù hợp', color: '#8B5CF6' },
      'similar-price': { text: 'Giá tương tự', color: '#F59E0B' },
      'similar': { text: 'Tương tự', color: '#6B7280' }
    };

    const badge = badges[relationshipType as keyof typeof badges] || badges.similar;

    return (
      <View style={[styles.relationshipBadge, { backgroundColor: badge.color }]}>
        <Text style={styles.relationshipBadgeText}>{badge.text}</Text>
      </View>
    );
  };

  const getImageUrl = (item: RelatedItem): string => {
    if (item.images && item.images.length > 0) {
      const primaryImage = item.images.find(img => img.is_primary);
      return primaryImage?.url || item.images[0]?.url || 'https://via.placeholder.com/150';
    }
    return 'https://via.placeholder.com/150?text=No+Image';
  };

  const getDisplayPrice = (item: RelatedItem): string => {
    if (item.itemType === 'pet') {
      // Kiểm tra xem item có variants và display_price hợp lệ không
      if (item.variants && item.variants.length > 0 && item.display_price !== null && item.display_price !== undefined) {
        // Nếu có khoảng giá (hasRange = true), hiển thị khoảng giá
        if (item.price_range?.hasRange && item.price_range.min !== null && item.price_range.max !== null) {
          return `${item.price_range.min.toLocaleString('vi-VN')}₫ - ${item.price_range.max.toLocaleString('vi-VN')}₫`;
        }
        // Nếu không có khoảng giá, hiển thị display_price
        return item.display_price.toLocaleString('vi-VN') + '₫';
      }
      // Nếu không có variants hoặc display_price, sử dụng PetVariantHelpers
      const price = PetVariantHelpers.getPetPrice(item as any);
      return price !== undefined && price !== null && price > 0 ? price.toLocaleString('vi-VN') + '₫' : 'Giá không khả dụng';
    } else {
      // Đối với product, sử dụng item.price
      return item.price !== undefined && item.price !== null && item.price > 0
        ? item.price.toLocaleString('vi-VN') + '₫'
        : 'Giá không khả dụng';
    }
  };

  const renderRelatedItem = ({ item, index }: { item: RelatedItem, index: number }) => {
    return (
      <TouchableOpacity
        key={`related-${item._id}-${item.itemType}-${index}`}
        style={styles.relatedItem}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageUrl(item) }}
            style={styles.relatedImage}
            resizeMode="cover"
          />
          {item.relationshipType && getRelationshipBadge(item.relationshipType)}
          <View style={styles.itemTypeBadge}>
            <Text style={styles.itemTypeBadgeText}>
              {item.itemType === 'pet' ? '🐾' : '🛍️'}
            </Text>
          </View>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.itemPrice}>
            {getDisplayPrice(item)}
          </Text>
          {item.compatibleWithPetType && (
            <Text style={styles.compatibilityText}>
              Dành cho {item.compatibleWithPetType}
            </Text>
          )}
          {item.similarityScore && (
            <Text style={styles.similarityScore}>
              Độ tương tự: {item.similarityScore}%
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.loadingText}>Đang tải sản phẩm liên quan...</Text>
      </View>
    );
  }

  if (relatedItems.length === 0) {
    return (
      <View style={styles.emptyRelatedContainer}>
        <Text style={styles.emptyRelatedText}>
          Không có {currentItemType === 'pet' ? 'thú cưng' : 'sản phẩm'} liên quan
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.relatedContainer}>
      {breakdown && (
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownText}>
            {currentItemType === 'pet'
              ? `${breakdown.sameBreed || 0} cùng giống • ${breakdown.relatedProducts || 0} sản phẩm phù hợp • ${breakdown.sameCategoryPets || 0} cùng loại`
              : `${breakdown.sameCategory || 0} cùng loại • ${breakdown.relatedPets || 0} pets phù hợp • ${breakdown.similarPrice || 0} giá tương tự`
            }
          </Text>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {relatedItems.map((item, index) => renderRelatedItem({ item, index }))}
      </ScrollView>
    </View>
  );
};

// SimilarPets Component
const SimilarPets: FC<{
  navigation: any;
  petId?: string;
  limit?: number;
  showSimilarityScore?: boolean;
}> = ({ navigation, petId, limit = 6, showSimilarityScore = true }) => {
  const [similarPets, setSimilarPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (petId) {
      loadSimilarPets();
    }
  }, [petId]);

  const loadSimilarPets = async () => {
    if (!petId) return;

    try {
      setLoading(true);
      console.log('🧠 Loading similar pets for:', petId);
      const response = await petsService.getSimilarPets(petId, limit);
      if (response.success) {
        console.log('✅ Similar pets loaded:', response.data);
        setSimilarPets(response.data.similarPets?.map((pet: Pet) => ({
          ...pet,
          price: PetVariantHelpers.getPetPrice(pet) // 🆕 Sử dụng PetVariantHelpers
        })) || []);
      }
    } catch (error) {
      console.error('❌ Error loading similar pets:', error);
      setSimilarPets([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePetPress = (pet: any) => {
    console.log('🎯 Similar pet pressed:', pet._id, 'Score:', pet.similarityScore);
    navigation.push('ProductDetail', {
      petId: pet._id,
    });
  };

  const getImageUrl = (pet: any): string => {
    if (pet.images && pet.images.length > 0) {
      const primaryImage = pet.images.find((img: any) => img.is_primary);
      return primaryImage?.url || pet.images[0]?.url || 'https://via.placeholder.com/150';
    }
    return 'https://via.placeholder.com/150?text=Pet';
  };

  const getSimilarityColor = (score: number): string => {
    if (score >= 180) return '#10B981';
    if (score >= 120) return '#3B82F6';
    if (score >= 80) return '#F59E0B';
    return '#EF4444';
  };

  if (similarPets.length === 0) {
    return null;
  }

  return (
    <View style={styles.relatedContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {similarPets.map((pet, index) => (
          <TouchableOpacity
            key={`similar-${pet._id}-${index}`}
            style={styles.relatedItem}
            onPress={() => handlePetPress(pet)}
            activeOpacity={0.7}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: getImageUrl(pet) }}
                style={styles.relatedImage}
                resizeMode="cover"
              />
              {showSimilarityScore && pet.similarityScore && (
                <View style={[
                  styles.similarityBadge,
                  { backgroundColor: getSimilarityColor(pet.similarityScore) }
                ]}>
                  <Text style={styles.similarityBadgeText}>
                    {Math.round(pet.similarityScore)}
                  </Text>
                </View>
              )}
              <View style={styles.itemTypeBadge}>
                <Text style={styles.itemTypeBadgeText}>🐾</Text>
              </View>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {pet.name}
              </Text>
              <Text style={styles.petBreed} numberOfLines={1}>
                {typeof pet.breed_id === 'object' ? pet.breed_id?.name : 'Chưa rõ giống'}
              </Text>
              <Text style={styles.itemPrice}>
                {pet.price > 0 ? pet.price.toLocaleString('vi-VN') + '₫' : 'Giá không khả dụng'} {/* 🆕 Xử lý giá không hợp lệ */}
              </Text>
              {showSimilarityScore && pet.similarityScore && (
                <View style={styles.similarityInfo}>
                  <Ionicons
                    name="analytics-outline"
                    size={12}
                    color={getSimilarityColor(pet.similarityScore)}
                  />
                  <Text style={[
                    styles.similarityText,
                    { color: getSimilarityColor(pet.similarityScore) }
                  ]}>
                    Giống {pet.similarityScore >= 180 ? 'rất nhiều' : pet.similarityScore >= 120 ? 'nhiều' : 'khá nhiều'}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// CompatibleProducts Component
const CompatibleProducts: FC<{
  navigation: any;
  petType: string;
  limit?: number;
}> = ({ navigation, petType, limit = 4 }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (petType) {
      loadCompatibleProducts();
    }
  }, [petType]);

  const loadCompatibleProducts = async () => {
    if (!petType) return;

    try {
      setLoading(true);
      console.log('🛍️ Loading compatible products for pet type:', petType);
      const response = await petsService.getCompatibleProducts(petType, limit);
      if (response.success) {
        console.log('✅ Compatible products loaded:', response.data);
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('❌ Error loading compatible products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product: any) => {
    console.log('🎯 Compatible product pressed:', product._id);
    navigation.push('ProductDetail', {
      productId: product._id,
    });
  };

  const getImageUrl = (images: any[] = []) => {
    if (images && images.length > 0) {
      const primaryImage = images.find(img => img.is_primary);
      return primaryImage?.url || images[0]?.url;
    }
    return 'https://via.placeholder.com/150?text=No+Image';
  };
  const getPetTypeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      'chó': '🐕',
      'mèo': '🐱',
      'chim': '🐦',
      'cá': '🐟',
      'hamster': '🐹',
      'thỏ': '🐰',
      'dog': '🐕',
      'cat': '🐱',
      'bird': '🐦',
      'fish': '🐟',
      'rabbit': '🐰'
    };
    return icons[type.toLowerCase()] || '🐾';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.loadingText}>Đang tìm sản phẩm phù hợp...</Text>
      </View>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.relatedContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {products.map((product, index) => (
          <TouchableOpacity
            key={`compatible-${product._id}-${index}`}
            style={styles.relatedItem}
            onPress={() => handleProductPress(product)}
            activeOpacity={0.7}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: getImageUrl(product) }}
                style={styles.relatedImage}
                resizeMode="cover"
              />
              <View style={styles.compatibilityBadge}>
                <Text style={styles.compatibilityBadgeText}>
                  {getPetTypeIcon(petType)}
                </Text>
              </View>
              <View style={styles.itemTypeBadge}>
                <Text style={styles.itemTypeBadgeText}>🛍️</Text>
              </View>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {product.name}
              </Text>
              {product.category_id && (
                <Text style={styles.petBreed} numberOfLines={1}>
                  {typeof product.category_id === 'object' ? product.category_id?.name : 'Sản phẩm'}
                </Text>
              )}
              <Text style={styles.itemPrice}>
                {product.price?.toLocaleString('vi-VN')}₫
              </Text>
              <View style={styles.compatibilityInfoContainer}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text style={styles.compatibilityText}>
                  Phù hợp cho {petType}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// FooterBar Component
const FooterBar: FC<{
  isFavorite: boolean;
  toggleFavorite: () => void;
  navigation: any;
  petId?: string;
  productId?: string;
  item: Pet | Product;
  onAddToCart: () => void;
  onBuyNow: () => void;
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
  onBuyNow,
  isAddingToCart,
  selectedVariant,
  isTogglingFavourite = false,
  isCheckingFavourite = false,
}) => {
    const getDisplayPrice = () => {
      if (selectedVariant) {
        const price = PetVariantHelpers.getFinalPrice(selectedVariant);
        return price;
      }
      if ('breed_id' in item) {
        const defaultVariant = PetVariantHelpers.getDefaultVariant(item as Pet);
        if (defaultVariant) {
          const price = PetVariantHelpers.getFinalPrice(defaultVariant);
          return price;
        }
        const price = PetVariantHelpers.getPetPrice(item as Pet);
        return price;
      }
      return (item as Product).price || 0;
    };

    const hasVariants = 'breed_id' in item && Array.isArray(item.variants) && item.variants.length > 0;

    return (
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.favBtn,
            isFavorite && styles.favBtnActive,
            (isTogglingFavourite || isCheckingFavourite) && styles.favBtnLoading,
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
        <TouchableOpacity
          style={[
            styles.cartBtn,
            (isAddingToCart || isTogglingFavourite || isCheckingFavourite) && styles.buttonDisabled,
          ]}
          onPress={onAddToCart}
          disabled={isAddingToCart || isTogglingFavourite || isCheckingFavourite}
          activeOpacity={0.8}
        >
          {isAddingToCart ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="cart-outline" size={24} color="#fff" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.buyBtn,
            (isAddingToCart || isTogglingFavourite || isCheckingFavourite) && styles.buttonDisabled,
          ]}
          disabled={isAddingToCart || isTogglingFavourite || isCheckingFavourite}
          onPress={onBuyNow}
          activeOpacity={0.8}
        >
          <Text style={styles.buyBtnTxt}>Mua ngay</Text>
        </TouchableOpacity>
      </View>
    );
  };

// Main Component
const ProductDetailScreen: FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();

  const petId = route.params?.pet?._id || route.params?.petId;
  const productId = route.params?.productId || route.params?.id;

  const { alertConfig, showRemoveAlert, hideAlert } = useFavouriteAlert();
  const {
    showFavouriteAdded,
    showFavouriteRemoved,
    showFavouriteError,
    showNetworkError,
    toastConfig,
    hideToast,
  } = useFavouriteToast();

  const { checkAuthAndProceed } = useAuthGuard();
  const { favourites, loading: favouriteLoading, favouriteStatusMap } = useSelector((state: RootState) => state.favourites);
  const { isLoading: cartLoading } = useSelector((state: RootState) => state.cart);
  const { token } = useSelector((state: RootState) => state.auth);

  const isFavorite = useMemo(() => {
    const key = petId ? `pet_${petId}` : `product_${productId}`;
    return favouriteStatusMap[key] || false;
  }, [favouriteStatusMap, petId, productId]);

  const [item, setItem] = useState<Pet | Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVar, setSelectedVar] = useState<Variation | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingFavourite, setIsTogglingFavourite] = useState(false);
  const [isCheckingFavourite, setIsCheckingFavourite] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<PetVariant | null>(null);
  const [variantActionType, setVariantActionType] = useState<'add_to_cart' | 'buy_now'>('add_to_cart');

  // Reviews States
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    avgRating: 0,
    totalReviews: 0,
    distribution: {
      star1: 0,
      star2: 0,
      star3: 0,
      star4: 0,
      star5: 0
    }
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const { h, m, s } = useCountdown(36 * 60 + 58);

  // 🆕 Kiểm tra trạng thái biến thể khả dụng
  const hasAvailableVariants = useMemo(() => {
    if (item && 'breed_id' in item && Array.isArray((item as Pet).variants)) {
      return (item as Pet).variants.some(variant => PetVariantHelpers.isVariantAvailable(variant));
    }
    return true;
  }, [item]);

  // Load Reviews Function
  const loadReviews = async () => {
    if (!item) return;

    try {
      setReviewsLoading(true);

      let response;
      const isPet = 'breed_id' in item;

      if (isPet) {
        response = await reviewService.getReviewsByPet(item._id, {
          page: 1,
          limit: 3,
        });
      } else {
        response = await reviewService.getReviewsByProduct(item._id, {
          page: 1,
          limit: 3,
        });
      }

      if (response.success && response.data) {
        setReviews(response.data.reviews);
        setReviewStats(response.data.stats);
        console.log('✅ Reviews loaded:', {
          total: response.data.stats.totalReviews,
          avgRating: response.data.stats.avgRating
        });
      }
    } catch (error) {
      console.error('❌ Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Handle View All Reviews
  const handleViewAllReviews = () => {
    if (!item) return;

    const isPet = 'breed_id' in item;
    navigation.navigate('AllReviewsScreen', {
      itemId: item._id,
      itemName: item.name,
      itemImage: item.images?.[0]?.url || 'https://via.placeholder.com/150',
      isPet: isPet,
      stats: reviewStats
    });
  };

  // 🆕 Tự động chọn biến thể mặc định khi tải item
  useEffect(() => {
    if (item && 'breed_id' in item) {
      const defaultVariant = PetVariantHelpers.getDefaultVariant(item as Pet);
      if (defaultVariant) {
        console.log('🔍 Auto-selecting default variant:', { variantId: defaultVariant._id });
        setSelectedVariant(defaultVariant);
      }
    }
  }, [item]);

  useEffect(() => {
    if (item) {
      loadReviews();
    }
  }, [item]);

  const getDisplayPrice = (variant?: PetVariant) => {
    if (variant) {
      const price = PetVariantHelpers.getFinalPrice(variant);
      return price;
    }
    if (item && 'breed_id' in item) {
      const defaultVariant = PetVariantHelpers.getDefaultVariant(item as Pet);
      if (defaultVariant) {
        const price = PetVariantHelpers.getFinalPrice(defaultVariant);
        return price;
      }
      const price = PetVariantHelpers.getPetPrice(item as Pet);
      return price;
    }
    return (item as Product).price || 0;
  };

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

  const performAddToCart = async () => {
    const isPet = 'breed_id' in item!;
    if (isPet && Array.isArray(item!.variants) && item!.variants.length > 0) {
      const availableVariants = item!.variants.filter(variant =>
        PetVariantHelpers.isVariantAvailable(variant)
      );

      if (availableVariants.length === 1) {
        console.log('🔍 Auto-selecting single available variant:', { variantId: availableVariants[0]._id });
        setSelectedVariant(availableVariants[0]);
        await addItemToCart(availableVariants[0]);
        return;
      } else if (availableVariants.length > 1) {
        setVariantActionType('add_to_cart');
        setShowVariantSelector(true);
        return;
      } else {
        Alert.alert('Hết hàng', 'Tất cả biến thể của thú cưng này đã hết hàng');
        return;
      }
    }
    await addItemToCart();
  };

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
      const availableVariants = item!.variants.filter(variant =>
        PetVariantHelpers.isVariantAvailable(variant)
      );

      if (availableVariants.length === 1) {
        console.log('🔍 Auto-selecting single available variant for buy now:', { variantId: availableVariants[0]._id });
        setSelectedVariant(availableVariants[0]);
        await proceedToBuyNow(availableVariants[0]);
        return;
      } else if (availableVariants.length > 1) {
        setVariantActionType('buy_now');
        setShowVariantSelector(true);
        return;
      } else {
        Alert.alert('Hết hàng', 'Tất cả biến thể của thú cưng này đã hết hàng');
        return;
      }
    }
    await proceedToBuyNow();
  };

  const proceedToBuyNow = async (variant?: PetVariant) => {
    console.log('Buy now clicked:', { selectedVariant: variant, price: getDisplayPrice(variant) });

    const cartItems = [{
      id: variant?._id || item!._id,
      title: item!.name,
      price: getDisplayPrice(variant),
      quantity: 1,
      image: Array.isArray(item!.images) && item!.images.length > 0
        ? { uri: item!.images[0].url }
        : require('@/assets/images/dog.png'),
      type: variant ? 'variant' : (petId ? 'pet' : 'product'),
      petId: petId || undefined,
      productId: productId || undefined,
      variantId: variant?._id || undefined,
      variant: variant || undefined,
      variantInfo: variant ? {
        color: variant.color,
        weight: variant.weight,
        gender: variant.gender,
        age: variant.age,
        display_name: PetVariantHelpers.getDisplayName(variant),
      } : undefined,
    }];

    const total = getDisplayPrice(variant);

    console.log('🔧 Formatted cartItems for Payment:', JSON.stringify(cartItems, null, 2));

    navigation.navigate('Payment', {
      cartItems,
      total,
      petId,
      productId,
      variantId: variant?._id,
    });
  };

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
              onPress: () => navigation.navigate('Cart'),
            },
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
      let errorMessage = 'Sản phẩm đã hết hàng';
      if (typeof error === 'string') {
        if (error.includes('already exists in cart')) {
          errorMessage = 'Sản phẩm đã có trong giỏ hàng';
        } else if (error.includes('must have either')) {
          errorMessage = 'Thông tin sản phẩm không hợp lệ';
        } else if (error.includes('network') || error.includes('timeout')) {
          errorMessage = 'Lỗi kết nối. Vui lòng thử lại';
        }
      }
      Alert.alert('Hết hàng', errorMessage);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleVariantSelect = (variant: PetVariant) => {
    console.log('Selected variant:', variant, 'Action type:', variantActionType);
    setSelectedVariant(variant);
    if (variantActionType === 'add_to_cart') {
      addItemToCart(variant);
    } else if (variantActionType === 'buy_now') {
      proceedToBuyNow(variant);
    }
  };

  useEffect(() => {
    if (token) {
      console.log('🔄 ProductDetail mounted, fetching favourites...');
      dispatch(fetchFavourites());
    }
  }, [dispatch, token]);

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

  const productTitle = item.name || 'Unknown Item';
  const productImage = Array.isArray(item.images) && item.images.length > 0
    ? { uri: item.images[0].url }
    : require('@/assets/images/dog.png');
  const isPet = 'breed_id' in item;
  const breed = isPet ? (typeof (item as Pet).breed_id === 'object' ? (item as Pet).breed_id?.name || 'Unknown' : 'Unknown') : 'N/A';
  const age = isPet ? ((item as Pet).age ? `${(item as Pet).age} năm` : 'Unknown') : 'N/A';
  const gender = isPet ? (item as Pet).gender || 'Unknown' : 'N/A';
  const weight = isPet ? ((item as Pet).weight ? `${(item as Pet).weight} kg` : 'Unknown') : 'N/A';
  const description = item.description || (isPet ? 'Purus in massa tempor nec feugiat...' : 'Không có mô tả');

  const displayPrice = getDisplayPrice(selectedVariant);

  return (
    <SafeAreaView style={styles.container}>
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
        <Header
          image={productImage}
          images={Array.isArray(item.images) ? item.images : []}
          selectedImageId={selectedVar?.id || (Array.isArray(item.images) && item.images[0]?._id) || ''}
        />
        <View style={styles.content}>
          <View style={[styles.rowCenter, styles.marginTop]}>
            <Text style={styles.price}>
              {hasAvailableVariants
                ? displayPrice > 0
                  ? displayPrice.toLocaleString('vi-VN') + '₫'
                  : 'Giá không khả dụng'
                : 'Hết hàng'}
            </Text>
            <View style={styles.ratingRow}>
              <FontAwesome name="star" size={14} color="#FBBF24" />
              <Text style={styles.ratingText}>
                {reviewStats.avgRating > 0 ? reviewStats.avgRating.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.soldText}>
                ({reviewStats.totalReviews} đánh giá)
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{productTitle}</Text>
          {/* {(item && 'breed_id' in item && (item as Pet).variants?.length > 0) && (
            <View style={styles.variantInfoContainer}>
              <Text style={styles.variantInfoText}>
                {selectedVariant
                  ? PetVariantHelpers.getDisplayName(selectedVariant) + ' - ' + PetVariantHelpers.getFinalPrice(selectedVariant).toLocaleString('vi-VN') + '₫'
                  : PetVariantHelpers.getDisplayName(PetVariantHelpers.getDefaultVariant(item as Pet)!) + ' - ' + PetVariantHelpers.getPetPrice(item as Pet).toLocaleString('vi-VN') + '₫'}
              </Text>
            </View>
          )} */}
          {Array.isArray(item.images) && item.images.length > 0 && (
            <VariationSelector
              images={item.images}
              onSelect={setSelectedVar}
              selectedId={selectedVar?.id || ''}
            />
          )}
          <Text style={styles.sectionTitle}>Đánh giá & Nhận xét</Text>
          <View style={styles.reviewHeader}>
            <Text style={styles.avgRating}>
              {reviewStats.avgRating > 0 ? reviewStats.avgRating.toFixed(1) : '0.0'}
            </Text>
            <FontAwesome name="star" size={16} color="#FBBF24" />
            <Text style={styles.ratingCount}>
              {reviewStats.totalReviews > 0
                ? `${reviewStats.totalReviews} đánh giá`
                : 'Chưa có đánh giá'
              }
            </Text>
          </View>
          <ReviewCard
            navigation={navigation}
            reviews={reviews}
            reviewStats={reviewStats}
            onViewAllPress={handleViewAllReviews}
            loading={reviewsLoading}
          />
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
          <Image source={productImage} style={styles.descImage} />
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>
              {isPet ? '🐾 Thú cưng & Sản phẩm liên quan' : '🛍️ Sản phẩm & Thú cưng liên quan'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {isPet ? 'Khám phá thú cưng tương tự và sản phẩm phù hợp' : 'Khám phá thú cưng tương tự và sản phẩm liên quan'}
            </Text>
            <RelatedItems
              navigation={navigation}
              currentItemId={item._id}
              currentItemType={isPet ? 'pet' : 'product'}
              limit={8}
            />
          </View>
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
      <FooterBar
        isFavorite={isFavorite}
        toggleFavorite={handleToggleFavorite}
        navigation={navigation}
        petId={petId}
        productId={productId}
        item={item}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isAddingToCart={isAddingToCart}
        selectedVariant={selectedVariant}
        isTogglingFavourite={isTogglingFavourite}
        isCheckingFavourite={isCheckingFavourite}
      />
      {item && 'breed_id' in item && Array.isArray((item as Pet).variants) && (
        <PetVariantSelector
          visible={showVariantSelector}
          onClose={() => {
            console.log('🔧 Closing variant selector');
            setShowVariantSelector(false);
          }}
          pet={item as Pet}
          onSelectVariant={handleVariantSelect}
          selectedVariant={selectedVariant}
          title={variantActionType === 'add_to_cart'
            ? 'Chọn biến thể để thêm vào giỏ'
            : 'Chọn biến thể để mua ngay'
          }
        />
      )}
      <CustomFavouriteAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        itemName={alertConfig.itemName}
        itemImage={alertConfig.itemImage}
        onClose={hideAlert}
        onConfirm={alertConfig.onConfirm}
        onCancel={hideAlert}
      />
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
  reviewCard: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewContent: { flex: 1 },
  reviewer: { fontWeight: '600', fontSize: 14, color: '#1F2937' },
  starRow: { flexDirection: 'row', marginVertical: 4, alignItems: 'center' },
  reviewText: { color: '#374151', marginBottom: 8, fontSize: 13, lineHeight: 18 },
  reviewDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  viewAllBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  reviewLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginTop: 12,
  },
  reviewLoadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  noReviewsContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  noReviewsSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  descText: { color: '#6B7280', lineHeight: 20, marginTop: 8 },
  toggleDescBtn: { marginTop: 8, alignSelf: 'flex-start' },
  toggleDescText: { color: '#2563EB', fontWeight: '600' },
  descImage: { width: '100%', height: 200, borderRadius: 8, marginVertical: 16 },
  relatedSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  relatedContainer: {
    marginTop: 16,
  },
  breakdownContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  breakdownText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  relatedItem: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 100,
  },
  relatedImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  relationshipBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  relationshipBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  itemTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTypeBadgeText: {
    fontSize: 12,
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  compatibilityText: {
    fontSize: 11,
    color: '#8B5CF6',
    fontStyle: 'italic',
  },
  similarityScore: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
  },
  similarityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  similarityBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  petBreed: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  similarityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  similarityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  compatibilityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  compatibilityBadgeText: {
    fontSize: 12,
    color: '#fff',
  },
  compatibilityInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyRelatedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginTop: 16,
  },
  emptyRelatedText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
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
  cartBtn: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    minHeight: 48,
    width: 48,
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