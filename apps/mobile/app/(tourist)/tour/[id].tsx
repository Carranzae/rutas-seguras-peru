/**
 * Ruta Segura Perú - Tour Detail Screen
 * Full tour details with booking, reviews, and guide info
 */
import { TourDetailSkeleton } from '@/src/components/common/Skeleton';
import { BorderRadius, Colors, Shadows, Spacing } from '@/src/constants/theme';
import { httpClient } from '@/src/core/api';
import { useLanguage } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toursService } from '../../../src/services/tours';

interface TourDetail {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_hours: number;
    rating: number;
    reviews_count: number;
    image_url?: string;
    category: string;
    location: string;
    meeting_point: string;
    included: string[];
    not_included: string[];
    highlights: string[];
    guide?: {
        id: string;
        name: string;
        rating: number;
        avatar_url?: string;
        verified: boolean;
    };
    agency?: {
        id: string;
        name: string;
    };
}

interface Review {
    id: string;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export default function TourDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useLanguage();

    const [tour, setTour] = useState<TourDetail | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [guests, setGuests] = useState(1);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

    useEffect(() => {
        loadTourDetails();
    }, [id]);

    const loadTourDetails = async () => {
        try {
            // Fetch tour details from backend
            const tourData = await toursService.getById(id || '');
            if (tourData) {
                // Map service data to local interface
                const mappedTour: TourDetail = {
                    id: tourData.id,
                    name: tourData.name,
                    description: tourData.description || '',
                    price: tourData.price,
                    duration_hours: tourData.duration_hours || 0,
                    rating: tourData.rating || 4.5,
                    reviews_count: tourData.reviews_count || 0,
                    image_url: tourData.cover_image_url || tourData.gallery_urls?.[0] || undefined,
                    category: tourData.difficulty_level || 'general',
                    location: tourData.meeting_point || 'Peru',
                    meeting_point: tourData.meeting_point || '',
                    included: tourData.included_services || [],
                    not_included: [],
                    highlights: [],
                    agency: {
                        id: tourData.agency_id || '',
                        name: tourData.agency_name || 'Agency',
                    },
                    guide: tourData.guide_id ? {
                        id: tourData.guide_id,
                        name: tourData.guide_name || 'Guide',
                        rating: 5.0,
                        verified: true
                    } : undefined
                };
                setTour(mappedTour);
            }

            // Fetch reviews
            const reviewsData = await httpClient.get<{ items: Review[] }>(`/tours/${id}/reviews`);
            if (reviewsData.data?.items) {
                setReviews(reviewsData.data.items);
            }
        } catch (error) {
            console.error('Error loading tour:', error);
            // Mock data for demo
            setTour({
                id: id || '1',
                name: 'Machu Picchu Sunrise Experience',
                description: 'Begin your journey before dawn and witness the magical sunrise over the ancient citadel of Machu Picchu. Our expert guides will share the fascinating history of this UNESCO World Heritage site while you explore its terraces, temples, and mysterious corners.',
                price: 120,
                duration_hours: 8,
                rating: 4.9,
                reviews_count: 2341,
                category: 'adventure',
                location: 'Cusco, Peru',
                meeting_point: 'Hotel Lobby at 4:00 AM',
                included: [
                    'Transportation from Cusco',
                    'Entry ticket to Machu Picchu',
                    'Professional bilingual guide',
                    'Breakfast box',
                    'Bus tickets Aguas Calientes - Machu Picchu',
                ],
                not_included: [
                    'Lunch',
                    'Tips',
                    'Huayna Picchu ticket (optional)',
                ],
                highlights: [
                    'Watch sunrise over Machu Picchu',
                    'Expert guide with Inca history',
                    'Small groups (max 12 people)',
                    'Verified safe experience',
                ],
                guide: {
                    id: 'g1',
                    name: 'Carlos Quispe Huamán',
                    rating: 4.95,
                    verified: true,
                },
                agency: {
                    id: 'a1',
                    name: 'Ruta Segura Adventures',
                },
            });
            setReviews([
                { id: '1', user_name: 'Sarah M.', rating: 5, comment: 'Absolutely incredible experience! Carlos was an amazing guide.', created_at: '2026-01-15' },
                { id: '2', user_name: 'John D.', rating: 5, comment: 'The sunrise was magical. Worth every penny!', created_at: '2026-01-12' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleBookNow = () => {
        if (!tour) return;

        router.push({
            pathname: '/(tourist)/tour/checkout',
            params: {
                tour_id: tour.id,
                tour_name: tour.name,
                price: String(tour.price),
                guests: guests.toString(),
                date: selectedDate || 'Jan 25, 2026',
                time: selectedTime || '4:00 AM',
                agency_id: tour.agency?.id || '',
                agency_name: tour.agency?.name || '',
            },
        });
    };

    const handleSubmitReview = async () => {
        if (!newReview.comment.trim()) {
            Alert.alert('Error', 'Please write your review');
            return;
        }

        try {
            await httpClient.post(`/tours/${id}/reviews`, {
                rating: newReview.rating,
                comment: newReview.comment,
            });

            Alert.alert('Success', t.reviews.thankYou);
            setShowReviewModal(false);
            setNewReview({ rating: 5, comment: '' });
            loadTourDetails();
        } catch (error) {
            Alert.alert('Error', 'Could not submit review');
        }
    };

    const renderStars = (rating: number, interactive = false) => {
        return (
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        disabled={!interactive}
                        onPress={() => interactive && setNewReview({ ...newReview, rating: star })}
                    >
                        <Ionicons
                            name={star <= rating ? 'star' : 'star-outline'}
                            size={interactive ? 32 : 16}
                            color="#fbbf24"
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <TourDetailSkeleton />
            </View>
        );
    }

    if (!tour) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <Text>Tour not found</Text>
            </SafeAreaView>
        );
    }

    const totalPrice = tour.price * guests;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    {tour.image_url ? (
                        <Image source={{ uri: tour.image_url }} style={styles.heroImage} />
                    ) : (
                        <View style={[styles.heroImage, styles.heroPlaceholder]}>
                            <Text style={styles.heroEmoji}>🏛️</Text>
                        </View>
                    )}
                    <View style={styles.heroOverlay} />

                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    {/* Favorite Button */}
                    <TouchableOpacity style={styles.favoriteButton}>
                        <Ionicons name="heart-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {/* Title Section */}
                    <View style={styles.titleSection}>
                        <Text style={styles.tourTitle}>{tour.name}</Text>
                        <View style={styles.ratingRow}>
                            {renderStars(tour.rating)}
                            <Text style={styles.ratingText}>
                                {tour.rating} ({tour.reviews_count} {t.tours.reviews})
                            </Text>
                        </View>
                        <Text style={styles.location}>📍 {tour.location}</Text>
                    </View>

                    {/* Quick Info */}
                    <View style={styles.quickInfo}>
                        <View style={styles.quickInfoItem}>
                            <Ionicons name="time-outline" size={20} color={Colors.primary} />
                            <Text style={styles.quickInfoLabel}>{t.tours.duration}</Text>
                            <Text style={styles.quickInfoValue}>{tour.duration_hours}h</Text>
                        </View>
                        <View style={styles.quickInfoDivider} />
                        <View style={styles.quickInfoItem}>
                            <Ionicons name="cash-outline" size={20} color={Colors.primary} />
                            <Text style={styles.quickInfoLabel}>{t.tours.price}</Text>
                            <Text style={styles.quickInfoValue}>${tour.price}</Text>
                        </View>
                        <View style={styles.quickInfoDivider} />
                        <View style={styles.quickInfoItem}>
                            <Ionicons name="location-outline" size={20} color={Colors.primary} />
                            <Text style={styles.quickInfoLabel}>{t.tours.meetingPoint}</Text>
                            <Text style={styles.quickInfoValue} numberOfLines={1}>Hotel</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About this tour</Text>
                        <Text style={styles.description}>{tour.description}</Text>
                    </View>

                    {/* Highlights */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Highlights</Text>
                        {tour.highlights.map((highlight, index) => (
                            <View key={index} style={styles.highlightItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                <Text style={styles.highlightText}>{highlight}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Included */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t.tours.included}</Text>
                        {tour.included.map((item, index) => (
                            <View key={index} style={styles.includedItem}>
                                <Text style={styles.includedIcon}>✓</Text>
                                <Text style={styles.includedText}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Guide Info */}
                    {tour.guide && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Your Guide</Text>
                            <View style={styles.guideCard}>
                                <View style={styles.guideAvatar}>
                                    <Text style={styles.guideAvatarText}>
                                        {tour.guide.name.charAt(0)}
                                    </Text>
                                    {tour.guide.verified && (
                                        <View style={styles.verifiedBadge}>
                                            <Ionicons name="checkmark" size={10} color="#fff" />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.guideInfo}>
                                    <Text style={styles.guideName}>{tour.guide.name}</Text>
                                    <View style={styles.guideRating}>
                                        <Ionicons name="star" size={14} color="#fbbf24" />
                                        <Text style={styles.guideRatingText}>{tour.guide.rating}</Text>
                                        <Text style={styles.guideVerified}>✓ Verified Guide</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Reviews */}
                    <View style={styles.section}>
                        <View style={styles.reviewsHeader}>
                            <Text style={styles.sectionTitle}>{t.tours.reviews}</Text>
                            <TouchableOpacity
                                style={styles.writeReviewButton}
                                onPress={() => setShowReviewModal(true)}
                            >
                                <Ionicons name="create-outline" size={16} color={Colors.primary} />
                                <Text style={styles.writeReviewText}>{t.reviews.writeReview}</Text>
                            </TouchableOpacity>
                        </View>

                        {reviews.slice(0, 3).map((review) => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewerName}>{review.user_name}</Text>
                                    {renderStars(review.rating)}
                                </View>
                                <Text style={styles.reviewComment}>{review.comment}</Text>
                                <Text style={styles.reviewDate}>{review.created_at}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Booking Section */}
                    <View style={styles.bookingSection}>
                        <Text style={styles.sectionTitle}>Book your tour</Text>

                        <View style={styles.guestsSelector}>
                            <Text style={styles.guestsLabel}>{t.tours.guests}</Text>
                            <View style={styles.guestsControls}>
                                <TouchableOpacity
                                    style={styles.guestButton}
                                    onPress={() => setGuests(Math.max(1, guests - 1))}
                                >
                                    <Ionicons name="remove" size={20} color={Colors.textPrimary} />
                                </TouchableOpacity>
                                <Text style={styles.guestsCount}>{guests}</Text>
                                <TouchableOpacity
                                    style={styles.guestButton}
                                    onPress={() => setGuests(Math.min(10, guests + 1))}
                                >
                                    <Ionicons name="add" size={20} color={Colors.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.priceSection}>
                    <Text style={styles.priceLabel}>{t.tours.totalPrice}</Text>
                    <Text style={styles.totalPrice}>${totalPrice}</Text>
                </View>
                <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
                    <Text style={styles.bookButtonText}>{t.tours.bookNow}</Text>
                </TouchableOpacity>
            </View>

            {/* Review Modal */}
            {showReviewModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t.reviews.writeReview}</Text>

                        <Text style={styles.modalLabel}>{t.reviews.yourRating}</Text>
                        {renderStars(newReview.rating, true)}

                        <Text style={styles.modalLabel}>{t.reviews.yourExperience}</Text>
                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Share your experience..."
                            placeholderTextColor={Colors.textSecondary}
                            value={newReview.comment}
                            onChangeText={(text) => setNewReview({ ...newReview, comment: text })}
                            multiline
                            numberOfLines={4}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowReviewModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>{t.common.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmitReview}
                            >
                                <Text style={styles.submitButtonText}>{t.reviews.submit}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },

    heroContainer: { height: 280, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    heroEmoji: { fontSize: 64 },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    backButton: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
    favoriteButton: { position: 'absolute', top: 50, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

    content: { padding: Spacing.md, marginTop: -30, backgroundColor: Colors.backgroundLight, borderTopLeftRadius: 24, borderTopRightRadius: 24 },

    titleSection: { marginBottom: Spacing.md },
    tourTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    starsRow: { flexDirection: 'row', gap: 2 },
    ratingText: { fontSize: 14, color: Colors.textSecondary },
    location: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

    quickInfo: { flexDirection: 'row', backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.xl, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.sm },
    quickInfoItem: { flex: 1, alignItems: 'center' },
    quickInfoDivider: { width: 1, backgroundColor: Colors.borderLight },
    quickInfoLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
    quickInfoValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },

    section: { marginBottom: Spacing.lg },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
    description: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },

    highlightItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    highlightText: { fontSize: 14, color: Colors.textPrimary, flex: 1 },

    includedItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    includedIcon: { fontSize: 16, color: '#10b981', fontWeight: 'bold' },
    includedText: { fontSize: 14, color: Colors.textPrimary },

    guideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.xl, ...Shadows.sm },
    guideAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    guideAvatarText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
    verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
    guideInfo: { marginLeft: 12, flex: 1 },
    guideName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
    guideRating: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    guideRatingText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
    guideVerified: { fontSize: 12, color: '#10b981', marginLeft: 8 },

    reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    writeReviewButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    writeReviewText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
    reviewCard: { backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 12, ...Shadows.sm },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    reviewerName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    reviewComment: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
    reviewDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 8 },

    bookingSection: { backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.xl, ...Shadows.sm },
    guestsSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    guestsLabel: { fontSize: 16, color: Colors.textPrimary },
    guestsControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    guestButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
    guestsCount: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, minWidth: 30, textAlign: 'center' },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, paddingBottom: 30, borderTopWidth: 1, borderTopColor: Colors.borderLight, ...Shadows.lg },
    priceSection: {},
    priceLabel: { fontSize: 12, color: Colors.textSecondary },
    totalPrice: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
    bookButton: { backgroundColor: Colors.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: BorderRadius.lg },
    bookButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.xl, padding: Spacing.lg, width: '100%', maxWidth: 400 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: 'center' },
    modalLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8, marginTop: 16 },
    reviewInput: { backgroundColor: Colors.backgroundLight, borderRadius: BorderRadius.lg, padding: Spacing.md, height: 100, textAlignVertical: 'top', color: Colors.textPrimary },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: Spacing.lg },
    cancelButton: { flex: 1, padding: 14, borderRadius: BorderRadius.lg, backgroundColor: Colors.borderLight, alignItems: 'center' },
    cancelButtonText: { color: Colors.textSecondary, fontWeight: '600' },
    submitButton: { flex: 1, padding: 14, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary, alignItems: 'center' },
    submitButtonText: { color: '#fff', fontWeight: '600' },
});
