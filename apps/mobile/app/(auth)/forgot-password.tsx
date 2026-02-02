/**
 * Ruta Segura Perú - Forgot Password Screen
 * Allows users to request a password reset link
 */
import { authService } from '@/src/services/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
    View
} from 'react-native';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState('');

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async () => {
        setError('');

        if (!email.trim()) {
            setError('Por favor ingresa tu correo electrónico');
            return;
        }

        if (!validateEmail(email)) {
            setError('Por favor ingresa un correo electrónico válido');
            return;
        }

        setIsLoading(true);

        try {
            await authService.forgotPassword(email);
            setEmailSent(true);
        } catch (err: any) {
            setError(err.detail || 'Error al enviar el correo. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <View style={styles.container}>
                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="mail-outline" size={64} color="#4CAF50" />
                    </View>
                    <Text style={styles.successTitle}>¡Correo Enviado!</Text>
                    <Text style={styles.successText}>
                        Hemos enviado un enlace de recuperación a{'\n'}
                        <Text style={styles.emailHighlight}>{email}</Text>
                    </Text>
                    <Text style={styles.instructionText}>
                        Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                    </Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace('/(auth)/login')}
                    >
                        <Text style={styles.primaryButtonText}>Volver al Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resendButton}
                        onPress={() => {
                            setEmailSent(false);
                            handleSubmit();
                        }}
                    >
                        <Text style={styles.resendButtonText}>¿No recibiste el correo? Reenviar</Text>
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
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.headerContainer}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed-outline" size={48} color="#1152d4" />
                    </View>
                    <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                    <Text style={styles.subtitle}>
                        No te preocupes. Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
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

                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Correo electrónico"
                            placeholderTextColor="#8E8E93"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setError('');
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>Enviar Enlace de Recuperación</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginLink}
                        onPress={() => router.replace('/(auth)/login')}
                    >
                        <Text style={styles.loginLinkText}>
                            ¿Recordaste tu contraseña? <Text style={styles.loginLinkHighlight}>Iniciar Sesión</Text>
                        </Text>
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
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
        paddingHorizontal: 20,
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
        marginBottom: 24,
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
    submitButton: {
        backgroundColor: '#1152d4',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loginLink: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    loginLinkText: {
        color: '#8E8E93',
        fontSize: 14,
    },
    loginLinkHighlight: {
        color: '#1152d4',
        fontWeight: '600',
    },
    // Success state styles
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
        marginBottom: 12,
    },
    emailHighlight: {
        color: '#1152d4',
        fontWeight: '600',
    },
    instructionText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 40,
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    primaryButton: {
        backgroundColor: '#1152d4',
        borderRadius: 16,
        height: 56,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    resendButton: {
        paddingVertical: 12,
    },
    resendButtonText: {
        color: '#8E8E93',
        fontSize: 14,
    },
});
