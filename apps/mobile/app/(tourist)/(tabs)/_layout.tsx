// Ruta Segura Perú - Tourist Tab Layout
import { Colors, Typography } from '@/src/constants/theme';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Icon component for tabs
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
    const icons: Record<string, string> = {
        explore: '🧭',
        safety: '🛡️',
        map: '🗺️',
        bookings: '📅',
        profile: '👤',
    };

    return (
        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
            <Text style={styles.icon}>{icons[name]}</Text>
        </View>
    );
};

export default function TouristTabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ focused }) => <TabIcon name="explore" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="safety"
                options={{
                    title: 'Safety',
                    tabBarIcon: ({ focused }) => <TabIcon name="safety" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: 'Bookings',
                    tabBarIcon: ({ focused }) => <TabIcon name="bookings" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: Colors.surfaceLight,
        borderTopColor: Colors.borderLight,
        height: 84,
        paddingTop: 8,
        paddingBottom: 20,
    },
    tabLabel: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    iconContainer: {
        width: 48,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerActive: {
        backgroundColor: 'rgba(17, 82, 212, 0.1)',
    },
    icon: {
        fontSize: 24,
    },
});
