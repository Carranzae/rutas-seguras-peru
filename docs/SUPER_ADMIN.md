# 🖥️ Super Admin Dashboard

## Visión General

El **Super Admin Dashboard** es el centro de comando para operadores de la plataforma Ruta Segura Perú. Construido con **Next.js 14** (App Router).

---

## Acceso

| Campo | Valor |
|-------|-------|
| URL | http://localhost:3000 |
| Email | admin@rutaseguraperu.com |
| Password | Admin123! |

---

## Estructura de Directorios

```
apps/super-admin/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Dashboard principal (Command Center)
│   │   ├── login/           # Autenticación
│   │   ├── (dashboard)/     # Grupo de rutas dashboard
│   │   │   ├── verifications/  # Deep Scan GhosCloud
│   │   │   ├── tours/       
│   │   │   ├── bookings/
│   │   │   └── emergencies/
│   │   ├── agencies/        # Gestión de agencias
│   │   ├── guides/          # Gestión de guías
│   │   ├── users/           # Gestión de usuarios
│   │   ├── payments/        # Transacciones
│   │   ├── analytics/       # Reportes
│   │   ├── tracking/        # Mapa en vivo
│   │   └── settings/        # Configuración
│   ├── components/
│   │   ├── command/         # Componentes del Command Center
│   │   │   ├── RadarDisplay.tsx
│   │   │   ├── TelemetryFeed.tsx
│   │   │   ├── HoloKPICards.tsx
│   │   │   └── ActivityStream.tsx
│   │   ├── map/
│   │   │   └── CommandMap.tsx
│   │   └── ui/              # Componentes UI base
│   ├── services/
│   │   └── api.ts           # Cliente API
│   └── lib/
│       └── api.ts           # Configuración API
├── public/
└── next.config.js
```

---

## Módulos Disponibles

### 🎛️ Command Center (Dashboard Principal)

Pantalla principal con:
- **KPI Cards**: Usuarios, tours, ingresos, emergencias
- **Radar Display**: Visualización de dispositivos activos
- **Command Map**: Mapa en tiempo real con tracking GPS
- **Activity Stream**: Actividad reciente
- **Quick Actions**: Accesos directos

### 🔍 Deep Scan (Verificaciones)

**Ruta**: `/verifications`

Módulo de verificación de identidad con GhosCloud:

| Función | Descripción |
|---------|-------------|
| DNI Físico | Consulta RENIEC |
| DNI Virtual | Consulta digital |
| Nombre | Búsqueda por nombre completo |
| Teléfono | Búsqueda por número o DNI |
| Antecedentes | Policiales, Penales, Judiciales |

### 🏢 Agencias

**Ruta**: `/agencies`

- Listar agencias registradas
- Ver estado de verificación
- Aprobar/rechazar solicitudes
- Ver tours y guías asociados

### 🎒 Guías

**Ruta**: `/guides`

- Lista de guías registrados
- Estado DIRCETUR
- Verificación biométrica
- Historial de tours

### 👥 Usuarios

**Ruta**: `/users`

- Gestión de todos los usuarios
- Filtrar por rol (turista, guía, agencia, admin)
- Activar/desactivar cuentas

### 💳 Pagos

**Ruta**: `/payments`

- Transacciones de la plataforma
- Comisiones generadas
- Estado de pagos

### 📍 Tracking

**Ruta**: `/tracking`

- Mapa en tiempo real
- Ubicación de guías y turistas
- Historial de rutas

### 📊 Analytics

**Ruta**: `/analytics`

- Reportes de ingresos
- Métricas de uso
- Gráficos de tendencias

---

## WebSocket en Tiempo Real

El dashboard se conecta via WebSocket para recibir:

```typescript
// Conexión WebSocket
const wsUrl = `ws://localhost:8000/api/v1/ws/admin?token=${token}`;
const ws = new WebSocket(wsUrl);

// Mensajes recibidos
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  switch(msg.type) {
    case 'LOCATION_UPDATE':    // GPS de usuarios
    case 'ALERT':              // Emergencias SOS
    case 'STATS':              // Estadísticas
  }
};
```

---

## Componentes Clave

### HoloKPICards

Muestra métricas principales:

```tsx
<HoloKPICards 
  data={{
    total_users: 1234,
    total_agencies: 45,
    total_guides: 124,
    total_tours: 567,
    total_revenue: 12345.67,
    active_emergencies: 0,
  }}
/>
```

### CommandMap

Mapa Leaflet con tracking en vivo:

```tsx
<CommandMap 
  locations={activeLocations}
  onUserSelect={(user) => showUserDetails(user)}
  style="dark" // dark | satellite | terrain
/>
```

### RadarDisplay

Visualización tipo radar de dispositivos:

```tsx
<RadarDisplay 
  devices={[
    { id: '1', type: 'guide', lat: -13.5, lng: -71.9 },
    { id: '2', type: 'tourist', lat: -13.4, lng: -71.8 },
  ]}
/>
```

---

## Quick Actions

Botones de acción rápida en el dashboard:

| Botón | Acción |
|-------|--------|
| 🏢 Verificar Agencia | Va a `/agencies?status=pending` |
| 🎒 Verificar Guía | Va a `/guides?status=pending` |
| 👥 Gestionar Turistas | Va a `/users/tourists` |
| 🔔 Enviar Alertas | Notificación masiva |
| 📍 Ver Tracking | Scroll a mapa |
| 💳 Ver Pagos | Va a `/payments` |
| 🔍 Deep Scan | Va a `/verifications` |

---

## Estilos

El dashboard usa un tema **futurista/cyberpunk** con:

- Fondo oscuro: `#020617`
- Color primario: `#00f2ff` (cyan)
- Color alerta: `#f59e0b` (amber)
- Color peligro: `#ef4444` (red)
- Tipografía monospace: `font-telemetry`

---

## Ejecutar

```bash
cd apps/super-admin
npm install
npm run dev
# Abre http://localhost:3000
```

---

## Variables de Entorno

Crear `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
