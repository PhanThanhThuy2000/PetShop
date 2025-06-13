import React, { useState, useEffect, FC } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ImageBackground,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

// --- Data Interfaces ---
interface Variation { id: string; image: any; }
interface RelatedItem { id: string; image: any; title: string; price: string; }

// --- Sample Data ---
const VARIATIONS: Variation[] = Array.from({ length: 4 }).map((_, i) => ({
  id: `${i}`,
  image: require('@/assets/images/dog.png'),
}));
const RELATED_ITEMS: RelatedItem[] = Array.from({ length: 4 }).map((_, i) => ({
  id: `${i}`,
  image: require('@/assets/images/dog.png'),
  title: 'Lorem ipsum dolor sit amet consectetur',
  price: '$17,00',
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
  <ImageBackground
    source={require('@/assets/images/dog.png')}
    style={styles.headerImage}
  >
    <View style={styles.topIcons}>
      <TouchableOpacity style={styles.iconBtn}>
        <Ionicons name="heart-outline" size={24} color="#fff" />
      </TouchableOpacity>
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

// Updated DeliveryOptions: two horizontal bars
const DeliveryOptions: FC = () => {
  const options = [
    { label: 'Standard', days: '5-7 days', price: '$3,00' },
    { label: 'Express', days: '1-2 days', price: '$12,00' },
  ];
  return (
    <View style={styles.deliveryContainer}>
      {options.map((opt, idx) => (
        <TouchableOpacity key={idx} style={styles.deliveryBar}>
          <View style={styles.deliveryBarLeft}>
            <Text style={styles.deliveryLabel}>{opt.label}</Text>
            <View style={styles.datePill}>
              <Text style={styles.dateText}>{opt.days}</Text>
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
      <Text numberOfLines={3} style={styles.reviewText}>Lorem ipsum dolor sit amet...</Text>
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
    keyExtractor={(item) => item.id}
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

const FooterBar: FC = () => (
  <View style={styles.footer}>
    <TouchableOpacity style={styles.favBtn}><Ionicons name="heart-outline" size={24} color="#000" /></TouchableOpacity>
    <TouchableOpacity style={styles.cartBtn}><Text style={styles.cartBtnTxt}>Add to cart</Text></TouchableOpacity>
    <TouchableOpacity style={styles.buyBtn}><Text style={styles.buyBtnTxt}>Buy now</Text></TouchableOpacity>
  </View>
);

const ProductDetailScreen: FC = () => {
  const [selectedVar, setSelectedVar] = useState(VARIATIONS[0]);
  const { h, m, s } = useCountdown(36 * 60 + 58);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Header />
        <View style={styles.content}>
          <View style={[styles.rowCenter, styles.spaceBetween]}>  
            <Text style={styles.badge}>Sale</Text>
            <View style={styles.timerBox}><Ionicons name="time-outline" size={16} color="#000" /><Text style={styles.timerText}>{`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`}</Text></View>
          </View>
          <View style={[styles.rowCenter, styles.marginTop]}><Text style={styles.price}>1.000.000 đ</Text><View style={styles.ratingRow}><FontAwesome name="star" size={14} color="#FBBF24" /><Text style={styles.ratingText}>4,9</Text><Text style={styles.soldText}>(Sold 50)</Text></View></View>
          <Text style={styles.title}>Dog Mundo</Text>
          <Text style={styles.sectionTitle}>Variations</Text>
          <VariationSelector onSelect={setSelectedVar} selectedId={selectedVar.id} />
          <Text style={styles.sectionTitle}>Delivery</Text>
          <DeliveryOptions />
          <Text style={styles.sectionTitle}>Information pet</Text>
          <View style={styles.infoBox}><InfoRow label="Gender" value="Male" /><InfoRow label="Age" value="1 year" /><InfoRow label="Weight" value="22,2 kg" /></View>
          <Text style={styles.sectionTitle}>Rating & Reviews</Text>
          <View style={styles.reviewHeader}><Text style={styles.avgRating}>4.5</Text><FontAwesome name="star" size={16} color="#FBBF24" /><Text style={styles.ratingCount}>Product Ratings (90)</Text></View>
          <ReviewCard />
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descText}>Purus in massa tempor nec feugiat...</Text>
          <Image source={require('@/assets/images/dog.png')} style={styles.descImage} />
          <Text style={styles.sectionTitle}>Pet Related</Text>
          <RelatedGrid />
        </View>
      </ScrollView>
      <FooterBar />
    </SafeAreaView>
  );
};

export default ProductDetailScreen;

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  deliveryContainer: { marginTop: 8 },
  deliveryBar: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#2563EB', borderRadius: 8, padding: 12, marginBottom: 8, alignItems: 'center' },
  deliveryBarLeft: { flexDirection: 'row', alignItems: 'center' },
  deliveryLabel: { fontWeight: '500', marginRight: 12 },
  datePill: { backgroundColor: '#DBEAFE', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  dateText: { color: '#1D4ED8' },
  delPrice: { fontWeight: 'bold' },
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
  descImage: { width: '100%', height: 200, borderRadius: 8, marginVertical: 16 },
  relatedRow: { justifyContent: 'space-between' },
  relatedItem: { width: '48%' },
  relatedImg: { width: '100%', height: 120, borderRadius: 8 },
  relatedTitle: { marginTop: 8, color: '#374151' },
  relatedPrice: { fontWeight: '600', marginTop: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderColor: '#E5E7EB' },
  favBtn: { padding: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginRight: 12 },
  cartBtn: { flex: 1, backgroundColor: '#111827', padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  cartBtnTxt: { color: '#fff', fontWeight: '600' },
  buyBtn: { flex: 1, backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems: 'center' },
  buyBtnTxt: { color: '#fff', fontWeight: '600' },
});
