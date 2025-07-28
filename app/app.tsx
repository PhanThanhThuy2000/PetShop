import React, { useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import BottomTabNavigator from "./navigation/BottomTabNavigator";

export default function App() {
    const { initializePushNotifications } = usePushNotifications();

    useEffect(() => {
        initializePushNotifications();
    }, []);

    return (
        <BottomTabNavigator />
    );
}


