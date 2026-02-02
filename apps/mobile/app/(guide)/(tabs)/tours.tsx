// Ruta Segura Perú - Guide Tours Screen
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/src/constants/theme';
import { toursService } from '@/src/services/tours';
import { router, useFocusEffect } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuideTours() {
    const [tours, setTours] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [stats, setStats] = React.useState({ weeklyTours: 0, totalGuests: 0, rating: 4.9 });

    useFocusEffect(
        React.useCallback(() => {
            loadAssignedTours();
        }, [])
    );

    const loadAssignedTours = async () => {
        try {
            // Use local service extension
            const response = await toursService.getAssignedTours();
            if (response && response.items) {
                const mappedTours = response.items.map(t => ({
                    id: t.id,
                    title: t.name,
                    date: new Date(t.created_at).toLocaleDateString(), // Use scheduled date if available
                    guests: t.max_participants, // Or bookings count
                    status: t.status === 'published' ? 'upcoming' : t.status
                }));
                setTours(mappedTours);

                // Calc stats mock for now based on data
                setStats({
                    weeklyTours: mappedTours.length,
                    totalGuests: mappedTours.reduce((acc, t) => acc + t.guests, 0),
                    rating: 4.9 // Backend rating todo
                });
            }
        } catch (error) {
            console.error('Error loading guide tours:', error);
            // Fallback for safety if backend not ready, keep empty or show error
            // setTours([]); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Tours</Text>
                <TouchableOpacity style={styles.filterBtn}><Text style={styles.filterIcon}>📅</Text></TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.weeklyTours}</Text>
                    <Text style={styles.statLabel}>Total Tours</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalGuests}</Text>
                    <Text style={styles.statLabel}>Max Capacity</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>⭐ {stats.rating}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Assigned Tours</Text>
                {tours.length > 0 ? (
                    tours.map((tour) => (
                        <TouchableOpacity key={tour.id} style={styles.tourCard} onPress={() => router.push({
                            pathname: '/(guide)/active-route',
                            params: { tour_id: tour.id }
                        })}>
                            <View style={styles.tourIcon}><Text style={styles.tourEmoji}>🏛️</Text></View>
                            <View style={styles.tourContent}>
                                <Text style={styles.tourTitle}>{tour.title}</Text>
                                <Text style={styles.tourDate}>{tour.date}</Text>
                                <View style={styles.tourMeta}>
                                    <Text style={styles.guestCount}>👥 {tour.guests} max</Text>
                                    <View style={[styles.statusBadge, tour.status === 'upcoming' && styles.statusUpcoming]}>
                                        <Text style={styles.statusText}>{tour.status}</Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: Colors.textSecondary }}>No upcoming tours assigned.</Text>
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
    title: { fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
    filterBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
    filterIcon: { fontSize: 20 },
    statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm },
    statCard: { flex: 1, backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.xl, alignItems: 'center', ...Shadows.sm },
    statValue: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
    statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 4 },
    content: { padding: Spacing.md },
    sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
    tourCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.xl, marginBottom: Spacing.sm, gap: Spacing.sm, ...Shadows.sm },
    tourIcon: { width: 56, height: 56, borderRadius: BorderRadius.lg, backgroundColor: 'rgba(17, 82, 212, 0.1)', alignItems: 'center', justifyContent: 'center' },
    tourEmoji: { fontSize: 28 },
    tourContent: { flex: 1 },
    tourTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
    tourDate: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
    tourMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
    guestCount: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    statusUpcoming: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
    statusText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.success, textTransform: 'capitalize' },
    chevron: { fontSize: 24, color: Colors.textSecondary },
});
