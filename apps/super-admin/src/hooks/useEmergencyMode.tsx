'use client';

import { createContext, useContext, useState } from 'react';

// Emergency Mode Context
interface EmergencyContextType {
    isEmergencyActive: boolean;
    emergencyData: EmergencyData | null;
    activateEmergency: (data: EmergencyData) => void;
    deactivateEmergency: () => void;
}

interface EmergencyData {
    id: string;
    touristName: string;
    guideName: string;
    location: { lat: number; lng: number };
    timestamp: string;
    severity: 'critical' | 'high' | 'medium';
}

const EmergencyContext = createContext<EmergencyContextType | null>(null);

export function useEmergencyMode() {
    const context = useContext(EmergencyContext);
    if (!context) {
        throw new Error('useEmergencyMode must be used within EmergencyProvider');
    }
    return context;
}

export function EmergencyProvider({ children }: { children: React.ReactNode }) {
    const [isEmergencyActive, setIsEmergencyActive] = useState(false);
    const [emergencyData, setEmergencyData] = useState<EmergencyData | null>(null);

    const activateEmergency = (data: EmergencyData) => {
        setEmergencyData(data);
        setIsEmergencyActive(true);
        // Play alert sound if available
        if (typeof window !== 'undefined') {
            try {
                const audio = new Audio('/sounds/sos-alert.mp3');
                audio.play().catch(() => { });
            } catch { }
        }
    };

    const deactivateEmergency = () => {
        setIsEmergencyActive(false);
        setEmergencyData(null);
    };

    return (
        <EmergencyContext.Provider value={{ isEmergencyActive, emergencyData, activateEmergency, deactivateEmergency }}>
            {/* Emergency Border Effect */}
            {isEmergencyActive && <div className="emergency-border" />}

            {/* Main Content */}
            <div className={isEmergencyActive ? 'emergency-active' : ''}>
                {children}
            </div>
        </EmergencyContext.Provider>
    );
}
