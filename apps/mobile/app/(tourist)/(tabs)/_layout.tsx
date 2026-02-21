// Ruta Segura Perú - Tourist Tab Layout (Production)
import { Colors, Typography } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

// Modern tab icon with Ionicons
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
    const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
        explore: { active: 'compass', inactive: 'compass-outline' },
        safety: { active: 'shield-checkmark', inactive: 'shield-checkmark-outline' },
        map: { active: 'map', inactive: 'map-outline' },
        bookings: { active: 'calendar', inactive: 'calendar-outline' },
        profile: { active: 'person-circle', inactive: 'person-circle-outline' },
        translator: { active: 'language', inactive: 'language-outline' },
    };

    const iconSet = icons[name] || { active: 'ellipse', inactive: 'ellipse-outline' };

    return (
        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
            <Ionicons
                name={focused ? iconSet.active : iconSet.inactive}
                size={22}
                color={focused ? Colors.primary : Colors.textSecondary}
            />
            {focused && <View style={styles.activeIndicator} />}
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
                    title: 'Explorar',
                    tabBarIcon: ({ focused }) => <TabIcon name="explore" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="safety"
                options={{
                    title: 'Seguridad',
                    tabBarIcon: ({ focused }) => <TabIcon name="safety" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Mapa',
                    tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="translator"
                options={{
                    title: 'Traductor',
                    tabBarIcon: ({ focused }) => <TabIcon name="translator" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: 'Reservas',
                    tabBarIcon: ({ focused }) => <TabIcon name="bookings" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#ffffff',
        borderTopWidth: 0,
        height: Platform.OS === 'ios' ? 88 : 68,
        paddingTop: 6,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    tabLabel: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
        marginTop: 2,
    },
    iconContainer: {
        width: 44,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    iconContainerActive: {
        backgroundColor: 'rgba(17, 82, 212, 0.08)',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -2,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
});
