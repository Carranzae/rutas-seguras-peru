// Ruta Segura Perú - Tourist Settings
import { Colors, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TouristSettings() {
    const [name, setName] = useState('Carlos Rodriguez');
    const [email, setEmail] = useState('carlos@email.com');
    const [phone, setPhone] = useState('+51 999 888 777');
    const [language, setLanguage] = useState('Spanish');

    const sections = [
        {
            title: 'Account',
            items: [
                { icon: '👤', label: 'Edit Profile', action: 'profile' },
                { icon: '🔒', label: 'Change Password', action: 'password' },
                { icon: '🛡️', label: 'Privacy Settings', action: 'privacy' },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { icon: '🌐', label: 'Language', value: language, action: 'language' },
                { icon: '🔔', label: 'Notifications', action: 'notifications' },
                { icon: '🌙', label: 'Dark Mode', value: 'System', action: 'theme' },
            ]
        },
        {
            title: 'Safety',
            items: [
                { icon: '📍', label: 'Location Permissions', action: 'location' },
                { icon: '👥', label: 'Emergency Contacts', action: 'contacts' },
                { icon: '📋', label: 'Trip History', action: 'history' },
            ]
        },
        {
            title: 'Support',
            items: [
                { icon: '❓', label: 'Help Center', action: 'help' },
                { icon: '💬', label: 'Contact Support', action: 'support' },
                { icon: '⭐', label: 'Rate the App', action: 'rate' },
            ]
        },
    ];

    const handleAction = (action: string) => {
        if (action === 'contacts') {
            router.push('/(tourist)/emergency/contacts');
        } else if (action === 'location') {
            router.push('/(tourist)/emergency/permissions');
        } else if (action === 'history') {
            router.push('/(tourist)/history');
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => router.replace('/') }
        ]);
    };

    const handleDeleteAccount = () => {
        Alert.alert('Delete Account', 'This action is irreversible. Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => { } }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}><Text style={{ fontSize: 32 }}>👤</Text></View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{name}</Text>
                        <Text style={styles.profileEmail}>{email}</Text>
                    </View>
                    <TouchableOpacity style={styles.editBtn}>
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* Settings Sections */}
                {sections.map((section, i) => (
                    <View key={i} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.sectionContent}>
                            {section.items.map((item, j) => (
                                <TouchableOpacity key={j} style={styles.settingItem} onPress={() => handleAction(item.action)}>
                                    <Text style={styles.settingIcon}>{item.icon}</Text>
                                    <Text style={styles.settingLabel}>{item.label}</Text>
                                    {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
                                    <Text style={styles.settingArrow}>›</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: Colors.danger }]}>Danger Zone</Text>
                    <View style={styles.sectionContent}>
                        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
                            <Text style={styles.settingIcon}>🚪</Text>
                            <Text style={[styles.settingLabel, { color: Colors.danger }]}>Logout</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
                            <Text style={styles.settingIcon}>🗑️</Text>
                            <Text style={[styles.settingLabel, { color: Colors.danger }]}>Delete Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.version}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
    content: { flex: 1, paddingHorizontal: Spacing.md },
    profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.lg },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(17, 82, 212, 0.1)', alignItems: 'center', justifyContent: 'center' },
    profileInfo: { flex: 1, marginLeft: 12 },
    profileName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
    profileEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
    editBtn: { backgroundColor: 'rgba(17, 82, 212, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    editBtnText: { color: Colors.primary, fontWeight: 'bold', fontSize: 12 },
    section: { marginBottom: Spacing.lg },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionContent: { backgroundColor: Colors.surfaceLight, borderRadius: 16, overflow: 'hidden' },
    settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    settingIcon: { fontSize: 20, marginRight: 12 },
    settingLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary },
    settingValue: { fontSize: 14, color: Colors.textSecondary, marginRight: 8 },
    settingArrow: { fontSize: 20, color: Colors.textSecondary },
    version: { textAlign: 'center', color: Colors.textSecondary, fontSize: 12, marginVertical: Spacing.lg },
});
