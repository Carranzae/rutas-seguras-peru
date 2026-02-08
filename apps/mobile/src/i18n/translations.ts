/**
 * Ruta Segura Perú - Internationalization (i18n) System
 * Multi-language support for tourist app (default: English)
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'zh' | 'ja' | 'ko' | 'ru' | 'ar';

export interface LanguageInfo {
    code: SupportedLanguage;
    name: string;
    nativeName: string;
    flag: string;
    rtl?: boolean; // Right-to-left for Arabic
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
];

// Translation keys for the entire app
export interface Translations {
    // Common
    common: {
        welcome: string;
        continue: string;
        cancel: string;
        save: string;
        loading: string;
        error: string;
        success: string;
        search: string;
        filter: string;
        sort: string;
        back: string;
        next: string;
        done: string;
        seeAll: string;
        noResults: string;
        tryAgain: string;
    };
    // Welcome/Onboarding
    welcome: {
        title: string;
        subtitle: string;
        selectLanguage: string;
        languageHint: string;
        getStarted: string;
        explorePeruSafely: string;
    };
    // Auth
    auth: {
        login: string;
        register: string;
        email: string;
        password: string;
        confirmPassword: string;
        fullName: string;
        phone: string;
        phoneOptional: string;
        forgotPassword: string;
        noAccount: string;
        haveAccount: string;
        createAccount: string;
        loginButton: string;
        registerButton: string;
        orContinueWith: string;
        joinApp: string;
        howUseApp: string;
        tourist: string;
        guide: string;
        guideNote: string;
        minChars: string;
        accountCreated: string;
        accountCreatedMessage: string;
        required: string;
        invalidEmail: string;
        passwordRequired: string;
        passwordMinLength: string;
        passwordsNotMatch: string;
    };
    // Home/Explore
    home: {
        greeting: string;
        searchPlaceholder: string;
        featuredTours: string;
        popularDestinations: string;
        nearYou: string;
        topRated: string;
        categories: string;
        seeAllTours: string;
    };
    // Tours
    tours: {
        book: string;
        bookNow: string;
        duration: string;
        price: string;
        rating: string;
        reviews: string;
        participants: string;
        included: string;
        meetingPoint: string;
        date: string;
        time: string;
        guests: string;
        totalPrice: string;
        confirmBooking: string;
        bookingConfirmed: string;
    };
    // Safety
    safety: {
        title: string;
        subtitle: string;
        sos: string;
        slideSOS: string;
        emergencyActive: string;
        shareLocation: string;
        locationShared: string;
        locationSharedMessage: string;
        trustedContacts: string;
        safetyTips: string;
        emergencyNumbers: string;
        yourGuide: string;
        verifiedGuide: string;
        sosError: string;
        locationError: string;
        // Safety tips
        tipPhone: string;
        tipValuables: string;
        tipTaxi: string;
        tipItinerary: string;
        tipNight: string;
        tipWater: string;
    };
    // Profile
    profile: {
        title: string;
        myBookings: string;
        myReviews: string;
        settings: string;
        language: string;
        notifications: string;
        help: string;
        logout: string;
        logoutConfirm: string;
        editProfile: string;
        tours: string;
        pending: string;
        confirmed: string;
        completed: string;
        cancelled: string;
    };
    // Reviews
    reviews: {
        writeReview: string;
        yourRating: string;
        yourExperience: string;
        submit: string;
        thankYou: string;
        averageRating: string;
    };
    // Chat/Match
    match: {
        title: string;
        findTravelers: string;
        matchWith: string;
        startChat: string;
        shareExperience: string;
    };
    // Categories
    categories: {
        all: string;
        adventure: string;
        culture: string;
        food: string;
        nature: string;
        wellness: string;
    };
}

// English (default)
const en: Translations = {
    common: {
        welcome: 'Welcome',
        continue: 'Continue',
        cancel: 'Cancel',
        save: 'Save',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        back: 'Back',
        next: 'Next',
        done: 'Done',
        seeAll: 'See All',
        noResults: 'No results found',
        tryAgain: 'Try Again',
    },
    welcome: {
        title: 'Welcome to Peru',
        subtitle: 'Discover the land of the Incas safely',
        selectLanguage: 'Select your language',
        languageHint: 'The app will be displayed in your chosen language',
        getStarted: 'Get Started',
        explorePeruSafely: 'Explore Peru Safely',
    },
    auth: {
        login: 'Login',
        register: 'Register',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        fullName: 'Full Name',
        phone: 'Phone Number',
        phoneOptional: 'Phone (optional)',
        forgotPassword: 'Forgot Password?',
        noAccount: "Don't have an account?",
        haveAccount: 'Already have an account?',
        createAccount: 'Create Account',
        loginButton: 'Sign In',
        registerButton: 'Sign Up',
        orContinueWith: 'or continue with',
        joinApp: 'Join Ruta Segura Perú',
        howUseApp: 'How will you use the app?',
        tourist: 'Tourist',
        guide: 'Guide',
        guideNote: '💡 As a guide, you will need to verify your DIRCETUR license',
        minChars: 'Minimum 8 characters',
        accountCreated: 'Account Created!',
        accountCreatedMessage: 'Your account has been created successfully. Please sign in.',
        required: 'is required',
        invalidEmail: 'Invalid email',
        passwordRequired: 'Password is required',
        passwordMinLength: 'Password must be at least 8 characters',
        passwordsNotMatch: 'Passwords do not match',
    },
    home: {
        greeting: 'Hello',
        searchPlaceholder: 'Search tours, guides, destinations...',
        featuredTours: 'Featured Tours',
        popularDestinations: 'Popular Destinations',
        nearYou: 'Near You',
        topRated: 'Top Rated',
        categories: 'Categories',
        seeAllTours: 'See All Tours',
    },
    tours: {
        book: 'Book',
        bookNow: 'Book Now',
        duration: 'Duration',
        price: 'Price',
        rating: 'Rating',
        reviews: 'reviews',
        participants: 'Participants',
        included: 'Included',
        meetingPoint: 'Meeting Point',
        date: 'Date',
        time: 'Time',
        guests: 'Guests',
        totalPrice: 'Total Price',
        confirmBooking: 'Confirm Booking',
        bookingConfirmed: 'Booking Confirmed!',
    },
    safety: {
        title: 'Safety',
        subtitle: 'Your safety is our priority',
        sos: 'SOS',
        slideSOS: 'Slide for Emergency',
        emergencyActive: 'Emergency Active',
        shareLocation: 'Share Location',
        locationShared: 'Location shared',
        locationSharedMessage: 'Your location is being shared in real-time',
        trustedContacts: 'Trusted Contacts',
        safetyTips: 'Safety Tips',
        emergencyNumbers: 'Emergency Numbers',
        yourGuide: 'Your Assigned Guide',
        verifiedGuide: 'Verified Guide',
        sosError: 'Failed to activate SOS',
        locationError: 'Could not share location',
        tipPhone: 'Keep your phone charged',
        tipValuables: "Don't display valuables",
        tipTaxi: 'Use official taxis only',
        tipItinerary: 'Share your itinerary',
        tipNight: 'Avoid dark areas at night',
        tipWater: 'Drink bottled water only',
    },
    profile: {
        title: 'Profile',
        myBookings: 'My Bookings',
        myReviews: 'My Reviews',
        settings: 'Settings',
        language: 'Language',
        notifications: 'Notifications',
        help: 'Help & Support',
        logout: 'Log Out',
        logoutConfirm: 'Are you sure you want to log out?',
        editProfile: 'Edit Profile',
        tours: 'Tours',
        pending: 'Pending',
        confirmed: 'Confirmed',
        completed: 'Completed',
        cancelled: 'Cancelled',
    },
    reviews: {
        writeReview: 'Write a Review',
        yourRating: 'Your Rating',
        yourExperience: 'Share your experience',
        submit: 'Submit Review',
        thankYou: 'Thank you for your review!',
        averageRating: 'Average Rating',
    },
    match: {
        title: 'Meet Travelers',
        findTravelers: 'Find fellow travelers',
        matchWith: 'Match with',
        startChat: 'Start Chat',
        shareExperience: 'Share experiences',
    },
    categories: {
        all: 'All',
        adventure: 'Adventure',
        culture: 'Culture',
        food: 'Food',
        nature: 'Nature',
        wellness: 'Wellness',
    },
};

// Spanish
const es: Translations = {
    common: {
        welcome: 'Bienvenido',
        continue: 'Continuar',
        cancel: 'Cancelar',
        save: 'Guardar',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        search: 'Buscar',
        filter: 'Filtrar',
        sort: 'Ordenar',
        back: 'Atrás',
        next: 'Siguiente',
        done: 'Listo',
        seeAll: 'Ver Todo',
        noResults: 'Sin resultados',
        tryAgain: 'Intentar de nuevo',
    },
    welcome: {
        title: 'Bienvenido a Perú',
        subtitle: 'Descubre la tierra de los Incas de forma segura',
        selectLanguage: 'Selecciona tu idioma',
        languageHint: 'La app se mostrará en el idioma elegido',
        getStarted: 'Comenzar',
        explorePeruSafely: 'Explora Perú de forma segura',
    },
    auth: {
        login: 'Iniciar Sesión',
        register: 'Registrarse',
        email: 'Correo electrónico',
        password: 'Contraseña',
        confirmPassword: 'Confirmar contraseña',
        fullName: 'Nombre completo',
        phone: 'Teléfono',
        phoneOptional: 'Teléfono (opcional)',
        forgotPassword: '¿Olvidaste tu contraseña?',
        noAccount: '¿No tienes cuenta?',
        haveAccount: '¿Ya tienes cuenta?',
        createAccount: 'Crear cuenta',
        loginButton: 'Ingresar',
        registerButton: 'Registrarse',
        orContinueWith: 'o continúa con',
        joinApp: 'Únete a Ruta Segura Perú',
        howUseApp: '¿Cómo usarás la app?',
        tourist: 'Turista',
        guide: 'Guía',
        guideNote: '💡 Como guía, necesitarás verificar tu carnet DIRCETUR',
        minChars: 'Mínimo 8 caracteres',
        accountCreated: '¡Cuenta Creada!',
        accountCreatedMessage: 'Tu cuenta ha sido creada exitosamente. Por favor inicia sesión.',
        required: 'es requerido',
        invalidEmail: 'Correo inválido',
        passwordRequired: 'La contraseña es requerida',
        passwordMinLength: 'La contraseña debe tener al menos 8 caracteres',
        passwordsNotMatch: 'Las contraseñas no coinciden',
    },
    home: {
        greeting: 'Hola',
        searchPlaceholder: 'Buscar tours, guías, destinos...',
        featuredTours: 'Tours Destacados',
        popularDestinations: 'Destinos Populares',
        nearYou: 'Cerca de ti',
        topRated: 'Mejor Calificados',
        categories: 'Categorías',
        seeAllTours: 'Ver Todos los Tours',
    },
    tours: {
        book: 'Reservar',
        bookNow: 'Reservar Ahora',
        duration: 'Duración',
        price: 'Precio',
        rating: 'Calificación',
        reviews: 'reseñas',
        participants: 'Participantes',
        included: 'Incluido',
        meetingPoint: 'Punto de encuentro',
        date: 'Fecha',
        time: 'Hora',
        guests: 'Personas',
        totalPrice: 'Precio Total',
        confirmBooking: 'Confirmar Reserva',
        bookingConfirmed: '¡Reserva Confirmada!',
    },
    safety: {
        title: 'Seguridad',
        subtitle: 'Tu seguridad es nuestra prioridad',
        sos: 'SOS',
        slideSOS: 'Desliza para Emergencia',
        emergencyActive: 'Emergencia Activa',
        shareLocation: 'Compartir Ubicación',
        locationShared: 'Ubicación compartida',
        locationSharedMessage: 'Tu ubicación se está compartiendo en tiempo real',
        trustedContacts: 'Contactos de Confianza',
        safetyTips: 'Consejos de Seguridad',
        emergencyNumbers: 'Números de Emergencia',
        yourGuide: 'Tu Guía Asignado',
        verifiedGuide: 'Guía Verificado',
        sosError: 'Error al activar SOS',
        locationError: 'No se pudo compartir ubicación',
        tipPhone: 'Mantén tu teléfono cargado',
        tipValuables: 'No muestres objetos de valor',
        tipTaxi: 'Usa solo taxis oficiales',
        tipItinerary: 'Comparte tu itinerario',
        tipNight: 'Evita zonas oscuras de noche',
        tipWater: 'Bebe solo agua embotellada',
    },
    profile: {
        title: 'Perfil',
        myBookings: 'Mis Reservas',
        myReviews: 'Mis Reseñas',
        settings: 'Configuración',
        language: 'Idioma',
        notifications: 'Notificaciones',
        help: 'Ayuda y Soporte',
        logout: 'Cerrar Sesión',
        logoutConfirm: '¿Estás seguro que deseas cerrar sesión?',
        editProfile: 'Editar Perfil',
        tours: 'Tours',
        pending: 'Pendiente',
        confirmed: 'Confirmado',
        completed: 'Completado',
        cancelled: 'Cancelado',
    },
    reviews: {
        writeReview: 'Escribir Reseña',
        yourRating: 'Tu Calificación',
        yourExperience: 'Comparte tu experiencia',
        submit: 'Enviar Reseña',
        thankYou: '¡Gracias por tu reseña!',
        averageRating: 'Calificación Promedio',
    },
    match: {
        title: 'Conoce Viajeros',
        findTravelers: 'Encuentra otros viajeros',
        matchWith: 'Conectar con',
        startChat: 'Iniciar Chat',
        shareExperience: 'Compartir experiencias',
    },
    categories: {
        all: 'Todos',
        adventure: 'Aventura',
        culture: 'Cultura',
        food: 'Gastronomía',
        nature: 'Naturaleza',
        wellness: 'Bienestar',
    },
};

// Import complete translations for all languages
import { ar, de, fr, it, ja, ko, pt, ru, zh } from './allTranslations';

// All translations
export const translations: Record<SupportedLanguage, Translations> = {
    en,
    es,
    fr,
    de,
    pt,
    it,
    zh,
    ja,
    ko,
    ru,
    ar,
};

// Get translation for a specific language
export function getTranslation(lang: SupportedLanguage): Translations {
    return translations[lang] || translations.en;
}

