// Ruta Segura Perú - Guide Module Layout
import { Stack } from 'expo-router';
import React from 'react';

export default function GuideLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="active-route" options={{ presentation: 'card' }} />
            <Stack.Screen name="group" options={{ presentation: 'card' }} />
            <Stack.Screen name="report" options={{ presentation: 'modal' }} />
            <Stack.Screen name="welcome" options={{ presentation: 'card' }} />
            <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
            {/* Verification Flow */}
            <Stack.Screen name="verification/selfie" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="verification/dircetur-front" options={{ presentation: 'card' }} />
            <Stack.Screen name="verification/dircetur-back" options={{ presentation: 'card' }} />
            <Stack.Screen name="verification/verify-data" options={{ presentation: 'card' }} />
            <Stack.Screen name="verification/confirm-photo-1" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="verification/confirm-photo-2" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="verification/pending" options={{ presentation: 'card' }} />
            {/* Chat */}
            <Stack.Screen name="chat/[tourId]" options={{ presentation: 'card' }} />
            {/* Live Tracking */}
            <Stack.Screen name="live-tracking" options={{ presentation: 'fullScreenModal' }} />
            {/* Guide Registration */}
            <Stack.Screen name="register" options={{ presentation: 'card' }} />
            {/* Tour Detail */}
            <Stack.Screen name="tours/[id]" options={{ presentation: 'card' }} />
            {/* Auth */}
            <Stack.Screen name="auth/reset-biometric" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
    );
}

