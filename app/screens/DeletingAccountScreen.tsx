import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DeletingAccountScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.alertBox}>
          <View style={styles.alertIcon}>
            <Text style={styles.alertDot}>!</Text>
          </View>
          <Text style={styles.alertText}>You are going to delete your account</Text>
          <Text style={styles.subText}>You won't be able to restore your data</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => {}}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => {}}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
            </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Màu nền nhẹ nhàng hơn
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  alertBox: {
    backgroundColor: '#ffffff',
    borderRadius: 15, 
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8, 
    width: '90%', 
  },
  alertIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  alertDot: {
    color: '#d32f2f', 
    fontSize: 22,
    fontWeight: 'bold',
  },
  alertText: {
    fontSize: 20,
    fontWeight: '600', 
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20, 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#757575', 
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    elevation: 3, 
  },
  deleteButton: {
    backgroundColor: '#ef5350', 
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    flex: 1,
    elevation: 3, 
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DeletingAccountScreen;