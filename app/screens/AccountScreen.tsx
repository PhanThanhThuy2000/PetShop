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

  // Display user's name or default greeting
  const getUserGreeting = () => {
    return user?.username ? `Xin chào, ${user.username}!` : 'Hello, Amanda!';
  };

  // Get user avatar URL with real-time updates
  const getUserAvatar = () => {
    return user?.avatar_url
      ? { uri: user.avatar_url }
      : { uri: 'https://randomuser.me/api/portraits/women/1.jpg' };
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
          <TouchableOpacity
            style={styles.activityBtn}
            onPress={() => navigation.navigate('EditInfomation')}
          >
            <Text style={styles.activityText}>Hoạt động</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.icons}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.greeting}>{getUserGreeting()}</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Mua hàng của tôi</Text>
        </View>
        <View style={styles.purchaseRow}>
          <TouchableOpacity onPress={() => navigation.navigate('AppointmentHistory')}>
            <Item icon="paw" label="Đặt lịch" color="#FF4C4C" iconLib="FontAwesome5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Item icon="shopping-cart" label="Đơn hàng" color="#F9A825" iconLib="FontAwesome5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Reviews')}>
            <Item icon="star" label="Đánh giá" color="yellow" iconLib="MaterialIcons" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Voucher')}>
            <Item icon="ticket-alt" label="Khuyến mại" color="#FF5722" iconLib="FontAwesome5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer Support Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Hỗ trợ khách hàng</Text>
        </View>
        <ChatSupportButton variant="inline" size="medium" style={styles.chatButton} />
      </View>
    </ScrollView>
  );
};

interface ItemProps {
  icon: string;
  label: string;
  color: string;
  iconLib?: 'FontAwesome5' | 'MaterialIcons';
}

const Item: React.FC<ItemProps> = ({ icon, label, color, iconLib = 'FontAwesome5' }) => {
  const IconComp = iconLib === 'MaterialIcons' ? MaterialIcons : FontAwesome5;

  return (
    <View style={styles.item}>
      <IconComp name={icon} size={24} color={color} />
      <Text style={styles.itemLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  header: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  activityBtn: {
    backgroundColor: '#1976D2',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginLeft: 8,
  },
  activityText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  icons: {
    flexDirection: 'row',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  purchaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  itemLabel: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  chatButton: {
    width: '100%',
    marginTop: 8,
  },
});

export default AccountScreen;