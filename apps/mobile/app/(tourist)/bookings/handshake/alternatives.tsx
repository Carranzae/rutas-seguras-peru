/**
 * Ruta Segura Perú - Alternative Guides Selection
 * Shows a list of alternative guides if the user rejects the initial assignment
 */
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function AlternativeGuidesScreen() {
    const { booking_id } = useLocalSearchParams();

    const [alternatives] = useState([
        {
            id: 'g2',
            name: 'Ana Mendoza',
            rating: 4.8,
            experience: '4 años',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
            speciality: 'Cultura & Arte'
        },
        {
            id: 'g3',
            name: 'Luis Torres',
            rating: 4.7,
            experience: '6 años',
            image: 'https://images.unsplash.com/photo-1542596594-649edbc13630?w=400',
            speciality: 'Fotografía'
        }
    ]);

    const handleSelect = (guide: any) => {
        Alert.alert(
            'Confirmar Cambio',
            `¿Deseas seleccionar a ${guide.name} como tu nuevo guía?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: () => {
                        Alert.alert('¡Cambio Exitoso!', 'Tu guía ha sido actualizado.', [
                            { text: 'OK', onPress: () => router.push('/(tourist)/bookings') }
                        ]);
                    }
                }
            ]
        );
    };

    const renderGuide = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
            <Image source={{ uri: item.image }} style={styles.avatar} />
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.speciality}>{item.speciality}</Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text style={styles.rating}>{item.rating}</Text>
                    <Text style={styles.experience}>• {item.experience} exp.</Text>
                </View>
            </View>
            <View style={styles.selectButton}>
                <Text style={styles.selectText}>Elegir</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Guías Disponibles</Text>
            </View>

            <Text style={styles.subtitle}>Selecciona un guía alternativo para tu horario:</Text>

            <FlatList
                data={alternatives}
                renderItem={renderGuide}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 16 },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceLight, borderRadius: 20 },
    title: { fontSize: 20, fontWeight: 'bold' },
    subtitle: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md, color: Colors.textSecondary },
    list: { padding: Spacing.md },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 16, marginBottom: 16, ...Shadows.sm },
    avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
    speciality: { fontSize: 13, color: Colors.primary, marginBottom: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rating: { fontWeight: 'bold', fontSize: 12 },
    experience: { color: Colors.textSecondary, fontSize: 12 },
    selectButton: { backgroundColor: Colors.backgroundLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.borderLight },
    selectText: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
});
