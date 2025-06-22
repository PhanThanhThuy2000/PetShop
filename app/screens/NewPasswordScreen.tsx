import React from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const NewPasswordScreen = () => {
    return (
        <View style={styles.container}>
            <View style={styles.waveBackgroundLight} />

            <View style={styles.waveBackground} />

            <View style={styles.header}>
                <View style={styles.dogIcon}>
                    <Image source={require('@/assets/images/imageDog.png')} style={styles.dogImage} />
                </View>
            </View>

            <Text style={styles.title}>Setup New Password</Text>
            <Text style={styles.subtitle}>Please, setup a new password for your account</Text>

            {/* Form nhập liệu */}
            <TextInput style={styles.input} placeholder="New Password" secureTextEntry />
            <TextInput style={styles.input} placeholder="Repeat Password" secureTextEntry />

            {/* Nút Save và Cancel */}
            <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity>
                <Text style={styles.cancelText}>Cancel</Text>
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
        width: '70%',
    },
    input: {
        width: '80%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#f9f9f9',
        fontSize: 16,
        textAlign: 'center',
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