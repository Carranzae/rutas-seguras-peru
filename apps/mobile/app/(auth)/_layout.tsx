// Ruta Segura Perú - Auth Module Layout
import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="role-select" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="onboarding" />
        </Stack>
    );
}
