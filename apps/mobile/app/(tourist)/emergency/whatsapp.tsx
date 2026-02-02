// Ruta Segura Perú - WhatsApp SOS Message Screen
import { Colors, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WhatsAppSOSMessage() {
    const emergencyContacts = [
        { name: 'Emma Taylor', phone: '+15551234567', relation: 'Sister' },
        { name: 'John Taylor', phone: '+15559876543', relation: 'Father' },
    ];

    const location = { lat: -13.163141, lng: -72.544963, name: 'Near Machu Picchu, Cusco, Peru' };
    const message = `🆘 EMERGENCY ALERT 🆘\n\nI need help! This is an automated emergency message from Ruta Segura Peru.\n\n📍 Location: ${location.name}\n🌐 Coordinates: ${location.lat}, ${location.lng}\n🗺️ Google Maps: https://maps.google.com/?q=${location.lat},${location.lng}\n\nPlease contact local authorities if you can't reach me.`;

    const sendWhatsApp = (phone: string) => {
        const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => alert('WhatsApp is not installed'));
    };

    const sendToAll = () => {
        emergencyContacts.forEach(c => sendWhatsApp(c.phone));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>WhatsApp SOS</Text>
                <View style={styles.whatsappIcon}><Text>📱</Text></View>
            </View>

            <View style={styles.content}>
                <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>Message Preview</Text>
                    <Text style={styles.previewText}>{message}</Text>
                </View>

                <Text style={styles.sectionTitle}>Send To</Text>
                {emergencyContacts.map((c, i) => (
                    <TouchableOpacity key={i} style={styles.contactCard} onPress={() => sendWhatsApp(c.phone)}>
                        <View style={styles.contactAvatar}><Text style={styles.avatarText}>{c.name[0]}</Text></View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>{c.name}</Text>
                            <Text style={styles.contactRelation}>{c.relation}</Text>
                        </View>
                        <View style={styles.sendButton}><Text style={styles.sendIcon}>📤</Text></View>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.sendAllButton} onPress={sendToAll}>
                    <Text style={styles.sendAllIcon}>📱</Text>
                    <Text style={styles.sendAllText}>Send to All Contacts</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDark },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 20, color: 'white' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    whatsappIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(37, 211, 102, 0.2)', alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1, padding: Spacing.md },
    previewCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    previewTitle: { fontSize: 14, fontWeight: 'bold', color: 'white', marginBottom: Spacing.sm },
    previewText: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, fontFamily: 'monospace' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: 'white', marginBottom: Spacing.sm },
    contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: Spacing.md, borderRadius: 12, marginBottom: Spacing.sm },
    contactAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    contactInfo: { flex: 1, marginLeft: Spacing.sm },
    contactName: { fontSize: 16, fontWeight: '600', color: 'white' },
    contactRelation: { fontSize: 12, color: Colors.textMuted },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
    sendIcon: { fontSize: 18 },
    sendAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: '#25D366', padding: Spacing.md, borderRadius: 16, marginTop: Spacing.lg },
    sendAllIcon: { fontSize: 24 },
    sendAllText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
});
