/**
 * Ruta Segura Perú - Guide Tour Detail & Confirmation
 * Guide views tour details, tourist info, and confirms assignment
 */
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { httpClient } from '@/src/core/api';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function GuideTourDetailScreen() {
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [tour, setTour] = useState<any>(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        loadTourDetails();
    }, [id]);

    const loadTourDetails = async () => {
        try {
            const response = await httpClient.get<any>(`/tours/${id}`);
            if (response.data) {
                const t = response.data;
                setTour({
                    id: t.id,
                    name: t.name || 'Tour',
                    date: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A',
                    time: '05:30 AM',
                    meeting_point: t.meeting_point || 'Por confirmar',
                    guests_count: t.max_participants || 0,
                    status: t.status || 'assigned',
                    tourists: [],
                    itinerary: [
                        { time: '05:30', activity: 'Recojo en Hotel' },
                        { time: '06:30', activity: 'Llegada a estación de tren' },
                        { time: '08:00', activity: 'Inicio de guiado en ciudadela' },
                        { time: '12:00', activity: 'Fin del tour' }
                    ]
                });

                // Load bookings for this tour to get tourists
                const bookingsResp = await httpClient.get<{ items: any[] }>(`/tours/${id}/bookings`);
                if (bookingsResp.data?.items) {
                    const tourists = bookingsResp.data.items.map((b: any) => ({
                        name: b.contact_name || b.user_name || 'Tourist',
                        phone: b.contact_phone || '',
                        email: b.contact_email,
                        notes: b.special_requests || 'Sin notas especiales',
                    }));
                    setTour((prev: any) => prev ? { ...prev, tourists, guests_count: tourists.length } : prev);
                }
            } else {
                throw new Error('Tour not found');
            }
        } catch (error) {
            console.error('Error loading tour:', error);
            Alert.alert('Error', 'No se pudo cargar la información del tour');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReception = async () => {
        setConfirming(true);
        try {
            // Mock API call to confirm assignment
            // await api.post(`/tours/${id}/confirm-assignment`);
            await new Promise(r => setTimeout(r, 1500));

            Alert.alert(
                '✅ Asignación Confirmada',
                'El turista ha sido notificado que estás listo para el tour.',
                [
                    { text: 'Ir al Dashboard', onPress: () => router.push('/(guide)/(tabs)/dashboard') }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'No se pudo confirmar la asignación');
        } finally {
            setConfirming(false);
        }
    };

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleWhatsApp = (phone: string) => {
        Linking.openURL(`whatsapp://send?phone=${phone.replace(/\D/g, '')}&text=Hola, soy tu guía de Ruta Segura.`);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    if (!tour) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle del Tour</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusRow}>
                        <View style={styles.statusIconBg}>
                            <Text style={{ fontSize: 24 }}>🔔</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.statusTitle}>Nueva Asignación</Text>
                            <Text style={styles.statusDesc}>Tienes un nuevo grupo asignado.</Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>PENDIENTE</Text>
                        </View>
                    </View>
                </View>

                {/* Tour Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información General</Text>
                    <View style={styles.card}>
                        <Text style={styles.tourName}>{tour.name}</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                            <Text style={styles.infoText}>{tour.date} • {tour.time}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
                            <Text style={styles.infoText}>{tour.meeting_point}</Text>
                        </View>
                    </View>
                </View>

                {/* Tourists List */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Turistas ({tour.tourists.length})</Text>
                        <Text style={styles.sectionSubtitle}>Grupo privado</Text>
                    </View>

                    {tour.tourists.map((tourist: any, index: number) => (
                        <View key={index} style={styles.touristCard}>
                            <View style={styles.touristHeader}>
                                <Image
                                    source={{ uri: tourist.image || 'https://ui-avatars.com/api/?name=' + tourist.name }}
                                    style={styles.avatar}
                                />
                                <View style={styles.touristInfo}>
                                    <Text style={styles.touristName}>{tourist.name}</Text>
                                    <Text style={styles.touristNotes}>{tourist.notes || 'Sin notas especiales'}</Text>
                                </View>
                            </View>
                            <View style={styles.touristActions}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.callBtn]}
                                    onPress={() => handleCall(tourist.phone)}
                                >
                                    <Ionicons name="call" size={18} color="white" />
                                    <Text style={styles.actionBtnText}>Llamar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.whatsappBtn]}
                                    onPress={() => handleWhatsApp(tourist.phone)}
                                >
                                    <Ionicons name="logo-whatsapp" size={18} color="white" />
                                    <Text style={styles.actionBtnText}>WhatsApp</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Itinerary Preview */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Itinerario</Text>
                    <View style={styles.timeline}>
                        {tour.itinerary.map((item: any, index: number) => (
                            <View key={index} style={styles.timelineItem}>
                                <View style={styles.timelineTime}>
                                    <Text style={styles.timeText}>{item.time}</Text>
                                </View>
                                <View style={styles.timelineLineContainer}>
                                    <View style={styles.timelineDot} />
                                    {index < tour.itinerary.length - 1 && <View style={styles.timelineLine} />}
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineActivity}>{item.activity}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.confirmButton, confirming && styles.disabledBtn]}
                    onPress={handleConfirmReception}
                    disabled={confirming}
                >
                    {confirming ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.confirmButtonText}>Confirmar Recepción</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surfaceLight },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: Colors.backgroundLight },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: Spacing.md, paddingBottom: 100 },

    statusCard: { backgroundColor: '#e0f2fe', padding: Spacing.md, borderRadius: 16, marginBottom: Spacing.lg, borderLeftWidth: 4, borderLeftColor: '#0ea5e9' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statusIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
    statusTitle: { fontWeight: 'bold', fontSize: 16, color: '#0369a1' },
    statusDesc: { fontSize: 13, color: '#075985' },
    statusBadge: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#0ea5e9' },

    section: { marginBottom: Spacing.xl },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Spacing.sm },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm },
    sectionSubtitle: { fontSize: 14, color: Colors.textSecondary },

    card: { backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: Spacing.md, ...Shadows.sm },
    tourName: { fontSize: 20, fontWeight: 'bold', marginBottom: Spacing.md, color: Colors.textPrimary },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    infoText: { fontSize: 16, color: Colors.textSecondary },

    touristCard: { backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: Spacing.md, marginBottom: 12, ...Shadows.sm },
    touristHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    touristInfo: { flex: 1 },
    touristName: { fontSize: 16, fontWeight: 'bold' },
    touristNotes: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    touristActions: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, gap: 8 },
    callBtn: { backgroundColor: Colors.primary },
    whatsappBtn: { backgroundColor: '#25D366' },
    actionBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },

    timeline: { paddingLeft: 8 },
    timelineItem: { flexDirection: 'row', minHeight: 60 },
    timelineTime: { width: 50, paddingTop: 2 },
    timeText: { fontSize: 12, fontWeight: 'bold', color: Colors.textSecondary },
    timelineLineContainer: { width: 20, alignItems: 'center' },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
    timelineLine: { flex: 1, width: 2, backgroundColor: Colors.borderLight, marginVertical: 4 },
    timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 24 },
    timelineActivity: { fontSize: 14, color: Colors.textPrimary },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, backgroundColor: Colors.surfaceLight, borderTopWidth: 1, borderTopColor: Colors.borderLight },
    confirmButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', ...Shadows.primary },
    disabledBtn: { opacity: 0.7 },
    confirmButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
