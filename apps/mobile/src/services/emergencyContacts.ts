/**
 * Ruta Segura Perú - Emergency Contacts Service
 * Frontend API client for emergency contact management
 */
import api from './api';

export interface EmergencyContact {
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
    language: string;
    country_code: string;
    created_at: string;
}

export interface EmergencyContactListResponse {
    items: EmergencyContact[];
    total: number;
    max_allowed: number;
}

export interface CreateContactData {
    name: string;
    phone_e164: string;
    email?: string;
    relationship?: string;
    notification_channel?: string;
    language?: string;
    country_code?: string;
    is_primary?: boolean;
}

export interface UpdateContactData extends Partial<CreateContactData> {
    priority?: number;
}

class EmergencyContactsService {
    /**
     * Get all emergency contacts for current user
     */
    async list(): Promise<EmergencyContactListResponse> {
        const response = await api.get<EmergencyContactListResponse>(
            '/api/v1/emergency-contacts'
        );
        return response.data;
    }

    /**
     * Create a new emergency contact
     */
    async create(data: CreateContactData): Promise<EmergencyContact> {
        const response = await api.post<EmergencyContact>(
            '/api/v1/emergency-contacts',
            data
        );
        return response.data;
    }

    /**
     * Update an existing contact
     */
    async update(contactId: string, data: UpdateContactData): Promise<EmergencyContact> {
        const response = await api.put<EmergencyContact>(
            `/api/v1/emergency-contacts/${contactId}`,
            data
        );
        return response.data;
    }

    /**
     * Delete a contact
     */
    async delete(contactId: string): Promise<void> {
        await api.delete(`/api/v1/emergency-contacts/${contactId}`);
    }

    /**
     * Reorder contacts (priority)
     */
    async reorder(contactIds: string[]): Promise<EmergencyContactListResponse> {
        const response = await api.post<EmergencyContactListResponse>(
            '/api/v1/emergency-contacts/reorder',
            contactIds
        );
        return response.data;
    }

    /**
     * Send verification code to contact
     */
    async sendVerification(contactId: string): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(
            `/api/v1/emergency-contacts/${contactId}/verify`
        );
        return response.data;
    }

    /**
     * Format phone number to E.164
     */
    formatToE164(phone: string, countryCode: string = 'PE'): string {
        // Remove all non-digit chars except +
        let cleaned = phone.replace(/[^\d+]/g, '');

        // Country code prefixes
        const countryCodes: Record<string, string> = {
            PE: '+51',
            US: '+1',
            MX: '+52',
            CO: '+57',
            AR: '+54',
            CL: '+56',
            BR: '+55',
            EC: '+593',
            BO: '+591',
        };

        if (!cleaned.startsWith('+')) {
            // Remove leading zeros
            cleaned = cleaned.replace(/^0+/, '');
            // Add country code
            cleaned = (countryCodes[countryCode] || '+51') + cleaned;
        }

        return cleaned;
    }

    /**
     * Validate E.164 format
     */
    isValidE164(phone: string): boolean {
        const e164Regex = /^\+[1-9]\d{6,14}$/;
        return e164Regex.test(phone);
    }
}

export const emergencyContactsService = new EmergencyContactsService();
export default emergencyContactsService;
