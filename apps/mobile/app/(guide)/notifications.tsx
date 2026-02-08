// Ruta Segura Perú - Safety Notifications Screen
import { Colors, Shadows, Spacing } from '@/src/constants/theme';
import { httpClient } from '@/src/core/api';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SafetyNotifications() {
    const [notifications, setNotifications] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await httpClient.get<any[]>('/notifications');
            if (response.data) {
                setNotifications(response.data);
            } else {
                setNotifications([
                    { id: '1', type: 'alert', title: 'Sin notificaciones', message: 'No hay notificaciones nuevas.', time: 'Ahora', unread: false },
                ]);
            }
        } catch (e) {
            console.error('Error loading notifications:', e);
            setNotifications([
                { id: '1', type: 'alert', title: 'Sin conexión', message: 'No se pudieron cargar las notificaciones.', time: 'Ahora', unread: true },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'alert': return '⚠️';
            case 'tourist': return '👤';
            case 'system': return '📅';
            case 'safety': return '🛡️';
            default: return '📢';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'alert': return Colors.warning;
            case 'tourist': return Colors.danger;
            default: return Colors.primary;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity><Text style={styles.markRead}>Mark all read</Text></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {notifications.map((notif) => (
                    <TouchableOpacity key={notif.id} style={[styles.notifCard, notif.unread && styles.notifUnread]}>
                        <View style={[styles.notifIcon, { backgroundColor: `${getTypeColor(notif.type)}15` }]}>
                            <Text style={styles.notifEmoji}>{getTypeIcon(notif.type)}</Text>
                        </View>
                        <View style={styles.notifContent}>
                            <View style={styles.notifHeader}>
                                <Text style={styles.notifTitle}>{notif.title}</Text>
                                {notif.unread && <View style={styles.unreadDot} />}
                            </View>
                            <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                            <Text style={styles.notifTime}>{notif.time}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
    markRead: { fontSize: 12, color: Colors.primary },
    content: { padding: Spacing.md },
    notifCard: { flexDirection: 'row', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: 16, marginBottom: Spacing.sm, ...Shadows.sm },
    notifUnread: { backgroundColor: 'rgba(17, 82, 212, 0.03)', borderLeftWidth: 3, borderLeftColor: Colors.primary },
    notifIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    notifEmoji: { fontSize: 20 },
    notifContent: { flex: 1, marginLeft: Spacing.sm },
    notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    notifTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.textPrimary },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
    notifMessage: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
    notifTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 6 },
});
