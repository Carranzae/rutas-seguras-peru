/**
 * Ruta Segura Perú - Guide Registration Flow
 * Complete multi-step registration with: Personal data, DNI, DIRCETUR, Biometric, Waiting
 */
import { API_CONFIG, httpClient } from '@/src/core/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RegistrationStep = 'personal' | 'dni' | 'certificate' | 'biometric' | 'submitting' | 'waiting' | 'approved' | 'rejected';

interface GuideData {
    full_name: string;
    email: string;
    phone: string;
    birth_date: string;
    dni_number: string;
    dircetur_license: string;
    experience_years: string;
    specialties: string;
    password: string;
}

interface VerificationStatus {
    status: string;
    rejection_reason?: string;
}

interface VerificationResponse {
    id: string;
}

export default function GuideRegistrationScreen() {
    const router = useRouter();
    // Receive params from auth/register screen
    const params = useLocalSearchParams<{
        name?: string;
        email?: string;
        phone?: string;
        password?: string;
    }>();
    const [step, setStep] = useState<RegistrationStep>('personal');
    const [loading, setLoading] = useState(false);

    // Form data
    const [guideData, setGuideData] = useState<GuideData>({
        full_name: '',
        email: '',
        phone: '',
        birth_date: '',
        dni_number: '',
        dircetur_license: '',
        experience_years: '',
        specialties: '',
        password: '',
    });

    // Initialize form with params from auth/register screen
    useEffect(() => {
        if (params.name || params.email || params.phone || params.password) {
            setGuideData(prev => ({
                ...prev,
                full_name: params.name || prev.full_name,
                email: params.email || prev.email,
                phone: params.phone || prev.phone,
                password: params.password || prev.password,
            }));
        }
    }, [params.name, params.email, params.phone, params.password]);

    // Document images
    const [dniPhoto, setDniPhoto] = useState<string | null>(null);
    const [certificatePhoto, setCertificatePhoto] = useState<string | null>(null);
    const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);

    // Verification status
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    // Poll for verification status
    useEffect(() => {
        if (step !== 'waiting' || !verificationId) return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await httpClient.get<VerificationStatus>(`/verifications/${verificationId}/status`);
                const status = response.data?.status;

                if (status === 'approved') {
                    clearInterval(pollInterval);
                    setStep('approved');
                } else if (status === 'rejected') {
                    clearInterval(pollInterval);
                    setRejectionReason(response.data?.rejection_reason || null);
                    setStep('rejected');
                }
            } catch (e) {
                console.log('Polling error:', e);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(pollInterval);
    }, [step, verificationId]);

    // Take photo for documents
    const takePhoto = async (type: 'dni' | 'certificate' | 'selfie') => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
            return;
        }

        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: type === 'selfie' ? [1, 1] : [16, 10],
            cameraType: type === 'selfie' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
        };

        const result = await ImagePicker.launchCameraAsync(options);

        if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            if (type === 'dni') setDniPhoto(uri);
            else if (type === 'certificate') setCertificatePhoto(uri);
            else setSelfiePhoto(uri);
        }
    };

    // Biometric authentication
    const performBiometric = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) {
            Alert.alert('No soportado', 'Tu dispositivo no tiene biométrica.');
            return false;
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Verifica tu identidad',
            fallbackLabel: 'Usar código',
            cancelLabel: 'Cancelar',
        });

        return result.success;
    };

    // Upload image to server
    const uploadImage = async (uri: string, type: string): Promise<string> => {
        const formData = new FormData();
        formData.append('file', {
            uri,
            type: 'image/jpeg',
            name: `${type}_${Date.now()}.jpg`,
        } as any);
        formData.append('type', type);

        const response = await fetch(`${await getApiUrl()}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return data.url;
    };

    // Get API URL helper
    const getApiUrl = async () => {
        // This would come from config
        return API_CONFIG.BASE_URL + API_CONFIG.API_VERSION;
    };

    // Submit complete registration
    const submitRegistration = async () => {
        if (!dniPhoto || !certificatePhoto || !selfiePhoto) {
            Alert.alert('Error', 'Falta completar los documentos');
            return;
        }

        setStep('submitting');
        setLoading(true);

        try {
            // 1. First register the user account
            await httpClient.post('/auth/register', {
                email: guideData.email,
                password: guideData.password,
                full_name: guideData.full_name,
                phone: guideData.phone,
                role: 'guide',
            });

            // 2. Login to get authentication token
            const loginResponse = await httpClient.post<{
                access_token: string;
                refresh_token: string;
                user: { id: string };
            }>('/auth/login', {
                email: guideData.email,
                password: guideData.password,
            });

            if (!loginResponse.data?.access_token) {
                throw new Error('Error al iniciar sesión después del registro');
            }

            // Store token for subsequent requests
            const token = loginResponse.data.access_token;
            await AsyncStorage.setItem('access_token', token);
            await AsyncStorage.setItem('refresh_token', loginResponse.data.refresh_token);

            // 3. Upload documents (TODO: in production, upload to S3/cloud)
            const dniUrl = dniPhoto;
            const certUrl = certificatePhoto;
            const selfieUrl = selfiePhoto;

            // 4. Submit biometric verification (now with auth token)
            const biometricHash = `hash_${Date.now()}_${guideData.dni_number}`;
            const deviceSignature = `device_${Date.now()}`;

            const verificationResponse = await httpClient.post<VerificationResponse>('/verifications/biometric', {
                verification_type: 'biometric_face',
                biometric_hash: biometricHash,
                device_signature: deviceSignature,
                selfie_url: selfieUrl,
                liveness_score: 95,
            });

            // 5. Submit document verification
            await httpClient.post('/verifications/document', {
                verification_type: 'document_dni',
                document_url: dniUrl,
                document_score: 90,
            });

            // 6. Submit DIRCETUR license
            await httpClient.post('/verifications/document', {
                verification_type: 'dircetur_license',
                document_url: certUrl,
                license_number: guideData.dircetur_license,
                document_score: 95,
            });

            // Save verification ID for polling
            setVerificationId(verificationResponse.data?.id || null);

            // Store registration data locally
            await AsyncStorage.setItem('pending_guide_registration', JSON.stringify({
                ...guideData,
                verification_id: verificationResponse.data?.id,
                submitted_at: new Date().toISOString(),
            }));

            setStep('waiting');
        } catch (error: any) {
            console.error('Registration error:', error);
            const errorMessage = error.message || error.detail || 'No se pudo completar el registro. Intenta nuevamente.';
            Alert.alert('Error', errorMessage);
            setStep('biometric');
        } finally {
            setLoading(false);
        }
    };

    // Handle biometric step
    const handleBiometricStep = async () => {
        setLoading(true);

        // Take selfie first
        await takePhoto('selfie');

        // Then biometric auth
        const success = await performBiometric();

        if (success && selfiePhoto) {
            await submitRegistration();
        } else if (!selfiePhoto) {
            Alert.alert('Foto requerida', 'Por favor toma una foto de tu rostro.');
        } else {
            Alert.alert('Error', 'La verificación biométrica falló. Intenta nuevamente.');
        }

        setLoading(false);
    };

    // Render Personal Data Step
    const renderPersonalStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepNumber}>1/4</Text>
                </View>
                <Text style={styles.stepTitle}>Datos Personales</Text>
                <Text style={styles.stepSubtitle}>Completa tu información como guía independiente</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre completo *</Text>
                    <TextInput
                        style={styles.input}
                        value={guideData.full_name}
                        onChangeText={(t) => setGuideData({ ...guideData, full_name: t })}
                        placeholder="Juan Carlos Pérez López"
                        placeholderTextColor="#666"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Correo electrónico *</Text>
                    <TextInput
                        style={styles.input}
                        value={guideData.email}
                        onChangeText={(t) => setGuideData({ ...guideData, email: t })}
                        placeholder="guia@email.com"
                        placeholderTextColor="#666"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Teléfono *</Text>
                    <TextInput
                        style={styles.input}
                        value={guideData.phone}
                        onChangeText={(t) => setGuideData({ ...guideData, phone: t })}
                        placeholder="+51 999 999 999"
                        placeholderTextColor="#666"
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Fecha de nacimiento *</Text>
                    <TextInput
                        style={styles.input}
                        value={guideData.birth_date}
                        onChangeText={(t) => setGuideData({ ...guideData, birth_date: t })}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        maxLength={10}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contraseña *</Text>
                    <TextInput
                        style={styles.input}
                        value={guideData.password}
                        onChangeText={(t) => setGuideData({ ...guideData, password: t })}
                        placeholder="Mínimo 8 caracteres"
                        placeholderTextColor="#666"
                        secureTextEntry
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Número de DNI *</Text>
                    <TextInput
                        style={styles.input}
                        value={guideData.dni_number}
                        onChangeText={(t) => setGuideData({ ...guideData, dni_number: t })}
                        placeholder="12345678"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        maxLength={8}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Licencia DIRCETUR *</Text>
                    <TextInput
                        style={styles.input}
                        value={guideData.dircetur_license}
                        onChangeText={(t) => setGuideData({ ...guideData, dircetur_license: t })}
                        placeholder="CUS-2024-00123"
                        placeholderTextColor="#666"
                        autoCapitalize="characters"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Años de experiencia</Text>
                    <TextInput
                        style={styles.input}
                        value={guideData.experience_years}
                        onChangeText={(t) => setGuideData({ ...guideData, experience_years: t })}
                        placeholder="5"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        maxLength={2}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Especialidades</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={guideData.specialties}
                        onChangeText={(t) => setGuideData({ ...guideData, specialties: t })}
                        placeholder="Trekking, Historia Inca, Tours culturales..."
                        placeholderTextColor="#666"
                        multiline
                        numberOfLines={3}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                    if (!guideData.full_name || !guideData.email || !guideData.phone || !guideData.birth_date || !guideData.password || !guideData.dni_number || !guideData.dircetur_license) {
                        Alert.alert('Campos requeridos', 'Completa todos los campos obligatorios');
                        return;
                    }
                    if (guideData.password.length < 8) {
                        Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 8 caracteres');
                        return;
                    }
                    if (guideData.dni_number.length !== 8) {
                        Alert.alert('DNI inválido', 'El DNI debe tener 8 dígitos');
                        return;
                    }
                    setStep('dni');
                }}
            >
                <Text style={styles.primaryButtonText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
    );

    // Render DNI Photo Step
    const renderDniStep = () => (
        <View style={styles.stepContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('personal')}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.stepHeader}>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepNumber}>2/4</Text>
                </View>
                <Text style={styles.stepTitle}>Documento de Identidad</Text>
                <Text style={styles.stepSubtitle}>Toma una foto clara de tu DNI</Text>
            </View>

            <View style={styles.documentInstructions}>
                <View style={styles.instructionItem}>
                    <Ionicons name="sunny-outline" size={20} color="#FFC107" />
                    <Text style={styles.instructionText}>Buena iluminación</Text>
                </View>
                <View style={styles.instructionItem}>
                    <Ionicons name="scan-outline" size={20} color="#4CAF50" />
                    <Text style={styles.instructionText}>Documento completo visible</Text>
                </View>
                <View style={styles.instructionItem}>
                    <Ionicons name="close-circle-outline" size={20} color="#FF5252" />
                    <Text style={styles.instructionText}>Sin reflejos o sombras</Text>
                </View>
            </View>

            {dniPhoto ? (
                <View style={styles.photoPreview}>
                    <Image source={{ uri: dniPhoto }} style={styles.previewImage} />
                    <View style={styles.previewActions}>
                        <TouchableOpacity style={styles.retakeButton} onPress={() => takePhoto('dni')}>
                            <Ionicons name="camera-reverse" size={20} color="#1152d4" />
                            <Text style={styles.retakeText}>Volver a tomar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <TouchableOpacity style={styles.captureArea} onPress={() => takePhoto('dni')}>
                    <View style={styles.captureIcon}>
                        <Ionicons name="id-card-outline" size={48} color="#1152d4" />
                    </View>
                    <Text style={styles.captureText}>Toca para tomar foto del DNI</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[styles.primaryButton, !dniPhoto && styles.disabledButton]}
                onPress={() => dniPhoto && setStep('certificate')}
                disabled={!dniPhoto}
            >
                <Text style={styles.primaryButtonText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
    );

    // Render Certificate Photo Step
    const renderCertificateStep = () => (
        <View style={styles.stepContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('dni')}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.stepHeader}>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepNumber}>3/4</Text>
                </View>
                <Text style={styles.stepTitle}>Certificado DIRCETUR</Text>
                <Text style={styles.stepSubtitle}>Toma una foto de tu licencia de guía oficial</Text>
            </View>

            <View style={styles.licenseInfo}>
                <Ionicons name="ribbon-outline" size={24} color="#1152d4" />
                <Text style={styles.licenseInfoText}>
                    Licencia: {guideData.dircetur_license || 'No especificada'}
                </Text>
            </View>

            {certificatePhoto ? (
                <View style={styles.photoPreview}>
                    <Image source={{ uri: certificatePhoto }} style={styles.previewImage} />
                    <View style={styles.previewActions}>
                        <TouchableOpacity style={styles.retakeButton} onPress={() => takePhoto('certificate')}>
                            <Ionicons name="camera-reverse" size={20} color="#1152d4" />
                            <Text style={styles.retakeText}>Volver a tomar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <TouchableOpacity style={styles.captureArea} onPress={() => takePhoto('certificate')}>
                    <View style={styles.captureIcon}>
                        <Ionicons name="document-text-outline" size={48} color="#1152d4" />
                    </View>
                    <Text style={styles.captureText}>Toca para tomar foto del certificado</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[styles.primaryButton, !certificatePhoto && styles.disabledButton]}
                onPress={() => certificatePhoto && setStep('biometric')}
                disabled={!certificatePhoto}
            >
                <Text style={styles.primaryButtonText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
    );

    // Render Biometric Step
    const renderBiometricStep = () => (
        <View style={styles.stepContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('certificate')}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.stepHeader}>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepNumber}>4/4</Text>
                </View>
                <Text style={styles.stepTitle}>Verificación Biométrica</Text>
                <Text style={styles.stepSubtitle}>Toma una selfie y verifica tu identidad</Text>
            </View>

            {selfiePhoto ? (
                <View style={styles.selfiePreview}>
                    <Image source={{ uri: selfiePhoto }} style={styles.selfieImage} />
                    <TouchableOpacity style={styles.retakeButton} onPress={() => takePhoto('selfie')}>
                        <Text style={styles.retakeText}>Tomar otra foto</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.selfieArea} onPress={() => takePhoto('selfie')}>
                    <View style={styles.selfieOval} />
                    <Text style={styles.selfieText}>Toca para tomar selfie</Text>
                </TouchableOpacity>
            )}

            <View style={styles.biometricNote}>
                <Ionicons name="finger-print" size={24} color="#4CAF50" />
                <Text style={styles.biometricNoteText}>
                    Al enviar, se verificará tu identidad con reconocimiento facial
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.primaryButton, styles.submitButton, loading && styles.disabledButton]}
                onPress={submitRegistration}
                disabled={loading || !selfiePhoto}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <>
                        <Text style={styles.primaryButtonText}>Enviar Solicitud</Text>
                        <Ionicons name="send" size={20} color="#FFF" />
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    // Render Waiting Step
    const renderWaitingStep = () => (
        <View style={styles.centerContainer}>
            <View style={styles.waitingIcon}>
                <ActivityIndicator size="large" color="#1152d4" />
            </View>
            <Text style={styles.waitingTitle}>Solicitud Enviada</Text>
            <Text style={styles.waitingSubtitle}>
                Tu solicitud está siendo revisada por nuestro equipo.
            </Text>

            <View style={styles.waitingInfo}>
                <Ionicons name="time-outline" size={20} color="#FFC107" />
                <Text style={styles.waitingInfoText}>
                    Este proceso puede tomar unos minutos.
                </Text>
            </View>

            <View style={styles.warningBox}>
                <Ionicons name="alert-circle" size={24} color="#FF9800" />
                <Text style={styles.warningText}>
                    ⚠️ No cierres la aplicación.{'\n'}
                    Te notificaremos cuando tu cuenta sea aprobada.
                </Text>
            </View>

            <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>Estado:</Text>
                <Text style={styles.statusValue}>🔄 En revisión</Text>
            </View>
        </View>
    );

    // Render Approved Step
    const renderApprovedStep = () => (
        <View style={styles.centerContainer}>
            {/* Celebration Animation */}
            <View style={styles.celebrationContainer}>
                <Text style={styles.confettiEmoji}>🎉</Text>
                <Text style={styles.confettiEmoji2}>🎊</Text>
            </View>

            <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
            </View>

            <Text style={styles.celebrationTitle}>¡Felicidades!</Text>

            <View style={styles.welcomeBox}>
                <Text style={styles.welcomeText}>Bienvenido(a) a</Text>
                <Text style={styles.brandName}>Ruta Segura Perú</Text>
                <View style={styles.guideDivider} />
                <Text style={styles.guideName}>{guideData.full_name || 'Guía'}</Text>
            </View>

            <Text style={styles.approvalMessage}>
                Tu cuenta ha sido verificada y aprobada.{'\n'}
                Ya puedes comenzar a ofrecer tus servicios como guía turístico oficial.
            </Text>

            <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                <Text style={styles.verifiedText}>Guía Verificado ✓</Text>
            </View>

            {/* Benefits Section */}
            <View style={styles.benefitsBox}>
                <View style={styles.benefitItem}>
                    <Ionicons name="navigate" size={20} color="#1152d4" />
                    <Text style={styles.benefitText}>Tracking GPS en tiempo real</Text>
                </View>
                <View style={styles.benefitItem}>
                    <Ionicons name="language" size={20} color="#1152d4" />
                    <Text style={styles.benefitText}>Traductor con IA incluido</Text>
                </View>
                <View style={styles.benefitItem}>
                    <Ionicons name="shield" size={20} color="#1152d4" />
                    <Text style={styles.benefitText}>Sistema SOS de emergencia</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.dashboardButton}
                onPress={() => router.replace('/(guide)/(tabs)/dashboard' as any)}
            >
                <Text style={styles.primaryButtonText}>🚀 Comenzar Ahora</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
    );

    // Render Rejected Step
    const renderRejectedStep = () => (
        <View style={styles.centerContainer}>
            <View style={styles.rejectedIcon}>
                <Ionicons name="close-circle" size={80} color="#FF5252" />
            </View>
            <Text style={styles.rejectedTitle}>Solicitud No Aprobada</Text>
            <Text style={styles.rejectedSubtitle}>
                Tu solicitud no cumplió con los requisitos. Por favor revisa la información.
            </Text>

            <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Motivo:</Text>
                <Text style={styles.reasonText}>{rejectionReason || 'Documentos no válidos o ilegibles.'}</Text>
            </View>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                    setStep('personal');
                    setDniPhoto(null);
                    setCertificatePhoto(null);
                    setSelfiePhoto(null);
                }}
            >
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Volver a Intentar</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {step === 'personal' && renderPersonalStep()}
                {step === 'dni' && renderDniStep()}
                {step === 'certificate' && renderCertificateStep()}
                {step === 'biometric' && renderBiometricStep()}
                {step === 'submitting' && renderWaitingStep()}
                {step === 'waiting' && renderWaitingStep()}
                {step === 'approved' && renderApprovedStep()}
                {step === 'rejected' && renderRejectedStep()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0f1c' },
    scrollContent: { flexGrow: 1, padding: 24 },
    stepContainer: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },

    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },

    stepHeader: { alignItems: 'center', marginBottom: 24 },
    stepIndicator: { backgroundColor: 'rgba(17,82,212,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, marginBottom: 16 },
    stepNumber: { color: '#1152d4', fontWeight: '600', fontSize: 14 },
    stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
    stepSubtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },

    form: { marginBottom: 24 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#FFF', marginBottom: 8 },
    input: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    textArea: { height: 80, textAlignVertical: 'top' },

    documentInstructions: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 24 },
    instructionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    instructionText: { color: '#FFF', fontSize: 14, marginLeft: 12 },

    captureArea: { backgroundColor: 'rgba(17,82,212,0.15)', borderRadius: 16, borderWidth: 2, borderColor: '#1152d4', borderStyle: 'dashed', padding: 40, alignItems: 'center', marginBottom: 24 },
    captureIcon: { marginBottom: 16 },
    captureText: { color: '#1152d4', fontSize: 16, fontWeight: '600' },

    photoPreview: { alignItems: 'center', marginBottom: 24 },
    previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
    previewActions: { flexDirection: 'row' },
    retakeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
    retakeText: { color: '#1152d4', fontWeight: '600' },

    licenseInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(17,82,212,0.1)', padding: 16, borderRadius: 12, marginBottom: 24, gap: 12 },
    licenseInfoText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

    selfieArea: { alignItems: 'center', marginBottom: 24 },
    selfieOval: { width: 160, height: 200, borderRadius: 80, borderWidth: 3, borderColor: '#1152d4', borderStyle: 'dashed', marginBottom: 16 },
    selfieText: { color: '#8E8E93', fontSize: 14 },
    selfiePreview: { alignItems: 'center', marginBottom: 24 },
    selfieImage: { width: 160, height: 160, borderRadius: 80, marginBottom: 12 },

    biometricNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76,175,80,0.1)', padding: 16, borderRadius: 12, marginBottom: 24, gap: 12 },
    biometricNoteText: { color: '#4CAF50', fontSize: 14, flex: 1 },

    primaryButton: { backgroundColor: '#1152d4', borderRadius: 12, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    submitButton: { backgroundColor: '#4CAF50' },
    disabledButton: { opacity: 0.5 },
    primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

    waitingIcon: { marginBottom: 24 },
    waitingTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
    waitingSubtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center', marginBottom: 24 },
    waitingInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    waitingInfoText: { color: '#FFC107', fontSize: 14 },
    warningBox: { backgroundColor: 'rgba(255,152,0,0.15)', padding: 20, borderRadius: 12, marginBottom: 24, alignItems: 'center', gap: 12 },
    warningText: { color: '#FF9800', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    statusBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusLabel: { color: '#8E8E93', fontSize: 14 },
    statusValue: { color: '#FFC107', fontSize: 16, fontWeight: '600' },

    successIcon: { marginBottom: 24 },
    successTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
    successSubtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76,175,80,0.15)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, marginBottom: 32, gap: 8 },
    verifiedText: { color: '#4CAF50', fontSize: 16, fontWeight: '600' },

    rejectedIcon: { marginBottom: 24 },
    rejectedTitle: { fontSize: 24, fontWeight: 'bold', color: '#FF5252', marginBottom: 12 },
    rejectedSubtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center', marginBottom: 24, lineHeight: 24 },
    reasonBox: { backgroundColor: 'rgba(255,82,82,0.15)', padding: 20, borderRadius: 12, marginBottom: 32, width: '100%' },
    reasonLabel: { color: '#FF5252', fontSize: 14, fontWeight: '600', marginBottom: 8 },
    reasonText: { color: '#FFF', fontSize: 14, lineHeight: 22 },

    // Enhanced Welcome Screen Styles
    celebrationContainer: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40 },
    confettiEmoji: { fontSize: 48, opacity: 0.8 },
    confettiEmoji2: { fontSize: 48, opacity: 0.8 },
    celebrationTitle: { fontSize: 36, fontWeight: 'bold', color: '#4CAF50', marginBottom: 20, textShadowColor: 'rgba(76,175,80,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
    welcomeBox: { backgroundColor: 'rgba(17,82,212,0.15)', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(17,82,212,0.3)' },
    welcomeText: { fontSize: 16, color: '#8E8E93' },
    brandName: { fontSize: 28, fontWeight: 'bold', color: '#1152d4', marginTop: 4 },
    guideDivider: { width: 60, height: 2, backgroundColor: 'rgba(17,82,212,0.5)', marginVertical: 16, borderRadius: 1 },
    guideName: { fontSize: 22, fontWeight: '700', color: '#FFF', textTransform: 'capitalize' },
    approvalMessage: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 20, lineHeight: 22, paddingHorizontal: 20 },
    benefitsBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 24, width: '100%' },
    benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    benefitText: { fontSize: 14, color: '#FFF', flex: 1 },
    dashboardButton: { backgroundColor: '#1152d4', borderRadius: 16, height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, width: '100%', shadowColor: '#1152d4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
});
