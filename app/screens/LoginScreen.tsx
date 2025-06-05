import { useState } from 'react';
import {
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

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        console.log('Login with:', { email, password });
        // navigation.navigate('Home');
    };

    const handleGoogleLogin = () => {
        console.log('Google login');
    };

    const handleFacebookLogin = () => {
        console.log('Facebook login');
    };

    const handleForgotPassword = () => {
        console.log('Forgot password');
    };

    const handleSignUp = () => {
        console.log('Sign up');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerSection}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Login</Text>
                        <Text style={styles.subtitle}>Good to see you back!</Text>
                    </View>
                    <Image
                        source={require('../../assets/images/illustration.png')}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.formSection}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#D2D2D2"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#D2D2D2"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={styles.forgotPasswordContainer}
                        onPress={handleForgotPassword}
                    >
                        <Text style={styles.forgotPasswordText}>Forgot Password ?</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.signUpSection}>
                    <TouchableOpacity onPress={handleSignUp}>
                        <Text style={styles.signUpText}>
                            Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.socialSection}>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={handleGoogleLogin}
                    >
                        <Image
                            source={require('../../assets/images/google_icon.png')}
                            style={styles.socialIcon}
                        />
                        <Text style={styles.socialButtonText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={handleFacebookLogin}
                    >
                        <Image
                            source={require('@/assets/images/facebook_icon.png')}
                            style={styles.socialIcon}
                        />
                        <Text style={styles.socialButtonText}>Continue with Facebook</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                >
                    <Text style={styles.loginButtonText}>Next</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 21,
        paddingTop: 20,
        marginBottom: 40,
    },
    titleContainer: {
        flex: 1,
        marginRight: 20,
    },
    title: {
        color: '#202020',
        fontSize: 52,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        color: '#202020',
        fontSize: 19,
        fontWeight: '400',
    },
    illustration: {
        width: 150,
        height: 140,
    },
    formSection: {
        paddingHorizontal: 22,
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#F8F8F8',
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#202020',
        marginBottom: 15,
        fontWeight: '500',
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#202020',
        fontSize: 16,
        fontWeight: '400',
    },
    signUpSection: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 22,
    },
    signUpText: {
        color: '#696969',
        fontSize: 16,
    },
    signUpLink: {
        color: '#004CFF',
        fontWeight: 'bold',
    },
    socialSection: {
        paddingHorizontal: 22,
        marginBottom: 30,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FCFCFC',
        borderWidth: 1,
        borderColor: '#D1D1D1',
        borderRadius: 16,
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    socialIcon: {
        width: 24,
        height: 24,
        marginRight: 15,
    },
    socialButtonText: {
        color: '#2A2A2A',
        fontSize: 18,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#004CFF',
        borderRadius: 16,
        paddingVertical: 16,
        marginHorizontal: 22,
        alignItems: 'center',
        marginBottom: 20,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 15,
        marginBottom: 20,
    },
    cancelButtonText: {
        color: '#202020',
        fontSize: 16,
        fontWeight: '400',
    },

});

export default LoginScreen;