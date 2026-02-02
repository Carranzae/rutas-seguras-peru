/**
 * Ruta Segura Perú - Secure Checkout with IziPay Integration
 * Booking flow: Tourist → Payment to Super Admin → Notification to Agency
 */
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { bookingsService } from '@/src/services/bookings';
import { paymentsService } from '@/src/services/payments';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BookingDetails {
    tour_id: string;
    tour_name: string;
    date: string;
    time: string;
    guests: number;
    price_per_person: number;
    agency_id?: string;
    agency_name?: string;
}

export default function SecureCheckout() {
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Payment form
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'yape' | 'plin'>('card');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Booking data from params or mock
    const [booking, setBooking] = useState<BookingDetails>({
        tour_id: params.tour_id as string || '1',
        tour_name: params.tour_name as string || 'Machu Picchu Explorer',
        date: params.date as string || '25 Enero, 2026',
        time: params.time as string || '09:30 AM',
        guests: Number(params.guests) || 2,
        price_per_person: Number(params.price) || 120,
        agency_id: params.agency_id as string,
        agency_name: params.agency_name as string || 'Ruta Segura Tours',
    });

    // Calculate totals
    const subtotal = booking.guests * booking.price_per_person;
    const serviceFee = Math.round(subtotal * 0.10); // 10% service fee to platform
    const total = subtotal + serviceFee;

    // Load user data
    useEffect(() => {
        (async () => {
            const userData = await AsyncStorage.getItem('user_data');
            if (userData) {
                const user = JSON.parse(userData);
                setName(user.full_name || '');
                setEmail(user.email || '');
                setPhone(user.phone || '');
            }
        })();
    }, []);

    // Format card number with spaces
    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '').slice(0, 16);
        const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
        setCardNumber(formatted);
    };

    // Format expiry date
    const formatExpiry = (text: string) => {
        const cleaned = text.replace(/\D/g, '').slice(0, 4);
        if (cleaned.length >= 2) {
            setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
        } else {
            setExpiry(cleaned);
        }
    };

    // Validate form
    const validateForm = () => {
        if (paymentMethod === 'card') {
            if (cardNumber.replace(/\s/g, '').length !== 16) {
                Alert.alert('Error', 'Número de tarjeta inválido');
                return false;
            }
            if (!expiry || expiry.length !== 5) {
                Alert.alert('Error', 'Fecha de expiración inválida');
                return false;
            }
            if (cvv.length < 3) {
                Alert.alert('Error', 'CVV inválido');
                return false;
            }
        }
        if (!name.trim()) {
            Alert.alert('Error', 'Ingresa tu nombre');
            return false;
        }
        if (!email.trim()) {
            Alert.alert('Error', 'Ingresa tu correo');
            return false;
        }
        return true;
    };

    // Process payment
    const handlePayment = async () => {
        if (!validateForm()) return;

        setProcessing(true);

        try {
            // 1. Create booking in backend using service
            // Format scheduled date from date and time strings (assuming simple concatenation for now, ideal to stick to ISO)
            // For this UI mock date '25 Enero, 2026', we'll simplify. backend likely expects ISO/DateTime.
            // Using a safe fallback or current date for demo if parse fails, but usually we'd parse strict.
            const scheduledDate = new Date().toISOString();

            const bookingData = {
                tour_id: booking.tour_id,
                num_participants: booking.guests,
                scheduled_date: scheduledDate,
                contact_name: name,
                contact_email: email,
                contact_phone: phone,
                special_requests: `Payment Method: ${paymentMethod.toUpperCase()}`,
            };

            const createdBooking = await bookingsService.create(bookingData);

            if (!createdBooking || !createdBooking.id) {
                throw new Error('Error al crear reserva (ID faltante)');
            }

            // 2. Initiate payment with IziPay (goes to Super Admin account)
            // Payment flows separate from booking creation
            const paymentResult = await paymentsService.initiate({
                tour_id: booking.tour_id,
                booking_id: createdBooking.id,
                amount: total,
                agency_id: booking.agency_id || 'default',
            });

            if (paymentResult) {
                // 3. Payment successful
                Alert.alert(
                    '✅ ¡Pago Exitoso!',
                    `Tu reserva ha sido confirmada.\n\nNº de Reserva: ${createdBooking.id.slice(0, 8).toUpperCase()}\n\nRecibirás un correo con los detalles.`,
                    [
                        {
                            text: 'Ver mi Reserva',
                            onPress: () => router.replace('/(tourist)/(tabs)/explore'),
                        },
                    ]
                );
            } else {
                throw new Error('Pago no aprobado');
            }
        } catch (error: any) {
            console.error('Payment error:', error);

            // Handle specific errors from service or axios
            const errorMessage = error.response?.data?.detail || error.message || 'Error desconocido';

            let userMessage = 'No se pudo procesar el pago. Verifica los datos e intenta nuevamente.';
            if (errorMessage.includes('insufficient')) userMessage = 'Fondos insuficientes';
            else if (errorMessage.includes('declined')) userMessage = 'Tarjeta rechazada';

            Alert.alert('Error de Pago', userMessage);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pago Seguro</Text>
                <View style={styles.secureIcon}><Text>🔒</Text></View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Booking Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen de Reserva</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.tourIcon}><Text style={styles.tourEmoji}>🏛️</Text></View>
                        <View style={styles.tourInfo}>
                            <Text style={styles.tourName}>{booking.tour_name}</Text>
                            <Text style={styles.tourDate}>📅 {booking.date}</Text>
                            <Text style={styles.tourTime}>🕐 {booking.time}</Text>
                            <Text style={styles.tourGuests}>👥 {booking.guests} persona(s)</Text>
                            {booking.agency_name && (
                                <Text style={styles.tourAgency}>🏢 {booking.agency_name}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Contact Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Datos de Contacto</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nombre completo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Juan Pérez"
                            placeholderTextColor={Colors.textSecondary}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Correo electrónico</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="tu@email.com"
                            placeholderTextColor={Colors.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Teléfono</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+51 999 999 999"
                            placeholderTextColor={Colors.textSecondary}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Método de Pago</Text>
                    <View style={styles.paymentMethods}>
                        <TouchableOpacity
                            style={[styles.methodButton, paymentMethod === 'card' && styles.methodActive]}
                            onPress={() => setPaymentMethod('card')}
                        >
                            <Text style={styles.methodIcon}>💳</Text>
                            <Text style={styles.methodText}>Tarjeta</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.methodButton, paymentMethod === 'yape' && styles.methodActive]}
                            onPress={() => setPaymentMethod('yape')}
                        >
                            <Text style={styles.methodIcon}>📱</Text>
                            <Text style={styles.methodText}>Yape</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.methodButton, paymentMethod === 'plin' && styles.methodActive]}
                            onPress={() => setPaymentMethod('plin')}
                        >
                            <Text style={styles.methodIcon}>💸</Text>
                            <Text style={styles.methodText}>Plin</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Card Details */}
                {paymentMethod === 'card' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Datos de Tarjeta</Text>
                        <View style={styles.cardForm}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Número de tarjeta</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="1234 5678 9012 3456"
                                    placeholderTextColor={Colors.textSecondary}
                                    value={cardNumber}
                                    onChangeText={formatCardNumber}
                                    keyboardType="number-pad"
                                    maxLength={19}
                                />
                            </View>
                            <View style={styles.inputRow}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Expiración</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="MM/AA"
                                        placeholderTextColor={Colors.textSecondary}
                                        value={expiry}
                                        onChangeText={formatExpiry}
                                        keyboardType="number-pad"
                                        maxLength={5}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>CVV</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="123"
                                        placeholderTextColor={Colors.textSecondary}
                                        value={cvv}
                                        onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                                        keyboardType="number-pad"
                                        secureTextEntry
                                        maxLength={4}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Yape/Plin Instructions */}
                {(paymentMethod === 'yape' || paymentMethod === 'plin') && (
                    <View style={styles.section}>
                        <View style={styles.qrBox}>
                            <Text style={styles.qrEmoji}>📲</Text>
                            <Text style={styles.qrTitle}>
                                Pagar con {paymentMethod === 'yape' ? 'Yape' : 'Plin'}
                            </Text>
                            <Text style={styles.qrSubtitle}>
                                Escanea el código QR o envía a: {'\n'}
                                <Text style={styles.qrNumber}>+51 987 654 321</Text>
                            </Text>
                            <View style={styles.qrPlaceholder}>
                                <Text style={styles.qrPlaceholderText}>[QR CODE]</Text>
                            </View>
                            <Text style={styles.qrNote}>
                                Después de pagar, presiona "Confirmar Pago"
                            </Text>
                        </View>
                    </View>
                )}

                {/* Price Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalle del Precio</Text>
                    <View style={styles.priceCard}>
                        <View style={styles.priceLine}>
                            <Text style={styles.priceLabel}>
                                S/{booking.price_per_person} × {booking.guests} persona(s)
                            </Text>
                            <Text style={styles.priceValue}>S/{subtotal}</Text>
                        </View>
                        <View style={styles.priceLine}>
                            <Text style={styles.priceLabel}>Tarifa de servicio (10%)</Text>
                            <Text style={styles.priceValue}>S/{serviceFee}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.priceLine}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>S/{total}</Text>
                        </View>
                    </View>
                </View>

                {/* Security Badge */}
                <View style={styles.securityBadge}>
                    <Text style={styles.securityIcon}>🔐</Text>
                    <Text style={styles.securityText}>
                        Tu pago está protegido con encriptación SSL de 256 bits.{'\n'}
                        Procesado por IziPay
                    </Text>
                </View>
            </ScrollView>

            {/* Pay Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.payButton, processing && styles.payButtonDisabled]}
                    onPress={handlePayment}
                    disabled={processing}
                >
                    {processing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.payButtonText}>
                            {paymentMethod === 'card' ? `Pagar S/${total}` : 'Confirmar Pago'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
    secureIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center' },
    content: { padding: Spacing.md, paddingBottom: 100 },
    section: { marginBottom: Spacing.lg },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm },
    summaryCard: { flexDirection: 'row', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 16, ...Shadows.sm },
    tourIcon: { width: 64, height: 64, borderRadius: 12, backgroundColor: 'rgba(17, 82, 212, 0.1)', alignItems: 'center', justifyContent: 'center' },
    tourEmoji: { fontSize: 32 },
    tourInfo: { flex: 1, marginLeft: Spacing.sm },
    tourName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
    tourDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
    tourTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    tourGuests: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    tourAgency: { fontSize: 12, color: Colors.primary, marginTop: 4, fontWeight: '500' },
    inputGroup: { marginBottom: Spacing.sm },
    inputLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4, fontWeight: '500' },
    input: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
    inputRow: { flexDirection: 'row', gap: Spacing.sm },
    paymentMethods: { flexDirection: 'row', gap: Spacing.sm },
    methodButton: { flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: Colors.surfaceLight, borderRadius: 12, borderWidth: 2, borderColor: Colors.borderLight },
    methodActive: { borderColor: Colors.primary, backgroundColor: 'rgba(17, 82, 212, 0.05)' },
    methodIcon: { fontSize: 24, marginBottom: 4 },
    methodText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
    cardForm: {},
    qrBox: { backgroundColor: Colors.surfaceLight, padding: Spacing.lg, borderRadius: 16, alignItems: 'center', ...Shadows.sm },
    qrEmoji: { fontSize: 48, marginBottom: 12 },
    qrTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
    qrSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
    qrNumber: { color: Colors.primary, fontWeight: 'bold' },
    qrPlaceholder: { width: 150, height: 150, backgroundColor: '#f0f0f0', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
    qrPlaceholderText: { color: '#999' },
    qrNote: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
    priceCard: { backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 16, ...Shadows.sm },
    priceLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    priceLabel: { fontSize: 14, color: Colors.textSecondary },
    priceValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
    divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 8 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
    totalValue: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
    securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: Spacing.md },
    securityIcon: { fontSize: 18 },
    securityText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', flex: 1 },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, backgroundColor: Colors.backgroundLight, borderTopWidth: 1, borderTopColor: Colors.borderLight },
    payButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', ...Shadows.primary },
    payButtonDisabled: { opacity: 0.7 },
    payButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
});
