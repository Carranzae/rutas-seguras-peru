// Ruta Segura Perú - Type Definitions

// User Types
export interface User {
    id: string;
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: 'tourist' | 'guide' | 'agency_admin' | 'super_admin';
    createdAt: string;
    updatedAt: string;
}

export interface Tourist extends User {
    role: 'tourist';
    emergencyContacts: EmergencyContact[];
    preferredLanguage: string;
    nationality?: string;
}

export interface Guide extends User {
    role: 'guide';
    isIndependent: boolean;
    agencyId?: string;
    dircetur?: {
        cardNumber: string;
        frontImage: string;
        backImage: string;
        verified: boolean;
        verifiedAt?: string;
    };
    specialties: string[];
    languages: string[];
    rating: number;
    totalTours: number;
    isOnline: boolean;
    currentLocation?: Location;
}

export interface AgencyAdmin extends User {
    role: 'agency_admin';
    agency: Agency;
}

export interface SuperAdmin extends User {
    role: 'super_admin';
    permissions: string[];
}

// Agency Types
export interface Agency {
    id: string;
    name: string;
    ruc: string;
    legalName: string;
    address: string;
    phone: string;
    email: string;
    operatorCertificate: string;
    logo?: string;
    verified: boolean;
    verifiedAt?: string;
    createdAt: string;
}

// Tour Types
export interface Tour {
    id: string;
    title: string;
    description: string;
    category: TourCategory;
    images: string[];
    price: number;
    currency: string;
    duration: number; // in hours
    durationUnit: 'hours' | 'days';
    maxParticipants: number;
    currentParticipants: number;
    rating: number;
    reviewCount: number;
    location: {
        name: string;
        coordinates: Location;
    };
    meetingPoint: string;
    includes: string[];
    guide?: Guide;
    agency?: Agency;
    isVerified: boolean;
    isSafe: boolean;
    status: 'active' | 'inactive' | 'draft';
}

export type TourCategory =
    | 'adventure'
    | 'cultural'
    | 'historical'
    | 'food'
    | 'nature'
    | 'nightlife'
    | 'religious'
    | 'mystery';

// Emergency Types
export interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relationship: string;
    isPrimary: boolean;
}

export interface SOSAlert {
    id: string;
    userId: string;
    userType: 'tourist' | 'guide';
    location: Location;
    timestamp: string;
    status: 'active' | 'responding' | 'resolved';
    message?: string;
    batteryLevel?: number;
    respondedBy?: string;
    resolvedAt?: string;
}

// Location Types
export interface Location {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    timestamp?: string;
}

// Chat Types
export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'voice' | 'translated' | 'location' | 'image';
    originalLanguage?: string;
    translatedContent?: string;
    targetLanguage?: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'read';
}

// Notification Types
export interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: 'sos' | 'tour' | 'weather' | 'system' | 'chat';
    data?: Record<string, any>;
    read: boolean;
    createdAt: string;
}

// Active Tour Session
export interface TourSession {
    id: string;
    tourId: string;
    guideId: string;
    startTime: string;
    endTime?: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    participants: TourParticipant[];
    route: Location[];
    checkpoints: Checkpoint[];
}

export interface TourParticipant {
    id: string;
    touristId: string;
    name: string;
    avatar?: string;
    location?: Location;
    batteryLevel?: number;
    lastSeen?: string;
    status: 'confirmed' | 'checked_in' | 'active' | 'disconnected';
}

export interface Checkpoint {
    id: string;
    name: string;
    location: Location;
    arrivedAt?: string;
    notes?: string;
}

// Reports
export interface TourReport {
    id: string;
    tourSessionId: string;
    guideId: string;
    participantCount: number;
    duration: number;
    incidents: string[];
    notes: string;
    rating?: number;
    createdAt: string;
}

// Dashboard Stats
export interface DashboardStats {
    activeTours: number;
    guidesOnline: number;
    activeSOS: number;
    totalTourists: number;
    totalGuides: number;
    totalAgencies: number;
    lastUpdated: string;
}
