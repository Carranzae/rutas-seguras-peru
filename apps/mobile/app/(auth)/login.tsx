// Ruta Segura Perú - Login Screen with i18n
import { Colors, Spacing } from '@/src/constants/theme';
import { useAuth } from '@/src/features/auth';
import { useLanguage } from '@/src/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const { t, language } = useLanguage();
    const { login, isLoading, error: authError, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email.trim()) {
            setError(language === 'es' ? 'Por favor ingresa tu correo' : 'Please enter your email');
            return;
        }
        if (!password.trim()) {
            setError(language === 'es' ? 'Por favor ingresa tu contraseña' : 'Please enter your password');
            return;
        }

        setError('');
        clearError();

        try {
            const user = await login({
                email: email.trim().toLowerCase(),
                password: password,
            });

            // Save role for navigation
            await AsyncStorage.setItem('user_role', user.role);

            // Navigate based on role
            switch (user.role) {
                case 'guide':
                    router.replace('/(guide)/(tabs)/dashboard');
                    break;
                case 'super_admin':
                case 'tourist':
                default:
                    router.replace('/(tourist)/(tabs)/explore');
                    break;
            }
        } catch (err: unknown) {
            console.error('Login error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Login failed';
            setError(errorMessage);
        }
    };

    const displayError = error || authError;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <View style={styles.logoCircle}><Text style={styles.logoEmoji}>🛡️</Text></View>
                        <Text style={styles.title}>{t.common.welcome}</Text>
                        <Text style={styles.subtitle}>{t.auth.login}</Text>
                    </View>

                    <View style={styles.form}>
                        {displayError ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>⚠️ {displayError}</Text>
                            </View>
                        ) : null}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t.auth.email}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="your@email.com"
                                placeholderTextColor={Colors.textSecondary}
                                value={email}
                                onChangeText={(text) => { setEmail(text); setError(''); }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t.auth.password}</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="••••••••"
                                    placeholderTextColor={Colors.textSecondary}
                                    value={password}
                                    onChangeText={(text) => { setPassword(text); setError(''); }}
                                    secureTextEntry={!showPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                                    <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.forgotButton} onPress={() => router.push('/(auth)/forgot-password')}>
                            <Text style={styles.forgotText}>{t.auth.forgotPassword}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.loginButtonText}>{t.auth.loginButton}</Text>
                            )}
                        </TouchableOpacity>

                        {/* Social Login */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>{t.auth.orContinueWith}</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.socialButtons}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Text style={styles.socialIcon}>G</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Text style={styles.socialIcon}>🍎</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Text style={styles.socialIcon}>f</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.registerLink}>
                            <Text style={styles.registerText}>{t.auth.noAccount} </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                                <Text style={styles.registerLinkText}>{t.auth.register}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0f1c' },
    scrollContent: { padding: Spacing.md },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 22, color: '#fff' },

    header: { alignItems: 'center', marginVertical: 32 },
    logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    logoEmoji: { fontSize: 40 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

    form: { gap: 16 },
    errorContainer: { backgroundColor: 'rgba(239,68,68,0.15)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
    errorText: { color: '#ef4444', fontSize: 14 },

    inputGroup: { marginBottom: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 },
    input: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    passwordInput: { flex: 1, padding: 16, fontSize: 16, color: '#fff' },
    eyeButton: { padding: 16 },

    forgotButton: { alignSelf: 'flex-end' },
    forgotText: { fontSize: 14, color: '#f59e0b' },

    loginButton: { backgroundColor: '#f59e0b', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    loginButtonDisabled: { opacity: 0.7 },
    loginButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    dividerText: { marginHorizontal: 12, color: 'rgba(255,255,255,0.5)', fontSize: 13 },

    socialButtons: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
    socialButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    socialIcon: { fontSize: 24, fontWeight: 'bold', color: '#fff' },

    registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    registerText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
    registerLinkText: { color: '#f59e0b', fontSize: 14, fontWeight: '600' },
});
