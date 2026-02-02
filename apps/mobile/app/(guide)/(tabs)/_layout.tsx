// Ruta Segura Perú - Guide Tab Layout
import { Colors, Typography } from '@/src/constants/theme';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
    const icons: Record<string, string> = {
        dashboard: '📊',
        tours: '🗺️',
        translate: '🌐',
        profile: '👤',
    };
    return (
        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
            <Text style={styles.icon}>{icons[name]}</Text>
        </View>
    );
};

export default function GuideTabLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarActiveTintColor: Colors.primary, tabBarInactiveTintColor: Colors.textSecondary, tabBarLabelStyle: styles.tabLabel }}>
            <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} /> }} />
            <Tabs.Screen name="tours" options={{ title: 'Tours', tabBarIcon: ({ focused }) => <TabIcon name="tours" focused={focused} /> }} />
            <Tabs.Screen name="translate" options={{ title: 'Translate', tabBarIcon: ({ focused }) => <TabIcon name="translate" focused={focused} /> }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} /> }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: { backgroundColor: Colors.surfaceLight, borderTopColor: Colors.borderLight, height: 84, paddingTop: 8, paddingBottom: 20 },
    tabLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium },
    iconContainer: { width: 48, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    iconContainerActive: { backgroundColor: 'rgba(17, 82, 212, 0.1)' },
    icon: { fontSize: 24 },
});
