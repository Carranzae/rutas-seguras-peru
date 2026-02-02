/**
 * Ruta Segura Perú - Reset Password Screen
 * Allows users to set a new password after receiving reset link
 */
import { authService } from '@/src/services/auth';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { token } = useLocalSearchParams<{ token: string }>();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Password strength indicators
    const passwordChecks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
    };

    const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

    const handleSubmit = async () => {
        setError('');

        if (!password || !confirmPassword) {
            setError('Por favor completa todos los campos');
            return;
        }

        if (!isPasswordStrong) {
            setError('La contraseña no cumple con los requisitos mínimos');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (!token) {
            setError('Token de recuperación inválido');
            return;
        }

        setIsLoading(true);

        try {
            await authService.resetPassword(token, password);
            setSuccess(true);
        } catch (err: any) {
            setError(err.detail || 'Error al restablecer la contraseña. El enlace puede haber expirado.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <View style={styles.container}>
                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                    </View>
                    <Text style={styles.successTitle}>¡Contraseña Actualizada!</Text>
                    <Text style={styles.successText}>
                        Tu contraseña ha sido restablecida exitosamente.
                        Ya puedes iniciar sesión con tu nueva contraseña.
                    </Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace('/(auth)/login')}
                    >
                        <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="key-outline" size={48} color="#1152d4" />
                    </View>
                    <Text style={styles.title}>Nueva Contraseña</Text>
                    <Text style={styles.subtitle}>
                        Crea una nueva contraseña segura para tu cuenta
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color="#FF5252" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nueva contraseña"
                            placeholderTextColor="#8E8E93"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setError('');
                            }}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color="#8E8E93"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Password Requirements */}
                    <View style={styles.requirementsContainer}>
                        <Text style={styles.requirementsTitle}>Requisitos de contraseña:</Text>
                        <View style={styles.requirementRow}>
                            <Ionicons
                                name={passwordChecks.length ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                                color={passwordChecks.length ? '#4CAF50' : '#6B7280'}
                            />
                            <Text style={[styles.requirementText, passwordChecks.length && styles.requirementMet]}>
                                Mínimo 8 caracteres
                            </Text>
                        </View>
                        <View style={styles.requirementRow}>
                            <Ionicons
                                name={passwordChecks.uppercase ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                                color={passwordChecks.uppercase ? '#4CAF50' : '#6B7280'}
                            />
                            <Text style={[styles.requirementText, passwordChecks.uppercase && styles.requirementMet]}>
                                Una letra mayúscula
                            </Text>
                        </View>
                        <View style={styles.requirementRow}>
                            <Ionicons
                                name={passwordChecks.lowercase ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                                color={passwordChecks.lowercase ? '#4CAF50' : '#6B7280'}
                            />
                            <Text style={[styles.requirementText, passwordChecks.lowercase && styles.requirementMet]}>
                                Una letra minúscula
                            </Text>
                        </View>
                        <View style={styles.requirementRow}>
                            <Ionicons
                                name={passwordChecks.number ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                                color={passwordChecks.number ? '#4CAF50' : '#6B7280'}
                            />
                            <Text style={[styles.requirementText, passwordChecks.number && styles.requirementMet]}>
                                Un número
                            </Text>
                        </View>
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirmar contraseña"
                            placeholderTextColor="#8E8E93"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setError('');
                            }}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Ionicons
                                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color="#8E8E93"
                            />
                        </TouchableOpacity>
                    </View>

                    {password && confirmPassword && password === confirmPassword && (
                        <View style={styles.matchIndicator}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={styles.matchText}>Las contraseñas coinciden</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.submitButton, (!isPasswordStrong || isLoading) && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={!isPasswordStrong || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>Restablecer Contraseña</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0f1c',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(17, 82, 212, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 24,
    },
    formContainer: {
        flex: 1,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 82, 82, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 82, 82, 0.3)',
    },
    errorText: {
        color: '#FF5252',
        marginLeft: 10,
        flex: 1,
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        color: '#FFFFFF',
        fontSize: 16,
    },
    requirementsContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    requirementsTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    requirementText: {
        color: '#6B7280',
        fontSize: 13,
        marginLeft: 8,
    },
    requirementMet: {
        color: '#4CAF50',
    },
    matchIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: -8,
    },
    matchText: {
        color: '#4CAF50',
        fontSize: 13,
        marginLeft: 6,
    },
    submitButton: {
        backgroundColor: '#1152d4',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Success state
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    successIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    successText: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    primaryButton: {
        backgroundColor: '#1152d4',
        borderRadius: 16,
        height: 56,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
