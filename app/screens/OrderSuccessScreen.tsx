import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const OrderSuccessScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/iconshop.png')} // Đặt hình trong thư mục assets
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>Your order has been placed successfully</Text>
      <Text style={styles.description}>
        Thank you for choosing us! Feel free to continue shopping and explore our wide range of products. Happy Shopping!
      </Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Continue Shopping</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2C1E1E',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
