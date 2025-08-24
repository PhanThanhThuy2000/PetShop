import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentUser, updateUserProfile } from '../redux/slices/authSlice';

const EditInformationScreen = () => {
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
      'Không thể chỉnh sửa Email',
      'Địa chỉ email không thể thay đổi vì lý do bảo mật. Vui lòng liên hệ hỗ trợ nếu bạn cần cập nhật email của mình.',
      [
        {
          text: 'Đồng ý',
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
        'Cần quyền truy cập',
        'Xin lỗi, chúng tôi cần quyền truy cập thư viện ảnh để thay đổi ảnh đại diện của bạn!'
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
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Cần quyền truy cập',
        'Xin lỗi, chúng tôi cần quyền truy cập camera để chụp ảnh!'
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
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  // Save avatar to backend
  const saveAvatar = async (imageUri: string) => {
    try {
      if (!user) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
        return;
      }

      // Update user profile with new avatar URL
      const updateData = {
        avatar_url: imageUri
      };

      const result = await dispatch(updateUserProfile(updateData));

      if (updateUserProfile.fulfilled.match(result)) {
        Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
      } else {
        console.error('Avatar update failed:', result.payload);
        Alert.alert('Lỗi', 'Không thể cập nhật ảnh đại diện');
        // Revert the image if upload failed
        setSelectedImage(user?.avatar_url || null);
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
      Alert.alert('Lỗi', 'Không thể lưu ảnh đại diện');
      // Revert the image if upload failed
      setSelectedImage(user?.avatar_url || null);
    }
  };

  // Show image picker options
  const showImagePickerOptions = () => {
    Alert.alert(
      'Thay đổi ảnh đại diện',
      'Chọn cách bạn muốn chọn ảnh',
      [
        {
          text: 'Chụp ảnh',
          onPress: takePhoto,
        },
        {
          text: 'Chọn từ thư viện',
          onPress: pickImageFromLibrary,
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ]
    );
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert('Lỗi', 'Tên người dùng là bắt buộc');
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
        Alert.alert('Lỗi', 'Thông tin người dùng chưa được tải');
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
        Alert.alert('Thông báo', 'Không có thay đổi nào để lưu');
        return;
      }

      // Dispatch update action
      const result = await dispatch(updateUserProfile(updateData));

      if (updateUserProfile.fulfilled.match(result)) {
        Alert.alert(
          'Thành công',
          'Cập nhật tài khoản thành công',
          [
            {
              text: 'Đồng ý',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', result.payload as string || 'Cập nhật tài khoản thất bại');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi không mong muốn');
    }
  };

  const getUserAvatar = () => {
    if (selectedImage) {
      return { uri: selectedImage };
    }
    if (user?.avatar_url) {
      return { uri: user.avatar_url };
    }
    return { uri: 'https://www.creativefabrica.com/wp-content/uploads/2023/05/18/Pet-Shop-logo-design-vector-Graphics-69959847-1.png' };
  };

  if (!user && isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải thông tin người dùng...</Text>
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
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
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
        </View>

        {/* Form Inputs */}
        <View style={styles.form}>
          <Text style={styles.inputLabel}>Tên hiển thị</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              placeholder="Nhập tên hiển thị"
              placeholderTextColor="#8e8e93"
            />
          </View>

          <Text style={styles.inputLabel}>Địa chỉ email</Text>
          <TouchableOpacity
            style={[styles.inputContainer, styles.disabledInput]}
            onPress={handleEmailTap}
            activeOpacity={0.7}
          >
            <TextInput
              style={[styles.input, styles.disabledText]}
              value={formData.email}
              placeholder="Địa chỉ email"
              placeholderTextColor="#8e8e93"
              editable={false}
              selectTextOnFocus={false}
              pointerEvents="none"
            />
            <View style={styles.lockIconContainer}>
              <Ionicons name="lock-closed" size={16} color="#8e8e93" />
            </View>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Số điện thoại</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              placeholderTextColor="#8e8e93"
            />
          </View>

          {/* Display read-only user info */}
          {user && (
            <View style={styles.readOnlySection}>
              <View style={styles.readOnlyItem}>
                <Text style={styles.readOnlyItemLabel}>Ngày tạo:</Text>
                <Text style={styles.readOnlyItemValue}>
                  {new Date(user.created_at).toLocaleDateString('vi-VN')}
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
            <Text style={styles.saveButtonText}>Lưu thông tin</Text>
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

export default EditInformationScreen;