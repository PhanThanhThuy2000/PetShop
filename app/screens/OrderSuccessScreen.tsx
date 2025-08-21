import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const OrderSuccessScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/iconshop.png')} 
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>Đơn hàng của bạn đã được đặt thành công</Text>
      <Text style={styles.description}>
        Cảm ơn bạn đã chọn chúng tôi! Hãy tiếp tục mua sắm và khám phá nhiều sản phẩm của chúng tôi. Chúc bạn mua sắm vui vẻ!
      </Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('app', { screen: 'Home' })}
      >
        <Text style={styles.buttonText}>Tiếp tục mua sắm</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OrderSuccessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEFF1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  title: {
    fontSize: 22, 
    fontWeight: 'bold',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 15, 
    color: '#666',
    textAlign: 'center',
    marginBottom: 32, 
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#D9534F', 
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12, 
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});