import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../utils/api-client';
import Icon from 'react-native-vector-icons/Feather';

const NewPasswordScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { email = '', otp = '', next = 'Login' } = route.params || {};

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const PASSWORD_RULE_TEXT = 'Mật khẩu phải ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt';
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    const handleSave = async () => {
        if (!email || !otp) {
            Alert.alert('Thiếu thông tin', 'Thiếu email hoặc mã OTP. Vui lòng thực hiện lại bước trước.');
            navigation.goBack();
            return;
        }
        if (!password || !confirmPassword) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.');
            return;
        }
        if (!PASSWORD_REGEX.test(password)) {
            Alert.alert('Mật khẩu không hợp lệ', PASSWORD_RULE_TEXT);
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Không khớp', 'Xác nhận mật khẩu không trùng khớp.');
            return;
        }
        try {
            setIsSubmitting(true);
            await api.post('/users/reset-password', { email, otp, newPassword: password });
            Alert.alert('Thành công', 'Mật khẩu của bạn đã được đặt lại.', [
                { text: 'OK', onPress: () => navigation.navigate(next) },
            ]);
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra mã OTP và thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.waveBackgroundLight} />

            <View style={styles.waveBackground} />

            <View style={styles.header}>
                <View style={styles.dogIcon}>
                    <Image source={require('@/assets/images/imageDog.png')} style={styles.dogImage} />
                </View>
            </View>

            <Text style={styles.title}>Đặt mật khẩu mới</Text>
            <Text style={styles.subtitle}>Vui lòng nhập mật khẩu mới cho tài khoản của bạn</Text>

            {/* Form nhập liệu */}
            <View style={styles.formContainer}>
                <View style={styles.passwordWrapper}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Mật khẩu mới"
                        placeholderTextColor="#BDBDBD"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    >
                        <Icon
                            name={showPassword ? 'eye' : 'eye-off'}
                            size={20}
                            color="#BDBDBD"
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.passwordWrapper}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Nhập lại mật khẩu"
                        placeholderTextColor="#BDBDBD"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                    >
                        <Icon
                            name={showConfirmPassword ? 'eye' : 'eye-off'}
                            size={20}
                            color="#BDBDBD"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Nút Save và Cancel */}
            <TouchableOpacity style={styles.saveButton} disabled={isSubmitting} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Lưu</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 0,
        backgroundColor: '#fff',
        position: 'relative',
        overflow: 'hidden',
    },
    waveBackgroundLight: {
        position: 'absolute',
        top: -120,
        right: -120,
        width: 450,
        height: 300,
        backgroundColor: '#D9E4FF',
        borderBottomLeftRadius: 380,
        borderTopLeftRadius: 500,
        borderBottomRightRadius: 400,
        transform: [{ rotate: '20deg' }],
        zIndex: -2, // Đặt zIndex thấp nhất để nằm dưới waveBackground
    },
    waveBackground: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 400,
        height: 250,
        backgroundColor: '#007AFF',
        borderBottomLeftRadius: 250,
        borderTopLeftRadius: 50,
        borderBottomRightRadius: 250,
        transform: [{ rotate: '20deg' }],
        zIndex: -1, // Đặt zIndex giữa để nằm trên waveBackgroundLight nhưng dưới header
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        width: '100%',
        paddingVertical: 20,
        zIndex: 1, // Đặt zIndex cao nhất để nằm trên cả hai viền
    },
    dogIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginTop: 70
    },
    dogImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
        width: '80%',
    },
    formContainer: {
        width: '100%',
        paddingHorizontal: 24,
        marginTop: 12,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        marginBottom: 16,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#202020',
    },
    eyeIcon: {
        paddingHorizontal: 15,
        paddingVertical: 16,
    },
    saveButton: {
        width: '80%',
        height: 50,
        backgroundColor: '#007AFF',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 80,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    cancelText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default NewPasswordScreen;