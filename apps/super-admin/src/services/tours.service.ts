import api from './api';

export interface Tour {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_hours: number;
    status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
    agency_name?: string;
    current_bookings: number;
    image_url?: string;
    cover_image_url?: string;
    gallery_urls?: string[];
    video_url?: string;
    location: string;
    category: string;
    difficulty: string;
    max_capacity: number;
    rating?: number;
    reviews_count?: number;
    is_featured?: boolean;
}

export interface CreateTourData {
    name: string;
    description: string;
    price: number;
    duration_hours: number;
    max_capacity: number;
    difficulty: string;
    category: string;
    start_location?: string;
    cover_image_url?: string;
    gallery_urls?: string[];
    video_url?: string;
    is_featured?: boolean;
}


export const toursService = {
    async getAll(): Promise<Tour[]> {
        // In a real app, this would fetch from backend
        // For now, we mock it or call the actual endpoint
        try {
            const response = await api.get('/tours');
            return response.data.items;
        } catch (error) {
            console.warn('Using mock data for tours');
            return [
                {
                    id: '1',
                    name: 'Machu Picchu Sunrise',
                    description: 'Early morning experience',
                    price: 120,
                    duration_hours: 8,
                    status: 'published',
                    agency_name: 'Ruta Segura',
                    current_bookings: 5,
                    location: 'Cusco',
                    category: 'adventure',
                    difficulty: 'moderate',
                    max_capacity: 15
                },
                {
                    id: '2',
                    name: 'Sacred Valley Express',
                    description: 'Quick tour',
                    price: 85,
                    duration_hours: 6,
                    status: 'draft',
                    agency_name: 'Inca Treks',
                    current_bookings: 0,
                    location: 'Cusco',
                    category: 'culture',
                    difficulty: 'easy',
                    max_capacity: 20
                }
            ];
        }
    },

    async create(data: CreateTourData): Promise<Tour> {
        const response = await api.post('/tours', data);
        return response.data;
    },

    async update(id: string, data: Partial<CreateTourData>): Promise<Tour> {
        const response = await api.patch(`/tours/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/tours/${id}`);
    }
};
