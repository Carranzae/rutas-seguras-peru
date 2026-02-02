# 🔧 Solución de Problemas

Guía para resolver errores comunes en Ruta Segura Perú.

---

## Backend

### Error: `Cannot import 'get_current_user' from 'app.core.security'`

**Causa**: Import incorrecto en algún router.

**Solución**:
```python
# ❌ Incorrecto
from app.core.security import get_current_user, require_roles

# ✅ Correcto  
from app.core.dependencies import get_current_user, require_roles
```

---

### Error: `401 Unauthorized` en todas las peticiones

**Causas posibles**:

1. **Token expirado**
   - El token JWT expira en 30 minutos
   - Solución: Hacer login de nuevo

2. **Usuario sin rol correcto**
   ```bash
   cd backend
   python ensure_admin.py
   ```

3. **Token no enviado**
   - Verificar que el frontend envía header `Authorization: Bearer <token>`

---

### Error: `connection refused` a PostgreSQL

**Verificar**:
```bash
# ¿PostgreSQL está corriendo?
pg_isready -h localhost -p 5432

# ¿Base de datos existe?
psql -U postgres -l | grep ruta_segura
```

**Solución**:
```sql
CREATE DATABASE ruta_segura_peru;
```

---

### Error: `ModuleNotFoundError: No module named 'app'`

**Causa**: No está activado el entorno virtual.

**Solución**:
```bash
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

---

## Super Admin

### Error: `WebSocket connection failed` / `closed before established`

**Causa**: URL del WebSocket mal construida (duplicaba `/api/v1`).

**Verificar** en `apps/super-admin/src/app/page.tsx`:
```typescript
// ✅ Correcto
const wsBase = baseUrl.replace('http', 'ws').replace(/\/api\/v1\/?$/, '');
const wsUrl = `${wsBase}/api/v1/ws/admin?token=${token}`;
```

---

### Error: `Cannot find module` al importar componentes

**Causa**: Alias `@/` no configurado.

**Verificar** `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### Dashboard muestra datos "mock" / prototipos

**Causa**: API devuelve 401 por problemas de autenticación.

**Solución**:
1. Verificar que el backend está corriendo
2. Ejecutar `python ensure_admin.py`
3. Hacer logout y login de nuevo

---

## Mobile App

### Error: `Cannot find module '@expo/cli'`

**Solución**:
```bash
cd apps/mobile
rm -rf node_modules
npm install
npx expo install
```

---

### Error: `Network request failed` al conectar con API

**Causas**:

1. **Backend no corriendo**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

2. **IP incorrecta** (si usas dispositivo físico)
   - Editar `apps/mobile/src/services/api.ts`
   - Cambiar `localhost` por la IP de tu PC

3. **CORS bloqueado**
   - Agregar IP a `CORS_ORIGINS` en `.env`

---

### Error: `expo-router` types not found

**Solución**: Ya existe archivo de tipos en `apps/mobile/src/types/expo-router.d.ts`

Si no existe:
```typescript
// apps/mobile/src/types/expo-router.d.ts
declare module 'expo-router' {
  export function useRouter(): { push: (path: string) => void; back: () => void };
  export function useLocalSearchParams<T = Record<string, string>>(): T;
  export const router: { push: (path: string) => void; back: () => void };
}
```

---

## Base de Datos

### Error: `relation "users" does not exist`

**Causa**: Tablas no creadas.

**Solución**:
```bash
cd backend
python -c "from app.database import engine; import asyncio; from app.models.base import Base; asyncio.run(Base.metadata.create_all(engine))"
```

O simplemente iniciar el backend (crea tablas automáticamente):
```bash
python -m uvicorn app.main:app --reload
```

---

### Error: `duplicate key value violates unique constraint`

**Causa**: Intentando insertar email/RUC duplicado.

**Solución**: Verificar que no existan registros previos o limpiar DB:
```sql
-- CUIDADO: Borra todos los datos
TRUNCATE users, agencies, guides, tours RESTART IDENTITY CASCADE;
```

---

## Redis

### Error: `Connection refused` a Redis

**Si no necesitas Redis** (desarrollo):
- El sistema funciona sin Redis, pero tokens logout no se invalidan

**Para instalar Redis en Windows**:
1. Descargar de https://github.com/microsoftarchive/redis/releases
2. O usar Docker: `docker run -d -p 6379:6379 redis`

---

## Integración GhosCloud

### Error: `Missing token for endpoint`

**Causa**: Variables de entorno no configuradas.

**Verificar** `.env`:
```env
GHOSCLOUD_API_URL=https://api.ghoscloud.org/v1
GHOSCLOUD_TOKEN_DNI=tu-token-aqui
GHOSCLOUD_TOKEN_PHONE=tu-token-aqui
GHOSCLOUD_TOKEN_BACKGROUND=tu-token-aqui
```

---

### Error: `External service unavailable`

**Causas**:
1. Token inválido o expirado
2. API de GhosCloud caída
3. Sin conexión a internet

---

## Docker

### Error: `port already in use`

**Solución**:
```bash
# Ver qué usa el puerto
netstat -ano | findstr :8000

# Matar proceso
taskkill /PID <PID> /F
```

---

## Logs

### ¿Dónde ver logs?

| Servicio | Ubicación |
|----------|-----------|
| Backend | Terminal donde corre uvicorn |
| Backend (archivo) | `backend/logs/app.log` |
| Super Admin | Consola del navegador (F12) |
| Mobile | Terminal de Expo |

### Activar logs detallados

En `.env`:
```env
LOG_LEVEL=DEBUG
```

---

## Contacto

Si el problema persiste, crear issue con:
1. Mensaje de error completo
2. Pasos para reproducir
3. Sistema operativo
4. Versiones (Node, Python, PostgreSQL)
