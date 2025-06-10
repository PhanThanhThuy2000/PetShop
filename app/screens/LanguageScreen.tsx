import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LanguageScreen: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'vi'>('en');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Language</Text>

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
          <Ionicons name="ellipse" size={24} color="#FF6B6B" />
        )}
      </Pressable>
    </View>
  );
};

export default LanguageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
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
  },
  selectedItemVi: {
    backgroundColor: '#FCECED',
  },
  languageText: {
    fontSize: 16,
  },
});
