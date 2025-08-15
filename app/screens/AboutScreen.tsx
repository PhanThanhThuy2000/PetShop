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

        <Text style={styles.title}>Về PeShops</Text>

        <Text style={styles.description}>
          PeShops - Ứng dụng mua sắm trực tuyến hiện đại và tiện lợi. Chúng tôi cung cấp giao diện người dùng thân thiện và trải nghiệm mua sắm tuyệt vời cho khách hàng. Với hàng ngàn sản phẩm chất lượng cao từ các thương hiệu uy tín, PeShops cam kết mang đến cho bạn những sản phẩm tốt nhất với giá cả hợp lý.
        </Text>

        <Text style={styles.contactText}>
          Nếu bạn cần hỗ trợ hoặc có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email.
        </Text>

        <Text style={styles.emailText}>
          hello@peshops.com
        </Text>
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
  contactText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    marginBottom: 16,
    textAlign: 'left',
  },
  emailText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 60,
  },
});

export default AboutScreen;