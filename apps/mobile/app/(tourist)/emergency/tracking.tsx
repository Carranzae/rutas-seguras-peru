// Ruta Segura Perú - My Safe Trip Tracking Screen
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MySafeTripTracking() {
    const trip = {
        tour: 'Machu Picchu Explorer',
        guide: 'Maria Santos',
        status: 'In Progress',
        startTime: '06:00 AM',
        estimatedEnd: '02:00 PM',
        progress: 65,
    };

    const checkpoints = [
        { id: '1', name: 'Hotel Pickup', time: '06:00 AM', status: 'completed' },
        { id: '2', name: 'Ollantaytambo Station', time: '08:30 AM', status: 'completed' },
        { id: '3', name: 'Aguas Calientes', time: '10:15 AM', status: 'completed' },
        { id: '4', name: 'Machu Picchu Entrance', time: '11:00 AM', status: 'current' },
        { id: '5', name: 'Guided Tour Complete', time: '01:00 PM', status: 'pending' },
        { id: '6', name: 'Return to Cusco', time: '02:00 PM', status: 'pending' },
    ];

    const contacts = [
        { name: 'Emma (Sister)', phone: '+1 555-1234' },
        { name: 'John (Dad)', phone: '+1 555-5678' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>My Safe Trip</Text>
                <View style={styles.liveIndicator}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Trip Card */}
                <View style={styles.tripCard}>
                    <View style={styles.tripHeader}>
                        <View style={styles.tripIcon}><Text style={styles.tripEmoji}>🏛️</Text></View>
                        <View style={styles.tripInfo}>
                            <Text style={styles.tripName}>{trip.tour}</Text>
                            <Text style={styles.tripGuide}>👤 {trip.guide}</Text>
                        </View>
                        <View style={styles.statusBadge}><Text style={styles.statusText}>{trip.status}</Text></View>
                    </View>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${trip.progress}%` }]} /></View>
                        <View style={styles.timeRow}>
                            <Text style={styles.timeText}>🕐 {trip.startTime}</Text>
                            <Text style={styles.timeText}>{trip.progress}%</Text>
                            <Text style={styles.timeText}>🏁 {trip.estimatedEnd}</Text>
                        </View>
                    </View>
                </View>

                {/* Map Placeholder */}
                <View style={styles.mapCard}>
                    <Text style={styles.mapEmoji}>🗺️</Text>
                    <Text style={styles.mapText}>Live Location Tracking</Text>
                    <View style={styles.mapCoords}><Text style={styles.coordsText}>-13.163, -72.544</Text></View>
                </View>

                {/* Checkpoints */}
                <Text style={styles.sectionTitle}>Trip Checkpoints</Text>
                <View style={styles.checkpointsList}>
                    {checkpoints.map((cp, i) => (
                        <View key={cp.id} style={styles.checkpointItem}>
                            <View style={styles.checkpointIndicator}>
                                <View style={[styles.checkpointDot, cp.status === 'completed' ? styles.dotCompleted : cp.status === 'current' ? styles.dotCurrent : styles.dotPending]}>
                                    {cp.status === 'completed' && <Text style={styles.checkIcon}>✓</Text>}
                                    {cp.status === 'current' && <View style={styles.currentPulse} />}
                                </View>
                                {i < checkpoints.length - 1 && <View style={[styles.checkpointLine, cp.status === 'completed' && styles.lineCompleted]} />}
                            </View>
                            <View style={styles.checkpointContent}>
                                <Text style={[styles.checkpointName, cp.status === 'completed' && styles.nameCompleted]}>{cp.name}</Text>
                                <Text style={styles.checkpointTime}>{cp.time}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Emergency Contacts Being Notified */}
                <Text style={styles.sectionTitle}>Emergency Contacts</Text>
                <View style={styles.contactsCard}>
                    <Text style={styles.contactsInfo}>These contacts can see your live location:</Text>
                    {contacts.map((c, i) => (
                        <View key={i} style={styles.contactRow}>
                            <View style={styles.contactAvatar}><Text>{c.name[0]}</Text></View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{c.name}</Text>
                                <Text style={styles.contactPhone}>{c.phone}</Text>
                            </View>
                            <View style={styles.sharingBadge}><Text style={styles.sharingText}>📍 Sharing</Text></View>
                        </View>
                    ))}
                </View>

                {/* SOS Button */}
                <TouchableOpacity style={styles.sosButton} onPress={() => router.push('/(tourist)/emergency/sos')}>
                    <Text style={styles.sosIcon}>🆘</Text>
                    <Text style={styles.sosText}>Emergency SOS</Text>
                </TouchableOpacity>
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
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger },
    liveText: { fontSize: 10, fontWeight: 'bold', color: Colors.danger },
    content: { padding: Spacing.md },
    tripCard: { backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.sm },
    tripHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
    tripIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(17, 82, 212, 0.1)', alignItems: 'center', justifyContent: 'center' },
    tripEmoji: { fontSize: 24 },
    tripInfo: { flex: 1, marginLeft: Spacing.sm },
    tripName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
    tripGuide: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    statusBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: 'bold', color: Colors.success },
    progressContainer: { marginTop: Spacing.sm },
    progressBar: { height: 8, backgroundColor: 'rgba(17, 82, 212, 0.1)', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    timeText: { fontSize: 10, color: Colors.textSecondary },
    mapCard: { height: 160, backgroundColor: Colors.surfaceLight, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, ...Shadows.sm },
    mapEmoji: { fontSize: 40 },
    mapText: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
    mapCoords: { marginTop: 8, backgroundColor: Colors.backgroundLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    coordsText: { fontSize: 12, fontFamily: 'monospace', color: Colors.textPrimary },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm },
    checkpointsList: { marginBottom: Spacing.lg },
    checkpointItem: { flexDirection: 'row' },
    checkpointIndicator: { width: 32, alignItems: 'center' },
    checkpointDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    dotCompleted: { backgroundColor: Colors.success },
    dotCurrent: { backgroundColor: Colors.primary, borderWidth: 3, borderColor: 'rgba(17, 82, 212, 0.3)' },
    dotPending: { backgroundColor: Colors.borderLight, borderWidth: 2, borderColor: Colors.borderLight },
    checkIcon: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    currentPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
    checkpointLine: { width: 2, flex: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
    lineCompleted: { backgroundColor: Colors.success },
    checkpointContent: { flex: 1, paddingBottom: 16, marginLeft: 8 },
    checkpointName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    nameCompleted: { color: Colors.textSecondary },
    checkpointTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    contactsCard: { backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.lg },
    contactsInfo: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm },
    contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    contactAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    contactInfo: { flex: 1, marginLeft: Spacing.sm },
    contactName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    contactPhone: { fontSize: 12, color: Colors.textSecondary },
    sharingBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    sharingText: { fontSize: 10, color: Colors.success },
    sosButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.danger, padding: Spacing.md, borderRadius: 16, marginBottom: Spacing.lg },
    sosIcon: { fontSize: 24 },
    sosText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
});
