# Agency Control Center

Centro de control web para agencias de viajes - Ruta Segura Perú

## Stack Tecnológico

- **Next.js 16** - App Router + Server Components
- **TypeScript** - Strict Mode
- **Tailwind CSS 4** - Styling
- **Shadcn/UI** - Component Library (Radix UI)
- **TanStack Query** - Server State
- **Leaflet** - Mapas interactivos
- **Socket.io** - WebSocket para alertas SOS
- **Zustand** - Client State

## Inicio Rápido

```bash
# Desde la raíz del proyecto
cd apps/agency-web
npm install
npm run dev
```

O ejecutar: `START_AGENCY.bat`

El panel estará disponible en: **http://localhost:3001**

## Módulos

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/` | KPIs, mapa GPS, alertas SOS |
| Tours | `/tours` | Catálogo digital CRUD |
| Guías | `/guides` | Directorio + validación biométrica |
| Wallet | `/wallet` | Escrow + retiros bancarios |
| Login | `/login` | Autenticación JWT |

## Variables de Entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```
