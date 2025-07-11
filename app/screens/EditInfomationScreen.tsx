import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile, getCurrentUser } from '../redux/slices/authSlice';

const EditInfomationScreen = () => {
  const navigation = useNavigation<any>();
  const { user, isLoading, dispatch } = useAuth();

  // State để quản lý dữ liệu trong các ô input
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
  });

  // State cho avatar
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setSelectedImage(user.avatar_url || null);
    } else {
      dispatch(getCurrentUser());
    }
  }, [user, dispatch]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Show alert when user tries to edit email
  const handleEmailTap = () => {
    Alert.alert(
      'Cannot Edit Email',
      'Email address cannot be changed for security reasons. Please contact support if you need to update your email.',
      [
        {
          text: 'OK',
          style: 'default'
        }
      ]
    );
  };

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to change your profile picture!'
      );
      return false;
    }
    return true;
  };

  // Pick image from library
  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        // Save avatar to user profile
        await saveAvatar(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take a photo!'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        // Save avatar to user profile
        await saveAvatar(imageUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Save avatar to backend
  const saveAvatar = async (imageUri: string) => {
    try {
      if (!user) {
        Alert.alert('Error', 'User information not found');
        return;
      }

      // Update user profile with new avatar URL
      const updateData = {
        avatar_url: imageUri
      };

      const result = await dispatch(updateUserProfile(updateData));
      
      if (updateUserProfile.fulfilled.match(result)) {
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        console.error('Avatar update failed:', result.payload);
        Alert.alert('Error', 'Failed to update profile picture');
        // Revert the image if upload failed
        setSelectedImage(user?.avatar_url || null);
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
      Alert.alert('Error', 'Failed to save profile picture');
      // Revert the image if upload failed
      setSelectedImage(user?.avatar_url || null);
    }
  };

  // Show image picker options
  const showImagePickerOptions = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose how you want to select a photo',
      [
        {
          text: 'Camera',
          onPress: takePhoto,
        },
        {
          text: 'Photo Library',
          onPress: pickImageFromLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }
    
    // Email validation removed since it's not editable
    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (!user) {
        Alert.alert('Error', 'User information not loaded');
        return;
      }

      // Prepare update data (only send changed fields, excluding email)
      const updateData: any = {};
      
      if (formData.username !== user?.username) {
        updateData.username = formData.username;
      }
      
      // Email is not editable, so we don't include it in updates
      
      if (formData.phone !== user?.phone) {
        updateData.phone = formData.phone;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        Alert.alert('Info', 'No changes to save');
        return;
      }

      // Dispatch update action
      const result = await dispatch(updateUserProfile(updateData));
      
      if (updateUserProfile.fulfilled.match(result)) {
        Alert.alert(
          'Success', 
          'Profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.payload as string || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const getUserAvatar = () => {
    if (selectedImage) {
      return { uri: selectedImage };
    }
    if (user?.avatar_url) {
      return { uri: user.avatar_url };
    }
    return { uri: 'https://randomuser.me/api/portraits/men/32.jpg' };
  };

  if (!user && isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading user information...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={showImagePickerOptions}>
            <Image
              source={getUserAvatar()}
              style={styles.avatar}
            />
            <View style={styles.editIconContainer}>
              <Ionicons name="pencil" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        {/* Form Inputs */}
        <View style={styles.form}>
          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              placeholder="Enter username"
              placeholderTextColor="#8e8e93"
            />
          </View>

          <Text style={styles.inputLabel}>Email Address</Text>
          <TouchableOpacity 
            style={[styles.inputContainer, styles.disabledInput]}
            onPress={handleEmailTap}
            activeOpacity={0.7}
          >
            <TextInput
              style={[styles.input, styles.disabledText]}
              value={formData.email}
              placeholder="Email address"
              placeholderTextColor="#8e8e93"
              editable={false}
              selectTextOnFocus={false}
              pointerEvents="none"
            />
            <View style={styles.lockIconContainer}>
              <Ionicons name="lock-closed" size={16} color="#8e8e93" />
            </View>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              placeholderTextColor="#8e8e93"
            />
          </View>

          {/* Display read-only user info */}
          {user && (
            <View style={styles.readOnlySection}>
              <Text style={styles.readOnlyLabel}>Account Information</Text>
              <View style={styles.readOnlyItem}>
                <Text style={styles.readOnlyItemLabel}>Role:</Text>
                <Text style={styles.readOnlyItemValue}>{user.role}</Text>
              </View>
              <View style={styles.readOnlyItem}>
                <Text style={styles.readOnlyItemLabel}>Member since:</Text>
                <Text style={styles.readOnlyItemValue}>
                  {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSaveChanges}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    paddingTop: 35,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIconContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 14,
    color: '#007AFF',
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF'
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#000',
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  disabledText: {
    color: '#6c757d',
  },
  lockIconContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  emailNote: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: -12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  readOnlySection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  readOnlyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  readOnlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  readOnlyItemLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  readOnlyItemValue: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#eef0f2',
    backgroundColor: '#fff'
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditInfomationScreen;