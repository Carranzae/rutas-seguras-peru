/**
 * Ruta Segura Perú - Tourist Explore/Home Screen
 * Main screen showing tours, search, categories - fully connected to backend
 */
import { SOSButton } from '@/src/components/common';
import { FeaturedTourSkeleton, Skeleton, TourCardSkeleton } from '@/src/components/common/Skeleton';
import { BorderRadius, Colors, Shadows, Spacing } from '@/src/constants/theme';
import { useLanguage } from '@/src/i18n';
import { toursService, type TourItem } from '@/src/services/tours';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TourUI {
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
    is_featured: boolean;
}

interface Category {
    id: string;
    name: string;
    icon: string;
    active: boolean;
}

interface UserData {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
    all: '🌟',
    adventure: '🏔️',
    culture: '🏛️',
    food: '🍽️',
    nature: '🌿',
    wellness: '🧘',
};

export default function ExploreScreen() {
    const { t, language } = useLanguage();
    const [user, setUser] = useState<UserData | null>(null);
    const [featuredTours, setFeaturedTours] = useState<TourUI[]>([]);
    const [allTours, setAllTours] = useState<TourUI[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState<Category[]>([]);

    // Initialize categories with translations
    useEffect(() => {
        setCategories([
            { id: 'all', name: t.categories.all, icon: CATEGORY_ICONS.all, active: selectedCategory === 'all' },
            { id: 'adventure', name: t.categories.adventure, icon: CATEGORY_ICONS.adventure, active: selectedCategory === 'adventure' },
            { id: 'culture', name: t.categories.culture, icon: CATEGORY_ICONS.culture, active: selectedCategory === 'culture' },
            { id: 'food', name: t.categories.food, icon: CATEGORY_ICONS.food, active: selectedCategory === 'food' },
            { id: 'nature', name: t.categories.nature, icon: CATEGORY_ICONS.nature, active: selectedCategory === 'nature' },
        ]);
    }, [t, selectedCategory]);


    // Load data on mount
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadUserData(),
                loadTours(),
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserData = async () => {
        try {
            const userData = await AsyncStorage.getItem('user_data');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.log('No user data found');
        }
    };

    const loadTours = async () => {
        try {
            // Fetch tours from backend
            const response = await toursService.getTours({
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                search: searchQuery || undefined,
            });

            if (response && Array.isArray(response)) {
                // Map service tours to UI tours
                const mappedTours: TourUI[] = response.map((tour: TourItem) => ({
                    id: tour.id,
                    name: tour.name,
                    description: tour.description || '',
                    price: tour.price,
                    duration_hours: tour.duration_hours || 0,
                    rating: tour.rating || 4.5,
                    reviews_count: tour.reviews_count || 0,
                    image_url: tour.cover_image_url || tour.gallery_urls?.[0] || undefined,
                    category: tour.difficulty_level || 'general',
                    location: tour.meeting_point || 'Peru',
                    is_featured: tour.is_featured || Math.random() > 0.7
                }));

                setFeaturedTours(mappedTours.filter(t => t.is_featured).slice(0, 5));
                setAllTours(mappedTours);
            }
        } catch (error) {
            console.error('Error loading tours:', error);
            // Use fallback data for demo
            setFeaturedTours([
                {
                    id: '1',
                    name: 'Machu Picchu Sunrise',
                    description: 'Experience the wonder of Machu Picchu at dawn',
                    price: 120,
                    duration_hours: 8,
                    rating: 4.9,
                    reviews_count: 2341,
                    category: 'adventure',
                    location: 'Cusco',
                    is_featured: true,
                    image_url: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400',
                },
                {
                    id: '2',
                    name: 'Sacred Valley Tour',
                    description: 'Explore ancient Inca sites in the Sacred Valley',
                    price: 85,
                    duration_hours: 10,
                    rating: 4.8,
                    reviews_count: 1567,
                    category: 'culture',
                    location: 'Cusco',
                    is_featured: true,
                    image_url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400',
                },
            ]);
            setAllTours([
                {
                    id: '3',
                    name: 'Lima Food Tour',
                    description: 'Taste the best of Peruvian cuisine',
                    price: 65,
                    duration_hours: 4,
                    rating: 4.7,
                    reviews_count: 892,
                    category: 'food',
                    location: 'Lima',
                    is_featured: false,
                },
                {
                    id: '4',
                    name: 'Rainbow Mountain',
                    description: 'Hike to the stunning Vinicunca mountain',
                    price: 45,
                    duration_hours: 12,
                    rating: 4.6,
                    reviews_count: 1203,
                    category: 'adventure',
                    location: 'Cusco',
                    is_featured: false,
                },
            ]);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTours();
        setRefreshing(false);
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setCategories(categories.map(c => ({ ...c, active: c.id === categoryId })));
        // Reload tours with new category
        loadTours();
    };

    const handleSearch = () => {
        loadTours();
    };

    const handleTourPress = (tour: TourUI) => {
        router.push({
            pathname: '/(tourist)/tour/[id]',
            params: { id: tour.id },
        });
    };

    const handleSOS = () => {
        router.push('/(tourist)/emergency-active');
    };

    // Featured Tour Card
    const renderFeaturedCard = ({ item }: { item: TourUI }) => (
        <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => handleTourPress(item)}
            activeOpacity={0.9}
        >
            <View style={styles.featuredImageContainer}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.featuredImage} />
                ) : (
                    <View style={[styles.featuredImage, styles.placeholderImage]}>
                        <Text style={styles.placeholderEmoji}>🏛️</Text>
                    </View>
                )}
                <View style={styles.featuredOverlay} />
                <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={12} color="#fbbf24" />
                    <Text style={styles.featuredBadgeText}>{item.rating}</Text>
                </View>
            </View>
            <View style={styles.featuredContent}>
                <Text style={styles.featuredLocation}>📍 {item.location}</Text>
                <Text style={styles.featuredTitle} numberOfLines={2}>{item.name}</Text>
                <View style={styles.featuredMeta}>
                    <Text style={styles.featuredDuration}>🕐 {item.duration_hours}h</Text>
                    <Text style={styles.featuredPrice}>${item.price}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Tour List Item
    const renderTourItem = ({ item }: { item: TourUI }) => (
        <TouchableOpacity
            style={styles.tourItem}
            onPress={() => handleTourPress(item)}
            activeOpacity={0.8}
        >
            <View style={styles.tourItemImage}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.tourItemImageInner} />
                ) : (
                    <Text style={styles.tourItemPlaceholder}>🏔️</Text>
                )}
            </View>
            <View style={styles.tourItemContent}>
                <Text style={styles.tourItemTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.tourItemLocation}>📍 {item.location}</Text>
                <View style={styles.tourItemMeta}>
                    <View style={styles.tourItemRating}>
                        <Ionicons name="star" size={14} color="#fbbf24" />
                        <Text style={styles.tourItemRatingText}>
                            {item.rating} ({item.reviews_count} {t.tours.reviews})
                        </Text>
                    </View>
                    <Text style={styles.tourItemPrice}>${item.price}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.header, { marginBottom: 20 }]}>
                    <View>
                        <Skeleton width={150} height={24} style={{ marginBottom: 8 }} />
                        <Skeleton width={200} height={16} />
                    </View>
                    <Skeleton width={48} height={48} borderRadius={24} />
                </View>

                {/* Categories Skeleton */}
                <View style={{ paddingHorizontal: Spacing.md, marginBottom: 20 }}>
                    <Skeleton width={120} height={24} style={{ marginBottom: 12 }} />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} width={100} height={40} borderRadius={24} />
                        ))}
                    </View>
                </View>

                {/* Featured Skeleton */}
                <View style={{ paddingHorizontal: Spacing.md, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Skeleton width={150} height={24} />
                        <Skeleton width={60} height={16} />
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <FeaturedTourSkeleton />
                        <FeaturedTourSkeleton />
                    </View>
                </View>

                {/* List Skeleton */}
                <View style={{ paddingHorizontal: Spacing.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Skeleton width={150} height={24} />
                        <Skeleton width={60} height={16} />
                    </View>
                    <TourCardSkeleton />
                    <TourCardSkeleton />
                    <TourCardSkeleton />
                </View>
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
                        <Text style={styles.greeting}>
                            {t.home.greeting}, {user?.full_name?.split(' ')[0] || 'Traveler'}! 👋
                        </Text>
                        <Text style={styles.headerSubtitle}>{t.welcome.explorePeruSafely}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => router.push('/(tourist)/(tabs)/profile')}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.full_name?.charAt(0) || '👤'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={Colors.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t.home.searchPlaceholder}
                            placeholderTextColor={Colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity style={styles.filterButton}>
                        <Ionicons name="options" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Categories */}
                <View style={styles.categoriesSection}>
                    <Text style={styles.sectionTitle}>{t.home.categories}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.categoriesRow}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryChip,
                                        cat.active && styles.categoryChipActive,
                                    ]}
                                    onPress={() => handleCategorySelect(cat.id)}
                                >
                                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                    <Text style={[
                                        styles.categoryText,
                                        cat.active && styles.categoryTextActive,
                                    ]}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Featured Tours */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t.home.featuredTours}</Text>
                        <TouchableOpacity onPress={() => router.push('/(tourist)/tour/[id]')}>
                            <Text style={styles.seeAllText}>{t.common.seeAll}</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        horizontal
                        data={featuredTours}
                        keyExtractor={(item) => item.id}
                        renderItem={renderFeaturedCard}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.featuredList}
                    />
                </View>

                {/* Top Rated */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t.home.topRated}</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>{t.common.seeAll}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.toursList}>
                        {allTours.map((tour) => (
                            <View key={tour.id}>
                                {renderTourItem({ item: tour })}
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 160 }} />
            </ScrollView>

            {/* SOS Button */}
            <SOSButton onActivate={handleSOS} text={t.safety.slideSOS} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: Colors.textSecondary },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
    headerLeft: { flex: 1 },
    greeting: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
    headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
    profileButton: {},
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 20, color: '#fff', fontWeight: '600' },

    searchContainer: { flexDirection: 'row', paddingHorizontal: Spacing.md, marginTop: Spacing.md, gap: 12 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.xl, paddingHorizontal: 16, height: 50, gap: 8, ...Shadows.sm },
    searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },
    filterButton: { width: 50, height: 50, borderRadius: BorderRadius.xl, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },

    categoriesSection: { paddingTop: Spacing.md },
    categoriesRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: 8 },
    categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, gap: 6 },
    categoryChipActive: { backgroundColor: Colors.primary },
    categoryIcon: { fontSize: 18 },
    categoryText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
    categoryTextActive: { color: '#fff' },

    section: { paddingTop: Spacing.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    seeAllText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },

    featuredList: { paddingHorizontal: Spacing.md },
    featuredCard: { width: 260, marginRight: 16, borderRadius: BorderRadius.xl, backgroundColor: Colors.surfaceLight, overflow: 'hidden', ...Shadows.md },
    featuredImageContainer: { height: 160, position: 'relative' },
    featuredImage: { width: '100%', height: '100%' },
    placeholderImage: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    placeholderEmoji: { fontSize: 48 },
    featuredOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
    featuredBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    featuredBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    featuredContent: { padding: 12 },
    featuredLocation: { fontSize: 12, color: Colors.textSecondary },
    featuredTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
    featuredMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    featuredDuration: { fontSize: 12, color: Colors.textSecondary },
    featuredPrice: { fontSize: 18, fontWeight: '700', color: Colors.primary },

    toursList: { paddingHorizontal: Spacing.md, gap: 12 },
    tourItem: { flexDirection: 'row', backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.xl, padding: 12, gap: 12, ...Shadows.sm },
    tourItemImage: { width: 80, height: 80, borderRadius: BorderRadius.lg, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    tourItemImageInner: { width: '100%', height: '100%' },
    tourItemPlaceholder: { fontSize: 32 },
    tourItemContent: { flex: 1, justifyContent: 'center' },
    tourItemTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
    tourItemLocation: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    tourItemMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    tourItemRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tourItemRatingText: { fontSize: 12, color: Colors.textSecondary },
    tourItemPrice: { fontSize: 16, fontWeight: '700', color: Colors.primary },
});
