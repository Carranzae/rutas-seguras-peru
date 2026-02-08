// Ruta Segura Perú - Guide Profile Screen
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/src/constants/theme';
import { useAuth } from '@/src/features/auth';
import { httpClient } from '@/src/core/api';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GuideStats {
    total_tours: number;
    total_tourists: number;
    rating: number;
    years_active: number;
}

export default function GuideProfile() {
    const { user, logout, isLoading } = useAuth();
    const [stats, setStats] = useState<GuideStats>({ total_tours: 0, total_tourists: 0, rating: 0, years_active: 0 });
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = useCallback(async () => {
        try {
            const response = await httpClient.get<GuideStats>('/guides/me/stats');
            if (response.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.log('Error loading guide stats:', error);
        }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    const onRefresh = () => {
        setRefreshing(true);
        loadStats().finally(() => setRefreshing(false));
    };

    const handleLogout = () => {
        Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas salir?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Salir', style: 'destructive', onPress: async () => {
                    try {
                        await logout();
                        router.replace('/');
                    } catch (e) {
                        console.error('Logout error:', e);
                    }
                }
            },
        ]);
    };

    const initials = user?.full_name
        ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'G';

    const menuItems = [
        { id: 'verification', icon: '✓', title: 'Verification Status', subtitle: user?.is_verified ? 'DIRCETUR verified' : 'Not verified', color: user?.is_verified ? Colors.success : Colors.warning },
        { id: 'languages', icon: '🌐', title: 'Languages', subtitle: user?.language || 'Spanish' },
        { id: 'specialties', icon: '🎯', title: 'Specialties', subtitle: 'History, Culture, Food' },
        { id: 'earnings', icon: '💰', title: 'Earnings', subtitle: 'View your income' },
        { id: 'reviews', icon: '⭐', title: 'Reviews', subtitle: `${stats.rating.toFixed(1)} rating` },
        { id: 'settings', icon: '⚙️', title: 'Settings', subtitle: '' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <View style={[styles.avatar, user?.is_verified && { borderWidth: 3, borderColor: Colors.success }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <Text style={styles.name}>{user?.full_name || 'Guide'}</Text>
                    <Text style={styles.role}>{user?.email || 'Professional Tour Guide'}</Text>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>⭐ {stats.rating.toFixed(1)} • {stats.total_tours} tours</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}><Text style={styles.statValue}>{stats.total_tours}</Text><Text style={styles.statLabel}>Tours</Text></View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}><Text style={styles.statValue}>{stats.total_tourists}</Text><Text style={styles.statLabel}>Tourists</Text></View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}><Text style={styles.statValue}>{stats.years_active}</Text><Text style={styles.statLabel}>Years</Text></View>
                </View>

                <View style={styles.menuSection}>
                    {menuItems.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.menuItem}>
                            <View style={[styles.menuIcon, item.color && { backgroundColor: `${item.color}15` }]}>
                                <Text style={styles.menuEmoji}>{item.icon}</Text>
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                {item.subtitle ? <Text style={styles.menuSubtitle}>{item.subtitle}</Text> : null}
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color={Colors.danger} /> : <Text style={styles.logoutText}>Log Out</Text>}
                </TouchableOpacity>
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { alignItems: 'center', paddingVertical: Spacing.xl },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
    avatarText: { fontSize: 36, fontWeight: Typography.fontWeight.bold, color: Colors.textLight },
    name: { fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
    role: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 4 },
    ratingBadge: { backgroundColor: 'rgba(17, 82, 212, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, marginTop: Spacing.sm },
    ratingText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.primary },
    statsRow: { flexDirection: 'row', backgroundColor: Colors.surfaceLight, marginHorizontal: Spacing.md, borderRadius: BorderRadius.xl, padding: Spacing.md, ...Shadows.sm },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: Colors.borderLight },
    statValue: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
    statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 4 },
    menuSection: { padding: Spacing.md, gap: Spacing.sm },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.xl, ...Shadows.sm },
    menuIcon: { width: 44, height: 44, borderRadius: BorderRadius.lg, backgroundColor: 'rgba(17, 82, 212, 0.1)', alignItems: 'center', justifyContent: 'center' },
    menuEmoji: { fontSize: 20 },
    menuContent: { flex: 1, marginLeft: Spacing.sm },
    menuTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
    menuSubtitle: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    chevron: { fontSize: 24, color: Colors.textSecondary },
    logoutButton: { marginHorizontal: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.danger, alignItems: 'center' },
    logoutText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.danger },
});
