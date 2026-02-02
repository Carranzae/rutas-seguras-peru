# 🗺️ Roadmap y Mejoras Futuras

Guía para desarrolladores sobre funcionalidades pendientes, mejoras sugeridas y próximos pasos.

---

## 📊 Estado Actual del Proyecto

| Módulo | Estado | Completitud |
|--------|--------|-------------|
| Backend API | ✅ Funcional | 85% |
| Super Admin | ✅ Funcional | 80% |
| Agency Web | ⚠️ Mock Data | 40% |
| Mobile App | ⚠️ Parcial | 60% |
| Integraciones | ✅ Configuradas | 70% |

---

## 🔴 Crítico - Implementar Primero

### 1. Agency Web - Conectar a API Real

**Ubicación**: `apps/agency-web/src/app/page.tsx`

**Problema**: Dashboard usa datos mock hardcodeados.

**Solución**:
```typescript
// Reemplazar datos mock con llamadas API
const fetchData = async () => {
  const token = localStorage.getItem('agency_token');
  const response = await fetch('/api/v1/tours?agency_id=MY_AGENCY', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
};
```

**Archivos a modificar**:
- `apps/agency-web/src/app/page.tsx`
- `apps/agency-web/src/services/api.ts` (crear)
- `apps/agency-web/src/stores/authStore.ts` (crear)

---

### 2. Mobile - Completar Flujo de Registro

**Problema**: El registro no conecta con el backend correctamente.

**Archivos**:
- `apps/mobile/app/(auth)/register.tsx`
- `apps/mobile/src/services/api.ts`

**Tareas**:
- [ ] Validar formulario completo
- [ ] Conectar POST `/auth/register`
- [ ] Manejar errores (email duplicado, etc.)
- [ ] Agregar selección de rol (turista/guía)

---

### 3. Backend - Endpoints de Reservas

**Problema**: Endpoints de booking existen pero no están completos.

**Archivo**: `backend/app/routers/bookings.py`

**Tareas**:
- [ ] `POST /bookings` - Crear reserva
- [ ] `GET /bookings/my` - Mis reservas (turista)
- [ ] `GET /tours/{id}/bookings` - Reservas por tour (guía/agencia)
- [ ] `POST /bookings/{id}/cancel` - Cancelar reserva
- [ ] Integrar con Izipay para pago

---

## 🟡 Importante - Mejoras de UX

### 4. Push Notifications

**Estado**: Firebase configurado pero no implementado.

**Tareas**:
- [ ] Registrar device token al login móvil
- [ ] Endpoint `POST /users/me/device-token`
- [ ] Enviar push en emergencias SOS
- [ ] Notificar nuevas reservas a guías

**Archivos**:
```
backend/app/services/firebase_service.py  // Existe, revisar
apps/mobile/src/services/pushNotifications.ts  // Crear
```

---

### 5. Subida de Imágenes

**Problema**: Tours y perfiles no pueden subir imágenes.

**Solución propuesta**:

1. Backend - Crear endpoint de upload:
```python
# backend/app/routers/uploads.py
@router.post("/uploads/image")
async def upload_image(file: UploadFile):
    # Guardar en S3 o localmente
    # Retornar URL
```

2. Frontend - Componente de upload:
```typescript
// Usar react-dropzone o similar
```

**Considerar**:
- Límite de tamaño (5MB)
- Solo formatos imagen (jpg, png, webp)
- Generar thumbnails
- CDN para servir imágenes

---

### 6. Sistema de Calificaciones

**Estado**: Modelo existe, endpoints faltan.

**Tareas**:
- [ ] `POST /tours/{id}/reviews` - Dejar reseña
- [ ] `GET /tours/{id}/reviews` - Ver reseñas
- [ ] `GET /guides/{id}/rating` - Rating promedio guía
- [ ] UI en mobile para calificar después del tour

---

## 🟢 Mejoras Opcionales

### 7. Modo Offline Mobile

**Descripción**: Permitir uso básico sin conexión.

**Implementación**:
```typescript
// Usar @react-native-async-storage/async-storage
// Sincronizar cuando haya conexión
```

**Features offline**:
- Ver tours descargados
- Guardar ubicación localmente
- Sincronizar al reconectar

---

### 8. Multi-idioma (i18n)

**Estado**: Preparado pero no implementado.

**Idiomas objetivo**:
- Español (principal)
- Inglés
- Portugués
- Francés

**Implementación**:
```bash
# Next.js - next-intl
npm install next-intl

# React Native - i18next
npm install i18next react-i18next
```

---

### 9. Dashboard Analytics Avanzado

**Mejoras**:
- Gráficos de tendencias (Chart.js/Recharts)
- Exportar reportes PDF/Excel
- Comparativas mensuales
- Heatmap de ubicaciones populares

---

### 10. Chat en Tiempo Real

**Descripción**: Chat entre turista y guía durante tour.

**Tecnología**: WebSocket existente + nuevo endpoint

```python
# backend/app/routers/websocket.py
@router.websocket("/ws/chat/{tour_id}")
async def chat_websocket(websocket: WebSocket, tour_id: str):
    # Broadcast messages to tour participants
```

---

## 🛠️ Mejoras Técnicas

### 11. Testing

**Estado actual**: Sin tests automatizados.

**Tareas**:
- [ ] Backend: Pytest + fixtures
- [ ] Frontend: Jest + React Testing Library
- [ ] E2E: Playwright o Cypress
- [ ] CI/CD: GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run backend tests
        run: cd backend && pytest
```

---

### 12. Logging y Monitoreo

**Implementar**:
- [ ] Sentry para errores
- [ ] Métricas con Prometheus
- [ ] Dashboards en Grafana
- [ ] Alertas automáticas

---

### 13. Seguridad

**Auditoría pendiente**:
- [ ] Sanitizar inputs SQL injection
- [ ] Rate limiting por IP
- [ ] Validar tokens expired en cada request
- [ ] Encriptar datos sensibles en DB
- [ ] Audit log de acciones admin

---

### 14. Performance

**Optimizaciones**:
- [ ] Caché Redis para consultas frecuentes
- [ ] Paginación en todos los endpoints
- [ ] Lazy loading de imágenes
- [ ] Compresión gzip en nginx

---

## 📋 Orden de Prioridad Sugerido

### Sprint 1 (2 semanas)
1. Conectar Agency Web a API real
2. Completar flujo registro mobile
3. Endpoints de reservas

### Sprint 2 (2 semanas)
4. Push notifications
5. Subida de imágenes
6. Sistema de calificaciones

### Sprint 3 (2 semanas)
7. Testing básico
8. Logging y monitoreo
9. Mejoras de seguridad

### Sprint 4+ (continuo)
10. Multi-idioma
11. Chat en tiempo real
12. Modo offline
13. Analytics avanzado

---

## 🤝 Cómo Contribuir

1. **Fork** el repositorio
2. Crear branch: `git checkout -b feature/nombre-feature`
3. Hacer commits descriptivos
4. Crear **Pull Request** con descripción detallada
5. Esperar revisión de código

### Convenciones de Código

- **Python**: PEP 8, type hints
- **TypeScript**: ESLint + Prettier
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`)
- **Branches**: `feature/`, `fix/`, `refactor/`

---

## 📞 Contacto

Para dudas técnicas, crear un **Issue** en GitHub con:
- Descripción del problema/feature
- Pasos para reproducir (si es bug)
- Screenshots si aplica

---

*Documento vivo - Actualizar conforme se complete cada item*
