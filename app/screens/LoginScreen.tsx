import { useNavigation } from '@react-navigation/native';
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
import Icon from 'react-native-vector-icons/Feather';

import { useAuth } from '../../hooks/redux';
import { clearError, loginUser } from '../redux/slices/authSlice';

const LoginScreen = () => {
    const navigation = useNavigation<any>();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { isLoading, error, token, dispatch } = useAuth();

    useEffect(() => {
        if (token) {
            navigation.navigate('app' as never);
        }
    }, [token, navigation]);

    useEffect(() => {
        if (error) {
            Alert.alert('Lỗi đăng nhập', error, [
                { text: 'OK', onPress: () => dispatch(clearError()) }
            ]);
        }
    }, [error, dispatch]);

    useEffect(() => {
        if (error === 'Your account is not allowed to log in.') {
            Alert.alert('Tài khoản bị khóa', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.');
        }
    }, [error]);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
            return;
        }
        dispatch(loginUser({ email: email.trim(), password }));
    };

    const handleSignUp = () => {
        navigation.navigate('SignUp' as never);
    };

    const handleForgotPassword = () => {
        navigation.navigate('NewPassword');
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.headerContainer}>
                    <View>
                        <Text style={styles.title}>Đăng nhập</Text>
                    </View>
                    <Image
                        source={require('../../assets/images/illustration.png')}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.formContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#BDBDBD"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <View style={styles.passwordWrapper}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Mật khẩu"
                            placeholderTextColor="#BDBDBD"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <Icon
                                name={showPassword ? "eye" : "eye-off"}
                                size={20}
                                color="#BDBDBD"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={styles.forgotPasswordText}>Quên mật khẩu ?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.footerLink} onPress={handleSignUp}>
                        <Text style={styles.footerText}>
                            Chưa có tài khoản? <Text style={styles.footerLinkText}>Đăng ký</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.buttonWrapper}>
                    <TouchableOpacity
                        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Tiếp theo</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Welcome')}>
                        <Text style={styles.cancelText}>Hủy</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingVertical: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingLeft: 24,
        paddingRight: 0, // Bỏ padding phải để ảnh sát lề
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#202020',
        maxWidth: 200, // Giới hạn chiều rộng để text tự xuống dòng
    },
    subtitle: {
        fontSize: 18,
        color: '#696969',
        marginTop: 8,
    },
    illustration: {
        width: 180,
        height: 180,
        marginRight: -10, // Đẩy ảnh sát lề phải
    },

    formContainer: {
        paddingHorizontal: 24,
        marginTop: 20,
    },
    input: {
        backgroundColor: '#F7F7F7',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#202020',
        marginBottom: 16,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        borderRadius: 12,
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
    forgotPasswordText: {
        color: '#202020',
        fontSize: 15,
        textAlign: 'right',
        marginBottom: 16,
    },
    footerLink: {
        marginTop: 16,
        alignSelf: 'center',
    },
    footerText: {
        color: '#696969',
        fontSize: 15,
    },
    footerLinkText: {
        color: '#004CFF',
        fontWeight: 'bold',
    },
    buttonWrapper: {
        paddingHorizontal: 24,
        marginTop: 20,
    },
    primaryButton: {
        backgroundColor: '#004CFF',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    buttonDisabled: {
        backgroundColor: '#A0BFFF',
    },
    cancelText: {
        color: '#696969',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
    },
});

export default LoginScreen;