// GuardedScreens.tsx - Auth-protected screen wrappers

import React from 'react';
import AuthGuardWrapper from '../components/AuthGuardWrapper';
import AccountScreen from '../screens/AccountScreen';
import CartScreen from '../screens/CartScreen';
import FavouriteScreen from '../screens/FavouriteScreen';
import PushNotificationScreen from '../screens/PushNotificationScreen';

// Favourites - requires account (suggest signup)
export const GuardedFavouriteScreen: React.FC = () => (
  <AuthGuardWrapper requiresSignUp featureName="Favourites">
    <FavouriteScreen />
  </AuthGuardWrapper>
);

// Notifications - requires account (suggest signup)
export const GuardedNotificationScreen: React.FC = () => (
  <AuthGuardWrapper requiresSignUp featureName="Notifications">
    <PushNotificationScreen />
  </AuthGuardWrapper>
);

// Cart - requires account (suggest signup)
export const GuardedCartScreen: React.FC = () => (
  <AuthGuardWrapper requiresSignUp featureName="Shopping Cart">
    <CartScreen />
  </AuthGuardWrapper>
);

// Account - requires full auth (suggest login)
export const GuardedAccountScreen: React.FC = () => (
  <AuthGuardWrapper requiresLogin featureName="Account">
    <AccountScreen />
  </AuthGuardWrapper>
);
