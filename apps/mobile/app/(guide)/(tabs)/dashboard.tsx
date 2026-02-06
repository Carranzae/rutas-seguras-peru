/**
 * Ruta Segura Perú - Guide Dashboard (Functional)
 * Complete dashboard with: Tours, SOS, Translator, Live Tracking, connected to Backend
 */
import { SOSButton } from '@/src/components/common';
import { BorderRadius, Colors, Shadows, Spacing } from '@/src/constants/theme';
import { httpClient } from '@/src/core/api';
import { useAuth } from '@/src/features/auth';
import { useEmergencyStore } from '@/src/features/emergency';
import { liveTrackingService } from '@/src/features/tracking';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Tour {
    id: string;
    name: string;
    date: string;
    time: string;
    guests_count: number;
    meeting_point: string;
    status: 'scheduled' | 'in_progress' | 'completed';
}

interface GuideStats {
    total_tours: number;
    total_tourists: number;
    rating: number;
    earnings_this_month: number;
}

export default function GuideDashboard() {
    const { user } = useAuth();
    const { sendSOS } = useEmergencyStore();
    const [nextTour, setNextTour] = useState<Tour | null>(null);
    const [upcomingTours, setUpcomingTours] = useState<Tour[]>([]);
    const [stats, setStats] = useState<GuideStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isTracking, setIsTracking] = useState(false);

    // Quick Actions for guides
    const quickActions = [
        { id: 'translate', icon: '🌐', title: 'Traductor IA', subtitle: 'Tiempo real', color: '#6366f1', route: '/(guide)/(tabs)/translate' },
        { id: 'map', icon: '📍', title: 'Mapa en Vivo', subtitle: 'Mi ubicación', color: '#10b981', route: '/(guide)/live-tracking' },
        { id: 'group', icon: '👥', title: 'Mi Grupo', subtitle: 'Turistas', color: '#f59e0b', route: '/(guide)/group' },
        { id: 'report', icon: '📊', title: 'Reportes', subtitle: 'Mis tours', color: '#3b82f6', route: '/(guide)/report' },
    ];

    // Load user data and tours
    const loadData = useCallback(async () => {
        try {
            // Fetch guide's tours from backend
            const toursResponse = await httpClient.get<{ items: any[] }>('/tours/assigned');

            if (toursResponse.data?.items) {
                const tours = toursResponse.data.items;

                // Map to UI model
                const mappedTours: Tour[] = tours.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    date: new Date(t.created_at).toLocaleDateString(),
                    time: '09:00',
                    guests_count: t.max_participants,
                    meeting_point: t.meeting_point || 'Plaza de Armas',
                    status: t.status === 'published' ? 'scheduled' : t.status
                }));

                // Find next tour (first scheduled one)
                const scheduled = mappedTours.filter(t => t.status === 'scheduled');
                if (scheduled.length > 0) {
                    setNextTour(scheduled[0]);
                    setUpcomingTours(scheduled.slice(1, 4));
                } else {
                    setNextTour(null);
                    setUpcomingTours([]);
                }
            }

            // Fetch guide stats
            const statsResponse = await httpClient.get<GuideStats>('/guides/me/stats');
            if (statsResponse.data) {
                setStats(statsResponse.data);
            }
        } catch (error) {
            console.log('Error loading guide data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        startTracking();

        return () => {
            liveTrackingService.stopTracking();
        };
    }, [loadData]);

    // Start location tracking
    const startTracking = async () => {
        try {
            await liveTrackingService.startTracking({
                userName: user?.full_name || 'Guía',
                userType: 'guide',
                intervalMs: 10000,
            });
            setIsTracking(true);
        } catch (e) {
            console.log('Tracking not started:', e);
        }
    };

    // Handle SOS activation
    const handleSOS = async () => {
        try {
            // Send SOS via store (handles both WebSocket and HTTP)
            await sendSOS('Emergencia activada por guía desde dashboard');

            // Navigate to emergency screen
            router.push({
                pathname: '/(guide)/active-route',
                params: { sos: 'true' },
            });

            Alert.alert(
                '🆘 SOS Activado',
                'Alerta enviada a la central. Mantente en línea.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('SOS Error:', error);
            Alert.alert('Error', 'No se pudo enviar la alerta. Intenta llamar al 105.');
        }
    };

    // Handle action press
    const handleActionPress = (route: string) => {
        router.push(route as any);
    };

    // Start tour
    const handleStartTour = async () => {
        if (!nextTour) return;

        try {
            // Update tour status in backend
            await httpClient.post(`/tours/${nextTour.id}/start`, {});

            // Start live tracking for this tour
            await liveTrackingService.startTracking({
                userName: user?.full_name || 'Guía',
                userType: 'guide',
                tourId: nextTour.id,
                intervalMs: 10000,
            });

            // Navigate to live tracking
            router.push({
                pathname: '/(guide)/live-tracking',
                params: { tour_id: nextTour.id },
            });
        } catch (error) {
            console.log('Start tour error:', error);
            router.push('/(guide)/live-tracking');
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Cargando...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.avatar, user?.is_verified && styles.avatarVerified]}>
                            <Text style={styles.avatarText}>
                                {user?.full_name?.charAt(0) || 'G'}
                            </Text>
                            {user?.is_verified && (
                                <View style={styles.verifiedBadge}>
                                    <Text style={styles.verifiedIcon}>✓</Text>
                                </View>
                            )}
                        </View>
                        <View>
                            <Text style={styles.welcomeText}>Buen día</Text>
                            <Text style={styles.userName}>{user?.full_name || 'Guía'}</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        {isTracking && (
                            <View style={styles.trackingIndicator}>
                                <View style={styles.trackingDot} />
                                <Text style={styles.trackingText}>LIVE</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.notificationBtn}
                            onPress={() => router.push('/(guide)/notifications')}
                        >
                            <Text style={styles.notificationIcon}>🔔</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Row */}
                {stats && (
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.total_tours}</Text>
                            <Text style={styles.statLabel}>Tours</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.total_tourists}</Text>
                            <Text style={styles.statLabel}>Turistas</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>⭐ {stats.rating}</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>S/{stats.earnings_this_month}</Text>
                            <Text style={styles.statLabel}>Este mes</Text>
                        </View>
                    </View>
                )}

                {/* Next Tour Card */}
                {nextTour && (
                    <View style={styles.nextTourSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Próximo Tour</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>Próximo</Text>
                            </View>
                        </View>
                        <View style={styles.nextTourCard}>
                            <View style={styles.tourImageContainer}>
                                <View style={styles.tourImage}>
                                    <Text style={styles.tourImagePlaceholder}>🏛️</Text>
                                </View>
                            </View>
                            <View style={styles.tourContent}>
                                <View style={styles.tourHeader}>
                                    <Text style={styles.tourTitle}>{nextTour.name}</Text>
                                    <View style={styles.tourTimeBadge}>
                                        <Text style={styles.tourTimeLabel}>{nextTour.date}</Text>
                                        <Text style={styles.tourTimeValue}>{nextTour.time}</Text>
                                    </View>
                                </View>
                                <View style={styles.tourMeta}>
                                    <View style={styles.tourMetaItem}>
                                        <Text style={styles.tourMetaIcon}>📍</Text>
                                        <Text style={styles.tourMetaText}>{nextTour.meeting_point}</Text>
                                    </View>
                                    <View style={styles.tourMetaItem}>
                                        <Text style={styles.tourMetaIcon}>👥</Text>
                                        <Text style={styles.tourMetaText}>{nextTour.guests_count} Turistas</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.startTourButton}
                                    onPress={handleStartTour}
                                >
                                    <Text style={styles.startTourButtonText}>🚀 Iniciar Tour</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
                    <View style={styles.actionsGrid}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={styles.actionCard}
                                activeOpacity={0.8}
                                onPress={() => handleActionPress(action.route)}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                                    <Text style={styles.actionEmoji}>{action.icon}</Text>
                                </View>
                                <Text style={styles.actionTitle}>{action.title}</Text>
                                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Upcoming Tours */}
                {upcomingTours.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Esta Semana</Text>
                            <TouchableOpacity onPress={() => router.push('/(guide)/(tabs)/tours')}>
                                <Text style={styles.viewAllText}>Ver Todos</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.toursList}>
                            {upcomingTours.map((tour) => (
                                <TouchableOpacity key={tour.id} style={styles.tourItem}>
                                    <View style={styles.tourItemImage}>
                                        <Text style={styles.tourItemPlaceholder}>🌄</Text>
                                    </View>
                                    <View style={styles.tourItemContent}>
                                        <Text style={styles.tourItemTitle}>{tour.name}</Text>
                                        <Text style={styles.tourItemDate}>{tour.date} • {tour.time}</Text>
                                        <View style={styles.tourItemGuests}>
                                            <Text style={styles.guestIcon}>👤</Text>
                                            <Text style={styles.guestCount}>{tour.guests_count} Turistas</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.chevron}>›</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <View style={{ height: 160 }} />
            </ScrollView>

            {/* SOS Button */}
            <SOSButton onActivate={handleSOS} text="Desliza para Emergencia" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: Colors.textSecondary },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarVerified: { borderWidth: 3, borderColor: '#10b981' },
    avatarText: { color: Colors.textLight, fontWeight: '700', fontSize: 20 },
    verifiedBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
    verifiedIcon: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    welcomeText: { fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
    userName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    trackingIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b98115', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    trackingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
    trackingText: { fontSize: 10, fontWeight: 'bold', color: '#10b981' },
    notificationBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
    notificationIcon: { fontSize: 22 },

    statsRow: { flexDirection: 'row', backgroundColor: Colors.surfaceLight, marginHorizontal: Spacing.md, borderRadius: BorderRadius.xl, padding: Spacing.md, ...Shadows.sm },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },

    nextTourSection: { padding: Spacing.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    statusBadge: { backgroundColor: '#10b98115', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.md },
    statusText: { fontSize: 11, fontWeight: '700', color: '#10b981', textTransform: 'uppercase' },

    nextTourCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', backgroundColor: Colors.surfaceLight, ...Shadows.md },
    tourImageContainer: { height: 120, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    tourImage: { height: '100%', justifyContent: 'center', alignItems: 'center' },
    tourImagePlaceholder: { fontSize: 56 },
    tourContent: { padding: Spacing.md },
    tourHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
    tourTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
    tourTimeBadge: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.md, alignItems: 'center' },
    tourTimeLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },
    tourTimeValue: { fontSize: 16, fontWeight: '700', color: '#fff' },
    tourMeta: { gap: 8, marginBottom: Spacing.md },
    tourMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tourMetaIcon: { fontSize: 16 },
    tourMetaText: { fontSize: 14, color: Colors.textSecondary },
    startTourButton: { backgroundColor: '#10b981', paddingVertical: 14, borderRadius: BorderRadius.lg, alignItems: 'center' },
    startTourButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },

    section: { padding: Spacing.md },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    actionCard: { width: '48%', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.xl, ...Shadows.sm },
    actionIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
    actionEmoji: { fontSize: 24 },
    actionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
    actionSubtitle: { fontSize: 12, color: Colors.textSecondary },

    viewAllText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
    toursList: { gap: Spacing.sm },
    tourItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.sm, borderRadius: BorderRadius.xl, gap: Spacing.sm, ...Shadows.sm },
    tourItemImage: { width: 60, height: 60, borderRadius: BorderRadius.lg, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
    tourItemPlaceholder: { fontSize: 28 },
    tourItemContent: { flex: 1 },
    tourItemTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
    tourItemDate: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    tourItemGuests: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    guestIcon: { fontSize: 12 },
    guestCount: { fontSize: 12, color: Colors.textSecondary },
    chevron: { fontSize: 24, color: Colors.textSecondary },
});
