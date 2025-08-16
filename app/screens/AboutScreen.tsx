import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const AboutScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giới thiệu</Text>
        <View style={styles.headerRightIcons} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/images/iconabout.png')} // Đảm bảo đường dẫn này đúng
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Về PetShop</Text>

        <Text style={styles.description}>
          PetShop - Ứng dụng chăm sóc thú cưng toàn diện và hiện đại nhất Việt Nam. Chúng tôi cung cấp dịch vụ khám chữa bệnh chuyên nghiệp, sản phẩm chăm sóc thú cưng chất lượng cao và trải nghiệm người dùng tuyệt vời. Với đội ngũ bác sĩ thú y giàu kinh nghiệm và hệ thống cửa hàng trên toàn quốc, PetShop cam kết mang đến sức khỏe tốt nhất cho những người bạn bốn chân của bạn.
        </Text>

        <Text style={styles.featuresTitle}>Dịch vụ của chúng tôi:</Text>

        <View style={styles.featuresList}>
          <Text style={styles.featureItem}>🏥 Khám chữa bệnh cho thú cưng</Text>
          <Text style={styles.featureItem}>📅 Đặt lịch hẹn trực tuyến</Text>
          <Text style={styles.featureItem}>🛒 Mua sắm sản phẩm thú cưng</Text>
          <Text style={styles.featureItem}>💊 Tư vấn sức khỏe 24/7</Text>
          <Text style={styles.featureItem}>🚀 Giao hàng tận nhà</Text>
        </View>

        <Text style={styles.contactText}>
          Nếu bạn cần hỗ trợ hoặc có bất kỳ câu hỏi nào về sức khỏe thú cưng, vui lòng liên hệ với chúng tôi.
        </Text>

        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Email:</Text>
          <Text style={styles.emailText}>support@petshop.vn</Text>

          <Text style={styles.contactLabel}>Hotline:</Text>
          <Text style={styles.phoneText}>1900 123 456</Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginTop: 25
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  headerRightIcons: {
    width: 24 + 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 20,
  },
  iconImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
    textAlign: 'left',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    marginBottom: 28,
    textAlign: 'left',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 28,
  },
  featureItem: {
    fontSize: 15,
    lineHeight: 24,
    color: '#666',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    marginBottom: 24,
    textAlign: 'left',
  },
  contactInfo: {
    marginBottom: 60,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginTop: 16,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  phoneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    lineHeight: 20,
  },
});

export default AboutScreen;