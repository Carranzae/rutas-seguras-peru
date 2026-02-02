/**
 * Ruta Segura Perú - Guide Approval Handshake
 * Tourist reviews and accepts/rejects the assigned guide
 */
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function GuideHandshakeScreen() {
    const params = useLocalSearchParams();
    const { id, guide_name, tour_name } = params;

    const [guide] = useState({
        name: guide_name || 'Carlos Quispe',
        rating: 4.9,
        reviews: 124,
        languages: ['Español', 'English', 'Quechua'],
        experience: '5 años',
        bio: 'Experto en historia Inca y senderismo de alta montaña. Certificado en primeros auxilios y rescate.',
        image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400',
        badges: ['Certificado', 'Bilingüe', 'Top Rated']
    });

    const handleAccept = () => {
        Alert.alert(
            '¡Guía Confirmado! 🎉',
            `Has aceptado a ${guide.name} para tu tour. Sus datos completos se han sincronizado en tu perfil.`,
            [
                { text: 'Ver Detalles', onPress: () => router.back() }
            ]
        );
    };

    const handleReject = () => {
        Alert.alert(
            '¿Cambiar Guía?',
            'Te mostraremos otros guías disponibles para tu horario. Ten en cuenta que esto podría tomar unos momentos.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Buscar Otros',
                    onPress: () => router.push({
                        pathname: '/(tourist)/bookings/handshake/alternatives',
                        params: { booking_id: id }
                    })
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Guía Asignado</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.introContainer}>
                    <Text style={styles.introText}>
                        ¡Buenas noticias! Se ha asignado un guía para tu tour <Text style={{ fontWeight: 'bold' }}>{tour_name}</Text>.
                    </Text>
                    <Text style={styles.subText}>Revisa su perfil y confirma si estás de acuerdo.</Text>
                </View>

                <View style={styles.profileCard}>
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: guide.image }} style={styles.avatar} />
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={14} color="white" />
                        </View>
                    </View>

                    <Text style={styles.name}>{guide.name}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Ionicons name="star" size={16} color="#fbbf24" />
                            <Text style={styles.statValue}>{guide.rating}</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <Text style={styles.statEmoji}>🎒</Text>
                            <Text style={styles.statValue}>{guide.experience}</Text>
                            <Text style={styles.statLabel}>Experiencia</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <Text style={styles.statEmoji}>🗣️</Text>
                            <Text style={styles.statValue}>{guide.languages.length}</Text>
                            <Text style={styles.statLabel}>Idiomas</Text>
                        </View>
                    </View>

                    <View style={styles.tagsContainer}>
                        {guide.badges.map((badge, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{badge}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.bioSection}>
                        <Text style={styles.bioTitle}>Sobre mí</Text>
                        <Text style={styles.bioText}>{guide.bio}</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                    <Text style={styles.rejectText}>Cambiar Guía</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
                    <Text style={styles.acceptText}>Aceptar Guía</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    content: { padding: Spacing.md, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceLight, borderRadius: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    introContainer: { marginBottom: Spacing.lg },
    introText: { fontSize: 16, color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
    subText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

    profileCard: { backgroundColor: Colors.surfaceLight, borderRadius: 24, padding: Spacing.xl, alignItems: 'center', ...Shadows.md },
    imageContainer: { marginVertical: Spacing.md },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: Colors.backgroundLight },
    verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10b981', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.surfaceLight },
    name: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.lg },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: Spacing.lg, paddingHorizontal: Spacing.md },
    stat: { alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
    statEmoji: { fontSize: 16 },
    statLabel: { fontSize: 12, color: Colors.textSecondary },
    divider: { width: 1, backgroundColor: Colors.borderLight, height: '80%' },

    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: Spacing.lg },
    tag: { backgroundColor: 'rgba(17, 82, 212, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    tagText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },

    bioSection: { width: '100%', backgroundColor: Colors.backgroundLight, padding: Spacing.md, borderRadius: 12 },
    bioTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
    bioText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

    actionButtons: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, backgroundColor: Colors.surfaceLight, borderTopWidth: 1, borderTopColor: Colors.borderLight, flexDirection: 'row', gap: 12 },
    rejectButton: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderLight, alignItems: 'center' },
    rejectText: { color: Colors.textSecondary, fontWeight: '600' },
    acceptButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', ...Shadows.primary },
    acceptText: { color: 'white', fontWeight: 'bold' },
});
