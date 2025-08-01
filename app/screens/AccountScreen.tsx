import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import ChatSupportButton from '../components/ChatSupportButton';
import { getCurrentUser } from '../redux/slices/authSlice';

const AccountScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, token, dispatch } = useAuth();

  // Load user info when component mounts or when screen comes into focus
  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUser());
    }
  }, [token, user, dispatch]);

  // Refresh user data when screen comes into focus (to get updated avatar)
  useFocusEffect(
    useCallback(() => {
      if (token) {
        dispatch(getCurrentUser());
      }
    }, [token, dispatch])
  );


  // Get user avatar URL with real-time updates
  const getUserAvatar = () => {
    if (user?.avatar_url) {
      return { uri: user.avatar_url };
    }
    return { uri: 'https://randomuser.me/api/portraits/women/1.jpg' };
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={getUserAvatar()}
            style={styles.avatar}
            key={user?.avatar_url || 'default'} // Force re-render when avatar changes
          />
          <TouchableOpacity style={styles.activityBtn} onPress={() => navigation.navigate('EditInfomation')}>
            <Text style={styles.activityText}>{user.username}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.icons}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>


      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Mua hàng của tôi</Text>
        </View>
        <View style={styles.purchaseRow}>
          <TouchableOpacity onPress={() => navigation.navigate('AppointmentHistory')}>
            <Item icon="paw" label="Đặt lịch" color="#FF4C4C" iconLib="FontAwesome5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Item icon="shopping-cart" label="Giỏ hàng" color="#F9A825" iconLib="FontAwesome5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Reviews')}>
            <Item icon="star" label="Đánh giá" color="yellow" iconLib="MaterialIcons" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Voucher')}>
            <Item icon="ticket-alt" label="Khuyễn mãi" color="#FF5722" iconLib="FontAwesome5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer Support Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Hỗ trợ khách hàng</Text>
        </View>
        <ChatSupportButton 
          variant="inline" 
          size="medium"
          style={styles.chatButton}
        />
      </View>

    </ScrollView>
  );
};

const Item: React.FC<{ icon: string; label: string; color: string; iconLib?: 'FontAwesome5' | 'MaterialIcons' }> = ({ icon, label, color, iconLib = 'FontAwesome5' }) => {
  const IconComp = iconLib === 'MaterialIcons' ? MaterialIcons : FontAwesome5;
  return (
    <View style={styles.item}>
      <IconComp name={icon} size={24} color={color} />
      <Text style={styles.itemLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: 16 },
  header: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center', // Vertically center all items
    justifyContent: 'space-between',
    marginBottom:30
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center' // Vertically center avatar and button
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  activityBtn: {
    backgroundColor: '#1976D2',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginLeft: 8,
    justifyContent: 'center' // Center text inside button
  },
  activityText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14 // Ensure consistent text size
  },
  icons: {
    justifyContent: 'center', // Vertically center the icon
    alignItems: 'center'
  },
  greeting: { fontSize: 22, fontWeight: 'bold', marginVertical: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  cardLink: { color: '#F57C00', fontSize: 12 },
  purchaseRow: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { flex: 1, alignItems: 'center' },
  itemLabel: { marginTop: 4, fontSize: 12, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  catBox: { width: '30%', aspectRatio: 1, backgroundColor: '#EEE', marginBottom: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catBoxActive: { backgroundColor: '#7B61FF' },
  catLabel: { marginTop: 6, color: '#555', fontSize: 12, textAlign: 'center' },
  catLabelActive: { color: '#fff', fontWeight: 'bold' },
  chatButton: { 
    width: '100%',
    marginTop: 8,
  },
  scrollContent: { 
    paddingBottom: 80, // Add space for floating button
  },
});

export default AccountScreen;