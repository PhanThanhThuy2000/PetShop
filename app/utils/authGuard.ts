// authGuard.ts - Utility for handling guest access control

import { Alert } from 'react-native';

export interface AuthGuardOptions {
  requiresSignUp?: boolean; // Features that need account (favorites, notifications, cart)
  requiresLogin?: boolean;  // Features that need full JWT auth
  onSignUpRequired?: () => void;
  onLoginRequired?: () => void;
  featureName?: string;
}

export const useAuthGuard = () => {
  const checkAuthAndProceed = (
    token: string | null,
    options: AuthGuardOptions,
    callback: () => void
  ) => {
    const {
      requiresSignUp = false,
      requiresLogin = false,
      onSignUpRequired,
      onLoginRequired,
      featureName = 'this feature'
    } = options;

    // If user has token, allow access
    if (token) {
      callback();
      return;
    }

    // Guest trying to access feature
    if (requiresSignUp && !requiresLogin) {
      // Features like favorites, notifications, cart - suggest signup
      Alert.alert(
        'Account Required',
        `You need an account to use ${featureName}. Would you like to create one?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Sign Up',
            onPress: onSignUpRequired || (() => {}),
          },
        ]
      );
    } else if (requiresLogin) {
      // Features requiring full authentication - suggest login
      Alert.alert(
        'Login Required',
        `Please login to access ${featureName}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login',
            onPress: onLoginRequired || (() => {}),
          },
        ]
      );
    } else {
      // Generic auth required
      Alert.alert(
        'Authentication Required',
        `You need to be logged in to use ${featureName}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login',
            onPress: onLoginRequired || (() => {}),
          },
          {
            text: 'Sign Up',
            onPress: onSignUpRequired || (() => {}),
          },
        ]
      );
    }
  };

  return { checkAuthAndProceed };
};

// Quick helper functions
export const requiresAccount = (featureName: string) => ({
  requiresSignUp: true,
  featureName,
});

export const requiresAuth = (featureName: string) => ({
  requiresLogin: true,
  featureName,
});
