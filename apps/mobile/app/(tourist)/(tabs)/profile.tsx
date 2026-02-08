/**
 * Ruta Segura Perú - Tourist Profile Screen
 * Profile with bookings, reviews, settings, language change - with full i18n
 */
import { ProfileSkeleton } from '@/src/components/common/Skeleton';
import { BorderRadius, Colors, Shadows, Spacing } from '@/src/constants/theme';
import { httpClient } from '@/src/core/api';
import { SupportedLanguage, useLanguage } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserData {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    is_verified: boolean;
    created_at: string;
}

interface Booking {
    id: string;
    tour_name: string;
    date: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    total_amount: number;
}

interface Review {
    id: string;
    tour_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export default function ProfileScreen() {
    const { t, language, setLanguage, languages } = useLanguage();
    const [user, setUser] = useState<UserData | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'bookings' | 'reviews'>('bookings');
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            // Load user data from storage
            const userData = await AsyncStorage.getItem('user_data');
            if (userData) {
                setUser(JSON.parse(userData));
            }

            // Fetch bookings from backend
            const bookingsResponse = await httpClient.get<{ items: Booking[] }>('/bookings/my');
            if (bookingsResponse.data?.items) {
                setBookings(bookingsResponse.data.items);
            }

            // Fetch reviews from backend
            const reviewsResponse = await httpClient.get<{ items: Review[] }>('/reviews/my');
            if (reviewsResponse.data?.items) {
                setReviews(reviewsResponse.data.items);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            t.profile.logout,
            t.profile.logoutConfirm,
            [
                { text: t.common.cancel, style: 'cancel' },
                {
                    text: t.profile.logout,
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.multiRemove(['auth_token', 'user_data', 'user_role']);
                        router.replace('/');
                    },
                },
            ]
        );
    };

    const handleLanguageChange = async (lang: SupportedLanguage) => {
        await setLanguage(lang);
        setShowLanguagePicker(false);
    };

    const getStatusColor = (status: Booking['status']) => {
        switch (status) {
            case 'pending': return '#fbbf24';
            case 'confirmed': return '#10b981';
            case 'completed': return '#6b7280';
            case 'cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status: Booking['status']) => {
        const texts: Record<Booking['status'], string> = {
            pending: t.profile.pending,
            confirmed: t.profile.confirmed,
            completed: t.profile.completed,
            cancelled: t.profile.cancelled,
        };
        return texts[status] || status;
    };

    const renderBookingItem = ({ item }: { item: Booking }) => (
        <TouchableOpacity style={styles.bookingCard}>
            <View style={styles.bookingIcon}>
                <Text style={styles.bookingEmoji}>🎟️</Text>
            </View>
            <View style={styles.bookingInfo}>
                <Text style={styles.bookingTitle} numberOfLines={1}>{item.tour_name}</Text>
                <Text style={styles.bookingDate}>📅 {item.date}</Text>
            </View>
            <View style={styles.bookingRight}>
                <Text style={[styles.bookingStatus, { color: getStatusColor(item.status) }]}>
                    {getStatusText(item.status)}
                </Text>
                <Text style={styles.bookingPrice}>${item.total_amount}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderReviewItem = ({ item }: { item: Review }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <Text style={styles.reviewTour}>{item.tour_name}</Text>
                <View style={styles.reviewRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                            key={star}
                            name={star <= item.rating ? 'star' : 'star-outline'}
                            size={14}
                            color="#fbbf24"
                        />
                    ))}
                </View>
            </View>
            <Text style={styles.reviewComment}>{item.comment}</Text>
            <Text style={styles.reviewDate}>{item.created_at}</Text>
        </View>
    );

    const selectedLanguage = languages.find(l => l.code === language);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ProfileSkeleton />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t.profile.title}</Text>
                    <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/(tourist)/settings')}>
                        <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* User Info */}
                <View style={styles.userSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || '👤'}</Text>
                        {user?.is_verified && (
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark" size={10} color="#fff" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.userName}>{user?.full_name || 'Traveler'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <TouchableOpacity style={styles.editButton}>
                        <Ionicons name="create-outline" size={16} color={Colors.primary} />
                        <Text style={styles.editButtonText}>{t.profile.editProfile}</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{bookings.length}</Text>
                        <Text style={styles.statLabel}>{t.profile.myBookings}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{reviews.length}</Text>
                        <Text style={styles.statLabel}>{t.profile.myReviews}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{bookings.filter(b => b.status === 'completed').length}</Text>
                        <Text style={styles.statLabel}>{t.profile.tours}</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
                        onPress={() => setActiveTab('bookings')}
                    >
                        <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>
                            {t.profile.myBookings}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
                        onPress={() => setActiveTab('reviews')}
                    >
                        <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
                            {t.profile.myReviews}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.tabContent}>
                    {activeTab === 'bookings' ? (
                        bookings.length > 0 ? (
                            bookings.map((booking) => (
                                <View key={booking.id}>
                                    {renderBookingItem({ item: booking })}
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyEmoji}>📭</Text>
                                <Text style={styles.emptyText}>{t.common.noResults}</Text>
                            </View>
                        )
                    ) : (
                        reviews.length > 0 ? (
                            reviews.map((review) => (
                                <View key={review.id}>
                                    {renderReviewItem({ item: review })}
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyEmoji}>✍️</Text>
                                <Text style={styles.emptyText}>{t.common.noResults}</Text>
                            </View>
                        )
                    )}
                </View>

                {/* Settings Section */}
                <View style={styles.settingsSection}>
                    <Text style={styles.sectionTitle}>{t.profile.settings}</Text>

                    {/* Language */}
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setShowLanguagePicker(!showLanguagePicker)}
                    >
                        <View style={styles.settingLeft}>
                            <Ionicons name="language-outline" size={22} color={Colors.textSecondary} />
                            <Text style={styles.settingLabel}>{t.profile.language}</Text>
                        </View>
                        <View style={styles.settingRight}>
                            <Text style={styles.settingValue}>{selectedLanguage?.flag} {selectedLanguage?.nativeName}</Text>
                            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    {showLanguagePicker && (
                        <View style={styles.languageList}>
                            {languages.map((lang) => (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={[styles.languageItem, language === lang.code && styles.languageItemActive]}
                                    onPress={() => handleLanguageChange(lang.code)}
                                >
                                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                                    <Text style={styles.languageName}>{lang.nativeName}</Text>
                                    {language === lang.code && (
                                        <Ionicons name="checkmark" size={20} color="#10b981" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Notifications */}
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
                            <Text style={styles.settingLabel}>{t.profile.notifications}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Help */}
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="help-circle-outline" size={22} color={Colors.textSecondary} />
                            <Text style={styles.settingLabel}>{t.profile.help}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Logout */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                        <Text style={styles.logoutText}>{t.profile.logout}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
    settingsButton: { padding: 8 },

    userSection: { alignItems: 'center', paddingVertical: Spacing.lg },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    avatarText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
    verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.backgroundLight },
    userName: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 12 },
    userEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
    editButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 4 },
    editButtonText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },

    statsRow: { flexDirection: 'row', backgroundColor: Colors.surfaceLight, marginHorizontal: Spacing.md, borderRadius: BorderRadius.xl, padding: Spacing.md, ...Shadows.sm },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
    statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
    statDivider: { width: 1, backgroundColor: Colors.borderLight },

    tabs: { flexDirection: 'row', marginHorizontal: Spacing.md, marginTop: Spacing.lg, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, padding: 4 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: BorderRadius.md },
    tabActive: { backgroundColor: Colors.primary },
    tabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
    tabTextActive: { color: '#fff' },

    tabContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

    bookingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 12, ...Shadows.sm },
    bookingIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.1)', alignItems: 'center', justifyContent: 'center' },
    bookingEmoji: { fontSize: 24 },
    bookingInfo: { flex: 1, marginLeft: 12 },
    bookingTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    bookingDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    bookingRight: { alignItems: 'flex-end' },
    bookingStatus: { fontSize: 12, fontWeight: '600' },
    bookingPrice: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 4 },

    reviewCard: { backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 12, ...Shadows.sm },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    reviewTour: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
    reviewRating: { flexDirection: 'row', gap: 2 },
    reviewComment: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
    reviewDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 8 },

    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyEmoji: { fontSize: 48 },
    emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 12 },

    settingsSection: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 12 },

    settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 8 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingLabel: { fontSize: 15, color: Colors.textPrimary },
    settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    settingValue: { fontSize: 14, color: Colors.textSecondary },

    languageList: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, marginBottom: 8, overflow: 'hidden' },
    languageItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    languageItemActive: { backgroundColor: 'rgba(16,185,129,0.1)' },
    languageFlag: { fontSize: 24 },
    languageName: { fontSize: 14, color: Colors.textPrimary, flex: 1 },

    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.1)', padding: Spacing.md, borderRadius: BorderRadius.lg, marginTop: 8, gap: 8 },
    logoutText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
});
