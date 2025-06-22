// LanguageScreen.tsx

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Thêm import

const LanguageScreen: React.FC = () => {
  const navigation = useNavigation(); // Khởi tạo navigation
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'vi'>('en');

  return (
    <View style={styles.container}>
      {/* Header với nút Back */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
      </View>

      <View style={styles.content}>
        <Pressable
          onPress={() => setSelectedLanguage('en')}
          style={[
            styles.languageItem,
            selectedLanguage === 'en' && styles.selectedItem,
          ]}
        >
          <Text style={styles.languageText}>English</Text>
          {selectedLanguage === 'en' && (
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          )}
        </Pressable>

        <Pressable
          onPress={() => setSelectedLanguage('vi')}
          style={[
            styles.languageItem,
            selectedLanguage === 'vi' && styles.selectedItemVi,
          ]}
        >
          <Text style={styles.languageText}>Tiếng Việt</Text>
          {selectedLanguage === 'vi' && (
            // Thay đổi icon cho đồng bộ
            <Ionicons name="checkmark-circle" size={24} color="#FF6B6B" />
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default LanguageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    marginTop: 50,
  },
  backBtn: { marginRight: 12 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#F9F9F9',
  },
  selectedItem: {
    backgroundColor: '#E5EDFF',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  selectedItemVi: {
    backgroundColor: '#FCECED',
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  languageText: {
    fontSize: 16,
  },
});