# 📥 Guía de Instalación

Esta guía detalla cómo instalar y configurar el proyecto Ruta Segura Perú desde cero.

## Requisitos Previos

### Software Requerido

| Software | Versión Mínima | Descarga |
|----------|----------------|----------|
| Node.js | 18.x | https://nodejs.org |
| Python | 3.11+ | https://python.org |
| PostgreSQL | 15+ | https://postgresql.org |
| Redis | 7+ | https://redis.io |
| Git | 2.x | https://git-scm.com |

### Para desarrollo móvil
| Software | Uso |
|----------|-----|
| Expo CLI | `npm install -g expo-cli` |
| Android Studio | Emulador Android |
| Xcode | Emulador iOS (solo Mac) |

---

## Paso 1: Clonar el Repositorio

```bash
git clone <repository-url>
cd ruta-segura-peru
```

---

## Paso 2: Instalar Dependencias del Monorepo

```bash
# En la raíz del proyecto
npm install
```

---

## Paso 3: Configurar PostgreSQL

### 3.1 Crear Base de Datos

```sql
-- Conectar a PostgreSQL como admin
psql -U postgres

-- Crear base de datos
CREATE DATABASE ruta_segura_peru;

-- Crear usuario (opcional)
CREATE USER rutasegura WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE ruta_segura_peru TO rutasegura;

-- Habilitar extensión PostGIS (para geolocalización)
\c ruta_segura_peru
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

### 3.2 Verificar Conexión

```bash
psql -U postgres -d ruta_segura_peru -c "SELECT PostGIS_Version();"
```

---

## Paso 4: Configurar Backend

### 4.1 Crear Entorno Virtual Python

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 4.2 Instalar Dependencias Python

```bash
pip install -r requirements.txt
```

### 4.3 Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
```

**Variables críticas en `.env`:**

```env
# Base de Datos
DATABASE_URL=postgresql+asyncpg://postgres:123@localhost:5432/ruta_segura_peru

# Seguridad (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET_KEY=tu-clave-secreta-muy-larga-y-segura

# Redis
REDIS_URL=redis://localhost:6379/0

# APIs Externas (opcional para desarrollo)
ANTHROPIC_API_KEY=sk-ant-...
GHOSCLOUD_API_URL=https://api.ghoscloud.org/v1
GHOSCLOUD_TOKEN_DNI=tu-token
VONAGE_API_KEY=tu-key
VONAGE_API_SECRET=tu-secret
```

### 4.4 Crear Tablas en Base de Datos

```bash
# El backend crea las tablas automáticamente al iniciar
python -m uvicorn app.main:app --reload

# O ejecutar seed data para datos de prueba
python seed_data.py
```

---

## Paso 5: Configurar Super Admin

```bash
cd apps/super-admin

# Instalar dependencias
npm install

# Crear archivo de variables (opcional)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

---

## Paso 6: Configurar Agency Web

```bash
cd apps/agency-web

# Instalar dependencias
npm install
```

---

## Paso 7: Configurar Mobile App

```bash
cd apps/mobile

# Instalar dependencias
npm install

# Instalar dependencias nativas de Expo
npx expo install
```

---

## Paso 8: Iniciar Servicios

### Opción A: Scripts Batch (Windows)

Doble click en los archivos `.bat` en la raíz:

| Script | Inicia |
|--------|--------|
| `START_ALL.bat` | Todos los servicios |
| `START_BACKEND.bat` | Solo Backend |
| `START_SUPERADMIN.bat` | Solo Super Admin |
| `START_MOBILEAPP.bat` | Solo Mobile |
| `START_AGENCY.bat` | Solo Agency Dashboard |

### Opción B: Manual (Cualquier OS)

```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate  # Windows
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Super Admin
cd apps/super-admin
npm run dev

# Terminal 3 - Mobile
cd apps/mobile
npx expo start

# Terminal 4 - Agency (opcional)
cd apps/agency-web
npm run dev -- --port 3001
```

---

## Paso 9: Verificar Instalación

### Backend
- URL: http://localhost:8000
- Docs: http://localhost:8000/docs (Swagger)
- ReDoc: http://localhost:8000/redoc

### Super Admin
- URL: http://localhost:3000
- Login: `admin@rutaseguraperu.com` / `Admin123!`

### Mobile
- Escanear QR con Expo Go
- O presionar `a` para Android / `i` para iOS

---

## Paso 10: Crear Usuario Admin (si no existe)

```bash
cd backend
python ensure_admin.py
```

Esto crea/actualiza:
- Email: `admin@rutaseguraperu.com`
- Password: `Admin123!`
- Role: `super_admin`

---

## Estructura de Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| Backend API | 8000 | http://localhost:8000 |
| Super Admin | 3000 | http://localhost:3000 |
| Agency Web | 3001 | http://localhost:3001 |
| Mobile Expo | 8081 | exp://localhost:8081 |
| PostgreSQL | 5432 | localhost |
| Redis | 6379 | localhost |

---

## Solución de Problemas Comunes

Ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) para errores comunes y soluciones.
