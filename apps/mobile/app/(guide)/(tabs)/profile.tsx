// Ruta Segura Perú - Guide Profile Screen
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/src/constants/theme';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuideProfile() {
    const menuItems = [
        { id: 'verification', icon: '✓', title: 'Verification Status', subtitle: 'DIRCETUR verified', color: Colors.success },
        { id: 'languages', icon: '🌐', title: 'Languages', subtitle: 'Spanish, English, Portuguese' },
        { id: 'specialties', icon: '🎯', title: 'Specialties', subtitle: 'History, Culture, Food' },
        { id: 'earnings', icon: '💰', title: 'Earnings', subtitle: 'View your income' },
        { id: 'reviews', icon: '⭐', title: 'Reviews', subtitle: '48 reviews' },
        { id: 'settings', icon: '⚙️', title: 'Settings', subtitle: '' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>AR</Text></View>
                    <Text style={styles.name}>Alex Rivera</Text>
                    <Text style={styles.role}>Professional Tour Guide</Text>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>⭐ 4.9 • 156 tours</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}><Text style={styles.statValue}>156</Text><Text style={styles.statLabel}>Tours</Text></View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}><Text style={styles.statValue}>1.2k</Text><Text style={styles.statLabel}>Tourists</Text></View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}><Text style={styles.statValue}>3</Text><Text style={styles.statLabel}>Years</Text></View>
                </View>

                <View style={styles.menuSection}>
                    {menuItems.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.menuItem}>
                            <View style={[styles.menuIcon, item.color && { backgroundColor: `${item.color}15` }]}>
                                <Text style={styles.menuEmoji}>{item.icon}</Text>
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutButton}><Text style={styles.logoutText}>Log Out</Text></TouchableOpacity>
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
