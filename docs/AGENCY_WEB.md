# 🏢 Agency Web Dashboard

## Visión General

Dashboard para **administradores de agencias turísticas**. Permite gestionar tours, guías y operaciones diarias.

---

## Acceso

| Campo | Valor |
|-------|-------|
| URL | http://localhost:3001 |
| Email | agency1@test.com |
| Password | Test123! |

---

## Estructura

```
apps/agency-web/
├── src/
│   ├── app/
│   │   ├── page.tsx         # Dashboard principal
│   │   ├── login/           # Autenticación
│   │   ├── tours/           # Gestión de tours
│   │   │   ├── page.tsx     # Lista de tours
│   │   │   ├── create/      # Crear tour
│   │   │   └── [id]/        # Detalle tour
│   │   ├── guides/          # Mis guías
│   │   ├── bookings/        # Reservas
│   │   └── wallet/          # Billetera/finanzas
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── live-map.tsx # Mapa tracking guías
│   │   └── ui/
│   └── lib/
└── next.config.js
```

---

## Módulos

### 📊 Dashboard

- KPIs: Turistas protegidos, tours activos, ingresos
- Mapa en vivo con ubicación de guías
- Panel de alertas SOS
- Actividad reciente

### 🎒 Tours

- Lista de tours de la agencia
- Crear nuevo tour
- Editar detalles
- Ver reservas por tour

### 👥 Guías

- Lista de guías asignados
- Estado de verificación
- Estadísticas de rendimiento

### 📋 Reservas

- Reservas pendientes
- Confirmadas
- Historial

### 💰 Wallet

- Balance disponible
- Historial de transacciones
- Solicitar retiro

---

## Funcionalidades Clave

### Mapa en Vivo

Muestra la ubicación de guías en tours activos:

```tsx
// components/dashboard/live-map.tsx
<MapContainer center={[-13.5, -71.9]} zoom={7}>
  {guides.map(guide => (
    <Marker 
      key={guide.id}
      position={[guide.lat, guide.lng]}
      icon={guideIcon}
    />
  ))}
</MapContainer>
```

### Panel SOS

Alerta visual cuando hay emergencias activas:

```tsx
{sosAlerts.length > 0 && (
  <Card className="border-destructive sos-pulse">
    <div className="flex items-center gap-4">
      <AlertTriangle className="text-destructive" />
      <div>
        <h3>🚨 ALERTA SOS ACTIVA</h3>
        <p>{sosAlerts[0].tourist} - {sosAlerts[0].tour}</p>
      </div>
      <Button variant="destructive">Responder</Button>
    </div>
  </Card>
)}
```

---

## Diferencias con Super Admin

| Feature | Super Admin | Agency Web |
|---------|-------------|------------|
| Ver todas las agencias | ✅ | ❌ |
| Ver solo mi agencia | ❌ | ✅ |
| Aprobar verificaciones | ✅ | ❌ |
| Gestionar mis tours | ❌ | ✅ |
| Deep Scan GhosCloud | ✅ | ❌ |
| Wallet/Retiros | ❌ | ✅ |

---

## Ejecutar

```bash
cd apps/agency-web
npm install
npm run dev -- --port 3001
# Abre http://localhost:3001
```

---

## Estado Actual

⚠️ Este dashboard actualmente usa **datos mock** para demostración. Para conectar a datos reales:

1. Implementar llamadas API igual que Super Admin
2. Usar los endpoints `/tours`, `/guides`, `/bookings` filtrados por `agency_id`
