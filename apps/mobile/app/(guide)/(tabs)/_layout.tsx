// Ruta Segura Perú - Guide Tab Layout (Production)
import { Colors, Typography } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
    const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
        dashboard: { active: 'grid', inactive: 'grid-outline' },
        tours: { active: 'navigate-circle', inactive: 'navigate-circle-outline' },
        translate: { active: 'language', inactive: 'language-outline' },
        profile: { active: 'person-circle', inactive: 'person-circle-outline' },
    };

    const iconSet = icons[name] || { active: 'ellipse', inactive: 'ellipse-outline' };

    return (
        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
            <Ionicons
                name={focused ? iconSet.active : iconSet.inactive}
                size={22}
                color={focused ? '#10b981' : Colors.textSecondary}
            />
            {focused && <View style={styles.activeIndicator} />}
        </View>
    );
};

export default function GuideTabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#10b981',
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="tours"
                options={{
                    title: 'Mis Tours',
                    tabBarIcon: ({ focused }) => <TabIcon name="tours" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="translate"
                options={{
                    title: 'Traductor',
                    tabBarIcon: ({ focused }) => <TabIcon name="translate" focused={focused} />,
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
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -2,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#10b981',
    },
});
