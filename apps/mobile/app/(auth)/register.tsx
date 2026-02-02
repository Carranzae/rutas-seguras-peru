// Ruta Segura Perú - Register Screen
import { Colors, Spacing } from '@/src/constants/theme';
import { authService } from '@/src/services/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'tourist' | 'guide'>('tourist');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!email.trim()) {
            newErrors.email = 'El correo es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Correo inválido';
        }

        if (!password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (password.length < 8) {
            newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            // Call backend API
            const user = await authService.register({
                email: email.trim().toLowerCase(),
                password,
                full_name: name.trim(),
                phone: phone.trim() || undefined,
                role,
            });

            // Show success message
            Alert.alert(
                '¡Cuenta Creada!',
                'Tu cuenta ha sido creada exitosamente. Por favor inicia sesión.',
                [
                    {
                        text: 'Iniciar Sesión',
                        onPress: () => router.replace('/(auth)/login'),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Registration error:', error);

            let message = 'No se pudo crear la cuenta. Intenta nuevamente.';

            if (error.detail) {
                if (error.detail.includes('already exists') || error.detail.includes('ya existe')) {
                    message = 'Este correo ya está registrado. Intenta iniciar sesión.';
                } else {
                    message = error.detail;
                }
            } else if (error.status === 0) {
                message = 'Sin conexión. Verifica tu internet.';
            }

            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Crear Cuenta</Text>
                        <Text style={styles.subtitle}>Únete a Ruta Segura Perú</Text>
                    </View>

                    {/* Role Selection */}
                    <View style={styles.roleContainer}>
                        <Text style={styles.roleLabel}>¿Cómo usarás la app?</Text>
                        <View style={styles.roleButtons}>
                            <TouchableOpacity
                                style={[styles.roleButton, role === 'tourist' && styles.roleButtonActive]}
                                onPress={() => setRole('tourist')}
                            >
                                <Text style={styles.roleIcon}>🧳</Text>
                                <Text style={[styles.roleText, role === 'tourist' && styles.roleTextActive]}>Turista</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleButton, role === 'guide' && styles.roleButtonActive]}
                                onPress={() => setRole('guide')}
                            >
                                <Text style={styles.roleIcon}>🎯</Text>
                                <Text style={[styles.roleText, role === 'guide' && styles.roleTextActive]}>Guía</Text>
                            </TouchableOpacity>
                        </View>
                        {role === 'guide' && (
                            <Text style={styles.guideNote}>💡 Como guía, necesitarás verificar tu carnet DIRCETUR</Text>
                        )}
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nombre completo *</Text>
                            <TextInput
                                style={[styles.input, errors.name && styles.inputError]}
                                placeholder="Juan Pérez"
                                placeholderTextColor={Colors.textSecondary}
                                value={name}
                                onChangeText={setName}
                                autoComplete="name"
                            />
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Correo electrónico *</Text>
                            <TextInput
                                style={[styles.input, errors.email && styles.inputError]}
                                placeholder="tu@email.com"
                                placeholderTextColor={Colors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Teléfono (opcional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+51 999 999 999"
                                placeholderTextColor={Colors.textSecondary}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                autoComplete="tel"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Contraseña *</Text>
                            <TextInput
                                style={[styles.input, errors.password && styles.inputError]}
                                placeholder="Mínimo 8 caracteres"
                                placeholderTextColor={Colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoComplete="new-password"
                            />
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirmar contraseña *</Text>
                            <TextInput
                                style={[styles.input, errors.confirmPassword && styles.inputError]}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.textSecondary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoComplete="new-password"
                            />
                            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                        </View>

                        <TouchableOpacity
                            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.loginLink}>Inicia Sesión</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    scrollContent: { flexGrow: 1, padding: Spacing.xl },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
    backIcon: { fontSize: 20 },
    header: { marginBottom: Spacing.lg },
    title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
    subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
    roleContainer: { marginBottom: Spacing.lg },
    roleLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
    roleButtons: { flexDirection: 'row', gap: Spacing.sm },
    roleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, backgroundColor: Colors.surfaceLight, borderWidth: 2, borderColor: Colors.borderLight },
    roleButtonActive: { borderColor: Colors.primary, backgroundColor: 'rgba(17, 82, 212, 0.05)' },
    roleIcon: { fontSize: 20 },
    roleText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
    roleTextActive: { color: Colors.primary },
    guideNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
    form: { flex: 1 },
    inputGroup: { marginBottom: Spacing.md },
    label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
    input: { backgroundColor: Colors.surfaceLight, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.borderLight },
    inputError: { borderColor: Colors.danger },
    errorText: { color: Colors.danger, fontSize: 12, marginTop: 4 },
    registerButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: Spacing.md },
    registerButtonDisabled: { opacity: 0.7 },
    registerButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    footer: { flexDirection: 'row', justifyContent: 'center', paddingTop: Spacing.lg },
    footerText: { fontSize: 14, color: Colors.textSecondary },
    loginLink: { fontSize: 14, fontWeight: 'bold', color: Colors.primary },
});
