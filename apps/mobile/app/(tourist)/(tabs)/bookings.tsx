/**
 * Ruta Segura Perú - Tourist Bookings List
 * Shows current and past bookings with guide assignment status
 */
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { Booking, bookingsService } from '@/src/services/bookings';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function BookingsScreen() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            const response = await bookingsService.getMyBookings();
            if (response && response.items) {
                // Map backend response to UI format if needed, or stick to interface
                // The backend returns snake_case, frontend interface matches it mostly
                setBookings(response.items);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            // Optionally set empty state or error state here
            setBookings([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePress = (booking: any) => {
        if (booking.guide_status === 'assigned_waiting_approval') {
            // Navigate to handshake screen
            router.push({
                pathname: '/(tourist)/bookings/handshake/[id]',
                params: {
                    id: booking.id,
                    guide_name: booking.guide_name,
                    tour_name: booking.tour_name
                }
            } as any);
        }
    };

    const StatusBadge = ({ status, guideStatus }: { status: string, guideStatus?: string }) => {
        if (guideStatus === 'assigned_waiting_approval') {
            return (
                <View style={[styles.badge, styles.badgeAction]}>
                    <Text style={[styles.badgeText, styles.badgeTextAction]}>🔔 Acción Requerida</Text>
                </View>
            );
        }

        switch (status) {
            case 'confirmed':
                return (
                    <View style={[styles.badge, styles.badgeSuccess]}>
                        <Text style={[styles.badgeText, styles.badgeTextSuccess]}>Confirmado</Text>
                    </View>
                );
            case 'completed':
                return (
                    <View style={[styles.badge, styles.badgeGray]}>
                        <Text style={[styles.badgeText, styles.badgeTextGray]}>Completado</Text>
                    </View>
                );
            default:
                return (
                    <View style={[styles.badge, styles.badgeWarning]}>
                        <Text style={[styles.badgeText, styles.badgeTextWarning]}>Pendiente</Text>
                    </View>
                );
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handlePress(item)}
            activeOpacity={0.9}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.date}>{item.date}</Text>
                <StatusBadge status={item.status} guideStatus={item.guide_status} />
            </View>

            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <Text style={{ fontSize: 24 }}>🏔️</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.tourName}>{item.tour_name}</Text>
                    <Text style={styles.price}>S/{item.amount}</Text>

                    {item.guide_name && (
                        <View style={styles.guideRow}>
                            <Ionicons name="person-circle-outline" size={16} color={Colors.textSecondary} />
                            <Text style={styles.guideName}>Guía: {item.guide_name}</Text>
                        </View>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.borderLight} />
            </View>

            {item.guide_status === 'assigned_waiting_approval' && (
                <View style={styles.actionFooter}>
                    <Text style={styles.actionText}>¡Se te ha asignado un guía! Toca para revisar.</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Mis Reservas</Text>
            </View>

            <FlatList
                data={bookings}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBookings(); }} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🎫</Text>
                        <Text style={styles.emptyText}>No tienes reservas activas</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: Spacing.md, backgroundColor: Colors.surfaceLight, ...Shadows.sm },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
    list: { padding: Spacing.md },
    card: { backgroundColor: Colors.surfaceLight, borderRadius: 16, marginBottom: 16, ...Shadows.sm, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    date: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
    iconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(17, 82, 212, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    info: { flex: 1 },
    tourName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
    price: { fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 4 },
    guideRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    guideName: { fontSize: 12, color: Colors.textSecondary },

    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    badgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
    badgeAction: { backgroundColor: 'rgba(17, 82, 212, 0.1)' },
    badgeGray: { backgroundColor: '#f3f4f6' },

    badgeText: { fontSize: 12, fontWeight: '600' },
    badgeTextSuccess: { color: '#10b981' },
    badgeTextWarning: { color: '#f59e0b' },
    badgeTextAction: { color: Colors.primary },
    badgeTextGray: { color: '#6b7280' },

    actionFooter: { backgroundColor: 'rgba(17, 82, 212, 0.05)', padding: Spacing.sm, alignItems: 'center' },
    actionText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyEmoji: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 16, color: Colors.textSecondary },
});
