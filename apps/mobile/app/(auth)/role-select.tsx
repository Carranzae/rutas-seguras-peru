// Ruta Segura Perú - Role Selection Screen
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/src/constants/theme';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelect() {
    const roles = [
        { id: 'tourist', icon: '🧳', title: 'Soy Turista', subtitle: 'Explorar tours y viajar seguro', route: '/(tourist)/(tabs)/explore', color: '#3b82f6' },
        { id: 'guide', icon: '🎯', title: 'Soy Guía', subtitle: 'Gestionar tours y traducir', route: '/(guide)/(tabs)/dashboard', color: '#10b981' },
        { id: 'agency', icon: '🏢', title: 'Admin de Agencia', subtitle: 'Gestionar mi equipo', route: '/(agency)/(tabs)/dashboard', color: '#8b5cf6' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>🇵🇪</Text>
                <Text style={styles.title}>Ruta Segura Perú</Text>
                <Text style={styles.subtitle}>Select your role to continue</Text>
            </View>

            <View style={styles.rolesContainer}>
                {roles.map((role) => (
                    <TouchableOpacity key={role.id} style={styles.roleCard} onPress={() => router.push(role.route as any)} activeOpacity={0.9}>
                        <View style={[styles.roleIcon, { backgroundColor: `${role.color}15` }]}><Text style={styles.roleEmoji}>{role.icon}</Text></View>
                        <View style={styles.roleContent}>
                            <Text style={styles.roleTitle}>{role.title}</Text>
                            <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Safe adventures start here</Text>
                <View style={styles.badges}><Text style={styles.badge}>🔒 Secure</Text><Text style={styles.badge}>📡 Satellite</Text><Text style={styles.badge}>🌐 AI Translate</Text></View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { alignItems: 'center', paddingVertical: Spacing.xl },
    logo: { fontSize: 64, marginBottom: Spacing.md },
    title: { fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
    subtitle: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, marginTop: Spacing.sm },
    rolesContainer: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
    roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.xl, ...Shadows.sm },
    roleIcon: { width: 56, height: 56, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
    roleEmoji: { fontSize: 28 },
    roleContent: { flex: 1, marginLeft: Spacing.sm },
    roleTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
    roleSubtitle: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
    chevron: { fontSize: 28, color: Colors.textSecondary },
    footer: { alignItems: 'center', paddingBottom: Spacing.xl },
    footerText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
    badges: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
    badge: { fontSize: Typography.fontSize.xs, color: Colors.primary },
});
