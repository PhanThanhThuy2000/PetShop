import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const AccountScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/women/1.jpg' }}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.activityBtn}>
          <Text style={styles.activityText}>My Activity</Text>
        </TouchableOpacity>
        <View style={styles.icons}>
          <Ionicons name="notifications-outline" size={24} color="#333" style={styles.icon} />
          <Ionicons name="settings-outline" size={24} color="#333" />
        </View>
      </View>

      {/* Greeting */}
      <Text style={styles.greeting}>Hello, Amanda!</Text>

      {/* My Purchases */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>My Purchases</Text>
          <Text style={styles.cardLink}>View Purchase History</Text>
        </View>
        <View style={styles.purchaseRow}>
          <Item icon="wallet" label="To Pay" color="#FF4C4C" />
          <Item icon="box-open" label="Order" color="#F9A825" iconLib="FontAwesome5" />
          <Item icon="local-shipping" label="To Receive" color="#2196F3" iconLib="MaterialIcons" />
          <Item icon="ticket-alt" label="Voucher" color="#FF5722" iconLib="FontAwesome5" />


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

const Item = ({
  icon,
  label,
  color,
  iconLib = 'FontAwesome5',
}: {
  icon: string;
  label: string;
  color: string;
  iconLib?: 'FontAwesome5' | 'MaterialIcons';
}) => {
  const IconLib = iconLib === 'MaterialIcons' ? MaterialIcons : FontAwesome5;
  return (
    <View style={styles.item}>
      <IconLib name={icon as any} size={24} color={color} />
      <Text style={styles.itemLabel}>{label}</Text>
    </View>
  );
};

const Category = ({
  label,
  icon,
  active = false,
}: {
  label: string;
  icon: string;
  active?: boolean;
}) => {
  return (
    <TouchableOpacity style={[styles.catBox, active && styles.catBoxActive]}>
      <FontAwesome5 name={icon as any} size={20} color={active ? '#fff' : '#555'} />
      <Text style={[styles.catLabel, active && styles.catLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop:30,
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityBtn: {
    backgroundColor: '#1976D2',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  activityText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  icons: {
    flexDirection: 'row',
  },
  icon: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  cardLink: {
    color: '#F57C00',
    fontSize: 12,
  },
  purchaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    width: '24%',
  },
  itemLabel: {
    marginTop: 4,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  catBox: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#EEE',
    marginBottom: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBoxActive: {
    backgroundColor: '#7B61FF',
  },
  catLabel: {
    marginTop: 6,
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
  },
  catLabelActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AccountScreen;
