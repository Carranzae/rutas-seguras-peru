/**
 * Ruta Segura Perú - Notification Service
 * Push notifications with Expo Notifications
 */
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Types
export interface PushNotification {
    title: string;
    body: string;
    data?: Record<string, unknown>;
}

class NotificationService {
    private expoPushToken: string | null = null;
    private notificationListener: Notifications.EventSubscription | null = null;
    private responseListener: Notifications.EventSubscription | null = null;

    /**
     * Initialize notification service
     */
    async initialize(): Promise<string | null> {
        // Register for push notifications
        const token = await this.registerForPushNotifications();

        if (token) {
            this.expoPushToken = token;
            // Send token to backend
            await this.registerTokenWithBackend(token);
        }

        // Set up listeners
        this.setupListeners();

        return token;
    }

    /**
     * Register for push notifications
     */
    private async registerForPushNotifications(): Promise<string | null> {
        if (!Device.isDevice) {
            console.warn('Push notifications only work on physical devices');
            return null;
        }

        try {
            // Check existing permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            // Request permission if not granted
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.warn('Notification permission not granted');
                return null;
            }

            // Get Expo push token
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: 'your-eas-project-id', // Update with your EAS project ID
            });

            // Configure Android channel
            if (Platform.OS === 'android') {
                await this.createAndroidChannels();
            }

            return tokenData.data;
        } catch (error) {
            console.error('Failed to register for push notifications:', error);
            return null;
        }
    }

    /**
     * Create Android notification channels
     */
    private async createAndroidChannels(): Promise<void> {
        // Emergency channel (high priority)
        await Notifications.setNotificationChannelAsync('emergencies', {
            name: 'Emergencias',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 250, 500],
            lightColor: '#FF0000',
            sound: 'sos-alert.wav',
            enableVibrate: true,
            enableLights: true,
        });

        // Tour updates channel
        await Notifications.setNotificationChannelAsync('tours', {
            name: 'Tours',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
        });

        // General channel
        await Notifications.setNotificationChannelAsync('default', {
            name: 'General',
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }

    /**
     * Send token to backend
     */
    private async registerTokenWithBackend(token: string): Promise<void> {
        try {
            await api.post('/users/fcm-token', { token });
            console.log('FCM token registered with backend');
        } catch (error) {
            console.error('Failed to register FCM token:', error);
        }
    }

    /**
     * Set up notification listeners
     */
    private setupListeners(): void {
        // Listen for incoming notifications while app is foregrounded
        this.notificationListener = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log('Notification received:', notification);
                this.handleNotification(notification);
            }
        );

        // Listen for user tapping on notification
        this.responseListener = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                console.log('Notification response:', response);
                this.handleNotificationResponse(response);
            }
        );
    }

    /**
     * Handle incoming notification
     */
    private handleNotification(notification: Notifications.Notification): void {
        const data = notification.request.content.data;

        // Handle different notification types
        if (data?.type === 'sos') {
            // Emergency notification - could trigger special UI
            console.log('SOS notification received');
        }
    }

    /**
     * Handle notification tap response
     */
    private handleNotificationResponse(
        response: Notifications.NotificationResponse
    ): void {
        const data = response.notification.request.content.data;

        // Navigate based on notification type
        if (data?.type === 'sos' && data?.emergency_id) {
            // Navigate to emergency detail
            // router.push(`/emergencies/${data.emergency_id}`);
        } else if (data?.type === 'tour' && data?.tour_id) {
            // Navigate to tour detail
            // router.push(`/tours/${data.tour_id}`);
        }
    }

    /**
     * Send local notification (for testing)
     */
    async sendLocalNotification(notification: PushNotification): Promise<void> {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: notification.title,
                body: notification.body,
                data: notification.data,
                sound: true,
            },
            trigger: null, // Immediate
        });
    }

    /**
     * Get current push token
     */
    getToken(): string | null {
        return this.expoPushToken;
    }

    /**
     * Clean up listeners
     */
    cleanup(): void {
        if (this.notificationListener) {
            Notifications.removeNotificationSubscription(this.notificationListener);
        }
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }
    }
}

// Export singleton
export const notificationService = new NotificationService();
export default notificationService;
