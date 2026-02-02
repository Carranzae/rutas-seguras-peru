// Ruta Segura Perú - Manage Emergency Contacts Screen
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManageEmergencyContacts() {
    const [contacts, setContacts] = useState([
        { id: '1', name: 'Emma Taylor', relation: 'Sister', phone: '+1 555-123-4567', email: 'emma@email.com', primary: true },
        { id: '2', name: 'John Taylor', relation: 'Father', phone: '+1 555-987-6543', email: 'john@email.com', primary: false },
    ]);
    const [showAdd, setShowAdd] = useState(false);

    const deleteContact = (id: string) => {
        Alert.alert('Remove Contact', 'Are you sure you want to remove this emergency contact?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => setContacts(contacts.filter(c => c.id !== id)) },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Emergency Contacts</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAdd(true)}><Text style={styles.addIcon}>+</Text></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <Text style={styles.infoText}>These contacts will be notified in case of an emergency. They can see your live location during active trips.</Text>
                </View>

                {contacts.map((contact) => (
                    <View key={contact.id} style={styles.contactCard}>
                        <View style={styles.contactHeader}>
                            <View style={styles.contactAvatar}><Text style={styles.avatarText}>{contact.name.split(' ').map(n => n[0]).join('')}</Text></View>
                            <View style={styles.contactInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.contactName}>{contact.name}</Text>
                                    {contact.primary && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Primary</Text></View>}
                                </View>
                                <Text style={styles.contactRelation}>{contact.relation}</Text>
                            </View>
                        </View>
                        <View style={styles.contactDetails}>
                            <View style={styles.detailRow}><Text style={styles.detailIcon}>📱</Text><Text style={styles.detailText}>{contact.phone}</Text></View>
                            <View style={styles.detailRow}><Text style={styles.detailIcon}>✉️</Text><Text style={styles.detailText}>{contact.email}</Text></View>
                        </View>
                        <View style={styles.contactActions}>
                            <TouchableOpacity style={styles.actionButton}><Text style={styles.actionText}>Edit</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => deleteContact(contact.id)}><Text style={styles.deleteText}>Remove</Text></TouchableOpacity>
                        </View>
                    </View>
                ))}

                {/* Permissions */}
                <Text style={styles.sectionTitle}>Sharing Permissions</Text>
                <View style={styles.permissionsCard}>
                    <View style={styles.permissionRow}>
                        <View style={styles.permissionInfo}>
                            <Text style={styles.permissionTitle}>📍 Location Sharing</Text>
                            <Text style={styles.permissionDesc}>Share live location during trips</Text>
                        </View>
                        <View style={styles.toggleOn}><View style={styles.toggleDot} /></View>
                    </View>
                    <View style={styles.permissionRow}>
                        <View style={styles.permissionInfo}>
                            <Text style={styles.permissionTitle}>🔔 SOS Notifications</Text>
                            <Text style={styles.permissionDesc}>Alert contacts on emergency</Text>
                        </View>
                        <View style={styles.toggleOn}><View style={styles.toggleDot} /></View>
                    </View>
                    <View style={styles.permissionRow}>
                        <View style={styles.permissionInfo}>
                            <Text style={styles.permissionTitle}>📅 Trip Updates</Text>
                            <Text style={styles.permissionDesc}>Send trip start/end alerts</Text>
                        </View>
                        <View style={styles.toggleOff}><View style={styles.toggleDotOff} /></View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
    addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    addIcon: { fontSize: 24, color: 'white' },
    content: { padding: Spacing.md },
    infoCard: { flexDirection: 'row', backgroundColor: 'rgba(17, 82, 212, 0.1)', padding: Spacing.md, borderRadius: 12, marginBottom: Spacing.md, gap: Spacing.sm },
    infoIcon: { fontSize: 20 },
    infoText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
    contactCard: { backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.sm },
    contactHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
    contactAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    contactInfo: { flex: 1, marginLeft: Spacing.sm },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    contactName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
    primaryBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    primaryText: { fontSize: 10, color: Colors.success, fontWeight: '600' },
    contactRelation: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    contactDetails: { gap: 4, marginBottom: Spacing.sm },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailIcon: { fontSize: 14 },
    detailText: { fontSize: 14, color: Colors.textSecondary },
    contactActions: { flexDirection: 'row', gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.sm },
    actionButton: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: Colors.backgroundLight, borderRadius: 8 },
    actionText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
    deleteButton: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    deleteText: { fontSize: 14, color: Colors.danger, fontWeight: '600' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.sm },
    permissionsCard: { backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: Spacing.md },
    permissionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
    permissionInfo: { flex: 1 },
    permissionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    permissionDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    toggleOn: { width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.success, justifyContent: 'center', paddingHorizontal: 2 },
    toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white', alignSelf: 'flex-end' },
    toggleOff: { width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight, justifyContent: 'center', paddingHorizontal: 2 },
    toggleDotOff: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white', alignSelf: 'flex-start' },
});
