/**
 * Ruta Segura Perú - Trust Circle Screen (Mi Círculo de Confianza)
 * Emergency contacts management with international phone validation
 */
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import type { TrustCircleContact } from '../../src/features/tourist/types';
import { emergencyContactsService } from '../../src/services/emergencyContacts';

interface EmergencyContact {
    id: string;
    name: string;
    phone_e164: string;
    phone_display: string;
    email: string | null;
    relationship: string;
    notification_channel: string;
    is_primary: boolean;
    is_verified: boolean;
    priority: number;
}

type Relationship = 'family' | 'friend' | 'spouse' | 'parent' | 'sibling' | 'coworker' | 'embassy' | 'other';

const RELATIONSHIPS: { value: Relationship; label: string; icon: string }[] = [
    { value: 'family', label: 'Familiar', icon: 'people' },
    { value: 'spouse', label: 'Pareja', icon: 'heart' },
    { value: 'parent', label: 'Padre/Madre', icon: 'person' },
    { value: 'sibling', label: 'Hermano/a', icon: 'git-branch' },
    { value: 'friend', label: 'Amigo/a', icon: 'happy' },
    { value: 'coworker', label: 'Colega', icon: 'briefcase' },
    { value: 'embassy', label: 'Embajada', icon: 'flag' },
    { value: 'other', label: 'Otro', icon: 'ellipsis-horizontal' },
];

