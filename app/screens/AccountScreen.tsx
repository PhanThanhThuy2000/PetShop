// screens/AccountScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const AccountScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Left: Avatar + My Activity */}
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/women/1.jpg' }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.activityBtn} onPress={() => navigation.navigate('History')}>
            <Text style={styles.activityText}>My Activity</Text>
          </TouchableOpacity>
        </View>

        {/* Right: Notifications + Settings */}
        <View style={styles.icons}>  
          <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
            <Ionicons name="notifications-outline" size={24} color="#333" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting */}
      <Text style={styles.greeting}>Hello, Amanda!</Text>

      {/* My Purchases */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>My Purchases</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.cardLink}>View Purchase History</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.purchaseRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Payment')}> {/* Example nav */}
            <Item icon="wallet" label="To Pay" color="#FF4C4C" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Item icon="box-open" label="Order" color="#F9A825" iconLib="FontAwesome5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('')}>
            <Item icon="local-shipping" label="To Receive" color="#2196F3" iconLib="MaterialIcons" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Voucher')}>
            <Item icon="ticket-alt" label="Voucher" color="#FF5722" iconLib="FontAwesome5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.card}>
        <View style={styles.grid}>
          <Category label="Comida" icon="utensils" active />
          <Category label="Pruning" icon="cut" />
          <Category label="Vacinas" icon="syringe" />
          <Category label="Petshop" icon="stethoscope" />
          <Category label="Medicamentos" icon="capsules" />
          <Category label="Higiene" icon="soap" />
        </View>
      </View>
    </ScrollView>
  );
};

const Item: React.FC<{ icon: string; label: string; color: string; iconLib?: 'FontAwesome5' | 'MaterialIcons' }> = ({ icon, label, color, iconLib = 'FontAwesome5' }) => {
  const IconComp = iconLib === 'MaterialIcons' ? MaterialIcons : FontAwesome5;
  return (
    <View style={styles.item}>
      <IconComp name={icon as any} size={24} color={color} />
      <Text style={styles.itemLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
};

const Category: React.FC<{ label: string; icon: string; active?: boolean }> = ({ label, icon, active }) => (
  <TouchableOpacity style={[styles.catBox, active && styles.catBoxActive]}>
    <FontAwesome5 name={icon as any} size={20} color={active ? '#fff' : '#555'} />
    <Text style={[styles.catLabel, active && styles.catLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: 16 },
  header: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  activityBtn: { backgroundColor: '#1976D2', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, marginLeft: 8 },
  activityText: { color: '#fff', fontWeight: 'bold' },
  icons: { flexDirection: 'row' },
  icon: { marginRight: 10 },
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
});

export default AccountScreen;
