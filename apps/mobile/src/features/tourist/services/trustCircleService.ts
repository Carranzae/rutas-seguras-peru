/**
 * Ruta Segura Perú - Trust Circle Service
 * Emergency contacts management for tourists
 */
import { httpClient } from '@/src/core/api';
import type { TrustCircleContact } from '../types';

class TrustCircleService {
    private readonly endpoint = '/users/emergency-contacts';

    /**
     * Get trust circle contacts
     */
    async getContacts(): Promise<TrustCircleContact[]> {
        const response = await httpClient.get<TrustCircleContact[]>(this.endpoint);
        return response.data;
    }

    /**
     * Add contact to trust circle
     */
    async addContact(contact: Omit<TrustCircleContact, 'id'>): Promise<TrustCircleContact> {
        const response = await httpClient.post<TrustCircleContact>(
            this.endpoint,
            contact
        );
        return response.data;
    }

    /**
     * Update contact
     */
    async updateContact(
        contactId: string,
        data: Partial<TrustCircleContact>
    ): Promise<TrustCircleContact> {
        const response = await httpClient.patch<TrustCircleContact>(
            `${this.endpoint}/${contactId}`,
            data
        );
        return response.data;
    }

    /**
     * Remove contact from trust circle
     */
    async removeContact(contactId: string): Promise<void> {
        await httpClient.delete(`${this.endpoint}/${contactId}`);
    }

    /**
     * Set primary contact
     */
    async setPrimaryContact(contactId: string): Promise<void> {
        await httpClient.post(`${this.endpoint}/${contactId}/set-primary`);
    }

    /**
     * Get primary contact
     */
    async getPrimaryContact(): Promise<TrustCircleContact | null> {
        const contacts = await this.getContacts();
        return contacts.find(c => c.is_primary) || contacts[0] || null;
    }

    // Compatibility methods for legacy screens

    /**
     * List contacts (alias for getContacts with response wrapper)
     */
    async list(): Promise<{ items: TrustCircleContact[] }> {
        const contacts = await this.getContacts();
        return { items: contacts };
    }

    /**
     * Create contact (alias for addContact)
     */
    async create(data: Partial<TrustCircleContact>): Promise<TrustCircleContact> {
        return this.addContact(data as Omit<TrustCircleContact, 'id'>);
    }

    /**
     * Update contact (alias for updateContact)
     */
    async update(contactId: string, data: Partial<TrustCircleContact>): Promise<TrustCircleContact> {
        return this.updateContact(contactId, data);
    }

    /**
     * Delete contact (alias for removeContact)
     */
    async delete(contactId: string): Promise<void> {
        return this.removeContact(contactId);
    }
}

export const trustCircleService = new TrustCircleService();
export default trustCircleService;
