// Ruta Segura Perú - Group Monitoring Screen
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { bookingsService } from '@/src/services/bookings';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupMonitoring() {
    const { tour_id } = useLocalSearchParams();
    const [tourists, setTourists] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadGroup();

        // Subscribe to live updates
        // We assume tracking service is already running globally or we start it
        // Ideally we register a callback listener, strict implementation depends on architecture
        // For now, we simulate "connecting" to the existing service loop
    }, []);

    const loadGroup = async () => {
        try {
            // Get bookings for this tour to build roster
            const tourId = Array.isArray(tour_id) ? tour_id[0] : tour_id || 'current';
            const response = await bookingsService.getTourBookings(tourId); // We assume guide has access

            if (response && response.items) {
                // Initial map
                const roster = response.items.map(b => ({
                    id: b.user_id, // Map booking user to tourist
                    name: b.user_name || b.contact_name,
                    status: 'ok',
                    distance: 'Unknown',
                    battery: 0,
                    lastSeen: 'Offline'
                }));
                setTourists(roster);
            }
        } catch (error) {
            console.error('Error loading group:', error);
            // Fallback empty
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ok': return Colors.success;
            case 'warning': return Colors.warning;
            case 'alert': return Colors.danger;
            default: return Colors.textSecondary;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Group Monitoring</Text>
                <View style={styles.countBadge}><Text style={styles.countText}>{tourists.length}</Text></View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}><View style={[styles.statDot, { backgroundColor: Colors.success }]} /><Text style={styles.statValue}>{tourists.filter(t => t.status === 'ok').length}</Text><Text style={styles.statLabel}>OK</Text></View>
                <View style={styles.statCard}><View style={[styles.statDot, { backgroundColor: Colors.warning }]} /><Text style={styles.statValue}>{tourists.filter(t => t.status === 'warning').length}</Text><Text style={styles.statLabel}>Warning</Text></View>
                <View style={styles.statCard}><View style={[styles.statDot, { backgroundColor: Colors.danger }]} /><Text style={styles.statValue}>{tourists.filter(t => t.status === 'alert').length}</Text><Text style={styles.statLabel}>Alert</Text></View>
            </View>

            {/* Map */}
            <View style={styles.mapCard}>
                <Text style={styles.mapEmoji}>🗺️</Text>
                <Text style={styles.mapText}>Live Group Map</Text>
                <View style={styles.radarCircle}>
                    {tourists.map((t, i) => (
                        <View key={t.id} style={[styles.radarDot, { backgroundColor: getStatusColor(t.status), left: 30 + (i * 20) % 80, top: 20 + (i * 15) % 60 }]} />
                    ))}
                </View>
            </View>

            {/* Tourist List */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {tourists.length > 0 ? (
                    tourists.map((tourist) => (
                        <TouchableOpacity key={tourist.id} style={[styles.touristCard, tourist.status === 'alert' && styles.touristCardAlert]}>
                            <View style={styles.touristLeft}>
                                <View style={[styles.avatar, { borderColor: getStatusColor(tourist.status) }]}><Text style={styles.avatarText}>{tourist.name ? tourist.name[0] : 'U'}</Text></View>
                                <View style={styles.touristInfo}>
                                    <Text style={styles.touristName}>{tourist.name || 'Unknown'}</Text>
                                    <Text style={styles.touristMeta}>📍 {tourist.distance} • 🔋 {tourist.battery}%</Text>
                                </View>
                            </View>
                            <View style={styles.touristRight}>
                                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(tourist.status)}20` }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(tourist.status) }]}>{tourist.status.toUpperCase()}</Text>
                                </View>
                                <Text style={styles.lastSeen}>{tourist.lastSeen}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginTop: 20 }}>No tourists found in this group.</Text>
                )}
            </ScrollView>

            {/* Alert Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.alertButton}><Text style={styles.alertIcon}>📢</Text><Text style={styles.alertText}>Send Group Alert</Text></TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
    countBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    countText: { fontSize: 14, fontWeight: 'bold', color: 'white' },
    statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md },
    statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.sm, borderRadius: 12, gap: 8 },
    statDot: { width: 10, height: 10, borderRadius: 5 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
    statLabel: { fontSize: 12, color: Colors.textSecondary },
    mapCard: { height: 140, backgroundColor: Colors.surfaceLight, marginHorizontal: Spacing.md, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, position: 'relative', overflow: 'hidden' },
    mapEmoji: { fontSize: 32 },
    mapText: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
    radarCircle: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(17, 82, 212, 0.2)', right: 20, top: 20 },
    radarDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
    content: { padding: Spacing.md, paddingTop: 0 },
    touristCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 16, marginBottom: Spacing.sm, ...Shadows.sm },
    touristCardAlert: { borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' },
    touristLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    avatarText: { fontSize: 14, fontWeight: 'bold', color: 'white' },
    touristInfo: { marginLeft: Spacing.sm },
    touristName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
    touristMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    touristRight: { alignItems: 'flex-end' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    lastSeen: { fontSize: 10, color: Colors.textSecondary, marginTop: 4 },
    bottomBar: { padding: Spacing.md },
    alertButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.warning, paddingVertical: 16, borderRadius: 12 },
    alertIcon: { fontSize: 20 },
    alertText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
});
