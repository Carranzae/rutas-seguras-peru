// Ruta Segura Perú - Tourist Module Layout
import { Stack } from 'expo-router';
import React from 'react';

export default function TouristLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="tour/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="tour/checkout" options={{ presentation: 'modal' }} />
            <Stack.Screen name="translator" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="chat/[guideId]" options={{ presentation: 'card' }} />
            <Stack.Screen name="onboarding" options={{ presentation: 'card' }} />
            <Stack.Screen name="history" options={{ presentation: 'card' }} />
            <Stack.Screen name="settings" options={{ presentation: 'card' }} />
            {/* Emergency */}
            <Stack.Screen name="emergency/sos" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="emergency/contacts" options={{ presentation: 'card' }} />
            <Stack.Screen name="emergency/tracking" options={{ presentation: 'card' }} />
            <Stack.Screen name="emergency/whatsapp" options={{ presentation: 'card' }} />
            <Stack.Screen name="emergency/permissions" options={{ presentation: 'card' }} />
            <Stack.Screen name="emergency-active" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="live-translator" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="trust-circle" options={{ presentation: 'card' }} />
            <Stack.Screen name="bookings/handshake/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="bookings/handshake/alternatives" options={{ presentation: 'card' }} />
        </Stack>
    );
}

