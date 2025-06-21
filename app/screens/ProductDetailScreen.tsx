// screens/ProductDetailScreen.tsx
import React, { useState, useEffect, FC } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// --- Data Interfaces & Sample Data ---
interface Variation { id: string; image: any; }
interface RelatedItem { id: string; image: any; title: string; price: string; }

const VARIATIONS: Variation[] = Array.from({ length: 4 }).map((_, i) => ({
  id: `${i}`,
  image: require('@/assets/images/dog.png'),
}));

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
const Header: FC = () => (
  <ImageBackground source={require('@/assets/images/dog.png')} style={styles.headerImage}>
    <View style={styles.topIcons}>
      <TouchableOpacity style={styles.iconBtn}>
        <Ionicons name="share-social-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
    <View style={styles.carouselDots}>
      {VARIATIONS.map((_, i) => (
        <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
      ))}
    </View>
  </ImageBackground>
);

const VariationSelector: FC<{ onSelect: (v: Variation) => void; selectedId: string }> = ({ onSelect, selectedId }) => (
  <FlatList
    data={VARIATIONS}
    horizontal
    keyExtractor={item => item.id}
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

const DeliveryOptions: FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>('Standard');
  const options = [
    { id: 'Standard', label: 'Standard', days: '5-7 days', price: '$3.00' },
    { id: 'Express', label: 'Express', days: '1-2 days', price: '$12.00' },
  ];

  return (
    <View style={styles.deliveryContainer}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={styles.deliveryBar}
          onPress={() => setSelectedOption(opt.id)}
        >
          <View style={styles.radioRow}>
            <MaterialIcons
              name={selectedOption === opt.id ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={20}
              color="#2563EB"
              style={{ marginRight: 10 }}
            />
            <View>
              <Text style={styles.deliveryLabel}>{opt.label}</Text>
              <View style={styles.datePill}>
                <Text style={styles.dateText}>{opt.days}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.delPrice}>{opt.price}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const InfoRow: FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoKey}>{label}</Text>
    <Text style={styles.infoVal}>{value}</Text>
  </View>
);

const ReviewCard: FC = () => (
  <View style={styles.reviewCard}>
    <Image source={require('@/assets/images/dog.png')} style={styles.avatar} />
    <View style={styles.reviewContent}>
      <Text style={styles.reviewer}>Veronika</Text>
      <View style={styles.starRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <FontAwesome key={i} name="star" size={14} color="#FBBF24" />
        ))}
      </View>
      <Text numberOfLines={3} style={styles.reviewText}>Lorem ipsum dolor sit amet.</Text>
      <TouchableOpacity style={styles.viewAllBtn}>
        <Text style={styles.viewAllText}>View All Reviews</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const RelatedGrid: FC = () => (
  <FlatList
    data={RELATED_ITEMS}
    numColumns={2}
    keyExtractor={item => item.id}
    columnWrapperStyle={styles.relatedRow}
    scrollEnabled={false}
    renderItem={({ item }) => (
      <View style={styles.relatedItem}>
        <Image source={item.image} style={styles.relatedImg} />
        <Text style={styles.relatedTitle}>{item.title}</Text>
        <Text style={styles.relatedPrice}>{item.price}</Text>
      </View>
    )}
  />
);

// --- Main Screen ---
const ProductDetailScreen: FC = () => {
  const navigation = useNavigation<any>();
  const [selectedVar, setSelectedVar] = useState(VARIATIONS[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const { h, m, s } = useCountdown(36 * 60 + 58);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Detail</Text>
        <TouchableOpacity onPress={() => setIsFavorite(f => !f)} style={styles.headerFav}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? 'red' : '#000'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <Header />

        <View style={styles.content}>
          <Text style={styles.productTitle}>Cute Pomeranian Dog</Text>
          <Text style={styles.productPrice}>$25.00</Text>
          <Text style={styles.countdownText}>
            Sale ends in {h}h {m}m {s}s
          </Text>

          <VariationSelector selectedId={selectedVar.id} onSelect={setSelectedVar} />
          <DeliveryOptions />
          <InfoRow label="Breed" value="Pomeranian" />
          <InfoRow label="Availability" value="In stock" />

          <Text style={styles.sectionHeading}>Reviews</Text>
          <ReviewCard />

          <Text style={styles.sectionHeading}>Related Items</Text>
          <RelatedGrid />
        </View>
      </ScrollView>

      {/* Footer Bar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.favBtn}
          onPress={() => setIsFavorite(true)}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? 'red' : '#000'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartBtnTxt}>Add to cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyBtn}
          onPress={() => navigation.navigate('Payment')}
        >
          <Text style={styles.buyBtnTxt}>Buy now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProductDetailScreen;

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 15,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', marginLeft: 8 },
  headerFav: { padding: 4 },

  headerImage: { width: '100%', height: 300 },
  topIcons: { position: 'absolute', top: 16, right: 16, flexDirection: 'row' },
  iconBtn: { marginLeft: 12 },
  carouselDots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 8, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', margin: 4 },
  dotActive: { backgroundColor: '#2563EB' },

  content: { padding: 16 },
  productTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  productPrice: { fontSize: 20, color: '#E63946', marginBottom: 12 },
  countdownText: { color: '#1E90FF', marginBottom: 12 },
  sectionHeading: { fontSize: 18, fontWeight: '600', marginVertical: 12 },

  varList: { paddingVertical: 8 },
  varItem: { marginRight: 12, borderRadius: 8 },
  varSelected: { borderWidth: 2, borderColor: '#10B981' },
  varImg: { width: 60, height: 60, borderRadius: 8 },

  deliveryContainer: { marginVertical: 12 },
  deliveryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryLabel: { fontWeight: '500', marginBottom: 4 },
  datePill: { backgroundColor: '#DBEAFE', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  dateText: { color: '#1D4ED8' },
  delPrice: { fontWeight: 'bold' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoKey: { color: '#374151' },
  infoVal: { fontWeight: '500' },

  reviewCard: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewContent: { flex: 1 },
  reviewer: { fontWeight: '600' },
  starRow: { flexDirection: 'row', marginVertical: 4 },
  reviewText: { color: '#374151', marginBottom: 8 },
  viewAllBtn: { backgroundColor: '#2563EB', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  viewAllText: { color: '#fff', fontWeight: '600' },

  relatedRow: { justifyContent: 'space-between' },
  relatedItem: { width: '48%', marginBottom: 16 },
  relatedImg: { width: '100%', height: 120, borderRadius: 8 },
  relatedTitle: { marginTop: 8, color: '#374151' },
  relatedPrice: { fontWeight: '600', marginTop: 4 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  favBtn: { padding: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginRight: 12 },
  cartBtn: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cartBtnTxt: { color: '#fff', fontWeight: '600' },
  buyBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyBtnTxt: { color: '#fff', fontWeight: '600' },
});
