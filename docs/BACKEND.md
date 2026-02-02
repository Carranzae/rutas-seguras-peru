# 🐍 Backend API (FastAPI)

## Visión General

El backend está construido con **FastAPI** (Python 3.11+) y proporciona:

- API RESTful con documentación automática
- WebSockets para tiempo real
- Autenticación JWT
- Integración con PostgreSQL + PostGIS

---

## Estructura de Directorios

```
backend/
├── app/
│   ├── main.py              # Punto de entrada
│   ├── database.py          # Conexión AsyncSQLAlchemy
│   ├── config.py            # Configuración desde .env
│   ├── core/
│   │   ├── security.py      # JWT, hashing
│   │   ├── dependencies.py  # Inyección de dependencias
│   │   ├── exceptions.py    # Excepciones HTTP
│   │   └── websocket_manager.py  # Gestión WS
│   ├── models/              # Modelos SQLAlchemy
│   │   ├── user.py          # User, UserRole
│   │   ├── agency.py        # Agency
│   │   ├── guide.py         # Guide
│   │   ├── tour.py          # Tour
│   │   ├── booking.py       # Booking
│   │   ├── payment.py       # Payment
│   │   └── emergency.py     # Emergency, SOS
│   ├── schemas/             # Schemas Pydantic
│   │   ├── auth.py          # Login, Register
│   │   ├── user.py          # UserResponse
│   │   └── ...
│   ├── routers/             # Endpoints API
│   │   ├── auth.py          # /auth/*
│   │   ├── admin.py         # /admin/*
│   │   ├── tours.py         # /tours/*
│   │   ├── emergencies.py   # /emergencies/*
│   │   ├── tracking.py      # /tracking/*
│   │   ├── websocket.py     # /ws/*
│   │   ├── identity_verification.py  # /verifications/*
│   │   └── izipay.py        # /payments/izipay/*
│   └── services/            # Lógica de negocio
│       ├── auth_service.py
│       ├── ghoscloud_service.py
│       ├── vonage_service.py
│       └── ai_safety_service.py
├── requirements.txt         # Dependencias Python
├── seed_data.py             # Script para datos de prueba
├── ensure_admin.py          # Script para crear admin
└── .env                     # Variables de entorno
```

---

## Modelos de Base de Datos

### User (usuarios)
```python
class User:
    id: UUID
    email: str (unique)
    hashed_password: str
    full_name: str
    phone: str
    role: Enum[tourist, guide, agency_admin, super_admin]
    is_active: bool
    is_verified: bool
    language: str
    created_at: datetime
```

### Agency (agencias)
```python
class Agency:
    id: UUID
    owner_id: FK(User)
    business_name: str
    ruc: str (11 dígitos)
    email: str
    phone: str
    address: str
    city: str
    region: str
    verification_status: Enum[pending, verified, rejected]
    is_active: bool
```

### Guide (guías)
```python
class Guide:
    id: UUID
    user_id: FK(User)
    agency_id: FK(Agency)
    dircetur_id: str  # Licencia DIRCETUR
    specialty: str
    languages: JSON[]
    experience_years: int
    verification_status: Enum[pending, verified, rejected]
    biometric_verified: bool
```

### Tour
```python
class Tour:
    id: UUID
    agency_id: FK(Agency)
    guide_id: FK(Guide)
    name: str
    description: str
    price: Decimal
    duration_hours: int
    max_participants: int
    category: str
    difficulty: Enum[easy, moderate, hard]
    status: Enum[scheduled, in_progress, completed, cancelled]
    scheduled_start: datetime
```

### Emergency
```python
class Emergency:
    id: UUID
    triggered_by_id: FK(User)
    tour_id: FK(Tour, nullable)
    severity: Enum[low, medium, high, critical]
    status: Enum[active, responding, resolved]
    description: str
    latitude: float
    longitude: float
    battery_level: int
    created_at: datetime
    resolved_at: datetime
```

---

## Endpoints Principales

### Autenticación (`/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar usuario |
| POST | `/auth/login` | Login, devuelve JWT |
| POST | `/auth/refresh` | Renovar token |
| GET | `/auth/me` | Perfil del usuario actual |
| POST | `/auth/logout` | Invalidar token |

### Admin (`/admin`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/dashboard/stats` | KPIs del dashboard |
| GET | `/admin/users` | Listar usuarios |
| GET | `/admin/verifications/pending` | Verificaciones pendientes |

### Emergencias (`/emergencies`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/emergencies/sos` | Activar SOS |
| GET | `/emergencies/active` | Emergencias activas |
| POST | `/emergencies/{id}/respond` | Responder emergencia |
| POST | `/emergencies/{id}/resolve` | Resolver emergencia |

### Verificaciones (`/verifications`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/verifications/pending` | Pendientes de review |
| POST | `/verifications/{id}/approve` | Aprobar |
| POST | `/verifications/{id}/reject` | Rechazar |
| POST | `/verifications/check-dni-physical` | GhosCloud DNI físico |
| POST | `/verifications/check-dni-virtual` | GhosCloud DNI virtual |
| POST | `/verifications/check-name` | GhosCloud por nombre |
| POST | `/verifications/check-phone` | GhosCloud por teléfono |
| POST | `/verifications/check-background` | GhosCloud antecedentes |

---

## Servicios

### GhosCloud Service
```python
from app.services.ghoscloud_service import ghoscloud_service

# Verificar DNI físico
result = await ghoscloud_service.check_dni_physical("12345678")

# Verificar antecedentes
result = await ghoscloud_service.check_background_all("12345678")
# Retorna: {summary: {risk_level: "LOW"}, details: {police, penal, judicial}}
```

### AI Safety Service
```python
from app.services.ai_safety_service import AISafetyService

ai = AISafetyService()
analysis = await ai.analyze_situation(
    latitude=-13.5,
    longitude=-71.9,
    altitude=3400,
    battery=15,
    context="Usuario cerca de precipicio"
)
# Retorna: risk_score, recommendations, alerts
```

---

## Ejecutar Backend

```bash
cd backend

# Activar entorno virtual
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Desarrollo
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Producción
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

---

## Testing

```bash
# Ejecutar tests
pytest

# Con coverage
pytest --cov=app --cov-report=html
```

---

## Variables de Entorno Críticas

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | ✅ | URL de PostgreSQL |
| `JWT_SECRET_KEY` | ✅ | Clave para firmar tokens |
| `REDIS_URL` | ❓ | Para blacklist de tokens |
| `ANTHROPIC_API_KEY` | ❓ | AI Safety Analysis |
| `GHOSCLOUD_TOKEN_*` | ❓ | Verificación identidad |
| `VONAGE_API_KEY` | ❓ | SMS emergencias |
