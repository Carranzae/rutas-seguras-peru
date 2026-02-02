# 📱 Mobile App (React Native / Expo)

## Visión General

La aplicación móvil está construida con **Expo** (React Native) y soporta dos roles:

- **Turista**: Buscar tours, reservar, SOS, traductor
- **Guía**: Gestionar tours, tracking GPS, traducción

---

## Estructura de Directorios

```
apps/mobile/
├── app/                     # Expo Router (file-based routing)
│   ├── (tourist)/           # Rutas para turistas
│   │   ├── (tabs)/          # Tab navigation
│   │   │   ├── explore.tsx  # Explorar tours
│   │   │   ├── map.tsx      # Mapa cercano
│   │   │   ├── bookings.tsx # Mis reservas
│   │   │   ├── safety.tsx   # SOS y seguridad
│   │   │   └── profile.tsx  # Perfil
│   │   └── translator.tsx   # Traductor
│   ├── (guide)/             # Rutas para guías
│   │   ├── (tabs)/          # Tab navigation
│   │   │   ├── dashboard.tsx
│   │   │   ├── tours.tsx
│   │   │   ├── translate.tsx
│   │   │   └── profile.tsx
│   │   └── live-tracking.tsx  # Tracking en vivo
│   ├── (auth)/              # Autenticación
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── _layout.tsx          # Layout principal
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── SOSButton.tsx    # Botón de pánico
│   │   ├── MapComponent.tsx # Mapa Leaflet
│   │   └── ...
│   ├── services/            # Servicios API
│   │   ├── api.ts           # Cliente HTTP
│   │   └── emergencyService.ts
│   ├── stores/              # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   └── trackingStore.ts
│   └── types/               # TypeScript types
├── assets/                  # Imágenes, fuentes
├── app.json                 # Configuración Expo
└── package.json
```

---

## Navegación (Expo Router)

La app usa **file-based routing**:

| Ruta Archivo | URL | Descripción |
|--------------|-----|-------------|
| `app/(auth)/login.tsx` | `/login` | Pantalla login |
| `app/(tourist)/(tabs)/explore.tsx` | `/explore` | Explorar tours |
| `app/(tourist)/translator.tsx` | `/translator` | Traductor turista |
| `app/(guide)/live-tracking.tsx` | `/live-tracking` | GPS tracking guía |

---

## Componentes Principales

### SOSButton

Botón de emergencia con slide-to-confirm:

```tsx
<SOSButton 
  onActivate={(location) => {
    // Envía SOS a backend
  }}
/>
```

**Funcionamiento**:
1. Usuario desliza el botón
2. Se obtiene ubicación GPS
3. Se envía POST a `/emergencies/sos`
4. Backend notifica a admins via WebSocket
5. Backend envía SMS via Vonage

---

### MapComponent

Mapa reutilizable con react-native-maps:

```tsx
<MapComponent
  center={{ lat: -13.5, lng: -71.9 }}
  markers={[
    { id: '1', lat: -13.5, lng: -71.9, title: 'Tour', icon: 'guide' }
  ]}
  onMarkerPress={(marker) => console.log(marker)}
/>
```

---

## Servicios

### API Service

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Emergency Service

```typescript
// src/services/emergencyService.ts
export const triggerSOS = async () => {
  const location = await Location.getCurrentPositionAsync();
  
  await api.post('/emergencies/sos', {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    battery: await Battery.getBatteryLevelAsync() * 100,
    message: 'SOS activado desde la app',
  });
};
```

---

## Estado Global (Zustand)

### Auth Store

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    set({ token: response.data.access_token, user: response.data.user });
  },
  logout: () => set({ user: null, token: null }),
}));
```

---

## Funcionalidades por Rol

### Turista

| Feature | Pantalla | Descripción |
|---------|----------|-------------|
| Explorar Tours | `explore.tsx` | Lista/buscar tours disponibles |
| Mapa Cercano | `map.tsx` | Ver tours cerca de mi ubicación |
| Reservar | `tour-detail.tsx` | Detalles y reserva de tour |
| SOS | `safety.tsx` | Botón de emergencia |
| Traductor | `translator.tsx` | Traducción por voz |
| Perfil | `profile.tsx` | Datos personales |

### Guía

| Feature | Pantalla | Descripción |
|---------|----------|-------------|
| Dashboard | `dashboard.tsx` | Resumen del día |
| Mis Tours | `tours.tsx` | Tours asignados |
| Tracking | `live-tracking.tsx` | GPS en tiempo real |
| Traducir | `translate.tsx` | Traductor para clientes |
| Perfil | `profile.tsx` | Datos y verificación |

---

## Permisos Requeridos

Configura en `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Ruta Segura necesita tu ubicación para protegerte durante los tours."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Permitir cámara para verificación de identidad."
        }
      ]
    ]
  }
}
```

---

## Ejecutar la App

### Desarrollo

```bash
cd apps/mobile

# Instalar dependencias
npm install
npx expo install

# Iniciar Metro bundler
npx expo start

# Opciones:
# a - Abrir en Android
# i - Abrir en iOS (solo Mac)
# w - Abrir en web
# Escanear QR - Expo Go en dispositivo físico
```

### Conectar a Backend Local

Si usas dispositivo físico, edita `src/services/api.ts`:

```typescript
// Cambiar localhost por IP de tu PC
const API_URL = 'http://192.168.1.XXX:8000/api/v1';
```

---

## Build para Producción

### Android APK

```bash
npx expo build:android -t apk
```

### Android AAB (Play Store)

```bash
npx expo build:android -t app-bundle
```

### iOS (requiere Mac)

```bash
npx expo build:ios
```

---

## Solución de Problemas

Ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#mobile-app)
