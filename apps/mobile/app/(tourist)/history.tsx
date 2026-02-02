// Ruta Segura Perú - Trip History Screen
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TripHistory() {
    const trips = [
        { id: '1', tour: 'Machu Picchu Explorer', date: 'Jan 15, 2025', guide: 'Maria Santos', status: 'completed', rating: 5 },
        { id: '2', tour: 'Sacred Valley Tour', date: 'Jan 10, 2025', guide: 'Carlos R.', status: 'completed', rating: 4 },
        { id: '3', tour: 'Lima Food Tour', date: 'Jan 5, 2025', guide: 'Ana P.', status: 'completed', rating: 5 },
        { id: '4', tour: 'Nazca Lines Flight', date: 'Dec 28, 2024', guide: 'Pedro L.', status: 'cancelled', rating: null },
    ];

    const stats = { total: 4, hours: 32, countries: 1 };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Trip History</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Stats */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Trips</Text></View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}><Text style={styles.statValue}>{stats.hours}</Text><Text style={styles.statLabel}>Hours</Text></View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}><Text style={styles.statValue}>{stats.countries}</Text><Text style={styles.statLabel}>Countries</Text></View>
                </View>

                {/* Trips */}
                {trips.map((trip) => (
                    <TouchableOpacity key={trip.id} style={styles.tripCard}>
                        <View style={styles.tripIcon}><Text style={styles.tripEmoji}>🏛️</Text></View>
                        <View style={styles.tripInfo}>
                            <Text style={styles.tripName}>{trip.tour}</Text>
                            <Text style={styles.tripDate}>📅 {trip.date}</Text>
                            <Text style={styles.tripGuide}>👤 {trip.guide}</Text>
                        </View>
                        <View style={styles.tripRight}>
                            {trip.status === 'completed' ? (
                                <View style={styles.ratingContainer}>
                                    {[...Array(trip.rating || 0)].map((_, i) => (<Text key={i} style={styles.star}>⭐</Text>))}
                                </View>
                            ) : (
                                <View style={styles.cancelledBadge}><Text style={styles.cancelledText}>Cancelled</Text></View>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
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
    content: { padding: Spacing.md },
    statsCard: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 16, padding: Spacing.lg, marginBottom: Spacing.md },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 28, fontWeight: 'bold', color: 'white' },
    statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    tripCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 16, marginBottom: Spacing.sm, ...Shadows.sm },
    tripIcon: { width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(17, 82, 212, 0.1)', alignItems: 'center', justifyContent: 'center' },
    tripEmoji: { fontSize: 26 },
    tripInfo: { flex: 1, marginLeft: Spacing.sm },
    tripName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
    tripDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    tripGuide: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    tripRight: { alignItems: 'flex-end' },
    ratingContainer: { flexDirection: 'row' },
    star: { fontSize: 12 },
    cancelledBadge: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    cancelledText: { fontSize: 10, color: Colors.danger, fontWeight: '600' },
});