const NOTIFICATION_CHANNELS = [
    { value: 'sms', label: 'SMS', icon: 'chatbox' },
    { value: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
    { value: 'both', label: 'Ambos', icon: 'notifications' },
];

export default function TrustCircleScreen() {
    const router = useRouter();
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
    const maxContacts = 5;

    // Form state
    const [formName, setFormName] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formRelationship, setFormRelationship] = useState<Relationship>('family');
    const [formChannel, setFormChannel] = useState('sms');
    const [formIsPrimary, setFormIsPrimary] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        setLoading(true);
        try {
            const response = await emergencyContactsService.list();
            // Map to ensure types match local EmergencyContact interface
            const mappedContacts: EmergencyContact[] = response.items.map((item: TrustCircleContact) => ({
                id: item.id,
                name: item.name,
                phone_e164: item.phone_e164 || item.phone,
                phone_display: item.phone_display || item.phone,
                email: item.email,
                relationship: item.relationship,
                notification_channel: item.notification_channel || 'sms',
                is_primary: item.is_primary,
                is_verified: item.is_verified || false,
                priority: item.priority || 0
            }));
            setContacts(mappedContacts);
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormName('');
        setFormPhone('');
        setFormEmail('');
        setFormRelationship('family');
        setFormChannel('sms');
        setFormIsPrimary(false);
        setEditingContact(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowAddModal(true);
    };

    const openEditModal = (contact: EmergencyContact) => {
        setEditingContact(contact);
        setFormName(contact.name);
        setFormPhone(contact.phone_e164);
        setFormEmail(contact.email || '');
        setFormRelationship(contact.relationship as Relationship);
        setFormChannel(contact.notification_channel);
        setFormIsPrimary(contact.is_primary);
        setShowAddModal(true);
    };

    const handleSave = async () => {
        if (!formName.trim() || !formPhone.trim()) {
            Alert.alert('Error', 'Nombre y teléfono son requeridos');
            return;
        }

        setSaving(true);
        try {
            if (editingContact) {
                await emergencyContactsService.update(editingContact.id, {
                    name: formName,
                    phone_e164: formPhone,
                    email: formEmail || undefined,
                    relationship: formRelationship,
                    notification_channel: formChannel,
                    is_primary: formIsPrimary,
                });
            } else {
                await emergencyContactsService.create({
                    name: formName,
                    phone_e164: formPhone,
                    email: formEmail || undefined,
                    relationship: formRelationship,
                    notification_channel: formChannel,
                    is_primary: formIsPrimary,
                });
            }

            setShowAddModal(false);
            resetForm();
            loadContacts();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo guardar el contacto');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (contact: EmergencyContact) => {
        Alert.alert(
            'Eliminar Contacto',
            `¿Eliminar a ${contact.name} de tu círculo de confianza?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await emergencyContactsService.delete(contact.id);
                            loadContacts();
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar el contacto');
                        }
                    },
                },
            ]
        );
    };

    const importFromPhoneContacts = async () => {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso Denegado', 'Necesitamos acceso a tus contactos para importar');
            return;
        }

        const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });

        if (data.length > 0) {
            // Show contact picker (simplified - in production use a proper picker)
            const selectedContact = data[0]; // Just demo with first contact
            if (selectedContact.phoneNumbers?.[0]) {
                setFormName(selectedContact.name || '');
                setFormPhone(selectedContact.phoneNumbers[0].number || '');
                if (selectedContact.emails?.[0]) {
                    setFormEmail(selectedContact.emails[0].email || '');
                }
            }
        }
    };

    const formatPhone = (phone: string) => {
        // Auto-format as user types
        let cleaned = phone.replace(/[^\d+]/g, '');
        if (!cleaned.startsWith('+')) {
            cleaned = '+51' + cleaned;
        }
        return cleaned;
    };

    const getRelationshipIcon = (relationship: string) => {
        const rel = RELATIONSHIPS.find(r => r.value === relationship);
        return rel?.icon || 'person';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Círculo de Confianza</Text>
                <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{contacts.length}/{maxContacts}</Text>
                </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
                <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                <Text style={styles.infoText}>
                    Estos contactos serán notificados automáticamente cuando actives el SOS.
                    Recibirán tu ubicación en tiempo real.
                </Text>
            </View>

            {/* Contacts List */}
            <ScrollView style={styles.contactsList}>
                {contacts.map((contact, index) => (
                    <TouchableOpacity
                        key={contact.id}
                        style={[
                            styles.contactCard,
                            contact.is_primary && styles.primaryContactCard,
                        ]}
                        onPress={() => openEditModal(contact)}
                    >
                        <View style={styles.contactAvatar}>
                            <Ionicons
                                name={getRelationshipIcon(contact.relationship) as any}
                                size={24}
                                color="#FFFFFF"
                            />
                        </View>

                        <View style={styles.contactInfo}>
                            <View style={styles.contactNameRow}>
                                <Text style={styles.contactName}>{contact.name}</Text>
                                {contact.is_primary && (
                                    <View style={styles.primaryBadge}>
                                        <Text style={styles.primaryBadgeText}>Principal</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.contactPhone}>{contact.phone_display}</Text>
                            <View style={styles.contactMeta}>
                                <Ionicons
                                    name={contact.notification_channel === 'whatsapp' ? 'logo-whatsapp' : 'chatbox'}
                                    size={14}
                                    color="#8E8E93"
                                />
                                <Text style={styles.contactMetaText}>
                                    {RELATIONSHIPS.find(r => r.value === contact.relationship)?.label || 'Otro'}
                                </Text>
                                {contact.is_verified && (
                                    <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                                )}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDelete(contact)}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF5252" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}

                {contacts.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color="#8E8E93" />
                        <Text style={styles.emptyTitle}>Sin contactos de emergencia</Text>
                        <Text style={styles.emptyText}>
                            Agrega hasta 5 personas de confianza que serán notificadas cuando actives el SOS.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Add Button */}
            {contacts.length < maxContacts && (
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Agregar Contacto</Text>
                </TouchableOpacity>
            )}

            {/* Add/Edit Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            {/* Name */}
                            <Text style={styles.inputLabel}>Nombre *</Text>
                            <TextInput
                                style={styles.input}
                                value={formName}
                                onChangeText={setFormName}
                                placeholder="Nombre completo"
                                placeholderTextColor="#8E8E93"
                            />

                            {/* Phone */}
                            <Text style={styles.inputLabel}>Teléfono (formato internacional) *</Text>
                            <View style={styles.phoneInputRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={formPhone}
                                    onChangeText={(text) => setFormPhone(formatPhone(text))}
                                    placeholder="+51 987 654 321"
                                    placeholderTextColor="#8E8E93"
                                    keyboardType="phone-pad"
                                />
                                <TouchableOpacity
                                    style={styles.importButton}
                                    onPress={importFromPhoneContacts}
                                >
                                    <Ionicons name="person-add" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            {/* Email (optional) */}
                            <Text style={styles.inputLabel}>Email (opcional)</Text>
                            <TextInput
                                style={styles.input}
                                value={formEmail}
                                onChangeText={setFormEmail}
                                placeholder="email@ejemplo.com"
                                placeholderTextColor="#8E8E93"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            {/* Relationship */}
                            <Text style={styles.inputLabel}>Relación</Text>
                            <View style={styles.chipContainer}>
                                {RELATIONSHIPS.map((rel) => (
                                    <TouchableOpacity
                                        key={rel.value}
                                        style={[
                                            styles.chip,
                                            formRelationship === rel.value && styles.chipSelected,
                                        ]}
                                        onPress={() => setFormRelationship(rel.value)}
                                    >
                                        <Ionicons
                                            name={rel.icon as any}
                                            size={16}
                                            color={formRelationship === rel.value ? '#FFFFFF' : '#8E8E93'}
                                        />
                                        <Text
                                            style={[
                                                styles.chipText,
                                                formRelationship === rel.value && styles.chipTextSelected,
                                            ]}
                                        >
                                            {rel.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Notification Channel */}
                            <Text style={styles.inputLabel}>Notificar por</Text>
                            <View style={styles.channelContainer}>
                                {NOTIFICATION_CHANNELS.map((ch) => (
                                    <TouchableOpacity
                                        key={ch.value}
                                        style={[
                                            styles.channelOption,
                                            formChannel === ch.value && styles.channelSelected,
                                        ]}
                                        onPress={() => setFormChannel(ch.value)}
                                    >
                                        <Ionicons
                                            name={ch.icon as any}
                                            size={24}
                                            color={formChannel === ch.value ? '#FF6B35' : '#8E8E93'}
                                        />
                                        <Text
                                            style={[
                                                styles.channelText,
                                                formChannel === ch.value && styles.channelTextSelected,
                                            ]}
                                        >
                                            {ch.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Primary Contact Toggle */}
                            <TouchableOpacity
                                style={styles.primaryToggle}
                                onPress={() => setFormIsPrimary(!formIsPrimary)}
                            >
                                <Ionicons
                                    name={formIsPrimary ? 'checkbox' : 'square-outline'}
                                    size={24}
                                    color={formIsPrimary ? '#FF6B35' : '#8E8E93'}
                                />
                                <View style={styles.primaryToggleText}>
                                    <Text style={styles.primaryToggleLabel}>
                                        Marcar como contacto principal
                                    </Text>
                                    <Text style={styles.primaryToggleHint}>
                                        Será notificado primero en emergencias
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </ScrollView>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    {editingContact ? 'Guardar Cambios' : 'Agregar Contacto'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#1E1E1E',
    },
    headerTitle: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 16,
    },
    headerBadge: {
        backgroundColor: 'rgba(255, 107, 53, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    headerBadgeText: {
        color: '#FF6B35',
        fontSize: 14,
        fontWeight: '600',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    infoText: {
        flex: 1,
        color: '#CCCCCC',
        fontSize: 14,
        marginLeft: 12,
        lineHeight: 20,
    },
    contactsList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    primaryContactCard: {
        borderWidth: 1,
        borderColor: '#FF6B35',
    },
    contactAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
        marginLeft: 12,
    },
    contactNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    primaryBadge: {
        backgroundColor: 'rgba(255, 107, 53, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    primaryBadgeText: {
        color: '#FF6B35',
        fontSize: 10,
        fontWeight: '600',
    },
    contactPhone: {
        color: '#CCCCCC',
        fontSize: 14,
        marginTop: 2,
    },
    contactMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    contactMetaText: {
        color: '#8E8E93',
        fontSize: 12,
    },
    deleteButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B35',
        margin: 16,
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2C',
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    modalForm: {
        padding: 20,
    },
    inputLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#2C2C2C',
        borderRadius: 12,
        padding: 16,
        color: '#FFFFFF',
        fontSize: 16,
    },
    phoneInputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    importButton: {
        backgroundColor: '#FF6B35',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'center',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2C',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    chipSelected: {
        backgroundColor: '#FF6B35',
    },
    chipText: {
        color: '#8E8E93',
        fontSize: 13,
    },
    chipTextSelected: {
        color: '#FFFFFF',
    },
    channelContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    channelOption: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#2C2C2C',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    channelSelected: {
        borderWidth: 2,
        borderColor: '#FF6B35',
    },
    channelText: {
        color: '#8E8E93',
        fontSize: 13,
    },
    channelTextSelected: {
        color: '#FF6B35',
    },
    primaryToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        gap: 12,
    },
    primaryToggleText: {
        flex: 1,
    },
    primaryToggleLabel: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    primaryToggleHint: {
        color: '#8E8E93',
        fontSize: 12,
        marginTop: 2,
    },
    saveButton: {
        backgroundColor: '#FF6B35',
        margin: 20,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
