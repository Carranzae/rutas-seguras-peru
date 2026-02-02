# 📡 API Reference

Referencia completa de todos los endpoints de la API de Ruta Segura Perú.

**Base URL**: `http://localhost:8000/api/v1`

---

## Autenticación

Todos los endpoints (excepto login/register) requieren header:
```
Authorization: Bearer <jwt_token>
```

---

## Auth (`/auth`)

### POST `/auth/register`
Registrar nuevo usuario.

**Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "Nombre Completo",
  "phone": "+51999999999",
  "role": "tourist"  // tourist, guide, agency_admin
}
```

**Response** `201`:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Nombre Completo",
  "role": "tourist",
  "is_active": true,
  "is_verified": false
}
```

---

### POST `/auth/login`
Autenticación con email y password.

**Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** `200`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "tourist"
  }
}
```

**Errores**:
- `401`: Credenciales inválidas
- `429`: Rate limit (5 intentos/min)

---

### GET `/auth/me`
Obtener perfil del usuario actual.

**Headers**: `Authorization: Bearer <token>`

**Response** `200`:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Nombre Completo",
  "phone": "+51999999999",
  "role": "tourist",
  "is_active": true,
  "is_verified": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### POST `/auth/refresh`
Renovar token de acceso.

**Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### POST `/auth/logout`
Invalidar token actual.

**Response** `204`: No content

---

## Admin (`/admin`)

*Requiere rol: `super_admin`*

### GET `/admin/dashboard/stats`
Estadísticas del dashboard.

**Response** `200`:
```json
{
  "total_users": 1234,
  "total_agencies": 45,
  "total_guides": 124,
  "total_tours": 567,
  "total_emergencies": 89,
  "total_revenue": 125000.00,
  "platform_earnings": 18750.00,
  "pending_verifications": 5,
  "active_emergencies": 1
}
```

---

### GET `/admin/users`
Listar usuarios con paginación.

**Query Params**:
- `page` (int, default: 1)
- `role` (string, optional): tourist, guide, agency_admin
- `search` (string, optional)

---

## Tours (`/tours`)

### GET `/tours`
Listar tours disponibles.

**Query Params**:
- `category` (string): adventure, cultural, nature
- `difficulty` (string): easy, moderate, hard
- `min_price`, `max_price` (float)
- `page`, `per_page` (int)

---

### GET `/tours/{id}`
Detalle de un tour.

---

### POST `/tours`
Crear tour (agency_admin).

**Body**:
```json
{
  "name": "Machu Picchu Full Day",
  "description": "Visita guiada al santuario",
  "price": 450.00,
  "duration_hours": 8,
  "max_participants": 15,
  "category": "cultural",
  "difficulty": "moderate",
  "scheduled_start": "2024-06-15T08:00:00Z"
}
```

---

### GET `/tours/search`
Buscar tours cercanos.

**Query Params**:
- `lat` (float): Latitud
- `lng` (float): Longitud
- `radius` (int, km): Radio de búsqueda

---

## Emergencies (`/emergencies`)

### POST `/emergencies/sos`
Activar emergencia SOS.

**Body**:
```json
{
  "latitude": -13.5319,
  "longitude": -71.9675,
  "battery_level": 15,
  "message": "Necesito ayuda urgente",
  "tour_id": "uuid"  // opcional
}
```

**Response** `201`:
```json
{
  "id": "uuid",
  "status": "active",
  "severity": "critical",
  "message": "SOS recibido. Ayuda en camino.",
  "created_at": "2024-01-01T12:00:00Z"
}
```

---

### GET `/emergencies/active`
Listar emergencias activas.

---

### POST `/emergencies/{id}/respond`
Marcar emergencia como "respondiendo".

---

### POST `/emergencies/{id}/resolve`
Resolver emergencia.

**Body**:
```json
{
  "resolution_notes": "Usuario asistido, sin lesiones."
}
```

---

## Verifications (`/verifications`)

### GET `/verifications/pending`
Verificaciones pendientes de revisión.

**Response** `200`:
```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_name": "Juan Pérez",
      "user_email": "juan@test.com",
      "verification_type": "biometric",
      "status": "pending",
      "selfie_url": "https://...",
      "document_url": "https://...",
      "license_number": "DIRCETUR-12345",
      "liveness_score": 95,
      "submitted_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "per_page": 20
}
```

---

### POST `/verifications/{id}/approve`
Aprobar verificación.

---

### POST `/verifications/{id}/reject`
Rechazar verificación.

**Body**:
```json
{
  "reason": "Documento ilegible, por favor vuelva a subir."
}
```

---

### POST `/verifications/check-dni-physical`
Consulta DNI físico (GhosCloud).

**Body**:
```json
{
  "query": "12345678"
}
```

**Response** `200`:
```json
{
  "dni": "12345678",
  "name": "JUAN CARLOS PÉREZ GARCÍA",
  "birth_date": "1990-05-15",
  "address": "AV. PRINCIPAL 123"
}
```

---

### POST `/verifications/check-background`
Verificación de antecedentes completa.

**Response** `200`:
```json
{
  "summary": {
    "has_police_records": false,
    "has_penal_records": false,
    "has_judicial_records": false,
    "risk_level": "LOW"
  },
  "details": {
    "police": {"status": "Clean"},
    "penal": {"status": "Clean"},
    "judicial": {"status": "Clean"}
  }
}
```

---

## WebSocket (`/ws`)

### `/ws/tracking/{user_type}`
Tracking GPS en tiempo real.

**URL**: `ws://localhost:8000/api/v1/ws/tracking/guide?token=JWT&tour_id=UUID`

**Enviar**:
```json
{
  "type": "LOCATION",
  "latitude": -13.5319,
  "longitude": -71.9675,
  "accuracy": 5.0,
  "speed": 3.2,
  "battery": 78
}
```

**Recibir**:
```json
{
  "type": "ACK",
  "timestamp": "2024-01-01T12:00:00Z",
  "analysis": {
    "risk_score": 15,
    "risk_level": "LOW"
  }
}
```

---

### `/ws/admin`
Conexión admin para recibir updates.

**URL**: `ws://localhost:8000/api/v1/ws/admin?token=JWT`

**Recibir**:
```json
{
  "type": "LOCATION_UPDATE",
  "data": {
    "user_id": "uuid",
    "user_type": "guide",
    "latitude": -13.5319,
    "longitude": -71.9675,
    "battery": 78
  }
}
```

---

## Códigos de Error

| Código | Significado |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido/expirado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no existe |
| 409 | Conflict - Duplicado (email, etc.) |
| 422 | Validation Error - Campos faltantes |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Server Error |

---

## Rate Limits

| Endpoint | Límite |
|----------|--------|
| `/auth/login` | 5 req/min |
| General | 60 req/min |
