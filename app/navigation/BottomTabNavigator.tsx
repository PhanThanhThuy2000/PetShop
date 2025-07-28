import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, View } from "react-native";
import { NotificationBadge } from "../../components/NotificationBadge";
import {
    GuardedAccountScreen,
    GuardedCartScreen,
    GuardedFavouriteScreen,
    GuardedNotificationScreen
} from "../components/GuardedScreens";
import HomeScreen from "../screens/HomeScreen";

const Tab = createBottomTabNavigator();

const BottomTabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    // Always use outline icons
                    switch (route.name) {
                        case "Home":
                            iconName = "home-outline";
                            break;
                        case "Favourite":
                            iconName = "heart-outline";
                            break;
                        case "Notification":
                            iconName = "notifications-outline";
                            break;
                        case "Cart":
                            iconName = "cart-outline";
                            break;
                        case "Account":
                            iconName = "person-outline";
                            break;
                        default:
                            iconName = "help-circle-outline"; 
                    }

                    return (
                        <View style={styles.iconContainer}>
                            <View style={{ position: 'relative' }}>
                                <Ionicons name={iconName} size={size} color={color} />
                                {route.name === "Notification" && (
                                    <NotificationBadge style={styles.notificationBadge} />
                                )}
                            </View>
                            {focused && <View style={styles.underline} />}
                        </View>
                    );
                },
                tabBarActiveTintColor: "#000000",
                tabBarInactiveTintColor: "#004CFF",
                tabBarStyle: {
                    paddingBottom: 10,
                    height: 60,
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Tab.Screen name="Favourite" component={GuardedFavouriteScreen} options={{ headerShown: false }} />
            <Tab.Screen name="Notification" component={GuardedNotificationScreen} options={{ headerShown: false }} />
            <Tab.Screen name="Cart" component={GuardedCartScreen} options={{ headerShown: false }} />
            <Tab.Screen name="Account" component={GuardedAccountScreen} options={{ headerShown: false }} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    underline: {
        marginTop: 4,
        width: 10, // Width of the underline
        height: 2, // Thickness of the underline
        backgroundColor: "#000000", // Matches tabBarActiveTintColor
    },
    notificationBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
    },
});

export default BottomTabNavigator;