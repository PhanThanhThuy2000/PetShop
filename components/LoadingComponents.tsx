import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}) => (
  <View 
    style={[
      styles.skeleton, 
      { width, height, borderRadius },
      style
    ]} 
  />
);

interface CenteredLoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
}

export const CenteredLoading: React.FC<CenteredLoadingProps> = ({ 
  size = 'small', 
  color = '#D9534F',
  text = 'Loading...'
}) => (
  <View style={styles.centeredContainer}>
    <ActivityIndicator size={size} color={color} />
    {text && <Text style={styles.loadingText}>{text}</Text>}
  </View>
);

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ 
  message, 
  onRetry,
  retryText = 'Retry'
}) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>{retryText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface EmptyViewProps {
  message?: string;
  icon?: React.ReactNode;
}

export const EmptyView: React.FC<EmptyViewProps> = ({ 
  message = 'No data available',
  icon
}) => (
  <View style={styles.emptyContainer}>
    {icon}
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

// Pet Item Skeleton
export const PetItemSkeleton = () => (
  <View style={styles.petSkeletonContainer}>
    <LoadingSkeleton height={140} borderRadius={15} style={styles.petImageSkeleton} />
    <View style={styles.petDetailsSkeleton}>
      <LoadingSkeleton height={16} style={{ marginBottom: 8 }} />
      <LoadingSkeleton height={14} width="70%" style={{ marginBottom: 4 }} />
      <LoadingSkeleton height={12} width="50%" />
    </View>
  </View>
);

// Flash Sale Item Skeleton
export const FlashSaleItemSkeleton = () => (
  <View style={styles.flashSaleSkeleton}>
    <LoadingSkeleton height={120} borderRadius={0} />
    <View style={styles.flashSaleDetailsSkeleton}>
      <LoadingSkeleton height={16} width="80%" style={{ marginBottom: 8 }} />
      <LoadingSkeleton height={20} borderRadius={10} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
    opacity: 0.7,
  },
  centeredContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fee',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#D9534F',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  petSkeletonContainer: {
    flex: 0.48,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  petImageSkeleton: {
    width: '100%',
  },
  petDetailsSkeleton: {
    padding: 12,
  },
  flashSaleSkeleton: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flashSaleDetailsSkeleton: {
    padding: 12,
  },
});
