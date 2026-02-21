/**
 * Ruta Segura Perú - Guide Earnings Screen
 * Shows earnings summary, payment history, and commission breakdown
 */
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/src/constants/theme';
import { httpClient } from '@/src/core/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EarningsSummary {
    total_earnings: number;
    this_month: number;
    last_month: number;
    pending_payments: number;
    completed_tours: number;
}

interface PaymentRecord {
    id: string;
    tour_name: string;
    amount: number;
    commission: number;
    net_amount: number;
    status: 'completed' | 'pending' | 'processing';
    date: string;
    tourists_count: number;
}

type TimePeriod = 'week' | 'month' | 'year';

export default function EarningsScreen() {
    const [summary, setSummary] = useState<EarningsSummary | null>(null);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');

    const loadEarnings = useCallback(async () => {
        try {
            // Load earnings summary
            const [summaryRes, paymentsRes] = await Promise.allSettled([
                httpClient.get<any>('/payments/my/summary'),
                httpClient.get<{ items: any[] }>(`/payments/my?period=${selectedPeriod}`),
            ]);

            if (summaryRes.status === 'fulfilled' && summaryRes.value.data) {
                setSummary(summaryRes.value.data);
            } else {
                // Fallback: calculate from guide stats
                const statsRes = await httpClient.get<any>('/guides/me/stats');
                if (statsRes.data) {
                    setSummary({
                        total_earnings: statsRes.data.earnings_this_month || 0,
                        this_month: statsRes.data.earnings_this_month || 0,
                        last_month: 0,
                        pending_payments: 0,
                        completed_tours: statsRes.data.total_tours || 0,
                    });
                }
            }

            if (paymentsRes.status === 'fulfilled' && paymentsRes.value.data?.items) {
                setPayments(paymentsRes.value.data.items.map((p: any) => ({
                    id: p.id,
                    tour_name: p.tour_name || p.description || 'Tour',
                    amount: p.amount || 0,
                    commission: p.commission || p.amount * 0.1,
                    net_amount: p.net_amount || p.amount * 0.9,
                    status: p.status || 'completed',
                    date: p.created_at ? new Date(p.created_at).toLocaleDateString('es-PE') : 'N/A',
                    tourists_count: p.tourists_count || 0,
                })));
            }
        } catch (error) {
            console.error('Error loading earnings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        setLoading(true);
        loadEarnings();
    }, [loadEarnings]);

    const onRefresh = () => {
        setRefreshing(true);
        loadEarnings();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#10b981';
            case 'pending': return '#f59e0b';
            case 'processing': return '#3b82f6';
            default: return Colors.textSecondary;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Completado';
            case 'pending': return 'Pendiente';
            case 'processing': return 'Procesando';
            default: return status;
        }
    };

    const renderPayment = ({ item }: { item: PaymentRecord }) => (
        <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
                <View style={styles.paymentIcon}>
                    <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTourName} numberOfLines={1}>{item.tour_name}</Text>
                    <Text style={styles.paymentDate}>📅 {item.date} • 👥 {item.tourists_count}</Text>
                </View>
                <View style={styles.paymentAmountContainer}>
                    <Text style={styles.paymentAmount}>S/{item.net_amount.toFixed(2)}</Text>
                    <View style={[styles.paymentStatus, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                        <Text style={[styles.statusLabel, { color: getStatusColor(item.status) }]}>
                            {getStatusLabel(item.status)}
                        </Text>
                    </View>
                </View>
            </View>
            {item.commission > 0 && (
                <View style={styles.commissionRow}>
                    <Text style={styles.commissionText}>
                        Monto bruto: S/{item.amount.toFixed(2)} • Comisión: S/{item.commission.toFixed(2)}
                    </Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Cargando ganancias...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mis Ganancias</Text>
                <View style={{ width: 44 }} />
            </View>

            <FlatList
                data={payments}
                keyExtractor={(item) => item.id}
                renderItem={renderPayment}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <>
                        {/* Earnings Summary Card */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Ganancias este mes</Text>
                            <Text style={styles.summaryAmount}>
                                S/{(summary?.this_month || 0).toFixed(2)}
                            </Text>
                            <View style={styles.summaryStats}>
                                <View style={styles.summaryStatItem}>
                                    <Ionicons name="trending-up" size={16} color="#10b981" />
                                    <Text style={styles.summaryStatText}>
                                        Total: S/{(summary?.total_earnings || 0).toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.summaryStatItem}>
                                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                                    <Text style={styles.summaryStatText}>
                                        {summary?.completed_tours || 0} tours
                                    </Text>
                                </View>
                            </View>
                            {(summary?.pending_payments || 0) > 0 && (
                                <View style={styles.pendingBanner}>
                                    <Ionicons name="time-outline" size={16} color="#f59e0b" />
                                    <Text style={styles.pendingText}>
                                        S/{(summary?.pending_payments || 0).toFixed(2)} pendiente de pago
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Period Selector */}
                        <View style={styles.periodSelector}>
                            {(['week', 'month', 'year'] as TimePeriod[]).map((period) => (
                                <TouchableOpacity
                                    key={period}
                                    style={[styles.periodButton, selectedPeriod === period && styles.periodActive]}
                                    onPress={() => setSelectedPeriod(period)}
                                >
                                    <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                                        {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.sectionTitle}>Historial de Pagos</Text>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>💰</Text>
                        <Text style={styles.emptyTitle}>Sin pagos registrados</Text>
                        <Text style={styles.emptyText}>
                            Tus ganancias aparecerán aquí cuando completes tours
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: Colors.textSecondary },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    backButton: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center', justifyContent: 'center',
        ...Shadows.sm,
    },
    headerTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },

    listContent: { padding: Spacing.md, paddingBottom: 100 },

    // Summary Card
    summaryCard: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.md,
    },
    summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
    summaryAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginVertical: 8 },
    summaryStats: { flexDirection: 'row', gap: 16 },
    summaryStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    summaryStatText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
    pendingBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: BorderRadius.md, marginTop: 12,
    },
    pendingText: { color: '#fbbf24', fontSize: 13, fontWeight: '600' },

    // Period Selector
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.lg,
        padding: 4,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    periodButton: {
        flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    periodActive: { backgroundColor: Colors.primary },
    periodText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
    periodTextActive: { color: '#fff' },

    sectionTitle: {
        fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary, marginBottom: Spacing.sm,
    },

    // Payment Cards
    paymentCard: {
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    paymentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    paymentIcon: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: 'rgba(17, 82, 212, 0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    paymentInfo: { flex: 1 },
    paymentTourName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
    paymentDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    paymentAmountContainer: { alignItems: 'flex-end' },
    paymentAmount: { fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary },
    paymentStatus: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusLabel: { fontSize: 10, fontWeight: '600' },
    commissionRow: {
        marginTop: 8, paddingTop: 8,
        borderTopWidth: 1, borderTopColor: Colors.borderLight,
    },
    commissionText: { fontSize: 11, color: Colors.textSecondary },

    // Empty State
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
    emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
});
