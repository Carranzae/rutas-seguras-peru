// Ruta Segura Perú - End of Tour Report Screen
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { toursService } from '@/src/services/tours';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EndOfTourReport() {
    const [notes, setNotes] = useState('');
    const [rating, setRating] = useState(0);

    const tour = { name: 'Machu Picchu Explorer', duration: '6h 45m', tourists: 12, incidents: 0 };

    const summary = [
        { label: 'Start Time', value: '06:00 AM' },
        { label: 'End Time', value: '12:45 PM' },
        { label: 'Total Duration', value: tour.duration },
        { label: 'Tourists', value: `${tour.tourists} people` },
        { label: 'Checkpoints', value: '6/6 completed' },
        { label: 'Incidents', value: tour.incidents.toString() },
    ];

    const submitReport = async () => {
        if (!rating) {
            // alert or toast
            return;
        }
        try {
            await toursService.submitReport('current', {
                notes,
                rating,
                incidents: 0 // Mock incidents count or get from incident service
            });
            router.replace('/(guide)/(tabs)/dashboard');
        } catch (error) {
            console.error('Failed to submit report', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>End of Tour Report</Text>
                <View style={styles.completedBadge}><Text style={styles.completedIcon}>✓</Text><Text style={styles.completedText}>Completed</Text></View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.tourCard}>
                    <Text style={styles.tourEmoji}>🏛️</Text>
                    <Text style={styles.tourName}>{tour.name}</Text>
                </View>

                {/* Summary */}
                <View style={styles.summaryCard}>
                    {summary.map((item, i) => (
                        <View key={i} style={[styles.summaryRow, i < summary.length - 1 && styles.summaryRowBorder]}>
                            <Text style={styles.summaryLabel}>{item.label}</Text>
                            <Text style={styles.summaryValue}>{item.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Rating */}
                <Text style={styles.sectionTitle}>How was the tour?</Text>
                <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setRating(star)}>
                            <Text style={[styles.star, star <= rating && styles.starActive]}>⭐</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Notes */}
                <Text style={styles.sectionTitle}>Additional Notes</Text>
                <TextInput style={styles.notesInput} placeholder="Any incidents, highlights, or feedback..." placeholderTextColor={Colors.textSecondary} value={notes} onChangeText={setNotes} multiline numberOfLines={4} textAlignVertical="top" />

                {/* Photo Upload */}
                <Text style={styles.sectionTitle}>Tour Photos (Optional)</Text>
                <TouchableOpacity style={styles.uploadButton}><Text style={styles.uploadIcon}>📷</Text><Text style={styles.uploadText}>Add Photos</Text></TouchableOpacity>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.submitButton} onPress={submitReport}><Text style={styles.submitText}>Submit Report</Text></TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary },
    completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    completedIcon: { color: Colors.success },
    completedText: { fontSize: 12, fontWeight: '600', color: Colors.success },
    content: { padding: Spacing.md },
    tourCard: { alignItems: 'center', backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: 16, marginBottom: Spacing.md },
    tourEmoji: { fontSize: 48, marginBottom: Spacing.sm },
    tourName: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    summaryCard: { backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.sm },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    summaryLabel: { fontSize: 14, color: Colors.textSecondary },
    summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
    ratingContainer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.md },
    star: { fontSize: 36, opacity: 0.3 },
    starActive: { opacity: 1 },
    notesInput: { backgroundColor: Colors.surfaceLight, borderRadius: 12, padding: Spacing.md, fontSize: 14, color: Colors.textPrimary, minHeight: 100, marginBottom: Spacing.md },
    uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.borderLight },
    uploadIcon: { fontSize: 24 },
    uploadText: { fontSize: 14, color: Colors.textSecondary },
    bottomBar: { padding: Spacing.md },
    submitButton: { backgroundColor: Colors.success, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    submitText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
});
