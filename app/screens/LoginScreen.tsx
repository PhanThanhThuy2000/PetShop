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

import { useAuth } from '../../hooks/redux';
import { clearError, loginUser } from '../redux/slices/authSlice';

const LoginScreen = () => {
    const navigation = useNavigation<any>();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { isLoading, error, token, dispatch } = useAuth();

    useEffect(() => {
        if (token) {
            navigation.navigate('app' as never);
        }
    }, [token, navigation]);

    useEffect(() => {
        if (error) {
            Alert.alert('Login Error', error, [
                { text: 'OK', onPress: () => dispatch(clearError()) }
            ]);
        }
    }, [error, dispatch]);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter both email and password');
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
                        <Text style={styles.title}>Login</Text>
                        <Text style={styles.subtitle}>Good to see you back!</Text>
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

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#BDBDBD"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={styles.forgotPasswordText}>Forgot Password ?</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.footerLink} onPress={handleSignUp}>
                        <Text style={styles.footerText}>
                            Don't have an account? <Text style={styles.footerLinkText}>Sign Up</Text>
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
                            <Text style={styles.primaryButtonText}>Next</Text>
                         )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelText}>Cancel</Text>
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
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    title: {
        fontSize: 42,
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
        width: 250,
        height: 250,
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