/**
 * Ruta Segura Perú - Tourist Review Screen
 * Submit reviews for completed tours with rating and comments
 */
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/src/constants/theme';
import { httpClient } from '@/src/core/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TourInfo {
    id: string;
    name: string;
    guide_name?: string;
    date?: string;
}

export default function ReviewScreen() {
    const { tour_id, tour_name, guide_name } = useLocalSearchParams<{
        tour_id: string;
        tour_name?: string;
        guide_name?: string;
    }>();

    const [tourInfo, setTourInfo] = useState<TourInfo | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [guideRating, setGuideRating] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Aspect ratings
    const [aspects, setAspects] = useState({
        safety: 0,
        value: 0,
        experience: 0,
    });

    useEffect(() => {
        loadTourInfo();
    }, []);

    const loadTourInfo = async () => {
        try {
            if (tour_id) {
                const response = await httpClient.get<any>(`/tours/${tour_id}`);
                if (response.data) {
                    setTourInfo({
                        id: tour_id,
                        name: response.data.name || tour_name || 'Tour',
                        guide_name: response.data.guide_name || guide_name,
                        date: response.data.created_at
                            ? new Date(response.data.created_at).toLocaleDateString('es-PE')
                            : undefined,
                    });
                }
            } else {
                setTourInfo({
                    id: tour_id || '',
                    name: tour_name || 'Tour',
                    guide_name: guide_name,
                });
            }
        } catch (error) {
            setTourInfo({
                id: tour_id || '',
                name: tour_name || 'Tour',
                guide_name: guide_name,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Calificación requerida', 'Por favor selecciona una calificación general');
            return;
        }

        setSubmitting(true);
        try {
            await httpClient.post('/reviews', {
                tour_id: tour_id,
                rating: rating,
                comment: comment.trim() || undefined,
                guide_rating: guideRating || undefined,
                safety_rating: aspects.safety || undefined,
                value_rating: aspects.value || undefined,
                experience_rating: aspects.experience || undefined,
            });

            setSubmitted(true);
        } catch (error: any) {
            console.error('Error submitting review:', error);
            const message = error?.response?.data?.detail || 'No se pudo enviar la reseña';
            Alert.alert('Error', message);
        } finally {
            setSubmitting(false);
        }
    };

    const StarRow = ({
        value,
        onChange,
        size = 32,
        label
    }: {
        value: number;
        onChange: (v: number) => void;
        size?: number;
        label?: string;
    }) => (
        <View style={styles.starRowContainer}>
            {label && <Text style={styles.starLabel}>{label}</Text>}
            <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
                        <Ionicons
                            name={star <= value ? 'star' : 'star-outline'}
                            size={size}
                            color={star <= value ? '#fbbf24' : Colors.borderLight}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    // Success state
    if (submitted) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <View style={styles.successContainer}>
                    <Text style={styles.successIcon}>🎉</Text>
                    <Text style={styles.successTitle}>¡Gracias por tu reseña!</Text>
                    <Text style={styles.successText}>
                        Tu opinión ayuda a otros turistas a elegir los mejores tours
                    </Text>
                    <View style={styles.successStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                                key={star}
                                name={star <= rating ? 'star' : 'star-outline'}
                                size={28}
                                color={star <= rating ? '#fbbf24' : Colors.borderLight}
                            />
                        ))}
                    </View>
                    <TouchableOpacity
                        style={styles.successButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.successButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dejar Reseña</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Tour Info */}
                    <View style={styles.tourInfoCard}>
                        <View style={styles.tourIconContainer}>
                            <Text style={styles.tourEmoji}>🏛️</Text>
                        </View>
                        <View style={styles.tourDetails}>
                            <Text style={styles.tourName}>{tourInfo?.name}</Text>
                            {tourInfo?.guide_name && (
                                <Text style={styles.tourGuide}>Guía: {tourInfo.guide_name}</Text>
                            )}
                            {tourInfo?.date && (
                                <Text style={styles.tourDate}>📅 {tourInfo.date}</Text>
                            )}
                        </View>
                    </View>

                    {/* Overall Rating */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Calificación General *</Text>
                        <StarRow value={rating} onChange={setRating} size={40} />
                        <Text style={styles.ratingHint}>
                            {rating === 0 ? 'Toca las estrellas para calificar' :
                                rating <= 2 ? 'Mala experiencia' :
                                    rating === 3 ? 'Experiencia regular' :
                                        rating === 4 ? 'Buena experiencia' :
                                            '¡Excelente experiencia!'}
                        </Text>
                    </View>

                    {/* Guide Rating */}
                    {tourInfo?.guide_name && (
                        <View style={styles.section}>
                            <StarRow
                                value={guideRating}
                                onChange={setGuideRating}
                                size={28}
                                label={`Calificación del guía (${tourInfo.guide_name})`}
                            />
                        </View>
                    )}

                    {/* Aspect Ratings */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Aspectos del Tour</Text>
                        <StarRow value={aspects.safety} onChange={(v) => setAspects({ ...aspects, safety: v })} size={24} label="🛡️ Seguridad" />
                        <StarRow value={aspects.value} onChange={(v) => setAspects({ ...aspects, value: v })} size={24} label="💰 Relación calidad-precio" />
                        <StarRow value={aspects.experience} onChange={(v) => setAspects({ ...aspects, experience: v })} size={24} label="✨ Experiencia general" />
                    </View>

                    {/* Comment */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Comentario (opcional)</Text>
                        <TextInput
                            style={styles.commentInput}
                            multiline
                            numberOfLines={4}
                            placeholder="Cuéntanos sobre tu experiencia..."
                            placeholderTextColor={Colors.textSecondary}
                            value={comment}
                            onChangeText={setComment}
                            textAlignVertical="top"
                        />
                        <Text style={styles.charCount}>{comment.length}/500</Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, rating === 0 && styles.submitDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting || rating === 0}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>Enviar Reseña</Text>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    centered: { justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    backButton: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center', justifyContent: 'center', ...Shadows.sm,
    },
    headerTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },

    content: { padding: Spacing.md },

    // Tour Info
    tourInfoCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surfaceLight, padding: Spacing.md,
        borderRadius: BorderRadius.xl, marginBottom: Spacing.md,
        gap: 12, ...Shadows.sm,
    },
    tourIconContainer: {
        width: 56, height: 56, borderRadius: 16,
        backgroundColor: 'rgba(17, 82, 212, 0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    tourEmoji: { fontSize: 28 },
    tourDetails: { flex: 1 },
    tourName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
    tourGuide: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    tourDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

    // Sections
    section: {
        backgroundColor: Colors.surfaceLight, padding: Spacing.md,
        borderRadius: BorderRadius.xl, marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },

    // Stars
    starRowContainer: { marginBottom: 12 },
    starLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
    starRow: { flexDirection: 'row', gap: 8 },
    ratingHint: { fontSize: 13, color: Colors.primary, marginTop: 8, fontWeight: '500' },

    // Comment
    commentInput: {
        backgroundColor: Colors.backgroundLight, borderRadius: BorderRadius.lg,
        padding: 14, fontSize: 15, color: Colors.textPrimary,
        minHeight: 100, borderWidth: 1, borderColor: Colors.borderLight,
    },
    charCount: { textAlign: 'right', fontSize: 11, color: Colors.textSecondary, marginTop: 4 },

    // Submit
    submitButton: {
        backgroundColor: Colors.primary, paddingVertical: 16,
        borderRadius: BorderRadius.lg, alignItems: 'center',
        marginTop: Spacing.md, ...Shadows.md,
    },
    submitDisabled: { opacity: 0.5 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Success
    successContainer: { alignItems: 'center', paddingHorizontal: 40 },
    successIcon: { fontSize: 64, marginBottom: 16 },
    successTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
    successText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
    successStars: { flexDirection: 'row', gap: 4, marginBottom: 24 },
    successButton: {
        backgroundColor: Colors.primary, paddingHorizontal: 32,
        paddingVertical: 14, borderRadius: BorderRadius.lg,
    },
    successButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
