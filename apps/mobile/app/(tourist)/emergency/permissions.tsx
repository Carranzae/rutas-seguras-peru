// Ruta Segura Perú - Emergency Access Permissions
import { Colors, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmergencyPermissions() {
    const [permissions, setPermissions] = useState({
        location: true,
        backgroundLocation: false,
        notifications: true,
        contacts: true,
        camera: false,
        batteryOptimization: false,
    });

    const togglePermission = (key: keyof typeof permissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const permissionsList = [
        { key: 'location', icon: '📍', title: 'Location Access', description: 'Share your real-time location with emergency services and contacts', critical: true },
        { key: 'backgroundLocation', icon: '🛰️', title: 'Background Location', description: 'Track your location even when the app is closed for emergency situations', critical: true },
        { key: 'notifications', icon: '🔔', title: 'Push Notifications', description: 'Receive emergency alerts and safety updates from guides and agencies', critical: false },
        { key: 'contacts', icon: '👥', title: 'Emergency Contacts', description: 'Allow the app to notify your emergency contacts in case of SOS', critical: true },
        { key: 'camera', icon: '📷', title: 'Camera Access', description: 'Capture photos for emergency documentation and evidence', critical: false },
        { key: 'batteryOptimization', icon: '🔋', title: 'Disable Battery Saver', description: 'Prevent the system from pausing location tracking to save battery', critical: true },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Safety Permissions</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.warningBox}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <View style={styles.warningContent}>
                        <Text style={styles.warningTitle}>Critical for Your Safety</Text>
                        <Text style={styles.warningText}>These permissions are essential for emergency features like SOS alerts, real-time tracking, and contact notifications.</Text>
                    </View>
                </View>

                <View style={styles.permissionsList}>
                    {permissionsList.map((perm) => (
                        <View key={perm.key} style={[styles.permissionCard, !permissions[perm.key as keyof typeof permissions] && perm.critical && styles.permissionCardWarning]}>
                            <View style={styles.permissionIcon}>
                                <Text style={{ fontSize: 24 }}>{perm.icon}</Text>
                            </View>
                            <View style={styles.permissionInfo}>
                                <View style={styles.permissionHeader}>
                                    <Text style={styles.permissionTitle}>{perm.title}</Text>
                                    {perm.critical && (
                                        <View style={styles.criticalBadge}>
                                            <Text style={styles.criticalText}>CRITICAL</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.permissionDesc}>{perm.description}</Text>
                            </View>
                            <Switch
                                value={permissions[perm.key as keyof typeof permissions]}
                                onValueChange={() => togglePermission(perm.key as keyof typeof permissions)}
                                trackColor={{ false: '#324467', true: Colors.primary }}
                                thumbColor="white"
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoIcon}>🔒</Text>
                    <Text style={styles.infoText}>Your data is encrypted and only shared during emergencies or when you explicitly request tracking. We never sell your location data.</Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
                    <Text style={styles.saveBtnText}>Save Permissions</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
    content: { flex: 1, paddingHorizontal: Spacing.md },
    warningBox: { flexDirection: 'row', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
    warningIcon: { fontSize: 24, marginRight: 12 },
    warningContent: { flex: 1 },
    warningTitle: { fontSize: 14, fontWeight: 'bold', color: '#f59e0b', marginBottom: 4 },
    warningText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
    permissionsList: { gap: 12 },
    permissionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: Spacing.md },
    permissionCardWarning: { borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
    permissionIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(17, 82, 212, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    permissionInfo: { flex: 1, marginRight: 12 },
    permissionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    permissionTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.textPrimary, flex: 1 },
    criticalBadge: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    criticalText: { fontSize: 9, fontWeight: 'bold', color: '#ef4444' },
    permissionDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
    infoBox: { flexDirection: 'row', backgroundColor: Colors.surfaceLight, borderRadius: 12, padding: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.xl },
    infoIcon: { fontSize: 18, marginRight: 8 },
    infoText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
    footer: { padding: Spacing.md },
    saveBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
