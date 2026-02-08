// Ruta Segura Perú - Active Route Mode Screen
import { SOSButton } from '@/src/components/common';
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { httpClient } from '@/src/core/api';
import { useEmergencyStore } from '@/src/features/emergency';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ActiveRouteMode() {
    const { tour_id } = useLocalSearchParams();
    const [elapsedTime, setElapsedTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tour, setTour] = useState<any>(null);
    const [tourists, setTourists] = useState<any[]>([]);
    const { sendSOS } = useEmergencyStore();

    useEffect(() => {
        const timer = setInterval(() => setElapsedTime(t => t + 1), 1000);
        loadActiveTour();
        return () => clearInterval(timer);
    }, []);

    const loadActiveTour = async () => {
        try {
            const id = tour_id || 'current';
            const response = await httpClient.get<any>(`/tours/${id}`);

            if (response.data) {
                const t = response.data;
                const activeTour = {
                    id: t.id || id,
                    name: t.name || 'Tour en Curso',
                    tourists_count: t.max_participants || 0,
                    current_stop: t.meeting_point || 'En ruta',
                    next_stop: 'Siguiente parada',
                    status: t.status || 'in_progress',
                    participants: [] as any[],
                };

                // Load bookings/participants
                const bookingsResp = await httpClient.get<{ items: any[] }>(`/tours/${id}/bookings`);
                if (bookingsResp.data?.items) {
                    activeTour.participants = bookingsResp.data.items.map((b: any) => ({
                        id: b.user_id || b.id,
                        name: b.contact_name || b.user_name || 'Tourist',
                        status: 'ok' as const,
                        avatar: (b.contact_name || b.user_name || 'T')[0],
                    }));
                    activeTour.tourists_count = activeTour.participants.length;
                }

                setTour(activeTour);
                setTourists(activeTour.participants);
            } else {
                throw new Error('Tour not found');
            }
        } catch (error) {
            console.error('Error loading tour:', error);
            Alert.alert('Error', 'No se pudo cargar el tour activo');
        } finally {
            setLoading(false);
        }
    };

    const handleSOS = async () => {
        try {
            await sendSOS('Emergencia activada por guía durante tour activo');

            Alert.alert(
                '🚨 SOS ENVIADO',
                'El centro de control ha sido notificado. Se ha compartido tu ubicación en tiempo real.',
                [{ text: 'Entendido' }]
            );
        } catch (error) {
            Alert.alert('Error', 'Fallo al activar SOS. Intenta llamar al 105.');
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>TOUR ACTIVO</Text>
                </View>
                <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Tour Info */}
                <View style={styles.tourCard}>
                    <Text style={styles.tourName}>{tour?.name || 'Tour en Curso'}</Text>
                    <View style={styles.tourStats}>
                        <View style={styles.tourStat}>
                            <Text style={styles.statValue}>{tour?.tourists_count || 0}</Text>
                            <Text style={styles.statLabel}>Turistas</Text>
                        </View>
                        <View style={styles.tourStat}>
                            <Text style={styles.statValue}>En Ruta</Text>
                            <Text style={styles.statLabel}>Estado</Text>
                        </View>
                    </View>
                </View>

                {/* Progress */}
                <View style={styles.progressCard}>
                    <View style={styles.progressLabels}>
                        <Text style={styles.progressLabel}>📍 Actual: {tour?.current_stop}</Text>
                        <Text style={[styles.progressLabel, styles.labelNext]}>🔜 Siguiente: {tour?.next_stop}</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(guide)/group')}>
                        <Text style={styles.actionIcon}>👥</Text>
                        <Text style={styles.actionText}>Grupo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(guide)/(tabs)/translate')}>
                        <Text style={styles.actionIcon}>🌐</Text>
                        <Text style={styles.actionText}>Traducir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(guide)/live-tracking')}>
                        <Text style={styles.actionIcon}>🗺️</Text>
                        <Text style={styles.actionText}>Mapa</Text>
                    </TouchableOpacity>
                </View>

                {/* Tourist Status */}
                <Text style={styles.sectionTitle}>Estado del Grupo</Text>
                <View style={styles.touristList}>
                    {tourists.map((t) => (
                        <View key={t.id} style={styles.touristItem}>
                            <View style={[styles.touristAvatar, t.status === 'warning' && { backgroundColor: Colors.warning }]}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{t.avatar}</Text>
                            </View>
                            <Text style={styles.touristName}>{t.name}</Text>
                            <View style={[styles.statusDot, t.status === 'warning' && styles.statusWarning]} />
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.endTourButton} onPress={() => router.push('/(guide)/report')}>
                    <Text style={styles.endTourText}>Finalizar Tour</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <SOSButton onActivate={handleSOS} text="Desliza SOS" />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.success },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'white' },
    liveText: { fontSize: 12, fontWeight: 'bold', color: 'white', letterSpacing: 1 },
    timer: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    content: { padding: Spacing.md, paddingBottom: 100 },
    tourCard: { backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 16, marginBottom: Spacing.md, ...Shadows.sm },
    tourName: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm },
    tourStats: { flexDirection: 'row', gap: Spacing.lg },
    tourStat: { alignItems: 'center', marginRight: 20 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
    statLabel: { fontSize: 12, color: Colors.textSecondary },
    progressCard: { backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 16, marginBottom: Spacing.md },
    progressLabels: { gap: 8 },
    progressLabel: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
    labelNext: { color: Colors.primary },
    actionsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    actionButton: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, backgroundColor: Colors.surfaceLight, borderRadius: 12, ...Shadows.sm },
    actionIcon: { fontSize: 24, marginBottom: 4 },
    actionText: { fontSize: 12, color: Colors.textSecondary },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm },
    touristList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    touristItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, gap: 8, ...Shadows.sm },
    touristAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    touristName: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
    statusWarning: { backgroundColor: Colors.warning },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: Spacing.md, gap: Spacing.md, backgroundColor: Colors.surfaceLight, borderTopWidth: 1, borderTopColor: Colors.borderLight, alignItems: 'center' },
    endTourButton: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surfaceLight, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
    endTourText: { fontSize: 14, fontWeight: 'bold', color: Colors.textPrimary },
});
